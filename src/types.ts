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
