import React from 'react'

function Sounds() {
    return (
        <>
            <audio id="deathSound" src="/sounds/kill.wav" preload="auto"></audio>
            <audio id="spawnSound" src="/sounds/spawn.ogg" preload="auto"></audio>
            <audio id="moveSound" src="/sounds/whoosh.wav" preload="auto"></audio>
        </>
    )
}

export default Sounds