// GraveyardTargets.jsx
import React from "react";
import Card from "./Card";
import { useGame } from "../context/GameContext";

function GraveyardTargets({ wsRef }) {
  const { interaction, userId, sendSorceryStep, graveyard1, graveyard2 } = useGame();

  const awaiting = interaction?.awaiting;
  const amActor = interaction?.owner === userId;

  // Show only when the engine is asking *me* to pick a graveyard card
  const isOpen = Boolean(
    amActor && awaiting && awaiting.kind === "select_graveyard_card"
  );

  // Use suggestions from backend if available, otherwise show current graveyard
  const currentGraveyard = userId === "1" ? graveyard1 : graveyard2;
  const cards = isOpen ? (awaiting.suggestions || currentGraveyard) : [];

  const handlePick = (cardId) => {
    // Reply to the step; server validates everything
    sendSorceryStep(wsRef, { card_id: cardId });
  };

  if (!isOpen) return null;

  return (
    <div className="tutoring-popup-overlay">
      <div className="tutoring-popup-content">
        <h2>Select a card from your graveyard</h2>

        {cards.length === 0 ? (
          <div className="muted">No valid cards to choose from graveyard.</div>
        ) : (
          <div className="tutoring-card-list">
            {cards.map((card) => (
              <div
                key={card.id}
                style={{ height: "22vw", cursor: "pointer" }}
                onClick={() => handlePick(card.id)}
                title={`Pick ${card.name}`}
              >
                <Card card={card} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GraveyardTargets;
