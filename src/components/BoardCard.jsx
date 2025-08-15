import React from 'react'
import { useGame } from '../context/GameContext';

function BoardCard({card, x, y, flipDirection}) {

     const ROLE_COLOR = {
      red: 'red',
      white: 'white',
      blue: '#1072da',
      black : 'black',
    };

    const ROLE_EMOJI = {
      red: '⚔️',
      white: '🛡️',
      blue: '🌀',
      black: '☠️',
    };


console.log(card)

    const {lastSummonedPos, apiUrl, userId, setCardPreview} = useGame()
  return (
    <div
    id={`card-${card.id}`}
    className={`card-frame user-${card.owner} ${lastSummonedPos === `${x}-${y}` ? 'just-summoned' : ''
        }`}
    style={card.type === 'land' ? { transform: 'rotate(45deg)' } : {}}
    title={card.name}
    onMouseEnter={() => setCardPreview(card)}
>
       {/* Role badge (lands only) */}
      {card.type === 'land' && (
        <div className={`role-badge ${card.role}-badge`} aria-label={card.role}>
          {ROLE_EMOJI[card.role] || '🃏'}
        </div>
      )}
    <div className="card-image" style={{ backgroundImage: `url(${apiUrl}${card.image})`,  transform: card.owner !== userId ? 'scaleY(-1)' : 'none'  }}></div>
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