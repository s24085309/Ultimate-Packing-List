import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Plus, Trash2, BatteryCharging, Battery, Star, Download, Library, Cable,
  ChevronDown, PlaneTakeoff, Luggage, Pencil, X, Search, CloudSun, Loader2, RefreshCw,
  Archive, Eye, EyeOff, RotateCcw, Settings, History, Lock, Unlock, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import PackingExportMenu from '../components/PackingExportMenu';
import SettingsModal from '../components/SettingsModal';
import AnimatedWeatherIcon from '../components/AnimatedWeatherIcon';
import DatePicker from '../components/DatePicker';
import GroupPicker from '../components/GroupPicker';
import { buildExportModel, DEFAULT_EXPORT_OPTIONS, statusLine, formatDateRange, tripDays, effectiveQty, departureCountdown, sortGroupsCanonical, sortMasterItems, type ViewFilter } from '../lib/packingExport';
import { searchCities, fetchForecast, FORECAST_HORIZON_DAYS, type CityResult, type ForecastDay } from '../lib/weatherApi';
import { APP_VERSION } from '../lib/versionHistory';
import { TRIP_TYPES, type Trip, type PackingItem, type WeatherDay, type TripCity } from '../types';
import s from '../widgets/shared.module.css';

const GIFTS_GROUP = '🎁 Gifts';
const TECH_GROUP = '🧑‍💻 Technology';
const EMPTY_GROUP_ORDER: string[] = [];

const GROUP_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf', '#facc15'];
function groupColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

function GroupHeader({ group, count, packed, collapsed, onToggle, onRename, extra }: {
  group: string; count: number; packed?: number; collapsed: boolean; onToggle: () => void;
  onRename?: (newName: string) => void; extra?: ReactNode;
}) {
  const color = groupColor(group);
  const remaining = packed != null ? count - packed : 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group);

  const startEditing = () => { setDraft(group); setEditing(true); };
  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== group) onRename?.(trimmed);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          autoFocus
          className={s.input}
          style={{ flex: 1, height: 34, fontSize: 13 }}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }}
          onBlur={commit}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1,
          background: 'none', border: 'none', padding: '4px 0', textAlign: 'left', cursor: 'pointer',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px 1px ${color}88`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {group}{' '}
          <span style={{ opacity: 0.65, fontWeight: 600 }}>
            {packed != null ? `(${packed} / ${count})` : `(${count})`}
          </span>
          {packed != null && (
            <span style={{ opacity: 0.65, fontWeight: 600 }}>
              {' '}— {remaining > 0 ? `${remaining} item${remaining === 1 ? '' : 's'} left to pack` : 'all packed!'}
            </span>
          )}
        </span>
        <ChevronDown size={16} color="var(--text-lo)" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform var(--transition-fast)', flexShrink: 0 }} />
      </button>
      {onRename && (
        <button
          onClick={startEditing} title="Rename this group"
          style={{ background: 'none', border: 'none', color: 'var(--text-lo)', padding: 4, flexShrink: 0 }}
        >
          <Pencil size={14} />
        </button>
      )}
      {extra && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{extra}</span>}
    </div>
  );
}

// A "tracker" group: not a real packing group, but an auto-populated list
// of items flagged for charging or a cable. Its own tick-off state
// (charged / cablePacked) is completely independent of `packed` in the
// item's real group — checking one never affects the other.
function TrackerGroupSection({ title, items, checkedField, onToggle }: {
  title: string; items: PackingItem[]; checkedField: 'charged' | 'cablePacked'; onToggle: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const color = groupColor(title);
  const checkedCount = items.filter(i => i[checkedField]).length;

  return (
    <div className="packingGroupCard">
      <GroupHeader
        group={title} count={items.length} packed={checkedCount}
        collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}
      />
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {items.map(i => (
            <div
              key={i.id} className={s.touchRow}
              style={{ background: `${color}22`, border: `1px solid ${color}`, boxShadow: `0 0 8px 0 ${color}66` }}
            >
              <button className={`${s.checkCircle} ${i[checkedField] ? s.done : ''}`} onClick={() => onToggle(i.id)}>
                {i[checkedField] && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-lo)' }}>{i.group}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const FILTERS: { id: ViewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'notPacked', label: 'Not Packed' },
  { id: 'packLater', label: 'Pack Later' },
  { id: 'charging', label: 'Charging' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'favourites', label: '⭐ Favourites' },
];

const EMPTY_TRIP_DRAFT = {
  name: '', destinations: '', departureDate: '', departureTime: '', returnDate: '', accommodation: '',
  tripType: 'City' as Trip['tripType'], weatherLow: undefined as number | undefined, weatherHigh: undefined as number | undefined,
  weatherConditions: '', weatherNotes: '', notes: '', weatherDaily: [] as WeatherDay[], cities: [] as TripCity[],
};

const EMPTY_WEATHER_DAY: WeatherDay = { day: '', high: undefined, low: undefined, conditions: '' };

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (d <= endD) {
    // Local-date formatting, not toISOString() — that converts to UTC and
    // rolls the date back a day in any timezone ahead of UTC (e.g. UTC+2).
    dates.push(toLocalIso(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function assignCitiesToDates(dates: string[], cities: TripCity[]): TripCity[] {
  if (cities.length === 0) return [];
  const perCity = Math.ceil(dates.length / cities.length);
  return dates.map((_, i) => cities[Math.min(cities.length - 1, Math.floor(i / perCity))]);
}

function isPastTrip(trip: Trip): boolean {
  const ref = trip.returnDate || trip.departureDate;
  if (!ref) return false;
  const end = new Date(ref + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return end < today;
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.getDate()}`;
}

function WeatherDayRow({ day, cities, onChange, onRemove, onRefetch }: {
  day: WeatherDay; cities: TripCity[]; onChange: (d: WeatherDay) => void; onRemove: () => void; onRefetch?: (cityName: string) => void;
}) {
  const [refetching, setRefetching] = useState(false);
  const doRefetch = async (cityName: string) => {
    if (!onRefetch) return;
    setRefetching(true);
    await onRefetch(cityName);
    setRefetching(false);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
      <input className={s.input} style={{ height: 40, flex: '1 1 84px', minWidth: 70, padding: '0 10px', fontSize: 13 }} placeholder="Day (e.g. Thu)" value={day.day} onChange={e => onChange({ ...day, day: e.target.value })} />
      <input type="number" className={s.input} style={{ height: 40, flex: '1 1 56px', minWidth: 50, padding: '0 8px', fontSize: 13 }} placeholder="High°" value={day.high ?? ''} onChange={e => onChange({ ...day, high: e.target.value ? Number(e.target.value) : undefined })} />
      <input type="number" className={s.input} style={{ height: 40, flex: '1 1 56px', minWidth: 50, padding: '0 8px', fontSize: 13 }} placeholder="Low°" value={day.low ?? ''} onChange={e => onChange({ ...day, low: e.target.value ? Number(e.target.value) : undefined })} />
      <input className={s.input} style={{ height: 40, flex: '2 1 130px', minWidth: 100, padding: '0 10px', fontSize: 13 }} placeholder="Conditions (e.g. Sunny)" value={day.conditions ?? ''} onChange={e => onChange({ ...day, conditions: e.target.value })} />
      {cities.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: '1 1 110px', minWidth: 90 }}>
          <select
            className={s.input}
            style={{ height: 40, fontSize: 12.5, minWidth: 0, flex: 1 }}
            value={day.city ?? ''}
            onChange={e => { onChange({ ...day, city: e.target.value }); doRefetch(e.target.value); }}
          >
            <option value="">City…</option>
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          {day.date && (
            <button
              onClick={() => day.city && doRefetch(day.city)}
              disabled={!day.city || refetching}
              title="Refresh this day's forecast"
              style={{ background: 'none', border: 'none', color: 'var(--text-lo)', flexShrink: 0 }}
            >
              {refetching ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
            </button>
          )}
        </div>
      )}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-lo)', width: 28, flexShrink: 0 }}><Trash2 size={15} /></button>
    </div>
  );
}

