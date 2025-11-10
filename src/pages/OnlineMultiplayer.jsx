import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import '../css/multiplayer.css';

export default function P2PMultiplayer() {
  const [game, setGame] = useState(new Chess());
  const [playedMoves, setplayedMoves] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [peerId, setPeerId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState('');
  
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const gameRef = useRef(game);

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
    } else if (data.type === 'gameState') {
      const newGame = new Chess(data.fen);
      setGame(newGame);
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
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      alert('Failed to connect. Please check the Peer ID.');
    });
  };

  const onDrop = (sourceSquare, targetSquare, promotion = "q") => {
    if (!playerColor || connectionStatus !== 'connected') {
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
      
      if (dataChannelRef.current && dataChannelRef.current.open) {
        dataChannelRef.current.send({ type: 'move', move: result.san });
      }
      return true;
    }
    return false;
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setplayedMoves([]);
    
    if (dataChannelRef.current && dataChannelRef.current.open) {
      dataChannelRef.current.send({ type: 'reset' });
    }
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

  // Game screen
  return (
    <div className="chess-container">
      <h2>Online P2P Chess</h2>
      <p className="current-player">
        You are playing as <strong>{playerColor === 'white' ? '⚪ White' : '⚫ Black'}</strong>
      </p>
      <p className="connection-status">🟢 Connected to opponent</p>

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
            onClick={() => {
              peerRef.current?.disconnect();
              setConnectionStatus('disconnected');
              setPlayerColor(null);
              setGame(new Chess());
              setplayedMoves([]);
            }}
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