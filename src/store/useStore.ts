import { create } from 'zustand';
import { db } from './db';
import { seedDemoData, DEFAULT_LAYOUT, HOME_PRESETS, type PresetName } from './demoData';
import type {
  WidgetLayout, Task, Note, ShoppingItem, Countdown, Chore, Bill,
  Recipe, MealPlanEntry, Settings, PageId, CustomFont, CustomSound, Alarm, Member, MemberRole,
  Trip, PackingItem, MasterPackingItem, DepartureTask,
} from '../types';
import type { AgendaEvent } from '../lib/agenda';
import type { EcowittReading } from '../lib/ecowitt';
import type { GoogleTaskItem } from '../lib/googleTasks';
import { registerFont, unregisterFont } from '../lib/fontManager';

const uid = () => Math.random().toString(36).slice(2, 10);

export interface TimerState {
  totalSec: number;
  remaining: number;
  running: boolean;
  label?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  createdAt: number;
  read: boolean;
}

interface Store {
  ready: boolean;
  widgets: WidgetLayout[];
  tasks: Task[];
  notes: Note[];
  shopping: ShoppingItem[];
  countdowns: Countdown[];
  chores: Chore[];
  bills: Bill[];
  recipes: Recipe[];
  mealPlan: MealPlanEntry[];
  settings: Settings;
  editMode: boolean;
  activePage: PageId;
  ambient: boolean;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  nightDimSuspended: boolean;
  setNightDimSuspended: (v: boolean) => void;
  motionWakeStatus: 'idle' | 'requesting' | 'watching' | 'denied' | 'unsupported' | 'error';
  setMotionWakeStatus: (v: Store['motionWakeStatus']) => void;
  timer: TimerState;
  notifications: AppNotification[];
  notificationsOpen: boolean;
  setNotificationsOpen: (v: boolean) => void;
  fonts: CustomFont[];
  sounds: CustomSound[];
  alarms: Alarm[];
  members: Member[];
  googleEvents: AgendaEvent[] | null;
  setGoogleEvents: (events: AgendaEvent[] | null) => void;
  googleTasksList: GoogleTaskItem[] | null;
  setGoogleTasksList: (tasks: GoogleTaskItem[] | null) => void;

  // Mirrors the local Music Player widget's live playback state/controls so a
  // separate "Now Playing" widget instance can display and control it too.
  localPlayer: { trackName: string; playing: boolean; progress: number; duration: number } | null;
  setLocalPlayer: (v: Store['localPlayer']) => void;
  localPlayerControls: { togglePlay: () => void; next: () => void; prev: () => void } | null;
  setLocalPlayerControls: (v: Store['localPlayerControls']) => void;

  // Mirrors the YouTube widget's live player so voice commands can control
  // whichever video is actually loaded, without the widget needing to know
  // anything about the assistant.
  youtubePlayerState: { title: string; playing: boolean; hasPlaylist: boolean } | null;
  setYoutubePlayerState: (v: Store['youtubePlayerState']) => void;
  youtubeControls: { play: () => void; pause: () => void; next: () => void; prev: () => void; seekBy: (sec: number) => void } | null;
  setYoutubeControls: (v: Store['youtubeControls']) => void;
  ecowittReadings: EcowittReading[] | null;
  ecowittError: string | null;
  setEcowittData: (readings: EcowittReading[] | null, error: string | null) => void;

  init: () => Promise<void>;
  setActivePage: (p: PageId) => void;
  setEditMode: (v: boolean) => void;
  setAmbient: (v: boolean) => void;


  updateWidget: (w: WidgetLayout) => void;
  updateWidgets: (ws: WidgetLayout[]) => void;
  addWidget: (page: PageId, type: WidgetLayout['type']) => void;
  duplicateWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  resetPageLayout: (page: PageId) => void;
  resetAllLayouts: () => void;
  applyPreset: (name: PresetName) => void;

