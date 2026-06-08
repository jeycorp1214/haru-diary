<!-- haru-diary 설계 결정 기록 — 작업 중 내린 판단과 근거 누적 -->

# haru-diary 컨텍스트 노트

> 결정과 근거를 시간순 누적. 다음 세션이 재추론 없이 이어가기 위함.

## 2026-06-08 — 초기 전체 설계

**입력** — `architecture.md`(스택 선택 근거 문서) + 기존 Expo Router 56 스캐폴드.
**산출** — `design.md`(전체 설계) / `checklist.md` / 본 노트.

### 확정 결정

- **레이어 규칙** — `app/`는 조립만, 로직은 `db/queries`·`lib`·`stores`. UI에서 drizzle 직접 호출 금지.
  - **근거** — 테스트 용이성 + 화면/데이터 결합도 축소.
- **데이터 vs 상태 분리** — 일기 데이터는 Zustand 아닌 React Query로. Zustand는 잠금/설정 2스토어만.
  - **근거** — architecture.md "Context×13 → 1~2 스토어" 방침. 서버성 데이터는 Query 캐시가 적합.
- **감정 모델** — entry당 단일 대표 mood(`moodId`) + 활동태그 별도(`tags`).
  - **근거** — Daylio 패턴. 통계 집계(`score`) 단순화.
- **FTS 동기화** — 트리거 아닌 `queries/entries.ts` 명시 트랜잭션에서 본문+FTS+태그 동시 쓰기.
  - **근거** — architecture.md §7 불변식. 트리거는 마이그레이션·디버깅 난도↑.
- **MMKV 네임스페이스 분리** — settings/lock/cache 3인스턴스. PIN 해시는 MMKV 아닌 SecureStore.
  - **근거** — architecture.md §3·§4. 도메인별 격리 + 암호화 경계 명확화.

### 발견한 충돌 / 미해결

- **D-1 (UI 스택)** — `architecture.md`는 Tamagui, 스캐폴드는 `global.css`+CSS변수(NativeWind 계열) + expo-router `ThemeProvider`.
  - **현재 권장** — NativeWind v5. 스캐폴드 정합, 추가 빌드설정 최소.
  - **상태** — Phase 1 착수 전 사용자 확정 필요. 확정 시 architecture.md 표도 갱신할 것.
- **루트 레이아웃 교체** — 현 `src/app/_layout.tsx`는 `AppTabs` 직접 렌더. 잠금 게이트 + ErrorBoundary로 교체 예정. 기존 탭은 `(tabs)/_layout`으로 이동.
- **미설치** — drizzle/mmkv/zustand/secure-store 등 architecture 가정 의존성 전부 미설치. prebuild 필요(MMKV).

### 후속 결정 예약 (해당 Phase에서 결론 기록)

- D-2 리치텍스트 직렬화(HTML/JSON) — Phase 2
- D-3 FTS 트리거 vs 트랜잭션 — Phase 1 구현 시 확정 (현 권장: 트랜잭션)
- D-4 감정 단일/다중 — Phase 1 (현 권장: 단일+활동태그)
- D-5 백업 제공자(iCloud/Drive) — Phase 3
