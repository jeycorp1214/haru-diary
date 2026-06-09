// Unistyles v3 설정 — light/dark 테마 토큰 + breakpoints. 앱 진입 시 1회 import(_layout 최상단).
// 수동 테마(useSettingsStore.themeMode)는 _layout에서 UnistylesRuntime로 동기화.
import { StyleSheet } from 'react-native-unistyles';

const sharedColors = {
  brand: '#208AEF',
  danger: '#e0245e',
};

const lightTheme = {
  colors: {
    ...sharedColors,
    background: '#ffffff',
    card: '#fafafa',
    text: '#111111',
    textMuted: '#888888',
    border: '#dddddd',
    inputBg: '#7676801f',
  },
  space: (v: number) => v * 8,
  radius: { sm: 8, md: 12, lg: 16 },
  fontSize: { sm: 13, md: 16, lg: 20, xl: 28 },
};

const darkTheme: typeof lightTheme = {
  colors: {
    ...sharedColors,
    background: '#000000',
    card: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#aaaaaa',
    border: '#444444',
    inputBg: '#7676803f',
  },
  space: (v: number) => v * 8,
  radius: { sm: 8, md: 12, lg: 16 },
  fontSize: { sm: 13, md: 16, lg: 20, xl: 28 },
};

const appThemes = { light: lightTheme, dark: darkTheme };

const breakpoints = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: { adaptiveThemes: true }, // 기본 OS 추종, _layout에서 수동 설정과 동기화
});
