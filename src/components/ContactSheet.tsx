// 문의하기 바텀시트 — 기기 정보 안내 + 메일 작성기 호출. 기기 정보는 메일 본문에 자동 첨부.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as MailComposer from 'expo-mail-composer';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, Typography } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/constants/meta';
import { toast } from '@/lib/toast';

const styles = StyleSheet.create((theme) => ({
  backdrop: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' as const },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center' as const,
    marginBottom: 4,
  },
}));

export function ContactSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const appVersion = Constants.expoConfig?.version ?? '-';
  const osLabel = t(Platform.OS === 'ios' ? 'device.ios' : 'device.android');
  const deviceLines = [osLabel, `OS ${Device.osVersion ?? '-'}`, `App ${appVersion}`, Device.modelName ?? '-'];

  async function sendEmail() {
    const subject = t('contactSheet.emailSubject');
    const body = `\n\n${t('contactSheet.emailBodyDivider')}\n${deviceLines.join('\n')}`;
    try {
      if (await MailComposer.isAvailableAsync()) {
        await MailComposer.composeAsync({ recipients: [SUPPORT_EMAIL], subject, body });
      } else {
        const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        await Linking.openURL(url);
      }
      onClose();
    } catch {
      toast.error(t('contactSheet.emailFailed'));
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Typography variant="title">{t('contactSheet.title')}</Typography>
          <Typography variant="body" color="textMuted">
            {t('contactSheet.intro', { email: SUPPORT_EMAIL })}
          </Typography>

          <Typography variant="label">{t('contactSheet.deviceSection')}</Typography>
          <Box bg="surfaceAlt" radius="md" p="md" gap="xs">
            {deviceLines.map((line, i) => (
              <Typography key={i} variant="caption">
                {line}
              </Typography>
            ))}
          </Box>

          <Button onPress={sendEmail}>{t('contactSheet.emailButton')}</Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
