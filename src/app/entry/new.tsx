// 일기 작성 화면 — 감정/제목/사진/위치/태그 + 리치텍스트 본문(tentap)
import { RichText, Toolbar, useEditorBridge, useEditorContent } from '@10play/tentap-editor';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

import { ScreenHeader } from '@/components/ScreenHeader';
import { createEntry } from '@/db/queries/entries';
import { MOOD_SEED } from '@/db/seed';
import { persistPhoto } from '@/lib/db-photo';
import { invalidateEntryData } from '@/lib/query';
import { useSpeechToText } from '@/lib/voice/useSpeechToText';
import { getAutoTag, type AutoTag } from '@/lib/weather/autoTag';

type PhotoDraft = { uri: string; width: number; height: number };

// 에디터 HTML 삽입용 텍스트 이스케이프
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function NewEntryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [moodId, setMoodId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [autoTag, setAutoTag] = useState<AutoTag | null>(null);
  const [tagging, setTagging] = useState(false);

  const editor = useEditorBridge({ autofocus: false, avoidIosKeyboard: true });
  const editorText = useEditorContent(editor, { type: 'text' });

  // STT: 인식된 텍스트를 본문 끝에 단락으로 삽입
  const stt = useSpeechToText(async (text) => {
    const html = await editor.getHTML();
    editor.setContent(`${html}<p>${escapeHtml(text)}</p>`);
  });

  async function addLocationWeather() {
    setTagging(true);
    try {
      setAutoTag(await getAutoTag());
    } finally {
      setTagging(false);
    }
  }

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
    mutationFn: async () => {
      const html = await editor.getHTML();
      const text = await editor.getText();
      return createEntry({
        entryDate: dayjs().format('YYYY-MM-DD'),
        title: title.trim() || null,
        content: html || null,
        contentText: text,
        moodId,
        tagNames: tags,
        photos,
        locationName: autoTag?.locationName,
        lat: autoTag?.lat,
        lng: autoTag?.lng,
        weather: autoTag?.weather,
        tempC: autoTag?.tempC,
      });
    },
    onSuccess: () => {
      invalidateEntryData();
      router.back();
    },
  });

  const canSave = (editorText?.trim().length ?? 0) > 0 && !save.isPending;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScreenHeader
        title={t('entry.new')}
        showBack
        right={
          <Pressable disabled={!canSave} onPress={() => save.mutate()}>
            <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('entry.save')}</Text>
          </Pressable>
        }
      />

      <View style={styles.header}>
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

        <Pressable onPress={addLocationWeather} disabled={tagging} style={styles.locRow}>
          <Text style={styles.locText}>
            📍{' '}
            {autoTag
              ? [
                  autoTag.locationName,
                  autoTag.weather,
                  autoTag.tempC != null && `${Math.round(autoTag.tempC)}°`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : t('entry.addLocation')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => (stt.isListening ? stt.stop() : stt.start(i18n.language))}
          style={[styles.sttRow, stt.isListening && styles.sttRowActive]}>
          <Text style={styles.locText}>
            {stt.isListening ? `🔴 ${t('entry.sttListening')}` : `🎙️ ${t('entry.stt')}`}
          </Text>
        </Pressable>
        {stt.error ? <Text style={styles.sttError}>{t('entry.sttError')}</Text> : null}

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
      </View>

      <RichText editor={editor} style={styles.editor} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.toolbar}>
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, gap: 12 },
  moodRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  mood: { padding: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  moodSelected: { borderColor: '#208AEF', backgroundColor: '#208AEF11' },
  moodEmoji: { fontSize: 28 },
  title: { fontSize: 20, fontWeight: '600', paddingVertical: 8 },
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
  locRow: { paddingVertical: 4 },
  locText: { fontSize: 14, color: '#444' },
  sttRow: { paddingVertical: 4 },
  sttRowActive: { opacity: 0.7 },
  sttError: { fontSize: 12, color: '#D11' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#208AEF11', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#208AEF', fontSize: 14 },
  tagInput: { fontSize: 15, paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee' },
  editor: { flex: 1 },
  toolbar: { position: 'absolute', width: '100%', bottom: 0 },
  save: { color: '#208AEF', fontSize: 16, fontWeight: '600' },
  saveDisabled: { color: '#bbb' },
});
