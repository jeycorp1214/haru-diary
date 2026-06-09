<!-- haru-diary 공통 컴포넌트 시스템 설계 — Unistyles v3 기반. 구현 전 계획 문서. -->

# haru-diary 공통 컴포넌트 설계

> Unistyles v3 테마 토큰 기반. 레퍼런스(Box/Typography/Button → Form → Feedback)를 참고하되,
> **우선순위는 이 앱의 실제 화면 중복도 기준**으로 재정렬. `design.md`/`architecture.md` 보완.

## 0. 원칙

- **테마 구동** — 색·간격·폰트크기·반경은 전부 Unistyles 토큰. 하드코딩 색 금지(현재 화면들이 그래서 다크모드 깨짐).
- **글꼴은 전역 패치가 담당** — `lib/globalFont.ts`가 fontFamily를 전역 주입. 그래서 `Typography`는 **크기/굵기/색**만 다룸(fontFamily 지정 안 함).
- **외부 여백 금지** — 공통 컴포넌트는 자기만 그림. margin은 부모(`Box`)가 결정. (레퍼런스 베스트프랙티스)
- **forwardRef** — `Input`/`Button`은 ref 노출(포커스/스크롤 제어 대비).
- **아이콘 단일화** — 이미 쓰는 **Ionicons(@expo/vector-icons)** 로 통일. lucide 등 추가 도입 안 함. `Icon` 래퍼로 테마 색·크기 연동.
- **Unistyles `variants` 활용** — Button/Typography의 variant·size·state는 `StyleSheet.create`의 `variants` API로 선언(런타임 분기 최소).
- **재사용 단위만 공통화** — 1회용은 화면에 둠(§2 "과잉 추상화 금지").

## 1. 토큰 확장 (`src/unistyles.ts`)

현재 토큰(colors: brand/danger/background/card/text/textMuted/border/inputBg, space(), radius, fontSize)을 컴포넌트 친화적으로 확장.

### colors (semantic 역할 추가)
| 토큰 | light | dark | 용도 |
| --- | --- | --- | --- |
| `primary` | #208AEF | #4A9EFF | 브랜드/주요 액션 |
| `onPrimary` | #fff | #fff | primary 위 텍스트 |
| `primarySoft` | #208AEF11 | #4A9EFF22 | 칩/선택 배경 |
| `surface` | #fff | #000 | 화면 배경 |
| `surfaceAlt` | #fafafa | #1a1a1a | 카드/입력 배경 |
| `text` | #111 | #fff | 본문 |
| `textMuted` | #888 | #aaa | 보조/캡션 |
| `textDisabled` | #bbb | #555 | 비활성 |
| `border` | #ddd | #444 | 구분선/테두리 |
| `danger` / `onDanger` | #e0245e / #fff | #ff5a7a / #fff | 삭제/에러 |
| `placeholder` | #999 | #777 | 입력 플레이스홀더 |

### spacing (이름 스케일 — 컴포넌트 props `p="md"`용)
`xs:4, sm:8, md:16, lg:24, xl:32` (기존 `space(n)=n*8`은 유지, 이름 토큰 병행)

### typography variants
| variant | size | weight | lineHeight | 기본 color |
| --- | --- | --- | --- | --- |
| `h1` | 28 | 800 | 34 | text |
| `h2` | 22 | 700 | 28 | text |
| `title` | 20 | 700 | 26 | text |
| `body` | 16 | 400 | 24 | text |
| `bodyStrong` | 16 | 600 | 24 | text |
| `caption` | 13 | 400 | 18 | textMuted |
| `label` | 13 | 600 | 18 | textMuted |

### radius
`sm:8, md:12, lg:16, pill:999` (pill 추가 — 칩/FAB)

---

## 2. 컴포넌트 카탈로그 (우선순위순)

우선순위 = 이 앱 화면에서의 중복도. **P0 = 즉시, P1 = 화면 이전과 함께, P2 = 필요 시.**

### P0 — 뼈대 (모든 화면 의존)

#### `Box` — 레이아웃 프리미티브
- **대체** — 전 화면의 `<View style={StyleSheet flex/padding/...}>`
- **props** — `p/px/py/pt/pr/pb/pl`(spacing 토큰), `m/mx/...`, `row`(bool), `align`(flex-start|center|...), `justify`, `gap`(토큰), `bg`(color 토큰), `radius`(토큰), `border`(bool|color), `flex`. 나머지는 `style` 패스스루.
- **비고** — margin은 받되 공통 컴포넌트끼리는 부모 Box가 줌.

#### `Typography` (=`Text`)
- **대체** — 전 화면 `<Text>` (제목/본문/캡션/라벨/섹션)
- **props** — `variant`(h1/h2/title/body/bodyStrong/caption/label), `color`(토큰), `numberOfLines`, `align`. fontFamily는 전역 패치가 처리.
- **비고** — 글자 크기 설정(`fontScale`)은 본문 한정 → `body` variant에 scale 연동 옵션.

