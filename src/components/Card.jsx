import React from 'react'
import { useGame } from "../context/GameContext";



function Card({card, fontSize}) {
    
const {apiUrl} = useGame()

  return (
    <div
    className={`play-card ${
      card.type === 'monster'
        ? 'monster-card'
        : card.type === 'sorcery'
        ? 'sorcery-card'
        : 'land-card'
    }`}
    style={{fontSize}}
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
      <div className="type-line">
        {card.subtype || (card.type ? `(${card.type})` : '')}
      </div>
      <div className="rules-text">
        {card.text || card.description || 'No effect.'}
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
  )
}

export default Card