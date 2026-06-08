// 앱 설정 전역 스토어 (테마/폰트/언어/알림시각) — MMKV 영속 (design §5)
import { create } from 'zustand';

import type { FontKey } from '@/lib/fonts';
import { settingsStorage } from '@/lib/storage/mmkv';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme_mode';
const FONT_SCALE_KEY = 'font_scale';
const FONT_FAMILY_KEY = 'font_family';
const LANGUAGE_KEY = 'language';
const NOTIFY_TIME_KEY = 'notify_time';

interface SettingsStore {
  themeMode: ThemeMode;
  fontScale: number;
  fontFamily: FontKey;
  language: string;
  notifyTime: string; // 'HH:mm', '' = 알림 비활성
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: number) => void;
  setFontFamily: (key: FontKey) => void;
  setLanguage: (lang: string) => void;
  setNotifyTime: (time: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  themeMode: (settingsStorage.getString(THEME_KEY) as ThemeMode) ?? 'system',
  fontScale: settingsStorage.getNumber(FONT_SCALE_KEY) ?? 1,
  fontFamily: (settingsStorage.getString(FONT_FAMILY_KEY) as FontKey) ?? 'system',
  language: settingsStorage.getString(LANGUAGE_KEY) ?? 'ko',
  notifyTime: settingsStorage.getString(NOTIFY_TIME_KEY) ?? '',

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

  setNotifyTime: (time) => {
    settingsStorage.set(NOTIFY_TIME_KEY, time);
    set({ notifyTime: time });
  },
}));
