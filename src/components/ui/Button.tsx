// 공통 버튼 — variant(solid/outline/text) × size(sm/md/lg) + loading/disabled + 좌우 아이콘.
import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ColorToken } from '@/unistyles';
import { Icon, type IconName } from './Icon';

type Variant = 'solid' | 'outline' | 'text';
type Size = 'sm' | 'md' | 'lg';
type Tone = 'primary' | 'danger';

const SIZES: Record<Size, { py: number; px: number; fontSize: number; icon: number }> = {
  sm: { py: 8, px: 14, fontSize: 14, icon: 16 },
  md: { py: 12, px: 18, fontSize: 16, icon: 18 },
  lg: { py: 14, px: 22, fontSize: 17, icon: 20 },
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  children: string;
}

const styles = StyleSheet.create((theme) => ({
  base: (variant: Variant, size: Size, tone: Tone, isDisabled: boolean) => {
    const s = SIZES[size];
    const accent = tone === 'danger' ? theme.colors.danger : theme.colors.primary;
    return {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: s.py,
      paddingHorizontal: s.px,
      borderRadius: theme.radius.md,
      backgroundColor: variant === 'solid' ? accent : 'transparent',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: accent,
      opacity: isDisabled ? 0.5 : 1,
    };
  },
  fg: (variant: Variant, size: Size, tone: Tone) => ({
    color:
      variant === 'solid'
        ? theme.colors.onPrimary
        : tone === 'danger'
          ? theme.colors.danger
          : theme.colors.primary,
    fontSize: SIZES[size].fontSize,
    fontWeight: '600' as const,
  }),
}));

export const Button = forwardRef<View, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', tone = 'primary', loading, disabled, leftIcon, rightIcon, children, ...rest },
  ref,
) {
  const isDisabled = !!(disabled || loading);
  const fgToken: ColorToken =
    variant === 'solid' ? 'onPrimary' : tone === 'danger' ? 'danger' : 'primary';
  const fgStyle = styles.fg(variant, size, tone);

  return (
    <Pressable ref={ref} disabled={isDisabled} style={styles.base(variant, size, tone, isDisabled)} {...rest}>
      {loading ? (
        <ActivityIndicator color={fgStyle.color} size="small" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={SIZES[size].icon} color={fgToken} />}
          <Text style={fgStyle}>{children}</Text>
          {rightIcon && <Icon name={rightIcon} size={SIZES[size].icon} color={fgToken} />}
        </>
      )}
    </Pressable>
  );
});
