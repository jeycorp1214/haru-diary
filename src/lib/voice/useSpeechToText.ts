// 음성→텍스트(STT) 훅 — @react-native-voice/voice 래핑. 최종 인식 결과를 onResult로 전달.
import Voice, { type SpeechErrorEvent, type SpeechResultsEvent } from '@react-native-voice/voice';
import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// i18n 언어코드('ko'/'en') → STT locale
function toLocale(lang: string): string {
  return lang.startsWith('ko') ? 'ko-KR' : 'en-US';
}

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS는 Info.plist + 시스템 프롬프트
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useSpeechToText(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0]?.trim();
      if (text) onResultRef.current(text);
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.warn('[STT] speech error', e.error?.code, e.error?.message);
      setError(e.error?.message ?? 'speech_error');
      setIsListening(false);
    };
    Voice.onSpeechEnd = () => setIsListening(false);

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners());
    };
  }, []);

  async function start(lang: string) {
    setError(null);
    if (!(await ensureMicPermission())) {
      setError('mic_permission_denied');
      return;
    }
    try {
      await Voice.start(toLocale(lang));
      setIsListening(true);
    } catch {
      setError('speech_start_failed');
      setIsListening(false);
    }
  }

  async function stop() {
    try {
      await Voice.stop();
    } catch {
      // 무시 — 이미 정지된 경우 등
    }
    setIsListening(false);
  }

  return { isListening, error, start, stop };
}
