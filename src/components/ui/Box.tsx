// 레이아웃 프리미티브 — View 대체. 패딩/마진/정렬/배경을 토큰 props로. 외부 마진은 부모가 결정.
import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { ColorToken, RadiusToken, SpacingToken } from '@/unistyles';

type Align = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

interface LayoutProps {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  gap?: SpacingToken;
  row?: boolean;
  align?: Align;
  justify?: Justify;
  bg?: ColorToken;
  radius?: RadiusToken;
  border?: boolean;
  flex?: number;
}

export interface BoxProps extends ViewProps, LayoutProps {}

const styles = StyleSheet.create((theme) => ({
  box: (p: LayoutProps) => {
    const sp = (t?: SpacingToken) => (t == null ? undefined : theme.spacing[t]);
    return {
      flexDirection: p.row ? ('row' as const) : undefined,
      alignItems: p.align,
      justifyContent: p.justify,
      gap: sp(p.gap),
      padding: sp(p.p),
      paddingHorizontal: sp(p.px),
      paddingVertical: sp(p.py),
      paddingTop: sp(p.pt),
      paddingBottom: sp(p.pb),
      margin: sp(p.m),
      marginHorizontal: sp(p.mx),
      marginVertical: sp(p.my),
      marginTop: sp(p.mt),
      marginBottom: sp(p.mb),
      backgroundColor: p.bg ? theme.colors[p.bg] : undefined,
      borderRadius: p.radius ? theme.radius[p.radius] : undefined,
      borderWidth: p.border ? 1 : undefined,
      borderColor: p.border ? theme.colors.border : undefined,
      flex: p.flex,
    };
  },
}));

export const Box = forwardRef<View, BoxProps>(function Box(props, ref) {
  const {
    p, px, py, pt, pb, m, mx, my, mt, mb, gap, row, align, justify, bg, radius, border, flex,
    style, ...rest
  } = props;
  const layout: LayoutProps = {
    p, px, py, pt, pb, m, mx, my, mt, mb, gap, row, align, justify, bg, radius, border, flex,
  };
  return <View ref={ref} style={[styles.box(layout), style]} {...rest} />;
});
