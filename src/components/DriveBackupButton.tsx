// Google Drive 백업 버튼 — client ID 설정 시에만 마운트(useAuthRequest 호출 안전)
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useDriveBackup } from '@/lib/cloud/googleDrive';

export function DriveBackupButton() {
  const { t } = useTranslation();
  const drive = useDriveBackup();

  async function onPress() {
    try {
      const r = await drive.backup();
      if (r === 'ok') Alert.alert('', t('settings.cloudDone'));
    } catch (e) {
      Alert.alert('백업 실패', String(e));
    }
  }

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{t('settings.cloudBackup')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#208AEF',
    alignItems: 'center',
  },
  buttonText: { color: '#208AEF', fontWeight: '600' },
});
