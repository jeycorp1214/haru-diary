// 설정 탭 — 그룹별 메뉴 목록. 각 행 탭 시 전용 설정 페이지로 이동. 항목 확장 대비 구조.
import Constants from 'expo-constants';
import { openBrowserAsync } from 'expo-web-browser';
import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ContactSheet } from '@/components/ContactSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Card, Icon, ListRow, Typography, type IconName } from '@/components/ui';
import { PRIVACY_POLICY_URL } from '@/constants/meta';

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
  version: { alignItems: 'center' as const, paddingVertical: 8 },
}));

const DEVTOOLS_TAP_COUNT = 7; // 버전 N회 탭 → 개발도구 진입(숨김 제스처)

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const tapCount = useRef(0);

  const appVersion = Constants.expoConfig?.version ?? '-';

  function handleVersionTap() {
    tapCount.current += 1;
    if (tapCount.current >= DEVTOOLS_TAP_COUNT) {
      tapCount.current = 0;
      router.push('/settings/devtools');
    }
  }

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

        {/* 정보 — 라우트가 아닌 액션 행(바텀시트/외부 링크) */}
        <Box style={styles.group}>
          <Typography variant="label">{t('settings.groupInfo')}</Typography>
          <Card gap="xs">
            <ListRow
              left={<Icon name="mail-outline" />}
              title={t('settings.contact')}
              subtitle={t('settings.contactDesc')}
              right={<Icon name="chevron-forward" color="text" />}
              onPress={() => setContactOpen(true)}
            />
            <ListRow
              left={<Icon name="shield-checkmark-outline" />}
              title={t('settings.privacy')}
              subtitle={t('settings.privacyDesc')}
              right={<Icon name="chevron-forward" color="text" />}
              onPress={() => openBrowserAsync(PRIVACY_POLICY_URL)}
            />
          </Card>
        </Box>

        {/* 버전 — 숨김 제스처 진입점(개발도구) */}
        <Pressable style={styles.version} onPress={handleVersionTap}>
          <Typography variant="caption" color="textMuted">
            {`v${appVersion}`}
          </Typography>
        </Pressable>
      </ScrollView>

      <ContactSheet visible={contactOpen} onClose={() => setContactOpen(false)} />
    </Box>
  );
}
