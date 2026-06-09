// 일기 작성 화면 — 감정/제목/사진/위치/태그 + 리치텍스트 본문(tentap)
import { RichText, Toolbar, useEditorBridge, useEditorContent } from '@10play/tentap-editor';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import ImagePicker from 'react-native-image-crop-picker';

import { MoodPickerSheet } from '@/components/MoodPickerSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Box, Chip, Typography } from '@/components/ui';
import { emoticonSource } from '@/constants/emoticons';
import { createEntry } from '@/db/queries/entries';
import { persistPhoto } from '@/lib/db-photo';
import { invalidateEntryData } from '@/lib/query';
import { toast } from '@/lib/toast';
import { useUnsavedGuard } from '@/lib/useUnsavedGuard';
import { useSpeechToText } from '@/lib/voice/useSpeechToText';
import { getAutoTag, type AutoTag } from '@/lib/weather/autoTag';

type PhotoDraft = { uri: string; width: number; height: number };

// 에디터 HTML 삽입용 텍스트 이스케이프
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const styles = StyleSheet.create((theme) => ({
  moodTrigger: (selected: boolean) => ({
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: selected ? 2 : 1,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
    borderStyle: selected ? ('solid' as const) : ('dashed' as const),
    backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),
  moodImg: { width: 56, height: 56 },
  title: { fontSize: 20, fontWeight: '600', paddingVertical: 8, color: theme.colors.text },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagInput: {
    fontSize: 15,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  editor: { flex: 1 },
  toolbar: { position: 'absolute', width: '100%', bottom: 0 },
  save: (enabled: boolean) => ({
    color: enabled ? theme.colors.primary : theme.colors.textDisabled,
    fontSize: 16,
    fontWeight: '600' as const,
  }),
  placeholder: { color: theme.colors.placeholder },
}));

export default function NewEntryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [moodId, setMoodId] = useState<string | null>(null);
  const [moodSheet, setMoodSheet] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [autoTag, setAutoTag] = useState<AutoTag | null>(null);
  const [tagging, setTagging] = useState(false);

  const editor = useEditorBridge({ autofocus: false, avoidIosKeyboard: true });
  const editorText = useEditorContent(editor, { type: 'text' });
  const submittedRef = useRef(false);

  // 작성 중 이탈 가드 — 내용 있고 저장 전이면 확인
  useUnsavedGuard(
    () =>
      !submittedRef.current &&
      (title.trim().length > 0 ||
        tags.length > 0 ||
        photos.length > 0 ||
        (editorText?.trim().length ?? 0) > 0),
    {
      title: t('entry.unsavedTitle'),
      message: t('entry.unsavedMsg'),
      confirmLabel: t('entry.discard'),
      cancelLabel: t('entry.keepEditing'),
      destructive: true,
    },
  );

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
    setTags(tags.filter((tg) => tg !== name));
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
      submittedRef.current = true;
      invalidateEntryData();
      toast.success(t('entry.saved'));
      router.back();
    },
    onError: () => toast.error(t('entry.saveFailed')),
  });

  const canSave = (editorText?.trim().length ?? 0) > 0 && !save.isPending;

  return (
    <Box flex={1} bg="surface">
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScreenHeader
        title={t('entry.new')}
        showBack
        right={
          <Pressable disabled={!canSave} onPress={() => save.mutate()}>
            <Text style={styles.save(canSave)}>{t('entry.save')}</Text>
          </Pressable>
        }
      />

      <Box p="md" gap="md">
        <Pressable onPress={() => setMoodSheet(true)} style={styles.moodTrigger(!!moodId)}>
          {moodId ? (
            <Image source={emoticonSource(moodId)} style={styles.moodImg} contentFit="contain" />
          ) : (
            <Typography variant="caption" color="textMuted">
              {t('entry.moodPick')}
            </Typography>
          )}
        </Pressable>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('entry.title')}
          placeholderTextColor={styles.placeholder.color}
          style={styles.title}
        />

        <Box row gap="sm" style={{ flexWrap: 'wrap' }}>
          {photos.map((p) => (
            <Pressable key={p.uri} onPress={() => removePhoto(p.uri)}>
              <Image source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
          <Pressable onPress={pickPhoto} style={styles.addPhoto}>
            <Typography variant="caption">＋</Typography>
            <Typography variant="caption" style={{ fontSize: 10 }}>
              {t('entry.addPhoto')}
            </Typography>
          </Pressable>
        </Box>

        <Pressable onPress={addLocationWeather} disabled={tagging} style={{ paddingVertical: 4 }}>
          <Typography variant="caption" color="text">
            📍{' '}
            {autoTag
              ? [autoTag.locationName, autoTag.weather, autoTag.tempC != null && `${Math.round(autoTag.tempC)}°`]
                  .filter(Boolean)
                  .join(' · ')
              : t('entry.addLocation')}
          </Typography>
        </Pressable>

        <Pressable
          onPress={() => (stt.isListening ? stt.stop() : stt.start(i18n.language))}
          style={{ paddingVertical: 4, opacity: stt.isListening ? 0.7 : 1 }}>
          <Typography variant="caption" color="text">
            {stt.isListening ? `🔴 ${t('entry.sttListening')}` : `🎙️ ${t('entry.stt')}`}
          </Typography>
        </Pressable>
        {stt.error ? (
          <Typography variant="caption" color="danger">
            {t('entry.sttError')}
          </Typography>
        ) : null}

        {tags.length > 0 && (
          <Box row gap="sm" style={{ flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} onRemove={() => removeTag(tag)} />
            ))}
          </Box>
        )}
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={t('entry.tagPlaceholder')}
          placeholderTextColor={styles.placeholder.color}
          style={styles.tagInput}
        />
      </Box>

      <RichText editor={editor} style={styles.editor} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.toolbar}>
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>

      <MoodPickerSheet
        visible={moodSheet}
        selectedKey={moodId}
        onSelect={setMoodId}
        onClose={() => setMoodSheet(false)}
      />
    </Box>
  );
}
