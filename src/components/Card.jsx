import React from 'react';
import { useGame } from '../context/GameContext';

function Card({ card, fontSize }) {
  const { apiUrl } = useGame();

  const renderArrows = () => {
    const arrows = [];

    if (card.movement) {
      for (const dir in card.movement) {
        if (card.movement[dir]) {
          arrows.push(
            <div
              key={`movement-${dir}`}
              className={`arrow ${dir} ${card.movement[dir] === 2 ? 'red' : 'yellow'
                }`}
            ></div>
          );
        }
      }
    } else if (card.type === 'sorcery' && Array.isArray(card.activation_needs)) {
      for (const dir of card.activation_needs) {
        arrows.push(
          <div key={`sorcery-${dir}`} className={`arrow ${dir} ${card.role || 'white'}`}></div>
        );
      }
    } else if (card.type === 'land' && Array.isArray(card.creation_needs)) {
      for (const dir of card.creation_needs) {
        arrows.push(
          <div key={`land-${dir}`} className={`arrow ${dir} ${card.role || 'white'}`}></div>
        );
      }
    }

    return arrows;
  };

  return (
    <div
      className={`play-card ${card.type}-card ${card.role ? `${card.role}-${card.type}` : ''}`}
      style={{ fontSize }}
    >

      <div className="card-content">
        <div className="title-bar">
          {card.name}
          <div className="mana-cost">🩸 {card.mana || 0}</div>
        </div>

        <div
          className="card-image"
          style={{
            backgroundImage: `url(${apiUrl}/${card.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        {/* 🧭 Arrows container */}
        <div className="directional-arrows">{renderArrows()}</div>

        <div className="type-line">
          {card.subtype || (card.type ? `(${card.type} - ${card.role.charAt(0).toUpperCase() + card.role.slice(1)})` : '')}
        </div>

        <div className="rules-text">
          {card.text || card.description || ` No effect.`}
        </div>

        <div className="stats-bar">
          {card.attack && card.defense ? (
            <>
              <span>ATK: {card.attack}</span>
              <span>DEF: {card.defense}</span>
            </>
          ) : (
            <>
              <span></span>
              <span></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;
