import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './css/App.css'


export default function App() {
  const [game, setGame] = useState(new Chess());
  const [playedMoves, setplayedMoves] = useState([]);

  function onDrop(sourceSquare, targetSquare) {
    console.log("Trying move:", sourceSquare, "->", targetSquare);

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', 
    };

    const newGame = new Chess(game.fen());
    const result = newGame.move(move);

    if (result) {
      console.log("Move successful:", result);
      setGame(new Chess(newGame.fen()));

      setplayedMoves((prev) => [...prev, result.san])

      setTimeout(() => makeRandomMove(newGame), 400);
      // Preventing some infinite loops
      return true;
    } else {
      console.warn("Invalid move:", move);
      return false;
    }

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
      <h2>Random moves</h2>
      <div className="board-and-moves">
        <div className="chess-board-wrapper">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            arePiecesDraggable={true}
            boardOrientation="white"
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
