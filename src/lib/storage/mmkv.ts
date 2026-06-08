// MMKV 스토리지 인스턴스 — 도메인별 네임스페이스 분리 (design §4)
import { createMMKV } from 'react-native-mmkv';

export const settingsStorage = createMMKV({ id: 'settings' }); // 테마/폰트/알림/언어
export const lockStorage = createMMKV({ id: 'lock' }); // 잠금 설정 + 시도횟수/만료
export const cacheStorage = createMMKV({ id: 'cache' }); // 스트릭/날씨 캐시
