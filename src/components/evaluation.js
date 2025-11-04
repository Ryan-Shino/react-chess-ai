import { openingBook } from './openings';


export function boardEvaluation(game) {

  if (game.isCheckmate()) {
    return game.turn() === 'w' ? 100000 : -100000;
  }
  if (game.isStalemate() || game.isDraw()) {
    return 0;
  }

  const board = game.board();
  const movesVerbose = game.moves({ verbose: true });
  const moveCount = game.history().length;

  const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  const CENTRE_SQUARES = new Set(['d4', 'd5', 'e4', 'e5', 'c4', 'c5', 'd3', 'd6', 'e3', 'e6']);

  let whiteScore = 0;
  let blackScore = 0;

  const pieceAttackMap = {};

  // Count attacks on each square
  for (const move of movesVerbose) {
    if (move.to) {
      pieceAttackMap[move.to] = pieceAttackMap[move.to] || { w: 0, b: 0 };
      pieceAttackMap[move.to][move.color]++;
    }
  }

  // Evaluate pieces
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const color = piece.color;
      const sq = String.fromCharCode(97 + f) + (8 - r);
      let val = VALUE[piece.type];

      // ======== PIECE SECURITY ========
      const attackers = color === 'w' ? (pieceAttackMap[sq]?.b || 0) : (pieceAttackMap[sq]?.w || 0);
      const defenders = color === 'w' ? (pieceAttackMap[sq]?.w || 0) : (pieceAttackMap[sq]?.b || 0);

      // Heavy penalty for undefended pieces (especially valuable ones)
      if (attackers > defenders && piece.type !== 'k') {
        const undefendedPenalty = (attackers - defenders) * VALUE[piece.type] * 0.5;
        val -= undefendedPenalty;
      }

      // Reward defended pieces
      if (defenders > 0) {
        val += defenders * 15;
      }

      // ======== CENTRE CONTROL ========
      if (CENTRE_SQUARES.has(sq)) {
        val += 30; // Bonus for controlling centre
      }

      // ======== PIECE ACTIVITY ========
      // Penalize pieces that have very few moves
      const pieceMoveCount = movesVerbose.filter(m => m.from === sq).length;
      if (piece.type !== 'k' && pieceMoveCount === 0) {
        val -= 20; // Trapped piece penalty
      } else if (piece.type !== 'p') {
        val += Math.min(pieceMoveCount * 2, 20); // Slight bonus for active pieces
      }

      if (color === 'w') whiteScore += val;
      else blackScore += val;
    }
  }

  // ======== OPENING BOOK BONUS ========
  const isOpeningPhase = moveCount < 20;
  if (isOpeningPhase && openingBook[game.fen()]) {
    blackScore += 80; // Reward for following theory
  }

  // ======== PAWN STRUCTURE ========
  whiteScore += evaluatePawnStructure(board, 'w');
  blackScore += evaluatePawnStructure(board, 'b');

  return whiteScore - blackScore;
}

function evaluatePawnStructure(board, color) {
  let score = 0;
  const isWhite = color === 'w';

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece || piece.type !== 'p' || piece.color !== color) continue;

      // ======== PASSED PAWNS ========
      if (isPassedPawn(board, r, f, isWhite)) {
        const distanceToPromotion = isWhite ? (7 - r) : r;
        score += (7 - distanceToPromotion) * 50; // Bonus increases as pawn advances
      }

      // ======== DOUBLED/TRIPLED PAWNS ========
      const doubledCount = countDoubledPawns(board, f, isWhite);
      if (doubledCount > 0) {
        score -= doubledCount * 30; // Penalty for doubled pawns
      }

      // ======== ISOLATED PAWNS ========
      if (isIsolatedPawn(board, f, isWhite)) {
        score -= 20;
      }
    }
  }

  return score;
}

function isPassedPawn(board, row, file, isWhite) {
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? row - 1 : row + 1;

  for (let r = startRow; isWhite ? r >= 0 : r < 8; r += direction) {
    for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
      const piece = board[r][f];
      if (piece && piece.type === 'p' && piece.color !== (isWhite ? 'w' : 'b')) {
        return false;
      }
    }
  }
  return true;
}

function countDoubledPawns(board, file, isWhite) {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    const piece = board[r][file];
    if (piece && piece.type === 'p' && piece.color === (isWhite ? 'w' : 'b')) {
      count++;
    }
  }
  return Math.max(0, count - 1); // Return number beyond the first
}

function isIsolatedPawn(board, file, isWhite) {
  const leftFile = file - 1;
  const rightFile = file + 1;
  const color = isWhite ? 'w' : 'b';

  for (let r = 0; r < 8; r++) {
    if (leftFile >= 0) {
      const leftPiece = board[r][leftFile];
      if (leftPiece && leftPiece.type === 'p' && leftPiece.color === color) return false;
    }
    if (rightFile <= 7) {
      const rightPiece = board[r][rightFile];
      if (rightPiece && rightPiece.type === 'p' && rightPiece.color === color) return false;
    }
  }
  return true;
}
