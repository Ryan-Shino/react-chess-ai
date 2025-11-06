import { Chess } from 'chess.js';
import { storePosition, lookupPosition, clearTranspositionTable } from './transpositiontable.js';
import { boardEvaluation } from './evaluation.js'
import { getOpeningMove } from './openings.js'

const getPieceValue = (piece) => {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return values[piece] || 0;
};

// Fast move sorting WITHOUT creating new game instances
const sortMoves = (moves, game, depth) => {
  return moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;

    // Captures first (most likely to cause cutoffs)
    if (a.capture) scoreA += 10000 + getPieceValue(a.captured) * 100;
    if (b.capture) scoreB += 10000 + getPieceValue(b.captured) * 100;

    // Only check for checks at shallow depths (expensive)
    if (depth > 2 && scoreA === scoreB) {
      // Checks are less likely to be best moves at deep levels
      scoreA += 200;
      scoreB += 200;
    }

    return scoreB - scoreA;
  });
};

export function makeAIMove(currentGame, depth) {
  console.time("search");
  clearTranspositionTable();

  const moves = currentGame.moves({ verbose: true });

  if (moves.length === 0) return null;

  // Try opening book first (10% chance to deviate for variety)
  const openingMove = getOpeningMove(currentGame.fen());
  if (openingMove && Math.random() > 0.1) {
    console.timeEnd("search");
    return openingMove;
  }

  let bestScore = -Infinity;
  let bestMove = null;

  // Sort moves ONCE at root
  const sortedMoves = sortMoves(moves, currentGame, depth);

  for (const move of sortedMoves) {
    const gameCopy = new Chess(currentGame.fen());
    gameCopy.move(move);

    const score = -AlphaBetaNegaMax(
      gameCopy,
      depth - 1,
      -Infinity,
      -bestScore  // Use best score so far for better pruning
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move.san;
    }
  }

  console.timeEnd("search");
  return bestMove;
}

const AlphaBetaNegaMax = (
  currentGame,
  depth,
  alpha = -Infinity,
  beta = Infinity
) => {
  const fen = currentGame.fen();

  // Transposition table lookup
  const ttLookup = lookupPosition(fen, depth);
  if (ttLookup !== null) {
    return ttLookup;
  }

  // Terminal node evaluation
  if (depth === 0 || currentGame.isGameOver()) {
    const score = boardEvaluation(currentGame);
    storePosition(fen, depth, score, 'exact');
    return score;
  }

  const moves = currentGame.moves({ verbose: true });
  if (moves.length === 0) {
    const score = boardEvaluation(currentGame);
    storePosition(fen, depth, score, 'exact');
    return score;
  }

  // Sort moves for better pruning
  const sortedMoves = sortMoves(moves, currentGame, depth);

  let max = -Infinity;
  let flag = 'upper';

  for (const move of sortedMoves) {
    const nextGame = new Chess(currentGame.fen());
    nextGame.move(move);

    // Check if in opening book (only during opening phase)
    let score = -AlphaBetaNegaMax(nextGame, depth - 1, -beta, -alpha);

    // Apply opening book bonus at root level only (depth passed in)
    if (depth > 1) {
      const moveCount = currentGame.history().length;
      if (moveCount < 10) {
        const bookMove = getOpeningMove(currentGame.fen());
        if (bookMove === move.san) {
          score += 200;
        }
      }
    }

    max = Math.max(max, score);

    if (max > alpha) {
      flag = 'exact';
      alpha = max;
    }

    // Beta cutoff
    if (alpha >= beta) {
      flag = 'lower';
      break;
    }
  }

  storePosition(fen, depth, max, flag);
  return max;
};