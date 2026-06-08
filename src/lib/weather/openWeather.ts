// OpenWeatherMap 현재 날씨 조회. API 키는 EXPO_PUBLIC_OPENWEATHER_KEY 환경변수.
const KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ weather: string; tempC: number | null } | null> {
  if (!KEY) return null; // 키 미설정 시 날씨 생략(위치만 사용)
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return { weather: json.weather?.[0]?.main ?? '', tempC: json.main?.temp ?? null };
  } catch {
    return null;
  }
}
