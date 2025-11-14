# React Chess

A fully-featured chess web app built with **React**, **react-chessboard**, and **chess.js**. Play against an intelligent AI opponent, enjoy local multiplayer, or challenge friends online using Peer-to-Peer networking — now with an integrated game timer.

---

## Features

- **Interactive Chessboard** – Drag-and-drop movement with full legality checks
- **Intelligent AI Opponent** – Multiple difficulty modes from Easy to Hard
- **Local Multiplayer** – Play with a friend on the same device
- **Peer-to-Peer Online Multiplayer (PeerJS)** – Play online without a server
- **Game Timer** – Configurable chess clock for all game modes
- **Opening Theory** – Sicilian Defense opening book with 25+ curated positions
- **Advanced Search Algorithm** – Alpha-Beta pruning and transposition tables
- **Move History** – View complete algebraic notation of the game
- **Responsive UI** – Automatically adjusts board size and layout

---

## Multiplayer Modes

### Local Multiplayer

Play face-to-face on the same device. The board automatically flips and switches turns. Displays a pass and play message.

### Peer-to-Peer Online Multiplayer (PeerJS)

Connect with friends online through PeerJS:

- No dedicated backend required
- Exchange Peer IDs to connect
- Real-time synchronized board state
- Shared game timer visible to both players
- Handles disconnections

---

## Timer System

The chess clock includes:

- Customisable time controls
- Automatic countdown per turn
- Stop when a player disconnects or window loses focus
- Automatic timeout detection to determine the game result

---

## AI Engine

### Difficulty Levels

- **Easy (Depth 1)** – Instant, basic reply
- **Medium (Depth 2)** – Balanced and moderately strong
- **Hard (Depth 3)** – Strong amateur-level play

### Evaluation Features

- Material evaluation
- Undefended pieces and free captures
- Centre control
- Piece activity and development
- Pawn structure (passed, isolated, doubled)
- Endgame king activity and pawn focus

---

## Opening Theory

The engine follows established Sicilian Defense theory including:

- **Najdorf** (4...a6)
- **Classical** (4...Nf6)
- **Taimanov** (4...e6)
- **Closed Sicilian** (2.c3)
- **Grand Prix Attack** (2.Nc3 f4)

Over 25 lines covering the first 7–8 moves.

---

## Search Optimizations

- Alpha-Beta Pruning
- Move Ordering (captures/checks first)
- Transposition Tables
- Opening Book Lookup
- Fast Move Sorting
- Strategic Evaluation Bonuses

---

## Performance

- **Depth 1:** Instant
- **Depth 2:** ~1–3 seconds
- **Depth 3:** ~5–15 seconds (position-dependent)

---

## Installation

1. Clone the repo:

```bash
git clone https://github.com/YOUR_USERNAME/react-chess.git
```

2. Install dependencies:

```bash
cd react-chess
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app should open in your browser at http://localhost:5173.

---

## Usage

### Playing the Game

1. **Pick a mode** - AI / Local Multiplayer / Online Multiplayer
2. **Make a Move** - Drag and drop pieces to move them. Only legal moves are accepted.
3. **Choose Difficulty** - Select your preferred AI difficulty level before or during the game.
4. **View Move History** - The move history is displayed in algebraic notation beside the board.
5. **Reset Game** - Start a new game at any time to play again.

## Project Structure

```
src/
├── components/
│   ├── evaluation.js           # Position evaluation function
│   ├── search.js               # Alpha-beta search algorithm
│   ├── openings.js             # Sicilian Defense opening book
│   └── transpositiontable.js   # Transposition table cache
├── css/
|   ├── OnlineMultiplayer.css
|   ├── AIGame.css
|   ├── landingPage.css
|   ├── Multiiplayer.css
│   └── index.css
├── images/
|   ├── chessboard.png
│   └── cloudy-background.png
├── pages/
|   ├── AIGame.jsx
|   ├── Multiplayer.jsx
|   ├── OnlineMultiplayer.jsx
│   └── landingPage.jsx
├── main.jsx
└── App.jsx
```

---

## Technologies Used

- **React 19** - UI framework
- **react-chessboard 4** - Chess board component
- **chess.js 1.4** - Chess logic and validation
- **CSS Flexbox/Grid** - Responsive layout
- **PeerJS** - Online multiplayer

---

## Future Improvements

- Quiescence search for more accurate tactical evaluation
- Killer move heuristic and history heuristic for better move ordering
- Late move reduction for searching questionable moves to lower depth
- Extended opening book with more variations
- Endgame tablebases for perfect endgame play

---

## License

This project is open source under the MIT License.
