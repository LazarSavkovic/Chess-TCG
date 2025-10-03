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

function BoardCard({card, x, y, flipDirection}) {

     const ROLE_COLOR = {
      red: 'red',
      white: 'white',
      blue: '#1072da',
      black : 'black',
    };

    const ROLE_EMOJI = {
  red: '🔴',
  white: '⚪',
  blue: '🔵',
  black: '⚫',
    };


    const {lastSummonedPos, apiUrl, userId, setCardPreview} = useGame()
  return (
    <div
    id={`card-${card.id}`}
    className={`card-frame user-${card.owner} ${lastSummonedPos === `${x}-${y}` ? 'just-summoned' : ''
        }`}
    style={
        card.type === 'land' 
            ? { 
                transform: 'rotate(45deg) translateZ(0px)', // Land cards at ground level
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
                zIndex: 5,
                opacity: 0.9, // Slightly transparent so monsters show better above
                // Add a subtle border to help visibility
                border: '1px solid rgba(255, 255, 255, 0.3)'
              } 
            : { zIndex: 1 } // Other cards at base level
        }
    title={card.name}
    onMouseEnter={() => setCardPreview(card)}
>
       {/* Role badge (lands only) */}
      {card.type === 'land' && (
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
                    style={{ borderColor: ROLE_COLOR[card.role] }}
                ></div>
            );
        })}
</div>
  )
}

export default BoardCard