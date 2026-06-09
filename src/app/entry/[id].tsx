// 일기 상세 화면 — 본문/감정/태그 표시 + 삭제
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { deleteEntry, getEntry } from '@/db/queries/entries';
import { FONT_FAMILY } from '@/lib/fonts';
import { invalidateEntryData } from '@/lib/query';
import { queryKeys } from '@/lib/queryKeys';
import { useSettingsStore } from '@/stores/useSettingsStore';

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
      router.back();
    },
  });

  function confirmDelete() {
    Alert.alert(t('entry.deleteConfirmTitle'), t('entry.deleteConfirmMsg'), [
      { text: t('entry.cancel'), style: 'cancel' },
      { text: t('entry.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  if (isLoading) return null;
  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t('entry.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {entry.mood && <Text style={styles.emoji}>{entry.mood.emoji}</Text>}
          <Text style={styles.title}>{entry.title || t('entry.untitled')}</Text>
        </View>
        {(entry.locationName || entry.weather) && (
          <Text style={styles.meta}>
            📍{' '}
            {[
              entry.locationName,
              entry.weather,
              entry.tempC != null && `${Math.round(entry.tempC)}°`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}
        <Text
          style={[
            styles.body,
            {
              fontSize: 16 * fontScale,
              lineHeight: 26 * fontScale,
              fontFamily: FONT_FAMILY[fontFamily],
            },
          ]}>
          {entry.contentText}
        </Text>
        {entry.photos.length > 0 && (
          <View style={styles.photos}>
            {entry.photos.map((p) => (
              <Image key={p.id} source={{ uri: p.uri }} style={styles.photo} contentFit="cover" />
            ))}
          </View>
        )}
        {entry.entryTags.length > 0 && (
          <View style={styles.tags}>
            {entry.entryTags.map((et) => (
              <Text key={et.tag.id} style={styles.tag}>
                #{et.tag.name}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#999' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '700', flex: 1 },
  meta: { fontSize: 13, color: '#888' },
  body: { fontSize: 16, lineHeight: 26 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  photo: { width: 104, height: 104, borderRadius: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { color: '#208AEF', fontSize: 14 },
  delete: { color: '#e0245e', fontSize: 16 },
});
