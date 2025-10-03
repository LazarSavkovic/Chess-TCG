import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowDoubleSVG, ArrowSingleSVG } from './ArrowSVG';

// Component to handle image loading with fallback
function CardImage({ card, apiUrl }) {
  const [imageSrc, setImageSrc] = useState(`${apiUrl}/${card.image || 'static/cards/default_card_art.png'}`);
  
  // Reset image when card changes
  useEffect(() => {
    setImageSrc(`${apiUrl}/${card.image || 'static/cards/default_card_art.png'}`);
  }, [card.image, apiUrl]);
  
  const handleImageError = () => {
    setImageSrc(`${apiUrl}/static/cards/default_card_art.png`);
  };

  return (
    <div
      className="card-image"
      style={{
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Hidden img tag to detect load failures */}
      <img
        src={imageSrc}
        alt=""
        style={{ display: 'none' }}
        onError={handleImageError}
        onLoad={() => {
          // Image loaded successfully, keep current imageSrc
        }}
      />
    </div>
  );
}

function Card({ card, fontSize }) {
const ROLE_EMOJI = {
  red: '🔴',
  white: '⚪',
  blue: '🔵',
  black: '⚫',
};


  const { apiUrl } = useGame();

  const renderArrows = () => {
    const arrows = [];

    if (card.movement) {
      for (const dir in card.movement) {
        if (card.movement[dir]) {
          arrows.push(
            <div
              key={`movement-${dir}`}
              className={`arrow ${dir} ${card.role || 'white'}`}
            ></div>
          );

          if (card.movement[dir] === 2) {
            arrows.push(
              <div
                key={`movement-${dir}-2`}
                className={`arrow ${dir}2 ${card.role || 'white'}`}
              ></div>
            );
          }
        }
      }
    } else if (card.type === 'sorcery' && Array.isArray(card.activation_needs)) {
      for (const dir of card.activation_needs) {
        arrows.push(
          <div
            key={`sorcery-${dir}`}
            className={`arrow ${dir} ${card.role || 'white'}`}
          ></div>
        );
      }
    } else if (card.type === 'land' && Array.isArray(card.creation_needs)) {
      for (const dir of card.creation_needs) {
        arrows.push(
          <div
            key={`land-${dir}`}
            className={`arrow ${dir} ${card.role || 'white'}`}
          ></div>
        );
      }
    }


    return arrows;
  };

  return (
    <div
      className={`play-card ${card.type}-card`}
      style={{ fontSize }}
    >

      <div className="card-content">

        <CardImage 
          card={card} 
          apiUrl={apiUrl}
        />
                <div className="title-bar">
          {ROLE_EMOJI[card.role]}
          {card.name}
          <div className="mana-cost">🩸 {card.mana || 0}</div>
        </div>

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
