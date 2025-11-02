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

      let score = AlphaBetaNegaMax(gameCopy, depth - 1)

      console.log("Move:", move, "Score:", score);

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

  const AlphaBetaNegaMax = (currentGame, depth, alpha = -Infinity, beta = Infinity) => {
    if (depth == 0 || currentGame.isGameOver()){
      return boardEvaluation(currentGame)
    }

    let max = -Infinity;
    const moves = currentGame.moves();
    let score = 0;

    for (const move of moves) {
      const nextGame = new Chess(currentGame.fen());
      nextGame.move(move);

    // Negate the score because of the opponent
      score = -AlphaBetaNegaMax(nextGame, depth - 1, -beta, -alpha);
      max = Math.max(max, score);

      alpha = Math.max(alpha, score);

      // Alpha-beta pruning
      if (alpha >= beta) {
        break;
      }
    }

  return max;
  }

function boardEvaluation(currentGame) {
  const board = currentGame.board();

  let whiteScore = 0;
  let blackScore = 0;

  // Piece values
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const centerSquares = new Set(["d4", "e4", "d5", "e5"]);
  const files = ['a','b','c','d','e','f','g','h'];

  // Scan board once
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const color = piece.color;
      const sign = color === 'w' ? 1 : -1;

      // Base material value
      let val = values[piece.type];

      // Simple positional tweaks
      if (piece.type === 'p') {
        // Encourage pawn chains
        const dir = color === 'w' ? 1 : -1;
        const left = board[r - dir]?.[f - 1];
        const right = board[r - dir]?.[f + 1];
        if ((left && left.type === 'p' && left.color === color) ||
            (right && right.type === 'p' && right.color === color)) {
          val += 10;
        }
      } 
      else if (piece.type === 'r') {
        // Reward rooks on open files
        let hasPawn = false;
        for (let rr = 0; rr < 8; rr++) {
          if (board[rr][f]?.type === 'p') { hasPawn = true; break; }
        }
        if (!hasPawn) val += 15;
      } 
      else if (piece.type === 'n' || piece.type === 'b' || piece.type === 'q') {
        // Encourage piece activity (mobility)
        val += 2 * pieceMobilityBonus(currentGame, color);
      } 
      else if (piece.type === 'k') {
        // Reward having pawns in front of king
        const row = color === 'w' ? 6 : 1;
        for (const df of [-1, 0, 1]) {
          const pawn = board[row]?.[f + df];
          if (pawn?.type === 'p' && pawn.color === color) val += 10;
        }
      }

      // Control of centre
      const square = files[f] + (8 - r);
      if (centerSquares.has(square)) val += 10;

      // Apply score
      if (color === 'w') whiteScore += val;
      else blackScore += val;
    }
  }

  // Add simple mobility measure (cheap)
  whiteScore += 0.5 * currentGame.moves({ verbose: true }).filter(m => m.color === 'w').length;
  blackScore += 0.5 * currentGame.moves({ verbose: true }).filter(m => m.color === 'b').length;

  return whiteScore - blackScore;
}

// Light mobility bonus — much cheaper than per-piece scanning
function pieceMobilityBonus(game, color) {
  const moves = game.moves({ verbose: true });
  return moves.filter(m => m.color === color).length / 10; // small scaling
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
