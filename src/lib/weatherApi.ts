// Free, keyless weather lookup for trips: Open-Meteo geocoding + forecast.
// https://open-meteo.com/ — no API key required, CORS-enabled for browser use.

import type { Trip, TripCity, WeatherDay } from '../types';

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

function dateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (d <= endD) {
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function dayLabelFor(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.getDate()}`;
}

function assignCitiesEvenly(dates: string[], cities: TripCity[]): TripCity[] {
  if (cities.length === 0) return [];
  const perCity = Math.ceil(dates.length / cities.length);
  return dates.map((_, i) => cities[Math.min(cities.length - 1, Math.floor(i / perCity))]);
}

export interface TripWeatherUpdate {
  weatherDaily: WeatherDay[];
  weatherHigh?: number;
  weatherLow?: number;
  weatherConditions?: string;
}

// Re-fetches live weather for a trip's assigned cities/dates — the same
// lookup the Edit Trip form's refresh button does, just usable without
// opening it (e.g. on app launch). Honors any per-day city already recorded
// in weatherDaily (a manual override), otherwise splits days evenly across
// the trip's cities. Returns null if the trip has no cities/dates set, or
// if every day of the trip falls outside the forecast horizon.
export async function refreshTripWeather(trip: Trip): Promise<TripWeatherUpdate | null> {
  if (!trip.cities?.length || !trip.departureDate || !trip.returnDate) return null;
  const allDates = dateRangeInclusive(trip.departureDate, trip.returnDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizonEnd = new Date(today); horizonEnd.setDate(horizonEnd.getDate() + FORECAST_HORIZON_DAYS);
  const availableDates = allDates.filter(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt >= today && dt <= horizonEnd;
  });
  if (availableDates.length === 0) return null;

  const existingCityForDate = new Map(
    (trip.weatherDaily ?? []).filter(d => d.date && d.city).map(d => [d.date as string, d.city as string]),
  );
  const evenSplit = assignCitiesEvenly(availableDates, trip.cities);
  const cityForDate = availableDates.map((date, i) => {
    const name = existingCityForDate.get(date);
    return trip.cities!.find(c => c.name === name) ?? evenSplit[i];
  });

  const uniqueCities = Array.from(new Map(cityForDate.map(c => [c.name, c])).values());
  const forecastsByCity = new Map<string, ForecastDay[]>();
  await Promise.all(uniqueCities.map(async city => {
    const fc = await fetchForecast(city.lat, city.lon, availableDates[0], availableDates[availableDates.length - 1]);
    forecastsByCity.set(city.name, fc);
  }));

  const newDaily: WeatherDay[] = availableDates.map((date, i) => {
    const city = cityForDate[i];
    const match = forecastsByCity.get(city.name)?.find(f => f.date === date);
    return { day: dayLabelFor(date), date, high: match?.high, low: match?.low, conditions: match?.conditions, city: city.name };
  });

  const highs = newDaily.map(d => d.high).filter((n): n is number => n != null);
  const lows = newDaily.map(d => d.low).filter((n): n is number => n != null);
  const counts = new Map<string, number>();
  newDaily.forEach(d => { if (d.conditions) counts.set(d.conditions, (counts.get(d.conditions) ?? 0) + 1); });
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const truncated = availableDates.length < allDates.length;

  return {
    weatherDaily: newDaily,
    weatherHigh: highs.length ? Math.max(...highs) : undefined,
    weatherLow: lows.length ? Math.min(...lows) : undefined,
    weatherConditions: top ? (truncated ? `${top} (forecast covers the first part of the trip only)` : top) : undefined,
  };
}
