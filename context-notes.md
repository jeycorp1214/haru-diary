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

## 2026-06-09 — 설정 확장: 화면 잠금 + 글자 스타일

- **글꼴체 = 한글 Google Fonts 설치** — NanumGothic/NanumMyeongjo/Gaegu(손글씨). 시스템 폰트는 iOS 한글 서체 폴백 불안정 + 프리뷰 차이 작아 비채택. `@expo-google-fonts/*`는 순수 JS TTF 자산 → `useFonts`로 런타임 로드, **네이티브 재빌드 불필요**(dev metro 리로드로 적용). `lib/fonts.ts`에 FONT_ASSETS/FONT_FAMILY/FONT_KEYS/FONT_SCALES 집약.
- **폰트 로드 게이트** — `_layout.tsx` `useFonts(FONT_ASSETS)` → 마이그레이션 게이트와 `!success || !fontsLoaded`로 통합.
- **글자 스타일 적용 범위 = 상세 본문만** — `entry/[id].tsx` body Text에 fontSize·lineHeight×fontScale + FONT_FAMILY[key]. **tentap 에디터(작성)는 webview라 RN 폰트 적용 불가 → 제외**(읽기면만). 피드는 미적용(스코프).
- **(수정) 글꼴 전역 적용** — 사용자 피드백: 글꼴이 일기 본문에만 적용됨. `lib/globalFont.ts`로 `Text.render`/`TextInput.render`를 패치해 base style에 `fontFamily` 주입(전역). **defaultProps.style은 컴포넌트가 style 주면 덮여서 안 먹음** → render 패치가 정석. 명시 fontFamily(아이콘 폰트 등)는 base 위에 와서 우선 유지. 라이브 반영은 `_layout`의 `<Stack key={fontFamily}>` remount(LockGate 안쪽이라 잠금 flash 없음, 네비게이션은 초기 라우트로 리셋되지만 글꼴 변경은 드묾). fontScale(크기)은 전역 미적용(레이아웃 깨짐 위험) — 본문만 유지.
- **(수정) 설정탭 스크롤** — 루트가 `<View>`라 내용 넘쳐도 스크롤 불가였음 → `<ScrollView>`(contentContainerStyle에 padding/gap)로 교체.
- **fontScale는 원래 죽은 값**이었음(스토어에만 있고 소비처 0). 이번에 상세 본문에 배선.
- **화면 잠금 UI** — 기존 인프라(secureStorage savePIN/hasPIN/deletePIN, useLockStore, useBiometrics) 재사용. PIN 설정은 `app/pin-setup.tsx` 모달(4자리 입력→확인 재입력 일치 시 savePIN). 설정탭은 `useFocusEffect`로 복귀 시 hasPIN 재확인. 생체 토글은 PIN 설정+생체 가용 시만 노출, PIN 삭제 시 생체도 off. 자동잠금 0(즉시)/1/5/10분.
- **PIN 변경 주의(E2E와 연계)** — savePIN 재호출 시 [[2026-06-09 — Phase 4 E2E 암호화]] 암호키 재파생됨. 현재 잠금 끄기=deletePIN→재설정 경로뿐이라 암호 store 데이터는 어차피 폐기. 별도 "PIN 변경" 플로우 추가 시 재암호화 필요(기존 메모 유효).

## 2026-06-09 — UI 스택 교체: Tamagui 제거 → Unistyles v3

