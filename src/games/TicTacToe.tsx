import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
  Animated,
  Easing,
  useColorScheme,
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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const C = isDark ? DARK : LIGHT;

  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 48, 380);
  const cellSize = Math.floor(boardSize / 3);

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');

  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);
  const [draws, setDraws] = useState(0);

  const [vsBot, setVsBot] = useState(true);
  const [difficulty, setDifficulty] = useState<'Easy'|'Medium'|'Hard'>('Hard');

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

  useEffect(() => {
    if (!result) return;
    if (result === 'X') setXWins(s => s + 1);
    else if (result === 'O') setOWins(s => s + 1);
    else setDraws(s => s + 1);
  }, [result]);

  // BOT (minimax). Medium/Easy bagi “silap” sikit supaya lebih fun
  useEffect(() => {
    if (!vsBot || result || turn !== 'O') return;
    const t = setTimeout(() => {
      const move = getBestMove(board, 'O', 'X', difficulty);
      if (move != null) onPressCell(move);
    }, 300);
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
    <View style={[styles.page, { backgroundColor: C.page }]}>
      <Text style={[styles.heading, { color: C.text }]}>Tic-Tac-Toe 🎮</Text>

      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={[styles.label, { color: C.muted }]}>VS Bot</Text>
          <Switch value={vsBot} onValueChange={setVsBot} />
        </View>

        <TouchableOpacity onPress={cycleDifficulty} activeOpacity={0.9}
          style={[styles.pill, { backgroundColor: C.pillBg, borderColor: C.border }]}>
          <Text style={[styles.pillText, { color: C.text }]}>{difficulty}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scoresRow}>
        <ScoreCard title="X" value={xWins} active={turn==='X'} color={C.x}/>
        <ScoreCard title="Seri" value={draws} color={C.muted}/>
        <ScoreCard title="O" value={oWins} active={turn==='O'} color={C.o}/>
      </View>

      {/* papan */}
      <View style={[
        styles.boardCard,
        { width: boardSize, backgroundColor: C.card, shadowColor: C.shadow },
      ]}>
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <CellView
              key={i}
              size={cellSize}
              value={board[i]}
              onPress={() => onPressCell(i)}
              colorX={C.x}
              colorO={C.o}
              isDark={isDark}
            />
          ))}

          {/* grid overlay */}
          <View pointerEvents="none" style={[styles.vLine, { left: cellSize, backgroundColor: C.grid }]} />
          <View pointerEvents="none" style={[styles.vLine, { left: cellSize * 2, backgroundColor: C.grid }]} />
          <View pointerEvents="none" style={[styles.hLine, { top: cellSize, backgroundColor: C.grid }]} />
          <View pointerEvents="none" style={[styles.hLine, { top: cellSize * 2, backgroundColor: C.grid }]} />

          {/* garisan kemenangan */}
          {line && (
            <WinLine
              lineIndex={line.index}
              boardSize={boardSize}
              color={C.win}
            />
          )}
        </View>
      </View>

      {result ? (
        <Text style={[styles.result, { color: C.text }]}>
          {result === 'draw' ? 'Seri 😐' : `Menang: ${result} 🎉`}
        </Text>
      ) : (
        <Text style={[styles.turn, { color: C.muted }]}>Giliran: <Text style={{ color: turn==='X'?C.x:C.o, fontWeight:'800' }}>{turn}</Text></Text>
      )}

      <View style={{ height: 12 }} />
      <View style={styles.buttons}>
        <Btn text="Main lagi" onPress={resetBoard} bg={C.primary} />
        <Btn text="Reset skor" onPress={resetAll} bg={C.ghost} textColor={C.text}/>
      </View>
    </View>
  );
}

/* ------------ Cell (dengan animasi) ------------ */

