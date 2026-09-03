import { useMemo, useState } from 'react';
import {
  Plus, Trash2, BatteryCharging, Battery, Star, Download, Library,
  ChevronDown, PlaneTakeoff, Luggage, Pencil, X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import PackingExportMenu from '../components/PackingExportMenu';
import { buildExportModel, DEFAULT_EXPORT_OPTIONS, statusLine, formatDateRange, tripDays, departureCountdown, conditionEmoji, type ViewFilter } from '../lib/packingExport';
import { TRIP_TYPES, type Trip, type PackingItem, type WeatherDay } from '../types';
import s from '../widgets/shared.module.css';

const GIFTS_GROUP = '🎁 Gifts';

const FILTERS: { id: ViewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'notPacked', label: 'Not Packed' },
  { id: 'packLater', label: 'Pack Later' },
  { id: 'charging', label: 'Charging' },
  { id: 'gifts', label: 'Gifts' },
];

const EMPTY_TRIP_DRAFT = {
  name: '', destinations: '', departureDate: '', returnDate: '', accommodation: '',
  tripType: 'City' as Trip['tripType'], weatherLow: undefined as number | undefined, weatherHigh: undefined as number | undefined,
  weatherConditions: '', weatherNotes: '', notes: '', weatherDaily: [] as WeatherDay[],
};

const EMPTY_WEATHER_DAY: WeatherDay = { day: '', high: undefined, low: undefined, conditions: '' };

function WeatherDayRow({ day, onChange, onRemove }: { day: WeatherDay; onChange: (d: WeatherDay) => void; onRemove: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr 1.4fr auto', gap: 6, alignItems: 'center' }}>
      <input className={s.input} style={{ height: 44 }} placeholder="Day (e.g. Thu)" value={day.day} onChange={e => onChange({ ...day, day: e.target.value })} />
      <input type="number" className={s.input} style={{ height: 44 }} placeholder="High°" value={day.high ?? ''} onChange={e => onChange({ ...day, high: e.target.value ? Number(e.target.value) : undefined })} />
      <input type="number" className={s.input} style={{ height: 44 }} placeholder="Low°" value={day.low ?? ''} onChange={e => onChange({ ...day, low: e.target.value ? Number(e.target.value) : undefined })} />
      <input className={s.input} style={{ height: 44 }} placeholder="Conditions (e.g. Sunny)" value={day.conditions ?? ''} onChange={e => onChange({ ...day, conditions: e.target.value })} />
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-lo)', width: 32, flexShrink: 0 }}><Trash2 size={15} /></button>
    </div>
  );
}

