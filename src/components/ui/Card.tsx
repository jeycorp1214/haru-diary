// 카드 컨테이너 — surfaceAlt 배경 + 라운드 + 테두리. Box 기반(레이아웃 props 그대로 받음).
import { Box, type BoxProps } from './Box';

export function Card({ children, ...rest }: BoxProps) {
  return (
    <Box bg="surfaceAlt" radius="md" p="md" border {...rest}>
      {children}
    </Box>
  );
}
