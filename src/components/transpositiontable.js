const transpositionTable = new Map();

export function clearTranspositionTable() {
  transpositionTable.clear();
}

export function storePosition(fen, depth, score, flag) {  
  const entry = { depth, score, flag };
  transpositionTable.set(fen, entry);
}

export function lookupPosition(fen, depth) {
  const entry = transpositionTable.get(fen);
  
  if (!entry) return null;
  
  if (entry.depth >= depth) {
    console.log("TT HIT");
    return entry.score;
  }
  
  return null;
}