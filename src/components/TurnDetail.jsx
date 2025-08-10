import React from 'react'
import { useGame } from '../context/GameContext';
import MovesLeft from './MovesLeft';
import TurnActions from './TurnActions';

function TurnDetail({handleEndTurn}) {
    const {turn, userId, movesLeft} = useGame()
    console.log(turn, 'turn')
    console.log(userId, 'userId')
  return (
    <>
    <div className="turnDetail">
    <h5 id="turnH5">{turn === userId ? 'Your turn' : "Opponent's turn"}</h5>
    {/* <h6 id="movesLeft">Moves left: {movesLeft}</h6> */}
    {turn == userId && <>
        <MovesLeft movesLeft={movesLeft} />
    <TurnActions />
    <button id="endTurnBtn" onClick={handleEndTurn}>
      End Turn
    </button>
    </>}

  </div>
  </>
  )
}

export default TurnDetail