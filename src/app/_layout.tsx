// 앱 루트 레이아웃 — Provider 계층 + DB 마이그레이션 게이트 (잠금 게이트는 후속 단계)
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider } from 'tamagui';

import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { bootstrapFts, db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { seedMoods } from '@/db/seed';
import { queryClient } from '@/lib/query';
import config from '../../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useMigrations(db, migrations);

  // 마이그레이션 성공 후 FTS 가상테이블 보장 + 감정 시드(멱등)
  useEffect(() => {
    if (!success) return;
    bootstrapFts();
    seedMoods().catch((e) => console.error('seedMoods 실패', e));
  }, [success]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {error ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Text>데이터베이스 초기화 실패</Text>
                <Text>{error.message}</Text>
              </View>
            ) : !success ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : (
              <>
                <AnimatedSplashOverlay />
                <AppTabs />
              </>
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
