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
export const APP_VERSION = '6.9.9';

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
  {
    version: '6.9.3',
    date: '2026-09-04',
    category: 'New Feature',
    description: 'Master Library items can now be reordered within their group with ↑/↓ controls (respected everywhere: the library, exports, and new-trip seeding), then locked with a "Lock Order" toggle to hide those controls and keep the order from shifting by accident.',
  },
  {
    version: '6.9.4',
    date: '2026-09-04',
    category: 'Bug Fix',
    description: 'Each Master Library item now has a battery toggle to fix a wrongly-set "requires charging" flag directly (e.g. sunscreen incorrectly marked as needing charging), instead of only being fixable by delete-and-recreate.',
  },
  {
    version: '6.9.5',
    date: '2026-09-04',
    category: 'New Feature',
    description: 'Master Packing Library can now be exported directly (new "Export" button right in the Master Library panel) as CSV, plus Share and Email were enabled for it — alongside the existing PDF/Word/Excel/HTML export options.',
  },
  {
    version: '6.9.6',
    date: '2026-09-04',
    category: 'Bug Fix',
    description: 'Fixed the Departure/Return date fields overlapping and getting clipped on narrow phone screens, and the daily weather forecast row (Day/High/Low/Conditions) being cut off — both now resize and wrap to fit instead of overflowing.',
  },
  {
    version: '6.9.7',
    date: '2026-09-04',
    category: 'UI / Design Change',
    description: 'Renamed the app to "Spongie" (title, home-screen label, and in-app header), moved the version number to the top of Settings, and replaced the static daily-weather emoji with a small live-animated icon (falling rain/snow, pulsing sun, drifting clouds, flashing storm bolt).',
  },
  {
    version: '6.9.8',
    date: '2026-09-04',
    category: 'New Feature',
    description: 'Added an A− / 100% / A+ text-size control right in the main header, and packing groups now lay out in 2-3 columns on wider screens like an iPad instead of one long single column.',
  },
  {
    version: '6.9.9',
    date: '2026-09-04',
    category: 'UI / Design Change',
    description: 'Simplified the text-size control to just A− and A+ buttons, removing the percentage readout in between.',
  },
];

// Newest first, for display.
export function getVersionHistory(): VersionHistoryEntry[] {
  return [...VERSION_HISTORY].reverse();
}
