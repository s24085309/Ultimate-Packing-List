import { create } from 'zustand';
import { db } from './db';
import { seedDemoData } from './demoData';
import type { Trip, PackingItem, MasterPackingItem, DepartureTask } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

interface Store {
  ready: boolean;
  trips: Trip[];
  packingItems: PackingItem[];
  masterPackingItems: MasterPackingItem[];
  departureTasks: DepartureTask[];
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;

  init: () => Promise<void>;

  addTrip: (t: Omit<Trip, 'id' | 'createdAt'>) => string;
  updateTrip: (id: string, patch: Partial<Omit<Trip, 'id'>>) => void;
  removeTrip: (id: string) => void;

  addPackingItem: (tripId: string, item: Omit<PackingItem, 'id' | 'tripId' | 'createdAt'>) => void;
  updatePackingItem: (id: string, patch: Partial<Omit<PackingItem, 'id' | 'tripId'>>) => void;
  removePackingItem: (id: string) => void;
  togglePackingItemPacked: (id: string) => void;
  togglePackingItemPackLater: (id: string) => void;
  togglePackingItemCharged: (id: string) => void;
  togglePackingItemFavourite: (id: string) => void;

  addMasterItem: (item: Omit<MasterPackingItem, 'id'>) => void;
  updateMasterItem: (id: string, patch: Partial<Omit<MasterPackingItem, 'id'>>) => void;
  addMasterItemToTrip: (masterId: string, tripId: string) => void;
  addAllMasterItemsToTrip: (tripId: string) => void;
  archiveMasterItem: (id: string) => void;
  archiveMasterGroup: (group: string) => void;
  restoreMasterItem: (id: string) => void;
  deleteMasterItemPermanently: (id: string) => void;
  toggleMasterItemIgnored: (id: string) => void;
  ensureMasterItem: (item: Omit<MasterPackingItem, 'id'>) => void;

  addDepartureTask: (tripId: string, text: string) => void;
  toggleDepartureTask: (id: string) => void;
  removeDepartureTask: (id: string) => void;

  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  ready: false,
  trips: [],
  packingItems: [],
  masterPackingItems: [],
  departureTasks: [],
  activeTripId: null,
  setActiveTripId: (id) => set({ activeTripId: id }),

  init: async () => {
    await seedDemoData();
    const [trips, packingItems, masterPackingItems, departureTasks] = await Promise.all([
      db.trips.toArray(), db.packingItems.toArray(), db.masterPackingItems.toArray(), db.departureTasks.toArray(),
    ]);
    const sortedTrips = trips.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    set({
      trips: sortedTrips, packingItems, masterPackingItems, departureTasks,
      activeTripId: sortedTrips[0]?.id ?? null,
      ready: true,
    });
  },

  addTrip: (t) => {
    const trip: Trip = { ...t, id: uid(), createdAt: Date.now() };
    db.trips.put(trip);
    set({ trips: [...get().trips, trip].sort((a, b) => a.departureDate.localeCompare(b.departureDate)), activeTripId: trip.id });
    get().addAllMasterItemsToTrip(trip.id);
    return trip.id;
  },
  updateTrip: (id, patch) => {
    const trip = get().trips.find(t => t.id === id);
    if (!trip) return;
    const updated = { ...trip, ...patch };
    db.trips.put(updated);
    set({ trips: get().trips.map(t => t.id === id ? updated : t).sort((a, b) => a.departureDate.localeCompare(b.departureDate)) });
  },
  removeTrip: (id) => {
    const itemIds = get().packingItems.filter(i => i.tripId === id).map(i => i.id);
    const taskIds = get().departureTasks.filter(t => t.tripId === id).map(t => t.id);
    db.trips.delete(id);
    db.packingItems.bulkDelete(itemIds);
    db.departureTasks.bulkDelete(taskIds);
    const trips = get().trips.filter(t => t.id !== id);
    set({
      trips,
      packingItems: get().packingItems.filter(i => i.tripId !== id),
      departureTasks: get().departureTasks.filter(t => t.tripId !== id),
      activeTripId: get().activeTripId === id ? (trips[0]?.id ?? null) : get().activeTripId,
    });
  },

