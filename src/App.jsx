import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
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
    // Making a copy we don't mutate the actual game
    const newGame = new Chess(currentGame.fen());
    const moves = newGame.moves();
    console.log(moves);

    if (moves.length === 0) return;

    // We will use minimax for first couple difficulties and increase difficulty with depth
    // It is efficient to use the negamax variation here since chess is a zero sum game

    let bestScore = -Infinity;
    let bestMove = null;

    moves.forEach(move => {
      // A copy of the game state for each move
      const gameCopy = new Chess(newGame.fen());
      gameCopy.move(move);

      let score = NegaMax(gameCopy, depth - 1)


      if (score > bestScore){
        bestScore = score;
        bestMove = move;
      }
    });

    console.log(bestMove);
    console.log(bestScore);
    const result = newGame.move(bestMove);

    if (result) {
      setGame(new Chess(newGame.fen()));

      setplayedMoves((prev) => [...prev, result.san])
    }
  };

  const NegaMax = (currentGame, depth) => {
    if (depth == 0 || currentGame.isGameOver()){
      return boardEvaluation(currentGame)
    }

    let max = -Infinity;
    const moves = currentGame.moves();
    let score = 0;

    for (const move of moves) {
      const nextGame = new Chess(currentGame.fen());
      nextGame.move(move);

      score = -NegaMax(nextGame, depth - 1);
      max = Math.max(max, score);
    }

  return max;
  }

  const boardEvaluation = (currentGame) => {
    let currentBoard = currentGame.board();
    let evalScore = 0;
    
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

    for (const row of currentBoard) {
      for (const piece of row) {
        if (piece) {
          const value = pieceValues[piece.type];
          evalScore += piece.color === 'w' ? value : -value;
        }
      }
    }
  console.log("Current evaluation score:", evalScore);
  return evalScore;
  }

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
