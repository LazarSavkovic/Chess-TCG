// Returns { status: 'FREE' | 'PAYABLE' | 'UNPLAYABLE', cost: number }
export const evaluateTileForCard = (card, x, y, board, landBoard, userId) => {
  // Sorceries use activation_needs; Lands use creation_needs
  const needs = card.type === 'sorcery' ? card.activation_needs : card.creation_needs;
  if (!Array.isArray(needs) || needs.length === 0) {
    return { status: 'FREE', cost: 0 };
  }

  // For lands, tile must be empty on BOTH layers
  if (card.type === 'land') {
    if (landBoard[x]?.[y] || board[x]?.[y]) {
      return { status: 'UNPLAYABLE', cost: card.mana ?? 0 };
    }
  }

  // Perspective-aware offsets
  const dirs = {
    forward:       userId === '1' ? [-1, 0] : [ 1, 0],
    back:          userId === '1' ? [ 1, 0] : [-1, 0],
    left:          userId === '1' ? [ 0,-1] : [ 0, 1],
    right:         userId === '1' ? [ 0, 1] : [ 0,-1],
    'forward-left': userId === '1' ? [-1,-1] : [ 1, 1],
    'forward-right':userId === '1' ? [-1, 1] : [ 1,-1],
    'back-left':    userId === '1' ? [ 1,-1] : [-1, 1],
    'back-right':   userId === '1' ? [ 1, 1] : [-1,-1],
  };

  const flip = {
    forward: 'back',
    back: 'forward',
    left: 'right',
    right: 'left',
    'forward-left': 'back-right',
    'forward-right': 'back-left',
    'back-left': 'forward-right',
    'back-right': 'forward-left',
  };

  let allValid = true;
  let allRoleMatch = true;

  for (const need of needs) {
    const off = dirs[need];
    if (!off) { allValid = false; break; }
    const tx = x + off[0], ty = y + off[1];

    if (tx < 0 || tx >= board.length || ty < 0 || ty >= (board[0]?.length || 0)) {
      allValid = false; break;
    }

    const neighbor = board[tx]?.[ty] || null;
    const neighborLand = landBoard[tx]?.[ty] || null;
    let valid = false;
    let roleMatch = false;

    // A friendly monster can satisfy if it can "step back" toward (x,y)
    if (neighbor && neighbor.type === 'monster' && neighbor.owner === userId) {
      const backDir = flip[need];
      const mv = neighbor.movement?.[backDir];
      if (mv === 1 || mv === 2 || mv === 'any') {
        valid = true;
        roleMatch = !!card.role && neighbor.role === card.role;
      }
    }

    // A friendly land can satisfy if its creation_needs include the flipped dir
    if (!valid && neighborLand && neighborLand.owner === userId) {
      const backDir = flip[need];
      if (Array.isArray(neighborLand.creation_needs) && neighborLand.creation_needs.includes(backDir)) {
        valid = true;
        roleMatch = !!card.role && neighborLand.role === card.role;
      }
    }

    if (!valid) {
      allValid = false;
      break;
    }
    if (!roleMatch) {
      allRoleMatch = false;
    }
  }

  if (!allValid) return { status: 'UNPLAYABLE', cost: card.mana ?? 0 };
  if (allRoleMatch) return { status: 'FREE', cost: 0 };
  return { status: 'PAYABLE', cost: card.mana ?? 0 };
};