  startTimer: (minutes: number, label?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<void>;

  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markNotificationsRead: () => void;

  addTask: (text: string, priority: Task['priority'], due?: string, memberId?: string) => void;
  assignTask: (id: string, memberId: string | undefined) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  addNote: (text: string, color: Note['color']) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;

  addShoppingItem: (name: string, category: ShoppingItem['category']) => void;
  toggleShoppingItem: (id: string) => void;
  clearCompletedShopping: () => void;

  addCountdown: (c: Omit<Countdown, 'id'>) => void;
  updateCountdown: (id: string, patch: Partial<Omit<Countdown, 'id'>>) => void;
  removeCountdown: (id: string) => void;

  addChore: (name: string, everyDays: number) => void;
  toggleChoreDone: (id: string) => void;
  removeChore: (id: string) => void;

  addBill: (b: Omit<Bill, 'id' | 'completed'>) => void;
  toggleBillDone: (id: string) => void;
  removeBill: (id: string) => void;

  toggleFavouriteRecipe: (id: string) => void;
  addRecipes: (recipes: Recipe[]) => Promise<void>;

  // Cooking wizard session — lifted to the store (not component-local state)
  // so the voice assistant can advance/read the current step while the
  // wizard is open.
  cookingRecipeId: string | null;
  cookingStepIndex: number;
  startCooking: (recipeId: string) => void;
  stopCooking: () => void;
  setCookingStep: (i: number) => void;
  pendingStepTimerMinutes: number | null;
  setPendingStepTimerMinutes: (m: number | null) => void;

  setMealPlanEntry: (day: number, meal: MealPlanEntry['meal'], value: { recipeId?: string; text?: string }) => void;
  clearMealPlanEntry: (day: number, meal: MealPlanEntry['meal']) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  clearDemoData: () => Promise<void>;

  addFont: (name: string, dataUrl: string, format: string) => Promise<string>;
  removeFont: (id: string) => void;

  addSound: (name: string, dataUrl: string) => void;
  removeSound: (id: string) => void;

  addPantryItem: (item: string) => void;
  removePantryItem: (item: string) => void;

  addAlarm: (time: string, repeatDays: number[], label?: string) => void;
  toggleAlarm: (id: string) => void;
  removeAlarm: (id: string) => void;

  addMember: (name: string, role: MemberRole) => void;
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void;
  removeMember: (id: string) => void;

  // Spongie Ultimate Travel Packing List
  trips: Trip[];
  packingItems: PackingItem[];
  masterPackingItems: MasterPackingItem[];
  departureTasks: DepartureTask[];
  activeTripId: string | null;
  setActiveTripId: (id: string | null) => void;

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
  removeMasterItem: (id: string) => void;
  addMasterItemToTrip: (masterId: string, tripId: string) => void;

  addDepartureTask: (tripId: string, text: string) => void;
  toggleDepartureTask: (id: string) => void;
  removeDepartureTask: (id: string) => void;
}

const DEFAULT_SETTINGS: Settings = {
  id: 'settings', name: 'Home', theme: 'neonDream', timeFormat: '24h', tempUnit: 'C',
  defaultPage: 'home', sidebarWidth: 240, ambientAfterMs: 5 * 60 * 1000,
  nightModeStart: '22:00', nightModeEnd: '07:00', demoCleared: false, location: 'Cape Town',
  textScale: 'normal', highContrast: false, reducedMotion: false,
  labels: {}, soundEnabled: true, soundVolume: 0.5, clickSoundId: 'softPop',
  timerTickSoundId: 'tick', timerRingSoundId: 'melody', alarmSoundId: 'melody',
  currency: 'ZAR', wakeWordEnabled: false, wakeWord: 'Jeeves', voiceReplyEnabled: true, voicePack: 'default', pantryItems: [], weatherForecastStyle: 'bars', ezvizAppKey: '', ezvizAppSecret: '', ezvizAccessToken: '', ezvizTokenExpiresAt: 0, ezvizCameras: [], googleClientId: '', googleAccessToken: '', googleTokenExpiresAt: 0, googleCalendarConnected: false, googleSyncIntervalSec: 5, googleLastSync: 0, googleCalendarIds: [], ecowittAppKey: '', ecowittApiKey: '', ecowittMac: '', ecowittSyncIntervalSec: 60, ecowittLastSync: 0, widgetColorGroups: true,
  nightDimEnabled: true, nightAccentColor: '#f5ff00', nightGlowIntensity: 'subtle', motionWakeEnabled: false,
  googleMapsApiKey: '', googleMapsQuery: '', appleMusicDeveloperToken: '',
  googleTasksConnected: false, googleTasksAccessToken: '', googleTasksTokenExpiresAt: 0, googleTasksSyncIntervalSec: 10, googleTasksLastSync: 0,
  commuteOrigin: '', commuteDestination: '', commuteLabel: 'Work', commuteRefreshIntervalSec: 300,
  dropboxAppKey: '', dropboxAccessToken: '', dropboxTokenExpiresAt: 0, dropboxConnected: false, dropboxFolderPath: '',
  spoonacularApiKey: '',
  youtubeApiKey: '',
};

export const useStore = create<Store>((set, get) => ({
  ready: false,
  widgets: [], tasks: [], notes: [], shopping: [], countdowns: [],
  chores: [], bills: [], recipes: [], mealPlan: [],
  settings: DEFAULT_SETTINGS,
  editMode: false,
  activePage: 'home',
  ambient: false,
  nightDimSuspended: false,
  motionWakeStatus: 'idle',
  focusMode: false,
  setFocusMode: (v) => set({ focusMode: v }),
  timer: { totalSec: 20 * 60, remaining: 20 * 60, running: false },
  notifications: [
    { id: uid(), title: 'Recipe sync complete', body: 'Your recipe box is up to date.', icon: '🍳', createdAt: Date.now() - 3600_000, read: true },
  ],
  notificationsOpen: false,
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
  fonts: [],
  sounds: [],
  alarms: [],
  members: [],
  trips: [],
  packingItems: [],
  masterPackingItems: [],
  departureTasks: [],
  activeTripId: null,
  setActiveTripId: (id) => set({ activeTripId: id }),
  googleEvents: null,
  setGoogleEvents: (events) => set({ googleEvents: events }),
  googleTasksList: null,
  setGoogleTasksList: (tasks) => set({ googleTasksList: tasks }),
  localPlayer: null,
  setLocalPlayer: (v) => set({ localPlayer: v }),
  localPlayerControls: null,
  setLocalPlayerControls: (v) => set({ localPlayerControls: v }),
  youtubePlayerState: null,
  setYoutubePlayerState: (v) => set({ youtubePlayerState: v }),
  youtubeControls: null,
  setYoutubeControls: (v) => set({ youtubeControls: v }),
  ecowittReadings: null,
  ecowittError: null,
  setEcowittData: (readings, error) => set({ ecowittReadings: readings, ecowittError: error }),

  init: async () => {
    await seedDemoData();
    const [widgets, tasks, notes, shopping, countdowns, chores, bills, recipes, mealPlan, settings, fonts, sounds, alarms, members, trips, packingItems, masterPackingItems, departureTasks] =
      await Promise.all([
        db.widgets.toArray(), db.tasks.toArray(), db.notes.toArray(), db.shopping.toArray(),
        db.countdowns.toArray(), db.chores.toArray(), db.bills.toArray(), db.recipes.toArray(),
        db.mealPlan.toArray(), db.settings.get('settings'), db.fonts.toArray(), db.sounds.toArray(), db.alarms.toArray(), db.members.toArray(),
        db.trips.toArray(), db.packingItems.toArray(), db.masterPackingItems.toArray(), db.departureTasks.toArray(),
      ]);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings, labels: { ...settings?.labels } };
    await Promise.all(fonts.map(registerFont));
    const sortedTrips = trips.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    set({
      widgets, tasks, notes, shopping, countdowns, chores, bills, recipes, mealPlan,
      settings: mergedSettings, fonts, sounds, alarms, members,
      trips: sortedTrips, packingItems, masterPackingItems, departureTasks,
      activeTripId: sortedTrips[0]?.id ?? null,
      activePage: mergedSettings.defaultPage ?? 'home',
      ready: true,
    });
  },

  setActivePage: (p) => set({ activePage: p }),
  setEditMode: (v) => set({ editMode: v }),
  setAmbient: (v) => set({ ambient: v }),
  setNightDimSuspended: (v) => set({ nightDimSuspended: v }),
  setMotionWakeStatus: (v) => set({ motionWakeStatus: v }),

  updateWidget: (w) => {
    db.widgets.put(w);
    set({ widgets: get().widgets.map(x => x.id === w.id ? w : x) });
  },
  updateWidgets: (ws) => {
    if (ws.length === 0) return;
    db.widgets.bulkPut(ws);
    const byId = new Map(ws.map(w => [w.id, w]));
    set({ widgets: get().widgets.map(x => byId.get(x.id) ?? x) });
  },
  addWidget: (page, type) => {
    const pageWidgets = get().widgets.filter(x => x.page === page);
    const nextY = pageWidgets.reduce((max, x) => Math.max(max, x.y + x.h), 0);
    const w: WidgetLayout = { id: uid(), type, page, x: 0, y: nextY, w: 4, h: 3 };
    db.widgets.put(w);
    set({ widgets: [...get().widgets, w] });
  },
  duplicateWidget: (id) => {
    const src = get().widgets.find(w => w.id === id);
    if (!src) return;
    const copy: WidgetLayout = { ...src, id: uid(), x: src.x, y: src.y + src.h };
    db.widgets.put(copy);
    set({ widgets: [...get().widgets, copy] });
  },
  removeWidget: (id) => {
    db.widgets.delete(id);
    set({ widgets: get().widgets.filter(w => w.id !== id) });
  },
  resetPageLayout: (page) => {
    const keepIds = get().widgets.filter(w => w.page === page).map(w => w.id);
    const fresh = DEFAULT_LAYOUT.filter(w => w.page === page).map(w => ({ ...w, id: uid() }));
    db.widgets.bulkDelete(keepIds);
    db.widgets.bulkAdd(fresh);
    set({ widgets: [...get().widgets.filter(w => w.page !== page), ...fresh] });
  },
  resetAllLayouts: () => {
    const allIds = get().widgets.map(w => w.id);
    const fresh = DEFAULT_LAYOUT.map(w => ({ ...w, id: uid() }));
    db.widgets.bulkDelete(allIds);
    db.widgets.bulkAdd(fresh);
    set({ widgets: fresh });
  },
  applyPreset: (name) => {
    const homeIds = get().widgets.filter(w => w.page === 'home').map(w => w.id);
    const fresh = HOME_PRESETS[name]();
    db.widgets.bulkDelete(homeIds);
    db.widgets.bulkAdd(fresh);
    set({ widgets: [...get().widgets.filter(w => w.page !== 'home'), ...fresh] });
  },

  addTask: (text, priority, due, memberId) => {
    const t: Task = { id: uid(), text, done: false, priority, due, createdAt: Date.now(), memberId };
    db.tasks.put(t);
    set({ tasks: [t, ...get().tasks] });
  },
  assignTask: (id, memberId) => {
    const tasks = get().tasks.map(t => t.id === id ? { ...t, memberId } : t);
    set({ tasks });
    const t = tasks.find(x => x.id === id);
    if (t) db.tasks.put(t);
  },
  toggleTask: (id) => {
    const t = get().tasks.find(x => x.id === id);
    if (!t) return;
    const updated = { ...t, done: !t.done };
    db.tasks.put(updated);
    set({ tasks: get().tasks.map(x => x.id === id ? updated : x) });
  },
  removeTask: (id) => {
    db.tasks.delete(id);
    set({ tasks: get().tasks.filter(x => x.id !== id) });
  },

  addNote: (text, color) => {
    const n: Note = { id: uid(), text, color, pinned: false, x: 0, y: 0, createdAt: Date.now() };
    db.notes.put(n);
    set({ notes: [...get().notes, n] });
  },
  updateNote: (id, patch) => {
    const n = get().notes.find(x => x.id === id);
    if (!n) return;
    const updated = { ...n, ...patch };
    db.notes.put(updated);
    set({ notes: get().notes.map(x => x.id === id ? updated : x) });
  },
  removeNote: (id) => {
    db.notes.delete(id);
    set({ notes: get().notes.filter(x => x.id !== id) });
  },

  addShoppingItem: (name, category) => {
    const s: ShoppingItem = { id: uid(), name, category, done: false, createdAt: Date.now() };
    db.shopping.put(s);
    set({ shopping: [...get().shopping, s] });
  },
  toggleShoppingItem: (id) => {
    const s = get().shopping.find(x => x.id === id);
    if (!s) return;
    const updated = { ...s, done: !s.done };
    db.shopping.put(updated);
    set({ shopping: get().shopping.map(x => x.id === id ? updated : x) });
  },
  clearCompletedShopping: () => {
    const remaining = get().shopping.filter(x => !x.done);
    const toDelete = get().shopping.filter(x => x.done).map(x => x.id);
    db.shopping.bulkDelete(toDelete);
    set({ shopping: remaining });
  },

  addCountdown: (c) => {
    const item: Countdown = { ...c, id: uid() };
    db.countdowns.put(item);
    set({ countdowns: [...get().countdowns, item] });
  },
  updateCountdown: (id, patch) => {
    const c = get().countdowns.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, ...patch };
    db.countdowns.put(updated);
    set({ countdowns: get().countdowns.map(x => x.id === id ? updated : x) });
  },
  removeCountdown: (id) => {
    db.countdowns.delete(id);
    set({ countdowns: get().countdowns.filter(x => x.id !== id) });
  },

  addChore: (name, everyDays) => {
    const c: Chore = { id: uid(), name, everyDays, lastDone: Date.now() - everyDays * 86400000 };
    db.chores.put(c);
    set({ chores: [...get().chores, c] });
  },
  toggleChoreDone: (id) => {
    const c = get().chores.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, lastDone: Date.now() };
    db.chores.put(updated);
    set({ chores: get().chores.map(x => x.id === id ? updated : x) });
  },
  removeChore: (id) => {
    db.chores.delete(id);
    set({ chores: get().chores.filter(x => x.id !== id) });
  },

