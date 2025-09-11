import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { computeLSHighlights } from '../util/highlightsLS';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const GameProvider = ({ children }) => {

  const apiHost = import.meta.env.VITE_API_HOST;
  const apiUrl = `http://${apiHost}`

  // --- Interaction / Stack (new engine) ---
  const [interaction, setInteraction] = useState(null); // {type, owner, card_id, slot_index, free, pos, cursor, awaiting:{kind,...}}
  const [stack, setStack] = useState([]);               // purely visual if you want to render
  const isLocked = !!interaction;                       // lock UI when resolving

  const [userId, setUserId] = useState(null);
  const [board, setBoard] = useState([]);
  const [landBoard, setLandBoard] = useState([]);
  const [hand1, setHand1] = useState([]);
  const [hand2, setHand2] = useState([]);
  const [landDeck1, setLandDeck1] = useState([]);
  const [landDeck2, setLandDeck2] = useState([]);
  const [graveyard1, setGraveyard1] = useState([]);
  const [graveyard2, setGraveyard2] = useState([]);
  const [mana, setMana] = useState(() => {
    const stored = localStorage.getItem('mana');
    return stored ? JSON.parse(stored) : { '1': 50, '2': 50 };
  });

  // One-per-turn action flags coming from BE
  const [actionsThisTurn, setActionsThisTurn] = useState({
    '1': { summoned: false, sorcery_used: false, land_placed: false },
    '2': { summoned: false, sorcery_used: false, land_placed: false },
    current: { summoned: false, sorcery_used: false, land_placed: false },
  });

  const [turn, setTurn] = useState('1');
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);
  const [selectedLandDeckIndex, setSelectedLandDeckIndex] = useState(null);
  const [lastSummonedPos, setLastSummonedPos] = useState(null);
  const [selected, setSelected] = useState(null); // Selected board cell [x, y]
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [movesLeft, setMovesLeft] = useState(3);
  const [deckSizes, setDeckSizes] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState([]); // Array of "x-y" strings for highlighted cells
  const [highlightMap, setHighlightMap] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [cardPreview, setCardPreview] = useState(null);
  const [showLandDeck, setShowLandDeck] = useState(false);




  const [showTutoringPopup, setShowTutoringPopup] = useState(false);
  const [tutoringTargets, setTutoringTargets] = useState([]); // Adjust CardType as needed


  // -----------------------
  // Utility Functions
  // -----------------------
  const clearHighlights = () => {
    setHighlightedCells([]);
    setHighlightMap({});
  };
  // Confirmation overlay: stores message and callbacks
  const confirmAction = (message, yesMessage, noMessage, onYes, onNo = () => { }) => {
    setConfirmation({ message, yesMessage, noMessage, onYes, onNo });
  };

  const clearSelection = () => {
    setSelected(null);
    setSelectedHandIndex(null);
    clearHighlights();
  };


    // --- Helpers for new interaction prompts ---
  const highlightCellsForAwaiting = ({ kind, owner, zone, filter }) => {
    // We reuse your highlight overlay for both board and lands.
    clearHighlights();
    const targets = [];
    if (kind === 'select_board_target' && board?.length) {
      for (let x = 0; x < board.length; x++) {
        for (let y = 0; y < board[0].length; y++) {
          const c = board[x][y];
          // Minimal filtering here — BE re-validates anyway.
          if (filter?.require_monster && !(c && c.type === 'monster')) continue;
          if (filter?.require_enemy && !(c && c.owner !== userId)) continue;
          targets.push(`${x}-${y}`);
        }
      }
    } else if (kind === 'select_land_target' && landBoard?.length) {
      for (let x = 0; x < landBoard.length; x++) {
        for (let y = 0; y < landBoard[0].length; y++) {
          const land = landBoard[x][y];
          if (!land) continue; // must pick an existing land
          if (owner === 'opponent' && !(land.owner && land.owner !== userId)) continue;
          if (owner === 'self' && !(land.owner && land.owner === userId)) continue;
          targets.push(`${x}-${y}`);
        }
      }
    }
    setHighlightedCells(targets);
    const map = {};
    targets.forEach(k => (map[k] = { status: 'FREE', cost: 0 }));
    setHighlightMap(map);
  };

  // Wrapper the Board/Hand can call to answer a prompt.
  // The caller passes the correct payload for the currently awaited step.
let _nonce = 0;
function sendSorceryStep(wsRef, payload) {
  const nonce = ++_nonce;                 // monotonically increasing
  console.log('[FE] STEP send', nonce, payload);
  wsRef.current?.send(JSON.stringify({ type: 'sorcery-step', payload, _nonce: nonce }));
}


