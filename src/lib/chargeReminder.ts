import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const NOTIFIED_KEY = 'packing-charge-reminder-notified';
const CHECK_INTERVAL_MS = 30_000;
const REMINDER_HOURS_BEFORE = 3;

function loadNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotified(ids: Set<string>) {
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

export interface ChargeReminder {
  tripId: string;
  tripName: string;
  itemNames: string[];
}

// Fires (at most once per trip) a "charge your devices" reminder exactly
// REMINDER_HOURS_BEFORE hours ahead of a trip's departureDate+departureTime,
// listing any Technology items still flagged requiresCharging but not yet
// charged. Requires the app to be open at that moment — this checks on an
// interval while running, it isn't a true background/push notification.
export function useChargeReminder(): [ChargeReminder | null, () => void] {
  const trips = useStore(s => s.trips);
  const packingItems = useStore(s => s.packingItems);
  const [reminder, setReminder] = useState<ChargeReminder | null>(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignore */ });
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const notified = loadNotified();
      const now = Date.now();
      for (const trip of trips) {
        if (!trip.departureTime || notified.has(trip.id)) continue;
        const departureAt = new Date(`${trip.departureDate}T${trip.departureTime}`).getTime();
        if (Number.isNaN(departureAt)) continue;
        const reminderAt = departureAt - REMINDER_HOURS_BEFORE * 3600_000;
        if (now < reminderAt || now >= departureAt) continue;

        const unchargedItems = packingItems.filter(
          i => i.tripId === trip.id && i.requiresCharging && !i.charged,
        );
        const itemNames = unchargedItems.map(i => i.name);
        const body = itemNames.length
          ? `Still to charge: ${itemNames.join(', ')}`
          : 'Everything on your charge list is already charged — nice.';

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification(`🔋 Charge your devices — ${trip.name} departs in ${REMINDER_HOURS_BEFORE} hours`, { body }); } catch { /* ignore */ }
        }
        setReminder({ tripId: trip.id, tripName: trip.name, itemNames });

        notified.add(trip.id);
        saveNotified(notified);
      }
    };
    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [trips, packingItems]);

  return [reminder, () => setReminder(null)];
}
