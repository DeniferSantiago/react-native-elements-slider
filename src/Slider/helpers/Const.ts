import { Easing, Platform } from 'react-native';

export const TRACK_SIZE = 4;
export const THUMB_SIZE = 40;
export const TRACK_STYLE = Platform.select({ web: 0, default: -1 });
export const DEFAULT_ANIMATION_CONFIGS = {
  spring: {
    friction: 7,
    tension: 100,
    useNativeDriver: true,
  },
  timing: {
    duration: 150,
    easing: Easing.inOut(Easing.ease),
    delay: 0,
    useNativeDriver: true,
  },
};