#### `Button`
- **대체** — 설정 `button`(outline), `bioButton`(solid), 저장/삭제 텍스트버튼, segment 등
- **props** — `variant`(solid|outline|text), `size`(sm|md|lg), `loading`(인디케이터+터치차단), `disabled`, `leftIcon`/`rightIcon`(Ionicon명), `onPress`, `children`. **forwardRef.**
- **state** — loading 시 `ActivityIndicator` + `disabled`. disabled 색 토큰.

#### `Icon`
- **대체** — 산재한 `<Ionicons .../>`
- **props** — `name`(Ionicon), `size`(number|토큰), `color`(토큰, 기본 text). 테마 색 연동.

### P1 — 이 앱 핵심 (화면 이전과 함께)

#### `SegmentedControl` ⭐ (이 앱 최다 중복)
- **대체** — 설정의 테마/언어/글꼴/크기/자동잠금/리마인더 + 글꼴 미리보기까지 **6+곳 동일 패턴**
- **props** — `options`({key,label}[]), `value`, `onChange`, `renderLabel?`(글꼴 미리보기용). 가로 분할 칩.

#### `Card`
- **대체** — 통계 `streakCard`, 설정 `preview`
- **props** — `padding`(기본 md), `bg`(기본 surfaceAlt), children. radius/border 내장.

#### `Chip`
- **대체** — 태그(피드 rowTags/작성 chips), 감정 선택 칩
- **props** — `label`, `selected`, `onPress`, `onRemove?`(X 버튼). pill radius.

#### `ListRow` (+ `Pressable`)
- **대체** — 피드 항목 `row`(emoji+title+preview+date), 설정 행
- **props** — `left`/`title`/`subtitle`/`right`, `onPress`. 내부에 일관 `Pressable`(opacity/ripple).

#### `Header` (= 기존 `ScreenHeader` 승격)
- **현황** — 이미 존재(Safe Area + showBack + right). 토큰화만 추가(색 하드코딩 → 토큰).
- **props** — `title`, `showBack`, `right`. (유지 + 테마 적용)

#### `Input` (=`TextField`)
- **대체** — 피드 검색바, 작성 제목/태그 입력, PIN 입력
- **props** — `value/onChangeText`, `leftIcon`/`rightIcon`, `clearable`(X 버튼), `secureToggle`(눈 아이콘), `error`(라벨), `placeholder`. **forwardRef.**
- **state** — focus 시 테두리 강조(primary).

#### `Spinner`
- **대체** — `_layout`/`LockGate`의 `ActivityIndicator` 게이트
- **props** — `size`, 전체화면 `fullscreen`(중앙+surface 배경).

### P2 — 필요 시 (현재 미사용/Alert로 대체 중)

#### `Switch`
- **대체** — 설정 생체인증 토글(현재 Pressable 버튼). RN `Switch` 래퍼 + 테마 색.

#### `Modal` / `BottomSheet`
- **현황** — 현재 삭제확인·에러는 RN `Alert`로 충분. **즉시 불필요.**
- **트리거 시** — 옵션시트/필터 등 새 기능 생기면 도입. 직접 만들지 말고 **`@gorhom/bottom-sheet`** 가져와 Unistyles 스킨만. (레퍼런스 권고)

#### `Toast`
- **현황** — 현재 `Alert`로 "가져왔습니다" 등 처리. **보류.** 필요 시 가벼운 전역 토스트 1개.

#### `Checkbox` / `Radio`
- **현황** — 약관/다중선택 화면 없음. **불필요.** SegmentedControl이 라디오 역할 대신함.

---

## 3. 빌드 순서

```
Phase A — 토큰 확장(unistyles.ts) → verify: tsc + 기존 화면 무회귀
Phase B — P0(Box/Typography/Button/Icon) → verify: 한 화면(통계) 이걸로 재작성, 다크모드 육안
Phase C — P1(SegmentedControl/Card/Chip/ListRow/Input/Header토큰화/Spinner)
          → verify: 설정·피드·작성 재작성, 다크모드 전 화면 일관
Phase D — 나머지 화면 일괄 이전 + Alert 유지(P2는 보류)
```

각 컴포넌트: `src/components/ui/<Name>.tsx`, 첫 줄 한글 헤더 주석, Unistyles `StyleSheet.create((theme)=>)` + `variants`.

## 4. 비채택 / 보류 (과잉 추상화 방지)

- **Radio/Checkbox** — 쓸 화면 없음.
- **Modal/BottomSheet/Toast** — Alert로 충분. 새 기능 트리거 시에만.
- **lucide 등 아이콘 추가** — Ionicons로 단일화 유지.
- **Box에 margin 고정** — 금지. 여백은 부모가.

## 5. 현재 코드 → 컴포넌트 매핑 요약

| 현재 | → 공통 |
| --- | --- |
| 설정 segment ×6 | `SegmentedControl` |
| 통계 streakCard / 설정 preview | `Card` |
| 태그/감정 칩 | `Chip` |
| 피드 row | `ListRow` |
| 검색/제목/태그/PIN 입력 | `Input` |
| 저장/삭제/생체/설정 버튼 | `Button` |
| 전 화면 View/Text | `Box`/`Typography` |
| ScreenHeader | `Header`(토큰화) |
| ActivityIndicator 게이트 | `Spinner` |
