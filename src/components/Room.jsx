// Room.jsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import '../App.css';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import Board from './Board';
import OpponentHand from './OpponentHand';
import Graveyards from './Graveyards';
import ConfirmationModal from './ConfirmationModal';
import Notifications from './Notifications';
import PleaseRotate from './PleaseRotate';
import OpponentDetail from './OpponentDetail';
import TurnDetail from './TurnDetail';
import Detail from './Detail';
import Sounds from './Sounds';
import TutoringTargets from './TutoringTargets';
import LandDeckPopup from './LandDeckPopup';
import { moveElementOver } from '../util/animations';
import { useAuth, useUser } from '@clerk/clerk-react';



const pileCount = (rows = []) => rows.reduce((n, r) => n + (r.qty ?? 1), 0);
const fmtDate = (s) => { try { return new Date(s).toLocaleString(); } catch { return s || ""; } };

// Nicely show a name (fallback if file has no name)
const prettyName = (payload) =>
  payload?.name || `Imported Deck (${pileCount(payload?.piles?.MAIN)} main / ${pileCount(payload?.piles?.LAND)} land)`;

// quick input helper for now (replace with a nice popup later)
function promptForId(message) {
  // eslint-disable-next-line no-alert
  const val = window.prompt(message || 'Enter card_id');
  if (!val) return null;
  return val.trim();
}



