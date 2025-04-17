import React from 'react'
import { useGame } from '../context/GameContext';
import Card from './Card';

function HandCard({card, wsRef, i}) {
    const { setCardPreview, setSelectedHandIndex, highlightPlaceActivateZones, highlightSummonZones,selectedHandIndex, apiUrl, pendingDiscard} = useGame()
  return (
    <div
    id={`card-${card.id}`}
    className={`hand-card user-${card.owner} ${selectedHandIndex === i ? 'selected' : ''}`}
    onMouseEnter={() => setCardPreview(card)}
    onMouseLeave={() => setCardPreview(null)}
    onClick={() => {
      if (pendingDiscard) {
        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'end-turn-with-discard',
              user_id: card.owner,
              slot: i,
            })
          );
        }
      } else {
        setSelectedHandIndex(i);
        if (card.type === 'monster') {
          highlightSummonZones();
        } else {
          highlightPlaceActivateZones(i);
        }
      }
    }}
  >
    {/* {card.owner !== userId && '🂠'} */}
  <Card card={card} fontSize={window.innerWidth < 1000 ? '3px' : '8px'} />
  </div>
  )
}

export default HandCard