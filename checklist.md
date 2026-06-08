<!-- haru-diary 구현 체크리스트 — design.md 기준, Phase별 진행 체크 -->

# haru-diary 체크리스트

> `design.md` 기준. 완료 시 `[x]`. Phase 1 착수 전 **D-1(UI 스택)** 확정 필수.

## Phase 0 — 기반 셋업 (Phase 1 진입 전)

- [x] D-1 결정: UI 스택 확정 → **Tamagui** — `architecture.md` 표 갱신 완료
- [x] 의존성 설치: drizzle-orm / expo-sqlite / react-native-mmkv / zustand / @tanstack/react-query / tamagui (+ flash-list/skia/victory/calendars/tentap/moti/emoji/i18next/dayjs/zod/sentry/drizzle-kit/jest-expo/testing-library 전체)
- [x] 보안 의존성: expo-local-authentication / expo-secure-store / expo-crypto / @noble/hashes / @noble/ciphers
- [x] Tamagui 설정: `babel.config.js`(babel-plugin + worklets) + `tamagui.config.ts`(v4)
- [x] `app.json` plugins 보강: local-authentication(faceID)/location/notifications. image-crop-picker는 plugin 미제공 → `ios.infoPlist`+`android.permissions`로 처리
- [x] `npx expo prebuild` (ios/android 생성 완료)
- [x] drizzle-kit 설정 (`drizzle.config.ts` + `db:generate` 스크립트). 마이그레이션은 schema 작성 후(Phase 1)
- [x] Jest + Testing Library 셋업 (`jest-expo` preset + `test` 스크립트)

## Phase 1 — MVP

- [x] `db/schema.ts` — entries/moods/tags/entry_tags/photos + 인덱스 5개 + relations (FTS5는 가상테이블이라 client.ts)
- [x] drizzle-kit 마이그레이션 생성 (`0000_*.sql`) + Expo 연동(babel inline-import + metro sourceExts `.sql`)
- [x] `db/client.ts` — drizzle 인스턴스 + FK pragma + FTS5 부트스트랩
- [x] `db/seed.ts` — moods 시드 데이터 (멱등)
- [x] Providers + 마이그레이션 게이트 — `_layout.tsx`에 GestureHandler/Tamagui/Query Provider + `useMigrations` → 성공 시 `bootstrapFts()`+`seedMoods()`. `lib/query.ts`, `types/sql.d.ts` 추가. (잠금 게이트/라우팅 재구성은 후속)
- [x] `db/queries/entries.ts` — create/update/delete(단일 트랜잭션: 본문+태그+FTS) + getEntry/listEntries(관계 포함). sync 드라이버라 `.run()/.get()` 동기 실행
- [x] `lib/storage/mmkv.ts` — settings/lock/cache 인스턴스 (v4 `createMMKV` 팩토리)
- [x] `lib/auth/secureStorage.ts` — PIN pbkdf2(100k) + **시도횟수/만료 영속화**(recordFailedAttempt/isLockedOut/resetAttempts)
- [x] `lib/auth/useBiometrics.ts`
- [x] `lib/auth/useLockStore.ts`
- [x] `stores/useSettingsStore.ts`
- [x] `components/auth/LockScreen.tsx` (PIN+생체, 시도 초과 영속 잠금 + 만료 자동해제)
- [x] `components/auth/LockGate.tsx` (PIN 미설정 자동해제 + 백그라운드 자동잠금)
- [x] `components/auth/CriticalErrorScreen.tsx` (순수 RN — provider 깨져도 표시)
- [x] `components/error-boundary.tsx`
- [x] `app/_layout.tsx` — ErrorBoundary > Providers > LockGate > AppTabs 배선
- [x] 라우팅 재구성 — 루트 `_layout` Stack + `(tabs)/_layout` 탭 4개. 데모(index/explore/app-tabs) 제거
- [x] 피드 (`(tabs)/index`) — FlashList + listEntries + 작성 FAB
- [x] 작성/상세 (`entry/new` 생성·감정선택, `entry/[id]` 조회·삭제)
- [x] 감정 캘린더 (`(tabs)/calendar`) — 월별 마킹(감정 색상 점) + 날짜 탭 상세 이동. 기기 육안확인 보류(연결 끊김)
- [x] 통계 화면 — 감정 분포 차트(victory-native). 설정은 테마/언어 구현됨
- [x] 작성 화면 태그 입력 UI — 칩 추가/삭제 + createEntry tagNames 전달. 기기 육안확인 보류(USB 연결 불안정)
- [x] 탭 아이콘 (Ionicons)
- [x] 다크모드 (themeMode 설정 연동) + i18n (ko/en, i18next + 화면 문자열 t() 전환 + 언어 토글)
- [x] 테스트: secureStorage(PIN+시도횟수) / useLockStore (11 통과). MMKV/secure-store/crypto mock + @noble transformIgnorePatterns
- [ ] 테스트: queries/entries (expo-sqlite 인메모리 하네스 필요 — 보류)
- [ ] 빌드 검증 + 테스트 통과

## Phase 2 — 핵심 차별화
- [x] tentap 리치텍스트 에디터 — entry/new 본문(content=HTML, contentText=평문)
- [x] 사진 첨부·크롭 + documentDirectory 영구 복사(persistPhoto) + 삭제 시 파일 정리
- [x] 위치·날씨 자동 태깅 (`lib/weather`) — expo-location + OpenWeatherMap
- [x] FTS5 검색 UI (`queries/search`) — 피드 검색바, prefix MATCH
- [x] 감정 통계 그래프 (victory-native) — 감정 분포 막대 + 범례

## Phase 3 — 리텐션
- [x] 연속 작성 스트릭 (currentStreak, 통계 카드). MMKV 캐시는 생략(라이브 계산)
- [ ] 리마인더 알림 (expo-notifications)
- [ ] JSON 내보내기/가져오기
- [ ] 클라우드 백업 (D-5 결정)

## Phase 4 — 프리미엄
- [ ] STT (@react-native-voice/voice)
- [ ] AI 감정 인사이트 (Claude API)
- [ ] 홈 위젯
- [ ] E2E 암호화 (PIN 파생키 MMKV)
