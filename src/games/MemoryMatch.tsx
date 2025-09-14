import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  useColorScheme,
  Pressable,
  Animated,
} from 'react-native';
import { safeVibrate } from '../utils/haptics';


type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Card = { id: string; symbol: string; matched: boolean };

const EMOJIS = ['🍎','🚗','⭐','🐶','🌙','⚽','🎵','🍩','🌼','🧩','🎲','🍀','🦄','🍕','🎈','🐱','🍉','🚀','🎮','🧃'];

export default function MemoryMatch() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DARK : LIGHT;
  const { width } = useWindowDimensions();

  // papan responsif
  const maxBoard = Math.min(width - 24, 420);

  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const config = useMemo(() => getGridConfig(difficulty), [difficulty]); // rows, cols, pairCount
  const [deck, setDeck] = useState<Card[]>(() => makeDeck(config.pairCount));
  const [revealed, setRevealed] = useState<number[]>([]); // index2 yang sedang terbuka
  const [locked, setLocked] = useState(false); // kunci input bila tunggu flip balik
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);

  const allMatched = useMemo(() => deck.every(c => c.matched), [deck]);

  // timer
  useEffect(() => {
    if (!started || allMatched) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, allMatched]);

  // reset bila difficulty berubah
  useEffect(() => {
    newGame(difficulty);
  }, [difficulty]);

  function newGame(diff: Difficulty = difficulty) {
    const cfg = getGridConfig(diff);
    setDeck(makeDeck(cfg.pairCount));
    setRevealed([]);
    setLocked(false);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
  }

  function onFlip(i: number) {
    if (locked || deck[i].matched) return;
    if (!started) setStarted(true);

    // elak flip kad yg sama dua kali
    if (revealed.includes(i)) return;

    if (revealed.length === 0) {
      setRevealed([i]);
      return;
    }
    if (revealed.length === 1) {
      const j = revealed[0];
      const same = deck[i].symbol === deck[j].symbol;

      const nextRev = [j, i];
      setRevealed(nextRev);
      setMoves(m => m + 1);

      if (same) {
        // match!
        setTimeout(() => {
          setDeck(d => {
            const copy = [...d];
            copy[i] = { ...copy[i], matched: true };
            copy[j] = { ...copy[j], matched: true };
            return copy;
          });
          setRevealed([]);
          if (deck.filter(c => c.matched).length + 2 === deck.length) {
            safeVibrate(60);
          }
        }, 350);
      } else {
        // tidak match → flip balik
        setLocked(true);
        setTimeout(() => {
          setRevealed([]);
          setLocked(false);
        }, 850);
      }
      return;
    }
  }

  const boardWidth = maxBoard;
  const cardGap = 8;
  const cardSize = Math.floor((boardWidth - cardGap * (config.cols - 1)) / config.cols);

  return (
    <View style={[styles.page, { backgroundColor: C.page }]}>
      <Text style={[styles.title, { color: C.text }]}>Memory Match 🧠</Text>

      {/* bar atas */}
      <View style={styles.topBar}>
        <Pill
          text={difficulty}
          onPress={() =>
            setDifficulty(d => (d === 'Hard' ? 'Medium' : d === 'Medium' ? 'Easy' : 'Hard'))
          }
          bg={C.pillBg}
          border={C.border}
          textColor={C.text}
        />
        <View style={styles.stats}>
          <Stat label="Langkah" value={moves} color={C.text} />
          <Stat label="Masa" value={formatTime(seconds)} color={C.text} />
        </View>
      </View>

      {/* papan */}
      <View
        style={[
          styles.board,
          { width: boardWidth, gap: cardGap, backgroundColor: C.card, borderColor: C.border, shadowColor: C.shadow },
        ]}
      >
        {deck.map((card, idx) => {
          const flipped = card.matched || revealed.includes(idx);
          return (
            <MemoryCard
              key={card.id}
              size={cardSize}
              symbol={card.symbol}
              flipped={flipped}
              matched={card.matched}
              onPress={() => onFlip(idx)}
              colors={C}
            />
          );
        })}
      </View>

      {/* status / butang */}
      {allMatched ? (
        <Text style={[styles.result, { color: C.text }]}>
          🎉 Siap! {moves} langkah • {formatTime(seconds)}
        </Text>
      ) : (
        <Text style={[styles.tip, { color: C.muted }]}>Padankan semua pasangan kad.</Text>
      )}

      <View style={styles.btnRow}>
        <Btn text="Main lagi" onPress={() => newGame()} bg={C.primary} />
        <Btn text="Tukar tahap" onPress={() => setDifficulty(d => (d === 'Hard' ? 'Medium' : d === 'Medium' ? 'Easy' : 'Hard'))} bg={C.ghost} textColor={C.text} />
      </View>
    </View>
  );
}

