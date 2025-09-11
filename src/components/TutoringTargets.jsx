// TutoringTargets.jsx
import React from "react";
import Card from "./Card";
import { useGame } from "../context/GameContext";

function TutoringTargets({ wsRef }) {
  const { interaction, userId, sendSorceryStep } = useGame();

  const awaiting = interaction?.awaiting;
  const amActor = interaction?.owner === userId;

  // Show only when the engine is asking *me* to pick a deck card
  const isOpen = Boolean(
    amActor && awaiting && awaiting.kind === "select_deck_card"
  );

  const cards = isOpen ? awaiting.suggestions || [] : [];

  const handlePick = (cardId) => {
    // Reply to the step; server validates everything
    sendSorceryStep(wsRef, { card_id: cardId });
  };

  if (!isOpen) return null;

  return (
    <div className="tutoring-popup-overlay">
      <div className="tutoring-popup-content">
        <h2>Select a card from your deck</h2>

        {cards.length === 0 ? (
          <div className="muted">No valid cards to choose.</div>
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

export default TutoringTargets;
