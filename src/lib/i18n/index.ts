// i18next 초기화 — ko/en, 언어는 MMKV(settings) 영속값에서 로드 (design §8)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { settingsStorage } from '@/lib/storage/mmkv';
import en from './locales/en.json';
import ko from './locales/ko.json';

const lng = settingsStorage.getString('language') ?? 'ko';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng,
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;