function CellView({
  size, value, onPress, colorX, colorO, isDark,
}: { size: number; value: Cell; onPress: () => void; colorX: string; colorO: string; isDark: boolean; }) {
  const scale = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value) {
      scale.setValue(0.5);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(1);
    }
  }, [value]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.cell, { width: size, height: size }]}
    >
      {!!value && (
        <Animated.Text
          style={[
            styles.mark,
            { transform: [{ scale }], color: value === 'X' ? colorX : colorO,
              textShadowColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
            },
          ]}
        >
          {value}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
}

/* ------------ Win line overlay ------------ */

function WinLine({ lineIndex, boardSize, color }: { lineIndex: number; boardSize: number; color: string }) {
  const thickness = 6;
  const diag = Math.sqrt(2) * boardSize;

  const base = {
    position: 'absolute' as const,
    backgroundColor: color,
  };

  if (lineIndex <= 2) {
    // rows
    const row = lineIndex;
    const top = row * (boardSize / 3) + boardSize / 6 - thickness / 2;
    return <View style={[base, { top, left: 0, width: boardSize, height: thickness, borderRadius: 99 }]} />;
  }
  if (lineIndex <= 5) {
    // cols
    const col = lineIndex - 3;
    const left = col * (boardSize / 3) + boardSize / 6 - thickness / 2;
    return <View style={[base, { left, top: 0, width: thickness, height: boardSize, borderRadius: 99 }]} />;
  }
  // diagonals
  const rotate = lineIndex === 6 ? '45deg' : '-45deg';
  return (
    <View
      style={[
        base,
        {
          width: diag,
          height: thickness,
          top: boardSize / 2 - thickness / 2,
          left: boardSize / 2 - diag / 2,
          transform: [{ rotate }],
          borderRadius: 99,
        },
      ]}
    />
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

  if (difficulty === 'Easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  if (difficulty === 'Medium' && Math.random() < 0.15) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

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

function minimax(board: Cell[], current: Player, bot: Player, human: Player, depth: number): number {
  const { result } = getWin(board);
  if (result) {
    if (result === bot) return 10 - depth;
    if (result === human) return depth - 10;
    return 0;
  }
  const empty = availableMoves(board);

  if (current === bot) {
    let maxEval = -Infinity;
    for (const i of empty) {
      board[i] = current;
      const s = minimax(board, switchPlayer(current), bot, human, depth + 1);
      board[i] = null;
      if (s > maxEval) maxEval = s;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const i of empty) {
      board[i] = current;
      const s = minimax(board, switchPlayer(current), bot, human, depth + 1);
      board[i] = null;
      if (s < minEval) minEval = s;
    }
    return minEval;
  }
}

function availableMoves(board: Cell[]): number[] {
  const res: number[] = [];
  for (let i = 0; i < board.length; i++) if (!board[i]) res.push(i);
  return res;
}
function switchPlayer(p: Player): Player { return p === 'X' ? 'O' : 'X'; }

function getWin(board: Cell[]): { result: Result; line: { index: number } | null } {
  for (let i = 0; i < LINES.length; i++) {
    const [a,b,c] = LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a], line: { index: i } };
    }
  }
  if (board.every(Boolean)) return { result: 'draw', line: null };
  return { result: null, line: null };
}

/* =================== UI helpers =================== */

function ScoreCard({ title, value, active, color }: { title: string; value: number; active?: boolean; color: string }) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}{active ? ' •' : ''}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

function Btn({ text, onPress, bg, textColor = '#fff' }: { text: string; onPress: () => void; bg: string; textColor?: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}
      style={[styles.btn, { backgroundColor: bg }]}>
      <Text style={[styles.btnText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

/* =================== Styles & Themes =================== */

const LIGHT = {
  page: '#f6f7fb',
  text: '#111827',
  muted: '#6b7280',
  card: '#ffffff',
  grid: '#e5e7eb',
  border: '#e5e7eb',
  primary: '#111827',
  ghost: '#e5e7eb',
  x: '#ef4444',
  o: '#16a34a',
  win: '#0ea5e9',
  pillBg: '#f3f4f6',
  shadow: '#000',
};

const DARK = {
  page: '#0b0f14',
  text: '#f3f4f6',
  muted: '#9ca3af',
  card: '#111827',
  grid: '#374151',
  border: '#374151',
  primary: '#2563eb',
  ghost: '#1f2937',
  x: '#fb7185',
  o: '#34d399',
  win: '#60a5fa',
  pillBg: '#111827',
  shadow: '#000',
};

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', padding: 20 },
  heading: { fontSize: 26, fontWeight: '800', marginTop: 8, marginBottom: 8, letterSpacing: 0.3 },

  row: { width: '100%', maxWidth: 440, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16 },

  pill: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: '800' },

  scoresRow: { width: '100%', maxWidth: 440, flexDirection: 'row', gap: 10, marginBottom: 12, justifyContent: 'space-between' },
  card: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },

  boardCard: {
    borderRadius: 20,
    padding: 12,
    elevation: 6,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  board: { flexDirection: 'row', flexWrap: 'wrap', position: 'relative', borderRadius: 14, overflow: 'hidden' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 56, fontWeight: '900', letterSpacing: 2 },

  vLine: { position: 'absolute', top: 0, width: 2, height: '100%' },
  hLine: { position: 'absolute', left: 0, height: 2, width: '100%' },

  result: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  turn: { fontSize: 16, marginTop: 4 },

  buttons: { flexDirection: 'row', gap: 12, marginTop: 6 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  btnText: { fontWeight: '800' },
});
