export type PageId =
  | 'home' | 'planner' | 'recipes' | 'shopping' | 'homelife'
  | 'entertainment' | 'energy' | 'fun' | 'smarthome' | 'packing' | 'settings' | 'custom';

export type WidgetType =
  | 'clock' | 'weather' | 'agenda' | 'nextEvent' | 'tasks' | 'notes'
  | 'shopping' | 'recipeSpotlight' | 'countdown' | 'chores' | 'bills'
  | 'energy' | 'quickActions' | 'worldClock' | 'timer' | 'stopwatch'
  | 'quote' | 'fact' | 'joke' | 'wordOfDay' | 'question' | 'sunMoon'
  | 'customText' | 'mealPlanner' | 'appShortcuts' | 'photos' | 'alarms' | 'currency' | 'sunTimes' | 'ecowittStation' | 'familyBoard' | 'googleMap' | 'musicPlayer' | 'appleMusic' | 'googleTasks' | 'commute' | 'nowPlaying' | 'leaveBy' | 'youtubePlayer';

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  page: PageId;
  x: number; y: number; w: number; h: number;
  title?: string;
  style?: string;
  cities?: string[];
}

export type Priority = 'low' | 'normal' | 'important' | 'urgent';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  due?: string;
  createdAt: number;
  memberId?: string;
}

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  pinned: boolean;
  x: number; y: number;
  createdAt: number;
}

export type ShoppingCategory = 'groceries' | 'household' | 'garden' | 'other';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  done: boolean;
  createdAt: number;
}

export interface Countdown {
  id: string;
  name: string;
  date: string;
  icon: string;
  color: string;
}

export interface Chore {
  id: string;
  name: string;
  everyDays: number;
  lastDone: number;
}

export interface Bill {
  id: string;
  name: string;
  amount?: number;
  due: string;
  recurring: boolean;
  completed: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  minutes: number;
  ingredients: string[];
  steps: string[];
  favourite: boolean;
  image?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  utensils?: string[];
  source?: string;
  sourceUrl?: string;
}

export interface MealPlanEntry {
  id: string;
  day: number; // 0-6
  meal: 'breakfast' | 'lunch' | 'dinner';
  recipeId?: string;
  text?: string;
}

export interface EzvizCamera {
  id: string;
  name: string;
  deviceSerial: string;
  validateCode: string;
  channelNo: number;
}

export type MemberRole = 'Admin' | 'Member' | 'Kid';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  color: string;
}

export interface Alarm {
  id: string;
  time: string; // "HH:MM"
  label?: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun .. 6=Sat, empty = one-off
}

export type ThemeName = 'neonDream' | 'cyberBlue' | 'sunset' | 'ocean' | 'midnight' | 'matrix';

export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string;
  format: string;
  createdAt: number;
}

export interface CustomSound {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
}

export const BUILTIN_SOUNDS = ['none', 'softPop', 'click', 'chime', 'blip', 'tick', 'melody'] as const;
export type BuiltinSoundId = typeof BUILTIN_SOUNDS[number];

export interface Settings {
  id: 'settings';
  name: string;
  theme: ThemeName;
  timeFormat: '12h' | '24h';
  tempUnit: 'C' | 'F';
  defaultPage: PageId;
  sidebarWidth: number;
  ambientAfterMs: number;
  nightModeStart: string;
  nightModeEnd: string;
  pin?: string;
  demoCleared: boolean;
  location: string;
  textScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  fontDisplayId?: string;
  fontBodyId?: string;
  labels: Record<string, string>;
  soundEnabled: boolean;
  soundVolume: number;
  clickSoundId: string;
  timerTickSoundId: string;
  timerRingSoundId: string;
  alarmSoundId: string;
  currency: 'ZAR' | 'USD' | 'EUR' | 'GBP';
  wakeWordEnabled: boolean;
  wakeWord: string;
  voiceReplyEnabled: boolean;
  voicePack: string;
  pantryItems: string[];
  weatherForecastStyle: 'bars' | 'columns';
  ezvizAppKey: string;
  ezvizAppSecret: string;
  ezvizAccessToken: string;
  ezvizTokenExpiresAt: number;
  ezvizCameras: EzvizCamera[];
  googleClientId: string;
  googleAccessToken: string;
  googleTokenExpiresAt: number;
  googleCalendarConnected: boolean;
  googleSyncIntervalSec: number;
  googleLastSync: number;
  /** Secondary calendars to include alongside "primary" (Calendar API IDs). Empty = primary only. */
  googleCalendarIds: string[];
  ecowittAppKey: string;
  ecowittApiKey: string;
  ecowittMac: string;
  ecowittSyncIntervalSec: number;
  ecowittLastSync: number;
  widgetColorGroups: boolean;
  nightDimEnabled: boolean;
  nightAccentColor: string;
  nightGlowIntensity: 'subtle' | 'medium' | 'bright';
  motionWakeEnabled: boolean;
  googleMapsApiKey: string;
  googleMapsQuery: string;
  appleMusicDeveloperToken: string;
  googleTasksConnected: boolean;
  googleTasksAccessToken: string;
  googleTasksTokenExpiresAt: number;
  googleTasksSyncIntervalSec: number;
  googleTasksLastSync: number;
  commuteOrigin: string;
  commuteDestination: string;
  commuteLabel: string;
  commuteRefreshIntervalSec: number;
  dropboxAppKey: string;
  dropboxAccessToken: string;
  dropboxTokenExpiresAt: number;
  dropboxConnected: boolean;
  dropboxFolderPath: string;
  spoonacularApiKey: string;
  youtubeApiKey: string;
}

export const CURRENCY_SYMBOLS: Record<Settings['currency'], string> = {
  ZAR: 'R', USD: '$', EUR: '€', GBP: '£',
};

// ---------- Spongie Ultimate Travel Packing List ----------

export type TripType = 'Beach' | 'City' | 'Business' | 'Camping' | 'Ski' | 'Cruise' | 'Road Trip' | 'Family Visit' | 'Other';

export const TRIP_TYPES: TripType[] = ['Beach', 'City', 'Business', 'Camping', 'Ski', 'Cruise', 'Road Trip', 'Family Visit', 'Other'];

export interface Trip {
  id: string;
  name: string;
  destinations: string;
  departureDate: string; // ISO date
  returnDate: string; // ISO date
  accommodation: string;
  tripType: TripType;
  weatherLow?: number;
  weatherHigh?: number;
  weatherConditions?: string;
  weatherNotes?: string;
  notes?: string;
  createdAt: number;
}

export interface PackingItem {
  id: string;
  tripId: string;
  group: string;
  name: string;
  qty: number;
  notes?: string;
  packed: boolean;
  packLater: boolean;
  requiresCharging: boolean;
  charged: boolean;
  favourite: boolean;
  isGift: boolean;
  giftFor?: string;
  createdAt: number;
}

export interface MasterPackingItem {
  id: string;
  group: string;
  name: string;
  qty: number;
  notes?: string;
  requiresCharging: boolean;
  isGift: boolean;
  giftFor?: string;
}

export interface DepartureTask {
  id: string;
  tripId: string;
  text: string;
  done: boolean;
}
