import React from 'react'

function PleaseRotate() {
  return (
    <div
    id="rotatePrompt"
    style={{
      display: 'flex',
      position: 'fixed',
      inset: 0,
      background: 'black',
      color: 'white',
      fontSize: '24px',
      zIndex: 9999,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}
  >
    🔄 Please rotate your device to landscape mode
  </div>
  )
}

export default PleaseRotate