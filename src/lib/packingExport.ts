import type { Trip, PackingItem, DepartureTask, MasterPackingItem } from '../types';

// ---------- Options & filters ----------

export interface ExportOptions {
  includePacked: boolean;
  includePackLater: boolean;
  includeNotes: boolean;
  includeWeather: boolean;
  includeDepartureTasks: boolean;
  includeCharging: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includePacked: true,
  includePackLater: true,
  includeNotes: true,
  includeWeather: true,
  includeDepartureTasks: true,
  includeCharging: true,
};

export type ViewFilter = 'all' | 'notPacked' | 'packLater' | 'charging' | 'gifts';

export const VIEW_FILTER_LABEL: Record<ViewFilter, string> = {
  all: 'Everything',
  notPacked: 'Not Packed',
  packLater: 'Pack Later',
  charging: 'Charging',
  gifts: 'Gifts',
};

export interface GroupedItems {
  group: string;
  items: PackingItem[];
}

export interface ExportModel {
  trip: Trip;
  days: number;
  totalItems: number;
  packedItems: number;
  progressPct: number;
  groups: GroupedItems[];
  packLaterItems: PackingItem[];
  chargingItems: PackingItem[];
  giftItems: PackingItem[];
  departureTasks: DepartureTask[];
  ready: boolean;
  generatedAt: Date;
  options: ExportOptions;
  viewFilter: ViewFilter;
}

function groupBy(items: PackingItem[]): GroupedItems[] {
  const map = new Map<string, PackingItem[]>();
  for (const item of items) {
    const key = item.group || 'Other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

export function tripDays(trip: Trip): number {
  if (!trip.departureDate || !trip.returnDate) return 0;
  const ms = new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function buildExportModel(
  trip: Trip,
  allItems: PackingItem[],
  allTasks: DepartureTask[],
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  viewFilter: ViewFilter = 'all',
): ExportModel {
  let items = allItems.filter(i => i.tripId === trip.id);
  const totalItems = items.length;
  const packedItems = items.filter(i => i.packed).length;
  const progressPct = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  if (viewFilter === 'notPacked') items = items.filter(i => !i.packed);
  else if (viewFilter === 'packLater') items = items.filter(i => i.packLater);
  else if (viewFilter === 'charging') items = items.filter(i => i.requiresCharging);
  else if (viewFilter === 'gifts') items = items.filter(i => i.isGift);
  else if (!options.includePacked) items = items.filter(i => !i.packed);

  const mainItems = viewFilter === 'all'
    ? items.filter(i => !i.packLater)
    : items;

  const groups = groupBy(mainItems).sort((a, b) => a.group.localeCompare(b.group));

  const packLaterItems = viewFilter === 'all' && options.includePackLater
    ? allItems.filter(i => i.tripId === trip.id && i.packLater && (options.includePacked || !i.packed))
    : [];

  const chargingItems = viewFilter === 'all' && options.includeCharging
    ? allItems.filter(i => i.tripId === trip.id && i.requiresCharging && (options.includePacked || !i.packed))
    : [];

  const giftItems = allItems.filter(i => i.tripId === trip.id && i.isGift && (viewFilter !== 'all' || options.includePacked || !i.packed));

  const departureTasks = viewFilter === 'all' && options.includeDepartureTasks
    ? allTasks.filter(t => t.tripId === trip.id)
    : [];

  const ready = totalItems > 0 && packedItems === totalItems &&
    (options.includeDepartureTasks ? allTasks.filter(t => t.tripId === trip.id).every(t => t.done) : true);

  return {
    trip, days: tripDays(trip), totalItems, packedItems, progressPct,
    groups, packLaterItems, chargingItems, giftItems, departureTasks,
    ready, generatedAt: new Date(), options, viewFilter,
  };
}

export interface MasterExportModel {
  groups: GroupedItems2[];
  generatedAt: Date;
}
interface GroupedItems2 { group: string; items: MasterPackingItem[] }

export function buildMasterExportModel(masterItems: MasterPackingItem[]): MasterExportModel {
  const map = new Map<string, MasterPackingItem[]>();
  for (const item of masterItems) {
    const key = item.group || 'Other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const groups = Array.from(map.entries())
    .map(([group, items]) => ({ group, items }))
    .sort((a, b) => a.group.localeCompare(b.group));
  return { groups, generatedAt: new Date() };
}

// ---------- Filenames ----------

function slug(text: string): string {
  return (text || 'Trip').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Trip';
}

export function filenameFor(trip: Trip, ext: string): string {
  const year = trip.departureDate ? new Date(trip.departureDate).getFullYear() : new Date().getFullYear();
  return `Spongie_${slug(trip.name)}_${year}_Packing_List.${ext}`;
}

export function masterFilenameFor(ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Spongie_Master_Packing_Library_${date}.${ext}`;
}

export function statusLine(model: ExportModel): { emoji: string; text: string } {
  return model.ready
    ? { emoji: '🟢', text: 'READY TO GO!' }
    : { emoji: '🟠', text: 'NOT QUITE READY' };
}

export function formatDateRange(trip: Trip): string {
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  return `${fmt(trip.departureDate)} → ${fmt(trip.returnDate)}`;
}

// ---------- File download / share helpers ----------

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareOrDownloadBlob(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const file = new File([blob], filename, { type: blob.type });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], title });
      return 'shared';
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return 'failed';
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}
