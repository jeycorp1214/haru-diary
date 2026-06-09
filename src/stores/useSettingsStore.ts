// 앱 설정 전역 스토어 (테마/폰트/언어/알림시각 목록) — MMKV 영속 (design §5)
import { create } from 'zustand';

import type { FontKey } from '@/lib/fonts';
import { settingsStorage } from '@/lib/storage/mmkv';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme_mode';
const FONT_SCALE_KEY = 'font_scale';
const FONT_FAMILY_KEY = 'font_family';
const LANGUAGE_KEY = 'language';
const NOTIFY_TIMES_KEY = 'notify_times';
const LEGACY_NOTIFY_TIME_KEY = 'notify_time'; // 단일 알림 시절 키 → 1회 마이그레이션

// 알림 시각 목록 로드. 신규 키(JSON 배열) 우선, 없으면 레거시 단일값을 배열로 승격.
function loadNotifyTimes(): string[] {
  const raw = settingsStorage.getString(NOTIFY_TIMES_KEY);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch {
      // 손상 시 빈 배열로 폴백
    }
  }
  const legacy = settingsStorage.getString(LEGACY_NOTIFY_TIME_KEY);
  return legacy ? [legacy] : [];
}

interface SettingsStore {
  themeMode: ThemeMode;
  fontScale: number;
  fontFamily: FontKey;
  language: string;
  notifyTimes: string[]; // 'HH:mm' 목록, [] = 알림 없음
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: number) => void;
  setFontFamily: (key: FontKey) => void;
  setLanguage: (lang: string) => void;
  setNotifyTimes: (times: string[]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  themeMode: (settingsStorage.getString(THEME_KEY) as ThemeMode) ?? 'system',
  fontScale: settingsStorage.getNumber(FONT_SCALE_KEY) ?? 1,
  fontFamily: (settingsStorage.getString(FONT_FAMILY_KEY) as FontKey) ?? 'system',
  language: settingsStorage.getString(LANGUAGE_KEY) ?? 'ko',
  notifyTimes: loadNotifyTimes(),

  setThemeMode: (mode) => {
    settingsStorage.set(THEME_KEY, mode);
    set({ themeMode: mode });
  },

  setFontScale: (scale) => {
    settingsStorage.set(FONT_SCALE_KEY, scale);
    set({ fontScale: scale });
  },

  setFontFamily: (key) => {
    settingsStorage.set(FONT_FAMILY_KEY, key);
    set({ fontFamily: key });
  },

  setLanguage: (lang) => {
    settingsStorage.set(LANGUAGE_KEY, lang);
    set({ language: lang });
  },

  setNotifyTimes: (times) => {
    settingsStorage.set(NOTIFY_TIMES_KEY, JSON.stringify(times));
    set({ notifyTimes: times });
  },
}));
