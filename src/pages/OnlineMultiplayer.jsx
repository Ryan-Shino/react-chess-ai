import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import '../css/OnlineMultiplayer.css';

export default function P2PMultiplayer() {
  const [game, setGame] = useState(new Chess());
  const [playedMoves, setplayedMoves] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [peerId, setPeerId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState('');
  
  const [gameStarted, setGameStarted] = useState(false);
  const [timeControl, setTimeControl] = useState(5); // minutes
  const [increment, setIncrement] = useState(0); // seconds
  const [whiteTime, setWhiteTime] = useState(300000); // milliseconds
  const [blackTime, setBlackTime] = useState(300000);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  
  const [resetRequested, setResetRequested] = useState(false);
  const [resetRequestFrom, setResetRequestFrom] = useState(null);
  
  const [timeControlProposal, setTimeControlProposal] = useState(null);
  const [timeControlConfirmed, setTimeControlConfirmed] = useState(false);
  
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const gameRef = useRef(game);
  const timerIntervalRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Initialize Peer.js
  useEffect(() => {
    const initPeer = async () => {
      try {
        const Peer = (await import('peerjs')).default;
        const peer = new Peer();
        
        peer.on('open', (id) => {
          setPeerId(id);
        });

        peer.on('connection', (conn) => {
          handleIncomingConnection(conn);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
        });

        peerRef.current = peer;
      } catch (err) {
        console.error('Failed to load PeerJS:', err);
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Timer management - only runs when it's someone's turn
  useEffect(() => {
    if (!gameStarted || gameOver || !timerRunning) {
      clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceMove = now - lastMoveTimeRef.current;

      if (gameRef.current.turn() === 'w') {
        setWhiteTime((prev) => {
          const newTime = prev - timeSinceMove;
          if (newTime <= 0) {
            clearInterval(timerIntervalRef.current);
            setGameOver(true);
            setGameOverReason('Black won - White ran out of time');
            setTimerRunning(false);
            if (dataChannelRef.current?.open) {
              dataChannelRef.current.send({ type: 'gameOver', reason: 'White ran out of time' });
            }
            return 0;
          }
          return newTime;
        });
      } else {
        setBlackTime((prev) => {
          const newTime = prev - timeSinceMove;
          if (newTime <= 0) {
            clearInterval(timerIntervalRef.current);
            setGameOver(true);
            setGameOverReason('White won - Black ran out of time');
            setTimerRunning(false);
            if (dataChannelRef.current?.open) {
              dataChannelRef.current.send({ type: 'gameOver', reason: 'Black ran out of time' });
            }
            return 0;
          }
          return newTime;
        });
      }

      lastMoveTimeRef.current = now;
    }, 100);

    return () => clearInterval(timerIntervalRef.current);
  }, [gameStarted, gameOver, timerRunning]);

  const handleIncomingConnection = (conn) => {
    conn.on('open', () => {
      dataChannelRef.current = conn;
      setConnectionStatus('connected');
      setPlayerColor('black');
      conn.send({ type: 'gameState', fen: game.fen() });
    });

    conn.on('data', (data) => {
      handlePeerMessage(data);
    });

    conn.on('close', () => {
      setConnectionStatus('disconnected');
      dataChannelRef.current = null;
      setPlayerColor(null);
      setGameStarted(false);
      setGameOver(false);
      setTimeControlConfirmed(false);
      setTimeControlProposal(null);
      setTimerRunning(false);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  };

  const handlePeerMessage = (data) => {
    if (data.type === 'move') {
      const newGame = new Chess(gameRef.current.fen());
      newGame.move(data.move);
      setGame(newGame);
      setplayedMoves((prev) => [...prev, data.move]);
      
      // Add increment to player who just moved
      if (newGame.turn() === 'w') {
        setBlackTime((prev) => prev + increment * 1000);
      } else {
        setWhiteTime((prev) => prev + increment * 1000);
      }

      // Start timer if it's the player's turn (and first move just happened)
      if (!timerRunning) {
        setTimerRunning(true);
      }
      lastMoveTimeRef.current = Date.now();
    } else if (data.type === 'gameState') {
      const newGame = new Chess(data.fen);
      setGame(newGame);
    } else if (data.type === 'timeControlProposal') {
      setTimeControlProposal(data);
    } else if (data.type === 'timeControlConfirmed') {
      setTimeControl(data.timeControl);
      setIncrement(data.increment);
      setTimeControlConfirmed(true);
      setTimeControlProposal(null);
    } else if (data.type === 'startGame') {
      setGameStarted(true);
      setWhiteTime(data.timeControl * 60 * 1000);
      setBlackTime(data.timeControl * 60 * 1000);
      setIncrement(data.increment);
      lastMoveTimeRef.current = Date.now();
      setTimerRunning(false); // Timer starts on first move
    } else if (data.type === 'resetRequest') {
      setResetRequestFrom(data.from);
      setResetRequested(true);
    } else if (data.type === 'resetAccepted') {
      const newGame = new Chess();
      setGame(newGame);
      setplayedMoves([]);
      setResetRequested(false);
      setResetRequestFrom(null);
      setWhiteTime(timeControl * 60 * 1000);
      setBlackTime(timeControl * 60 * 1000);
      lastMoveTimeRef.current = Date.now();
      setTimerRunning(false);
    } else if (data.type === 'resetDeclined') {
      setResetRequested(false);
      setResetRequestFrom(null);
      alert('Reset request declined');
    } else if (data.type === 'disconnect') {
      peerRef.current?.disconnect();
      setConnectionStatus('disconnected');
      setPlayerColor(null);
      setGameStarted(false);
      setGameOver(false);
      setTimeControlConfirmed(false);
      setTimeControlProposal(null);
      setTimerRunning(false);
    } else if (data.type === 'gameOver') {
      setGameOver(true);
      setGameOverReason(data.reason);
      setTimerRunning(false);
    }
  };

  const connectToPeer = () => {
    if (!remotePeerId) {
      alert('Please enter a Peer ID');
      return;
    }

    const conn = peerRef.current.connect(remotePeerId);
    
    conn.on('open', () => {
      dataChannelRef.current = conn;
      setConnectionStatus('connected');
      setPlayerColor('white');
    });

    conn.on('data', (data) => {
      handlePeerMessage(data);
    });

    conn.on('close', () => {
      setConnectionStatus('disconnected');
      dataChannelRef.current = null;
      setPlayerColor(null);
      setGameStarted(false);
      setGameOver(false);
      setTimeControlConfirmed(false);
      setTimeControlProposal(null);
      setTimerRunning(false);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      alert('Failed to connect. Please check the Peer ID.');
    });
  };

  const proposeTimeControl = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ 
        type: 'timeControlProposal', 
        timeControl, 
        increment 
      });
      setTimeControlConfirmed(true);
    }
  };

  const confirmTimeControl = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ 
        type: 'timeControlConfirmed', 
        timeControl: timeControlProposal.timeControl,
        increment: timeControlProposal.increment
      });
      setTimeControl(timeControlProposal.timeControl);
      setIncrement(timeControlProposal.increment);
      setTimeControlConfirmed(true);
      setTimeControlProposal(null);
    }
  };

  const declineTimeControl = () => {
    setTimeControlProposal(null);
  };

  const startGame = () => {
    if (dataChannelRef.current?.open && timeControlConfirmed) {
      dataChannelRef.current.send({ 
        type: 'startGame', 
        timeControl, 
        increment 
      });
      setGameStarted(true);
      setWhiteTime(timeControl * 60 * 1000);
      setBlackTime(timeControl * 60 * 1000);
      lastMoveTimeRef.current = Date.now();
      setTimerRunning(false); // Timer starts on first white move
    }
  };

  const onDrop = (sourceSquare, targetSquare, promotion = "q") => {
    if (!playerColor || connectionStatus !== 'connected' || !gameStarted || gameOver) {
      return false;
    }

    const newGame = new Chess(game.fen());
    promotion = promotion[1].toLowerCase();
    
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: promotion,
    };
    
    const result = newGame.move(move);
    
    if (result && result.color === playerColor[0]) {
      setGame(newGame);
      setplayedMoves((prev) => [...prev, result.san]);
      
      // Add increment to current player's time
      if (playerColor === 'white') {
        setWhiteTime((prev) => prev + increment * 1000);
      } else {
        setBlackTime((prev) => prev + increment * 1000);
      }
      
      if (dataChannelRef.current && dataChannelRef.current.open) {
        dataChannelRef.current.send({ type: 'move', move: result.san });
      }

      // Start timer on first move
      if (!timerRunning) {
        setTimerRunning(true);
      }
      
      lastMoveTimeRef.current = Date.now();
      return true;
    }
    return false;
  };

  const requestReset = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ type: 'resetRequest', from: playerColor });
    }
  };

  const acceptReset = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ type: 'resetAccepted' });
    }
    const newGame = new Chess();
    setGame(newGame);
    setplayedMoves([]);
    setResetRequested(false);
    setResetRequestFrom(null);
    setWhiteTime(timeControl * 60 * 1000);
    setBlackTime(timeControl * 60 * 1000);
    lastMoveTimeRef.current = Date.now();
    setTimerRunning(false);
  };

  const declineReset = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ type: 'resetDeclined' });
    }
    setResetRequested(false);
    setResetRequestFrom(null);
  };

  const disconnect = () => {
    if (dataChannelRef.current?.open) {
      dataChannelRef.current.send({ type: 'disconnect' });
    }
    peerRef.current?.disconnect();
    setConnectionStatus('disconnected');
    setPlayerColor(null);
    setGameStarted(false);
    setGameOver(false);
    setGame(new Chess());
    setplayedMoves([]);
    setTimeControlConfirmed(false);
    setTimeControlProposal(null);
    setTimerRunning(false);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Connection screen
  if (connectionStatus === 'disconnected') {
    return (
      <div className="chess-container">
        <h2>Online P2P Chess</h2>
        
        <div className="p2p-connection-panel">
          <div className="p2p-id-section">
            <h3>Your Peer ID</h3>
            <div className="p2p-id-box">
              {peerId ? (
                <>
                  <p className="p2p-id-text">{peerId}</p>
                  <button
                    className="reset-button"
                    onClick={() => navigator.clipboard.writeText(peerId)}
                  >
                    Copy ID
                  </button>
                </>
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </div>

          <div className="p2p-connect-section">
            <h3>Connect to Opponent</h3>
            <input
              type="text"
              placeholder="Enter opponent's Peer ID"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              className="p2p-input"
            />
            <button
              onClick={connectToPeer}
              className="reset-button"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game not started - show time control setup
  if (!gameStarted) {
    return (
      <div className="chess-container">
        <h2>Online P2P Chess</h2>
        <p className="current-player">
          You are playing as <strong>{playerColor === 'white' ? 'White' : 'Black'}</strong>
        </p>
        <p className="connection-status">Connected to opponent</p>

        <div className="board-wrapper">
          <div className="button-column">
            <button className="reset-button" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>

          <div className="chess-board-wrapper">
            <Chessboard
              position={game.fen()}
              arePiecesDraggable={false}
              boardOrientation={playerColor}
            />
          </div>

          <div className="moves-list">
            <h3>Game Setup</h3>
            
            {timeControlProposal && (
              <div className="time-control-proposal">
                <p>Opponent proposes:</p>
                <p>Time: {timeControlProposal.timeControl} min | Increment: {timeControlProposal.increment} sec</p>
                <button onClick={confirmTimeControl} className="reset-button">
                  Accept
                </button>
                <button onClick={declineTimeControl} className="reset-button">
                  Decline
                </button>
              </div>
            )}

            {!timeControlConfirmed ? (
              <div className="time-control-setup">
                <div className="time-input-group">
                  <label>Time Control (minutes):</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={timeControl}
                    onChange={(e) => setTimeControl(Number(e.target.value))}
                    className="p2p-input"
                  />
                </div>
                <div className="time-input-group">
                  <label>Increment (seconds):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={increment}
                    onChange={(e) => setIncrement(Number(e.target.value))}
                    className="p2p-input"
                  />
                </div>
                <button onClick={proposeTimeControl} className="reset-button">
                  Propose Time Control
                </button>
              </div>
            ) : (
              <div className="time-control-confirmed">
                <p>Time Control: {timeControl} min | Increment: {increment} sec</p>
                <p>⏳ Waiting for opponent to confirm...</p>
                <button onClick={startGame} className="reset-button" disabled={!timeControlConfirmed}>
                  Start Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game in progress
  return (
    <div className="chess-container">
      <h2>Online P2P Chess</h2>
      <p className="current-player">
        You are playing as <strong>{playerColor === 'white' ? 'White' : 'Black'}</strong>
      </p>
      <p className="connection-status">Connected to opponent</p>

      {gameOver && (
        <div className="game-over-banner">
          <h3>{gameOverReason}</h3>
          <button className="reset-button" onClick={() => disconnect()}>
            Back to Menu
          </button>
        </div>
      )}

      {resetRequested && (
        <div className="reset-request-banner">
          <p>{resetRequestFrom} is requesting to reset the board</p>
          <button className="reset-button" onClick={acceptReset}>
            Accept
          </button>
          <button className="reset-button" onClick={declineReset}>
            Decline
          </button>
        </div>
      )}

      <div className="board-wrapper">
        <div className="button-column">
          <button
            className="reset-button"
            onClick={requestReset}
            disabled={gameOver}
          >
            Reset
          </button>
          <button
            className="reset-button"
            onClick={disconnect}
          >
            Disconnect
          </button>
        </div>

        <div className="chess-board-wrapper">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            arePiecesDraggable={true}
            boardOrientation={playerColor}
            onPromotionHandler={(move, promotion) => {
              onDrop(move.from, move.to, promotion);
            }}
          />
        </div>

        <div className="moves-list">
          <div className="timer-section">
            <div className={`timer white ${game.turn() === 'w' && timerRunning ? 'active' : ''}`}>
              <span>White: {formatTime(whiteTime)}</span>
            </div>
            <div className={`timer black ${game.turn() === 'b' && timerRunning ? 'active' : ''}`}>
              <span>Black: {formatTime(blackTime)}</span>
            </div>
          </div>

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