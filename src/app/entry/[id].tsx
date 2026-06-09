// 일기 상세 화면 — 본문/감정/태그 표시 + 삭제
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Typography } from '@/components/ui';
import { deleteEntry, getEntry } from '@/db/queries/entries';
import { confirm } from '@/lib/confirm';
import { FONT_FAMILY } from '@/lib/fonts';
import { invalidateEntryData } from '@/lib/query';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
import { useSettingsStore } from '@/stores/useSettingsStore';

const styles = StyleSheet.create((theme) => ({
  content: { padding: 16, gap: 12 },
  emoji: { fontSize: 32 },
  body: { color: theme.colors.text },
  photo: { width: 104, height: 104, borderRadius: 8 },
  delete: { color: theme.colors.danger, fontSize: 16 },
}));

export default function EntryDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fontScale = useSettingsStore((s) => s.fontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);

  const { data: entry, isLoading } = useQuery({
    queryKey: queryKeys.entry(id),
    queryFn: () => getEntry(id),
  });

  const remove = useMutation({
    mutationFn: () => Promise.resolve(deleteEntry(id)),
    onSuccess: () => {
      invalidateEntryData();
      toast.success(t('entry.deleted'));
      router.back();
    },
  });

  async function confirmDelete() {
    const ok = await confirm({
      title: t('entry.deleteConfirmTitle'),
      message: t('entry.deleteConfirmMsg'),
      confirmLabel: t('entry.delete'),
      cancelLabel: t('entry.cancel'),
      destructive: true,
    });
    if (ok) remove.mutate();
  }

  if (isLoading) return null;
  if (!entry) {
    return (
      <Box flex={1} align="center" justify="center" bg="surface">
        <Typography variant="caption">{t('entry.notFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="surface">
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={dayjs(entry.entryDate).format('YYYY.MM.DD')}
        showBack
        right={
          <Pressable onPress={confirmDelete}>
            <Text style={styles.delete}>{t('entry.delete')}</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Box row align="center" gap="sm">
          {entry.mood && <Text style={styles.emoji}>{entry.mood.emoji}</Text>}
          <Typography variant="h2" style={{ flex: 1 }}>
            {entry.title || t('entry.untitled')}
          </Typography>
        </Box>
        {(entry.locationName || entry.weather) && (
          <Typography variant="caption">
            📍{' '}
            {[entry.locationName, entry.weather, entry.tempC != null && `${Math.round(entry.tempC)}°`]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
        <Text
          style={[
            styles.body,
            { fontSize: 16 * fontScale, lineHeight: 26 * fontScale, fontFamily: FONT_FAMILY[fontFamily] },
          ]}>
          {entry.contentText}
        </Text>
        {entry.photos.length > 0 && (
          <Box row gap="sm" mt="sm" style={{ flexWrap: 'wrap' }}>
            {entry.photos.map((p) => (
              <Image key={p.id} source={{ uri: p.uri }} style={styles.photo} contentFit="cover" />
            ))}
          </Box>
        )}
        {entry.entryTags.length > 0 && (
          <Box row gap="sm" mt="sm" style={{ flexWrap: 'wrap' }}>
            {entry.entryTags.map((et) => (
              <Typography key={et.tag.id} variant="body" color="primary">
                #{et.tag.name}
              </Typography>
            ))}
          </Box>
        )}
      </ScrollView>
    </Box>
  );
}
