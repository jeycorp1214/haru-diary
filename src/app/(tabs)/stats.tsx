// 감정 통계 — 감정별 일기 수 분포 막대 차트(victory-native) + 이모지 범례
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { moodDistribution } from '@/db/queries/stats';

export default function StatsScreen() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['stats', 'moods'], queryFn: moodDistribution });

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t('stats.empty')}</Text>
      </View>
    );
  }

  const chartData = data.map((d, i) => ({ x: i, y: d.count }));

  return (
    <View style={styles.container}>
      <Text style={styles.section}>{t('stats.distribution')}</Text>

      <View style={styles.chart}>
        <CartesianChart data={chartData} xKey="x" yKeys={['y']} domainPadding={{ left: 32, right: 32, top: 24 }}>
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
        {data.map((d) => (
          <View key={d.key} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{d.emoji}</Text>
            <Text style={styles.legendCount}>{d.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#999' },
  section: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8 },
  chart: { height: 260 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  legendItem: { alignItems: 'center', gap: 2 },
  legendEmoji: { fontSize: 24 },
  legendCount: { fontSize: 13, color: '#666' },
});
