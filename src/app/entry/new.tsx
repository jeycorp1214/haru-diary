// 일기 작성 화면 — 제목/본문/감정 입력 후 저장 (리치텍스트는 Phase 2)
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

import { createEntry } from '@/db/queries/entries';
import { MOOD_SEED } from '@/db/seed';
import { persistPhoto } from '@/lib/db-photo';
import { queryClient } from '@/lib/query';

type PhotoDraft = { uri: string; width: number; height: number };

export default function NewEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodId, setMoodId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);

  async function pickPhoto() {
    try {
      const img = await ImagePicker.openPicker({ cropping: true, mediaType: 'photo' });
      const uri = await persistPhoto(img.path);
      setPhotos((prev) => [...prev, { uri, width: img.width, height: img.height }]);
    } catch {
      // 사용자가 취소한 경우 등 — 무시
    }
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  }

  function addTag() {
    const name = tagInput.trim();
    if (name && !tags.includes(name)) setTags([...tags, name]);
    setTagInput('');
  }

  function removeTag(name: string) {
    setTags(tags.filter((t) => t !== name));
  }

  const save = useMutation({
    mutationFn: () =>
      Promise.resolve(
        createEntry({
          entryDate: dayjs().format('YYYY-MM-DD'),
          title: title.trim() || null,
          content: content || null,
          contentText: content,
          moodId,
          tagNames: tags,
          photos,
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
          headerShown: true,
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

        <View style={styles.photoRow}>
          {photos.map((p) => (
            <Pressable key={p.uri} onPress={() => removePhoto(p.uri)}>
              <Image source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
          <Pressable onPress={pickPhoto} style={styles.addPhoto}>
            <Text style={styles.addPhotoIcon}>＋</Text>
            <Text style={styles.addPhotoLabel}>{t('entry.addPhoto')}</Text>
          </Pressable>
        </View>

        {tags.length > 0 && (
          <View style={styles.chips}>
            {tags.map((tag) => (
              <Pressable key={tag} onPress={() => removeTag(tag)} style={styles.chip}>
                <Text style={styles.chipText}>#{tag} ✕</Text>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={t('entry.tagPlaceholder')}
          style={styles.tagInput}
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
  body: { fontSize: 16, minHeight: 160, textAlignVertical: 'top', lineHeight: 24 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: { fontSize: 22, color: '#888' },
  addPhotoLabel: { fontSize: 10, color: '#888' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#208AEF11', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#208AEF', fontSize: 14 },
  tagInput: { fontSize: 15, paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee' },
  save: { color: '#208AEF', fontSize: 16, fontWeight: '600' },
  saveDisabled: { color: '#bbb' },
});
