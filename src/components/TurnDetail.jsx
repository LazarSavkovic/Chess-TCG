import React from 'react'
import { useGame } from '../context/GameContext';

function TurnDetail({handleEndTurn}) {
    const {turn, userId, movesLeft} = useGame()
  return (
    <div className="turnDetail">
    <h5 id="turnH5">{turn === userId ? 'Your turn' : "Opponent's turn"}</h5>
    <h6 id="movesLeft">Moves left: {movesLeft}</h6>
    <button id="endTurnBtn" onClick={handleEndTurn}>
      End Turn
    </button>
  </div>
  )
}

export default TurnDetail