# React Chess

A fully-featured chess web app built with **React**, **react-chessboard**, and **chess.js**. Play against an intelligent AI opponent with multiple difficulty levels, complete with opening theory and advanced search algorithms.

---

## Features

- **Interactive Chessboard** - Drag-and-drop piece movement with full move validation
- **Intelligent AI Opponent** - Multiple difficulty modes from Easy to Impossible
- **Opening Theory** - Comprehensive Sicilian Defense opening book with 25+ positions
- **Advanced Search Algorithm** - Alpha-Beta pruning with transposition tables
- **Move History** - Complete game history with algebraic notation
- **Responsive Design** - Adapts to different screen sizes with optimized board sizing

---

## AI Engine

### Difficulty Modes

- **Easy (Depth 1)** - Sees only immediate moves, nearly instant response
- **Medium (Depth 2)** - Sees 2 moves ahead, balanced difficulty and speed
- **Hard (Depth 3)** - Sees 3 moves ahead, challenging opponent

### Evaluation Features

The AI evaluates positions based on:

- **Material Count** - Standard piece values (pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900)
- **Piece Security** - Large bonuses for capturing free pieces, penalties for undefended pieces
- **Centre Control** - Bonuses for controlling key central squares (d4, d5, e4, e5, etc.)
- **Piece Activity** - Encourages active piece placement while penalizing premature queen development
- **Pawn Structure** - Evaluates passed pawns, doubled pawns, and isolated pawns
- **Endgame Strength** - Dramatically increased emphasis on passed pawns and king activity in endgames

### Opening Theory

The AI follows established Sicilian Defense theory including:

- **Najdorf Variation** (4...a6)
- **Classical Line** (4...Nf6)
- **Taimanov Variation** (4...e6)
- **Closed Sicilian** (2.c3)
- **Grand Prix Attack** (2.Nc3 f4)

The opening book contains 25+ positions covering the first 7-8 moves, encouraging theoretical play during the opening phase.

### Search Optimizations

The AI uses multiple optimization techniques for fast, strong play:

1. **Alpha-Beta Pruning** - Eliminates branches that cannot affect the final decision
2. **Move Ordering** - Prioritizes captures and checks, allowing better pruning
3. **Transposition Table** - Caches previously evaluated positions to avoid redundant work
4. **Opening Book Lookup** - Instantly returns theoretical moves during the opening
5. **Fast Move Sorting** - Avoids expensive chess.js operations during move evaluation
6. **Strategic Bonuses** - Encourages favorable trades in the middlegame and king activity in endgames

### Performance

- Depth 1 searches complete almost instantly
- Depth 2 searches typically complete in 1-3 seconds
- Depth 3 searches complete in 5-15 seconds depending on position complexity
- All optimizations work together to maximize search depth within reasonable time limits

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

1. **Make a Move** - Drag and drop pieces to move them. Only legal moves are accepted.
2. **Choose Difficulty** - Select your preferred AI difficulty level before or during the game.
3. **View Move History** - The move history is displayed in algebraic notation beside the board.
4. **Reset Game** - Start a new game at any time to play again.

## Project Structure

```
src/
├── components/
│   ├── evaluation.js           # Position evaluation function
│   ├── search.js               # Alpha-beta search algorithm
│   ├── openings.js             # Sicilian Defense opening book
│   └── transpositiontable.js   # Transposition table cache
├── css/
|   ├── App.css
│   └── index.css
├── main.jsx
└── App.jsx
```

---

## Technologies Used

- **React 19** - UI framework
- **react-chessboard 4** - Chess board component
- **chess.js 1.4** - Chess logic and validation
- **CSS Flexbox/Grid** - Responsive layout

---

## Future Improvements

- Quiescence search for more accurate tactical evaluation
- Killer move heuristic and history heuristic for better move ordering
- Late move reduction for searching questionable moves to lower depth
- Iterative deepening with time limits for consistent move speed
- Extended opening book with more variations
- Endgame tablebases for perfect endgame play

---

## License

This project is open source under the MIT License.