function TripForm({ trip, onSave, onCancel }: { trip?: Trip; onSave: (t: typeof EMPTY_TRIP_DRAFT, includeGroups?: string[]) => void; onCancel: () => void }) {
  const masterItems = useStore(st => st.masterPackingItems);
  const availableGroups = useMemo(
    () => Array.from(new Set(masterItems.filter(m => !m.archived && !m.ignored).map(m => m.group || 'Other'))).sort(),
    [masterItems],
  );
  // New trips only: which Master Library groups to seed this trip with —
  // e.g. skip "Ski Gear" for a beach trip. Defaults to everything, since
  // that's the previous (and still most common) behaviour.
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(() => new Set(availableGroups));
  const toggleGroup = (g: string) => setSelectedGroups(prev => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g); else next.add(g);
    return next;
  });

  const [draft, setDraft] = useState(trip ? {
    name: trip.name, destinations: trip.destinations, departureDate: trip.departureDate, departureTime: trip.departureTime ?? '', returnDate: trip.returnDate,
    accommodation: trip.accommodation, tripType: trip.tripType, weatherLow: trip.weatherLow, weatherHigh: trip.weatherHigh,
    weatherConditions: trip.weatherConditions ?? '', weatherNotes: trip.weatherNotes ?? '', notes: trip.notes ?? '',
    weatherDaily: trip.weatherDaily ?? [], cities: trip.cities ?? [],
  } : EMPTY_TRIP_DRAFT);

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const set = <K extends keyof typeof draft>(k: K, v: typeof draft[K]) => setDraft(d => ({ ...d, [k]: v }));

  const setDay = (i: number, day: WeatherDay) => set('weatherDaily', draft.weatherDaily.map((d, idx) => idx === i ? day : d));
  const addDay = () => set('weatherDaily', [...draft.weatherDaily, { ...EMPTY_WEATHER_DAY }]);
  const removeDay = (i: number) => set('weatherDaily', draft.weatherDaily.filter((_, idx) => idx !== i));

  // Changing the trip dates can leave previously auto-fetched forecast rows
  // pointing at days outside (or no longer aligned with) the new range —
  // drop those so the list never silently shows stale, mismatched days.
  // Manually-added rows (no `date`) aren't tied to a calendar day, so they stay.
  const setDateField = (field: 'departureDate' | 'returnDate', value: string) => {
    setDraft(d => {
      const next = { ...d, [field]: value };
      if (!next.departureDate || !next.returnDate) return next;
      const validDates = new Set(dateRange(next.departureDate, next.returnDate));
      return { ...next, weatherDaily: next.weatherDaily.filter(day => !day.date || validDates.has(day.date)) };
    });
  };

  const [destInput, setDestInput] = useState('');
  const [destResults, setDestResults] = useState<CityResult[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const destinationList = useMemo(
    () => draft.destinations.split(',').map(d => d.trim()).filter(Boolean),
    [draft.destinations],
  );

  // Search-as-you-type: show real city matches to pick from instead of
  // silently guessing which "Paris" (etc.) the user meant.
  useEffect(() => {
    const q = destInput.trim();
    if (q.length < 2) { setDestResults([]); return; }
    let cancelled = false;
    setDestSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(q);
        if (!cancelled) setDestResults(results);
      } catch {
        if (!cancelled) setDestResults([]);
      } finally {
        if (!cancelled) setDestSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [destInput]);

  const addDestinationName = (name: string) => {
    if (!name.trim()) return;
    if (!destinationList.some(d => d.toLowerCase() === name.trim().toLowerCase())) {
      set('destinations', [...destinationList, name.trim()].join(', '));
    }
  };

  // Picking a search result: adds the exact matched place, and its
  // coordinates go straight into "Cities for live weather" too.
  const selectDestination = (c: CityResult) => {
    addDestinationName(c.name);
    addCity(c);
    setDestInput('');
    setDestResults([]);
  };

  // Typing a name and hitting +/Enter without picking a suggestion: add it
  // as free text, then best-effort search for a matching city in the background.
  const addDestination = async () => {
    const name = destInput.trim();
    if (!name) return;
    addDestinationName(name);
    setDestInput('');
    setDestResults([]);
    try {
      const results = await searchCities(name);
      if (results[0]) addCity(results[0]);
    } catch {
      // silent — the user can still add a city manually below
    }
  };
  const removeDestination = (idx: number) => {
    set('destinations', destinationList.filter((_, i) => i !== idx).join(', '));
  };

  const doSearchCitiesFor = async (query: string) => {
    if (!query.trim()) return;
    setCitySearching(true);
    setCityError(null);
    try {
      const results = await searchCities(query);
      setCityResults(results);
      if (results.length === 0) setCityError('No cities found.');
    } catch {
      setCityError('City search failed — check your connection.');
    } finally {
      setCitySearching(false);
    }
  };
  const doSearchCities = () => doSearchCitiesFor(cityQuery);

  const addCity = (c: CityResult) => {
    if (draft.cities.some(x => x.name === c.name && x.lat === c.lat)) return;
    set('cities', [...draft.cities, c]);
    setCityQuery('');
    setCityResults([]);
  };
  const removeCity = (idx: number) => set('cities', draft.cities.filter((_, i) => i !== idx));

  // Which destination each trip day falls under. Defaults to an even split
  // across the cities added above, but the user can override any day —
  // e.g. "days 1-2 in Lisbon, days 3-5 in Porto" instead of an even split.
  const [dayCityOverrides, setDayCityOverrides] = useState<Record<string, string>>({});
  const tripDates = useMemo(
    () => (draft.departureDate && draft.returnDate ? dateRange(draft.departureDate, draft.returnDate) : []),
    [draft.departureDate, draft.returnDate],
  );
  const defaultCityForDate = useMemo(() => {
    const assigned = assignCitiesToDates(tripDates, draft.cities);
    const map = new Map<string, string>();
    tripDates.forEach((date, i) => map.set(date, assigned[i]?.name));
    return map;
  }, [tripDates, draft.cities]);
  const cityNameForDate = (date: string) => dayCityOverrides[date] ?? defaultCityForDate.get(date) ?? draft.cities[0]?.name;

  const updateSummaryFromDaily = (daily: WeatherDay[], truncated: boolean) => {
    const highs = daily.map(d => d.high).filter((n): n is number => n != null);
    const lows = daily.map(d => d.low).filter((n): n is number => n != null);
    if (highs.length) set('weatherHigh', Math.max(...highs));
    if (lows.length) set('weatherLow', Math.min(...lows));
    const counts = new Map<string, number>();
    daily.forEach(d => { if (d.conditions) counts.set(d.conditions, (counts.get(d.conditions) ?? 0) + 1); });
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (top) set('weatherConditions', truncated ? `${top} (forecast covers the first part of the trip only)` : top);
  };

  const fetchLiveWeather = async () => {
    if (draft.cities.length === 0) {
      setWeatherError('Add at least one city above (search and tap it to add) before fetching live weather.');
      return;
    }
    if (!draft.departureDate || !draft.returnDate) {
      setWeatherError('Set both the departure and return dates above before fetching live weather.');
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const allDates = dateRange(draft.departureDate, draft.returnDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const horizonEnd = new Date(today); horizonEnd.setDate(horizonEnd.getDate() + FORECAST_HORIZON_DAYS);
      const availableDates = allDates.filter(d => {
        const dt = new Date(d + 'T00:00:00');
        return dt >= today && dt <= horizonEnd;
      });
      if (availableDates.length === 0) {
        setWeatherError(`Live forecasts only cover the next ${FORECAST_HORIZON_DAYS} days — this trip is further out. Check back closer to departure, or enter days manually below.`);
        return;
      }
      const cityForDate = availableDates.map(date => {
        const name = cityNameForDate(date);
        return draft.cities.find(c => c.name === name) ?? draft.cities[0];
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
        return { day: dayLabel(date), date, high: match?.high, low: match?.low, conditions: match?.conditions, city: city.name };
      });
      set('weatherDaily', newDaily);
      updateSummaryFromDaily(newDaily, availableDates.length < allDates.length);
    } catch (err) {
      setWeatherError((err as Error)?.message || 'Could not fetch weather.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Auto-fetch whenever the cities or dates change (e.g. right after adding a
  // destination), as long as there's enough to fetch with. Skips the very
  // first render so opening an existing trip doesn't immediately re-fetch.
  const skipAutoFetch = useRef(true);
  useEffect(() => {
    if (skipAutoFetch.current) { skipAutoFetch.current = false; return; }
    if (draft.cities.length > 0 && draft.departureDate && draft.returnDate) fetchLiveWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.cities, draft.departureDate, draft.returnDate]);

  const refetchDay = async (i: number, cityName: string) => {
    const city = draft.cities.find(c => c.name === cityName);
    const day = draft.weatherDaily[i];
    if (!city || !day?.date) return;
    try {
      const fc = await fetchForecast(city.lat, city.lon, day.date, day.date);
      const f = fc[0];
      setDay(i, { ...day, city: city.name, high: f?.high ?? day.high, low: f?.low ?? day.low, conditions: f?.conditions ?? day.conditions });
    } catch {
      // leave the existing values in place on a failed single-day refetch
    }
  };

  return (
    <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input className={s.input} placeholder="Trip name (e.g. Portugal Summer 2026)" value={draft.name} onChange={e => set('name', e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className={s.input} placeholder="Add a destination (e.g. Lisbon)…" value={destInput}
          onChange={e => setDestInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addDestination()}
        />
        <button className={s.btnGhost} onClick={addDestination} style={{ width: 48, padding: 0, flexShrink: 0 }}>
          {destSearching ? <Loader2 size={16} className="spin" /> : <Plus size={18} />}
        </button>
      </div>
      {destResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: -6 }}>
          {destResults.map((c, i) => (
            <button
              key={i} onClick={() => selectDestination(c)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                padding: '8px 12px', borderRadius: 10, border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-hi)', fontSize: 13,
              }}
            >
              <span>{c.name}{c.admin1 ? `, ${c.admin1}` : ''}{c.country ? `, ${c.country}` : ''}</span>
              <Plus size={14} />
            </button>
          ))}
        </div>
      )}
      {destinationList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {destinationList.map((d, i) => (
            <span key={i} className={s.pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => { setCityQuery(d); doSearchCitiesFor(d); }}
                title="Search this destination in Cities for live weather"
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', padding: 0 }}
              >{d}</button>
              <button onClick={() => removeDestination(i)} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex' }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 4 }}>DEPARTURE</div>
          <DatePicker value={draft.departureDate} onChange={v => setDateField('departureDate', v)} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 4 }}>RETURN</div>
          <DatePicker value={draft.returnDate} onChange={v => setDateField('returnDate', v)} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 4 }}>
          DEPARTURE TIME (optional — sets a "charge your devices" reminder 3 hours before)
        </div>
        <input type="time" className={s.input} value={draft.departureTime} onChange={e => set('departureTime', e.target.value)} />
      </div>
      <input className={s.input} placeholder="Accommodation" value={draft.accommodation} onChange={e => set('accommodation', e.target.value)} />
      <select className={s.input} value={draft.tripType} onChange={e => set('tripType', e.target.value as Trip['tripType'])}>
        {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', fontWeight: 700 }}>🌦️ WEATHER SUMMARY (for packing)</div>

        <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>CITIES FOR LIVE WEATHER</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className={s.input} placeholder="Search a city…" value={cityQuery}
            onChange={e => setCityQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearchCities()}
          />
          <button className={s.btnGhost} onClick={doSearchCities} disabled={citySearching} style={{ width: 48, padding: 0, flexShrink: 0 }}>
            {citySearching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          </button>
        </div>
        {cityError && <div style={{ fontSize: 12, color: '#fda4af' }}>{cityError}</div>}
        {cityResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cityResults.map((c, i) => (
              <button
                key={i} onClick={() => addCity(c)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                  padding: '8px 12px', borderRadius: 10, border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-hi)', fontSize: 13,
                }}
              >
                <span>{c.name}{c.admin1 ? `, ${c.admin1}` : ''}{c.country ? `, ${c.country}` : ''}</span>
                <Plus size={14} />
              </button>
            ))}
          </div>
        )}
        {draft.cities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {draft.cities.map((c, i) => (
              <span key={i} className={s.pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {c.name}
                <button onClick={() => removeCity(i)} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex' }}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {draft.cities.length > 1 && tripDates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>WHICH DESTINATION EACH DAY? (confirm or adjust)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tripDates.map(date => (
                <div key={date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{dayLabel(date)}</span>
                  <select
                    className={s.input} style={{ height: 34, fontSize: 12.5, width: 150, padding: '0 8px' }}
                    value={cityNameForDate(date)}
                    onChange={e => setDayCityOverrides(o => ({ ...o, [date]: e.target.value }))}
                  >
                    {draft.cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={s.btnGhost} onClick={fetchLiveWeather}
          disabled={weatherLoading || draft.cities.length === 0 || !draft.departureDate || !draft.returnDate}
          style={{ justifyContent: 'center' }}
        >
          {weatherLoading ? <Loader2 size={16} className="spin" /> : <CloudSun size={16} />}
          Fetch Live Weather for Trip Dates
        </button>
        {weatherError && <div style={{ fontSize: 12, color: '#fda4af' }}>{weatherError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 0 }}>
          <input type="number" className={s.input} style={{ minWidth: 0 }} placeholder="Low °" value={draft.weatherLow ?? ''} onChange={e => set('weatherLow', e.target.value ? Number(e.target.value) : undefined)} />
          <input type="number" className={s.input} style={{ minWidth: 0 }} placeholder="High °" value={draft.weatherHigh ?? ''} onChange={e => set('weatherHigh', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <input className={s.input} placeholder="Conditions (e.g. Sunny, occasional rain)" value={draft.weatherConditions} onChange={e => set('weatherConditions', e.target.value)} />
        <input className={s.input} placeholder="Weather notes for packing" value={draft.weatherNotes} onChange={e => set('weatherNotes', e.target.value)} />

        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 6 }}>DAILY FORECAST {draft.weatherDaily.length > 0 ? '' : '(optional)'}</div>
        {draft.weatherDaily.map((day, i) => (
          <WeatherDayRow key={i} day={day} cities={draft.cities} onChange={d => setDay(i, d)} onRemove={() => removeDay(i)} onRefetch={cityName => refetchDay(i, cityName)} />
        ))}
        <button className={s.btnGhost} onClick={addDay} style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 14px', fontSize: 13 }}>
          <Plus size={14} /> Add Day Manually
        </button>
      </div>
      <textarea className={s.input} style={{ minHeight: 60, paddingTop: 12, resize: 'vertical' }} placeholder="Trip notes" value={draft.notes} onChange={e => set('notes', e.target.value)} />

      {!trip && availableGroups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>
            PACKING GROUPS TO INCLUDE — untick anything you won't need for this trip
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={s.btnGhost} style={{ minHeight: 30, padding: '0 10px', fontSize: 12 }} onClick={() => setSelectedGroups(new Set(availableGroups))}>All</button>
            <button className={s.btnGhost} style={{ minHeight: 30, padding: '0 10px', fontSize: 12 }} onClick={() => setSelectedGroups(new Set())}>None</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableGroups.map(g => (
              <label
                key={g}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 10px', borderRadius: 8,
                  background: selectedGroups.has(g) ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  color: selectedGroups.has(g) ? 'var(--text-hi)' : 'var(--text-lo)', cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked={selectedGroups.has(g)} onChange={() => toggleGroup(g)} /> {g}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={s.row} style={{ justifyContent: 'flex-end' }}>
        <button className={s.btnGhost} onClick={onCancel}>Cancel</button>
        <button className={s.btnPrimary} disabled={!draft.name.trim()} onClick={() => onSave(draft, trip ? undefined : Array.from(selectedGroups))}>Save Trip</button>
      </div>
      <style>{`.spin { animation: tripFormSpin 0.8s linear infinite; } @keyframes tripFormSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ItemRow({ item, groups, days }: { item: PackingItem; groups: string[]; days: number }) {
  const togglePacked = useStore(st => st.togglePackingItemPacked);
  const togglePackLater = useStore(st => st.togglePackingItemPackLater);
  const toggleRequiresCharging = useStore(st => st.togglePackingItemRequiresCharging);
  const toggleNeedsCable = useStore(st => st.togglePackingItemNeedsCable);
  const toggleFav = useStore(st => st.togglePackingItemFavourite);
  const removeItem = useStore(st => st.removePackingItem);
  const updateItem = useStore(st => st.updatePackingItem);
  const syncMasterItem = useStore(st => st.syncMasterItem);
  const archiveMasterItemByName = useStore(st => st.archiveMasterItemByName);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [group, setGroup] = useState(item.group);
  const [qty, setQty] = useState(item.qty);
  const [qtyPerDay, setQtyPerDay] = useState(item.qtyPerDay ?? 0);
  const [notes, setNotes] = useState(item.notes ?? '');

  const startEdit = () => {
    setName(item.name); setGroup(item.group); setQty(item.qty); setQtyPerDay(item.qtyPerDay ?? 0); setNotes(item.notes ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!name.trim()) return;
    const finalGroup = group.trim() || 'Other';
    const finalName = name.trim();
    const finalQty = Math.max(1, qty);
    const finalQtyPerDay = qtyPerDay > 0 ? qtyPerDay : undefined;
    const finalNotes = notes.trim() || undefined;
    updateItem(item.id, { name: finalName, group: finalGroup, qty: finalQty, qtyPerDay: finalQtyPerDay, notes: finalNotes });
    // Keep the Master Library entry for this item in sync with the edit.
    syncMasterItem(item.name, { name: finalName, group: finalGroup, qty: finalQty, qtyPerDay: finalQtyPerDay, notes: finalNotes });
    setEditing(false);
  };

  const deleteItem = () => {
    removeItem(item.id);
    // Archive (not delete) the matching Master Library entry, so it's
    // recoverable from Archive rather than silently gone.
    archiveMasterItemByName(item.name);
  };

  if (editing) {
    return (
      <div className={s.touchRow} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
        <input className={s.input} style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} autoFocus />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, width: '100%' }}>
          <GroupPicker value={group} groups={groups.includes(group) ? groups : [...groups, group].filter(Boolean)} onChange={setGroup} />
          <input type="number" min={1} className={s.input} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} disabled={qtyPerDay > 0} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-lo)', width: '100%' }}>
          Or per day (× {days} day{days === 1 ? '' : 's'} = {qtyPerDay > 0 ? qtyPerDay * days : '—'}):
          <input
            type="number" min={0} className={s.input} style={{ width: 70, height: 32 }}
            value={qtyPerDay || ''} placeholder="0" onChange={e => setQtyPerDay(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <input className={s.input} style={{ width: '100%' }} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className={s.row}>
          <button className={s.btnPrimary} onClick={saveEdit}>Save</button>
          <button className={s.btnGhost} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const displayQty = effectiveQty(item, days);
  const color = groupColor(item.group);
  return (
    <div
      className={s.touchRow}
      style={{ alignItems: 'flex-start', background: `${color}22`, border: `1px solid ${color}`, boxShadow: `0 0 8px 0 ${color}66` }}
    >
      <button className={`${s.checkCircle} ${item.packed ? s.done : ''}`} onClick={() => togglePacked(item.id)}>
        {item.packed && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={item.packed ? s.strike : ''} style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {item.name}{displayQty > 1 ? ` × ${displayQty}` : ''}
          {item.qtyPerDay ? <span style={{ opacity: 0.65, fontWeight: 600 }}> ({item.qtyPerDay}/day)</span> : null}
          {item.isGift && item.group !== GIFTS_GROUP && <span className={s.pill} style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>🎁 {item.giftFor || 'gift'}</span>}
          {item.packLater && <span className={s.pill}>⏰ later</span>}
        </div>
        {item.notes && <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>{item.notes}</div>}
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {item.group === TECH_GROUP && (
          <button
            onClick={() => toggleRequiresCharging(item.id)}
            title={item.requiresCharging ? '🔋 In the charge tracker — tap to remove' : '🔋 Charge Me'}
            style={{ background: 'none', border: 'none', color: item.requiresCharging ? '#22d3ee' : 'var(--text-lo)' }}
          >
            {item.requiresCharging ? <BatteryCharging size={18} /> : <Battery size={18} />}
          </button>
        )}
        {item.group === TECH_GROUP && (
          <button
            onClick={() => toggleNeedsCable(item.id)}
            title={item.needsCable ? '🔌 In the cable tracker — tap to remove' : 'Remember a cable for this'}
            style={{ background: 'none', border: 'none', color: item.needsCable ? '#22d3ee' : 'var(--text-lo)', display: 'flex', alignItems: 'center' }}
          >
            {item.needsCable ? <span style={{ fontSize: 16 }}>🔌</span> : <Cable size={18} />}
          </button>
        )}
        <button onClick={() => toggleFav(item.id)} style={{ background: 'none', border: 'none', color: item.favourite ? '#fbbf24' : 'var(--text-lo)' }}>
          <Star size={18} fill={item.favourite ? '#fbbf24' : 'none'} />
        </button>
        <button onClick={() => togglePackLater(item.id)} title="Pack later" style={{ background: 'none', border: 'none', color: item.packLater ? '#a855f7' : 'var(--text-lo)' }}>⏰</button>
        <button onClick={startEdit} title="Edit item" style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Pencil size={15} /></button>
        <button onClick={deleteItem} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function AddItemForm({ tripId, groups, days }: { tripId: string; groups: string[]; days: number }) {
  const addItem = useStore(st => st.addPackingItem);
  const ensureMasterItem = useStore(st => st.ensureMasterItem);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [qty, setQty] = useState(1);
  const [qtyPerDay, setQtyPerDay] = useState(0);
  const [notes, setNotes] = useState('');
  const [charging, setCharging] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftFor, setGiftFor] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    const finalGroup = group.trim() || 'Other';
    const trimmedName = name.trim();
    const finalQty = Math.max(1, qty);
    const finalQtyPerDay = qtyPerDay > 0 ? qtyPerDay : undefined;
    const finalNotes = notes.trim() || undefined;
    const finalGiftFor = isGift ? giftFor.trim() || undefined : undefined;
    addItem(tripId, {
      name: trimmedName, group: finalGroup, qty: finalQty, qtyPerDay: finalQtyPerDay, notes: finalNotes,
      packed: false, packLater: false, requiresCharging: charging, charged: false,
      needsCable: false, cablePacked: false, favourite: false,
      isGift, giftFor: finalGiftFor,
    });
    // Every item added anywhere also lives in the Master Library, so it's never re-typed from scratch.
    ensureMasterItem({
      name: trimmedName, group: finalGroup, qty: finalQty, qtyPerDay: finalQtyPerDay, notes: finalNotes,
      requiresCharging: charging, isGift, giftFor: finalGiftFor,
    });
    setName(''); setNotes(''); setQty(1); setQtyPerDay(0); setCharging(false); setIsGift(false); setGiftFor('');
  };

  return (
    <div className="glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className={s.input} placeholder="Add an item…" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        <button className={s.btnPrimary} onClick={submit} style={{ width: 52, padding: 0, flexShrink: 0 }}><Plus size={20} /></button>
        <button className={s.btnGhost} onClick={() => setOpen(o => !o)} style={{ width: 44, padding: 0, flexShrink: 0 }}>
          <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      {open && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <GroupPicker value={group} groups={groups} onChange={setGroup} />
            <input type="number" min={1} className={s.input} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} disabled={qtyPerDay > 0} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-lo)' }}>
            Or per day (× {days} day{days === 1 ? '' : 's'} = {qtyPerDay > 0 ? qtyPerDay * days : '—'}):
            <input
              type="number" min={0} className={s.input} style={{ width: 70, height: 32 }}
              value={qtyPerDay || ''} placeholder="0" onChange={e => setQtyPerDay(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <input className={s.input} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className={s.row} style={{ flexWrap: 'wrap', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-lo)' }}>
              <input type="checkbox" checked={charging} onChange={e => setCharging(e.target.checked)} /> 🔋 Charge Me
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-lo)' }}>
              <input type="checkbox" checked={isGift} onChange={e => {
                setIsGift(e.target.checked);
                if (e.target.checked && !group.trim()) setGroup(GIFTS_GROUP);
              }} /> 🎁 Gift for a friend
            </label>
            {isGift && (
              <input className={s.input} style={{ flex: 1, minWidth: 140 }} placeholder="Who's it for?" value={giftFor} onChange={e => setGiftFor(e.target.value)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MasterGroupSection({ group, items, locked, allGroups, onMoveUp, onMoveDown, collapsed, onToggleCollapsed }: {
  group: string; items: ReturnType<typeof useStore.getState>['masterPackingItems']; locked: boolean; allGroups: string[];
  onMoveUp?: () => void; onMoveDown?: () => void; collapsed: boolean; onToggleCollapsed: () => void;
}) {
  const addMasterItem = useStore(st => st.addMasterItem);
  const archiveMasterItem = useStore(st => st.archiveMasterItem);
  const archiveMasterGroup = useStore(st => st.archiveMasterGroup);
  const toggleMasterItemIgnored = useStore(st => st.toggleMasterItemIgnored);
  const addMasterItemToTrip = useStore(st => st.addMasterItemToTrip);
  const moveMasterItem = useStore(st => st.moveMasterItem);
  const updateMasterItem = useStore(st => st.updateMasterItem);
  const renameGroup = useStore(st => st.renameGroup);
  const activeTripId = useStore(st => st.activeTripId);
  const [quickName, setQuickName] = useState('');

  const quickAdd = () => {
    if (!quickName.trim()) return;
    addMasterItem({ name: quickName.trim(), group, qty: 1, requiresCharging: false, isGift: group === GIFTS_GROUP });
    setQuickName('');
  };

  return (
    <div>
      <GroupHeader
        group={group} count={items.length} collapsed={collapsed} onToggle={onToggleCollapsed}
        onRename={newName => renameGroup(group, newName)}
        extra={
          <>
          {!locked && (onMoveUp || onMoveDown) && (
            <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
              <button
                onClick={onMoveUp} disabled={!onMoveUp} title="Move group up"
                style={{ background: 'none', border: 'none', color: onMoveUp ? 'var(--text-lo)' : 'rgba(184,174,216,0.25)', padding: 2 }}
              ><ArrowUp size={14} /></button>
              <button
                onClick={onMoveDown} disabled={!onMoveDown} title="Move group down"
                style={{ background: 'none', border: 'none', color: onMoveDown ? 'var(--text-lo)' : 'rgba(184,174,216,0.25)', padding: 2 }}
              ><ArrowDown size={14} /></button>
            </div>
          )}
          <button
            onClick={() => { if (confirm(`Archive the whole "${group}" group (${items.length} item${items.length === 1 ? '' : 's'})? You can restore it from the Archive any time.`)) archiveMasterGroup(group); }}
            title="Archive this whole group"
            style={{ background: 'none', border: 'none', color: 'var(--text-lo)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
          >
            <Archive size={14} /> Archive group
          </button>
          </>
        }
      />
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {items.map((i, idx) => (
            <div key={i.id} className={s.touchRow} style={i.ignored ? { opacity: 0.55 } : undefined}>
              {!locked && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => moveMasterItem(i.id, 'up')} disabled={idx === 0} title="Move up"
                    style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(184,174,216,0.25)' : 'var(--text-lo)', padding: 2 }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveMasterItem(i.id, 'down')} disabled={idx === items.length - 1} title="Move down"
                    style={{ background: 'none', border: 'none', color: idx === items.length - 1 ? 'rgba(184,174,216,0.25)' : 'var(--text-lo)', padding: 2 }}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              )}
              <div style={{ flex: 1 }}>
                {i.name}{i.isGift && group !== GIFTS_GROUP && <span className={s.pill} style={{ marginLeft: 8 }}>🎁 {i.giftFor || 'gift'}</span>}
                {i.requiresCharging && <span className={s.pill} style={{ marginLeft: 8, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>🔋 charging</span>}
                {i.ignored && <span className={s.pill} style={{ marginLeft: 8 }}>🙈 ignored</span>}
              </div>
              {group === TECH_GROUP && (
                <button
                  onClick={() => updateMasterItem(i.id, { requiresCharging: !i.requiresCharging })}
                  title={i.requiresCharging ? '🔋 In the charge tracker — tap to remove' : '🔋 Charge Me'}
                  style={{ background: 'none', border: 'none', color: i.requiresCharging ? '#22d3ee' : 'var(--text-lo)' }}
                >
                  {i.requiresCharging ? <BatteryCharging size={16} /> : <Battery size={16} />}
                </button>
              )}
              <div style={{ maxWidth: 110 }}>
                <GroupPicker
                  value={group} groups={allGroups.includes(group) ? allGroups : [...allGroups, group].filter(Boolean)}
                  onChange={v => updateMasterItem(i.id, { group: v || 'Other' })}
                />
              </div>
              {activeTripId && (
                <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36 }} onClick={() => addMasterItemToTrip(i.id, activeTripId)}>
                  Add to trip
                </button>
              )}
              <button
                onClick={() => toggleMasterItemIgnored(i.id)}
                title={i.ignored ? 'Stop ignoring — include in new trips again' : "Ignore — keep in the library but skip when seeding new trips"}
                style={{ background: 'none', border: 'none', color: i.ignored ? '#facc15' : 'var(--text-lo)' }}
              >
                {i.ignored ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => archiveMasterItem(i.id)} title="Archive this item" style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Archive size={16} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className={s.input} style={{ height: 38, fontSize: 13 }} placeholder={`Quick add to ${group}…`}
              value={quickName} onChange={e => setQuickName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && quickAdd()}
            />
            <button className={s.btnGhost} onClick={quickAdd} style={{ width: 38, height: 38, padding: 0, flexShrink: 0 }}><Plus size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function MasterArchiveModal({ onClose }: { onClose: () => void }) {
  const masterItems = useStore(st => st.masterPackingItems);
  const restoreMasterItem = useStore(st => st.restoreMasterItem);
  const deleteMasterItemPermanently = useStore(st => st.deleteMasterItemPermanently);
  const archived = useMemo(() => masterItems.filter(m => m.archived), [masterItems]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof archived>();
    for (const m of archived) {
      const key = m.group || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return sortGroupsCanonical(Array.from(map.entries()).map(([group, items]) => ({ group, items: sortMasterItems(items) })))
      .map(({ group, items }) => [group, items] as const);
  }, [archived]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 550, background: 'rgba(5,3,10,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="glass" style={{ width: 'min(520px,100%)', maxHeight: '85vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>🗄️ Archive</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-lo)' }}>
          Archived items are kept here instead of being deleted. Restore one back into the library, or delete it permanently — that can't be undone.
        </p>
        {archived.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>Nothing archived.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(([g, items]) => (
            <div key={g}>
              <div style={{ fontSize: 12, fontWeight: 700, color: groupColor(g), marginBottom: 6 }}>{g} <span style={{ opacity: 0.65 }}>({items.length})</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(i => (
                  <div key={i.id} className={s.touchRow}>
                    <div style={{ flex: 1, opacity: 0.75 }}>{i.name}</div>
                    <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36 }} onClick={() => restoreMasterItem(i.id)}>
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button
                      onClick={() => { if (confirm(`Permanently delete "${i.name}"? This cannot be undone.`)) deleteMasterItemPermanently(i.id); }}
                      title="Delete permanently"
                      style={{ background: 'none', border: 'none', color: '#fda4af' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MasterLibraryModal({ onClose }: { onClose: () => void }) {
  const masterItems = useStore(st => st.masterPackingItems);
  const addMasterItem = useStore(st => st.addMasterItem);
  const locked = useStore(st => st.settings.masterListLocked ?? false);
  const groupOrder = useStore(st => st.settings.masterGroupOrder ?? EMPTY_GROUP_ORDER);
  const updateSettings = useStore(st => st.updateSettings);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftFor, setGiftFor] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chargingOpen, setChargingOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroupCollapsed = (g: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g); else next.add(g);
    return next;
  });

  const activeItems = useMemo(() => masterItems.filter(m => !m.archived), [masterItems]);
  const archivedCount = masterItems.length - activeItems.length;
  const chargingItems = useMemo(() => activeItems.filter(m => m.requiresCharging), [activeItems]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof activeItems>();
    for (const m of activeItems) {
      const key = m.group || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    const canonical = sortGroupsCanonical(Array.from(map.entries()).map(([group, items]) => ({ group, items: sortMasterItems(items) })));
    // Groups the user has manually reordered come first, in that order;
    // any group not yet in that list falls back to canonical order after them.
    const known = canonical.filter(({ group }) => groupOrder.includes(group))
      .sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));
    const rest = canonical.filter(({ group }) => !groupOrder.includes(group));
    return [...known, ...rest].map(({ group, items }) => [group, items] as const);
  }, [activeItems, groupOrder]);

  const moveGroup = (name: string, direction: 'up' | 'down') => {
    const names = groups.map(([g]) => g);
    const idx = names.indexOf(name);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= names.length) return;
    const reordered = [...names];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    updateSettings({ masterGroupOrder: reordered });
  };

  const submit = () => {
    if (!name.trim()) return;
    addMasterItem({ name: name.trim(), group: group.trim() || 'Other', qty: 1, requiresCharging: false, isGift, giftFor: isGift ? giftFor.trim() || undefined : undefined });
    setName(''); setIsGift(false); setGiftFor('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,3,10,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="glass" style={{ width: 'min(560px,100%)', maxHeight: '85vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>🗃️ Master Packing Library</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button className={s.btnPrimary} style={{ padding: '0 12px', minHeight: 36, fontSize: 12.5 }} onClick={() => setExportOpen(true)}>
              <Download size={14} /> Export
            </button>
            <button
              className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36, fontSize: 12.5 }}
              onClick={() => updateSettings({ masterListLocked: !locked })}
              title={locked ? 'Unlock to reorder items again' : 'Lock the current order — hides the reorder arrows'}
            >
              {locked ? <Lock size={14} /> : <Unlock size={14} />} {locked ? 'Locked' : 'Lock Order'}
            </button>
            <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36, fontSize: 12.5 }} onClick={() => setArchiveOpen(true)}>
              <Archive size={14} /> Archive{archivedCount > 0 ? ` (${archivedCount})` : ''}
            </button>
            {groups.length > 0 && (
              <button
                className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36, fontSize: 12.5 }}
                onClick={() => setCollapsedGroups(groups.every(([g]) => collapsedGroups.has(g)) ? new Set() : new Set(groups.map(([g]) => g)))}
              >
                {groups.every(([g]) => collapsedGroups.has(g)) ? <Eye size={14} /> : <EyeOff size={14} />}
                {groups.every(([g]) => collapsedGroups.has(g)) ? 'Expand All' : 'Collapse All'}
              </button>
            )}
            {chargingItems.length > 0 && (
              <button
                className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36, fontSize: 12.5, color: chargingOpen ? '#22d3ee' : undefined }}
                onClick={() => setChargingOpen(o => !o)}
              >
                <BatteryCharging size={14} /> Charging ({chargingItems.length})
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-lo)' }}>
          Nothing here is ever deleted outright — every item added to a trip is saved here too, and every trip you create is seeded from this list.
          Use ↑/↓ to reorder items within a group, then "Lock Order" to hide those controls and keep it from shifting by accident.
          Use 👁️ to ignore an item (it stays here but skips new trips) or 🗄️ to archive it — archived items move to the Archive, where you can restore them or delete them for good.
        </p>
        {chargingOpen && chargingItems.length > 0 && (
          <div className="glass" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee' }}>🔋 CHARGE THESE BEFORE YOU LEAVE</div>
            {chargingItems.map(i => (
              <div key={i.id} className={s.touchRow}>
                <BatteryCharging size={16} color="#22d3ee" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{i.name} <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>({i.group})</span></div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input className={s.input} placeholder="Item name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <div style={{ width: 140 }}>
            <GroupPicker value={group} groups={groups.map(([g]) => g)} onChange={setGroup} />
          </div>
          <button className={s.btnPrimary} onClick={submit} style={{ width: 48, padding: 0, flexShrink: 0 }}><Plus size={18} /></button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-lo)' }}>
          <input type="checkbox" checked={isGift} onChange={e => {
            setIsGift(e.target.checked);
            if (e.target.checked && !group.trim()) setGroup(GIFTS_GROUP);
          }} /> 🎁 Gift for a friend
          {isGift && <input className={s.input} style={{ flex: 1 }} placeholder="Who's it for?" value={giftFor} onChange={e => setGiftFor(e.target.value)} />}
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>Your master library is empty — add items above.</div>}
          {groups.map(([g, items], idx) => (
            <MasterGroupSection
              key={g} group={g} items={items} locked={locked} allGroups={groups.map(([gg]) => gg)}
              onMoveUp={idx > 0 ? () => moveGroup(g, 'up') : undefined}
              onMoveDown={idx < groups.length - 1 ? () => moveGroup(g, 'down') : undefined}
              collapsed={collapsedGroups.has(g)} onToggleCollapsed={() => toggleGroupCollapsed(g)}
            />
          ))}
        </div>
      </div>
      {archiveOpen && <MasterArchiveModal onClose={() => setArchiveOpen(false)} />}
      {exportOpen && (
        <PackingExportMenu
          trip={null} items={[]} tasks={[]} masterItems={masterItems} viewFilter="all"
          scope="master" onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

function PastTripsModal({ trips, onOpenTrip, onClose }: { trips: Trip[]; onOpenTrip: (id: string) => void; onClose: () => void }) {
  const removeTrip = useStore(st => st.removeTrip);
  const items = useStore(st => st.packingItems);

  const sorted = useMemo(() => [...trips].sort((a, b) => b.departureDate.localeCompare(a.departureDate)), [trips]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,3,10,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="glass" style={{ width: 'min(520px,100%)', maxHeight: '85vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>🕓 Past Trips</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-lo)' }}>
          Trips whose return date has passed. Nothing here is ever deleted automatically — open one to view or export its list, or remove it for good.
        </p>
        {sorted.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>No past trips yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(t => {
            const tripItems = items.filter(i => i.tripId === t.id);
            const packed = tripItems.filter(i => i.packed).length;
            return (
              <div key={t.id} className={s.touchRow} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>
                    {formatDateRange(t)} · {tripItems.length > 0 ? `${packed}/${tripItems.length} packed` : 'No items'}
                  </div>
                </div>
                <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36 }} onClick={() => onOpenTrip(t.id)}>View</button>
                <button
                  onClick={() => { if (confirm(`Delete "${t.name}" and its packing list? This can't be undone.`)) removeTrip(t.id); }}
                  title="Delete this trip"
                  style={{ background: 'none', border: 'none', color: '#fda4af' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PackingPage() {
  const trips = useStore(st => st.trips);
  const activeTripId = useStore(st => st.activeTripId);
  const setActiveTripId = useStore(st => st.setActiveTripId);
  const addTrip = useStore(st => st.addTrip);
  const updateTrip = useStore(st => st.updateTrip);
  const removeTrip = useStore(st => st.removeTrip);
  const items = useStore(st => st.packingItems);
  const tasks = useStore(st => st.departureTasks);
  const masterItems = useStore(st => st.masterPackingItems);
  const addDepartureTask = useStore(st => st.addDepartureTask);
  const toggleDepartureTask = useStore(st => st.toggleDepartureTask);
  const removeDepartureTask = useStore(st => st.removeDepartureTask);
  const renameGroup = useStore(st => st.renameGroup);
  const toggleCharged = useStore(st => st.togglePackingItemCharged);
  const toggleCablePacked = useStore(st => st.togglePackingItemCablePacked);

  const [creatingTrip, setCreatingTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pastTripsOpen, setPastTripsOpen] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroupCollapsed = (g: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g); else next.add(g);
    return next;
  });

  const trip = trips.find(t => t.id === activeTripId) ?? null;
  const tripItems = useMemo(() => items.filter(i => i.tripId === trip?.id), [items, trip]);
  const tripTasks = useMemo(() => tasks.filter(t => t.tripId === trip?.id), [tasks, trip]);
  const groups = useMemo(() => Array.from(new Set([...items.map(i => i.group), ...masterItems.map(i => i.group)])).sort(), [items, masterItems]);

  const model = trip ? buildExportModel(trip, items, tasks, DEFAULT_EXPORT_OPTIONS, filter) : null;
  const status = model ? statusLine(model) : null;

  // While packing, groups with the fewest items still to pack float to the
  // top so you can knock them out first; a fully-packed group (nothing left)
  // drops to the bottom, out of the way.
  const visibleGroups = useMemo(() => {
    const raw = model?.groups ?? [];
    const withRemaining = raw.map(g => ({ ...g, remaining: g.items.filter(i => !i.packed).length }));
    const incomplete = withRemaining.filter(g => g.remaining > 0).sort((a, b) => a.remaining - b.remaining);
    const complete = withRemaining.filter(g => g.remaining === 0);
    return [...incomplete, ...complete];
  }, [model]);
  // Two independent trackers, unaffected by view filter or by packed status
  // in the item's own group — ticking an item off here (charged / cable
  // packed) is entirely separate from ticking it off in its real group.
  const chargeTrackerItems = useMemo(() => tripItems.filter(i => i.requiresCharging), [tripItems]);
  const cableTrackerItems = useMemo(() => tripItems.filter(i => i.needsCable), [tripItems]);
  const upcomingTrips = useMemo(() => trips.filter(t => !isPastTrip(t)), [trips]);
  const pastTrips = useMemo(() => trips.filter(isPastTrip), [trips]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', padding: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, flex: '1 1 auto' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 4.4vw, 32px)', margin: 0,
              minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >🧽 Spongie's Ultimate Travel Packing List</h1>
          <span title={`App version ${APP_VERSION}`} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-lo)', opacity: 0.6, whiteSpace: 'nowrap', flexShrink: 0 }}>v{APP_VERSION}</span>
        </div>
        <div className={s.row} style={{ flexWrap: 'wrap', rowGap: 8, gap: 8 }}>
          {pastTrips.length > 0 && (
            <button className={s.btnGhost} onClick={() => setPastTripsOpen(true)} style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}>
              <History size={16} /> Past Trips ({pastTrips.length})
            </button>
          )}
          <button className={s.btnGhost} onClick={() => setMasterOpen(true)} style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}>
            <Library size={16} /> Library
          </button>
          <button className={s.btnPrimary} onClick={() => setExportOpen(true)} style={{ minHeight: 40, padding: '0 12px', fontSize: 13 }}>
            <Download size={16} /> Export
          </button>
          <button className={s.btnGhost} onClick={() => setSettingsOpen(true)} aria-label="Settings" style={{ width: 40, minHeight: 40, padding: 0, flexShrink: 0 }}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {trips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
          {upcomingTrips.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTripId(t.id)}
              className={s.pill}
              style={{
                flexShrink: 0, padding: '10px 16px', fontSize: 13.5,
                background: t.id === activeTripId ? 'var(--grad-a)' : 'rgba(255,255,255,0.06)',
                color: t.id === activeTripId ? 'white' : 'var(--text-hi)',
              }}
            >
              <PlaneTakeoff size={14} style={{ marginRight: 6 }} />{t.name}
            </button>
          ))}
          <button className={s.pill} onClick={() => setCreatingTrip(true)} style={{ flexShrink: 0, padding: '10px 16px' }}>
            <Plus size={14} style={{ marginRight: 4 }} />New Trip
          </button>
        </div>
      )}

      {creatingTrip && (
        <div style={{ marginBottom: 20 }}>
          <TripForm
            onSave={(draft, includeGroups) => { addTrip(draft, includeGroups); setCreatingTrip(false); }}
            onCancel={() => setCreatingTrip(false)}
          />
        </div>
      )}

      {trips.length === 0 && !creatingTrip && (
        <div className={s.emptyState} style={{ minHeight: 300 }}>
          <Luggage size={48} />
          <div style={{ fontSize: 17, fontWeight: 700 }}>No trips yet</div>
          <p style={{ maxWidth: 360, fontSize: 13.5 }}>Create your first trip to start building a smart packing list — then export it as a PDF, Word doc, or Excel sheet whenever you need it.</p>
          <button className={s.btnPrimary} onClick={() => setCreatingTrip(true)}><Plus size={18} /> Create a Trip</button>
        </div>
      )}

      {trip && !creatingTrip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {editingTrip ? (
            <TripForm
              trip={trip}
              onSave={(draft) => { updateTrip(trip.id, draft); setEditingTrip(false); }}
              onCancel={() => setEditingTrip(false)}
            />
          ) : (
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{trip.name}</div>
                    <span className={s.pill} style={{ background: 'rgba(168,85,247,0.18)', color: '#c4b5fd', fontWeight: 700 }}>
                      {departureCountdown(trip)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-lo)', marginTop: 4 }}>
                    {trip.destinations || '—'} · {formatDateRange(trip)} · {tripDays(trip)} day(s)
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-lo)', marginTop: 2 }}>{trip.accommodation} · {trip.tripType}</div>
                  {(trip.weatherConditions || trip.weatherLow != null) && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-lo)', marginTop: 4 }}>
                      🌦️ {trip.weatherLow != null ? `${trip.weatherLow}°–${trip.weatherHigh ?? '?'}° · ` : ''}{trip.weatherConditions}
                    </div>
                  )}
                  {trip.weatherDaily && trip.weatherDaily.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
                      {trip.weatherDaily.map((d, i) => (
                        <div key={i} style={{
                          flexShrink: 0, minWidth: 64, textAlign: 'center', padding: '8px 6px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-lo)' }}>{d.day || `Day ${i + 1}`}</div>
                          <div style={{ margin: '4px 0' }}><AnimatedWeatherIcon conditions={d.conditions} size={28} /></div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {d.high != null ? `${d.high}°` : '—'}
                            <span style={{ color: 'var(--text-lo)', fontWeight: 500 }}> {d.low != null ? `${d.low}°` : ''}</span>
                          </div>
                          {d.city && <div style={{ fontSize: 9, color: 'var(--accent-3)', marginTop: 2 }}>{d.city}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 40 }} onClick={() => setEditingTrip(true)}><Pencil size={15} /></button>
                  <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 40, color: '#fda4af' }} onClick={() => { if (confirm(`Delete "${trip.name}" and its packing list?`)) removeTrip(trip.id); }}><Trash2 size={15} /></button>
                </div>
              </div>

              {model && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                    <span>📊 Packing Progress</span>
                    <span>{model.packedItems}/{model.totalItems} ({model.progressPct}%)</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${model.progressPct}%`, background: 'var(--grad-a)', transition: 'width 300ms' }} />
                  </div>
                </div>
              )}

              {status && (
                <div style={{
                  marginTop: 14, textAlign: 'center', padding: '10px 14px', borderRadius: 12, fontWeight: 800, fontSize: 15,
                  background: model!.ready ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)', color: model!.ready ? '#4ade80' : '#fb923c',
                }}>
                  {status.emoji} {status.text}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={s.pill}
                style={{ flexShrink: 0, background: filter === f.id ? 'var(--grad-a)' : 'rgba(255,255,255,0.06)', color: filter === f.id ? 'white' : 'var(--text-hi)' }}
              >{f.label}</button>
            ))}
            {visibleGroups.length > 0 && (
              <button
                onClick={() => setCollapsedGroups(visibleGroups.every(g => collapsedGroups.has(g.group)) ? new Set() : new Set(visibleGroups.map(g => g.group)))}
                className={s.pill}
                style={{ flexShrink: 0, background: 'rgba(255,255,255,0.06)', color: 'var(--text-hi)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {visibleGroups.every(g => collapsedGroups.has(g.group)) ? <Eye size={13} /> : <EyeOff size={13} />}
                {visibleGroups.every(g => collapsedGroups.has(g.group)) ? 'Expand All' : 'Collapse All'}
              </button>
            )}
          </div>

          <AddItemForm tripId={trip.id} groups={groups} days={tripDays(trip)} />

          <div className="packingGroupsGrid">
            {visibleGroups.length === 0 && (
              <div className={s.emptyState} style={{ minHeight: 120 }}>
                <div style={{ fontSize: 13.5 }}>Nothing here yet.</div>
              </div>
            )}
            {visibleGroups.map(g => (
              <div key={g.group} className="packingGroupCard">
                <GroupHeader
                  group={g.group} count={g.items.length} packed={g.items.length - g.remaining}
                  collapsed={collapsedGroups.has(g.group)}
                  onToggle={() => toggleGroupCollapsed(g.group)}
                  onRename={newName => renameGroup(g.group, newName)}
                />
                {!collapsedGroups.has(g.group) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {g.items.map(item => <ItemRow key={item.id} item={item} groups={groups} days={tripDays(trip)} />)}
                  </div>
                )}
              </div>
            ))}
            {filter === 'all' && chargeTrackerItems.length > 0 && (
              <TrackerGroupSection
                title="⚡️Charge before you leave" items={chargeTrackerItems}
                checkedField="charged" onToggle={toggleCharged}
              />
            )}
            {filter === 'all' && cableTrackerItems.length > 0 && (
              <TrackerGroupSection
                title="🔌 Cables to Bring" items={cableTrackerItems}
                checkedField="cablePacked" onToggle={toggleCablePacked}
              />
            )}
          </div>

          {filter === 'all' && (
            <div className="glass" style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>✈️ Departure Tasks</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input className={s.input} placeholder="e.g. Print boarding passes" value={taskText}
                  onChange={e => setTaskText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && taskText.trim()) { addDepartureTask(trip.id, taskText.trim()); setTaskText(''); } }} />
                <button className={s.btnPrimary} style={{ width: 52, padding: 0, flexShrink: 0 }}
                  onClick={() => { if (taskText.trim()) { addDepartureTask(trip.id, taskText.trim()); setTaskText(''); } }}><Plus size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tripTasks.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>No departure tasks yet.</div>}
                {tripTasks.map(t => (
                  <div key={t.id} className={s.touchRow}>
                    <button className={`${s.checkCircle} ${t.done ? s.done : ''}`} onClick={() => toggleDepartureTask(t.id)}>
                      {t.done && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }} className={t.done ? s.strike : ''}>{t.text}</div>
                    <button onClick={() => removeDepartureTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {exportOpen && (
        <PackingExportMenu
          trip={trip}
          items={tripItems}
          tasks={tripTasks}
          masterItems={masterItems}
          viewFilter={filter}
          onClose={() => setExportOpen(false)}
        />
      )}

      {masterOpen && <MasterLibraryModal onClose={() => setMasterOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {pastTripsOpen && (
        <PastTripsModal
          trips={pastTrips}
          onOpenTrip={id => { setActiveTripId(id); setPastTripsOpen(false); }}
          onClose={() => setPastTripsOpen(false)}
        />
      )}
    </div>
  );
}
