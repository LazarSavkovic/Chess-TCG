// LandDeckPopup.jsx
import React, { useMemo } from "react";
import { useGame } from "../context/GameContext";
import Card from "./Card";
import {
  computeLSHighlights,
  summarizeCardStatusFromMap,
  CardStatus,
} from "../util/highlightsLS";

function LandDeckPopup() {
  const {
    userId,
    setSelectedHandIndex,
    landDeck1,
    landDeck2,
    showLandDeck,
    setShowLandDeck,
    setSelectedLandDeckIndex,
    highlightPlaceActivateZones,
    board,
    landBoard,
    mana,
    actionsThisTurn,
  } = useGame();

  const landDeck = userId === "1" ? landDeck1 : landDeck2;

  // Per-card status: FREE | PAYABLE | INSUFFICIENT | UNPLAYABLE
  const deckStatuses = useMemo(() => {
    return landDeck.map((card) => {
      if (!card || card.type !== "land") return CardStatus.UNPLAYABLE;
      const { highlightMap } = (function () {
        const map = computeLSHighlights({
          card,
          userId,
          board,
          landBoard,
          mana,
          actionsThisTurn,
          // isFreeAtLand: (c, x, y, ctx) => !actionsThisTurn?.[userId]?.land_placed, // optional override
        });
        return { highlightMap: map };
      })();
      return summarizeCardStatusFromMap(highlightMap);
    });
  }, [landDeck, userId, board, landBoard, mana, actionsThisTurn]);

  if (!showLandDeck) return null;

  return (
    <div className="tutoring-popup-overlay">
      <div className="tutoring-popup-content">
        <h2>Your Land Deck</h2>
        <div className="tutoring-card-list">
          {landDeck.map((card, i) => {
            const status = deckStatuses[i];
            const statusClass =
              status === CardStatus.FREE
                ? "free"
                : status === CardStatus.PAYABLE
                ? "playable"
                : status === CardStatus.INSUFFICIENT
                ? "insufficient"
                : "unplayable";

            return (
              <div
                key={card.id}
                className={`land-card ${statusClass}`}
                style={{ height: "22vw" }}
                aria-disabled={status === CardStatus.UNPLAYABLE}
                title={
                  status === CardStatus.FREE
                    ? "Free"
                    : status === CardStatus.PAYABLE
                    ? `Costs ${card.mana ?? 0}`
                    : status === CardStatus.INSUFFICIENT
                    ? `Need ${card.mana ?? 0}`
                    : "No valid placement"
                }
                onClick={() => {
                  if (status === CardStatus.UNPLAYABLE) return;
                  setSelectedLandDeckIndex(i);
                  setSelectedHandIndex(null);
                  setShowLandDeck(false);
                  // true => land deck mode
                  highlightPlaceActivateZones(i, true);
                }}
              >
                <Card card={card} />
                {/* optional badge */}
                <div
                  className="status-badge"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {status === CardStatus.FREE
                    ? "Free"
                    : status === CardStatus.PAYABLE
                    ? "Pay"
                    : status === CardStatus.INSUFFICIENT
                    ? "Need"
                    : ""}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowLandDeck(false)}>Close</button>
      </div>
    </div>
  );
}

export default LandDeckPopup;
