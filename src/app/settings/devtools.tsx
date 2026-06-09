// 개발도구 — 데이터 초기화 메뉴. 일기/사진/설정은 확인 다이얼로그, 모든 데이터 삭제는 텍스트 입력 확인.
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Button, Card, Icon, Input, ListRow, Typography } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { deleteAllEntries, deleteAllPhotos, resetSettings, wipeAllData } from '@/lib/devtools';
import { toast } from '@/lib/toast';

const styles = StyleSheet.create((theme) => ({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  group: { gap: 6 },
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

export default function DevToolsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const confirmWord = t('devtools.confirmWord');

  async function handleDeleteEntries() {
    const ok = await confirm({
      title: t('devtools.entriesTitle'),
      message: t('devtools.entriesConfirm'),
      destructive: true,
      confirmLabel: t('devtools.deleteLabel'),
    });
    if (!ok) return;
    deleteAllEntries();
    toast.success(t('devtools.done'));
  }

  async function handleDeletePhotos() {
    const ok = await confirm({
      title: t('devtools.photosTitle'),
      message: t('devtools.photosConfirm'),
      destructive: true,
      confirmLabel: t('devtools.deleteLabel'),
    });
    if (!ok) return;
    deleteAllPhotos();
    toast.success(t('devtools.done'));
  }

  async function handleResetSettings() {
    const ok = await confirm({
      title: t('devtools.settingsTitle'),
      message: t('devtools.settingsConfirm'),
      destructive: true,
      confirmLabel: t('devtools.resetLabel'),
    });
    if (!ok) return;
    resetSettings();
    toast.success(t('devtools.settingsDone'));
  }

  async function handleWipeAll() {
    await wipeAllData();
    // 메모리 상태(잠금/설정/언어)가 stale — 앱 재시작으로 클린 부팅
    try {
      await Updates.reloadAsync();
    } catch {
      // 개발 환경 등 reload 불가 시 안내
      setWipeOpen(false);
      toast.success(t('devtools.wipeDoneRestart'));
    }
  }

  const canWipe = confirmText.trim() === confirmWord;

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('devtools.title')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="caption" color="textMuted">
          {t('devtools.warning')}
        </Typography>

        <Box style={styles.group}>
          <Typography variant="label">{t('devtools.groupPartial')}</Typography>
          <Card gap="xs">
            <ListRow
              left={<Icon name="trash-outline" color="danger" />}
              title={t('devtools.entriesTitle')}
              subtitle={t('devtools.entriesDesc')}
              onPress={handleDeleteEntries}
            />
            <ListRow
              left={<Icon name="images-outline" color="danger" />}
              title={t('devtools.photosTitle')}
              subtitle={t('devtools.photosDesc')}
              onPress={handleDeletePhotos}
            />
            <ListRow
              left={<Icon name="refresh-outline" color="danger" />}
              title={t('devtools.settingsTitle')}
              subtitle={t('devtools.settingsDesc')}
              onPress={handleResetSettings}
            />
          </Card>
        </Box>

        <Box style={styles.group}>
          <Typography variant="label">{t('devtools.groupDanger')}</Typography>
          <Card gap="xs">
            <ListRow
              left={<Icon name="nuclear-outline" color="danger" />}
              title={t('devtools.wipeTitle')}
              subtitle={t('devtools.wipeDesc')}
              onPress={() => {
                setConfirmText('');
                setWipeOpen(true);
              }}
            />
          </Card>
        </Box>
      </ScrollView>

      <Modal
        visible={wipeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setWipeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setWipeOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Typography variant="title" color="danger">
              {t('devtools.wipeTitle')}
            </Typography>
            <Typography variant="body" color="textMuted">
              {t('devtools.wipeConfirm', { word: confirmWord })}
            </Typography>
            <Input
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={confirmWord}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button tone="danger" disabled={!canWipe} onPress={handleWipeAll}>
              {t('devtools.wipeLabel')}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </Box>
  );
}