/* ==================== Komponen UI ==================== */

function MemoryCard({
    size,
    symbol,
    flipped,
    matched,
    onPress,
    colors,
  }: {
    size: number;
    symbol: string;
    flipped: boolean;
    matched: boolean;
    onPress: () => void;
    colors: typeof LIGHT;
  }) {
    const anim = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  
    useEffect(() => {
      Animated.timing(anim, {
        toValue: flipped ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, [flipped]);
  
    // Rotate kedua-dua muka (front/back) — tak guna opacity crossfade
    const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRot  = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  
    return (
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.07)' }} style={{ width: size, height: size }}>
        <View style={{ flex: 1, borderRadius: 12 }}>
          {/* depan (tertutup) */}
          <Animated.View
            style={[
              styles.face,
              {
                backgroundColor: colors.cover,
                borderColor: colors.border,
                transform: [{ perspective: 900 }, { rotateY: frontRot }],
              },
            ]}
          >
            <View style={[styles.coverDot, { backgroundColor: colors.grid }]} />
          </Animated.View>
  
          {/* belakang (emoji/simbol) */}
          <Animated.View
            style={[
              styles.face,
              {
                backgroundColor: matched ? colors.matched : colors.revealed,
                borderColor: colors.border,
                transform: [{ perspective: 900 }, { rotateY: backRot }],
              },
            ]}
          >
            <Text style={[styles.emoji, { color: colors.text }]}>{symbol}</Text>
          </Animated.View>
        </View>
      </Pressable>
    );
  }
  

function Pill({ text, onPress, bg, border, textColor }: { text: string; onPress: () => void; bg: string; border: string; textColor: string; }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillText, { color: textColor }]}>{text}</Text>
    </Pressable>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function Btn({ text, onPress, bg, textColor = '#fff' }: { text: string; onPress: () => void; bg: string; textColor?: string }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={[styles.btn, { backgroundColor: bg }]}>
      <Text style={[styles.btnText, { color: textColor }]}>{text}</Text>
    </Pressable>
  );
}

/* ==================== Logik / Util ==================== */

function getGridConfig(diff: Difficulty) {
  if (diff === 'Easy') return { rows: 3, cols: 4, pairCount: 6 };
  if (diff === 'Hard') return { rows: 4, cols: 5, pairCount: 10 };
  return { rows: 4, cols: 4, pairCount: 8 }; // Medium
}

function makeDeck(pairCount: number): Card[] {
  const picks = shuffle(EMOJIS).slice(0, pairCount);
  const pair = picks.flatMap(sym => [
    { id: sym + ':a:' + Math.random().toString(36).slice(2,8), symbol: sym, matched: false },
    { id: sym + ':b:' + Math.random().toString(36).slice(2,8), symbol: sym, matched: false },
  ]);
  return shuffle(pair);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ==================== Styles & Theme ==================== */

const LIGHT = {
  page: '#f6f7fb',
  text: '#111827',
  muted: '#6b7280',
  card: '#ffffff',
  cover: '#e9eef7',
  revealed: '#fefefe',
  matched: '#ddf7e7',
  grid: '#e5e7eb',
  border: '#e5e7eb',
  primary: '#111827',
  ghost: '#e5e7eb',
  pillBg: '#f3f4f6',
  shadow: '#000',
};

const DARK = {
  page: '#0b0f14',
  text: '#f3f4f6',
  muted: '#9ca3af',
  card: '#0f172a',
  cover: '#111827',
  revealed: '#1f2937',
  matched: '#064e3b',
  grid: '#374151',
  border: '#374151',
  primary: '#2563eb',
  ghost: '#1f2937',
  pillBg: '#111827',
  shadow: '#000',
};

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  topBar: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stats: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: '900' },

  board: {
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  cardInner: {
    flex: 1,
    borderWidth: 1,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    backfaceVisibility: 'hidden',
  },
  backFace: {
    transform: [{ rotateY: '180deg' }],
  },
  coverDot: { width: 18, height: 18, borderRadius: 9 },
  emoji: { fontSize: 30, fontWeight: '800' },

  pill: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: '800' },

  tip: { marginTop: 8, fontSize: 14 },
  result: { marginTop: 8, fontSize: 18, fontWeight: '800' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  btnText: { fontWeight: '800' },
});