// Moves are always FREE
const highlightMoves = (x, y, card) => {
  clearHighlights();

  if (!board?.length || !board[0]?.length || !card?.movement) {
    setHighlightMap({});
    setHighlightedCells([]);
    return;
  }

  const directions = {
    forward:        userId === '1' ? [-1, 0] : [ 1, 0],
    back:           userId === '1' ? [ 1, 0] : [-1, 0],
    left:           userId === '1' ? [ 0,-1] : [ 0, 1],
    right:          userId === '1' ? [ 0, 1] : [ 0,-1],
    'forward-left': userId === '1' ? [-1,-1] : [ 1, 1],
    'forward-right':userId === '1' ? [-1, 1] : [ 1,-1],
    'back-left':    userId === '1' ? [ 1,-1] : [-1, 1],
    'back-right':   userId === '1' ? [ 1, 1] : [-1,-1],
  };

  const maxRange = 7;
  const rows = board.length, cols = board[0].length;
  const map = {};

  for (const dir in card.movement) {
    const vec = directions[dir];
    if (!vec) continue;

    const range = card.movement[dir] === 'any' ? maxRange : Number(card.movement[dir] || 0);
    for (let step = 1; step <= range; step++) {
      const nx = x + vec[0] * step;
      const ny = y + vec[1] * step;
      if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) break;

      const occupant = board[nx]?.[ny];
      const key = `${nx}-${ny}`;

      if (occupant) {
        // can capture enemy; mark then stop in this direction
        if (occupant.owner !== userId) {
          map[key] = { status: 'FREE', cost: 0 };
        }
        break;
      }

      // empty cell — normal move
      map[key] = { status: 'FREE', cost: 0 };
    }
  }

  setHighlightMap(map);
  setHighlightedCells(Object.keys(map));
};

// Summons always PAY (pass the monster card so we can show its cost)
// Safe default: works even if you call without the card
const highlightSummonZones = (monsterCard = null) => {
  clearHighlights();

  if (!board?.length || !board[0]?.length) {
    setHighlightMap({});
    setHighlightedCells([]);
    return;
  }

  // Use dynamic bottom/top row based on board size
  const summonRow = userId === '1' ? board.length - 1 : 0;
  const cols = board[0].length;
  const cost = Number(monsterCard?.mana ?? 0);

  const map = {};
  for (let col = 0; col < cols; col++) {
    // only allow empty cells for summoning
    if (board?.[summonRow]?.[col]) continue;
    const key = `${summonRow}-${col}`;
    map[key] = { status: 'PAYABLE', cost };
  }

  setHighlightMap(map);
  setHighlightedCells(Object.keys(map));
};


  const highlightPlaceActivateZones = (handIndex, land) => {
    clearHighlights();
    const currentHand = !land
      ? (userId === '1' ? hand1 : hand2)       // sorceries in hand
      : (userId === '1' ? landDeck1 : landDeck2); // lands in land deck

    const card = currentHand?.[handIndex];
    if (!card) return;

    const mode = land ? 'land' : 'sorcery';
    const map = computeLSHighlights({ card, mode, userId, board, landBoard, mana });

    // Keep your old array for overlay hit-testing, but enrich with map
    setHighlightMap(map);
    setHighlightedCells(Object.keys(map)); // ["x-y", ...]
  };


  return (
    <GameContext.Provider
      value={{
        interaction,
        setInteraction,
        stack,
        setStack,
       isLocked,
        userId,
        setUserId,
        turn,
        setTurn,
        board,
        setBoard,
        landBoard,
        setLandBoard,
        hand1,
        setHand1,
        hand2,
        setHand2,
        mana,
        setMana,
        graveyard1,
        setGraveyard1,
        graveyard2,
        setGraveyard2,
        landDeck1,
        setLandDeck1,
        landDeck2,
        setLandDeck2,
        deckSizes,
        setDeckSizes,
        movesLeft,
        setMovesLeft,
        gameOver,
        setGameOver,
        pendingDiscard,
        setPendingDiscard,
        notifications,
        setNotifications,
        selectedHandIndex,
        setSelectedHandIndex,
        confirmation,
        setConfirmation,
        isPortrait,
        setIsPortrait,
        cardPreview,
        setCardPreview,
        highlightedCells,
        setHighlightedCells,
        selected,
        setSelected,
        lastSummonedPos,
        setLastSummonedPos,
        clearHighlights,
        confirmAction,
        highlightMoves,
        highlightSummonZones,
        highlightPlaceActivateZones,
        highlightMap,
        setHighlightMap,
        apiHost,
        apiUrl,
        showTutoringPopup,
        setShowTutoringPopup,
        tutoringTargets,
        setTutoringTargets,
        showLandDeck,
        setShowLandDeck,
        setSelectedLandDeckIndex,
        selectedLandDeckIndex,
        actionsThisTurn,
        setActionsThisTurn,
        sendSorceryStep
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;