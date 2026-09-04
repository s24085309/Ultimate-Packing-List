import type { Trip, PackingItem, DepartureTask, MasterPackingItem } from '../types';

export function conditionEmoji(conditions: string | undefined): string {
  const c = (conditions ?? '').toLowerCase();
  if (c.includes('snow')) return '❄️';
  if (c.includes('storm') || c.includes('thunder')) return '⛈️';
  if (c.includes('rain') || c.includes('shower')) return '🌧️';
  if ((c.includes('cloud') && (c.includes('sun') || c.includes('partly'))) || c.includes('partly')) return '⛅';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('sun') || c.includes('clear')) return '☀️';
  return '🌤️';
}

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

// The category order from the original packing spreadsheet. Groups are kept in this
// order everywhere (trip view, PDF/Word/Excel/HTML export, Master Library) instead of
// being re-alphabetized — any group not in this list keeps its natural first-seen order.
export const CANONICAL_GROUP_ORDER = [
  '🧼 Hygiene', '👖 Clothes', '🛝 Basics', '🏫 School', '📝 Pre-Trip Prep',
  '✈️ Travelling Docs', '🧑‍💻 Technology', '🎁 Gifts',
];

export function sortGroupsCanonical<T extends { group: string }>(groups: T[]): T[] {
  const rank = new Map(CANONICAL_GROUP_ORDER.map((g, i) => [g, i]));
  return groups
    .map((g, i) => ({ g, i, r: rank.has(g.group) ? rank.get(g.group)! : CANONICAL_GROUP_ORDER.length + i }))
    .sort((a, b) => a.r - b.r)
    .map(x => x.g);
}

// Sorts Master Library items by their manually-set `order` (from drag/reorder controls),
// falling back to the array's own order for items that have never been reordered.
export function sortMasterItems<T extends { order?: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, effective: item.order ?? index }))
    .sort((a, b) => a.effective - b.effective)
    .map(x => x.item);
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
  return sortGroupsCanonical(Array.from(map.entries()).map(([group, items]) => ({ group, items })));
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

  const groups = groupBy(mainItems);

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
  const groups = sortGroupsCanonical(Array.from(map.entries()).map(([group, items]) => ({ group, items: sortMasterItems(items) })));
  return { groups, generatedAt: new Date() };
}

// ---------- CSV ----------

function csvCell(value: string | number | boolean | undefined | null): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRows(rows: (string | number | boolean | undefined | null)[][]): string {
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}

export function buildMasterCsv(masterItems: MasterPackingItem[]): string {
  const { groups } = buildMasterExportModel(masterItems);
  const rows: (string | number | boolean)[][] = [['Group', 'Item', 'Quantity', 'Notes', 'Requires Charging', 'Gift', 'Gift For']];
  for (const g of groups) {
    for (const i of g.items) {
      rows.push([g.group, i.name, i.qty, i.notes ?? '', i.requiresCharging ? 'Yes' : 'No', i.isGift ? 'Yes' : 'No', i.giftFor ?? '']);
    }
  }
  return csvRows(rows);
}

export function buildTripCsv(model: ExportModel): string {
  const rows: (string | number | boolean)[][] = [['Group', 'Item', 'Quantity', 'Packed', 'Pack Later', 'Requires Charging', 'Notes', 'Gift', 'Gift For']];
  for (const g of model.groups) {
    for (const i of g.items) {
      rows.push([g.group, i.name, i.qty, i.packed ? 'Yes' : 'No', i.packLater ? 'Yes' : 'No', i.requiresCharging ? 'Yes' : 'No', i.notes ?? '', i.isGift ? 'Yes' : 'No', i.giftFor ?? '']);
    }
  }
  return csvRows(rows);
}

// ---------- Plain text / email ----------

export function buildMasterPlainText(masterItems: MasterPackingItem[]): string {
  const { groups } = buildMasterExportModel(masterItems);
  const lines: string[] = ['🧽 Master Packing Library', ''];
  for (const g of groups) {
    lines.push(g.group);
    for (const i of g.items) {
      lines.push(`  - ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}${i.requiresCharging ? ' (needs charging)' : ''}${i.isGift ? ` (gift${i.giftFor ? ` for ${i.giftFor}` : ''})` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function buildTripPlainText(model: ExportModel): string {
  const lines: string[] = [`🧽 ${model.trip.name} — Packing List`, formatDateRange(model.trip), ''];
  for (const g of model.groups) {
    lines.push(g.group);
    for (const i of g.items) {
      lines.push(`  ${i.packed ? '[x]' : '[ ]'} ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}${i.requiresCharging ? ' (needs charging)' : ''}${i.isGift ? ` (gift${i.giftFor ? ` for ${i.giftFor}` : ''})` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function mailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- Filenames ----------

function slug(text: string): string {
  return (text || 'Trip').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Trip';
}

export function filenameFor(trip: Trip, ext: string): string {
  const year = trip.departureDate ? new Date(trip.departureDate).getFullYear() : new Date().getFullYear();
  return `${slug(trip.name)}_${year}_Packing_List.${ext}`;
}

export function masterFilenameFor(ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Master_Packing_Library_${date}.${ext}`;
}

export function statusLine(model: ExportModel): { emoji: string; text: string } {
  return model.ready
    ? { emoji: '🟢', text: 'READY TO GO!' }
    : { emoji: '🟠', text: 'NOT QUITE READY' };
}

export function departureCountdown(trip: Trip): string {
  if (!trip.departureDate) return '';
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dep = new Date(trip.departureDate); dep.setHours(0, 0, 0, 0);
  const daysToDep = Math.round((dep.getTime() - now.getTime()) / 86400000);
  if (daysToDep > 1) return `🛫 Departs in ${daysToDep} days`;
  if (daysToDep === 1) return `🛫 Departs tomorrow!`;
  if (daysToDep === 0) return `🛫 Departing today!`;
  if (trip.returnDate) {
    const ret = new Date(trip.returnDate); ret.setHours(0, 0, 0, 0);
    if (now.getTime() <= ret.getTime()) return `✈️ Trip in progress`;
  }
  return `✅ Trip completed`;
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
