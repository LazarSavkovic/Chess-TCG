// ManaBar.jsx
import React from "react";
import { useGame } from "../context/GameContext";

export default function ManaBar({ mana, isOpponent }) {
  const { userId} = useGame()
  const maxMana = 50;
  const percentage = Math.max(0, Math.min(100, (mana / maxMana) * 100));
  // Determine the "logical" player ID for this bar
  const barOwnerId = isOpponent ? (userId === "1" ? "2" : "1") : userId;

  // Pick bar color based on that ID
  const barColor = barOwnerId === "2" ? "#FFD700" : "#1E90FF"; // gold for p2, blue for p1


  return (
    <div style={{ width: "130%", margin: '8px', backgroundColor: "#333", borderRadius: "8px", padding: "4px" }}>
      <div
        style={{
          width: `${percentage}%`,
          height: "16px",
          backgroundColor: barColor,
          borderRadius: "6px",
          transition: "width 0.3s ease",
        }}
      ></div>
      <p style={{ margin: "4px 0 0 0", fontSize: "12px", textAlign: "center", color: "#fff" }}>
        Mana: {mana}/{maxMana}
      </p>
    </div>
  );
}
