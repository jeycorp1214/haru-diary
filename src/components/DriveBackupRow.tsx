// Google Drive 백업 행 — client ID 설정 시에만 마운트(useAuthRequest 호출 안전). 탭 시 업로드.
import { useTranslation } from 'react-i18next';

import { Icon, ListRow } from '@/components/ui';
import { useDriveBackup } from '@/lib/cloud/googleDrive';
import { toast } from '@/lib/toast';

export function DriveBackupRow() {
  const { t } = useTranslation();
  const drive = useDriveBackup();

  async function onPress() {
    try {
      const r = await drive.backup();
      if (r === 'ok') toast.success(t('settings.cloudDone'));
    } catch {
      toast.error(t('settings.cloudFailed'));
    }
  }

  return (
    <ListRow
      left={<Icon name="cloud-upload-outline" />}
      title={t('settings.cloudBackup')}
      subtitle={t('settings.cloudDesc')}
      right={<Icon name="chevron-forward" color="textMuted" />}
      onPress={onPress}
    />
  );
}
