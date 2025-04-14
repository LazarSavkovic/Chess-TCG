import React from 'react'
import { useGame } from '../context/GameContext'

function Notifications() {
    const {notifications} = useGame()
  return (
          <div id="notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`notification ${n.color}`}>
              {n.message}
            </div>
          ))}
        </div>
  )
}

export default Notifications