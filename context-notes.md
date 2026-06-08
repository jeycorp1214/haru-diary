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

## 2026-06-09 — Phase 0 셋업 완료

- **전체 의존성 설치** — deps 54 + dev 7. `expo install --check` 통과. Expo SDK 56 정합.
- **critical 취약점 `xmldom@0.5.0`** — 경로 `@react-native-voice/voice → @expo/config-plugins@2.0.4 → @expo/plist → xmldom`. **빌드타임 전용**(prebuild plist 파싱), 앱 번들 미포함 → 위협 0. `audit fix --force`는 voice 다운그레이드라 비채택. **그대로 둠**, Phase 4(voice 사용) 때 재평가.
- **testing-library peer 충돌 해결** — `react-test-renderer`를 react와 동일 `19.2.3`으로 핀.
- **image-crop-picker는 Expo config plugin 아님** — `app.plugin.js` 미제공이라 plugins 배열에 넣으면 prebuild 크래시(`Cannot find module ./src/NativeImageCropPicker`). 권한은 `ios.infoPlist`(NSPhotoLibrary/NSCamera) + `android.permissions`로 처리. architecture.md §6의 "config plugin 필요"는 부정확.
- **Tamagui 설정** — `@tamagui/config@2.1.0`의 `/v4` 프리셋 사용. `babel.config.js`에 babel-plugin + `react-native-worklets/plugin`(reanimated 4, 마지막 순서). 애니메이션 드라이버는 Phase 2 모션에서 연결.
- **prebuild 완료** — ios/android 생성. bundleId/package = `com.kwak.dev.harudiary`. scripts가 `expo run:android/ios`로 자동 변경됨(Expo Go 아닌 dev build 필요).
- **Sentry 경고** — org/project 미설정. 실제 연동(Phase 1 후반) 시 설정.
- **기존 스캐폴드 tsc 에러 2건** — `global.css`/`animated-icon.module.css` side-effect import 타입 누락. 사전 존재, 내 변경 무관. CSS 타입 선언 필요 시 별도 처리.

## 2026-06-09 — Phase 1 DB/보안/잠금 구현

- **DB 레이어** — schema(5테이블+인덱스+relations) / 마이그레이션(Expo: babel inline-import + metro .sql) / client(FK ON + FTS5 부트스트랩) / seed(moods 멱등) / queries/entries(단일 트랜잭션 CRUD).
- **expo-sqlite sync 드라이버** — `db.transaction(cb): T` 동기 콜백. 내부 `.run()/.get()` 동기 실행(await 불가). async로 쓰면 커밋 안 됨.
- **MMKV v4 API 변경** — nitro 기반. `new MMKV()` → `createMMKV()`, `.delete()` → `.remove()`. architecture 샘플과 다름.
- **보안 §7 보강** — 시도횟수/잠금만료를 MMKV에 영속(`recordFailedAttempt`/`isLockedOut`). 컴포넌트 state만 쓰던 샘플의 강제종료 우회 취약점 해소.
- **LockGate 데드락 방지** — PIN 미설정(`hasPIN` false) 시 자동 unlock. 잠금은 opt-in.
- **⚠ Tamagui v2.1.0 + React 19 타입 마찰 (D-1 리스크 현실화)** — `<YStack flex={1} alignItems="center">` 같은 Stack shorthand 스타일 prop이 TS에서 "does not exist"로 안 잡힘. 단 `<Text fontSize="$6" color="$red10">`(토큰), `style={{...}}`(RN), `<Button>`은 정상. ## 2026-06-09 — Android 실기기 검증 (SM_S928N / Galaxy S24)

- **iOS 불가** — 이 머신은 Command Line Tools만, full Xcode 없음 → `expo run:ios` 불가. Android 물리 기기로 검증.
- **dev 빌드 성공** — `APP_ENV=development expo run:android`, BUILD SUCCESSFUL 6m34s. `harudiarydev://` scheme로 dev client 진입(scheme 분리 동작 확인).
- **빌드 실패 → 수정** — `@react-native-voice/voice`의 android build.gradle `jcenter()`가 Gradle 8에서 제거돼 실패. `expo.autolinking.exclude`로 voice 네이티브 언링크(Phase 4까지). → 재빌드 성공.
- **UI 버그 → 수정** — entry/new·[id]가 루트 Stack `headerShown:false` 상속 → 저장/삭제 버튼 안 보임. 각 화면 `headerShown:true`로 override. Metro fast refresh로 즉시 확인.
- **end-to-end 검증됨(스크린샷)** — 잠금 게이트 자동 unlock(PIN 미설정) → 피드 빈 상태 → FAB → 작성(감정 선택+본문) → **저장 → 피드에 항목 표시(😄/제목없음/test/2026.06.09) → 상세(삭제 버튼)**. 즉 마이그레이션+시드(mood emoji 조인)+createEntry 트랜잭션+listEntries 관계조인+React Query invalidate+i18n+다크모드 토글 UI 전부 기기에서 동작.
- **참고** — `adb shell input text`는 ASCII만(한글 X). 테스트 항목 "test"가 기기 DB에 남음(무해, 삭제 가능). expo run:android의 `--device`는 serial 아닌 device name 기대 → 단일 기기면 플래그 생략.

