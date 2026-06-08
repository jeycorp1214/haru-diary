// 앱 루트 레이아웃 — Provider 계층 + DB 마이그레이션 게이트 (잠금 게이트는 후속 단계)
import { useFonts } from 'expo-font';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CriticalErrorScreen } from '@/components/auth/CriticalErrorScreen';
import { LockGate } from '@/components/auth/LockGate';
import { ErrorBoundary } from '@/components/error-boundary';
import { bootstrapFts, db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { seedMoods } from '@/db/seed';
import { FONT_ASSETS, FONT_FAMILY, FONT_FAMILY_BOLD } from '@/lib/fonts';
import { setGlobalFont } from '@/lib/globalFont';
import '@/lib/i18n';
import { queryClient } from '@/lib/query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import config from '../../tamagui.config';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const colorScheme = themeMode === 'system' ? systemScheme : themeMode;
  const { success, error } = useMigrations(db, migrations);
  const [fontsLoaded] = useFonts(FONT_ASSETS);
  const fontFamily = useSettingsStore((s) => s.fontFamily);

  // 전역 기본 글꼴 지정(자식 렌더 전에 설정). 변경 시 아래 Stack key로 remount해 라이브 반영.
  setGlobalFont(FONT_FAMILY[fontFamily], FONT_FAMILY_BOLD[fontFamily]);

  // 마이그레이션 성공 후 FTS 가상테이블 보장 + 감정 시드(멱등)
  useEffect(() => {
    if (!success) return;
    bootstrapFts();
    seedMoods().catch((e) => console.error('seedMoods 실패', e));
  }, [success]);

  return (
    <ErrorBoundary fallback={<CriticalErrorScreen />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {error ? (
                <View
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
                >
                  <Text>데이터베이스 초기화 실패</Text>
                  <Text>{error.message}</Text>
                </View>
              ) : !success || !fontsLoaded ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator />
                </View>
              ) : (
                <LockGate>
                  <AnimatedSplashOverlay />
                  <Stack key={fontFamily} screenOptions={{ headerShown: false }} />
                </LockGate>
              )}
            </ThemeProvider>
          </QueryClientProvider>
        </TamaguiProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
