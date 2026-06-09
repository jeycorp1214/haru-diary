// 글자 스타일 설정 — 미리보기(상단), 글자 크기 슬라이더, 글꼴 세로 라디오.
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Card, RadioGroup, StepSlider, Typography } from '@/components/ui';
import { FONT_FAMILY, FONT_KEYS, FONT_SCALES, type FontKey } from '@/lib/fonts';
import { useSettingsStore } from '@/stores/useSettingsStore';

const styles = StyleSheet.create((theme) => ({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  previewText: { color: theme.colors.text },
  sizeMark: (size: number) => ({ color: theme.colors.text, fontSize: size }),
  fontOption: (key: FontKey) => ({
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: FONT_FAMILY[key],
  }),
}));

export default function FontSettings() {
  const { t } = useTranslation();
  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);

  const fontOptions = FONT_KEYS.map((key) => ({ key, label: t(`settings.font_${key}`) }));

  return (
    <Box flex={1} bg="surface">
      <ScreenHeader title={t('settings.fontStyle')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text
            style={[
              styles.previewText,
              { fontSize: 18 * fontScale, lineHeight: 30 * fontScale, fontFamily: FONT_FAMILY[fontFamily] },
            ]}>
            안녕하세요. 오늘 하루도 수고했어요.
          </Text>
        </Card>

        <Typography variant="caption">{t('settings.fontSize')}</Typography>
        <StepSlider
          steps={FONT_SCALES}
          value={fontScale}
          onChange={setFontScale}
          minLabel={<Text style={styles.sizeMark(13)}>가</Text>}
          maxLabel={<Text style={styles.sizeMark(24)}>가</Text>}
        />

        <Typography variant="caption">{t('settings.fontFamily')}</Typography>
        <Card>
          <RadioGroup
            options={fontOptions}
            value={fontFamily}
            onChange={(k) => setFontFamily(k as FontKey)}
            renderLabel={(o) => <Text style={styles.fontOption(o.key)}>{o.label}</Text>}
          />
        </Card>
      </ScrollView>
    </Box>
  );
}
