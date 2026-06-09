// 설정 탭 — 그룹별 메뉴 목록. 각 행 탭 시 전용 설정 페이지로 이동. 항목 확장 대비 구조.
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Card, Icon, ListRow, Typography, type IconName } from '@/components/ui';

type MenuRow = { key: string; icon: IconName; desc: string; route: Href };
type MenuGroup = { group: string; rows: MenuRow[] };

const GROUPS: MenuGroup[] = [
  {
    group: 'groupSecurity',
    rows: [{ key: 'lock', icon: 'lock-closed-outline', desc: 'lockDesc', route: '/settings/lock' }],
  },
  {
    group: 'groupNotify',
    rows: [{ key: 'reminder', icon: 'notifications-outline', desc: 'reminderDesc', route: '/settings/notifications' }],
  },
  {
    group: 'groupDisplay',
    rows: [
      { key: 'theme', icon: 'color-palette-outline', desc: 'themeDesc', route: '/settings/theme' },
      { key: 'fontStyle', icon: 'text-outline', desc: 'fontDesc', route: '/settings/font' },
    ],
  },
  {
    group: 'groupGeneral',
    rows: [{ key: 'language', icon: 'language-outline', desc: 'languageDesc', route: '/settings/language' }],
  },
  {
    group: 'groupData',
    rows: [{ key: 'backupRestore', icon: 'cloud-upload-outline', desc: 'backupDesc', route: '/settings/backup' }],
  },
];

const styles = StyleSheet.create(() => ({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  group: { gap: 6 },
}));

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('tabs.settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        {GROUPS.map((g) => (
          <Box key={g.group} style={styles.group}>
            <Typography variant="label">{t(`settings.${g.group}`)}</Typography>
            <Card gap="xs">
              {g.rows.map((row) => (
                <ListRow
                  key={row.key}
                  left={<Icon name={row.icon} />}
                  title={t(`settings.${row.key}`)}
                  subtitle={t(`settings.${row.desc}`)}
                  right={<Icon name="chevron-forward" color="text" />}
                  onPress={() => router.push(row.route)}
                />
              ))}
            </Card>
          </Box>
        ))}
      </ScrollView>
    </Box>
  );
}
