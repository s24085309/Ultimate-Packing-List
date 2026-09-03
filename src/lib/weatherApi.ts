// Free, keyless weather lookup for trips: Open-Meteo geocoding + forecast.
// https://open-meteo.com/ — no API key required, CORS-enabled for browser use.

export interface CityResult {
  name: string;
  admin1?: string;
  country?: string;
  lat: number;
  lon: number;
}

export async function searchCities(query: string): Promise<CityResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City search failed');
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    name: r.name, admin1: r.admin1, country: r.country, lat: r.latitude, lon: r.longitude,
  }));
}

const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

export function conditionFromWmoCode(code: number): string {
  return WMO_CONDITIONS[code] ?? 'Unknown';
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD
  high: number;
  low: number;
  conditions: string;
}

// Open-Meteo's free forecast covers roughly the next 16 days from today.
export const FORECAST_HORIZON_DAYS = 16;

export async function fetchForecast(lat: number, lon: number, startDate: string, endDate: string): Promise<ForecastDay[]> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    daily: 'weathercode,temperature_2m_max,temperature_2m_min',
    timezone: 'auto', start_date: startDate, end_date: endDate,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather forecast unavailable for these dates');
  const data = await res.json();
  const time: string[] = data.daily?.time ?? [];
  const highs: number[] = data.daily?.temperature_2m_max ?? [];
  const lows: number[] = data.daily?.temperature_2m_min ?? [];
  const codes: number[] = data.daily?.weathercode ?? [];
  return time.map((date, i) => ({
    date,
    high: Math.round(highs[i]),
    low: Math.round(lows[i]),
    conditions: conditionFromWmoCode(codes[i]),
  }));
}
