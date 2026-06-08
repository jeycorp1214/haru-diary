<!-- haru-diary 전체 프로젝트 설계 문서 — architecture.md(기술 선택)의 하위 레벨 구현 설계 -->

# haru-diary — 프로젝트 설계

> `architecture.md`(스택 선택 근거)의 다음 단계. **무엇을 어디에 어떻게 배치할지** 정의한다.
> 디렉토리 구조 · DB 스키마 · 상태 스토어 · 라우팅 트리 · 모듈 경계 · 데이터 흐름.

---

## 0. 현황 & 미해결 결정 (먼저 읽을 것)

기존 스캐폴드는 **Expo Router 56 스타터** 상태. architecture.md가 가정한 의존성은 아직 미설치.

| 항목 | architecture.md 가정 | 현재 스캐폴드 | 결정 필요 |
| --- | --- | --- | --- |
| UI 스타일링 | **Tamagui** | 바닐라 `StyleSheet` + `Colors` 테마 훅 (스타터 스캐폴드, 폐기 예정) | **Tamagui 확정 (D-1)** |
| 루트 레이아웃 | 잠금 게이트 (`isLocked` → `<LockScreen/>`) | 단순 `AppTabs` 탭 레이아웃 | 게이트로 교체 |
| 핵심 의존성 | drizzle/mmkv/zustand/secure-store/tamagui 등 | 미설치 | 설치 + prebuild 필요 |
| 앱 플러그인 | local-authentication 등 | router/splash만 | app.json 보강 |

> **결정 D-1 (UI 스택 = Tamagui 확정)** — 스타터 스캐폴드는 바닐라 StyleSheet + `Colors` 훅이지만 실제 코드 미작성 상태라 이탈 비용 없음(`reset-project`로 폐기). Tamagui 채택 → 컴포넌트·토큰·테마 일원화. 시트는 Tamagui Sheet로 `@gorhom/bottom-sheet` 중복 제거, `@shopify/flash-list`는 직교(가상화)라 유지. 리스크: RN 0.85 / React 19 / react compiler 조합 호환 설치 시 검증.

---

## 1. 설계 원칙

- **레이어 분리** — UI(`app`/`components`) ↛ DB 직접 접근 금지. 반드시 `db/queries` 또는 hook 경유.
- **스토리지 이원화** — 설정·플래그·핫데이터 = MMKV(동기). 일기 본문·관계형 = SQLite(drizzle). (architecture.md §3)
- **단일 트랜잭션 불변식** — 일기 본문 쓰기 + FTS 인덱스 갱신 + 태그 연결은 한 트랜잭션. (architecture.md §7)
- **보안 우선** — 잠금 우회 불가. 시도 횟수·만료는 영속화. 사진은 documentDirectory 영구 저장.
- **타입세이프 경계** — DB 입출력은 drizzle 추론 타입, 외부 입력(폼·API)은 zod 검증 후 통과.

---

## 2. 디렉토리 구조

기존 `src/` (`@/*` alias) 유지하며 확장. architecture.md가 명시한 경로(`/lib/auth/*`, `/components/auth/*`)는 그대로 채택.

```
src/
  app/                          # expo-router 라우트 (파일 기반)
    _layout.tsx                 # 루트: ErrorBoundary > Providers > LockGate > Stack
    (tabs)/
      _layout.tsx               # 탭 네비게이터
      index.tsx                 # 타임라인 피드 (Browse) — flash-list
      calendar.tsx              # 감정 캘린더 (react-native-calendars)
      stats.tsx                 # 감정 통계 (victory-native)
      settings.tsx              # 설정 (테마/잠금/알림/백업)
    entry/
      [id].tsx                  # 일기 상세 보기
      new.tsx                   # 작성/편집 (presentation: modal)
    _components/                # 라우트 전용 비공유 조각 (선택)
  db/
    client.ts                   # expo-sqlite + drizzle 인스턴스, FTS 부트스트랩
    schema.ts                   # 테이블 + 관계 정의
    migrations/                 # drizzle-kit 생성 산출물
    queries/
      entries.ts                # CRUD + FTS 동기화 (단일 트랜잭션)
      moods.ts
      tags.ts
      search.ts                 # FTS5 MATCH 쿼리
      stats.ts                  # 감정 집계
  lib/
    auth/
      secureStorage.ts          # PIN pbkdf2 파생 + 시도횟수 영속화 (architecture §4)
      useBiometrics.ts          # 생체인증 훅
      useLockStore.ts           # Zustand 잠금 스토어
    storage/
      mmkv.ts                   # 네임스페이스별 MMKV 인스턴스 (settings/lock)
    weather/
      openWeather.ts            # OpenWeatherMap 클라이언트
    i18n/
      index.ts                  # i18next 초기화
      locales/{ko,en,ja}.json
    db-photo.ts                 # 사진 documentDirectory 복사 유틸
  stores/
    useSettingsStore.ts         # 테마/폰트/알림 등 앱 설정 (MMKV 백업)
  components/
    auth/
      LockScreen.tsx            # PIN + 생체인증 UI
      CriticalErrorScreen.tsx   # ErrorBoundary fallback
    write/                      # 에디터·사진·음성 조각 (Phase 2+)
    mood/                       # 감정 선택·마킹 조각
    browse/                     # 피드 아이템 등
    ui/                         # 공용 프리미티브 (기존 collapsible 등)
    (기존 themed-*, app-tabs 등 유지)
  hooks/                        # 공용 훅 (기존 use-color-scheme, use-theme)
  constants/                    # theme, 감정 정의표 등
```

