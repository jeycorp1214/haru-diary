// 백업/복원 설정 — JSON/PDF 내보내기, JSON 가져오기, Google Drive 백업.
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useQueryClient } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/ScreenHeader';
import { DriveBackupButton } from '@/components/DriveBackupButton';
import { Box, Button } from '@/components/ui';
import { toast } from '@/lib/toast';
import { exportEntriesJson, importEntriesJson } from '@/lib/backup';
import { isDriveConfigured } from '@/lib/cloud/googleDrive';
import { exportEntriesPdf } from '@/lib/pdf';

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
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
    try {
      const n = await importEntriesJson();
      if (n === null) return;
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
        <Button variant="outline" onPress={handleExport}>
          {t('settings.export')}
        </Button>
        <Button variant="outline" onPress={handleExportPdf}>
          {t('settings.exportPdf')}
        </Button>
        <Button variant="outline" onPress={handleImport}>
          {t('settings.import')}
        </Button>
        {isDriveConfigured ? (
          <DriveBackupButton />
        ) : (
          <Button variant="outline" onPress={() => toast.info(t('settings.cloudUnconfigured'))}>
            {t('settings.cloudBackup')}
          </Button>
        )}
      </ScrollView>
    </Box>
  );
}
