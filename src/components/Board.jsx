import React from 'react'
import { useGame } from '../context/GameContext';



const cellSize = 10; // in vh units
function Board({ flipDirection, notify, wsRef }) {
    const {mana, setSelectedHandIndex, confirmAction, highlightMoves, clearHighlights, selected, setSelected, turn, selectedHandIndex, hand1, hand2, board, highlightedCells, userId, landBoard, lastSummonedPos, apiUrl, centerTileControl, setCardPreview, pendingSorcery } = useGame()

    const numRows = board.length;
    const numCols = board[0]?.length || 0;
    const rowRange = userId === '2' ? [...Array(numRows).keys()].reverse() : [...Array(numRows).keys()];
    const colRange = userId === '2' ? [...Array(numCols).keys()].reverse() : [...Array(numCols).keys()];


    // Handle a click on a board cell at (x, y)
    const handleCellClick = (x, y) => {
        // If awaiting sorcery target selection
        if (pendingSorcery) {
            if (wsRef.current) {
                wsRef.current.send(
                    JSON.stringify({
                        type: 'resolve-sorcery',
                        slot: pendingSorcery.slot,
                        target: [x, y],
                    })
                );
            }
            setPendingSorcery(null);
            clearHighlights();
            return;
        }

        const currentHand = userId === '1' ? hand1 : hand2;
        const selectedCard = currentHand[selectedHandIndex];

        // Card from hand is selected
        if (selectedHandIndex !== null) {
            if (!selectedCard) return;
            if (selectedCard.mana > mana[userId]) {
                notify('red', 'Not enough mana to use this card.');
                return;
            }
            if (selectedCard.type === 'monster') {
                const validCols = [0, 3, 6];
                const summonRow = userId === '1' ? 6 : 0;
                if (x === summonRow && validCols.includes(y)) {
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
            } else if (selectedCard.type === 'sorcery') {
                confirmAction(
                    `Spend ${selectedCard.mana} mana to activate ${selectedCard.name} on this tile?`,
                    'Activate!',
                    'Cancel',
                    () => {
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
                    }
                );
            } else if (selectedCard.type === 'land') {
                confirmAction(
                    `Spend ${selectedCard.mana} mana to create ${selectedCard.name} on this tile?`,
                    'Create!',
                    'Cancel',
                    () => {
                        if (wsRef.current) {
                            wsRef.current.send(
                                JSON.stringify({
                                    type: 'place-land',
                                    user_id: userId,
                                    slot: selectedHandIndex,
                                    pos: [x, y],
                                })
                            );
                        }
                        setSelectedHandIndex(null);
                        clearHighlights();
                    }
                );
            }
            return;
        }

        // No hand card selected: process board click
        if (userId !== turn) {
            notify('red', 'Not your turn!');
            return;
        }
        const cellCard = board[x] && board[x][y];
        if (selected) {
            // Moving a card from previously selected cell
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
                const backRow = userId === '1' ? 0 : 6;
                // Direct attack condition if clicking on back row
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
                            // In case you want to highlight moves after canceling the confirmation
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

    return (
        <div
            id="board"
            style={{
                gridTemplateColumns: `repeat(${numCols}, ${cellSize}vh)`,
                gridTemplateRows: `repeat(${numRows}, ${cellSize}vh)`,
            }}
        >
            {rowRange.map((x) =>
                colRange.map((y) => {
                    const cellKey = `${x}-${y}`;
                    const cellClass = (x + y) % 2 === 0 ? 'white' : 'black';
                    const isHighlighted = highlightedCells.includes(cellKey);
                    return (
                        <div
                            key={cellKey}
                            className={`cell ${cellClass}`}
                            data-x={x}
                            data-y={y}
                            onClick={() => handleCellClick(x, y)}
                        >
                            {x === 3 && y === 3 && (
                                <div
                                    id="centerCounter"
                                    className={`center-counter ${centerTileControl['1'] > 0 && centerTileControl['2'] === 0
                                            ? 'blue'
                                            : centerTileControl['2'] > 0 && centerTileControl['1'] === 0
                                                ? 'orange'
                                                : ''
                                        }`}
                                >
                                    {centerTileControl['1'] > 0
                                        ? centerTileControl['1']
                                        : centerTileControl['2'] > 0
                                            ? centerTileControl['2']
                                            : 0}
                                </div>
                            )}
                            <div
                                className="cell-overlay"
                                style={
                                    isHighlighted
                                        ? {
                                            background: userId === '1' ? 'rgba(51,153,255,0.3)' : 'rgba(255,165,0,0.3)',
                                            outline: userId === '1' ? '2px solid #3399ff' : '2px solid orange',
                                        }
                                        : {}
                                }
                            ></div>
                            {(() => {
                                const landCard = landBoard[x] ? landBoard[x][y] : null;
                                const boardCard = board[x] ? board[x][y] : null;
                                const cards = [landCard, boardCard];
                                return cards.map((card) => {
                                    if (!card) return null;
                                    return (
                                        <div
                                            key={card.id}
                                            id={`card-${card.id}`}
                                            className={`card-frame user-${card.owner} ${lastSummonedPos === `${x}-${y}` ? 'just-summoned' : ''
                                                }`}
                                            style={card.type === 'land' ? { transform: 'rotate(45deg)' } : {}}
                                            title={card.name}
                                            onMouseEnter={() => setCardPreview(card)}
                                        >
                                            <div className="card-image" style={{ backgroundImage: `url(${apiUrl}/${card.image})` }}></div>
                                            <div className="overlay"></div>
                                            <div className="card-name">{card.name}</div>
                                            <div className="stats">
                                                {card.attack !== undefined && card.defense !== undefined && (
                                                    <>
                                                        <span
                                                            style={{
                                                                color:
                                                                    card.attack > card.original_attack
                                                                        ? 'lime'
                                                                        : card.attack < card.original_attack
                                                                            ? 'red'
                                                                            : 'inherit',
                                                            }}
                                                        >
                                                            {card.attack}
                                                        </span>{' '}
                                                        /{' '}
                                                        <span
                                                            style={{
                                                                color:
                                                                    card.defense > card.original_defense
                                                                        ? 'lime'
                                                                        : card.defense < card.original_defense
                                                                            ? 'red'
                                                                            : 'inherit',
                                                            }}
                                                        >
                                                            {card.defense}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {card.movement &&
                                                Object.keys(card.movement).map((dir) => {
                                                    if (card.movement[dir]) {
                                                        const finalDir = card.owner === userId ? dir : flipDirection(dir);
                                                        return (
                                                            <div
                                                                key={dir}
                                                                className={`movement movement-${finalDir}`}
                                                                style={{ borderColor: card.movement[dir] === 'any' ? 'red' : 'lime' }}
                                                            ></div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            {card.creation_needs &&
                                                Array.isArray(card.creation_needs) &&
                                                card.creation_needs.map((dir) => {
                                                    const finalDir = card.owner === userId ? dir : flipDirection(dir);
                                                    return (
                                                        <div
                                                            key={dir}
                                                            className={`movement movement-${finalDir}`}
                                                            style={{ borderColor: 'white' }}
                                                        ></div>
                                                    );
                                                })}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    );
                })
            )}
        </div>
    );
};


export default Board
