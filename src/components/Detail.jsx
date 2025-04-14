import React from 'react'
import { useGame } from '../context/GameContext';

function Detail() {
    const {userId, mana, deckSizes} = useGame()
  return (
    <div className="detail">
          <h2 id="userH2">User: {userId}</h2>
          <h6 id="manaH6">Mana: {mana[userId]}</h6>
          <div className="hand-card opponent-card user-2">
            🂠
            <h6 id="deckCount">
              {deckSizes
                ? `${deckSizes[userId]} card${deckSizes[userId] === 1 ? '' : 's'}`
                : '?'}
            </h6>
          </div>
        </div>
  )
}

export default Detail