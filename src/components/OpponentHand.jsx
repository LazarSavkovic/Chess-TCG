import React from 'react'
import { useGame } from '../context/GameContext';

function OpponentHand() {
    const { hand1, hand2, userId} = useGame()
    const opponentHand = userId === '1' ? hand2 : hand1;
    return (
        <div id="opponent-hand">
          {opponentHand.map((card, i) => (
            <div key={i} className={`hand-card opponent-card user-${card.owner}`} id={`card-${card.id}`}>
              {'🂠'}
            </div>
          ))}
        </div>
      );
}

export default OpponentHand

