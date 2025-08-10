// Room.jsx
import React, { useEffect, useRef } from 'react';
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

// Utility: Generate a simple unique ID (could be improved with a package like uuid)
const generateTabId = () => 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);


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
    setCenterTileControl,
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

      const userAssignments = JSON.parse(localStorage.getItem("userAssignments"));
      const username = localStorage.getItem("username");

      if (data.type === 'init') {
        localStorage.setItem('userAssignments', JSON.stringify(data.user_assignments))
        localStorage.setItem('mana', JSON.stringify(data.mana))
        setUserId(data.user_assignments[username]);
      }


      // Special handling for awaiting-input (e.g. sorcery targeting)
      if (data.type === 'awaiting-deck-tutoring') {
        setPendingSorcery({ slot: data.slot, card_id: data.card_id, pos: data.pos });

        notify('yellow', `Select a target for ${data.card_id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
        // Store valid target cells (as strings "x-y") to later highlight them
        showValidTutoringTargets(data.valid_tutoring_targets)
        return;
      }

      // Special handling for awaiting-input (e.g. sorcery targeting)
      if (data.type === 'awaiting-input') {
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
      if (data.center_tile_control) setCenterTileControl(data.center_tile_control);
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

      // Sound effects based on info messages
      if (data.success) {
        if (data.info?.includes("summoned")) {
          playSound("spawnSound");
          setLastSummonedPos(data.to ? data.to.join("-") : null);
        } else {
          setLastSummonedPos(null);
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
    console.log('triggered with', message)
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
    <>
      {isPortrait && <PleaseRotate />}
      <Notifications />
      <ConfirmationModal />
      <div className="left-sidebar">
        <Graveyards />


        <div className="land-deck-preview" onClick={() => setShowLandDeck(true)}>
          <div className="card-content placeholder-card">
            
            <div className="hand-card opponent-card" style={{ backgroundColor: "#261a33", height: "8vw" }} >
              <h6 className="userH2" style={{color: 'gold', textAlign: 'center' }}>Land Deck</h6>
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
    </>
  );
}

export default Room;
