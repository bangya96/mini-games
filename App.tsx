// App.tsx
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import TicTacToe from './src/games/TicTacToe';
import MemoryMatch from './src/games/MemoryMatch';

type Route = 'home' | 'tictactoe' | 'memory';

export default function App() {
  const isDark = useColorScheme() === 'dark';

  // theme ringkas
  const BG = isDark ? '#0b0f14' : '#f6f7fb';
  const TEXT = isDark ? '#f3f4f6' : '#111827';
  const BTN_BG = isDark ? '#111827' : '#ffffff';
  const BTN_BORDER = isDark ? '#374151' : '#e5e7eb';
  const BTN_ICON_BG = isDark ? '#1f2937' : '#f3f4f6';
  const RIPPLE = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  const [route, setRoute] = useState<Route>('home');

  const showBack = route !== 'home';

  function renderBody() {
    if (route === 'tictactoe') return <TicTacToe />;
    if (route === 'memory') return <MemoryMatch />;
    return <HomeScreen onSelectGame={setRoute} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.container, { backgroundColor: BG }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {showBack ? (
            <BackHomeButton
              textColor={TEXT}
              bg={BTN_BG}
              border={BTN_BORDER}
              iconBg={BTN_ICON_BG}
              ripple={RIPPLE}
              onPress={() => setRoute('home')}
            />
          ) : (
            <Text style={[styles.appTitle, { color: TEXT }]}>Game Hub</Text>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>{renderBody()}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

/* ---------------- Back button component ---------------- */

function BackHomeButton({
  onPress,
  textColor,
  bg,
  border,
  iconBg,
  ripple,
}: {
  onPress: () => void;
  textColor: string;
  bg: string;
  border: string;
  iconBg: string;
  ripple: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: ripple }}
      accessibilityRole="button"
      accessibilityLabel="Kembali ke Home"
      style={({ pressed }) => [
        styles.backWrap,
        {
          backgroundColor: bg,
          borderColor: border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.backIcon, { backgroundColor: iconBg }]}>
        <Text style={[styles.backIconText, { color: textColor }]}>←</Text>
      </View>
      <Text style={[styles.backText, { color: textColor }]}>Home</Text>
    </Pressable>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  body: { flex: 1 },

  // Back button (pill)
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    // shadow/bayang halus
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  backIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: { fontSize: 14, fontWeight: '900' },
  backText: { fontSize: 16, fontWeight: '800' },
});