  addBill: (b) => {
    const item: Bill = { ...b, id: uid(), completed: false };
    db.bills.put(item);
    set({ bills: [...get().bills, item] });
  },
  removeBill: (id) => {
    db.bills.delete(id);
    set({ bills: get().bills.filter(x => x.id !== id) });
  },
  toggleBillDone: (id) => {
    const b = get().bills.find(x => x.id === id);
    if (!b) return;
    const updated = { ...b, completed: !b.completed };
    db.bills.put(updated);
    set({ bills: get().bills.map(x => x.id === id ? updated : x) });
  },

  toggleFavouriteRecipe: (id) => {
    const r = get().recipes.find(x => x.id === id);
    if (!r) return;
    const updated = { ...r, favourite: !r.favourite };
    db.recipes.put(updated);
    set({ recipes: get().recipes.map(x => x.id === id ? updated : x) });
  },
  addRecipes: async (recipes) => {
    await db.recipes.bulkPut(recipes);
    set({ recipes: [...get().recipes, ...recipes] });
  },

  cookingRecipeId: null,
  cookingStepIndex: 0,
  startCooking: (recipeId) => set({ cookingRecipeId: recipeId, cookingStepIndex: 0 }),
  stopCooking: () => set({ cookingRecipeId: null, cookingStepIndex: 0, pendingStepTimerMinutes: null }),
  setCookingStep: (i) => set({ cookingStepIndex: Math.max(0, i) }),
  pendingStepTimerMinutes: null,
  setPendingStepTimerMinutes: (m) => set({ pendingStepTimerMinutes: m }),

