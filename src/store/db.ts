import Dexie, { type Table } from 'dexie';
import type {
  WidgetLayout, Task, Note, ShoppingItem, Countdown, Chore, Bill,
  Recipe, MealPlanEntry, Settings, CustomFont, CustomSound, Alarm, Member,
  Trip, PackingItem, MasterPackingItem, DepartureTask,
} from '../types';

export class HomeDB extends Dexie {
  widgets!: Table<WidgetLayout, string>;
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  shopping!: Table<ShoppingItem, string>;
  countdowns!: Table<Countdown, string>;
  chores!: Table<Chore, string>;
  bills!: Table<Bill, string>;
  recipes!: Table<Recipe, string>;
  mealPlan!: Table<MealPlanEntry, string>;
  settings!: Table<Settings, string>;
  fonts!: Table<CustomFont, string>;
  sounds!: Table<CustomSound, string>;
  alarms!: Table<Alarm, string>;
  members!: Table<Member, string>;
  trips!: Table<Trip, string>;
  packingItems!: Table<PackingItem, string>;
  masterPackingItems!: Table<MasterPackingItem, string>;
  departureTasks!: Table<DepartureTask, string>;

  constructor() {
    super('homeDashboardDB');
    this.version(1).stores({
      widgets: 'id, page',
      tasks: 'id, done, priority',
      notes: 'id',
      shopping: 'id, category, done',
      countdowns: 'id',
      chores: 'id',
      bills: 'id',
      recipes: 'id, favourite',
      mealPlan: 'id, day',
      settings: 'id',
    });
    this.version(2).stores({
      widgets: 'id, page',
      tasks: 'id, done, priority',
      notes: 'id',
      shopping: 'id, category, done',
      countdowns: 'id',
      chores: 'id',
      bills: 'id',
      recipes: 'id, favourite',
      mealPlan: 'id, day',
      settings: 'id',
      fonts: 'id',
      sounds: 'id',
    });
    this.version(3).stores({
      widgets: 'id, page',
      tasks: 'id, done, priority',
      notes: 'id',
      shopping: 'id, category, done',
      countdowns: 'id',
      chores: 'id',
      bills: 'id',
      recipes: 'id, favourite',
      mealPlan: 'id, day',
      settings: 'id',
      fonts: 'id',
      sounds: 'id',
      alarms: 'id',
    });
    this.version(4).stores({
      widgets: 'id, page',
      tasks: 'id, done, priority',
      notes: 'id',
      shopping: 'id, category, done',
      countdowns: 'id',
      chores: 'id',
      bills: 'id',
      recipes: 'id, favourite',
      mealPlan: 'id, day',
      settings: 'id',
      fonts: 'id',
      sounds: 'id',
      alarms: 'id',
      members: 'id',
    });
    this.version(5).stores({
      widgets: 'id, page',
      tasks: 'id, done, priority',
      notes: 'id',
      shopping: 'id, category, done',
      countdowns: 'id',
      chores: 'id',
      bills: 'id',
      recipes: 'id, favourite',
      mealPlan: 'id, day',
      settings: 'id',
      fonts: 'id',
      sounds: 'id',
      alarms: 'id',
      members: 'id',
      trips: 'id, createdAt',
      packingItems: 'id, tripId, group, packed, packLater, requiresCharging, isGift',
      masterPackingItems: 'id, group',
      departureTasks: 'id, tripId, done',
    });
  }
}

export const db = new HomeDB();
