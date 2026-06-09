// 공통 텍스트 — variant(크기/굵기)와 color 토큰만 다룸. fontFamily는 전역 패치(globalFont)가 처리.
import { forwardRef } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ColorToken } from '@/unistyles';

type Variant = 'h1' | 'h2' | 'title' | 'body' | 'bodyStrong' | 'caption' | 'label';

const VARIANTS: Record<
  Variant,
  { fontSize: number; fontWeight: TextStyle['fontWeight']; lineHeight: number; color: ColorToken }
> = {
  h1: { fontSize: 28, fontWeight: '800', lineHeight: 34, color: 'text' },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28, color: 'text' },
  title: { fontSize: 20, fontWeight: '700', lineHeight: 26, color: 'text' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, color: 'text' },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 24, color: 'text' },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18, color: 'textMuted' },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18, color: 'textMuted' },
};

export interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: ColorToken;
}

const styles = StyleSheet.create((theme) => ({
  text: (variant: Variant, color?: ColorToken) => {
    const v = VARIANTS[variant];
    return {
      fontSize: v.fontSize,
      fontWeight: v.fontWeight,
      lineHeight: v.lineHeight,
      color: theme.colors[color ?? v.color],
    };
  },
}));

export const Typography = forwardRef<Text, TypographyProps>(function Typography(
  { variant = 'body', color, style, ...rest },
  ref,
) {
  return <Text ref={ref} style={[styles.text(variant, color), style]} {...rest} />;
});