원칙: `app/`는 **조립만**. 로직은 `db/queries`·`lib`·`stores`·`components`로.

---

## 3. 데이터 모델 (drizzle + SQLite)

`db/schema.ts`. 단일 사용자 로컬 앱 → 사용자 테이블 없음.

```
entries
  id           text PK (uuid)
  entryDate    text  not null    -- 일기 귀속 날짜 YYYY-MM-DD (캘린더/스트릭 기준)
  title        text
  content      text               -- 리치텍스트 직렬화(HTML/JSON, tentap 산출물)
  contentText  text  not null     -- FTS·미리보기용 평문 (content에서 추출)
  moodId       text  → moods.id   -- 단일 대표 감정 (nullable)
  weather      text               -- 코드/요약
  tempC        real
  locationName text
  lat          real
  lng          real
  createdAt    integer not null    -- epoch ms
  updatedAt    integer not null

moods                              -- 시드 고정표 (감정 정의)
  id     text PK
  key    text unique               -- happy/sad/...
  emoji  text
  label  text                      -- i18n 키로 대체 가능
  score  integer                   -- -2..2 (통계 집계용)

tags
  id    text PK
  name  text unique

entry_tags                         -- m:n
  entryId text → entries.id (cascade)
  tagId   text → tags.id
  PK(entryId, tagId)

photos
  id       text PK
  entryId  text → entries.id (cascade)
  uri      text not null            -- documentDirectory 내 영구 경로
  width    integer
  height   integer
  sort     integer

entries_fts                        -- FTS5 가상 테이블 (별도 라이브러리 불필요)
  (title, contentText)             -- content=entries, content_rowid 연동
```

**FTS5 동기화** — `entries` INSERT/UPDATE/DELETE 시 `entries_fts` 동시 반영. 트리거 또는 `queries/entries.ts`의 명시적 트랜잭션 중 택1. architecture.md §7 불변식 → **같은 트랜잭션 내 명시적 갱신** 권장(트리거는 마이그레이션·디버깅 난도↑).

**스트릭** — 별도 컬럼 없이 `entryDate` distinct로 계산. 결과는 MMKV 캐시(§4).

**마이그레이션** — `drizzle-kit` 사용. 스키마 변경 시 사용자 데이터 보존 필수(architecture §7).

---

## 4. 스토리지 분담 (MMKV)

`lib/storage/mmkv.ts` — 네임스페이스별 인스턴스 분리.

| 인스턴스 id | 용도 | 암호화 |
| --- | --- | --- |
| `settings` | 다크모드/폰트/알림시각/마지막 감정/온보딩 | 무 |
| `lock` | 잠금활성/마지막인증시각/자동잠금분/**실패횟수**/**잠금만료시각** | 무(해시는 SecureStore) |
| `cache` | 스트릭 계산 캐시/최근 날씨 | 무 |

PIN 해시·salt는 **SecureStore**(Keychain/Keystore), MMKV 아님. (architecture §4)
PIN 파생키로 추가 암호화 MMKV 인스턴스는 E2E(Phase 4)에서 도입.

---

## 5. 상태 관리 (Zustand)

Context 난립 금지, 스토어 2개로 제한 (architecture.md 방침).

| 스토어 | 위치 | 책임 | 영속 |
| --- | --- | --- | --- |
| `useLockStore` | `lib/auth/useLockStore.ts` | isLocked / 생체활성 / 자동잠금분 / lock·unlock / checkShouldLock | MMKV(`lock`) |
| `useSettingsStore` | `stores/useSettingsStore.ts` | 테마모드 / 폰트크기 / 알림시각 / 언어 | MMKV(`settings`) |

서버/비동기 상태 아님 → **일기 데이터는 Zustand에 넣지 않음**. DB 접근은 React Query(`useQuery`/`useMutation`) + `db/queries`로. (architecture: TanStack Query)

