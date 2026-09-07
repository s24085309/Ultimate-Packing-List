export type TripType = 'Beach' | 'City' | 'Business' | 'Camping' | 'Ski' | 'Cruise' | 'Road Trip' | 'Family Visit' | 'Other';

export const TRIP_TYPES: TripType[] = ['Beach', 'City', 'Business', 'Camping', 'Ski', 'Cruise', 'Road Trip', 'Family Visit', 'Other'];

export interface WeatherDay {
  day: string;
  date?: string; // ISO date (YYYY-MM-DD), present for auto-fetched days
  high?: number;
  low?: number;
  conditions?: string;
  city?: string;
}

export interface TripCity {
  name: string;
  admin1?: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface Trip {
  id: string;
  name: string;
  destinations: string;
  departureDate: string; // ISO date
  departureTime?: string; // HH:MM, 24-hour — when set, drives the "charge your devices" reminder 3 hours before departure
  returnDate: string; // ISO date
  accommodation: string;
  tripType: TripType;
  cities?: TripCity[];
  weatherLow?: number;
  weatherHigh?: number;
  weatherConditions?: string;
  weatherNotes?: string;
  weatherDaily?: WeatherDay[];
  notes?: string;
  createdAt: number;
}

export interface PackingItem {
  id: string;
  tripId: string;
  group: string;
  name: string;
  qty: number;
  qtyPerDay?: number; // when set, the effective quantity is this × the trip's length in days (recalculated live if the trip dates change), overriding `qty` for display/export
  notes?: string;
  packed: boolean;
  packLater: boolean;
  requiresCharging: boolean; // in the "⚡️Charge before you leave" tracker, independent of `packed`
  charged: boolean; // ticked off within the charging tracker — independent of `packed` in the item's own group
  needsCable: boolean; // in the "🔌 Cables to Bring" tracker, independent of `packed`
  cablePacked: boolean; // ticked off within the cable tracker — independent of `packed` in the item's own group
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
  qtyPerDay?: number; // carried over to a trip item when added, so it starts off computing against that trip's length
  notes?: string;
  requiresCharging: boolean;
  needsCable?: boolean;
  isGift: boolean;
  giftFor?: string;
  archived?: boolean; // soft-deleted — hidden from the active library, restorable, or permanently deletable from the Archive
  ignored?: boolean; // stays in the active library but is skipped when auto-seeding new trips
  order?: number; // manual sort position within its group — undefined falls back to natural array order
}

export interface DepartureTask {
  id: string;
  tripId: string;
  text: string;
  done: boolean;
}

export type ThemeMode = 'dark' | 'light';
export type FontFamilyId = 'default' | 'rounded' | 'serif' | 'mono';
export type FontSizeId = 'small' | 'medium' | 'large' | 'xlarge';

export interface AppSettings {
  id: 'settings';
  themeMode: ThemeMode;
  fontFamily: FontFamilyId;
  fontSize: FontSizeId;
  textColor?: string; // hex — overrides the theme's default text colour when set
  accentColor: string; // hex — overrides the gradient/accent colour
  adminPassword?: string; // gates the Version History panel
  masterListLocked?: boolean; // when true, hides the Master Library's reorder controls
  masterGroupOrder?: string[]; // explicit group display order in the Master Library — unlisted groups fall back to canonical order
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  themeMode: 'dark',
  fontFamily: 'default',
  fontSize: 'medium',
  accentColor: '#a855f7',
  masterListLocked: false,
};

// Each theme's own readable default — used whenever textColor isn't explicitly overridden.
export const THEME_DEFAULT_TEXT_COLOR: Record<ThemeMode, string> = {
  dark: '#f5f3ff',
  light: '#201a2e',
};
