// 로딩 인디케이터 — fullscreen이면 화면 중앙 + surface 배경.
import { ActivityIndicator } from 'react-native';

import { Box } from './Box';

export function Spinner({
  size = 'small',
  fullscreen,
}: {
  size?: 'small' | 'large';
  fullscreen?: boolean;
}) {
  if (fullscreen) {
    return (
      <Box flex={1} align="center" justify="center" bg="surface">
        <ActivityIndicator size={size} />
      </Box>
    );
  }
  return <ActivityIndicator size={size} />;
}
