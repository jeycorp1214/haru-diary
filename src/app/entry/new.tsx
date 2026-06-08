// 일기 작성 화면 — 제목/본문/감정 입력 후 저장 (리치텍스트는 Phase 2)
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createEntry } from '@/db/queries/entries';
import { MOOD_SEED } from '@/db/seed';
import { queryClient } from '@/lib/query';

export default function NewEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodId, setMoodId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      Promise.resolve(
        createEntry({
          entryDate: dayjs().format('YYYY-MM-DD'),
          title: title.trim() || null,
          content: content || null,
          contentText: content,
          moodId,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      router.back();
    },
  });

  const canSave = content.trim().length > 0 && !save.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('entry.new'),
          presentation: 'modal',
          headerRight: () => (
            <Pressable disabled={!canSave} onPress={() => save.mutate()}>
              <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('entry.save')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.moodRow}>
          {MOOD_SEED.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMoodId(moodId === m.id ? null : m.id)}
              style={[styles.mood, moodId === m.id && styles.moodSelected]}>
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('entry.title')}
          style={styles.title}
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={t('entry.placeholder')}
          multiline
          style={styles.body}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  moodRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  mood: { padding: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  moodSelected: { borderColor: '#208AEF', backgroundColor: '#208AEF11' },
  moodEmoji: { fontSize: 28 },
  title: { fontSize: 20, fontWeight: '600', paddingVertical: 8 },
  body: { fontSize: 16, minHeight: 200, textAlignVertical: 'top', lineHeight: 24 },
  save: { color: '#208AEF', fontSize: 16, fontWeight: '600' },
  saveDisabled: { color: '#bbb' },
});
