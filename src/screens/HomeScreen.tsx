import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, useColorScheme, ToastAndroid,
} from 'react-native';

type Route = 'home' | 'tictactoe' | 'memory';
export default function HomeScreen({ onSelectGame }: { onSelectGame: (r: Route) => void }) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? DARK : LIGHT;

  const DATA = [
    { key: 'tictactoe', title: 'Tic-Tac-Toe', subtitle: 'Classic X-O', emoji: '🎮' },
    { key: 'memory', title: 'Memory Match', subtitle: 'Padankan kad', emoji: '🧠' },
    { key: 'reaction', title: 'Reaction Tap', subtitle: 'Pantas menekan', emoji: '⚡' },
    { key: 'snake', title: 'Snake', subtitle: 'Retro grid', emoji: '🐍' },
  ] as const;

  return (
    <View style={[styles.page, { backgroundColor: C.page }]}>
      <Text style={[styles.title, { color: C.text }]}>Pilih game</Text>

      <FlatList
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        numColumns={2}
        data={DATA}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => {
          const isReady = item.key === 'tictactoe' || item.key === 'memory';
          return (
            <Pressable
            onPress={() => {
              if (item.key === 'tictactoe') onSelectGame('tictactoe');
              else if (item.key === 'memory') onSelectGame('memory');
              else ToastAndroid.show('Coming soon ✨', ToastAndroid.SHORT);
            }}
              android_ripple={{ color: isReady ? '#00000010' : '#00000007' }}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: C.card, borderColor: C.border, shadowColor: C.shadow, opacity: pressed ? 0.96 : 1 },
                !isReady && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.cardSub, { color: C.muted }]} numberOfLines={1}>{item.subtitle}</Text>
              {!isReady && <Text style={[styles.badge, { backgroundColor: C.ghost, color: C.text }]}>soon</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const LIGHT = {
  page: '#f6f7fb',
  text: '#111827',
  muted: '#6b7280',
  card: '#ffffff',
  border: '#e5e7eb',
  ghost: '#eef2f7',
  shadow: '#000',
};
const DARK = {
  page: '#0b0f14',
  text: '#f3f4f6',
  muted: '#9ca3af',
  card: '#111827',
  border: '#374151',
  ghost: '#1f2937',
  shadow: '#000',
};

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 6 },
  title: { alignSelf: 'flex-start', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  grid: { paddingBottom: 24 },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emoji: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
