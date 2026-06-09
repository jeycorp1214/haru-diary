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
- [x] 테스트: queries/entries — better-sqlite3 인메모리 하네스(jest.mock `@/db/client`, 소스 무수정). 트랜잭션/태그 dedup/FK cascade/FTS 동기화/import 매핑 검증 (7 신규, 총 24 통과)
- [x] 빌드 검증: jest 17/17 + tsc 0에러 + `expo export` android 번들(9.5MB hbc) + 네이티브 `expo run:android` BUILD SUCCESSFUL(11s)·APK 설치·앱 실행(emulator-5554)

## Phase 2 — 핵심 차별화

- [x] tentap 리치텍스트 에디터 — entry/new 본문(content=HTML, contentText=평문)
- [x] 사진 첨부·크롭 + documentDirectory 영구 복사(persistPhoto) + 삭제 시 파일 정리
- [x] 위치·날씨 자동 태깅 (`lib/weather`) — expo-location + OpenWeatherMap
- [x] FTS5 검색 UI (`queries/search`) — 피드 검색바, prefix MATCH
- [x] 감정 통계 그래프 (victory-native) — 감정 분포 막대 + 범례

## Phase 3 — 리텐션

- [x] 연속 작성 스트릭 (currentStreak, 통계 카드). MMKV 캐시는 생략(라이브 계산)
- [x] 리마인더 알림 (expo-notifications, 매일 지정시각 DAILY)
- [x] JSON 내보내기/가져오기 (export 공유 + import 파일선택·zod검증·삽입)
- [x] 클라우드 백업 — Google Drive(OAuth+업로드, client ID env 게이트). iCloud는 미구현

## Phase 4 — 프리미엄

- [x] STT (@react-native-voice/voice)
  - [x] voice 재활성화: patch-package로 build.gradle 수정(jcenter→mavenCentral/google, support→androidx, namespace, manifest package 제거)
  - [x] package.json autolinking.exclude에서 voice 제거 + postinstall patch-package
  - [x] lib/voice/useSpeechToText 훅 (start/stop/results/error + RECORD_AUDIO 권한)
  - [x] entry/new 마이크 버튼 → 인식 텍스트 본문(tentap) 삽입
  - [x] i18n 문자열 (ko/en)
  - [x] 네이티브 빌드 성공(BUILD SUCCESSFUL, voice 컴파일·APK 설치 SM_S928N)
  - [x] 런타임 동작 확인(실기기 음성 인식 성공). 모듈명 불일치(RCTVoice vs Voice) JS 패치로 해결
- [ ] 홈 위젯 — 보류(사용자 결정)

## UI 스택 교체 — Tamagui 제거 + Unistyles v3 채택

> 이유: Tamagui 2.1.0 ↔ RN 0.85 타입 비호환(Stack style prop 미반영). RN 다운그레이드는 비용과다 → Unistyles v3로 교체.

- [x] Unistyles 설치: react-native-unistyles@3.2.5 + react-native-edge-to-edge (nitro/reanimated 기존)
- [x] babel: @tamagui/babel-plugin 제거 → react-native-unistyles/plugin 추가
- [x] `src/unistyles.ts`: light/dark 테마 토큰 + breakpoints + StyleSheet.configure(adaptiveThemes)
- [x] `_layout.tsx`: TamaguiProvider 제거 + `import '@/unistyles'` + themeMode→UnistylesRuntime 동기화
- [x] LockScreen/LockGate: tamagui(YStack/Text/Button) → Unistyles StyleSheet
- [x] lab.tsx / tamagui.config.ts 삭제, tamagui deps 4개 제거
- [x] prebuild + 빌드 검증 (BUILD SUCCESSFUL 1m27s, unistyles+edge-to-edge 네이티브 통합). 런타임 육안확인 보류
- [x] React Query 표준화 — queryKeys 팩토리 + 기본값 + 통계 무효화 버그 수정
- [x] 공통 컴포넌트 시스템 (설계: `components.md`)
  - [x] Phase A — 토큰 확장(semantic colors/spacing/typography variants/radius pill)
  - [x] Phase B — P0: Box / Typography / Button / Icon
  - [x] Phase C — P1: SegmentedControl/Card/Chip/ListRow/Input/Header토큰화/Spinner
  - [x] Phase D — 화면 이전(설정/피드/캘린더/통계/상세/작성/pin-setup). 다크모드 기기 검증(피드/통계 스크린샷)
  - [x] Phase E — 피드백 레이어: Toast(싱글톤)/ConfirmDialog(Promise)/Switch + useUnsavedGuard(작성 이탈). Alert 전부 대체. 부팅 검증, 인터랙션은 수동

## 추가 기능 (설계 외 요청)

- [x] 설정: 화면 잠금 — PIN 설정/해제(pin-setup 모달) + 생체 토글 + 자동잠금 시간
- [x] 설정: 글자 스타일 — 크기 4단계 + 글꼴 4종(기본/고딕/명조/손글씨, 한글 Google Fonts) + 라이브 프리뷰. 상세 본문에 적용
  - [x] 실기기 육안 검증(emulator-5554): 잠금화면 손글씨 렌더 + PIN 오입력 시도횟수 카운트 동작 / 설정 글꼴 4종 버튼 자기폰트 렌더 / 손글씨 선택 시 전역 라이브 반영(제목·라벨·버튼·탭바·프리뷰) / 아주크게 크기 스케일. 상세 본문 적용은 코드 배선 확인(globalFont 전역 패치 + fontScale)
- [x] E2E 암호화 (PIN 파생키 MMKV)
  - [x] secureStorage: PIN에서 별도 salt로 암호키 파생 → SecureStore 영속 (auth 해시와 분리)
  - [x] secureMmkv: PIN 파생키로 암호화 MMKV(`secure`) 인스턴스 lifecycle (unlock/get/lock)
  - [x] unlock/lock 플로우 배선 (PIN·생체 경로 + 자동잠금) — useLockStore 중앙화
  - [x] 소비처: getAutoTag 위치/날씨(PII) 캐시를 암호화 store에 + 권한거부 시 폴백
  - [x] 테스트: 암호키 파생·라운드트립·lock 후 접근차단 (6 신규, 총 17 통과)
  - [x] 빌드/테스트 통과 (jest 17/17, tsc 0 에러). 기기 육안확인 보류
