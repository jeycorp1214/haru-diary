// 치명 오류 화면 — Tamagui/Provider가 깨져도 표시되도록 순수 RN으로 구성
import { StyleSheet, Text, View } from 'react-native';

export function CriticalErrorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>문제가 발생했습니다</Text>
      <Text style={styles.body}>앱을 완전히 종료한 뒤 다시 실행해 주세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#111' },
  body: { fontSize: 14, color: '#666', textAlign: 'center' },
});
