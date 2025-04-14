// Room.jsx
import React, { useState, useEffect, useRef } from 'react';
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
    setHand1,
    setHand2,
    setBoard,
    setDeckSizes,
    setMana,
    setLandBoard,
    setCenterTileControl,
    turn,
    setTurn,
    setSelectedHandIndex,
    setLastSummonedPos,
    setSelected,
    setPendingSorcery,
    setPendingDiscard,
    gameOver,
    setGameOver,
    setHighlightedCells,
    setMovesLeft,
    apiHost,
    clearHighlights
  } = useGame()
  // -----------------------
  // Refs
  // -----------------------
  const wsRef = useRef(null);
  const previousPositions = useRef({});

  // On Room load, check for an existing username; if none, generate one.
  useEffect(() => {
    let username = localStorage.getItem("username");
    if (!username) {
      // You can replace generateTabId() with your own generate function.
      username = generateTabId();
      localStorage.setItem("username", username);
    }
  }, []);

  // Retrieve the previously assigned player slot (if any)
  useEffect(() => {
    const assigned = localStorage.getItem("assignedPlayer");
    if (assigned) {
      setUserId(assigned);
    }
  }, []);

  // -----------------------
  // WebSocket Setup
  // -----------------------
  useEffect(() => {
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
      const username = localStorage.getItem("username");
      ws.send(JSON.stringify({ username }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Incoming:', data);

      // On the first message from the backend, it sends back the assigned player slot.
      if (data.user_id && !localStorage.getItem('assignedPlayer')) {
        setUserId(data.user_id);
        // Persist the assigned player slot so we can restore it on reload.
        localStorage.setItem("assignedPlayer", data.user_id);
      }

      // Special handling for awaiting-input (e.g. sorcery targeting)
      if (data.type === 'awaiting-input') {
        setPendingSorcery({ slot: data.slot, card_id: data.card_id });
        notify('yellow', `Select a target for ${data.card_id}`);
        // Store valid target cells (as strings "x-y") to later highlight them
        setHighlightedCells(data.valid_targets.map(([x, y]) => `${x}-${y}`));
        return;
      }

      if (data.type === 'discard-to-end-turn') {
        notify('yellow', `Discard card from hand to end turn`);
        setPendingDiscard(true);
        return;
      }

      // Update game state from WS message
      if (data.board) setBoard(data.board);
      if (data.land_board) setLandBoard(data.land_board);
      if (data.center_tile_control) setCenterTileControl(data.center_tile_control);
      if (data.turn) {
        if (data.turn !== localStorage.getItem('assignedPlayer')) {
          console.log('data turn', data.turn, turn)
          notify('green', data.turn === userId ? "Your turn" : "Opponent's turn");
        }
        setTurn(data.turn);
      }
      if (data.hand1) setHand1(data.hand1);
      if (data.hand2) setHand2(data.hand2);
      if (data.deck_sizes) setDeckSizes(data.deck_sizes);
      if (data.mana) setMana(data.mana);
      if (data.graveyard) {
        setGraveyard1(data.graveyard['1'] || graveyard1);
        setGraveyard2(data.graveyard['2'] || graveyard2);
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
        if (data.info?.includes("attacked directly")) playSound("deathSound");
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
      {/* Rotation prompt overlay */}
      {isPortrait && <PleaseRotate />}
      <Notifications />
      <ConfirmationModal />

      <div className="left-sidebar">
        <Graveyards />
      </div>
      <div className="main">
        <div className="board-wrRoomer">
          <OpponentHand />
          <Board flipDirection={flipDirection} notify={notify} wsRef={wsRef} />
          <Hand wsRef={wsRef} />
        </div>
      </div>
      <div className="right-sidebar">
        <OpponentDetail />
        <TurnDetail handleEndTurn={handleEndTurn} />
      <Detail/>
      </div>
      {/* Audio elements */}
      <audio id="deathSound" src="/sounds/kill.wav" preload="auto"></audio>
      <audio id="spawnSound" src="/sounds/spawn.ogg" preload="auto"></audio>
      <audio id="moveSound" src="/sounds/whoosh.wav" preload="auto"></audio>
    </>
  );
}

export default Room;
