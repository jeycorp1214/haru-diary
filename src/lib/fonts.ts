// 한글 글꼴 옵션 + expo-font 로드 자산 맵 (설정 글자 스타일)
// regular/bold 둘 다 로드 — Android는 커스텀 fontFamily+fontWeight 조합 시 폰트를 무시하므로
// weight별 별도 패밀리(_700Bold)를 직접 지정해야 굵은 글씨에도 글꼴이 적용됨.
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { NanumGothic_400Regular, NanumGothic_700Bold } from '@expo-google-fonts/nanum-gothic';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';

export const FONT_ASSETS = {
  NanumGothic_400Regular,
  NanumGothic_700Bold,
  NanumMyeongjo_400Regular,
  NanumMyeongjo_700Bold,
  Gaegu_400Regular,
  Gaegu_700Bold,
};

export type FontKey = 'system' | 'gothic' | 'myeongjo' | 'handwriting';

// 설정 키 → regular 패밀리. system은 undefined(기기 기본 서체).
export const FONT_FAMILY: Record<FontKey, string | undefined> = {
  system: undefined,
  gothic: 'NanumGothic_400Regular',
  myeongjo: 'NanumMyeongjo_400Regular',
  handwriting: 'Gaegu_400Regular',
};

// 설정 키 → bold 패밀리.
export const FONT_FAMILY_BOLD: Record<FontKey, string | undefined> = {
  system: undefined,
  gothic: 'NanumGothic_700Bold',
  myeongjo: 'NanumMyeongjo_700Bold',
  handwriting: 'Gaegu_700Bold',
};

export const FONT_KEYS: FontKey[] = ['system', 'gothic', 'myeongjo', 'handwriting'];

// 글자 크기 배율 단계
export const FONT_SCALES = [0.85, 1, 1.15, 1.3];