데이터 흐름: `화면` → `useQuery(queries/entries)` → drizzle → SQLite. 쓰기 → `useMutation` → 트랜잭션(본문+FTS+태그) → `invalidateQueries`.

---

## 6. 라우팅 & 잠금 게이트

`app/_layout.tsx` 루트 구성 (architecture §4 + §7 에러바운더리 결합):

```
<ErrorBoundary fallback={CriticalErrorScreen}>   # DB/SecureStore 치명오류 차단
  <QueryClientProvider>
  <GestureHandlerRootView>
  <ThemeProvider>                                  # 다크모드
    <LockGate>                                     # isLocked ? <LockScreen/> : children
      <Stack/>                                     # (tabs) + entry/* 모달
    </LockGate>
  ...
```

- `LockGate` = 현재 `_layout.tsx`의 `AppTabs` 직접 렌더를 대체. `AppState` 'active' 복귀 시 `checkShouldLock()`.
- 탭 4개: 피드 / 캘린더 / 통계 / 설정.
- 작성·상세는 `entry/new`·`entry/[id]` (탭 밖 스택, 모달 제시).
- typed routes 활성(`app.json`) → 링크 타입 안전.

---

## 7. 기능 ↔ 모듈 매핑

| 기능 (architecture §2) | 라우트 | 로직 위치 |
| --- | --- | --- |
| 타임라인 피드 | `(tabs)/index` | `queries/entries.list` + flash-list |
| 작성/편집 | `entry/new` | `components/write/*` + `queries/entries.upsert` |
| 감정 선택 | 작성 화면 내 | `components/mood/*` + `moods` 시드 |
| 감정 캘린더 | `(tabs)/calendar` | `queries/moods.byMonth` + 커스텀 마킹 |
| 감정 통계 | `(tabs)/stats` | `queries/stats` + victory-native |
| 전문 검색 | 피드 헤더/검색 | `queries/search` (FTS5 MATCH) |
| PIN/생체 잠금 | 게이트 | `lib/auth/*` |
| 스트릭 | 설정/홈 배지 | `queries/stats.streak` + MMKV 캐시 |
| 날씨·위치 태깅 | 작성 시 | `lib/weather` + expo-location |

---

## 8. 횡단 관심사

- **i18n** — `lib/i18n`, i18next, ko/en/ja. 한글 조사 처리 헬퍼 포함. mood label도 i18n 키화.
- **테마/다크모드** — Tamagui 테마(`light`/`dark` 토큰)로 일원화. 기존 `hooks/use-theme`·`constants/theme`는 Tamagui config로 대체. `useSettingsStore.themeMode`(system/light/dark)로 오버라이드.
- **에러 추적** — `@sentry/react-native` (Phase 1 후반).
- **에러 바운더리** — `components/auth/CriticalErrorScreen` + 루트 래핑.
- **테스트** — Jest + Testing Library. queries·secureStorage·useLockStore 우선 (architecture §7: Phase 1부터).

---

## 9. Phase별 설계 적용 순서

architecture.md §5 마일스톤에 본 설계 매핑.

- **Phase 1 (MVP)** — §2 구조 골격 + §3 entries/moods/tags/photos/FTS 스키마 + §4 MMKV + §5 스토어 + §6 잠금 게이트 + 에러바운더리 + 시도횟수 영속화 + 피드/캘린더 + 다크모드/i18n(ko/en).
- **Phase 2** — `components/write`(tentap 에디터), 사진(documentDirectory 복사), 날씨·위치, FTS 검색 UI, 통계 그래프.
- **Phase 3** — 스트릭, 리마인더 알림, JSON 내보내기/가져오기, 클라우드 백업.
- **Phase 4** — STT, AI 인사이트(Claude API), 위젯, E2E 암호화(PIN 파생키 MMKV).

---

## 10. 미해결 결정 목록

| ID | 결정 사항 | 권장 | 상태 |
| --- | --- | --- | --- |
| D-1 | UI 스택: Tamagui vs NativeWind | **Tamagui** (컴포넌트+토큰 일원화, 스캐폴드 코드 미작성→이탈 0) | **확정** |
| D-2 | 리치텍스트 직렬화: HTML vs JSON | tentap 기본(HTML) + 평문 추출 | Phase 2 |
| D-3 | FTS 동기화: 트리거 vs 명시 트랜잭션 | 명시 트랜잭션 | Phase 1 |
| D-4 | 감정: 단일 vs 다중 | 단일 대표 + 활동태그 별도 | Phase 1 |
| D-5 | 클라우드 백업 제공자 우선순위 | iCloud/Drive 중 택 | Phase 3 |

> D-1 확정(Tamagui). 나머지는 해당 Phase 진입 시 `context-notes.md`에 결론 기록.