## 2026-06-09 — Phase 1·2 누적 실기기 검증 (SM_S928N)

- **검증 완료(스크린샷)** — 피드+검색바+탭아이콘 / 캘린더 mood 점 마킹 / 통계 차트 / 작성화면(감정·제목·사진·위치·태그·tentap 리치텍스트) 전부 기기 동작.
- **버그 발견·수정: 통계 빈 결과** — `db.select({...count()}).groupBy()`가 expo-sqlite 드라이버에서 빈 배열 반환. DB 덤프(run-as + python sqlite3)로 raw JOIN은 정상 확인 → drizzle aggregate 빌더 quirk로 판단, `db.all(sql\`...\`)` raw SQL로 교체(커밋 e3ba7ee). **교훈: 집계/groupBy는 raw SQL 권장.** (단순 select/relational `db.query`·`.all()`은 정상.)
- **dev client 재연결** — USB 재연결 시 Metro 끊김. `adb reverse tcp:8081 tcp:8081` + `harudiarydev://expo-development-client/?url=http://localhost:8081` 딥링크로 localhost 재접속.
- **미검증/메모** — tentap 에디터 placeholder가 영문("Write something …") 기본값, i18n 미적용(후속). 입력 한글은 adb 불가라 수동.

## 2026-06-09 — Phase 4 E2E 암호화 (PIN 파생키 MMKV)

- **범위 확정** — design.md §4/§9.3 "PIN 파생키 MMKV". 일기 본문(SQLite)이 아닌 **민감 캐시용 암호화 MMKV 인스턴스** 도입. SQLite 전체 암호화(SQLCipher)는 비채택(네이티브 대공사+마이그레이션 리스크+iOS 검증 불가).
- **암호키 ≠ auth 해시** — PIN 검증 해시(`derivePIN`)와 별도 salt(`diary_enckey_salt`)로 암호키 파생. 한쪽 유출이 다른쪽 노출로 이어지지 않게 분리.
- **키 영속 위치** — 파생 암호키를 SecureStore(Keychain)에 저장. 이유: **생체 unlock 경로엔 PIN이 없음** → in-memory PIN 파생만으론 Face ID 사용자가 store 못 읽음. savePIN 시 1회 파생→Keychain 보관, unlock(PIN/생체 무관)은 Keychain에서 로드.
- **MMKV 키 길이 제약** — react-native-mmkv 4.3.1: encryptionKey 문자열 AES-128 ≤16B / AES-256 ≤32B. 16B 파생 → hex 32자(=32B) + `encryptionType:'AES-256'`로 충족.
- **lifecycle** — `secureMmkv.ts`: unlock 시 `createMMKV({id:'secure', encryptionKey, encryptionType:'AES-256'})`, lock 시 인스턴스 참조 drop(파일은 암호화된 채 잔존). PIN 미설정이면 키 없음→인스턴스 미생성(폴백 평문 경로).
- **PIN 변경 미지원 주의** — savePIN 재호출 시 새 salt로 키 재파생 → 기존 암호화 데이터 복호화 불가. 현재 PIN 변경 플로우 없음. 추후 변경 지원하려면 재암호화 필요(문서화만).
- **소비처** — getAutoTag(위치 좌표=PII + 날씨)를 암호화 store에 캐시. fetch/권한 실패 시 캐시 폴백(오프라인/마지막값). design §4 cache "최근 날씨" 실현.

## 2026-06-09 — Phase 4 STT (@react-native-voice/voice)

- **voice 3.2.4 미유지 패키지** — build.gradle이 `jcenter()`(Gradle 8 제거) + `com.android.support:appcompat-v7:28`(AndroidX 이전). 모던 RN(0.85)은 jetifier 제거 + AndroidX 전용 → 그대로 빌드 불가. Phase 0/1에서 autolinking exclude로 언링크했던 이유.
- **Java 소스는 AndroidX 호환** — `androidx.annotation.NonNull` 사용. 즉 소스 패치 불필요, build.gradle만 문제.
- **해결: patch-package** — (1) jcenter→mavenCentral+google 3곳 (2) `com.android.support:appcompat-v7`→`androidx.appcompat:appcompat`. node_modules 패치를 patches/로 고정, postinstall 자동 적용.
- **new arch** — voice는 legacy bridge 모듈(TurboModule 아님). Expo SDK 56 bridgeless interop로 등록. 빌드 후 실기기 검증 필수.
- **expo-speech는 TTS** — STT 대체 불가. voice가 유일 경로.
- **입력 대상** — 인식 텍스트를 tentap 본문에 삽입(제목 아님). 언어는 settings i18n 연동(ko-KR/en-US). tentap에 insertAtCursor 없음 → getHTML 후 `<p>`로 append + setContent.
- **빌드 검증됨** — `expo run:android` BUILD SUCCESSFUL. `react-native-voice_voice:compileDebugJavaWithJavac` 통과(deprecation note만), APK 설치 SM_S928N. patch-package(jcenter→mavenCentral/google, support→androidx 1.6.1, namespace 추가, manifest package 삭제) end-to-end 동작. AGP 8 namespace 요구 충족.
- **런타임 미검증** — 음성 입력은 adb 불가라 수동. voice 3.2.4는 legacy bridge 모듈 → bridgeless(new arch) interop 등록 여부는 실제 마이크 탭으로만 확인 가능. xmldom 빌드타임 취약점은 여전히 빌드타임 전용(앱 번들 미포함), 위협 0 유지.
- **버그 발견·수정: "음성 인식 실패" 즉시 표시** — Android 11+ package visibility. SpeechRecognizer가 RecognitionService를 조회하려면 manifest `<queries>`에 `android.speech.RecognitionService` intent 필요. voice config plugin은 RECORD_AUDIO만 추가하고 queries는 안 넣음 → 즉시 ERROR. **수정: `plugins/withSpeechRecognitionQuery.js` 로컬 config plugin으로 queries 주입.** prebuild로 manifest 반영 확인(line 20), 재빌드·설치. hook에 `console.warn`으로 SpeechError code 진단 출력 추가.

