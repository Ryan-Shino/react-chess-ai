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

  // Calculate total material
  let whiteMaterial = 0;
  let blackMaterial = 0;

  // Evaluate pieces
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const color = piece.color;
      const sq = String.fromCharCode(97 + f) + (8 - r);
      let val = VALUE[piece.type];

      if (color === 'w') whiteMaterial += VALUE[piece.type];
      else blackMaterial += VALUE[piece.type];

      // ======== PIECE SECURITY & CAPTURING FREE PIECES ========
      const attackers = color === 'w' ? (pieceAttackMap[sq]?.b || 0) : (pieceAttackMap[sq]?.w || 0);
      const defenders = color === 'w' ? (pieceAttackMap[sq]?.w || 0) : (pieceAttackMap[sq]?.b || 0);

      // LARGE BONUS for free pieces (undefended and attackable)
      if (attackers > 0 && defenders === 0 && piece.type !== 'k') {
        const freePieceBonus = attackers * VALUE[piece.type] * 0.8;
        val += freePieceBonus; // Strong incentive to capture
      } 
      // Heavy penalty for undefended pieces that can be captured
      else if (attackers > defenders && piece.type !== 'k') {
        const undefendedPenalty = (attackers - defenders) * VALUE[piece.type] * 0.5;
        val -= undefendedPenalty;
      }

      // Reward defended pieces
      if (defenders > 0 && piece.type !== 'k') {
        val += defenders * 15;
      }

      // ======== CENTRE CONTROL ========
      if (CENTRE_SQUARES.has(sq)) {
        val += 30;
      }

      // ======== PIECE ACTIVITY ========
      const pieceMoveCount = movesVerbose.filter(m => m.from === sq).length;
      if (piece.type !== 'k' && pieceMoveCount === 0) {
        val -= 20;
      } else if (piece.type !== 'p') {
        // Heavily penalize early queen moves (opening phase)
        if (piece.type === 'q' && moveCount < 10) {
          val -= pieceMoveCount * 5; // Queen out early is bad
        } else {
          val += Math.min(pieceMoveCount * 2, 20);
        }
      }

      if (color === 'w') whiteScore += val;
      else blackScore += val;
    }
  }

  // ======== MIDDLEGAME TRADE INCENTIVE ========
  const isMiddlegame = moveCount >= 20 && moveCount < 40;
  const materialDifference = Math.abs(whiteMaterial - blackMaterial);
  
  if (isMiddlegame) {
    // Encourage trading when ahead in material
    if (whiteMaterial > blackMaterial) {
      whiteScore += (whiteMaterial - blackMaterial) * 0.1;
    } else if (blackMaterial > whiteMaterial) {
      blackScore += (blackMaterial - whiteMaterial) * 0.1;
    }
  }

  // ======== OPENING BOOK BONUS ========
  const isOpeningPhase = moveCount < 20;
  if (isOpeningPhase && openingBook[game.fen()]) {
    // Large bonus for following theory in opening
    if (game.turn() === 'w') {
      whiteScore += 200;
    } else {
      blackScore += 200;
    }
  }

  // ======== ENDGAME STRENGTHENING ========
  const isEndgame = moveCount >= 40;
  if (isEndgame) {
    // Bonus for passed pawns increases dramatically in endgame
    whiteScore += evaluateEndgamePawns(board, 'w', true);
    blackScore += evaluateEndgamePawns(board, 'b', true);
  
  } else {
    // Regular pawn structure evaluation in opening/middlegame
    whiteScore += evaluatePawnStructure(board, 'w');
    blackScore += evaluatePawnStructure(board, 'b');
  }

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
        score += (7 - distanceToPromotion) * 50;
      }

      // ======== DOUBLED/TRIPLED PAWNS ========
      const doubledCount = countDoubledPawns(board, f, isWhite);
      if (doubledCount > 0) {
        score -= doubledCount * 30;
      }

      // ======== ISOLATED PAWNS ========
      if (isIsolatedPawn(board, f, isWhite)) {
        score -= 20;
      }
    }
  }

  return score;
}

function evaluateEndgamePawns(board, color, isEndgame) {
  let score = 0;
  const isWhite = color === 'w';

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece || piece.type !== 'p' || piece.color !== color) continue;

      if (isPassedPawn(board, r, f, isWhite)) {
        const distanceToPromotion = isWhite ? (7 - r) : r;
        // Much higher bonus in endgame
        score += (8 - distanceToPromotion) * 100;
      }

      const doubledCount = countDoubledPawns(board, f, isWhite);
      if (doubledCount > 0) {
        score -= doubledCount * 30;
      }

      if (isIsolatedPawn(board, f, isWhite)) {
        score -= 25;
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
  return Math.max(0, count - 1);
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