// App.tsx
import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import TicTacToe from './src/games/TicTacToe';

export default function App() {
  const isDark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
        edges={['top', 'bottom']}
      >
        <TicTacToe />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
