// TurnActions.jsx
import React from "react";
import { useGame } from "../context/GameContext";

export default function TurnActions() {
  const { actionsThisTurn, userId } = useGame();

  const flags = actionsThisTurn?.[userId] || {
    summoned: false,
    sorcery_used: false,
    land_placed: false,
  };

  // available = not used this turn
  const items = [
    { key: "summoned", label: "Summon", emoji: "🗡️", used: flags.summoned },
    { key: "sorcery_used", label: "Sorcery", emoji: "📜", used: flags.sorcery_used },
    { key: "land_placed", label: "Land", emoji: "🪨", used: flags.land_placed },
  ];

  const activeColor = userId === "2" ? "#FFD700" : "#1E90FF"; // gold or blue

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 6, flexDirection: 'column', alignItems: 'center' }}>
      {items.map((it) => {
        const available = !it.used;
        return (
          <div
            key={it.key}
            title={`${it.label}: ${available ? "Available" : "Used this turn"}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: 8,
              backgroundColor: available ? activeColor : "#333",
              opacity: available ? 1 : 0.5,
              color: "#fff",
              fontSize: 14,
              transition: "opacity 0.2s ease",
            }}
          >
            <span style={{ fontSize: 16, color:  userId === "1" ? "white" : 'black' }}>{it.emoji}</span>
            <span  style={{ fontSize: 16, color:  userId === "1" ? "white" : 'black' }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