### ✅ STT 런타임 해결 (2026-06-09)
**근본 원인 = 네이티브 모듈명 불일치.** Android `VoiceModule.getName()` → `"RCTVoice"`인데 lib JS(`dist/index.js`)는 `NativeModules.Voice`를 조회 → null → `Voice.destroySpeech of null`(unmount 시) + start 즉시 실패. new arch bridgeless interop이 legacy 모듈을 getName 키로 등록해서 `Voice` 키 없음.
- **수정** — patch-package로 `dist/index.js`: `const Voice = NativeModules.Voice || NativeModules.RCTVoice`. **JS-only 패치라 네이티브 재빌드 불필요**, metro 풀 리로드로 즉시 적용. 실기기 음성 인식 성공 확인.
- **결정적 단서** — 사용자가 본 "destroySpeech of null"(화면 이탈/unmount 시 `Voice.destroy()`). queries(아래)가 아니라 이게 진짜 원인이었음. queries 수정은 별개로 필요(둘 다 있어야 동작).
- **교훈** — STT 즉시실패 디버깅은 (1) NativeModules에 모듈 등록됐나(이름!) → (2) queries → (3) 권한 순. "of null"은 모듈 null 신호.

#### (해결 전 보류 메모 — 참고용)
queries 수정·재빌드·설치 후에도 음성 입력 탭 시 여전히 "음성 인식에 실패했습니다" 즉시 표시했음(모듈명 불일치가 남아서).

- **logcat 캡처 함정** — 이 macOS엔 `timeout` 없음(coreutils 미설치) → `timeout N adb logcat`은 exit 127로 안 돎(0줄 = 캡처 실패였지 "이벤트 없음"이 아님). `grep` 파이프는 블록버퍼링으로 timeout kill 시 flush 안 됨. **다음엔 `timeout` 금지, `adb logcat -d`(dump) 또는 백그라운드 streaming(timeout 없이)→파일 grep.**
- **dev 패키지명** — `com.kwak.dev.harudiary.dev` (APP_ENV=development `.dev` 접미사). production은 `com.kwak.dev.harudiary`. pidof/검색 시 `.dev` 사용.
- **캡처 결과(2617줄)** — SurfaceFlinger 등만, **SpeechRecognizer/RecognitionService/VoiceModule/ReactNativeJS 로그 전무**. 즉 네이티브 인식기 호출 전에 실패했거나, console.warn JS가 안 실림(새 번들 미로드 가능).
- **다음 단계 가설(우선순위순)**:
  1. **새 JS 번들 미로드** — console.warn 흔적 없음 → 앱이 옛 번들. metro 재시작 + 앱 완전 재시작(force-stop) 후 재확인.
  2. **bridgeless interop 실패** — voice 3.2.4 legacy 모듈이 new arch에 미등록 → `Voice.start`가 즉시 throw → catch에서 `speech_start_failed`. 확인: `NativeModules.Voice`/`Voice.isAvailable()` 존재 여부 로그. 미등록이면 new arch 호환 포크/대체 필요.
  3. **에러 분기 구분 안 됨** — 현재 mic_permission_denied / speech_start_failed / onSpeechError 모두 같은 UI 메시지. 임시로 raw 에러문자열을 화면에 노출해 어느 분기인지 먼저 특정할 것.
- **검증 순서** — (a) 화면에 raw error 노출 → 분기 특정 (b) NativeModules.Voice 등록 여부 (c) 그 다음 권한/queries.

## Tamagui style prop 결정 (위 참조)
런타임/번들은 통과(iOS export OK). **결정(2026-06-09): style prop 방식 확정.** tamagui 2.1.0이 이미 최신(peer react>=19)이라 업그레이드 타깃 없음 — 버전 문제 아닌 라이브러리 타입 한계. 컨벤션: **레이아웃(flex/align/justify/gap/padding) = `style={{}}`(RN 타입), 색·폰트·컴포넌트 = Tamagui 토큰/컴포넌트.** 런타임 안전, 추가 설치 0.
