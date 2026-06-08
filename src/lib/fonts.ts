// 한글 글꼴 옵션 + expo-font 로드 자산 맵 (설정 글자 스타일)
import { Gaegu_400Regular } from '@expo-google-fonts/gaegu';
import { NanumGothic_400Regular } from '@expo-google-fonts/nanum-gothic';
import { NanumMyeongjo_400Regular } from '@expo-google-fonts/nanum-myeongjo';

// useFonts에 넘길 자산 맵. 키 = fontFamily로 쓰는 이름.
export const FONT_ASSETS = {
  NanumGothic_400Regular,
  NanumMyeongjo_400Regular,
  Gaegu_400Regular,
};

export type FontKey = 'system' | 'gothic' | 'myeongjo' | 'handwriting';

// 설정 키 → 실제 fontFamily. system은 undefined(기기 기본 서체).
export const FONT_FAMILY: Record<FontKey, string | undefined> = {
  system: undefined,
  gothic: 'NanumGothic_400Regular',
  myeongjo: 'NanumMyeongjo_400Regular',
  handwriting: 'Gaegu_400Regular',
};

export const FONT_KEYS: FontKey[] = ['system', 'gothic', 'myeongjo', 'handwriting'];

// 글자 크기 배율 단계
export const FONT_SCALES = [0.85, 1, 1.15, 1.3];
