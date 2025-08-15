import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Room from './components/Room'
import CardSVG from './components/CardSVG'


function App() {
  return (
    <>
    <Routes>
    <Route path='/room/:id' element={<Room />}></Route>
    <Route path='/card' element={<CardSVG
  width={232} height={325}
  card={{
    type: "monster",
    role: "aggressor",
    name: "Celestial Titan",
    mana: 5,
    image: "/static/cards/celestial_titan.png",
    attack: 200, defense: 250,
    movement: { right: 2, down: 1 } // 1 right, 2 right (shows ×2 badge), and 1 down
  }}
  isOwnerView={true}
/>
}></Route>
    </Routes>
        
    </>
  )
}

export default App