  addPackingItem: (tripId, item) => {
    const packed: PackingItem = { ...item, id: uid(), tripId, createdAt: Date.now() };
    db.packingItems.put(packed);
    set({ packingItems: [...get().packingItems, packed] });
  },
  updatePackingItem: (id, patch) => {
    const item = get().packingItems.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, ...patch };
    db.packingItems.put(updated);
    set({ packingItems: get().packingItems.map(i => i.id === id ? updated : i) });
  },
  removePackingItem: (id) => {
    db.packingItems.delete(id);
    set({ packingItems: get().packingItems.filter(i => i.id !== id) });
  },
  togglePackingItemPacked: (id) => {
    const item = get().packingItems.find(i => i.id === id);
    if (!item) return;
    get().updatePackingItem(id, { packed: !item.packed });
  },
  togglePackingItemPackLater: (id) => {
    const item = get().packingItems.find(i => i.id === id);
    if (!item) return;
    get().updatePackingItem(id, { packLater: !item.packLater });
  },
  togglePackingItemCharged: (id) => {
    const item = get().packingItems.find(i => i.id === id);
    if (!item) return;
    get().updatePackingItem(id, { charged: !item.charged });
  },
  togglePackingItemFavourite: (id) => {
    const item = get().packingItems.find(i => i.id === id);
    if (!item) return;
    get().updatePackingItem(id, { favourite: !item.favourite });
  },

  addMasterItem: (item) => {
    const master: MasterPackingItem = { ...item, id: uid() };
    db.masterPackingItems.put(master);
    set({ masterPackingItems: [...get().masterPackingItems, master] });
  },
  updateMasterItem: (id, patch) => {
    const item = get().masterPackingItems.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, ...patch };
    db.masterPackingItems.put(updated);
    set({ masterPackingItems: get().masterPackingItems.map(i => i.id === id ? updated : i) });
  },
  ensureMasterItem: (item) => {
    const exists = get().masterPackingItems.some(
      m => m.name.trim().toLowerCase() === item.name.trim().toLowerCase() && m.group === item.group,
    );
    if (exists) return;
    get().addMasterItem(item);
  },
  archiveMasterItem: (id) => get().updateMasterItem(id, { archived: true, ignored: false }),
  restoreMasterItem: (id) => get().updateMasterItem(id, { archived: false }),
  deleteMasterItemPermanently: (id) => {
    db.masterPackingItems.delete(id);
    set({ masterPackingItems: get().masterPackingItems.filter(i => i.id !== id) });
  },
  toggleMasterItemIgnored: (id) => {
    const item = get().masterPackingItems.find(i => i.id === id);
    if (!item) return;
    get().updateMasterItem(id, { ignored: !item.ignored });
  },
  addMasterItemToTrip: (masterId, tripId) => {
    const m = get().masterPackingItems.find(i => i.id === masterId);
    if (!m) return;
    get().addPackingItem(tripId, {
      group: m.group, name: m.name, qty: m.qty, notes: m.notes,
      packed: false, packLater: false, requiresCharging: m.requiresCharging, charged: false,
      favourite: false, isGift: m.isGift, giftFor: m.giftFor,
    });
  },
  addAllMasterItemsToTrip: (tripId) => {
    const masterItems = get().masterPackingItems.filter(m => !m.archived && !m.ignored);
    if (masterItems.length === 0) return;
    const existing = new Set(get().packingItems.filter(i => i.tripId === tripId).map(i => `${i.group}::${i.name}`));
    const created: PackingItem[] = masterItems
      .filter(m => !existing.has(`${m.group}::${m.name}`))
      .map(m => ({
        id: uid(), tripId, group: m.group, name: m.name, qty: m.qty, notes: m.notes,
        packed: false, packLater: false, requiresCharging: m.requiresCharging, charged: false,
        favourite: false, isGift: m.isGift, giftFor: m.giftFor, createdAt: Date.now(),
      }));
    if (created.length === 0) return;
    db.packingItems.bulkPut(created);
    set({ packingItems: [...get().packingItems, ...created] });
  },
  archiveMasterGroup: (group) => {
    const ids = get().masterPackingItems.filter(i => !i.archived && (i.group || 'Other') === group).map(i => i.id);
    if (ids.length === 0) return;
    const updated = get().masterPackingItems.map(i => ids.includes(i.id) ? { ...i, archived: true, ignored: false } : i);
    db.masterPackingItems.bulkPut(updated.filter(i => ids.includes(i.id)));
    set({ masterPackingItems: updated });
  },

  addDepartureTask: (tripId, text) => {
    const task: DepartureTask = { id: uid(), tripId, text, done: false };
    db.departureTasks.put(task);
    set({ departureTasks: [...get().departureTasks, task] });
  },
  toggleDepartureTask: (id) => {
    const t = get().departureTasks.find(x => x.id === id);
    if (!t) return;
    const updated = { ...t, done: !t.done };
    db.departureTasks.put(updated);
    set({ departureTasks: get().departureTasks.map(x => x.id === id ? updated : x) });
  },
  removeDepartureTask: (id) => {
    db.departureTasks.delete(id);
    set({ departureTasks: get().departureTasks.filter(x => x.id !== id) });
  },

  exportBackup: async () => {
    const [trips, packingItems, masterPackingItems, departureTasks] = await Promise.all([
      db.trips.toArray(), db.packingItems.toArray(), db.masterPackingItems.toArray(), db.departureTasks.toArray(),
    ]);
    return JSON.stringify({
      version: 1, exportedAt: new Date().toISOString(),
      trips, packingItems, masterPackingItems, departureTasks,
    }, null, 2);
  },
  importBackup: async (json) => {
    const data = JSON.parse(json);
    await Promise.all([
      db.trips.clear(), db.packingItems.clear(), db.masterPackingItems.clear(), db.departureTasks.clear(),
    ]);
    await Promise.all([
      data.trips?.length ? db.trips.bulkAdd(data.trips) : Promise.resolve(),
      data.packingItems?.length ? db.packingItems.bulkAdd(data.packingItems) : Promise.resolve(),
      data.masterPackingItems?.length ? db.masterPackingItems.bulkAdd(data.masterPackingItems) : Promise.resolve(),
      data.departureTasks?.length ? db.departureTasks.bulkAdd(data.departureTasks) : Promise.resolve(),
    ]);
    const importedTrips: Trip[] = data.trips ?? [];
    set({
      trips: importedTrips, packingItems: data.packingItems ?? [],
      masterPackingItems: data.masterPackingItems ?? [], departureTasks: data.departureTasks ?? [],
      activeTripId: importedTrips[0]?.id ?? null,
    });
  },
}));
