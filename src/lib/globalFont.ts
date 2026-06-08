// 앱 전역 기본 글꼴 — JSX 런타임(jsx/jsxs/jsxDEV)을 패치해 Text/TextInput/Animated.Text
// 엘리먼트 생성 시 base style에 fontFamily 주입. RN 0.85/React19의 Text는 plain 함수
// 컴포넌트라 .render 패치가 안 먹어 런타임 레벨에서 가로챔. 명시 fontFamily(아이콘 등)는 우선 유지.
// fontWeight가 bold면 bold 패밀리를 써야 Android에서 커스텀 글꼴이 적용됨.
import { Animated, StyleSheet, Text, TextInput } from 'react-native';

let regularFamily: string | undefined;
let boldFamily: string | undefined;

// 현재 전역 글꼴 지정(undefined = 기기 기본). 라이브 반영은 호출부 subtree remount로.
export function setGlobalFont(regular?: string, bold?: string) {
  regularFamily = regular;
  boldFamily = bold;
}

function isBold(weight: unknown): boolean {
  if (weight === 'bold') return true;
  const n = typeof weight === 'number' ? weight : parseInt(String(weight), 10);
  return !Number.isNaN(n) && n >= 600;
}

function inject(props: any) {
  if (!regularFamily) return props; // system(기본)이면 손대지 않음
  const flat = StyleSheet.flatten(props?.style) || {};
  const family = isBold((flat as any).fontWeight) ? boldFamily : regularFamily;
  return { ...props, style: [{ fontFamily: family }, props?.style] };
}

function patchRuntime(mod: any, names: string[]) {
  if (!mod) return;
  for (const name of names) {
    const orig = mod[name];
    if (typeof orig !== 'function' || orig.__fontPatched) continue;
    const wrapped = function (type: any, props: any, ...rest: any[]) {
      if (type === Text || type === TextInput || type === Animated.Text) {
        return orig(type, inject(props), ...rest);
      }
      return orig(type, props, ...rest);
    };
    (wrapped as any).__fontPatched = true;
    try {
      mod[name] = wrapped;
    } catch {
      /* 쓰기 불가 export면 패스 */
    }
  }
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  patchRuntime(require('react/jsx-runtime'), ['jsx', 'jsxs']);
} catch {
  /* noop */
}
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  patchRuntime(require('react/jsx-dev-runtime'), ['jsxDEV']);
} catch {
  /* noop */
}
