import { Platform, Vibration } from 'react-native';

export const safeVibrate = (ms = 60) => {
  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') Vibration.vibrate(ms);
  } catch {
    /* ignore jika device/emulator tak support */
  }
};
