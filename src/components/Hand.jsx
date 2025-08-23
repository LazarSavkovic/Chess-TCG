// Hand.jsx
import React, { useMemo } from "react";
import { useGame } from "../context/GameContext";
import HandCard from "./HandCard";
import { computeLSHighlights, summarizeCardStatusFromMap, CardStatus } from "../util/highlightsLS";

function Hand({ wsRef }) {
  const { hand1, hand2, userId, board, landBoard, mana } = useGame();
  const currentHand = userId === "1" ? hand1 : hand2;

  const handStatuses = useMemo(() => {
    return currentHand.map((card) => {
      if (!card || card.type !== "sorcery") return CardStatus.UNPLAYABLE; // ignoring monsters for now
      const map = computeLSHighlights({ card, mode: "sorcery", userId, board, landBoard, mana });
      return summarizeCardStatusFromMap(map);
    });
  }, [currentHand, userId, board, landBoard, mana]);

  return (
    <div id="hand">
      {currentHand.map((card, i) => (
        <HandCard key={card?.id ?? i} card={card} i={i} wsRef={wsRef} playStatus={handStatuses[i]} />
      ))}
    </div>
  );
}
export default Hand;
