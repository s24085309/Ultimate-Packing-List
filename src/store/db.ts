import Dexie, { type Table } from 'dexie';
import type { Trip, PackingItem, MasterPackingItem, DepartureTask, MasterDepartureTask, AppSettings } from '../types';

// Stores browser file-system handles (e.g. the chosen auto-backup folder) —
// these are structured-clonable and IndexedDB explicitly supports persisting
// them across sessions, which is the whole point of keeping the picked
// folder without asking again every time.
export interface StoredHandle {
  id: string;
  handle: FileSystemDirectoryHandle;
}

export class PackingDB extends Dexie {
  trips!: Table<Trip, string>;
  packingItems!: Table<PackingItem, string>;
  masterPackingItems!: Table<MasterPackingItem, string>;
  departureTasks!: Table<DepartureTask, string>;
  masterDepartureTasks!: Table<MasterDepartureTask, string>;
  settings!: Table<AppSettings, string>;
  handles!: Table<StoredHandle, string>;

  constructor() {
    super('ultimatePackingListDB');
    this.version(1).stores({
      trips: 'id, createdAt',
      packingItems: 'id, tripId, group, packed, packLater, requiresCharging, isGift',
      masterPackingItems: 'id, group',
      departureTasks: 'id, tripId, done',
    });
    this.version(2).stores({
      trips: 'id, createdAt',
      packingItems: 'id, tripId, group, packed, packLater, requiresCharging, isGift',
      masterPackingItems: 'id, group',
      departureTasks: 'id, tripId, done',
      settings: 'id',
    });
    this.version(3).stores({
      trips: 'id, createdAt',
      packingItems: 'id, tripId, group, packed, packLater, requiresCharging, isGift',
      masterPackingItems: 'id, group',
      departureTasks: 'id, tripId, done',
      settings: 'id',
      handles: 'id',
    });
    this.version(4).stores({
      trips: 'id, createdAt',
      packingItems: 'id, tripId, group, packed, packLater, requiresCharging, isGift',
      masterPackingItems: 'id, group',
      departureTasks: 'id, tripId, done',
      masterDepartureTasks: 'id',
      settings: 'id',
      handles: 'id',
    });
  }
}

export const db = new PackingDB();
