import React from 'react'
import { useGame } from '../context/GameContext';

function MonsterBoardCard({card, x, y, flipDirection, handleClick}) {
    const ROLE_EMOJI = {
      aggressor: '⚔️',
      sentinel: '🛡️',
      manipulator: '🧠',
      walker: '🌀',
      breaker: '☠️',
    };
    const {lastSummonedPos, apiUrl, userId, setCardPreview} = useGame()
  return (
    <div
    id={`card-${card.id}`}
    className={`monster user-${card.owner} ${lastSummonedPos === `${x}-${y}` ? 'just-summoned' : ''
        }`}
        style={{
            top: `${y * 14.2857142857}%`,
            left: `${x * 14.2857142857}%`,
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
    <div className="card-image" style={{ backgroundImage: `url(${apiUrl}${card.image})`,  transform: card.owner !== userId ? 'scaleY(-1)' : 'none' }}></div>
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
                        style={{ borderColor: card.movement[dir] === 2 ? 'red' : 'yellow' }}
                    ></div>
                );
            }
            return null;
        })}
    
</div>
  )
}

export default MonsterBoardCard