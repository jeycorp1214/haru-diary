// 현재 위치 + 날씨를 묶어 일기 자동 태그 데이터로 반환 (expo-location + OpenWeatherMap)
// 위치 좌표(PII)는 암호화 MMKV(secure)에만 캐시. 권한 거부 시 마지막 캐시로 폴백.
import * as Location from 'expo-location';

import { getSecureStorage } from '@/lib/storage/secureMmkv';
import { fetchWeather } from './openWeather';

export type AutoTag = {
  lat: number;
  lng: number;
  locationName: string | null;
  weather: string | null;
  tempC: number | null;
};

const LAST_AUTOTAG_KEY = 'last_autotag';

// 암호 store 잠금 시(미설정/잠금) null — 캐시 미사용.
function readCachedAutoTag(): AutoTag | null {
  const json = getSecureStorage()?.getString(LAST_AUTOTAG_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as AutoTag;
  } catch {
    return null;
  }
}

function cacheAutoTag(tag: AutoTag) {
  getSecureStorage()?.set(LAST_AUTOTAG_KEY, JSON.stringify(tag));
}

export async function getAutoTag(): Promise<AutoTag | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return readCachedAutoTag();

  const pos = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = pos.coords;

  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  const locationName = place ? (place.city ?? place.region ?? place.district) : null;

  const w = await fetchWeather(latitude, longitude);

  const tag: AutoTag = {
    lat: latitude,
    lng: longitude,
    locationName,
    weather: w?.weather ?? null,
    tempC: w?.tempC ?? null,
  };
  cacheAutoTag(tag);
  return tag;
}
