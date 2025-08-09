import React from 'react'
import { useGame } from '../context/GameContext';
import ManaBar from './ManaBar';

function Detail() {
    const {userId, mana, deckSizes} = useGame()
  return (
    <div className="detail">
          <h2 id="userH2">User: {userId}</h2>
          {/* <h6 id="manaH6">Mana: {mana[userId]}</h6> */}
          <ManaBar mana={mana[userId]} />
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