// 감정 이모티콘 선택 바텀시트 — 36종 그리드, 탭하면 선택 후 닫힘. ContactSheet 패턴 재사용.
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui';
import { EMOTICONS, EMOTICON_KEYS } from '@/constants/emoticons';

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
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    rowGap: 8,
  },
  cell: (selected: boolean) => ({
    width: '15%' as const, // 6열
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: selected ? theme.colors.primary : 'transparent',
    backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),
  img: { width: '80%' as const, height: '80%' as const },
}));

type Props = {
  visible: boolean;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

export function MoodPickerSheet({ visible, selectedKey, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Typography variant="title">{t('entry.moodPick')}</Typography>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {EMOTICON_KEYS.map((key) => (
                <Pressable
                  key={key}
                  style={styles.cell(selectedKey === key)}
                  onPress={() => {
                    onSelect(selectedKey === key ? null : key);
                    onClose();
                  }}>
                  <Image source={EMOTICONS[key]} style={styles.img} contentFit="contain" />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
