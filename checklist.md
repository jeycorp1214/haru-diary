<!-- haru-diary 구현 체크리스트 — design.md 기준, Phase별 진행 체크 -->

# haru-diary 체크리스트

> `design.md` 기준. 완료 시 `[x]`. Phase 1 착수 전 **D-1(UI 스택)** 확정 필수.

## Phase 0 — 기반 셋업 (Phase 1 진입 전)

- [x] D-1 결정: UI 스택 확정 → **Tamagui** — `architecture.md` 표 갱신 완료
- [x] 의존성 설치: drizzle-orm / expo-sqlite / react-native-mmkv / zustand / @tanstack/react-query / tamagui (+ flash-list/skia/victory/calendars/tentap/moti/emoji/i18next/dayjs/zod/sentry/drizzle-kit/jest-expo/testing-library 전체)
- [x] 보안 의존성: expo-local-authentication / expo-secure-store / expo-crypto / @noble/hashes / @noble/ciphers
- [ ] `app.json` plugins 보강 (local-authentication faceID 문구 등)
- [ ] `npx expo prebuild` (MMKV 등 Expo Go 미지원)
- [ ] drizzle-kit 설정 + 마이그레이션 파이프라인
- [ ] Jest + Testing Library 셋업

## Phase 1 — MVP

- [ ] `db/schema.ts` — entries/moods/tags/entry_tags/photos + FTS5
- [ ] `db/client.ts` — drizzle 인스턴스 + FTS 부트스트랩
- [ ] `db/queries/entries.ts` — CRUD, **본문+FTS+태그 단일 트랜잭션**
- [ ] moods 시드 데이터
- [ ] `lib/storage/mmkv.ts` — settings/lock/cache 인스턴스
- [ ] `lib/auth/secureStorage.ts` — PIN pbkdf2 + **시도횟수/만료 영속화**
- [ ] `lib/auth/useBiometrics.ts`
- [ ] `lib/auth/useLockStore.ts`
- [ ] `stores/useSettingsStore.ts`
- [ ] `components/auth/LockScreen.tsx` (시도 초과 잠금 동작 포함)
- [ ] `components/auth/CriticalErrorScreen.tsx`
- [ ] `app/_layout.tsx` — ErrorBoundary > Providers > LockGate > Stack 로 교체
- [ ] `app/(tabs)/_layout.tsx` + 탭 4개
- [ ] 피드 (`(tabs)/index`) — flash-list
- [ ] 감정 캘린더 (`(tabs)/calendar`)
- [ ] 작성/상세 (`entry/new`, `entry/[id]`)
- [ ] 다크모드 + i18n (ko/en)
- [ ] 테스트: queries / secureStorage / useLockStore
- [ ] 빌드 검증 + 테스트 통과

## Phase 2 — 핵심 차별화
- [ ] tentap 리치텍스트 에디터 (`components/write`)
- [ ] 사진 첨부·크롭 + **documentDirectory 영구 복사**
- [ ] 위치·날씨 자동 태깅 (`lib/weather`)
- [ ] FTS5 검색 UI (`queries/search`)
- [ ] 감정 통계 그래프 (victory-native)

## Phase 3 — 리텐션
- [ ] 스트릭 (`queries/stats.streak` + MMKV 캐시)
- [ ] 리마인더 알림 (expo-notifications)
- [ ] JSON 내보내기/가져오기
- [ ] 클라우드 백업 (D-5 결정)

## Phase 4 — 프리미엄
- [ ] STT (@react-native-voice/voice)
- [ ] AI 감정 인사이트 (Claude API)
- [ ] 홈 위젯
- [ ] E2E 암호화 (PIN 파생키 MMKV)
