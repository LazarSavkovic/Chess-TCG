// GraveyardPopup.jsx
import React from "react";
import { useGame } from "../context/GameContext";
import Card from "./Card";

function GraveyardPopup() {
  const {
    userId,
    graveyard1,
    graveyard2,
    showGraveyard,
    setShowGraveyard,
    showGraveyardPlayer,
  } = useGame();

  const graveyard = showGraveyardPlayer === '1' ? graveyard1 : graveyard2;
  const playerName = showGraveyardPlayer === userId ? 'Your' : 'Opponent\'s';

  if (!showGraveyard) return null;

  return (
    <div className="tutoring-popup-overlay">
      <div className="tutoring-popup-content">
        <h2>{playerName} Graveyard</h2>

        {graveyard.length === 0 ? (
          <div className="muted">No cards in graveyard.</div>
        ) : (
          <div className="tutoring-card-list graveyard-list">
            {graveyard.map((card) => (
              <div
                key={card.id}
                style={{ height: "22vw", cursor: "pointer" }}
                title={`${card.name}`}
              >
                <Card card={card} />
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowGraveyard(false)}>Close</button>
      </div>
    </div>
  );
}

export default GraveyardPopup;
