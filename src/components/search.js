import { Chess } from 'chess.js';
import { storePosition, lookupPosition, clearTranspositionTable } from './transpositiontable.js';
import { boardEvaluation } from './evaluation.js'
import { getOpeningMove } from './openings.js'

const getPieceValue = (piece) => {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return values[piece] || 0;
};

const sortMoves = (moves, game, depth) => {
  return moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;

    if (a.capture) scoreA += 10000 + getPieceValue(a.captured) * 100;
    if (b.capture) scoreB += 10000 + getPieceValue(b.captured) * 100;

    if (depth > 2 && scoreA === scoreB) {
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

  const openingMove = getOpeningMove(currentGame.fen());
  if (openingMove && Math.random() > 0.1) {
    console.timeEnd("search");
    return openingMove;
  }

  let bestScore = -Infinity;
  let bestMove = null;

  const sortedMoves = sortMoves(moves, currentGame, depth);

  for (const move of sortedMoves) {
    const gameCopy = new Chess(currentGame.fen());
    gameCopy.move(move);

    const score = -AlphaBetaNegaMax(
      gameCopy,
      depth - 1,
      -Infinity,
      -bestScore  
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

  const ttLookup = lookupPosition(fen, depth);
  if (ttLookup !== null) {
    return ttLookup;
  }

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

  const sortedMoves = sortMoves(moves, currentGame, depth);

  let max = -Infinity;
  let flag = 'upper';

  for (const move of sortedMoves) {
    const nextGame = new Chess(currentGame.fen());
    nextGame.move(move);

    let score = -AlphaBetaNegaMax(nextGame, depth - 1, -beta, -alpha);

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

    if (alpha >= beta) {
      flag = 'lower';
      break;
    }
  }

  storePosition(fen, depth, max, flag);
  return max;
};