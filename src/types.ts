export type TripType = 'Beach' | 'City' | 'Business' | 'Camping' | 'Ski' | 'Cruise' | 'Road Trip' | 'Family Visit' | 'Other';

export const TRIP_TYPES: TripType[] = ['Beach', 'City', 'Business', 'Camping', 'Ski', 'Cruise', 'Road Trip', 'Family Visit', 'Other'];

export interface WeatherDay {
  day: string;
  high?: number;
  low?: number;
  conditions?: string;
}

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
}

export interface DepartureTask {
  id: string;
  tripId: string;
  text: string;
  done: boolean;
}
