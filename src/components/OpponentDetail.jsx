import React from 'react'
import { useGame } from '../context/GameContext';
import ManaBar from './ManaBar';

function OpponentDetail() {
    const {userId, mana, deckSizes} = useGame()
  return (
    <div className="opponentDetail">
    {/* <h6 id="opponentManaH6">
      Mana: {userId && (userId === '1' ? mana['2'] : mana['1'])}
    </h6> */}
    <ManaBar mana={userId && (userId === '1' ? mana['2'] : mana['1'])} isOpponent={true} />
    <div className="hand-card opponent-card user-2">
      🂠
      <h6 id="opponentDeckCount">
        {deckSizes
          ? `${deckSizes[userId === '1' ? '2' : '1']} card${deckSizes[userId === '1' ? '2' : '1'] === 1 ? '' : 's'
          }`
          : '?'}
      </h6>
    </div>
    </div>
  )
}

export default OpponentDetail