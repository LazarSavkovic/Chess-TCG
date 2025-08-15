import React from 'react'
import { useGame } from '../context/GameContext';

function MonsterBoardCard({ card, x, y, flipDirection, handleClick }) {
const ROLE_EMOJI = {
  red: '🔴',
  white: '⚪',
  blue: '🔵',
  black: '⚫',
};

         const ROLE_COLOR = {
      red: 'red',
      white: 'white',
      blue: '#1072da',
      black : 'black',
    };

    const { lastSummonedPos, apiUrl, userId, setCardPreview } = useGame()
    return (
        <div
            id={`card-${card.id}`}
            className={`monster user-${card.owner} ${lastSummonedPos === `${x}-${y}` ? 'just-summoned' : ''
                }`}
            style={{
                top: `${y * (100 / 6)}%`,
                left: `${x * (100 / 6)}%`,
            }}
            title={card.name}
            onMouseEnter={() => setCardPreview(card)}
            onClick={handleClick}
        >
            {/* Role badge (monsters only) */}
            {card.type === 'monster' && (
                <div className={`role-badge ${card.role}-badge`} aria-label={card.role}>
                    {ROLE_EMOJI[card.role] || '🃏'}
                </div>
            )}
            <div className="card-image" style={{ backgroundImage: `url(${apiUrl}${card.image})`, transform: card.owner !== userId ? 'scaleY(-1)' : 'none' }}></div>
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
                    if (!card.movement[dir]) return null;

                    const finalDir = card.owner === userId ? dir : flipDirection(dir);
                    const elements = [];

                    // Base movement arrow (always shown if movement is truthy)
                    elements.push(
                        <div
                            key={`${dir}-base`}
                            className={`movement movement-${finalDir}`}
                            style={{ borderColor: `${ROLE_COLOR[card.role]}` }}
                        ></div>
                    );

                    // Add extra layer if movement is 2
                    if (card.movement[dir] === 2) {
                        elements.push(
                            <div
                                key={`${dir}-overlay`}
                                className={`movement movement-${finalDir}2`}
                                style={{ borderColor: `${ROLE_COLOR[card.role]}` }}
                            ></div>
                        );
                    }

                    return elements;
                })}

        </div>
    )
}

export default MonsterBoardCard