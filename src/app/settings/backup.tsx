// 백업/복원 설정 — 내보내기(JSON/PDF)·복원(가져오기)·클라우드(Drive) 그룹 행.
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useQueryClient } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/ScreenHeader';
import { DriveBackupRow } from '@/components/DriveBackupRow';
import { Box, Card, Icon, ListRow, Typography } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { exportEntriesJson, importEntriesJson } from '@/lib/backup';
import { isDriveConfigured } from '@/lib/cloud/googleDrive';
import { exportEntriesPdf } from '@/lib/pdf';

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  group: { gap: 6 },
}));

export default function BackupSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  async function handleExport() {
    try {
      await exportEntriesJson();
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  }

  async function handleExportPdf() {
    try {
      await exportEntriesPdf(t('entry.untitled'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  }

  async function handleImport() {
    const ok = await confirm({
      title: t('settings.importConfirmTitle'),
      message: t('settings.importConfirmMsg'),
      confirmLabel: t('settings.importConfirmOk'),
      cancelLabel: t('entry.cancel'),
    });
    if (!ok) return;
    try {
      const n = await importEntriesJson();
      if (n === null) return; // 파일 선택 취소
      queryClient.invalidateQueries();
      toast.success(t('settings.importDone', { count: n }));
    } catch {
      toast.error(t('settings.importFailed'));
    }
  }

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.backupRestore')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Box style={styles.group}>
          <Typography variant="label">{t('settings.exportGroup')}</Typography>
          <Card gap="xs">
            <ListRow
              left={<Icon name="share-outline" />}
              title={t('settings.exportJsonTitle')}
              subtitle={t('settings.exportJsonDesc')}
              right={<Icon name="chevron-forward" color="textMuted" />}
              onPress={handleExport}
            />
            <ListRow
              left={<Icon name="document-text-outline" />}
              title={t('settings.exportPdfTitle')}
              subtitle={t('settings.exportPdfDesc')}
              right={<Icon name="chevron-forward" color="textMuted" />}
              onPress={handleExportPdf}
            />
          </Card>
        </Box>

        <Box style={styles.group}>
          <Typography variant="label">{t('settings.restoreGroup')}</Typography>
          <Card>
            <ListRow
              left={<Icon name="download-outline" />}
              title={t('settings.importTitle')}
              subtitle={t('settings.importDesc')}
              right={<Icon name="chevron-forward" color="textMuted" />}
              onPress={handleImport}
            />
          </Card>
        </Box>

        <Box style={styles.group}>
          <Typography variant="label">{t('settings.cloudGroup')}</Typography>
          <Card>
            {isDriveConfigured ? (
              <DriveBackupRow />
            ) : (
              <ListRow
                left={<Icon name="cloud-offline-outline" />}
                title={t('settings.cloudBackup')}
                subtitle={t('settings.cloudUnconfigured')}
                onPress={() => toast.info(t('settings.cloudUnconfigured'))}
              />
            )}
          </Card>
        </Box>
      </ScrollView>
    </Box>
  );
}