- **근본 원인 규명(probe로 확정)** — Tamagui 2.1.0의 `StackStyleBase`에 RN 0.85 ViewStyle이 안 병합됨 → YStack/XStack의 flex/padding/gap/alignItems/backgroundColor가 타입에 없음("does not exist"/"not assignable"). `typeof config`는 정상(tokens 있음), `TamaguiCustomConfig` augment를 'tamagui'·'@tamagui/web' 둘 다 시도해도 무효. **config 실수 아닌 Tamagui↔RN0.85 버전 비호환.** Text 토큰/Button/Separator는 통과(런타임은 전부 정상, TS만 막힘).
- **RN 다운그레이드 비채택** — RN 0.85는 Expo SDK 56 고정 → SDK 통째 다운그레이드 수반(DB/voice/폰트/잠금/prebuild 전부 재구성). 공짜 우회(style={{}}) 있는 미관 문제로 스택 후퇴는 비용과다.
- **대안 = Unistyles v3 (3.2.5)** — StyleSheet.create((theme)=>...) API라 기존 RN StyleSheet에서 마이그레이션 최소. peer: rn>=0.76, nitro(MMKV로 기설치), reanimated(기설치), edge-to-edge. RN 0.85 호환.
- **설치/설정** — `react-native-unistyles` + `react-native-edge-to-edge`. babel: `@tamagui/babel-plugin` 제거 → `['react-native-unistyles/plugin', {root:'src'}]`. `src/unistyles.ts`에 light/dark 테마(colors/space/radius/fontSize) + breakpoints + `StyleSheet.configure({adaptiveThemes:true})`. `_layout` 최상단 `import '@/unistyles'`.
- **edge-to-edge는 config plugin 아님** — app.json plugins에 넣으면 "valid config plugin 아님" 에러(Expo56 edge-to-edge 기본 내장). 네이티브 모듈은 autolink만. plugins에서 뺌.
- **테마 동기화** — 기존 `useSettingsStore.themeMode`(system/light/dark) → `_layout`에서 `UnistylesRuntime.setAdaptiveThemes/setTheme`로 연결.
- **변환됨** — LockScreen/LockGate를 tamagui(YStack/Text/Button) → RN + Unistyles StyleSheet. lab.tsx/tamagui.config.ts 삭제, tamagui deps 4개 제거.
- **후속** — 나머지 화면(feed/calendar/stats/settings/entry/[id]/new/pin-setup/ScreenHeader)은 아직 평문 StyleSheet(하드코딩 색). Unistyles 테마로 점진 이전 예정. 현재는 plain StyleSheet와 Unistyles 공존.

## 2026-06-09 — 공통 컴포넌트 시스템 (Phase A·B)

- **설계 문서** — `components.md`. 레퍼런스(Lv1~3) 참고하되 앱 중복도 기준 우선순위(P0 Box/Typography/Button/Icon, P1 SegmentedControl⭐/Card/Chip/ListRow/Input/Header/Spinner, P2 보류).
- **Phase A 토큰 확장** — `unistyles.ts`에 semantic colors(primary/onPrimary/primarySoft/surface/surfaceAlt/text/textMuted/textDisabled/border/danger/onDanger/placeholder + 하위호환 별칭 brand/background/card/inputBg) + named spacing(xs~xl) + radius.pill + 토큰 타입 export(ColorToken/SpacingToken/RadiusToken/FontSizeToken).
- **⚠ 핵심 버그: `useUnistyles()` 훅 런타임 undefined** — Box/Typography에서 `const {theme}=useUnistyles()` → `TypeError: Cannot convert undefined value to object`(검은 화면+ErrorBoundary). **해결: Unistyles 3 정석인 `StyleSheet.create((theme)=>({ x:(args)=>({...}) }))` 동적함수 패턴으로 전환.** 훅 대신 동적 스타일 함수를 babel 플러그인이 처리해야 theme 주입됨. **raw 테마값**(아이콘 색·ActivityIndicator·victory Bar 색)이 필요하면 `styles.x(args).color`로 추출.
- **검증** — 통계 화면을 Box/Typography로 재작성 → 기기 렌더 확인(스크린샷: primarySoft 카드 + primary "0일" + caption/label 토큰 적용).
- **HMR 함정** — ErrorBoundary 상태에선 fast-refresh가 자식 재렌더 안 함. 컴포넌트 수정 후엔 **force-stop + cold start**로 풀 번들 재요청해야 반영(상태에 따라 "1 module" delta만 와서 안 바뀜).
- **후속** — P0 나머지 적용(Button/Icon은 작성됨, 화면 적용은 Phase C/D). 다크/라이트 토글 일관성(Unistyles adaptiveThemes ↔ nav ThemeProvider)은 화면 이전 시 함께 검증.

### Phase C·D 완료 (2026-06-09)
- **P1 컴포넌트** — SegmentedControl(설정 6곳 대체)/Card/Chip/ListRow/Input(forwardRef)/Spinner + ScreenHeader 토큰화. 전부 `StyleSheet.create((theme)=>)` 동적함수.
- **타입 함정** — Unistyles 동적 스타일 함수 반환에 RN `TextStyle` 명시하면 `cursor` 타입 충돌(UnistylesValues와 불일치). **반환 타입 어노테이션 빼고 추론에 맡길 것.** fontWeight 같은 리터럴은 `as '600'|'400'`로 좁히기.
- **다크모드 검증됨(기기)** — 설정에서 테마 토글 → UnistylesRuntime 동기화 → 이전 화면들 라이브 재렌더(통계/피드 다크 스크린샷). 
- **⚠ metro 캐시 — 다중 편집 후 HMR 신뢰 불가** — 컴포넌트/스타일 여러 파일 수정하면 HMR이 "1 module" 델타만 보내고 ErrorBoundary 상태에 갇혀 검은 화면. force-stop/cold start로도 캐시 번들 받음. **확실한 복구 = metro kill + `expo start --clear` 풀 리빌드(3600+ modules)**. 편집 중간 상태가 metro 로그에 stale 에러로 남으니 "현재 파일 tsc 0"이면 캐시 탓으로 판단.
- **이전된 화면** — settings/index(feed)/calendar/stats/entry[id]/entry/new/pin-setup + LockScreen/LockGate. 전부 하드코딩 색 제거.
- **미이전/잔여** — DriveBackupButton(별도 컴포넌트, 추후), tentap 에디터 내부(webview), victory 차트(theme.colors.primary는 적용). P2(Switch/Modal/Toast)는 설계상 보류.

