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
import { useAuth } from '@clerk/clerk-react';

// Utility: Generate a simple unique ID (could be improved with a package like uuid)
const generateTabId = () => 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

const pileCount = (rows = []) => rows.reduce((n, r) => n + (r.qty ?? 1), 0);
const fmtDate = (s) => { try { return new Date(s).toLocaleString(); } catch { return s || ""; } };

// Nicely show a name (fallback if file has no name)
const prettyName = (payload) =>
  payload?.name || `Imported Deck (${pileCount(payload?.piles?.MAIN)} main / ${pileCount(payload?.piles?.LAND)} land)`;



function Room() {

  const {
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
    pendingSorcery,
    setPendingSorcery,
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
  const previousPositions = useRef({});

const { userId: clerkUserId } = useAuth();

const [lobby, setLobby] = useState(null);           // { phase, choices, ready, usernames }
const [myDecks, setMyDecks] = useState([]);
const [loadingDecks, setLoadingDecks] = useState(false);
const [selectedDeckId, setSelectedDeckId] = useState(null);
const [selectedDeck, setSelectedDeck] = useState(null); // export-shaped payload (name, piles)

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


  // Retrieve the previously assigned player slot (if any)
  useEffect(() => {
    const userAssignments = JSON.parse(localStorage.getItem("userAssignments"));
    const username = localStorage.getItem("username");
    if (userAssignments && username) {
      setUserId(userAssignments[username]);
    }
  }, [userId]);

  // -----------------------
  // WebSocket Setup
  // -----------------------
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1] || 'default';
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${apiHost}/game/${roomId}`);
    wsRef.current = ws;

    let username = localStorage.getItem("username");
    if (!username) {
      // You can replace generateTabId() with your own generate function.
      username = generateTabId();
      localStorage.setItem("username", username);
    }

    ws.onerror = (e) => {
      console.error("[WebSocket Error]", e);
    };

    ws.onclose = (e) => {
      console.warn("[WebSocket Closed]", e);
    };

    ws.onopen = () => {
      // Send our username (unique from localStorage) to the backend.
      const username = localStorage.getItem("username");
      ws.send(JSON.stringify({ username }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Incoming:', data);

      // LOBBY snapshots/errors
      if (data.type === 'lobby') {
        setLobby({ phase: data.phase, choices: data.choices, ready: data.ready, usernames: data.usernames });
        return; // lobby messages don't include board; stop here
      }
      if (data.type === 'lobby_error') {
        notify('red', data.message || 'Deck invalid.');
        return;
      }

      const userAssignments = JSON.parse(localStorage.getItem("userAssignments"));
      const username = localStorage.getItem("username");

      if (data.type === 'init') {
        // If match started, hide lobby
setLobby((prev) => prev ? { ...prev, phase: 'playing' } : prev);

        localStorage.setItem('userAssignments', JSON.stringify(data.user_assignments))
        localStorage.setItem('mana', JSON.stringify(data.mana))
        setUserId(data.user_assignments[username]);
      }


      // Special handling for awaiting-input (e.g. sorcery targeting)
      if (data.type === 'awaiting-deck-tutoring') {
        console.log(data.pos)
        // let activatedCard = data.board[data.pos[0]][data.pos[1]]
        // let activatedId = `card-${activatedCard.id}`
        // let targetCellID = `cell-${data.pos[0]}-${data.pos[1]}`
        // wait until the animation completes before moving on
        // await moveElementOver(activatedId, targetCellID, 300, {
        //   hideSource: true,
        //   positionMode: 'absolute', // ← try this
        //   debug: true
        // });
        setPendingSorcery({ slot: data.slot, card_id: data.card_id, pos: data.pos });

        notify('yellow', `Select a target for ${data.card_id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
        // Store valid target cells (as strings "x-y") to later highlight them
        showValidTutoringTargets(data.valid_tutoring_targets)
        return;
      }

      // Special handling for awaiting-input (e.g. sorcery targeting)
      if (data.type === 'awaiting-input') {
        let activatedCard = data.card;
        // let activatedId = `card-${activatedCard.id}`
        // let targetCellID = `cell-${data.pos[0]}-${data.pos[1]}`
        // wait until the animation completes before moving on
        // await moveElementOver(activatedId, targetCellID, 300, {
        //   hideSource: true,
        //   positionMode: 'absolute',   // if 'fixed' acts weird in your layout
        //   removeSource: 'remove',     // don't bring the original back
        //   debug: true
        // });

        // 2) Optimistically place the card on the board at data.pos
        setBoard(prev => {
          if (!prev) return prev;
          const [x, y] = data.pos;

          // shallow-clone rows to avoid mutating React state
          const next = prev.map(row => row.slice());
          // ensure row clone (defensive)
          next[x] = next[x] ? next[x].slice() : [];

          next[x][y] = activatedCard; // put the card there
          return next;
        });

        setPendingSorcery({ slot: data.slot, card_id: data.card_id, pos: data.pos });
        notify('yellow', `Select a target for ${data.card_id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
        // Store valid target cells (as strings "x-y") to later highlight them
        setHighlightedCells(data.valid_targets.map(([x, y]) => `${x}-${y}`));
        return;
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
        if (data.info?.includes("activated")) {
          // console.log(data.pos, 'pos')
          // let activatedCard = data.board[data.pos[0]][data.pos[1]]
          // let activatedId = `card-${activatedCard.id}`
          // let targetCellID = `cell-${data.pos[0]}-${data.pos[1]}`
          // // wait until the animation completes before moving on
          // await moveElementOver(activatedId, targetCellID, 300, {
          //   hideSource: true,
          //   positionMode: 'absolute', // ← try this
          //   debug: true
          // });
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
        const userAsignments = JSON.parse(localStorage.getItem('userAssignments'));
        const username = localStorage.getItem('username');
        if (data.turn !== userAsignments[username]) {
          notify('green', data.turn === userAsignments[username] ? "Your turn" : "Opponent's turn");
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
  }, []); // Empty dependency so this only runs once on mount

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
      <TutoringTargets setShowTutoringPopup={setShowTutoringPopup} showTutoringPopup={showTutoringPopup} tutoringTargets={tutoringTargets} wsRef={wsRef} />
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