  setMealPlanEntry: (day, meal, value) => {
    const existing = get().mealPlan.find(e => e.day === day && e.meal === meal);
    const entry: MealPlanEntry = existing
      ? { ...existing, ...value }
      : { id: uid(), day, meal, ...value };
    db.mealPlan.put(entry);
    set({ mealPlan: existing ? get().mealPlan.map(e => e.id === entry.id ? entry : e) : [...get().mealPlan, entry] });
  },
  clearMealPlanEntry: (day, meal) => {
    const existing = get().mealPlan.find(e => e.day === day && e.meal === meal);
    if (!existing) return;
    db.mealPlan.delete(existing.id);
    set({ mealPlan: get().mealPlan.filter(e => e.id !== existing.id) });
  },

  updateSettings: (patch) => {
    const updated = { ...get().settings, ...patch };
    db.settings.put(updated);
    set({ settings: updated });
  },

  clearDemoData: async () => {
    await Promise.all([
      db.tasks.clear(), db.notes.clear(), db.shopping.clear(), db.countdowns.clear(),
      db.chores.clear(), db.bills.clear(), db.recipes.clear(), db.mealPlan.clear(),
    ]);
    set({ tasks: [], notes: [], shopping: [], countdowns: [], chores: [], bills: [], recipes: [], mealPlan: [] });
    get().updateSettings({ demoCleared: true });
  },

