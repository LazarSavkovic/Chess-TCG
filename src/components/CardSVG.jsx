// CardSVG.jsx
import React from "react";

const ROLE = {
  aggressor: { emoji: "⚔️", accent: "#E05353" },
  sentinel:  { emoji: "🛡️", accent: "#808080" },
  manipulator:{ emoji: "🧠", accent: "#E28BD1" },
  walker:    { emoji: "🌀", accent: "#6EAEE8" },
  breaker:   { emoji: "☠️", accent: "#8A8A8A" },
};

const BASE_BY_TYPE = {
  monster: "#F4D35E", // yellowish
  sorcery: "#7A4B9A", // purple
  land:    "#3C7CC2", // blue
};

function Arrow({ x, y, angle, color, range }) {
  const size = 18;
  const badge = range === 2 ? (
    <g transform={`translate(${x}, ${y}) rotate(${angle}) translate(${size * 0.8}, -${size * 0.1})`}>
      <rect x="-8" y="-10" rx="4" ry="4" width="16" height="12" fill={color} />
      <text x="0" y="-1" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">×2</text>
    </g>
  ) : null;

  const shimmer = range === "any" ? (
    <animate attributeName="opacity" values="0.6;1;0.6" dur="1.1s" repeatCount="indefinite" />
  ) : null;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <polygon
        points={`0,-${size} ${size*0.7},${size*0.6} -${size*0.7},${size*0.6}`}
        fill={color}
        opacity={range === 1 ? 0.95 : 1}
        filter="url(#shadow)"
      >
        {shimmer}
      </polygon>
      {badge}
    </g>
  );
}

// edge anchors for arrows
function dirAnchor(dir) {
  const cx = 150, cy = 224;
  const left = 28, right = 272, top = 104, bottom = 344;
  switch (dir) {
    case "forward":        return { x: cx,   y: top,    angle: 0 };
    case "back":           return { x: cx,   y: bottom, angle: 180 };
    case "left":           return { x: left, y: cy,     angle: -90 };
    case "right":          return { x: right,y: cy,     angle: 90 };
    case "forward-left":   return { x: left, y: top,    angle: -45 };
    case "forward-right":  return { x: right,y: top,    angle: 45 };
    case "back-left":      return { x: left, y: bottom, angle: -135 };
    case "back-right":     return { x: right,y: bottom, angle: 135 };
    default:               return { x: cx,   y: cy,     angle: 0 };
  }
}

function flipDir(dir) {
  const map = {
    "forward":"back","back":"forward",
    "left":"right","right":"left",
    "forward-left":"back-right","forward-right":"back-left",
    "back-left":"forward-right","back-right":"forward-left",
  };
  return map[dir] || dir;
}

export default function CardSVG({
  width = "100%",          // works with % or px
  height = "auto",         // keep aspect ratio
  card,                    // { type, role, name, mana, image, attack, defense, movement, text }
  isOwnerView = true,
}) {
  const vbW = 300, vbH = 430; // fixed layout space
  const role = ROLE[card.role] || { emoji: "🃏", accent: "#FFFFFF" };
  const base = BASE_BY_TYPE[card.type] || "#777";
  const arrowColor = role.accent;

  // movement arrows
  const arrows = [];
  if (card.type === "monster" && card.movement) {
    Object.entries(card.movement).forEach(([dir, range]) => {
      if (!range) return;
      const d = isOwnerView ? dir : flipDir(dir);
      const { x, y, angle } = dirAnchor(d);
      arrows.push({ x, y, angle, range });
    });
  }

  // subtitle under art
  const subtitle = card.type === "monster"
    ? `monster – ${card.role || "unknown"}`
    : card.type;

  const rules = card.text || "No effect.";

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} width={width} height={height} preserveAspectRatio="xMidYMid meet" role="img" aria-label={card.name}>
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodOpacity="0.55" />
        </filter>
        <clipPath id="artClip"><rect x="20" y="90" width="260" height="190" rx="10"/></clipPath>
      </defs>

      {/* Outer frame with accent stroke */}
      <rect x="0" y="0" width={vbW} height={vbH} rx="20" fill={base} />
      <rect x="6" y="6" width={vbW-12} height={vbH-12} rx="16" fill="#000" opacity="0.12" />
      <rect x="8" y="8" width={vbW-16} height={vbH-16} rx="16" fill={base} stroke={role.accent} strokeWidth="3" opacity="0.9" />

      {/* Title bar with role emoji + name */}
      <rect x="16" y="16" width={vbW-32} height="48" rx="10"
            fill="#000" opacity="0.25" stroke={role.accent} strokeWidth="1.5" />
      <text x="28" y="48" fill="#fff" fontWeight="700" fontSize="22">
        <tspan>{role.emoji} </tspan>
        <tspan>{card.name}</tspan>
      </text>

      {/* Mana gem */}
      <g transform={`translate(${vbW-38}, 30)`}>
        <circle r="12" fill="#ff6ea0" filter="url(#shadow)"/>
        <text x="0" y="5" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">{card.mana ?? 0}</text>
      </g>

      {/* Art with rounded clip + accent border */}
      <rect x="18" y="88" width="264" height="194" rx="12" fill="none" stroke={role.accent} strokeWidth="2" opacity="0.9"/>
      {card.image && (
        <image href={card.image} x="20" y="90" width="260" height="190" clipPath="url(#artClip)" preserveAspectRatio="xMidYMid slice" />
      )}

      {/* Movement arrows (monsters) */}
      {arrows.map((a, i) => (
        <Arrow key={i} x={a.x} y={a.y} angle={a.angle} color={arrowColor} range={a.range} />
      ))}

      {/* Subtitle: type – role */}
      <rect x="16" y="290" width={vbW-32} height="28" rx="8" fill="#000" opacity="0.20" />
      <text x="20" y="309" fontSize="14" fill="#fff" opacity="0.95">
        {subtitle}
      </text>

      {/* Rules / effect text box */}
      <rect x="16" y="324" width={vbW-32} height="64" rx="8"
            fill="#000" opacity="0.12" stroke={role.accent} strokeWidth="1"/>
      <foreignObject x="20" y="328" width={vbW-40} height="56">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style={{fontSize: "13px", color: "white", lineHeight: "1.25", fontFamily: "system-ui, sans-serif", opacity: 0.95}}>
          {rules}
        </div>
      </foreignObject>

      {/* ATK/DEF (monsters only) */}
      {card.type === "monster" && (
        <>
          <rect x="16" y={vbH-46} width={vbW-32} height="30" rx="10"
                fill="#000" opacity="0.22" stroke={role.accent} strokeWidth="1" />
          <text x="42" y={vbH-26} fontSize="16" fill="#fff" fontWeight="700">ATK:</text>
          <text x="84" y={vbH-26} fontSize="16" fill="#fff">{card.attack ?? 0}</text>
          <text x={vbW-130} y={vbH-26} fontSize="16" fill="#fff" fontWeight="700">DEF:</text>
          <text x={vbW-88} y={vbH-26} fontSize="16" fill="#fff">{card.defense ?? 0}</text>
        </>
      )}
    </svg>
  );
}
