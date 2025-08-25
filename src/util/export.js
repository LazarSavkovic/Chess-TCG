const EXPORT_VERSION = 1;

export function slugify(s = "") {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// compress cards -> [{card_id, qty, position}]
export function compressById(arr) {
  const m = new Map();
  const order = [];
  for (const c of arr) {
    m.set(c.card_id, (m.get(c.card_id) || 0) + 1);
    if (!order.includes(c.card_id)) order.push(c.card_id);
  }
  return order.map((card_id, i) => ({ card_id, qty: m.get(card_id), position: i }));
}


export function buildDeckExport({ deckName, deckDesc, piles }) {
  const payload = {
    version: EXPORT_VERSION,
    name: deckName || "Untitled Deck",
    description: deckDesc || "",
    exportedAt: new Date().toISOString(),
    piles: {
      MAIN: compressById(piles.MAIN),
      SIDE: compressById(piles.SIDE),
      LAND: compressById(piles.LAND),
    },
    stats: {
      total: piles.MAIN.length + piles.SIDE.length + piles.LAND.length,
      main: piles.MAIN.length,
      side: piles.SIDE.length,
      land: piles.LAND.length,
    },
  };
  return payload;
}

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
