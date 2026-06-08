// 현재 위치 + 날씨를 묶어 일기 자동 태그 데이터로 반환 (expo-location + OpenWeatherMap)
import * as Location from 'expo-location';

import { fetchWeather } from './openWeather';

export type AutoTag = {
  lat: number;
  lng: number;
  locationName: string | null;
  weather: string | null;
  tempC: number | null;
};

export async function getAutoTag(): Promise<AutoTag | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const pos = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = pos.coords;

  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  const locationName = place ? (place.city ?? place.region ?? place.district) : null;

  const w = await fetchWeather(latitude, longitude);

  return {
    lat: latitude,
    lng: longitude,
    locationName,
    weather: w?.weather ?? null,
    tempC: w?.tempC ?? null,
  };
}