  startTimer: (minutes, label) => {
    const totalSec = Math.max(1, Math.round(minutes * 60));
    set({ timer: { totalSec, remaining: totalSec, running: true, label } });
  },
  pauseTimer: () => set({ timer: { ...get().timer, running: false } }),
  resumeTimer: () => set({ timer: { ...get().timer, running: get().timer.remaining > 0 } }),
  resetTimer: () => {
    const t = get().timer;
    set({ timer: { ...t, remaining: t.totalSec, running: false } });
  },
  tickTimer: () => {
    const t = get().timer;
    if (!t.running) return;
    const remaining = Math.max(0, t.remaining - 1);
    set({ timer: { ...t, remaining, running: remaining > 0 } });
  },

  exportBackup: async () => {
    const [widgets, tasks, notes, shopping, countdowns, chores, bills, recipes, mealPlan, settings, fonts, sounds, alarms, members, trips, packingItems, masterPackingItems, departureTasks] =
      await Promise.all([
        db.widgets.toArray(), db.tasks.toArray(), db.notes.toArray(), db.shopping.toArray(),
        db.countdowns.toArray(), db.chores.toArray(), db.bills.toArray(), db.recipes.toArray(),
        db.mealPlan.toArray(), db.settings.get('settings'), db.fonts.toArray(), db.sounds.toArray(), db.alarms.toArray(), db.members.toArray(),
        db.trips.toArray(), db.packingItems.toArray(), db.masterPackingItems.toArray(), db.departureTasks.toArray(),
      ]);
    return JSON.stringify({
      version: 5, exportedAt: new Date().toISOString(),
      widgets, tasks, notes, shopping, countdowns, chores, bills, recipes, mealPlan, settings, fonts, sounds, alarms, members,
      trips, packingItems, masterPackingItems, departureTasks,
    }, null, 2);
  },
  importBackup: async (json) => {
    const data = JSON.parse(json);
    await Promise.all([
      db.widgets.clear(), db.tasks.clear(), db.notes.clear(), db.shopping.clear(), db.countdowns.clear(),
      db.chores.clear(), db.bills.clear(), db.recipes.clear(), db.mealPlan.clear(),
      db.fonts.clear(), db.sounds.clear(), db.alarms.clear(), db.members.clear(),
      db.trips.clear(), db.packingItems.clear(), db.masterPackingItems.clear(), db.departureTasks.clear(),
    ]);
    await Promise.all([
      data.widgets?.length ? db.widgets.bulkAdd(data.widgets) : Promise.resolve(),
      data.tasks?.length ? db.tasks.bulkAdd(data.tasks) : Promise.resolve(),
      data.notes?.length ? db.notes.bulkAdd(data.notes) : Promise.resolve(),
      data.shopping?.length ? db.shopping.bulkAdd(data.shopping) : Promise.resolve(),
      data.countdowns?.length ? db.countdowns.bulkAdd(data.countdowns) : Promise.resolve(),
      data.chores?.length ? db.chores.bulkAdd(data.chores) : Promise.resolve(),
      data.bills?.length ? db.bills.bulkAdd(data.bills) : Promise.resolve(),
      data.recipes?.length ? db.recipes.bulkAdd(data.recipes) : Promise.resolve(),
      data.mealPlan?.length ? db.mealPlan.bulkAdd(data.mealPlan) : Promise.resolve(),
      data.fonts?.length ? db.fonts.bulkAdd(data.fonts) : Promise.resolve(),
      data.sounds?.length ? db.sounds.bulkAdd(data.sounds) : Promise.resolve(),
      data.alarms?.length ? db.alarms.bulkAdd(data.alarms) : Promise.resolve(),
      data.members?.length ? db.members.bulkAdd(data.members) : Promise.resolve(),
      data.trips?.length ? db.trips.bulkAdd(data.trips) : Promise.resolve(),
      data.packingItems?.length ? db.packingItems.bulkAdd(data.packingItems) : Promise.resolve(),
      data.masterPackingItems?.length ? db.masterPackingItems.bulkAdd(data.masterPackingItems) : Promise.resolve(),
      data.departureTasks?.length ? db.departureTasks.bulkAdd(data.departureTasks) : Promise.resolve(),
    ]);
    if (data.settings) await db.settings.put(data.settings);
    if (data.fonts?.length) await Promise.all((data.fonts as CustomFont[]).map(registerFont));
    const importedTrips: Trip[] = data.trips ?? [];
    set({
      widgets: data.widgets ?? [], tasks: data.tasks ?? [], notes: data.notes ?? [],
      shopping: data.shopping ?? [], countdowns: data.countdowns ?? [], chores: data.chores ?? [],
      bills: data.bills ?? [], recipes: data.recipes ?? [], mealPlan: data.mealPlan ?? [],
      alarms: data.alarms ?? [], members: data.members ?? [],
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      fonts: data.fonts ?? [], sounds: data.sounds ?? [],
      trips: importedTrips, packingItems: data.packingItems ?? [],
      masterPackingItems: data.masterPackingItems ?? [], departureTasks: data.departureTasks ?? [],
      activeTripId: importedTrips[0]?.id ?? null,
    });
  },

