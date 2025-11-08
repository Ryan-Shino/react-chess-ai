import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import '../css/multiplayer.css';

export default function LocalMultiplayer() {
  const [game, setGame] = useState(new Chess());
  const [playedMoves, setplayedMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [showPassDevice, setShowPassDevice] = useState(false);

  function onDrop(sourceSquare, targetSquare, promotion = "q") {
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
      setplayedMoves((prev) => [...prev, result.san]);
      setShowPassDevice(true);
      return true;
    } else {
      console.warn("Invalid move:", move);
      return false;
    }
  }

  function passDevice() {
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
    setShowPassDevice(false);
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setplayedMoves([]);
    setCurrentPlayer('white');
    setShowPassDevice(false);
  }

  function takebackMove() {
    if (playedMoves.length === 0) return;
    
    const newGame = new Chess();
    const movesToReplay = playedMoves.slice(0, -1);
    
    for (const moveStr of movesToReplay) {
      newGame.move(moveStr);
    }
    
    setGame(newGame);
    setplayedMoves(movesToReplay);
    setCurrentPlayer(newGame.turn() === 'w' ? 'white' : 'black');
  }

  return (
    <div className="chess-container">
      <h2>Local 2-Player Chess</h2>
      <p className="current-player">
        Current Player: <strong>{currentPlayer === 'white' ? '⚪ White' : '⚫ Black'}</strong>
      </p>

      {showPassDevice && (
        <div className="pass-device-overlay">
          <div className="pass-device-modal">
            <h2>Pass Device</h2>
            <p className="pass-device-text">
              {currentPlayer === 'white' ? '⚫ Black' : '⚪ White'}'s Turn
            </p>
            <p className="pass-device-instruction">
              Hand the device to the other player
            </p>
            
            <button
              onClick={passDevice}
              className="pass-device-button"
            >
              Ready to Play
            </button>
          </div>
        </div>
      )}

      <div className="board-wrapper">
        <div className="button-column">
          <button
            className="reset-button"
            onClick={resetGame}
          >
            Reset
          </button>
          <button
            className="reset-button"
            onClick={takebackMove}
            disabled={playedMoves.length === 0}
          >
            Takeback
          </button>
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