// 감정 통계 — 연속 작성 스트릭 + 감정 분포 막대 차트(victory-native)
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Bar, CartesianChart } from 'victory-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Typography } from '@/components/ui';
import { emoticonSource } from '@/constants/emoticons';
import { currentStreak, moodDistribution } from '@/db/queries/stats';
import { queryKeys } from '@/lib/queryKeys';

const styles = StyleSheet.create((theme) => ({
  bar: { color: theme.colors.primary },
}));

export default function StatsScreen() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: queryKeys.statsMoods(), queryFn: moodDistribution });
  const { data: streak } = useQuery({ queryKey: queryKeys.statsStreak(), queryFn: currentStreak });

  const hasData = data && data.length > 0;
  const chartData = (data ?? []).map((d, i) => ({ x: i, y: d.count }));

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('tabs.stats')} />
      <Box flex={1} p="md">
        <Box bg="primarySoft" radius="md" p="md" align="center" gap="xs" mb="lg">
          <Typography variant="caption">🔥 {t('stats.streak')}</Typography>
          <Typography variant="h1" color="primary">
            {t('stats.streakDays', { count: streak ?? 0 })}
          </Typography>
        </Box>

        <Typography variant="label" style={{ marginBottom: 8 }}>
          {t('stats.distribution')}
        </Typography>
        {hasData ? (
          <>
            <View style={{ height: 240 }}>
              <CartesianChart
                data={chartData}
                xKey="x"
                yKeys={['y']}
                domainPadding={{ left: 32, right: 32, top: 24 }}>
                {({ points, chartBounds }) => (
                  <Bar
                    points={points.y}
                    chartBounds={chartBounds}
                    color={styles.bar.color}
                    roundedCorners={{ topLeft: 6, topRight: 6 }}
                  />
                )}
              </CartesianChart>
            </View>
            <Box row justify="space-around" mt="sm">
              {data!.map((d) => (
                <Box key={d.key} align="center" gap="xs">
                  {emoticonSource(d.emoji) ? (
                    <Image
                      source={emoticonSource(d.emoji)}
                      style={{ width: 28, height: 28 }}
                      contentFit="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
                  )}
                  <Typography variant="caption">{d.count}</Typography>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Typography variant="caption" color="textMuted">
            {t('stats.noEntries')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
