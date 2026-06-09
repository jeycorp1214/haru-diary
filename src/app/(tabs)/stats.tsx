// 감정 통계 — 연속 작성 스트릭 + 감정 분포 막대 차트(victory-native)
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { currentStreak, moodDistribution } from '@/db/queries/stats';
import { queryKeys } from '@/lib/queryKeys';

export default function StatsScreen() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: queryKeys.statsMoods(), queryFn: moodDistribution });
  const { data: streak } = useQuery({ queryKey: queryKeys.statsStreak(), queryFn: currentStreak });

  const hasData = data && data.length > 0;
  const chartData = (data ?? []).map((d, i) => ({ x: i, y: d.count }));

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('tabs.stats')} />
      <View style={styles.content}>
      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>🔥 {t('stats.streak')}</Text>
        <Text style={styles.streakValue}>{t('stats.streakDays', { count: streak ?? 0 })}</Text>
      </View>

      <Text style={styles.section}>{t('stats.distribution')}</Text>
      {hasData ? (
        <>
          <View style={styles.chart}>
            <CartesianChart
              data={chartData}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 32, right: 32, top: 24 }}>
              {({ points, chartBounds }) => (
                <Bar
                  points={points.y}
                  chartBounds={chartBounds}
                  color="#208AEF"
                  roundedCorners={{ topLeft: 6, topRight: 6 }}
                />
              )}
            </CartesianChart>
          </View>
          <View style={styles.legend}>
            {data!.map((d) => (
              <View key={d.key} style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{d.emoji}</Text>
                <Text style={styles.legendCount}>{d.count}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.muted}>{t('stats.noEntries')}</Text>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  streakCard: {
    backgroundColor: '#208AEF11',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  streakLabel: { fontSize: 14, color: '#666' },
  streakValue: { fontSize: 28, fontWeight: '700', color: '#208AEF' },
  section: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8 },
  muted: { color: '#999', marginTop: 8 },
  chart: { height: 240 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  legendItem: { alignItems: 'center', gap: 2 },
  legendEmoji: { fontSize: 24 },
  legendCount: { fontSize: 13, color: '#666' },
});
