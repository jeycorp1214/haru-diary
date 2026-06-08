// 화면 공용 헤더 — 기본 네비 헤더 대신 자체 헤더. RN Text라 전역 글꼴이 그대로 적용됨.
// showBack: push된 화면용 뒤로가기. right: 우측 액션(저장/삭제 등).
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenHeader({
  title,
  right,
  showBack,
}: {
  title: string;
  right?: ReactNode;
  showBack?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const color = isDark ? '#fff' : '#111';
  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.left}>
        {showBack && (
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <Text style={[styles.backIcon, { color }]}>‹</Text>
          </Pressable>
        )}
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  back: { marginLeft: -4 },
  backIcon: { fontSize: 34, lineHeight: 34, fontWeight: '300' },
  title: { fontSize: 24, fontWeight: '700', flexShrink: 1 },
});