function Room() {

  const {
    interaction,
    setInteraction,
    setStack,
    isLocked,
    isPortrait,
    setNotifications,
    userId,
    setUserId,
    graveyard1,
    setGraveyard1,
    graveyard2,
    setGraveyard2,
    landDeck1,
    setLandDeck1,
    landDeck2,
    setLandDeck2,
    setHand1,
    setHand2,
    setBoard,
    setDeckSizes,
    mana,
    setMana,
    setLandBoard,
    setTurn,
    setSelectedHandIndex,
    setLastSummonedPos,
    setSelected,
    setPendingDiscard,
    gameOver,
    setGameOver,
    setHighlightedCells,
    setMovesLeft,
    apiHost,
    clearHighlights,
    setIsPortrait,
    showTutoringPopup,
    setShowTutoringPopup,
    tutoringTargets,
    setTutoringTargets,
    showLandDeck,
    setShowLandDeck,
    actionsThisTurn,
    setActionsThisTurn
  } = useGame()
  // -----------------------
  // Refs
  // -----------------------
  const wsRef = useRef(null);

  const lastAwaitingKeyRef = useRef(null);

  function awaitingKeyFromInteraction(interaction) {
    if (!interaction?.awaiting) return null;
    // Prefer backend-provided ids if available:
    // const { step_id, owner } = interaction.awaiting;
    // return step_id ? `step:${step_id}` : `${owner}:${JSON.stringify(interaction.awaiting)}`;

    const { owner, awaiting } = interaction;
    // Build a conservative key; include type/kind and constraints:
    return `${owner}:${awaiting.kind}:${JSON.stringify(awaiting?.filters || awaiting?.constraints || awaiting)}`;
  }

  const previousPositions = useRef({});



  const [lobby, setLobby] = useState(null);           // { phase, choices, ready, usernames }
  const [myDecks, setMyDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null); // export-shaped payload (name, piles)
  const { userId: clerkUserId } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();

  // turn Clerk data into a stable, safe "username" for your socket mapping
  const toHandle = (u) => {
    const raw =
      u?.username ||
      u?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      u?.id ||
      null;
    if (!raw) return null;
    return String(raw)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')   // keep it socket/URL safe
      .replace(/^_+|_+$/g, '');
  };

  const [playerName, setPlayerName] = useState(null);

  // Compute once Clerk is ready; no random IDs
  useEffect(() => {
    if (!isLoaded) return;               // wait for Clerk
    if (!isSignedIn) {                   // block anonymous
      setPlayerName(null);
      return;
    }
    const nm = toHandle(user);
    localStorage.setItem('username', nm); // optional; server still gets it from WS
    setPlayerName(nm);
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!playerName) return;
    const raw = localStorage.getItem('userAssignments');
    try {
      const ua = raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : null;
      if (ua && ua[playerName]) setUserId(ua[playerName]);
    } catch {
      localStorage.removeItem('userAssignments');
    }
  }, [playerName]);



  const mySlot = userId;
  const oppSlot = mySlot === '1' ? '2' : '1';

  const sendChooseDeck = (payload) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'choose_deck', deck: payload }));
  };
  const sendReady = () => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'ready' }));
  };

  async function loadDecks() {
    if (!clerkUserId) return;
    setLoadingDecks(true);
    try {
      const res = await fetch(`/api/decks`, { headers: { "X-Clerk-User-Id": clerkUserId } });
      const data = await res.json();
      setMyDecks(Array.isArray(data) ? data : []);
    } finally {
      setLoadingDecks(false);
    }
  }

  async function chooseDeckById(id) {
    if (!clerkUserId) return;
    try {
      const res = await fetch(`/api/decks/${id}`, { headers: { "X-Clerk-User-Id": clerkUserId } });
      if (!res.ok) { throw new Error('Failed to fetch deck'); }
      const deck = await res.json();
      const payload = {
        version: 1,
        name: deck.name,
        description: deck.description || "",
        piles: deck.piles || {}
      };
      setSelectedDeckId(id);
      setSelectedDeck(payload);
      sendChooseDeck(payload);
      notify('green', `Deck selected: ${deck.name}`);
    } catch (e) {
      console.error(e);
      notify('red', 'Could not load deck.');
    }
  }

  useEffect(() => {
    if (clerkUserId) loadDecks();
  }, [clerkUserId]);




  // On Room load, check for an existing username; if none, generate one.



  // -----------------------
  // WebSocket Setup
  // -----------------------
  useEffect(() => {
    if (!playerName) return;
    const pathParts = window.location.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1] || 'default';
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${apiHost}/game/${roomId}`);
    wsRef.current = ws;


    ws.onerror = (e) => {
      console.error("[WebSocket Error]", e);
    };

    ws.onclose = (e) => {
      console.warn("[WebSocket Closed]", e);
    };

    ws.onopen = () => {
      // Send our username (unique from localStorage) to the backend.

      ws.send(JSON.stringify({ username: playerName }));
      console.log("[WS] open, sent username:", playerName);
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Incoming:', data);

      // LOBBY snapshots/errors
      if (data.type === 'lobby') {
        setLobby(prev => {
          // Once we’re in playing, do not let a stray lobby snapshot bring it back.
          if (prev?.phase === 'playing') return prev;
          return { phase: data.phase, choices: data.choices, ready: data.ready, usernames: data.usernames };
        });
        return; // lobby messages don't include board; stop here
      }
      if (data.type === 'lobby_error') {
        notify('red', data.message || 'Deck invalid.');
        return;
      }

      const raw = localStorage.getItem('userAssignments');
      let userAssignments = null;

      if (raw && raw !== 'undefined' && raw !== 'null') {
        try {
          userAssignments = JSON.parse(raw);
        } catch {
          console.warn('Bad userAssignments in localStorage:', raw);
          localStorage.removeItem('userAssignments'); // clean it up
        }
      }
      const username = playerName;

      if (data.type === 'init') {
        if (data.message === 'Match started' || data.phase === 'playing') {
          // Definitive transition: game started. Lock the lobby to playing.
          setLobby({ phase: 'playing', choices: {}, ready: {}, usernames: data.usernames || {} });
        }
        if (data.user_assignments) {
          localStorage.setItem('userAssignments', JSON.stringify(data.user_assignments))
          localStorage.setItem('mana', JSON.stringify(data.mana))
          console.log(data)
          setUserId(data.user_assignments[playerName]);
        }


      }

      // --- New engine state comes with most snapshots ---
      if ('interaction' in data) {
        setInteraction(data.interaction);
        // optional: show a toast when a new step appears
        const awaiting = data.interaction?.awaiting;
        if (awaiting && data.interaction?.owner === userId) {
          const label =
            awaiting.kind === 'discard_from_hand' ? 'Discard a card' :
              awaiting.kind === 'select_board_target' ? 'Select a target on the board' :
                awaiting.kind === 'select_land_target' ? 'Select a land' :
                  awaiting.kind === 'select_deck_card' ? 'Pick a card from your deck' :
                    'Choose…';
          notify('yellow', label);
        }
      }

      if ('stack' in data) setStack(data.stack || []);

      // === New engine messages ===
      if (data.type === 'awaiting-step') {
        const nextInteraction = data.interaction || interaction; // prefer fresh from data
        const key = awaitingKeyFromInteraction(nextInteraction);

        // If we've already handled this exact step, ignore this repeat snapshot
        if (key && key === lastAwaitingKeyRef.current) {
          // Optional: keep highlights fresh but DO NOT send again
          // highlightCellsForAwaiting(nextInteraction.awaiting);
          return;
        }
        lastAwaitingKeyRef.current = key;

        const a = nextInteraction?.awaiting;
        if (!a) return;

        // ✅ From here on, handle the step ONCE
        if (a.kind === 'select_board_target' || a.kind === 'select_land_target') {
          highlightCellsForAwaiting(a);
          notify('yellow', 'Choose a target cell');
        } else if (a.kind === 'discard_from_hand') {
          notify('yellow', 'Discard a card from your hand');
        } else if (a.kind === 'select_deck_card') {
          const id = promptForId('Type the card_id to tutor from your deck:');
          if (id) sendSorceryStep(wsRef, { card_id: id });
        } else if (a.kind === 'select_graveyard_card') {
          const id = promptForId('Type the card_id from your graveyard:');
          if (id) sendSorceryStep(wsRef, { card_id: id });
        }
      }

      if (data.type === 'opponent-waiting') {
        notify('muted', 'Opponent is resolving a sorcery…');
        // nothing else to do; UI stays locked by interaction presence
      }

      if (data.type === 'resolution-complete') {
        notify('green', data.info || 'Sorcery resolved');
        // Highlights/interaction will be cleared by the snapshot fields above
      }

      if (data.type === 'resolution-complete' || (data.interaction && !data.interaction.awaiting)) {
        lastAwaitingKeyRef.current = null;
      }



      if (data.type === 'discard-to-end-turn') {
        notify('yellow', `Discard card from hand to end turn`);
        setPendingDiscard(true);
        return;
      }


      // Sound effects based on info messages
      if (data.success) {
        if (data.info?.includes("summoned")) {

          setLastSummonedPos(data.to ? data.to.join("-") : null);
          // let summonedMonster = data.board[data.to[0]][data.to[1]]
          // let summonedId = `card-${summonedMonster.id}`
          // let targetCellID = `cell-${data.to[0]}-${data.to[1]}`
          // wait until the animation completes before moving on
          // await moveElementOver(summonedId, targetCellID, 300, {
          //   hideSource: true,
          //   positionMode: 'absolute',   // if 'fixed' acts weird in your layout
          //   removeSource: 'remove',     // don't bring the original back
          //   debug: true
          // });
          playSound("spawnSound");

        } else {
          setLastSummonedPos(null);
        }
        if (data.info?.includes("activated") || (data.type === 'awaiting-input') || (data.type === 'awaiting-deck-tutoring')) {
          // console.log(data.pos, 'pos')
          console.log('FLASH')
          // let targetCellID = `cell-${data.pos[0]}-${data.pos[1]}`
          // // wait until the animation completes before moving on
          // await moveElementOver(activatedId, targetCellID, 300, {
          //   hideSource: true,
          //   positionMode: 'absolute', // ← try this
          //   debug: true
          // });
          // 2) Optimistically place the card on the board at data.pos
          // If the server included the card and it has an instance id, pass it.



          playSound("spawnSound");
        }
        if (data.info?.includes("Move successful")) playSound("moveSound");
        if (data.info?.includes("defeated") || data.info?.includes("killed")) playSound("deathSound");
        if (data.info?.includes("attacked directly")) {

          const cardEl = document.getElementById(`card-${data.card.id}`);
          if (!cardEl) return; // Always safe
          const originalTop = parseFloat(cardEl.style.top.slice(0, cardEl.style.top.length - 1)) || 0;

          // Amounts for shifting
          const step = 5;
          const jump = 15;

          let first, second;

          // 👉 Logic based on who is moving
          if (data.turn == userAssignments[username]) {
            first = originalTop + step;     // +5
            second = originalTop - jump;    // -15
          } else {
            first = originalTop - step;     // -5
            second = originalTop + jump;    // +15
          }

          setTimeout(() => {
            cardEl.style.top = `${first}%`;
            setTimeout(() => {
              cardEl.style.top = `${second}%`;
              playSound("deathSound");
              setTimeout(() => {
                cardEl.style.top = `${originalTop}%`;
              }, 300);
            }, 300);
          }, 300);

        }
        if (data.info?.includes("activated") || data.info?.includes("cast")) playSound("spawnSound");
      }


      if (data.board) {
        if (data.to && data.from && data.success) {
          const { from, to } = data;
          const [fromX, fromY] = from;
          const [toX, toY] = to;

          // Step 1: Clone current board and move the card
          setBoard(prev => {
            const temp = JSON.parse(JSON.stringify(prev));
            const movingCard = temp[fromX][fromY];
            temp[fromX][fromY] = null;
            temp[toX][toY] = movingCard;
            return temp;
          });

          // Wait for the transition to finish
          await new Promise(resolve => setTimeout(resolve, 300));

          if (data.board) setBoard(data.board);
          if (data.land_board) setLandBoard(data.land_board);
        } else {
          setBoard(data.board);
        }
      }

      if (data.land_board) setLandBoard(data.land_board);
      if (data.turn) {
        const userAssignments = JSON.parse(localStorage.getItem('userAssignments') || '{}');
        if (playerName && data.turn !== userAssignments[playerName]) {
          notify('green', data.turn === userAssignments[playerName] ? "Your turn" : "Opponent's turn");

        }
        setTurn(data.turn);
      }

      // One-per-turn action flags (per player + "current")
      if (data.actions_this_turn) {
        setActionsThisTurn(data.actions_this_turn);
      }
      if (data.hand1) setHand1(data.hand1);
      if (data.hand2) setHand2(data.hand2);
      if (data.deck_sizes) setDeckSizes(data.deck_sizes);
      if (data.mana) {
        const prevMana = JSON.parse(localStorage.getItem('mana')) || {};

        for (const key in data.mana) {
          const newValue = data.mana[key];
          const oldValue = prevMana[key] ?? 0;
          const difference = newValue - oldValue;

          if (difference !== 0) {
            console.log('found difference');
            const color = difference > 0 ? 'green' : 'red';
            notify(color, `${difference} mana`);
          }
        }

        // Update localStorage with the new mana
        localStorage.setItem('mana', JSON.stringify(data.mana));

        // Update React state
        setMana(data.mana);
      }
      if (data.graveyard) {
        setGraveyard1(data.graveyard['1'] || graveyard1);
        setGraveyard2(data.graveyard['2'] || graveyard2);
      }
      if (data.land_decks) {
        setLandDeck1(data.land_decks['1'] || landDeck1);
        setLandDeck2(data.land_decks['2'] || landDeck2);
      }
      if (data.moves_left !== undefined) setMovesLeft(data.moves_left);


      // Handle game over
      if (data.type === 'game-over') {
        if (data.game_over?.result === 'victory') notify("green", "🏆 Victory! You win!");
        if (data.game_over?.result === 'defeat') notify("red", "💀 You lose!");
        setGameOver(true);
      }

      if (data.info && !data.success) {
        notify('red', data.info);
      }

      clearHighlights();
    };

    return () => {
      ws.close();
    };
  }, [playerName, apiHost, window.location.pathname]); // Empty dependency so this only runs once on mount

  // -----------------------
  // Window Resize: Rotation Prompt
  // -----------------------
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // // -----------------------
  // // GSAP Animation on Card Changes
  // // -----------------------
  // useEffect(() => {
  //   const cardElements = document.querySelectorAll('[id^="card-"]');
  //   const newPositions = {};
  //   cardElements.forEach((el) => {
  //     newPositions[el.id] = el.getBoundingClientRect();
  //   });
  //   Object.keys(newPositions).forEach((id) => {
  //     if (previousPositions.current[id]) {
  //       const oldRect = previousPositions.current[id];
  //       const newRect = newPositions[id];
  //       const dx = oldRect.left - newRect.left;
  //       const dy = oldRect.top - newRect.top;
  //       if (dx || dy) {
  //         const el = document.getElementById(id);
  //         if (!el) return;
  //         const clone = el.cloneNode(true);
  //         clone.style.position = "absolute";
  //         clone.style.width = `${newRect.width}px`;
  //         clone.style.height = `${newRect.height}px`;
  //         clone.style.top = `${oldRect.top}px`;
  //         clone.style.left = `${oldRect.left}px`;
  //         clone.style.zIndex = "9999";
  //         clone.style.pointerEvents = "none";
  //         document.body.RoomendChild(clone);
  //         gsap.to(clone, {
  //           top: newRect.top,
  //           left: newRect.left,
  //           duration: 0.4,
  //           ease: "power2.out",
  //           onComplete: () => {
  //             clone.remove();
  //           },
  //         });
  //       }
  //     }
  //   });
  //   previousPositions.current = newPositions;
  // });

  // -----------------------
  // Document-wide Listeners (Context Menu, Touch)
  // -----------------------
  useEffect(() => {
    const clearSelection = () => {
      setSelected(null);
      setSelectedHandIndex(null);
      clearHighlights();
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      clearSelection();
    };
    let touchTimer;
    const handleTouchStart = () => {
      touchTimer = setTimeout(clearSelection, 600);
    };
    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);


  // Simple notification function (notifications auto-remove after 3 seconds)
  const notify = (color, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, color, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // Play sound from <audio> elements by id
  const playSound = (id) => {
    const audio = document.getElementById(id);
    if (audio) audio.play();
  };

  // -----------------------
  // Event Handlers (End Turn, Cell Clicks, etc.)
  // -----------------------
  const handleEndTurn = () => {
    if (isLocked) return; // locked by interaction
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end-turn', user_id: userId }));
    }
  };

  function showValidTutoringTargets(cards) {
    setTutoringTargets(cards);   // Set the valid tutoring targets (Card objects)
    setShowTutoringPopup(true);          // Open the popup
  }

  // Function to flip a direction string (used in board rendering)
  const flipDirection = (dir) => {
    const flipMap = {
      forward: 'back',
      back: 'forward',
      left: 'right',
      right: 'left',
      'forward-left': 'back-right',
      'forward-right': 'back-left',
      'back-left': 'forward-right',
      'back-right': 'forward-left',
    };
    return flipMap[dir] || dir;
  };


  return (
    <div className='relative flex h-screen w-screen overflow-hidden'>
      {isPortrait && <PleaseRotate />}
      <Notifications />
      <ConfirmationModal />
      <div className="left-sidebar">
        <Graveyards />


        <div className="land-deck-preview" onClick={() => setShowLandDeck(true)}>
          <div className="card-content placeholder-card">

            <div className="hand-card opponent-card" style={{ backgroundColor: "#261a33", height: "8vw" }} >
              <h6 className="userH2" style={{ color: 'gold', textAlign: 'center' }}>Land Deck</h6>
            </div>
            <div className="rules-text" >Click to view</div>
          </div>
        </div>

      </div>
      <div className="main">
        <div className="board-wrRoomer">
          {/* <OpponentHand /> */}
          <Board flipDirection={flipDirection} notify={notify} wsRef={wsRef} />
          {/* <Hand wsRef={wsRef} /> */}
        </div>
      </div>
      <div className="right-sidebar">
        <OpponentDetail />
        <TurnDetail handleEndTurn={handleEndTurn} />
        <Detail />
      </div>
      <OpponentHand />
      {/* <Board flipDirection={flipDirection} notify={notify} wsRef={wsRef} /> */}
      <Hand wsRef={wsRef} />
      <Sounds />
      <LandDeckPopup />
      <TutoringTargets wsRef={wsRef} />
      {lobby?.phase === 'lobby' && (
        <div className="lobby-overlay">
          <div className="lobby-card">
            <div className="lobby-header">
              <div className="lobby-title">Choose Your Deck</div>
              <div className="lobby-subtitle">
                {mySlot ? `You are Player ${mySlot}` : 'Connecting…'}
              </div>
            </div>

            <div className="lobby-body">
              {/* Your decks list */}
              <div className="lobby-section">
                <div className="lobby-section-header">
                  <div className="lobby-section-title">Your Decks</div>
                  <div className="lobby-right-actions">
                    <button onClick={loadDecks} className="btn">Refresh</button>
                    <a href="/builder" className="btn btn-link">Open Deck Builder</a>
                  </div>
                </div>

                {loadingDecks ? (
                  <div className="muted">Loading…</div>
                ) : myDecks.length === 0 ? (
                  <div className="deck-placeholder">
                    No decks yet. Create one in the <a href="/builder">Deck Builder</a>.
                  </div>
                ) : (
                  <div className="deck-grid">
                    {myDecks.map((d) => (
                      <div key={d.id} className={`deck-card ${selectedDeckId === d.id ? 'selected' : ''}`}>
                        <div className="deck-card-head">
                          <div className="deck-card-name">{d.name}</div>
                          {d.is_active && <span className="badge">Active</span>}
                        </div>
                        {d.description && <div className="deck-card-desc">{d.description}</div>}
                        <div className="deck-card-meta">Created: {fmtDate(d.created_at)}</div>
                        <div className="deck-card-actions">
                          <button
                            onClick={() => chooseDeckById(d.id)}
                            className="btn btn-small"
                            disabled={selectedDeckId === d.id}
                            title={selectedDeckId === d.id ? 'Selected' : 'Use this deck'}
                          >
                            {selectedDeckId === d.id ? 'Selected ✓' : 'Use Deck'}
                          </button>
                          <a href={`/builder/${d.id}`} className="btn btn-small btn-secondary">View</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary of selected deck (after fetching) */}
              <div className="lobby-section">
                <div className="lobby-section-title">Selected Deck</div>
                {selectedDeck ? (
                  <div className="deck-summary">
                    <div className="deck-name">{selectedDeck.name}</div>
                    <div>MAIN: {pileCount(selectedDeck?.piles?.MAIN)} cards</div>
                    <div>LAND: {pileCount(selectedDeck?.piles?.LAND)} cards</div>
                    <div className="deck-note">
                      Picking a different deck will unready you server-side.
                    </div>
                  </div>
                ) : (
                  <div className="deck-placeholder">Pick a deck above to proceed.</div>
                )}
              </div>

              {/* Status row */}
              <div className="lobby-status-grid">
                <div className="status-card">
                  <div className="status-title">You</div>
                  <div className="status-line">Deck chosen: {lobby?.choices?.[mySlot] ? '✅' : '❌'}</div>
                  <div className="status-line">Ready: {lobby?.ready?.[mySlot] ? '✅' : '❌'}</div>
                </div>
                <div className="status-card">
                  <div className="status-title">Opponent</div>
                  <div className="status-line">Deck chosen: {lobby?.choices?.[oppSlot] ? '✅' : '❌'}</div>
                  <div className="status-line">Ready: {lobby?.ready?.[oppSlot] ? '✅' : '❌'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="lobby-actions">
                <button
                  onClick={sendReady}
                  disabled={!lobby?.choices?.[mySlot] || lobby?.ready?.[mySlot]}
                  className="btn btn-ready"
                  title={
                    !lobby?.choices?.[mySlot]
                      ? 'Pick a deck first'
                      : (lobby?.ready?.[mySlot] ? 'Already ready' : 'Ready up')
                  }
                >
                  {lobby?.ready?.[mySlot] ? 'Ready ✓' : 'Ready'}
                </button>
              </div>

              <div className="lobby-footnote">
                When both players have chosen a deck and pressed <b>Ready</b>, the match will start automatically.
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default Room;
