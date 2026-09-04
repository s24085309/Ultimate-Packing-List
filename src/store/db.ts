import Dexie, { type Table } from 'dexie';
import type { Trip, PackingItem, MasterPackingItem, DepartureTask, AppSettings } from '../types';

export class PackingDB extends Dexie {
  trips!: Table<Trip, string>;
  packingItems!: Table<PackingItem, string>;
  masterPackingItems!: Table<MasterPackingItem, string>;
  departureTasks!: Table<DepartureTask, string>;
  settings!: Table<AppSettings, string>;

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
  }
}

export const db = new PackingDB();