function TripForm({ trip, onSave, onCancel }: { trip?: Trip; onSave: (t: typeof EMPTY_TRIP_DRAFT) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(trip ? {
    name: trip.name, destinations: trip.destinations, departureDate: trip.departureDate, returnDate: trip.returnDate,
    accommodation: trip.accommodation, tripType: trip.tripType, weatherLow: trip.weatherLow, weatherHigh: trip.weatherHigh,
    weatherConditions: trip.weatherConditions ?? '', weatherNotes: trip.weatherNotes ?? '', notes: trip.notes ?? '',
    weatherDaily: trip.weatherDaily ?? [],
  } : EMPTY_TRIP_DRAFT);

  const set = <K extends keyof typeof draft>(k: K, v: typeof draft[K]) => setDraft(d => ({ ...d, [k]: v }));

  const setDay = (i: number, day: WeatherDay) => set('weatherDaily', draft.weatherDaily.map((d, idx) => idx === i ? day : d));
  const addDay = () => set('weatherDaily', [...draft.weatherDaily, { ...EMPTY_WEATHER_DAY }]);
  const removeDay = (i: number) => set('weatherDaily', draft.weatherDaily.filter((_, idx) => idx !== i));

  return (
    <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input className={s.input} placeholder="Trip name (e.g. Portugal Summer 2026)" value={draft.name} onChange={e => set('name', e.target.value)} />
      <input className={s.input} placeholder="Destination(s)" value={draft.destinations} onChange={e => set('destinations', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 4 }}>DEPARTURE</div>
          <input type="date" className={s.input} value={draft.departureDate} onChange={e => set('departureDate', e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 4 }}>RETURN</div>
          <input type="date" className={s.input} value={draft.returnDate} onChange={e => set('returnDate', e.target.value)} />
        </div>
      </div>
      <input className={s.input} placeholder="Accommodation" value={draft.accommodation} onChange={e => set('accommodation', e.target.value)} />
      <select className={s.input} value={draft.tripType} onChange={e => set('tripType', e.target.value as Trip['tripType'])}>
        {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', fontWeight: 700 }}>🌦️ WEATHER SUMMARY (for packing)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input type="number" className={s.input} placeholder="Low °" value={draft.weatherLow ?? ''} onChange={e => set('weatherLow', e.target.value ? Number(e.target.value) : undefined)} />
          <input type="number" className={s.input} placeholder="High °" value={draft.weatherHigh ?? ''} onChange={e => set('weatherHigh', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <input className={s.input} placeholder="Conditions (e.g. Sunny, occasional rain)" value={draft.weatherConditions} onChange={e => set('weatherConditions', e.target.value)} />
        <input className={s.input} placeholder="Weather notes for packing" value={draft.weatherNotes} onChange={e => set('weatherNotes', e.target.value)} />

        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 6 }}>DAILY FORECAST (optional)</div>
        {draft.weatherDaily.map((day, i) => (
          <WeatherDayRow key={i} day={day} onChange={d => setDay(i, d)} onRemove={() => removeDay(i)} />
        ))}
        <button className={s.btnGhost} onClick={addDay} style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 14px', fontSize: 13 }}>
          <Plus size={14} /> Add Day
        </button>
      </div>
      <textarea className={s.input} style={{ minHeight: 60, paddingTop: 12, resize: 'vertical' }} placeholder="Trip notes" value={draft.notes} onChange={e => set('notes', e.target.value)} />
      <div className={s.row} style={{ justifyContent: 'flex-end' }}>
        <button className={s.btnGhost} onClick={onCancel}>Cancel</button>
        <button className={s.btnPrimary} disabled={!draft.name.trim()} onClick={() => onSave(draft)}>Save Trip</button>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: PackingItem }) {
  const togglePacked = useStore(st => st.togglePackingItemPacked);
  const togglePackLater = useStore(st => st.togglePackingItemPackLater);
  const toggleCharged = useStore(st => st.togglePackingItemCharged);
  const toggleFav = useStore(st => st.togglePackingItemFavourite);
  const removeItem = useStore(st => st.removePackingItem);

  return (
    <div className={s.touchRow} style={{ alignItems: 'flex-start' }}>
      <button className={`${s.checkCircle} ${item.packed ? s.done : ''}`} onClick={() => togglePacked(item.id)}>
        {item.packed && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={item.packed ? s.strike : ''} style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {item.name}{item.qty > 1 ? ` × ${item.qty}` : ''}
          {item.isGift && <span className={s.pill} style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>🎁 {item.giftFor || 'gift'}</span>}
          {item.packLater && <span className={s.pill}>⏰ later</span>}
        </div>
        {item.notes && <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>{item.notes}</div>}
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {item.requiresCharging && (
          <button onClick={() => toggleCharged(item.id)} title={item.charged ? 'Charged' : 'Needs charging'} style={{ background: 'none', border: 'none', color: item.charged ? '#22d3ee' : 'var(--text-lo)' }}>
            {item.charged ? <BatteryCharging size={18} /> : <Battery size={18} />}
          </button>
        )}
        <button onClick={() => toggleFav(item.id)} style={{ background: 'none', border: 'none', color: item.favourite ? '#fbbf24' : 'var(--text-lo)' }}>
          <Star size={18} fill={item.favourite ? '#fbbf24' : 'none'} />
        </button>
        <button onClick={() => togglePackLater(item.id)} title="Pack later" style={{ background: 'none', border: 'none', color: item.packLater ? '#a855f7' : 'var(--text-lo)' }}>⏰</button>
        <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function AddItemForm({ tripId, groups }: { tripId: string; groups: string[] }) {
  const addItem = useStore(st => st.addPackingItem);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [charging, setCharging] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftFor, setGiftFor] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    addItem(tripId, {
      name: name.trim(), group: group.trim() || 'Other', qty: Math.max(1, qty), notes: notes.trim() || undefined,
      packed: false, packLater: false, requiresCharging: charging, charged: false, favourite: false,
      isGift, giftFor: isGift ? giftFor.trim() || undefined : undefined,
    });
    setName(''); setNotes(''); setQty(1); setCharging(false); setIsGift(false); setGiftFor('');
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
            <input className={s.input} placeholder="Group (e.g. 🧼 Hygiene)" list="packing-groups" value={group} onChange={e => setGroup(e.target.value)} />
            <input type="number" min={1} className={s.input} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} />
          </div>
          <datalist id="packing-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
          <input className={s.input} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <div className={s.row} style={{ flexWrap: 'wrap', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-lo)' }}>
              <input type="checkbox" checked={charging} onChange={e => setCharging(e.target.checked)} /> Requires charging
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

function MasterLibraryModal({ onClose }: { onClose: () => void }) {
  const masterItems = useStore(st => st.masterPackingItems);
  const addMasterItem = useStore(st => st.addMasterItem);
  const removeMasterItem = useStore(st => st.removeMasterItem);
  const addMasterItemToTrip = useStore(st => st.addMasterItemToTrip);
  const activeTripId = useStore(st => st.activeTripId);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftFor, setGiftFor] = useState('');

  const groups = useMemo(() => {
    const map = new Map<string, typeof masterItems>();
    for (const m of masterItems) {
      const key = m.group || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [masterItems]);

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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-lo)' }}>
          Keep every item you might ever pack here, then add the ones you need to a trip with one tap.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className={s.input} placeholder="Item name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <input className={s.input} style={{ width: 140 }} placeholder="Group" list="packing-groups" value={group} onChange={e => setGroup(e.target.value)} />
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
          {groups.map(([g, items]) => (
            <div key={g}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-lo)', marginBottom: 6 }}>{g}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(i => (
                  <div key={i.id} className={s.touchRow}>
                    <div style={{ flex: 1 }}>
                      {i.name}{i.isGift && <span className={s.pill} style={{ marginLeft: 8 }}>🎁 {i.giftFor || 'gift'}</span>}
                    </div>
                    {activeTripId && (
                      <button className={s.btnGhost} style={{ padding: '0 12px', minHeight: 36 }} onClick={() => addMasterItemToTrip(i.id, activeTripId)}>
                        Add to trip
                      </button>
                    )}
                    <button onClick={() => removeMasterItem(i.id)} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><Trash2 size={16} /></button>
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

  const [creatingTrip, setCreatingTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [taskText, setTaskText] = useState('');

  const trip = trips.find(t => t.id === activeTripId) ?? null;
  const tripItems = useMemo(() => items.filter(i => i.tripId === trip?.id), [items, trip]);
  const tripTasks = useMemo(() => tasks.filter(t => t.tripId === trip?.id), [tasks, trip]);
  const groups = useMemo(() => Array.from(new Set([...items.map(i => i.group), ...masterItems.map(i => i.group)])).sort(), [items, masterItems]);

  const model = trip ? buildExportModel(trip, items, tasks, DEFAULT_EXPORT_OPTIONS, filter) : null;
  const status = model ? statusLine(model) : null;

  const visibleGroups = model?.groups ?? [];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 2vw, 32px)', margin: 0 }}>🧽 Ultimate Travel Packing List</h1>
        <div className={s.row}>
          <button className={s.btnGhost} onClick={() => setMasterOpen(true)}><Library size={18} /> Master Library</button>
          <button className={s.btnPrimary} onClick={() => setExportOpen(true)}><Download size={18} /> Export / Share</button>
        </div>
      </div>

      {trips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
          {trips.map(t => (
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
            onSave={(draft) => { addTrip(draft); setCreatingTrip(false); }}
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
                          <div style={{ fontSize: 22, margin: '4px 0' }}>{conditionEmoji(d.conditions)}</div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {d.high != null ? `${d.high}°` : '—'}
                            <span style={{ color: 'var(--text-lo)', fontWeight: 500 }}> {d.low != null ? `${d.low}°` : ''}</span>
                          </div>
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
          </div>

          <AddItemForm tripId={trip.id} groups={groups} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {visibleGroups.length === 0 && (
              <div className={s.emptyState} style={{ minHeight: 120 }}>
                <div style={{ fontSize: 13.5 }}>Nothing here yet.</div>
              </div>
            )}
            {visibleGroups.map(g => (
              <div key={g.group}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-lo)', marginBottom: 8 }}>{g.group}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.items.map(item => <ItemRow key={item.id} item={item} />)}
                </div>
              </div>
            ))}
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
    </div>
  );
}
