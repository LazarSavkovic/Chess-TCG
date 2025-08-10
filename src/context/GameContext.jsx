import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const GameProvider = ({ children }) => {

  const apiHost = import.meta.env.VITE_API_HOST;
  const apiUrl = `http://${apiHost}`

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

  const [centerTileControl, setCenterTileControl] = useState({ '1': 0, '2': 0 });
  const [turn, setTurn] = useState('1');
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);
  const [selectedLandDeckIndex, setSelectedLandDeckIndex] = useState(null);
  const [lastSummonedPos, setLastSummonedPos] = useState(null);
  const [selected, setSelected] = useState(null); // Selected board cell [x, y]
  const [pendingSorcery, setPendingSorcery] = useState(null);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [movesLeft, setMovesLeft] = useState(3);
  const [deckSizes, setDeckSizes] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState([]); // Array of "x-y" strings for highlighted cells
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


  // Highlight moves available from board position (x, y) for a given card
  const highlightMoves = (x, y, card) => {
    clearHighlights();
    const directions = {
      forward: userId === '1' ? [-1, 0] : [1, 0],
      back: userId === '1' ? [1, 0] : [-1, 0],
      left: userId === '1' ? [0, -1] : [0, 1],
      right: userId === '1' ? [0, 1] : [0, -1],
      'forward-left': userId === '1' ? [-1, -1] : [1, 1],
      'forward-right': userId === '1' ? [-1, 1] : [1, -1],
      'back-left': userId === '1' ? [1, -1] : [-1, 1],
      'back-right': userId === '1' ? [1, 1] : [-1, -1],
    };
    const maxRange = 7;
    let highlights = [];
    for (const dir in card.movement) {
      const vector = directions[dir];
      if (!vector) continue;
      const range = card.movement[dir] === 'any' ? maxRange : card.movement[dir];
      for (let step = 1; step <= range; step++) {
        const nx = x + vector[0] * step;
        const ny = y + vector[1] * step;
        if (nx < 0 || nx >= board.length || ny < 0 || ny >= (board[0]?.length || 0)) break;
        const cellId = `${nx}-${ny}`;
        if (board[nx] && board[nx][ny]) {
          if (board[nx][ny].owner !== userId) {
            highlights.push(cellId);
          }
          break;
        }
        highlights.push(cellId);
      }
    }
    setHighlightedCells(highlights);
  };

  // Highlight summon zones (for monsters) and place/activate zones (for sorcery/land)
  const highlightSummonZones = () => {
    const validCols = [0, 3, 6];
    const summonRow = userId === '1' ? 6 : 0;
    let highlights = validCols.map((col) => `${summonRow}-${col}`);
    setHighlightedCells(highlights);
  };

const highlightPlaceActivateZones = (handIndex, land) => {
  clearHighlights();
  const currentHand = !land
    ? (userId === '1' ? hand1 : hand2)
    : (userId === '1' ? landDeck1 : landDeck2);

  const card = currentHand[handIndex];
  const needsArr = card?.activation_needs || card?.creation_needs;
  if (!card || !Array.isArray(needsArr)) return;

  const needs = needsArr;

  const directions = {
    forward:       userId === '1' ? [-1, 0] : [ 1, 0],
    back:          userId === '1' ? [ 1, 0] : [-1, 0],
    left:          userId === '1' ? [ 0,-1] : [ 0, 1],
    right:         userId === '1' ? [ 0, 1] : [ 0,-1],
    'forward-left': userId === '1' ? [-1,-1] : [ 1, 1],
    'forward-right':userId === '1' ? [-1, 1] : [ 1,-1],
    'back-left':    userId === '1' ? [ 1,-1] : [-1, 1],
    'back-right':   userId === '1' ? [ 1, 1] : [-1,-1],
  };

  const flipDirection = {
    forward: 'back',
    back: 'forward',
    left: 'right',
    right: 'left',
    'forward-left': 'back-right',
    'forward-right': 'back-left',
    'back-left': 'forward-right',
    'back-right': 'forward-left',
  };

  const highlights = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      let satisfiesAll = true;

      for (const dir of needs) {
        const [dx, dy] = directions[dir];
        const tx = row + dx;
        const ty = col + dy;

        if (tx < 0 || tx >= board.length || ty < 0 || ty >= board[0].length) {
          satisfiesAll = false;
          break;
        }

        const neighbor = board[tx]?.[ty] || null;
        const landTile = landBoard[tx]?.[ty] || null;

        let valid = false;

        // ✅ Only your monsters can satisfy needs
        if (neighbor && neighbor.type === 'monster' && neighbor.owner === userId) {
          const baseOpposite = flipDirection[dir];
          // Check if the neighbor could step "back" toward (row,col)
          const movementVal = neighbor.movement?.[baseOpposite];
          if (movementVal === 1 || movementVal === 2 || movementVal === 'any') {
            valid = true;
          }
        }

        // ✅ Only your lands can satisfy needs
        if (!valid && landTile && landTile.owner === userId) {
          if (landTile.creation_needs?.includes(flipDirection[dir])) {
            valid = true;
          }
        }

        if (!valid) {
          satisfiesAll = false;
          break;
        }
      }

      if (satisfiesAll) {
        highlights.push(`${row}-${col}`);
      }
    }
  }

  setHighlightedCells(highlights);
};


  return (
    <GameContext.Provider
      value={{
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
        centerTileControl,
        setCenterTileControl,
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
        pendingSorcery,
        setPendingSorcery,
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
         setActionsThisTurn
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;