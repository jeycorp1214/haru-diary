// 앱 전역 기본 글꼴 — Text/TextInput render를 가로채 base style에 fontFamily 주입.
// defaultProps.style은 컴포넌트가 style을 주면 덮여서 안 먹으므로 render 패치가 필요.
// base로 깔아서 명시적 fontFamily(아이콘 폰트 등)는 그대로 우선 적용됨.
import { cloneElement } from 'react';
import { Text, TextInput } from 'react-native';

let currentFamily: string | undefined;

// 현재 전역 글꼴 지정(undefined = 기기 기본). 변경 라이브 반영은 호출부에서 subtree remount로.
export function setGlobalFontFamily(family?: string) {
  currentFamily = family;
}

function patch(Comp: any) {
  if (!Comp || Comp.__fontPatched) return;
  const orig = Comp.render;
  if (typeof orig !== 'function') return;
  Comp.render = function (...args: any[]) {
    const el = orig.apply(this, args);
    if (!el) return el;
    return cloneElement(el, {
      style: [{ fontFamily: currentFamily }, el.props.style],
    });
  };
  Comp.__fontPatched = true;
}

patch(Text);
patch(TextInput);
