// 일기 상세 화면 — 본문/감정/태그 표시 + 삭제
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { deleteEntry, getEntry } from '@/db/queries/entries';
import { queryClient } from '@/lib/query';

export default function EntryDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: entry, isLoading } = useQuery({
    queryKey: ['entry', id],
    queryFn: () => getEntry(id),
  });

  const remove = useMutation({
    mutationFn: () => Promise.resolve(deleteEntry(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
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
    <>
      <Stack.Screen
        options={{
          title: dayjs(entry.entryDate).format('YYYY.MM.DD'),
          headerRight: () => (
            <Pressable onPress={confirmDelete}>
              <Text style={styles.delete}>{t('entry.delete')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {entry.mood && <Text style={styles.emoji}>{entry.mood.emoji}</Text>}
          <Text style={styles.title}>{entry.title || t('entry.untitled')}</Text>
        </View>
        <Text style={styles.body}>{entry.contentText}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#999' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '700', flex: 1 },
  body: { fontSize: 16, lineHeight: 26 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { color: '#208AEF', fontSize: 14 },
  delete: { color: '#e0245e', fontSize: 16 },
});
