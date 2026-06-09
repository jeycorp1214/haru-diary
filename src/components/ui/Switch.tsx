// 토글 스위치 — RN Switch + 테마 색.
import { Switch as RNSwitch } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const styles = StyleSheet.create((theme) => ({
  trackOn: { color: theme.colors.primary },
  trackOff: { color: theme.colors.border },
  thumb: { color: '#ffffff' },
}));

export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: styles.trackOff.color, true: styles.trackOn.color }}
      thumbColor={styles.thumb.color}
    />
  );
}
