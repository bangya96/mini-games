import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
} from 'react-native';

type Cell = 'X' | 'O' | null;
type Player = 'X' | 'O';
type Result = Player | 'draw' | null;

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
] as const;

export default function TicTacToe() {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 48, 360);
  const cellSize = Math.floor(boardSize / 3);

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');

  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);
  const [draws, setDraws] = useState(0);

  const [vsBot, setVsBot] = useState(true);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Hard');

  const { result, line } = useMemo(() => getWin(board), [board]);

  function onPressCell(i: number) {
    if (board[i] || result) return;
    setBoard(prev => {
      const next = [...prev];
      next[i] = turn;
      return next;
    });
    setTurn(t => (t === 'X' ? 'O' : 'X'));
  }

  // Update skor bila tamat
  useEffect(() => {
    if (!result) return;
    if (result === 'X') setXWins(s => s + 1);
    else if (result === 'O') setOWins(s => s + 1);
    else setDraws(s => s + 1);
  }, [result]);

  // BOT: guna minimax (unbeatable). Medium/Easy kadang2 "silap" sengaja.
  useEffect(() => {
    if (!vsBot || result || turn !== 'O') return;

    const t = setTimeout(() => {
      const move = getBestMove(board, 'O', 'X', difficulty);
      if (move != null) onPressCell(move);
    }, 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, vsBot, result, difficulty]);

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setTurn('X');
  }
  function resetAll() {
    resetBoard();
    setXWins(0); setOWins(0); setDraws(0);
  }

  function cycleDifficulty() {
    setDifficulty(d => (d === 'Hard' ? 'Medium' : d === 'Medium' ? 'Easy' : 'Hard'));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tic-Tac-Toe 🎮</Text>

      <View style={styles.rowCenter}>
        <Text style={styles.modeLabel}>VS Bot</Text>
        <Switch value={vsBot} onValueChange={setVsBot} />
        <TouchableOpacity onPress={cycleDifficulty} activeOpacity={0.8} style={styles.diffPill}>
          <Text style={styles.diffText}>{difficulty}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scoreBar}>
        <Text style={[styles.scoreItem, turn === 'X' && styles.activeTurn]}>X: {xWins}</Text>
        <Text style={styles.scoreItem}>Seri: {draws}</Text>
        <Text style={[styles.scoreItem, turn === 'O' && styles.activeTurn]}>O: {oWins}</Text>
      </View>

      {/* papan */}
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={() => onPressCell(i)}
            style={[
              styles.cell,
              { width: cellSize, height: cellSize },
            ]}
          >
            <Text
              style={[
                styles.cellText,
                line?.includes(i) && styles.winCell,
                { color: board[i] === 'X' ? '#111' : '#1b5e20' },
              ]}
            >
              {board[i] ?? ''}
            </Text>
          </TouchableOpacity>
        ))}

        {/* grid overlay */}
        <View pointerEvents="none" style={[styles.vLine, { left: cellSize }]} />
        <View pointerEvents="none" style={[styles.vLine, { left: cellSize * 2 }]} />
        <View pointerEvents="none" style={[styles.hLine, { top: cellSize }]} />
        <View pointerEvents="none" style={[styles.hLine, { top: cellSize * 2 }]} />
      </View>

      <View style={{ height: 12 }} />
      {result ? (
        <Text style={styles.result}>
          {result === 'draw' ? 'Seri 😐' : `Menang: ${result} 🎉`}
        </Text>
      ) : (
        <Text style={styles.turn}>Giliran: {turn}</Text>
      )}

      <View style={{ height: 12 }} />
      <View style={styles.btnRow}>
        <Btn text="Main lagi" onPress={resetBoard} />
        <View style={{ width: 12 }} />
        <Btn text="Reset skor" onPress={resetAll} secondary />
      </View>
    </View>
  );
}

/* =================== BOT (MINIMAX) =================== */

function getBestMove(
  board: Cell[],
  bot: Player,
  human: Player,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): number | null {
  const empty = availableMoves(board);
  if (empty.length === 0) return null;

  // Easy: rawak
  if (difficulty === 'Easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Medium: 85% guna minimax, 15% rawak (bagi chance)
  if (difficulty === 'Medium' && Math.random() < 0.15) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: minimax penuh (unbeatable)
  let bestScore = -Infinity;
  let bestIdx = empty[0];

  for (const i of empty) {
    board[i] = bot;
    const score = minimax(board, switchPlayer(bot), bot, human, 0);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function minimax(
  board: Cell[],
  current: Player,
  bot: Player,
  human: Player,
  depth: number
): number {
  const { result } = getWin(board);
  if (result) {
    if (result === bot) return 10 - depth;     // menang cepat lebih baik
    if (result === human) return depth - 10;   // kalah lambat “kurang teruk”
    return 0; // seri
  }

  const empty = availableMoves(board);

  if (current === bot) {
    let maxEval = -Infinity;
    for (const i of empty) {
      board[i] = current;
      const evalScore = minimax(board, switchPlayer(current), bot, human, depth + 1);
      board[i] = null;
      if (evalScore > maxEval) maxEval = evalScore;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const i of empty) {
      board[i] = current;
      const evalScore = minimax(board, switchPlayer(current), bot, human, depth + 1);
      board[i] = null;
      if (evalScore < minEval) minEval = evalScore;
    }
    return minEval;
  }
}

function availableMoves(board: Cell[]): number[] {
  const res: number[] = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) res.push(i);
  return res;
}

function switchPlayer(p: Player): Player {
  return p === 'X' ? 'O' : 'X';
}

function getWin(board: Cell[]): { result: Result; line: number[] | null } {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a], line: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { result: 'draw', line: null };
  return { result: null, line: null };
}

/* =================== UI helpers =================== */

function Btn({ text, onPress, secondary }: { text: string; onPress: () => void; secondary?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[styles.btn, secondary && styles.btnSecondary]}>
      <Text style={styles.btnText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  modeLabel: { fontSize: 16 },
  diffPill: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  diffText: { fontWeight: '700' },

  scoreBar: { flexDirection: 'row', gap: 18, marginBottom: 10 },
  scoreItem: { fontSize: 16 },
  activeTurn: { fontWeight: '800', textDecorationLine: 'underline' },

  board: { flexDirection: 'row', flexWrap: 'wrap', position: 'relative', marginTop: 8, marginBottom: 8 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 48, fontWeight: '900' },
  winCell: { textDecorationLine: 'underline' },

  vLine: { position: 'absolute', top: 0, width: 2, height: '100%', backgroundColor: '#c7c7c7' },
  hLine: { position: 'absolute', left: 0, height: 2, width: '100%', backgroundColor: '#c7c7c7' },

  turn: { fontSize: 16 },
  result: { fontSize: 18, fontWeight: '700' },

  btnRow: { flexDirection: 'row' },
  btn: { backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  btnSecondary: { backgroundColor: '#555' },
  btnText: { color: '#fff', fontWeight: '700' },
});
