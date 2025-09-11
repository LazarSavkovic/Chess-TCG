// Hand.jsx
import React, { useMemo } from "react";
import { useGame } from "../context/GameContext";
import HandCard from "./HandCard";
import { computeLSHighlights, summarizeCardStatusFromMap, CardStatus } from "../util/highlightsLS";

function Hand({ wsRef }) {
  const {
    hand1,
    hand2,
    userId,
    board,
    landBoard,
    mana,
    // NEW (from GameContext)
    interaction,
    isLocked,
    sendSorceryStep,
  } = useGame();

  const currentHand = userId === "1" ? hand1 : hand2;

  // Are we currently asked to discard a card?
  const awaiting = interaction?.awaiting;
  const awaitingDiscard =
    !!awaiting && awaiting.kind === "discard_from_hand"; // BE re-validates owner

  const handStatuses = useMemo(() => {
    return currentHand.map((card) => {
      if (!card || card.type !== "sorcery") return CardStatus.UNPLAYABLE; // ignoring monsters for now
      const map = computeLSHighlights({ card, mode: "sorcery", userId, board, landBoard, mana });
      return summarizeCardStatusFromMap(map);
    });
  }, [currentHand, userId, board, landBoard, mana]);

  // Capture click BEFORE HandCard sees it, only when discarding.
  const onCardClickCapture = (e, index) => {
    if (!awaitingDiscard) return;
    e.preventDefault();
    e.stopPropagation();
    // Respond to the step; server will validate index
    sendSorceryStep(wsRef, { hand_index: index });
  };

  return (
    <div
      id="hand"
      // When locked but not discarding, block all interactions with the hand.
      style={isLocked && !awaitingDiscard ? { pointerEvents: "none", opacity: 0.9 } : undefined}
      title={awaitingDiscard ? "Choose a card to discard" : undefined}
    >
      {currentHand.map((card, i) => (
        <div
          key={card?.id ?? i}
          // Intercept *before* child onClick (so legacy HandCard clicks won't fire)
          onClickCapture={(e) => onCardClickCapture(e, i)}
          // Optional visual cue while discarding
          className={awaitingDiscard ? "hand-discard-choice" : ""}
          style={awaitingDiscard ? { outline: "2px dashed gold", borderRadius: 8 } : undefined}
        >
          <HandCard card={card} i={i} wsRef={wsRef} playStatus={handStatuses[i]} />
        </div>
      ))}
    </div>
  );
}
export default Hand;
