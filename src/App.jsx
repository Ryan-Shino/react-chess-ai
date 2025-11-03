import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { boardEvaluation } from './components/evaluation';
import { getOpeningMove } from './components/openings';
import './css/App.css'


export default function App() {
  const [game, setGame] = useState(new Chess());
  const [playedMoves, setplayedMoves] = useState([]);
  const [difficulty, setDifficulty] = useState();

  function onDrop(sourceSquare, targetSquare, promotion = "q") {
    console.log("Trying move:", sourceSquare, "->", targetSquare);
    
    const newGame = new Chess(game.fen());

    promotion = promotion[1].toLowerCase();

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: promotion, 
    };
    const result = newGame.move(move);

    if (result) {
      setGame(new Chess(newGame.fen()));

      setplayedMoves((prev) => [...prev, result.san])

      switch(difficulty) {
        case "random":
          setTimeout(() => makeRandomMove(newGame), 400);
          // Preventing some infinite loops
          break;
        case "easy":
          makeAIMove(newGame, 1);
          break;
        case "medium":
          makeAIMove(newGame, 2);
          break;
        case "hard":
          makeAIMove(newGame, 3);
          break;
        case "extreme":
          makeAIMove(newGame, 4);
          break;
        default:
          setTimeout(() => makeRandomMove(newGame), 400);
      }
      return true;
    } else {
      console.warn("Invalid move:", move);
      return false;
    }

  }

  const makeAIMove = (currentGame, depth) => {
    const newGame = new Chess(currentGame.fen());
    const moves = newGame.moves();
  
    if (moves.length === 0) return;
  
    // --- Try to use opening book first ---
    const openingMove = getOpeningMove(currentGame.fen());
    if (openingMove && Math.random() > 0.1) {
      const result = currentGame.move(openingMove);
      if (result) {
        console.log("AI played opening move:", openingMove);
        setGame(new Chess(currentGame.fen()));
        setplayedMoves((prev) => [...prev, result.san]);
      }
      return; // Exit after playing opening move
    }
  
    // --- Otherwise, run alpha-beta search ---
    let bestScore = -Infinity;
    let bestMove = null;
  
    for (const move of moves) {
      const gameCopy = new Chess(newGame.fen());
      gameCopy.move(move);
      console.log(move)
  
      const score = -AlphaBetaNegaMax(gameCopy, depth - 1);
      
      console.log("Move",move,":",score)
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      console.log("Bestmove",bestMove,":",score)
    }
  
    // --- Make the best move found ---
    if (bestMove) {
      const result = newGame.move(bestMove);
      if (result) {
        setGame(new Chess(newGame.fen()));
        setplayedMoves((prev) => [...prev, result.san]);
      }
    }
  };
  
  
  // =============================
  // Alpha-Beta Negamax with Opening Reward
  // =============================
  const AlphaBetaNegaMax = (currentGame, depth, alpha = -Infinity, beta = Infinity) => {
    if (depth === 0 || currentGame.isGameOver()) {
      return boardEvaluation(currentGame);
    }
  
    let max = -Infinity;
    const moves = currentGame.moves();
  
    for (const move of moves) {
      const nextGame = new Chess(currentGame.fen());
      nextGame.move(move);
  
      // --- Check if this move matches opening theory ---
      const moveCount = currentGame.history().length;
      const isOpeningPhase = moveCount < 10;
      const bookMove = getOpeningMove(currentGame.fen());
  
      // Compare the book move string to this move's SAN notation
      const moveSAN = move; // in chess.js .moves() returns SAN strings
      const isBookMove = isOpeningPhase && bookMove === moveSAN;
  
      // --- Recursively evaluate ---
      let score = -AlphaBetaNegaMax(nextGame, depth - 1, -beta, -alpha);
  
      // --- Apply bonus for staying in theory ---
      if (isBookMove) {
        score += 200;
      }
  
      max = Math.max(max, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
  
    return max;
  };
  

  const makeRandomMove = (currentGame) => {
    const newGame = new Chess(currentGame.fen());
    const moves = newGame.moves();

    if (moves.length === 0) return;

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    const result = newGame.move(randomMove);

    if (result) {
      setGame(new Chess(newGame.fen()));

      setplayedMoves((prev) => [...prev, result.san])
    }
  };

  return (
    <div className="chess-container">
      <h2>Choose your difficulty:</h2>
      <div className="board-wrapper"> 
        <div className='button-wrapper'>
          <button onClick={() => 
            setDifficulty('random')} 
            className={difficulty === 'random' ? 'selected' : ''}>Random</button>
          <button onClick={() => 
            setDifficulty('easy')} 
            className={difficulty === 'easy' ? 'selected' : ''}>Easy</button>
            <button onClick={() => 
            setDifficulty('medium')} 
            className={difficulty === 'medium' ? 'selected' : ''}>Medium</button>
            <button onClick={() => 
            setDifficulty('hard')} 
            className={difficulty === 'hard' ? 'selected' : ''}>Hard</button>
            <button onClick={() => 
            setDifficulty('extreme')} 
            className={difficulty === 'extreme' ? 'selected' : ''}>Extreme</button>
        </div>
        <div className="chess-board-wrapper">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            arePiecesDraggable={true}
            boardOrientation="white"
            onPromotionHandler={(move, promotion) => {
              onDrop(move.from, move.to, promotion);
            }}
          />
        </div>
        <div className="moves-list">
          <h3>Moves</h3>
          <div className="column-container">
            <div className="moves-column">
              <h3>White</h3>
              <ul>
                {playedMoves
                  .filter((_, i) => i % 2 === 0)
                  .map((move, i) => (
                    <li key={i}>{move}</li>
                  ))}
              </ul>
            </div>
            <div className="moves-column">
              <h3>Black</h3>
              <ul>
                {playedMoves
                  .filter((_, i) => i % 2 !== 0)
                  .map((move, i) => (
                    <li key={i}>{move}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
