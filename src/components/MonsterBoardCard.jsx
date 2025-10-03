import React, { useState } from 'react'
import { useGame } from '../context/GameContext';

// Component to handle image loading with fallback
function CardImage({ card, apiUrl, transform }) {
  const [imageSrc, setImageSrc] = useState(`${apiUrl}/${card.image || 'default_card_art.png'}`);
  
  const handleImageError = () => {
    setImageSrc(`${apiUrl}/default_card_art.png`);
  };

  return (
    <div className="card-image" style={{ backgroundImage: `url(${imageSrc})`, transform }}>
      {/* Hidden img tag to detect load failures */}
      <img
        src={imageSrc}
        alt=""
        style={{ display: 'none' }}
        onError={handleImageError}
      />
    </div>
  );
}

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
                marginTop: '-1vh', // Monster higher above land
                // Shadow closer to monster with less blur
                filter: 'drop-shadow(0 2vh 6px rgba(0, 0, 0, 0.4))',
                zIndex: 10
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
            <CardImage 
              card={card} 
              apiUrl={apiUrl}
              transform={card.owner !== userId ? 'scaleY(-1)' : 'none'}
            />
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