// 글자 스타일 설정 — 글자 크기, 글꼴, 미리보기.
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Card, SegmentedControl, Typography } from '@/components/ui';
import { FONT_FAMILY, FONT_KEYS, FONT_SCALES, type FontKey } from '@/lib/fonts';
import { useSettingsStore } from '@/stores/useSettingsStore';

const SIZE_LABELS = ['sizeSmall', 'sizeNormal', 'sizeLarge', 'sizeXLarge'];

const styles = StyleSheet.create((theme) => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  fontLabel: (active: boolean) => ({ color: active ? theme.colors.onPrimary : theme.colors.text }),
  previewText: { color: theme.colors.text },
}));

export default function FontSettings() {
  const { t } = useTranslation();
  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);

  const sizeOptions = FONT_SCALES.map((scale, i) => ({ key: String(scale), label: t(`settings.${SIZE_LABELS[i]}`) }));
  const fontOptions = FONT_KEYS.map((key) => ({ key, label: t(`settings.font_${key}`) }));

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.fontStyle')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="caption">{t('settings.fontSize')}</Typography>
        <SegmentedControl
          options={sizeOptions}
          value={String(fontScale)}
          onChange={(k) => setFontScale(Number(k))}
        />
        <Typography variant="caption">{t('settings.fontFamily')}</Typography>
        <SegmentedControl
          options={fontOptions}
          value={fontFamily}
          onChange={(k) => setFontFamily(k as FontKey)}
          renderLabel={(o, active) => (
            <Text style={[styles.fontLabel(active), { fontFamily: FONT_FAMILY[o.key] }]}>{o.label}</Text>
          )}
        />
        <Card>
          <Text
            style={[
              styles.previewText,
              { fontSize: 18 * fontScale, lineHeight: 30 * fontScale, fontFamily: FONT_FAMILY[fontFamily] },
            ]}>
            안녕하세요. 오늘 하루도 수고했어요.
          </Text>
        </Card>
      </ScrollView>
    </Box>
  );
}
