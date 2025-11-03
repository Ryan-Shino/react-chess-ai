import { openingBook } from './openings';

export function boardEvaluation(game) {
  // ======== Terminal States ========
  if (game.isCheckmate()) {
    // If it's white's turn, white has no moves, black just delivered checkmate
    return game.turn() === 'w' ? 100000 : -100000;
  }
  if (game.isStalemate() || game.isDraw()) {
    return 0; // neutral
  }

  const board = game.board();
  const movesVerbose = game.moves({ verbose: true });

  const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  let whiteScore = 0;
  let blackScore = 0;

  const piecePositions = { w: [], b: [] };
  const pieceAttackMap = {};

  // Build piece list and attack map
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const color = piece.color;
      const sq = String.fromCharCode(97 + f) + (8 - r); // e4 format
      piecePositions[color].push({ type: piece.type, sq });

      pieceAttackMap[sq] = { w: 0, b: 0 };
    }
  }

  // Count attacks on each square
  for (const move of movesVerbose) {
    if (move.to) {
      pieceAttackMap[move.to] = pieceAttackMap[move.to] || { w: 0, b: 0 };
      pieceAttackMap[move.to][move.color]++;
    }
  }

  // Evaluate pieces
  for (const color of ['w', 'b']) {
    for (const p of piecePositions[color]) {
      let val = VALUE[p.type];

      // Penalize if the piece is attacked
      const attackers = color === 'w' ? (pieceAttackMap[p.sq]?.b || 0) : (pieceAttackMap[p.sq]?.w || 0);
      val -= attackers * 20;

      // Reward if the piece is defended
      const defenders = color === 'w' ? (pieceAttackMap[p.sq]?.w || 0) : (pieceAttackMap[p.sq]?.b || 0);
      val += defenders * 10;

      if (color === 'w') whiteScore += val;
      else blackScore += val;
    }
  }

  // Reward sticking to opening book
  if (openingBook[game.fen()]) {
    blackScore += 50; // AI is black
  }

  return whiteScore - blackScore;
}