## 2026-06-09 — queries/entries 테스트 (보류 해제)

- **하네스 = better-sqlite3 인메모리 + jest.mock** — `expo-sqlite`는 네이티브라 Node/jest에서 불가. drizzle의 `expo-sqlite` ↔ `better-sqlite3` 드라이버가 **API 동일**(sync 트랜잭션 콜백, `.run/.get/.all`, RQB) → `jest.mock('@/db/client')`로 인메모리 인스턴스만 갈아끼움. **소스 0 수정.**
- **마이그레이션 재사용** — `migrations/0000_*.sql`을 `--> statement-breakpoint`로 split 후 `sqlite.exec`. 스키마 드리프트 방지(실제 마이그레이션과 동일 DDL).
- **FK cascade 검증 핵심** — `sqlite.pragma('foreign_keys = ON')` 필수(better-sqlite3도 기본 OFF). deleteEntry → entry_tags/photos cascade 자동삭제 + FTS 수동삭제를 실제로 확인.
- **⚠ RQB는 thenable** — `createEntry/updateEntry/deleteEntry`는 sync(`.run()`)지만 `getEntry/listEntries/entriesInMonth`(=`db.query.findMany/findFirst`)는 QueryPromise 반환 → 테스트에서 **await 필수**. better-sqlite3 sync라 await는 즉시 resolve. (실앱도 동일 — 호출부 await 중)
- **UUID 카운터 mock** — `expo-crypto.randomUUID`를 `id-${++n}`로(고정값이면 PK 충돌). db-photo는 expo-file-system 의존 → `deletePhotoFile` no-op mock.
- **devDep** — `better-sqlite3` + `@types/better-sqlite3`. FTS5 기본 컴파일 포함(검증함).

## 2026-06-09 — 글자 스타일 실기기 검증 (emulator-5554)

- **globalFont 라이브 반영 확인** — 설정에서 손글씨 선택 → 화면 전체 텍스트(제목/섹션라벨/버튼/탭바/프리뷰)가 즉시 Gaegu 손글씨체로 전환. JSX 런타임 패치(jsx/jsxs/jsxDEV) + subtree remount 정상 동작.
- **명시 fontFamily 우선 유지 확인** — 글꼴 버튼 "고딕/명조"는 각자 자기 폰트(`FONT_FAMILY[o.key]`)로 렌더, 전역 손글씨에 안 먹힘. globalFont의 "명시 fontFamily는 우선 유지" 로직 정상.
- **fontScale 라이브** — 아주 크게(1.3) 선택 시 프리뷰 텍스트 즉시 확대.
- **잠금화면 폰트** — LockScreen "일기 잠금" 제목·PIN 오류 메시지 손글씨 + danger 색 렌더. PIN 오입력 시 시도횟수 카운트("남은 시도 2회") 영속 동작 확인([[2026-06-09 보안 보강]] 검증).
- **⚠ 검증 위해 앱 데이터 clear함** — 이전 세션 PIN 미상 + 시도 2회 남아 브루트포스 위험 → `adb shell pm clear`로 초기화(사용자 승인). PIN/일기/설정 전부 리셋. 데이터 없는 상태에서 자동언락(LockGate hasPIN false) 정상.
- **미검증** — 상세 본문 적용(일기 0건이라 생략). 코드 배선은 확인됨(globalFont 전역 + entry/[id] fontScale). tentap 에디터 내부는 webview라 globalFont 미적용(설계상 별도).

## 2026-06-09 — PDF 내보내기 (설계 외 요청)

