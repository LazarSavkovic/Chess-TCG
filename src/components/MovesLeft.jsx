// MovesLeft.jsx
import React from "react";

export default function MovesLeft({ movesLeft }) {
  const maxMoves = 3;
  const arrow = "➡️";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ color: "#fff", fontSize: "14px" }}>Moves left:</span>
      {Array.from({ length: maxMoves }, (_, i) => (
        <span
          key={i}
          style={{
            opacity: i < movesLeft ? 1 : 0.3, // dim used moves
            fontSize: "18px",
            transition: "opacity 0.3s ease",
          }}
        >
          {arrow}
        </span>
      ))}
    </div>
  );
}
