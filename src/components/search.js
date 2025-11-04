import { Chess } from 'chess.js';
import { storePosition, lookupPosition, clearTranspositionTable } from './transpositiontable.js';
import { boardEvaluation } from './evaluation.js'
import { getOpeningMove } from './openings.js'

const sortMoves = (moves, game) => {
    return moves.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
  
      if (a.capture) scoreA += 1000 + getPieceValue(a.captured);
      if (b.capture) scoreB += 1000 + getPieceValue(b.captured);
  
      if (scoreA === 0 && scoreB === 0) {
        const tempA = new Chess(game.fen());
        tempA.move(a);
        if (tempA.inCheck()) scoreA += 500;
  
        const tempB = new Chess(game.fen());
        tempB.move(b);
        if (tempB.inCheck()) scoreB += 500;
      }
  
      return scoreB - scoreA;
    });
  };
  
  const getPieceValue = (piece) => {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    return values[piece] || 0;
  };
  
  export function makeAIMove(currentGame, depth) {
    console.time("search");
    clearTranspositionTable();
  
    const newGame = new Chess(currentGame.fen());
    const moves = newGame.moves({ verbose: true });
  
    if (moves.length === 0) return null;
  
    // --- Try to use opening book first ---
    const openingMove = getOpeningMove(currentGame.fen());
    if (openingMove && Math.random() > 0.1) {
      return openingMove;
    }
  
    // --- Otherwise, run alpha-beta search ---
    let bestScore = -Infinity;
    let bestMove = null;
  
    const sortedMoves = sortMoves(moves, newGame);
  
    for (const move of sortedMoves) {
      const gameCopy = new Chess(newGame.fen());
      gameCopy.move(move);
  
      const score = -AlphaBetaNegaMax(gameCopy, depth - 1);
  
      if (score > bestScore) {
        bestScore = score;
        bestMove = move.san;
      }
    }
    
    console.timeEnd("search");
    return bestMove;
  }
  

  const AlphaBetaNegaMax = (currentGame, depth, alpha = -Infinity, beta = Infinity) => {
    const fen = currentGame.fen();
  
    const ttLookup = lookupPosition(fen, depth);
    if (ttLookup !== null) {
      return ttLookup;
    }
  
    if (depth === 0 || currentGame.isGameOver()) {
      console.time("eval");
      const score = boardEvaluation(currentGame);
      console.timeEnd("eval");
      storePosition(fen, depth, score, 'exact');
      return score;
    }
  
    let max = -Infinity;
    const moves = currentGame.moves({ verbose: true }); // ← USE VERBOSE
    const sortedMoves = sortMoves(moves, currentGame); // ← SORT MOVES
    let flag = 'upper';
  
    for (const move of sortedMoves) {
      const nextGame = new Chess(currentGame.fen());
      nextGame.move(move);
  
      const moveCount = currentGame.history().length;
      const isOpeningPhase = moveCount < 10;
      const bookMove = getOpeningMove(currentGame.fen());
  
      const isBookMove = isOpeningPhase && bookMove === move.san; // ← USE move.san
  
      let score = -AlphaBetaNegaMax(nextGame, depth - 1, -beta, -alpha);
  
      if (isBookMove) {
        score += 200;
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