  addNotification: (n) => {
    const item: AppNotification = { ...n, id: uid(), createdAt: Date.now(), read: false };
    set({ notifications: [item, ...get().notifications].slice(0, 30) });
  },
  dismissNotification: (id) => {
    set({ notifications: get().notifications.filter(n => n.id !== id) });
  },
  clearAllNotifications: () => set({ notifications: [] }),
  markNotificationsRead: () => set({ notifications: get().notifications.map(n => ({ ...n, read: true })) }),

  addFont: async (name, dataUrl, format) => {
    const font: CustomFont = { id: uid(), name, dataUrl, format, createdAt: Date.now() };
    await db.fonts.put(font);
    const family = await registerFont(font);
    set({ fonts: [...get().fonts, font] });
    return family;
  },
  removeFont: (id) => {
    const s = get().settings;
    db.fonts.delete(id);
    unregisterFont(id);
    set({ fonts: get().fonts.filter(f => f.id !== id) });
    if (s.fontDisplayId === id || s.fontBodyId === id) {
      get().updateSettings({
        fontDisplayId: s.fontDisplayId === id ? undefined : s.fontDisplayId,
        fontBodyId: s.fontBodyId === id ? undefined : s.fontBodyId,
      });
    }
  },

  addSound: (name, dataUrl) => {
    const sound: CustomSound = { id: uid(), name, dataUrl, createdAt: Date.now() };
    db.sounds.put(sound);
    set({ sounds: [...get().sounds, sound] });
  },
  removeSound: (id) => {
    db.sounds.delete(id);
    set({ sounds: get().sounds.filter(x => x.id !== id) });
    const s = get().settings;
    const patch: Partial<typeof s> = {};
    if (s.clickSoundId === id) patch.clickSoundId = 'softPop';
    if (s.timerTickSoundId === id) patch.timerTickSoundId = 'tick';
    if (s.timerRingSoundId === id) patch.timerRingSoundId = 'melody';
    if (s.alarmSoundId === id) patch.alarmSoundId = 'melody';
    if (Object.keys(patch).length) get().updateSettings(patch);
  },

