// 감정 통계 화면 (구현 예정 — victory-native 그래프)
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('common.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#999' },
});
