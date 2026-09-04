// Canonical app version + changelog, using the Y.M.C scheme:
//   Y = last digit of the current year
//   M = month number, no leading zero
//   C = change number within that month, starting at 1, incrementing per shipped change
// C resets to 1 the moment a new month starts.

export type VersionHistoryCategory =
  | 'New Feature'
  | 'Bug Fix'
  | 'UI / Design Change'
  | 'Performance Improvement'
  | 'Security / Permissions Change'
  | 'Settings / Configuration Change'
  | 'Text / Wording Change'
  | 'Backfilled';

export const CATEGORY_EMOJI: Record<VersionHistoryCategory, string> = {
  'New Feature': '✨',
  'Bug Fix': '🐛',
  'UI / Design Change': '🎨',
  'Performance Improvement': '⚡',
  'Security / Permissions Change': '🔒',
  'Settings / Configuration Change': '🔧',
  'Text / Wording Change': '📝',
  Backfilled: '📦',
};

export interface VersionHistoryEntry {
  version: string;
  date: string; // ISO date, or an approximate human string for backfilled entries
  category: VersionHistoryCategory;
  description: string;
  backfilled?: boolean;
}

// The single source of truth for the version shown in the top bar and Settings.
export const APP_VERSION = '6.9.2';

// Chronological, oldest first — new entries are always appended to the end.
// Never remove or edit past entries. Display newest-first (see getVersionHistory()).
export const VERSION_HISTORY: VersionHistoryEntry[] = [
  {
    version: 'pre-6.x',
    date: 'Early September 2026 (approximate)',
    category: 'Backfilled',
    description: 'Ultimate Travel Packing List built as its own standalone app: trips, a Master Packing Library, departure tasks, a dedicated Gifts category, and PDF/Word/Excel/HTML export with print and native share — split out from Home OS but kept in sync with it.',
    backfilled: true,
  },
  {
    version: 'pre-6.x',
    date: 'Early September 2026 (approximate)',
    category: 'Backfilled',
    description: 'Added live weather lookup by city (Open-Meteo geocoding + forecast), per-day city reassignment with an auto-updating trip weather summary, and a proper home-screen icon (sponge + suitcase) with safe-area fixes for iPhone.',
    backfilled: true,
  },
  {
    version: 'pre-6.x',
    date: 'Early September 2026 (approximate)',
    category: 'Backfilled',
    description: 'Master Library overhaul: new trips auto-seed from it, groups became collapsible with colour-coded headers, and items/groups are archived (never hard-deleted) with a restore/permanent-delete Archive panel and a per-item "ignore" toggle.',
    backfilled: true,
  },
  {
    version: 'pre-6.x',
    date: 'Early September 2026 (approximate)',
    category: 'Bug Fix',
    description: 'Stopped alphabetizing packing groups — the trip view, every export format, and the Master Library now keep the original spreadsheet category order (Hygiene, Clothes, Basics, School, Pre-Trip Prep, Travelling Docs, Technology, Gifts).',
    backfilled: true,
  },
  {
    version: '6.9.1',
    date: '2026-09-04',
    category: 'New Feature',
    description: 'Added a Settings screen: font family/size/colour, accent colour, dark/light mode, backup export & import, clear-all-data, an administrator password, and this Y.M.C version number with a neon-pink Version History panel.',
  },
  {
    version: '6.9.2',
    date: '2026-09-04',
    category: 'New Feature',
    description: 'Added a "Past Trips" view: trips whose return date has passed are moved out of the main trip row into a dedicated panel (with dates, packed count, and a way to open or delete each one) instead of cluttering the upcoming-trips list.',
  },
];

// Newest first, for display.
export function getVersionHistory(): VersionHistoryEntry[] {
  return [...VERSION_HISTORY].reverse();
}
