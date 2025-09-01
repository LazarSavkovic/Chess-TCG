export function resetSorceries() {
  const board = document.getElementById('board');
  if (!board) return;

  // Remove only sorcery card elements
  board.querySelectorAll('.card-frame').forEach(el => el.remove());

  // If sorcery FX layers were attached separately, clean them too
  board.querySelectorAll('.mm-activation').forEach(el => el.remove());
}
