// 루트에 1회 마운트되는 토스트 표시기. toast 싱글톤 구독 → 상단에 스택, 자동 소멸.
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ColorToken } from '@/unistyles';
import { subscribeToast, type ToastItem, type ToastVariant } from '@/lib/toast';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

const ICON: Record<ToastVariant, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const ICON_COLOR: Record<ToastVariant, ColorToken> = {
  success: 'success',
  error: 'danger',
  info: 'primary',
};

const styles = StyleSheet.create((theme) => ({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
  toast: (variant: ToastVariant) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    maxWidth: '92%' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  }),
}));

function ToastRow({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
        onDone(item.id),
      );
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDone, opacity, translateY]);

  return (
    <Animated.View style={[styles.toast(item.variant), { opacity, transform: [{ translateY }] }]}>
      <Icon name={ICON[item.variant]} color={ICON_COLOR[item.variant]} />
      <Typography variant="body" style={{ flexShrink: 1 }}>
        {item.message}
      </Typography>
    </Animated.View>
  );
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () => subscribeToast((item) => setItems((prev) => [...prev, item])),
    [],
  );

  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <Animated.View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      {items.map((item) => (
        <ToastRow key={item.id} item={item} onDone={remove} />
      ))}
    </Animated.View>
  );
}
