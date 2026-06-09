// 감정 이모티콘 이미지 정적 require 맵 — DB엔 키(emoticon_N)만 저장, 렌더 시 source로 변환.
// RN은 동적 require 불가 → 36개 명시 매핑 필수. moods.emoji 컬럼에 이 키를 저장(장식용, score 미사용).
import type { ImageSourcePropType } from 'react-native';

export const EMOTICONS: Record<string, ImageSourcePropType> = {
  emoticon_1: require('../../assets/mods/emoticon_1.png'),
  emoticon_2: require('../../assets/mods/emoticon_2.png'),
  emoticon_3: require('../../assets/mods/emoticon_3.png'),
  emoticon_4: require('../../assets/mods/emoticon_4.png'),
  emoticon_5: require('../../assets/mods/emoticon_5.png'),
  emoticon_6: require('../../assets/mods/emoticon_6.png'),
  emoticon_7: require('../../assets/mods/emoticon_7.png'),
  emoticon_8: require('../../assets/mods/emoticon_8.png'),
  emoticon_9: require('../../assets/mods/emoticon_9.png'),
  emoticon_10: require('../../assets/mods/emoticon_10.png'),
  emoticon_11: require('../../assets/mods/emoticon_11.png'),
  emoticon_12: require('../../assets/mods/emoticon_12.png'),
  emoticon_13: require('../../assets/mods/emoticon_13.png'),
  emoticon_14: require('../../assets/mods/emoticon_14.png'),
  emoticon_15: require('../../assets/mods/emoticon_15.png'),
  emoticon_16: require('../../assets/mods/emoticon_16.png'),
  emoticon_17: require('../../assets/mods/emoticon_17.png'),
  emoticon_18: require('../../assets/mods/emoticon_18.png'),
  emoticon_19: require('../../assets/mods/emoticon_19.png'),
  emoticon_20: require('../../assets/mods/emoticon_20.png'),
  emoticon_21: require('../../assets/mods/emoticon_21.png'),
  emoticon_22: require('../../assets/mods/emoticon_22.png'),
  emoticon_23: require('../../assets/mods/emoticon_23.png'),
  emoticon_24: require('../../assets/mods/emoticon_24.png'),
  emoticon_25: require('../../assets/mods/emoticon_25.png'),
  emoticon_26: require('../../assets/mods/emoticon_26.png'),
  emoticon_27: require('../../assets/mods/emoticon_27.png'),
  emoticon_28: require('../../assets/mods/emoticon_28.png'),
  emoticon_29: require('../../assets/mods/emoticon_29.png'),
  emoticon_30: require('../../assets/mods/emoticon_30.png'),
  emoticon_31: require('../../assets/mods/emoticon_31.png'),
  emoticon_32: require('../../assets/mods/emoticon_32.png'),
  emoticon_33: require('../../assets/mods/emoticon_33.png'),
  emoticon_34: require('../../assets/mods/emoticon_34.png'),
  emoticon_35: require('../../assets/mods/emoticon_35.png'),
  emoticon_36: require('../../assets/mods/emoticon_36.png'),
};

// 선택 그리드 표시 순서 (emoticon_1 → emoticon_36)
export const EMOTICON_KEYS = Object.keys(EMOTICONS);

// DB의 mood.emoji(키) → 이미지 source. 없거나 옛 Unicode 이모지면 undefined.
export function emoticonSource(key?: string | null): ImageSourcePropType | undefined {
  return key && key in EMOTICONS ? EMOTICONS[key] : undefined;
}
