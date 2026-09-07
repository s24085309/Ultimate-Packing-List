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
export const APP_VERSION = '6.9.32';

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
  {
    version: '6.9.10',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Departure/Return dates now open a proper calendar popup (month grid, month/year dropdowns, a "Today" shortcut) instead of the plain native date field.',
  },
  {
    version: '6.9.11',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added real-time cloud sync (Settings → Cloud Sync), backed by a free Firebase project you set up yourself with a step-by-step in-app wizard. Sign in with the same account on multiple devices and trips/Master Library stay in sync automatically.',
  },
  {
    version: '6.9.12',
    date: '2026-09-07',
    category: 'Settings / Configuration Change',
    description: 'Cloud Sync now works out of the box — the Firebase project connection is built into the app, so Settings → Cloud Sync jumps straight to "Sign In / Set Up" with no config values to type in.',
  },
  {
    version: '6.9.13',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed Cloud Sync getting stuck on "Connecting" forever when it hit a permissions or network problem (most commonly unpublished Firestore rules) — it now surfaces a clear "Sync error" with guidance instead of hanging silently.',
  },
  {
    version: '6.9.14',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'The header title and version no longer wrap onto two lines on iPhone — the title now shrinks to fit and truncates with an ellipsis as a last resort. Moved the A− / A+ text-size buttons out of the header and into Settings → Font Size, next to the size presets.',
  },
  {
    version: '6.9.15',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed the header button row (Master Library / Export / Settings) overflowing off the right edge of the screen on iPhone instead of wrapping to a second row.',
  },
  {
    version: '6.9.16',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed Cloud Sync forcing a fresh sign-in on every app launch — a bug in how the Firebase connection was named meant it could never find a previously saved session. Signing in now stays signed in.',
  },
  {
    version: '6.9.17',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'The Departure/Return calendar popup now always opens centred on screen instead of anchored below the date field, so it can never get pushed off the bottom or side of the screen.',
  },
  {
    version: '6.9.18',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: '"Fetch Live Weather for Trip Dates" now explains what\'s missing (add a city, or set both dates) instead of silently doing nothing.',
  },
  {
    version: '6.9.19',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Adding an item (in a trip or the Master Library) now lets you pick its group from a dropdown of existing groups, or create a new one — instead of typing it freehand. Trip items can now be edited (name, group, quantity, notes) via a new pencil icon, and changing an item\'s group here now updates the matching Master Library entry too. In the Master Library, each item has a "move to group" dropdown to move it to a different or brand-new group.',
  },
  {
    version: '6.9.20',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Shrunk the Library / Export / Settings header buttons on the Packing page so all three reliably fit on one row.',
  },
  {
    version: '6.9.21',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: "Fixed the Daily Forecast list going stale after changing the Departure/Return dates — auto-fetched forecast rows for days outside the new date range are now dropped automatically, instead of silently showing days that no longer match the trip.",
  },
  {
    version: '6.9.22',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Destinations is now a proper list — type a place and tap + (or hit Enter) to add it as a chip, with multiple destinations supported. Each one you add is automatically searched and added to "Cities for live weather" too, so Fetch Live Weather is ready to go without manually re-searching every city.',
  },
  {
    version: '6.9.23',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: "Fixed a real off-by-one: the Daily Forecast's day-range builder converted local midnight to UTC (toISOString), which rolls the date back a day in any timezone ahead of UTC — e.g. South Africa (UTC+2) — so a trip set to 11-12 Sep could fetch and label forecasts as 10-11 Sep. Now formats dates in local time throughout.",
  },
  {
    version: '6.9.24',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'With 2+ destinations added, a new "Which destination each day?" list appears — defaults to an even split across your cities, but you can change any day before fetching, so the forecast (and each Daily Forecast row) reflects exactly which city you\'re in on which day, not a guess.',
  },
  {
    version: '6.9.25',
    date: '2026-09-07',
    category: 'New Feature',
    description: "The Master Library now tracks trip items more fully: editing an item's name, group, quantity, or notes updates its Master Library entry to match; deleting an item from a trip archives (not deletes) the matching Master Library entry, so it's recoverable from Archive instead of gone.",
  },
  {
    version: '6.9.26',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Live weather now fetches automatically whenever you add a destination or set/change the trip dates (as long as at least one is already set), instead of requiring a tap on "Fetch Live Weather" every time.',
  },
  {
    version: '6.9.27',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Typing a destination now searches for matching real places as you type (like the city search below) and lets you pick the right one from a dropdown, instead of silently guessing which city you meant.',
  },
  {
    version: '6.9.28',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Pull down from the top of the screen to refresh — checks for and activates the newest version of the app (not just a normal reload), with a spinning refresh icon while you pull.',
  },
  {
    version: '6.9.29',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Tapping a destination chip now searches for it in "Cities for live weather" above and fills in the search box, so you can pick the right match — useful when auto-add didn\'t find (or picked the wrong) city. Also fixed "+ New…" when moving a Master Library item to a new group: it now uses the app\'s own text field (which supports emoji) instead of the phone\'s native prompt dialog, which could refuse emoji the second time you tried it.',
  },
  {
    version: '6.9.30',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Master Library groups can now be reordered with ↑/↓ arrows next to each group name (hidden once you "Lock Order"), and a new "🔋 Charging" button shows every item across the whole library that needs charging — a quick "charge these before you leave" checklist independent of any one trip.',
  },
  {
    version: '6.9.31',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added "Collapse All / Expand All" for groups, in both the Master Library and while packing a trip. While packing, groups now automatically sort by how many items are still left to pack — fewest-remaining first — with a fully-packed group dropping to the bottom out of the way, instead of a fixed order.',
  },
  {
    version: '6.9.32',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed the "choose a group" popup shifting off to the right when text size is enlarged — a known WebKit quirk with native dropdown menus under the zoom-based text scaling. Every "choose a group" control now opens the app\'s own centred pop-up (like the calendar) instead of the phone\'s native dropdown, so it always lands in the right place regardless of text size.',
  },
];

// Newest first, for display.
export function getVersionHistory(): VersionHistoryEntry[] {
  return [...VERSION_HISTORY].reverse();
}
