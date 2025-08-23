// util/highlightsLS.js
export const CellStatus = {
  FREE: 'FREE',
  PAYABLE: 'PAYABLE',
  INSUFFICIENT: 'INSUFFICIENT',
};

// perspective-aware direction vectors
function directionsFor(userId) {
  return {
    forward:        userId === '1' ? [-1, 0] : [ 1, 0],
    back:           userId === '1' ? [ 1, 0] : [-1, 0],
    left:           userId === '1' ? [ 0,-1] : [ 0, 1],
    right:          userId === '1' ? [ 0, 1] : [ 0,-1],
    'forward-left': userId === '1' ? [-1,-1] : [ 1, 1],
    'forward-right':userId === '1' ? [-1, 1] : [ 1,-1],
    'back-left':    userId === '1' ? [ 1,-1] : [-1, 1],
    'back-right':   userId === '1' ? [ 1, 1] : [-1,-1],
  };
}
const flipDir = {
  forward: 'back', back: 'forward',
  left: 'right', right: 'left',
  'forward-left': 'back-right', 'forward-right': 'back-left',
  'back-left': 'forward-right', 'back-right': 'forward-left',
};

// ---- local mirror of evaluate_creation_or_activation_needs ----
function clientEvaluateNeeds(card, userId, board, landBoard, x, y) {
  const needs = card.type === 'sorcery' ? (card.activation_needs || []) : (card.creation_needs || []);
  if (!needs.length) return 2; // BE: "No needs? Always playable for free"

  const dirs = directionsFor(userId);
  const rows = board.length, cols = board[0].length;

  const results = [];
  for (const dir of needs) {
    const vec = dirs[dir];
    if (!vec) return 0;
    const [dx, dy] = vec;
    const tx = x + dx, ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= rows || ty >= cols) return 0;

    const neighbor = board[tx]?.[ty] || null;
    const landTile = landBoard[tx]?.[ty] || null;

    // default = not satisfied
    let r = 0;

    // Monster neighbor rule (your FE already uses movement toward the origin cell)
    if (neighbor && neighbor.type === 'monster' && neighbor.owner === userId) {
      const opposite = flipDir[dir];
      const mv = neighbor.movement?.[opposite];
      if (mv === 1 || mv === 2 || mv === 'any') {
        // Exact "role" match ⇒ treat as FREE (2), else satisfied but paid (1)
        r = (card.role && neighbor.role && neighbor.role === card.role) ? 2 : 1;
      }
    }

    // Land neighbor rule
    if (r === 0 && landTile && landTile.owner === userId) {
      const opp = flipDir[dir];
      if (Array.isArray(landTile.creation_needs) && landTile.creation_needs.includes(opp)) {
        r = (card.role && landTile.role && landTile.role === card.role) ? 2 : 1;
      }
    }

    results.push(r);
  }

  if (results.every(v => v === 2)) return 2;
  if (results.every(v => v >= 1)) return 1;
  return 0;
}

/**
 * Compute per-tile highlight map for a LAND or SORCERY.
 * Returns: { [cellKey]: { status: 'FREE'|'PAYABLE'|'INSUFFICIENT', cost: number } }
 */
export function computeLSHighlights({ card, mode, userId, board, landBoard, mana }) {
  if (!card || !board?.length || !board[0]?.length) return {};
  const rows = board.length, cols = board[0].length;
  const myMana = Number(mana?.[userId] ?? 0);
  const fullCost = Number(card.mana ?? 0);

  const map = {};

  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      // eligibility differences
      if (mode === 'land') {
        if (landBoard?.[x]?.[y]) continue;
        if (board?.[x]?.[y]) continue;
      }
      // sorcery: let needs drive valid targets; optional extra filters can be added in caller if needed

      const statusCode = clientEvaluateNeeds(card, userId, board, landBoard, x, y); // 0/1/2 like BE
      if (statusCode === 0) continue;

      let status, cost;
      if (statusCode === 2) {
        status = CellStatus.FREE; cost = 0;
      } else {
        cost = fullCost;
        status = (myMana >= cost) ? CellStatus.PAYABLE : CellStatus.INSUFFICIENT;
      }

      map[`${x}-${y}`] = { status, cost };
    }
  }

  return map;
}


// util/highlightsLS.js
export const CardStatus = {
  FREE: 'FREE',
  PAYABLE: 'PAYABLE',
  INSUFFICIENT: 'INSUFFICIENT',
  UNPLAYABLE: 'UNPLAYABLE',
};

export function summarizeCardStatusFromMap(highlightMap) {
  let sawPayable = false, sawInsufficient = false, any = false;
  for (const k in highlightMap) {
    any = true;
    const st = highlightMap[k].status;
    if (st === 'FREE') return CardStatus.FREE;
    if (st === 'PAYABLE') sawPayable = true;
    if (st === 'INSUFFICIENT') sawInsufficient = true;
  }
  if (!any) return CardStatus.UNPLAYABLE;
  if (sawPayable) return CardStatus.PAYABLE;
  if (sawInsufficient) return CardStatus.INSUFFICIENT;
  return CardStatus.UNPLAYABLE;
}