- **방식 = expo-print** — `Print.printToFileAsync({ html })` → PDF 파일 → 기존 `Sharing.shareAsync`(JSON 내보내기와 동일 패턴). expo-print 56.0.3, autolink(config plugin 불필요), 네이티브 재빌드만 필요.
- **`lib/pdf.ts`** — entrySectionHtml(e, untitled): 날짜/감정emoji/제목/위치·날씨/본문/사진/태그 → HTML. 본문은 tentap이 저장한 `content`(HTML) 그대로 사용(`getHTML()` 출력이라 클린). content 없으면 contentText 폴백. wrapHtml: 한글 시스템폰트(-apple-system, Noto Sans KR) + `page-break-after`로 일기마다 페이지 분리. exportEntriesPdf(전체)/exportEntryPdf(단일).
- **사진 base64 임베드** — Android `<img>`는 `file://` 미지원 → `new File(uri).base64()`(expo-fs 56 신규 API)로 data URI 변환. 실패 시 해당 사진만 skip.
- **i18n 처리** — pdf.ts는 t() 없으니 호출부(settings/entry[id])에서 `t('entry.untitled')` 주입(untitled 파라미터). 신규 키: settings.exportPdf, entry.sharePdf.
- **UI** — 설정 백업 섹션 "PDF 내보내기"(전체) + entry/[id] 헤더 "PDF" 버튼(단일, 삭제 옆 Box row).
- **실기기 검증(emulator-5554)** — 영문 테스트 일기 작성 후 단일/전체 둘 다 Android 공유 시트("Sharing 1 file" + *.pdf) 정상. cache/Print/에 PDF 생성. pull해서 %PDF-1.4·28KB 확인 + macOS `qlmanage -t`로 렌더 확인(날짜 회색/이모지/제목 굵게/본문/HTML 스타일 정확).
- **미실행 경로** — 사진 base64(사진 없는 일기로 테스트). 코드는 작성됨. 한글 본문 PDF(adb 한글 입력 불가로 영문 사용했으나 webview 시스템폰트라 한글 렌더 문제 없음 — 설정 프리뷰 등에서 기검증).

## 감정 이모티콘 이미지화 (2026-06-09)

- **요구** — Unicode 이모지 5종 대신 `assets/mods/emoticon_1..36.png` 36종 이미지로 감정 등록. 바텀시트 그리드에서 탭 선택.
- **데이터 모델 결정** — 마이그레이션 회피 위해 `moods.emoji` 컬럼을 **이미지 키 저장용으로 재활용**(`'emoticon_12'` 등). 모든 렌더 사이트가 이미 `.emoji`를 읽으므로 해석만 변경 → 최소 변경. `score`는 0 고정(NOT NULL 유지, 통계 의미 폐기). 사용자 결정: "통계 버리고 36개 장식용".
- **정적 require 맵** — RN은 동적 require 불가 → `constants/emoticons.ts`에 36개 명시 매핑. `emoticonSource(key)`가 키→source 변환(없거나 옛 Unicode면 undefined → 호출부에서 폴백).
- **require 경로** — babel module-resolver 없음(metro tsconfig-paths가 `@/` 해석). png require는 안전하게 상대경로 `../../assets/mods/`.
- **선택 UI** — `MoodPickerSheet`(ContactSheet 패턴, Modal+백드롭). 6열 그리드(36=6×6), maxHeight 360 스크롤. 탭 시 `onSelect`+`onClose`. 같은 항목 재탭 = 해제.
- **렌더 폴백** — index/[id]/stats 모두 `emoticonSource()` truthy면 `<Image contentFit=contain>`, 아니면 기존 Text(📝/Unicode). 옛 일기(Unicode emoji) 깨짐 방지.
- **삭제 안 함(사용자 지시)** — `constants/mood.ts`(moodColor, calendar 점 색 — score 0이라 전부 회색), `stats.moodDistribution`/`MoodCount`/`queryKeys.statsMoods`, `pdf.ts:47` emoji(PDF 제목에 'emoticon_N' 텍스트 노출됨), 옛 5 mood 시드 잔존 — 모두 유지. 사용자 검토 후 삭제 예정.
- **검증** — tsc 0, jest 48/48. 실기기 육안검증 보류.

## Tamagui style prop 결정 (위 참조)
런타임/번들은 통과(iOS export OK). **결정(2026-06-09): style prop 방식 확정.** tamagui 2.1.0이 이미 최신(peer react>=19)이라 업그레이드 타깃 없음 — 버전 문제 아닌 라이브러리 타입 한계. 컨벤션: **레이아웃(flex/align/justify/gap/padding) = `style={{}}`(RN 타입), 색·폰트·컴포넌트 = Tamagui 토큰/컴포넌트.** 런타임 안전, 추가 설치 0.
