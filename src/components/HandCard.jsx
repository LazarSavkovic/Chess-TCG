// HandCard.jsx
import React from "react";
import { useGame } from "../context/GameContext";
import Card from "./Card";

function HandCard({ card, wsRef, i, playStatus }) {
  const {
    setCardPreview,
    setSelectedLandDeckIndex,
    setSelectedHandIndex,
    highlightPlaceActivateZones,
    highlightSummonZones,
    selectedHandIndex,
    pendingDiscard,
  } = useGame();

  const isFree = playStatus === "FREE";
  const isPayable = playStatus === "PAYABLE";
  const isInsufficient = playStatus === "INSUFFICIENT";
  const isUnplayable = playStatus === "UNPLAYABLE";

  // Monsters are handled separately (you said we can ignore their playStatus)
  const statusClass =
    card.type === "monster"
      ? ""
      : isFree
      ? "is-free"
      : isPayable
      ? "is-payable"
      : isInsufficient
      ? "is-insufficient"
      : "is-unplayable";

  const badgeText =
    card.type === "monster"
      ? null
      : isFree
      ? "Free"
      : isPayable
      ? "Pay"
      : isInsufficient
      ? "Need"
      : null;

  const handleClick = () => {
    if (pendingDiscard) {
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({ type: "end-turn-with-discard", user_id: card.owner, slot: i })
        );
      }
      return;
    }

    if (card.type === "monster") {
      setSelectedHandIndex(i);
      setSelectedLandDeckIndex(null);
      highlightSummonZones(); // optional: highlightSummonZones(card)
      return;
    }

    if (isUnplayable) return; // no valid targets at all
    setSelectedHandIndex(i);
    setSelectedLandDeckIndex(null);
    highlightPlaceActivateZones(i, false); // false = hand (sorcery), not land deck
  };

  return (
    <div
      id={`card-${card.id}`}
      className={[
        "hand-card",
        `user-${card.owner}`,
        selectedHandIndex === i ? "selected" : "",
        statusClass,
      ]
        .filter(Boolean)
        .join(" ")}
      data-play-status={playStatus || ""}
      title={badgeText || ""}
      onMouseEnter={() => setCardPreview(card)}
      onMouseLeave={() => setCardPreview(null)}
      onClick={handleClick}
    >
      {badgeText && (
        <div
          className={[
            "badge",
            isFree ? "badge-free" : isPayable ? "badge-payable" : "badge-insufficient",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {badgeText}
        </div>
      )}
      <Card card={card} fontSize={window.innerWidth < 1000 ? "3px" : "8px"} />
    </div>
  );
}

export default HandCard;
