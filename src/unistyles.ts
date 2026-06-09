// Unistyles v3 설정 — light/dark 테마 토큰 + breakpoints. 앱 진입 시 1회 import(_layout 최상단).
// 수동 테마(useSettingsStore.themeMode)는 _layout에서 UnistylesRuntime로 동기화.
import { StyleSheet } from 'react-native-unistyles';

// 색을 제외한 토큰은 테마 무관 → 공유.
const space = (v: number) => v * 8;
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
const fontSize = { sm: 13, md: 16, lg: 20, xl: 28 };
const shared = { space, spacing, radius, fontSize };

const lightColors = {
  // semantic
  primary: '#208AEF',
  onPrimary: '#ffffff',
  primarySoft: '#208AEF14',
  surface: '#ffffff',
  surfaceAlt: '#fafafa',
  text: '#111111',
  textMuted: '#888888',
  textDisabled: '#bbbbbb',
  border: '#dddddd',
  danger: '#e0245e',
  onDanger: '#ffffff',
  success: '#1aa86b',
  placeholder: '#999999',
  // 하위호환 별칭(LockScreen/LockGate 등 기존 사용)
  brand: '#208AEF',
  background: '#ffffff',
  card: '#fafafa',
  inputBg: '#7676801f',
};

const darkColors: typeof lightColors = {
  primary: '#4A9EFF',
  onPrimary: '#ffffff',
  primarySoft: '#4A9EFF22',
  surface: '#000000',
  surfaceAlt: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#aaaaaa',
  textDisabled: '#555555',
  border: '#444444',
  danger: '#ff5a7a',
  onDanger: '#ffffff',
  success: '#34c98a',
  placeholder: '#777777',
  brand: '#4A9EFF',
  background: '#000000',
  card: '#1a1a1a',
  inputBg: '#7676803f',
};

// 컴포넌트 props용 토큰 타입
export type ColorToken = keyof typeof lightColors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type FontSizeToken = keyof typeof fontSize;

const lightTheme = { colors: lightColors, ...shared };
const darkTheme = { colors: darkColors, ...shared };

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