  addPantryItem: (item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const items = get().settings.pantryItems;
    if (items.some(i => i.toLowerCase() === trimmed.toLowerCase())) return;
    get().updateSettings({ pantryItems: [...items, trimmed] });
  },
  removePantryItem: (item) => {
    get().updateSettings({ pantryItems: get().settings.pantryItems.filter(i => i !== item) });
  },

  addAlarm: (time, repeatDays, label) => {
    const alarm: Alarm = { id: uid(), time, repeatDays, label, enabled: true };
    db.alarms.put(alarm);
    set({ alarms: [...get().alarms, alarm].sort((a, b) => a.time.localeCompare(b.time)) });
  },
  toggleAlarm: (id) => {
    const alarms = get().alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    set({ alarms });
    const a = alarms.find(x => x.id === id);
    if (a) db.alarms.put(a);
  },
  removeAlarm: (id) => {
    db.alarms.delete(id);
    set({ alarms: get().alarms.filter(a => a.id !== id) });
  },

  addMember: (name, role) => {
    const palette = ['#a855f7', '#22d3ee', '#f472b6', '#fb923c', '#4ade80', '#818cf8'];
    const color = palette[get().members.length % palette.length];
    const member: Member = { id: uid(), name, role, color };
    db.members.put(member);
    set({ members: [...get().members, member] });
  },
  updateMember: (id, patch) => {
    const members = get().members.map(m => m.id === id ? { ...m, ...patch } : m);
    set({ members });
    const m = members.find(x => x.id === id);
    if (m) db.members.put(m);
  },
  removeMember: (id) => {
    db.members.delete(id);
    set({ members: get().members.filter(m => m.id !== id) });
  },

  addTrip: (t) => {
    const trip: Trip = { ...t, id: uid(), createdAt: Date.now() };
    db.trips.put(trip);
    set({ trips: [...get().trips, trip].sort((a, b) => a.departureDate.localeCompare(b.departureDate)), activeTripId: trip.id });
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
  removeMasterItem: (id) => {
    db.masterPackingItems.delete(id);
    set({ masterPackingItems: get().masterPackingItems.filter(i => i.id !== id) });
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
}));
