// Board.jsx
import React from 'react';
import { useGame } from '../context/GameContext';
import BoardCard from './BoardCard';
import MonsterBoardCard from './MonsterBoardCard';
import { evaluateTileForCard } from '../util/evaluate';

const cellSize = 12; // in vh units (slightly larger than 11vh)

function Board({ flipDirection, notify, wsRef }) {
    const {
        interaction,
        isLocked,
        sendSorceryStep,
        highlightMap,
        setSelectedLandDeckIndex,
        mana,
        landDeck1,
        landDeck2,
        selectedLandDeckIndex,
        setSelectedHandIndex,
        confirmAction,
        highlightMoves,
        clearHighlights,
        selected,
        setSelected,
        turn,
        selectedHandIndex,
        hand1,
        hand2,
        board,
        userId,
        landBoard,
    } = useGame();

    const numRows = board.length;
    const numCols = board[0]?.length || 0;
    const rowRange = userId === '2' ? [...Array(numRows).keys()].reverse() : [...Array(numRows).keys()];
    const colRange = userId === '2' ? [...Array(numCols).keys()].reverse() : [...Array(numCols).keys()];

    // --- Script-engine hints ---
    // --- Script-engine hints ---
    const awaiting = interaction?.awaiting;
    const amActor = interaction?.owner === userId;
    const awaitingKind = awaiting?.kind;

    const isChoosingBoard =
        amActor && (awaitingKind === 'select_board_target' || awaitingKind === 'select_land_target');

    // Only use suggestions for board/land picks, and only if they are [x,y] pairs
    const rawSuggestions =
        isChoosingBoard && Array.isArray(awaiting?.suggestions) ? awaiting.suggestions : [];

    const suggestionPairs = rawSuggestions.filter(
        (p) => Array.isArray(p) && p.length === 2 && Number.isInteger(p[0]) && Number.isInteger(p[1])
    );

    const suggestionSet = new Set(suggestionPairs.map(([sx, sy]) => `${sx}-${sy}`));
    console.log(suggestionSet)

    const useSuggestions = isChoosingBoard && suggestionSet.size > 0;

    // Click on a board cell at (x, y)
    const handleCellClick = (x, y) => {
        // --- If the engine is waiting for a board/land target, answer that first ---
        if (isChoosingBoard) {
            const key = `${x}-${y}`;
            // If suggestions exist, only allow those; otherwise allow any (BE will validate anyway).
            if (useSuggestions && !suggestionSet.has(key)) return;
            console.log('[BOARD CLICK] send pos', [x, y]);   // ← sanity
            sendSorceryStep(wsRef, { pos: [x, y] });
            clearHighlights(); // prevent user double-click; next snapshot will repaint
            return;
        }

        // If another step is resolving (locked), block normal interactions.
        if (isLocked) return;

        // --- Regular gameplay interactions below ---

        const currentHand = userId === '1' ? hand1 : hand2;
        const currentLandDeck = userId === '1' ? landDeck1 : landDeck2;

        const selectedCard =
            selectedHandIndex !== null
                ? currentHand[selectedHandIndex]
                : selectedLandDeckIndex !== null
                    ? currentLandDeck[selectedLandDeckIndex]
                    : null;

        // A hand card (monster/sorcery) or land deck card is selected
        if (selectedHandIndex !== null || selectedLandDeckIndex !== null) {
            if (!selectedCard) return;

            if (selectedCard.mana > mana[userId]) {
                notify('red', 'Not enough mana to use this card.');
                return;
            }

            if (selectedCard.type === 'monster') {
                const summonRow = userId === '1' ? 5 : 0;
                if (x === summonRow) {
                    confirmAction(
                        `Spend ${selectedCard.mana} mana to summon ${selectedCard.name}?`,
                        'Yes, summon!',
                        'Cancel',
                        () => {
                            if (wsRef.current) {
                                wsRef.current.send(
                                    JSON.stringify({
                                        type: 'summon',
                                        user_id: userId,
                                        slot: selectedHandIndex,
                                        to: [x, y],
                                    })
                                );
                            }
                            setSelectedHandIndex(null);
                            clearHighlights();
                        }
                    );
                } else {
                    notify('yellow', 'Invalid summon position.');
                }
                return;
            }

            if (selectedCard.type === 'sorcery') {
                const meta = evaluateTileForCard(selectedCard, x, y, board, landBoard, userId);

                if (meta.status === 'UNPLAYABLE') {
                    notify('yellow', 'Activation needs not met at this tile.');
                    return;
                }
                if (meta.status === 'PAYABLE' && selectedCard.mana > mana[userId]) {
                    notify('red', 'Not enough mana to use this card.');
                    return;
                }

                const prompt =
                    meta.status === 'FREE'
                        ? `Activate ${selectedCard.name} here for free?`
                        : `Spend ${selectedCard.mana} mana to activate ${selectedCard.name} here?`;
                console.log('here')
                confirmAction(prompt, 'Activate!', 'Cancel', () => {
                    if (wsRef.current) {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'activate-sorcery',
                                user_id: userId,
                                slot: selectedHandIndex,
                                pos: [x, y],
                            })
                        );
                    }
                    setSelectedHandIndex(null);
                    clearHighlights();
                });

                return;
            }

            if (selectedCard.type === 'land') {
                const meta = evaluateTileForCard(selectedCard, x, y, board, landBoard, userId);

                if (meta.status === 'UNPLAYABLE') {
                    notify('yellow', 'Cannot place land here.');
                    return;
                }
                if (meta.status === 'PAYABLE' && selectedCard.mana > mana[userId]) {
                    notify('red', 'Not enough mana to place this land.');
                    return;
                }

                const prompt =
                    meta.status === 'FREE'
                        ? `Create ${selectedCard.name} here for free?`
                        : `Spend ${selectedCard.mana} mana to create ${selectedCard.name} here?`;

                confirmAction(prompt, 'Create!', 'Cancel', () => {
                    if (wsRef.current) {
                        wsRef.current.send(
                            JSON.stringify({
                                type: 'place-land',
                                user_id: userId,
                                slot: selectedLandDeckIndex,
                                pos: [x, y],
                            })
                        );
                    }
                    setSelectedLandDeckIndex(null);
                    clearHighlights();
                });
                return;
            }
        }

        // No hand card selected: normal board interaction (move / direct attack)
        if (userId !== turn) {
            notify('red', 'Not your turn!');
            return;
        }
        const cellCard = board[x]?.[y];
        if (selected) {
            if (wsRef.current) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'move',
                        from: selected,
                        to: [x, y],
                        user_id: userId,
                    })
                );
            }
            setSelected(null);
            clearHighlights();
        } else {
            if (cellCard && cellCard.owner === userId) {
                const backRow = userId === '1' ? 0 : 5;
                if (x === backRow) {
                    confirmAction(
                        `Attack directly with ${cellCard.name} and deal ${cellCard.mana} damage?`,
                        'Attack!',
                        'Cancel',
                        () => {
                            if (wsRef.current) {
                                wsRef.current.send(
                                    JSON.stringify({
                                        type: 'direct-attack',
                                        user_id: userId,
                                        pos: [x, y],
                                    })
                                );
                            }
                            setSelected(null);
                        },
                        () => {
                            setSelected([x, y]);
                            highlightMoves(x, y, cellCard);
                        }
                    );
                    return;
                }
                setSelected([x, y]);
                highlightMoves(x, y, cellCard);
            } else {
                notify('red', cellCard ? 'Not your card' : 'Please select a card');
            }
        }
    };

    // Pre-collect monsters for rendering
    const monsters = [];
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const card = board[y][x];
            if (card && card.type === 'monster') {
                const x2 = userId === '2' ? 5 - x : x;
                const y2 = userId === '2' ? 5 - y : y;
                monsters.push({ card, x: x2, y: y2, realX: x, realY: y });
            }
        }
    }

    return (
        <div
            id="board"
            style={{
                gridTemplateColumns: `repeat(${numCols}, ${cellSize}vh)`,
                gridTemplateRows: `repeat(${numRows}, ${cellSize}vh)`,
                transform: 'perspective(800px) rotateX(18deg)', // Closer perspective, more tilt
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease',
            }}
        >
            {monsters.map(({ card, x, y, realX, realY }) => (
                <MonsterBoardCard
                    key={card.id}
                    card={card}
                    x={x}
                    y={y}
                    flipDirection={flipDirection}
                    handleClick={() => handleCellClick(realY, realX)}
                />
            ))}

            {rowRange.map((x) =>
                colRange.map((y) => {
                    const cellKey = `${x}-${y}`;

                    // 🔧 define this:
                    const key = `${x}-${y}`;
                    const isValidTarget = !useSuggestions || suggestionSet.has(key);


                    // 1) If we're choosing a board/land target, the overlay is driven by suggestions
                    let overlayStyle = {};
                    if (isChoosingBoard) {
                        overlayStyle = isValidTarget
                            ? {
                                background: 'rgba(255, 215, 0, 0.25)',
                                outline: '2px solid gold',
                                boxShadow: '0 0  10px rgba(255,215,0,.6)',
                                cursor: 'pointer',
                            }
                            : {
                                opacity: 0.35,
                                filter: 'grayscale(0.4)',
                                pointerEvents: 'none',   // keep cell, block clicks
                                cursor: 'not-allowed',
                            };
                    }
                    else {
                        // 2) Otherwise, use your normal highlightMap paint (move/summon/activate previews)
                        const meta = highlightMap[cellKey]; // { status, cost } | undefined
                        if (meta) {
                            overlayStyle =
                                meta.status === 'FREE'
                                    ? {
                                        background: 'rgba(80,200,120,0.28)',
                                        outline: '2px solid #50c878',
                                        boxShadow: '0 0 10px rgba(80,200,120,.6)',
                                    }
                                    : meta.status === 'PAYABLE'
                                        ? {
                                            background: userId === '1' ? 'rgba(51,153,255,0.25)' : 'rgba(255,165,0,0.25)',
                                            outline: userId === '1' ? '2px solid #3399ff' : '2px solid orange',
                                        }
                                        : {
                                            background: 'rgba(128,128,128,0.16)',
                                            outline: '2px dashed rgba(128,128,128,0.7)',
                                            cursor: 'not-allowed',
                                        };
                        }
                    }

                    const cellClass = (x + y) % 2 === 0 ? 'white' : 'black';
                    const landCard = landBoard[x]?.[y] || null;
                    const boardCard = board[x]?.[y] || null;

                    return (
                        <div
                            key={cellKey}
                            className={`cell ${cellClass}`}
                            id={`cell-${x}-${y}`}
                            onClick={() => handleCellClick(x, y)}
                        >
                            <div className="cell-overlay" style={overlayStyle} />
                            {[landCard, boardCard].map((card) => {
                                if (!card || card.type === 'monster') return null;
                                return <BoardCard key={card.id} card={card} x={x} y={y} flipDirection={flipDirection} />;
                            })}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default Board;
