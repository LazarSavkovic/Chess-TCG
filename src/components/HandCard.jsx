import React from 'react'
import { useGame } from '../context/GameContext';

function HandCard({card, wsRef, i}) {
    const {userId , setCardPreview, setSelectedHandIndex, highlightPlaceActivateZones, highlightSummonZones,selectedHandIndex, apiUrl, pendingDiscard} = useGame()
  return (
    <div
    key={card.id}
    id={`card-${card.id}`}
    className={`hand-card user-${card.owner} ${selectedHandIndex === i ? 'selected' : ''}`}
    style={{
      backgroundImage: `url(${apiUrl}/${card.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      textShadow: '0 0 4px black',
    }}
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
          highlightPlaceActivateZones();
        }
      }
    }}
  >
    {card.owner !== userId && '🂠'}
    {card.type === 'monster' && (
      <div
        className="card-info"
        style={{
          position: 'absolute',
          top: '1vh',
          left: '0.5vw',
          right: '0.5vw',
          fontSize: '1.12vw',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '0.62vw',
        }}
      >
        {card.name}
        <br />
        {card.attack} / {card.defense}
      </div>
    )}
    {card.type === 'sorcery' && (
      <div
        className="card-info"
        style={{
          position: 'absolute',
          top: '1vh',
          left: '0.5vw',
          right: '0.5vw',
          fontSize: '1.12vw',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '0.62vw',
        }}
      >
        {card.name}
        <br />
        (Sorcery)
      </div>
    )}
    {card.type === 'land' && (
      <div
        className="card-info"
        style={{
          position: 'absolute',
          top: '1vh',
          left: '0.5vw',
          right: '0.5vw',
          fontSize: '1.12vw',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '0.62vw',
        }}
      >
        {card.name}
        <br />
        (Land)
      </div>
    )}
  </div>
  )
}

export default HandCard