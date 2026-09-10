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
export const APP_VERSION = '6.9.66';

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
  {
    version: '6.9.33',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed the whole app shifting/clipping off to the right when text size was enlarged, and titles/headings no longer scaling along with the rest of the text — text-size scaling now uses a proper transform instead of the old zoom-based approach, which also fixes every other size-related UI quirk in one go. Also added a one-time "Connect Cloud Sync?" pop-up on first launch that takes you straight to sign-in when tapped.',
  },
  {
    version: '6.9.34',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: "Fixed pull-down-to-refresh not actually picking up the newest deployed version. It was telling the service worker to activate a new version before that version had finished downloading and installing in the background, so the refresh just reloaded the same old version. It now waits for the new version to finish installing first.",
  },
  {
    version: '6.9.35',
    date: '2026-09-07',
    category: 'Settings / Configuration Change',
    description: "Cloud Sync now explicitly sets local (IndexedDB-based) sign-in persistence, so you never have to re-enter your email/password after the app updates to a new version — that storage is separate from the service worker's cache and is untouched by deploys. Also confirmed: every change to the Master Library or its group order is written straight to on-device storage the instant you make it, not just when a new version is pushed, so nothing is ever at risk of being lost.",
  },
  {
    version: '6.9.36',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'If you\'re signed in but Cloud Sync can\'t reach the server — whether that\'s the moment the app opens or the connection drops while you\'re using it — a pop-up now appears every time, showing when you were last connected and a "Try Again" button to reconnect immediately.',
  },
  {
    version: '6.9.37',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Each group heading while packing now shows how many you\'ve packed out of the total, e.g. "Shoes (1 / 6) — 5 items left to pack", updating the moment you tick an item off — instead of just the total item count.',
  },
  {
    version: '6.9.38',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Group names can now be renamed — tap the pencil next to a group heading (in the Master Library or while packing a trip), type the new name, and it updates that group everywhere: the Master Library and every trip that uses it.',
  },
  {
    version: '6.9.39',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Three changes: (1) items already in the 🎁 Gifts group no longer show a redundant "gift" tag next to their name. (2) Creating a new trip now shows a checklist of Master Library groups to seed it with — untick anything you won\'t need (e.g. skip "Ski Gear" for a beach trip) instead of always getting everything. (3) Items can now be given a "per day" quantity instead of a flat number — e.g. underwear at 2/day on a 4-day trip packs as 8, recalculating automatically if you change the trip\'s dates.',
  },
  {
    version: '6.9.40',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'On iPad (and other wide screens), the packing groups no longer leave big empty gaps beneath short groups — they now flow into columns like masonry instead of a fixed grid. Each item card is also tinted and outlined with a neon glow in its group\'s own colour, matching the colour of that group\'s heading.',
  },
  {
    version: '6.9.41',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added two independent trackers while packing a trip: "⚡️Charge before you leave" and "🔌 Cables to Bring". Tap the battery icon on any item ("🔋 Charge Me") to add it to the charge tracker, and the new cable icon (outline when off, 🔌 when on) to add it to the cable tracker — each tracker has its own tick-off checkbox, completely separate from ticking the item packed in its own group.',
  },
  {
    version: '6.9.42',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: 'Fixed a real bug: Settings → 🗑️ Danger Zone → "Clear All Trip Data" said "The Master Library is never touched by this" but was actually deleting it too. It now only clears trips, packing items, and departure tasks, exactly as promised.',
  },
  {
    version: '6.9.43',
    date: '2026-09-07',
    category: 'Bug Fix',
    description: "Fixed a real data-loss risk in Cloud Sync: it had no merge logic — every sync was a whole-document overwrite in both directions, so a device (or the other app) with an empty or thinner Master Library could silently wipe a fuller one just by opening the app, no button pressed. Cloud Sync now refuses to pull down an empty snapshot over non-empty local data.",
  },
  {
    version: '6.9.44',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added Settings → 💾 Backup → "Import Master Library Only" — restores just the Master Library from a JSON file without touching trips, packing items, or departure tasks, unlike a full Import Backup which replaces everything at once.',
  },
  {
    version: '6.9.45',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'The 🔋 Charge Me and 🔌 cable icons on a trip item now only show up for items in the 🧑‍💻 Technology group — everywhere else, those trackers wouldn\'t make sense, so the icons no longer clutter every item row.',
  },
  {
    version: '6.9.46',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Trip setup now has an optional Departure Time field. When set, a "🔋 Charge your devices" reminder fires 3 hours before departure (while the app is open), listing anything still on the charge tracker that isn\'t charged yet.',
  },
  {
    version: '6.9.47',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added a "⭐ Favourites" filter next to Not Packed / Pack Later / Charging / Gifts — tap the star on any item to flag it as a must-pack, then use this filter to see only your starred items and make sure every one of them is packed.',
  },
  {
    version: '6.9.48',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'The Pack Later icon on each item is now a proper alarm-clock icon — outlined and grey when off, filled and purple (with a checkmark) when on — matching the same outline/filled style as the Charge and Cable icons, instead of a plain ⏰ emoji.',
  },
  {
    version: '6.9.49',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Added Settings → 📁 Auto-Backup To A Folder — pick a folder on your device and the app automatically saves a backup into it every minute, keeping only the newest 5 backups and deleting older ones. (Needs a browser with folder-picker support, like Chrome/Edge — not currently available in Safari.) Also removed the "Gifts" filter chip.',
  },
  {
    version: '6.9.50',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Removed the ⭐ Favourites star and its filter — Pack Later already covers "make sure this gets packed", so the star was redundant. The Excel export no longer has a Favourite column either.',
  },
  {
    version: '6.9.51',
    date: '2026-09-07',
    category: 'New Feature',
    description: 'Edit Trip now has a "Show/Hide Packing Groups" section — untick any group you don\'t need for this trip (e.g. Ski Gear on a beach trip) and it disappears from the packing view and every export, without deleting the items inside it. Tick it again any time to bring it back.',
  },
  {
    version: '6.9.52',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'A group with everything ticked off now moves into a collapsed "Packed 🥳" section — tap it to expand and see every fully-packed group, each shown with a strikethrough. Shows how many groups are packed out of the total selected for the trip (e.g. 12/19, 7 outstanding). Fixed the Excel export\'s item counts to correctly exclude any groups you\'ve hidden for the trip.',
  },
  {
    version: '6.9.53',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'A packed item\'s strikethrough text is now a proper grey, instead of just fading slightly — makes it much clearer at a glance which items are already done.',
  },
  {
    version: '6.9.54',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Add Item moved off the packing screen into a ➕ button next to the filter chips, and there\'s a new 🔎 button next to it — search any item across the whole trip by name and mark it packed/unpacked or edit it straight from the results, without hunting through collapsed groups.',
  },
  {
    version: '6.9.55',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Moved the 🔎 Search and ➕ Add Item buttons up to the top toolbar between Export and Settings. Reordered the filter chips to All, Collapse All, Not Packed, Pack Later, and removed the Charging chip (the dedicated Charging tracker section still shows all your charging items).',
  },
  {
    version: '6.9.56',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'Added a "total days" pill next to "Departs in X days" on the trip card, nudged the edit/delete buttons up slightly to sit level with it, and dropped the trip type (e.g. "· City") from underneath the accommodation line.',
  },
  {
    version: '6.9.57',
    date: '2026-09-07',
    category: 'UI / Design Change',
    description: 'The "Departs in X days" and "X days total" pills on the trip card now stay grouped together as a pair, so the total-days pill always sits directly to the right of the departure pill instead of being able to wrap onto its own line.',
  },
  {
    version: '6.9.58',
    date: '2026-09-08',
    category: 'Bug Fix',
    description: 'Fixed being unable to change an item\'s quantity (e.g. underwear) when it had a "per day" amount set — the Quantity field was locked in that case. Now typing a new quantity directly always works, and clears the per-day amount so your typed number sticks.',
  },
  {
    version: '6.9.59',
    date: '2026-09-08',
    category: 'Bug Fix',
    description: 'Fixed the Quantity field snapping back to 1 the instant you deleted it, making it impossible to backspace and type a new number (e.g. deleting "1" to type "2"). You can now clear it and type freely — it only falls back to 1 if left empty.',
  },
  {
    version: '6.9.60',
    date: '2026-09-08',
    category: 'UI / Design Change',
    description: 'Items within a group now sort automatically: packed items sink to the bottom, and everything else is alphabetical — so items with similar names (e.g. every "Shoes …" or "T-Shirt …") end up bunched together, making it much easier to pack like with like. Applies to the packing view and every export.',
  },
  {
    version: '6.9.61',
    date: '2026-09-08',
    category: 'UI / Design Change',
    description: 'The ⚡️Charge and 🔌Cable trackers now also strikethrough a ticked item and sink it to the bottom, matching the packing groups. Also shrank every packing item row by about a third (with a smaller tick circle) so more of the list fits on screen.',
  },
  {
    version: '6.9.62',
    date: '2026-09-09',
    category: 'UI / Design Change',
    description: 'Master Packing Library groups are now sorted alphabetically by their first letter, ignoring the leading emoji (so "🧑‍💻 Technology" sorts under T, not the emoji). Manually reordered groups still keep their custom position.',
  },
  {
    version: '6.9.63',
    date: '2026-09-10',
    category: 'UI / Design Change',
    description: 'Ticking an item off now hides it from its group\'s list by default, so you only see what\'s left to pack — tap the 👁 eye icon on a group\'s heading to reveal its packed items again any time. Each group remembers its own show/hide state independently.',
  },
  {
    version: '6.9.64',
    date: '2026-09-10',
    category: 'UI / Design Change',
    description: 'The ⚡️Charge and 🔌Cable trackers now also hide a ticked item by default, with their own 👁 eye icon on the heading to reveal it again — matching the same behaviour as the packing groups.',
  },
  {
    version: '6.9.65',
    date: '2026-09-10',
    category: 'Bug Fix',
    description: 'Fixed groups jumping around the packing screen every time you ticked an item off — they no longer reorder by how many items are left to pack. Groups now stay in the same order as the Master Library everywhere (trip view, PDF/Word/Excel/print), instead of the old fixed category list.',
  },
  {
    version: '6.9.66',
    date: '2026-09-10',
    category: 'New Feature',
    description: 'The active trip\'s weather now refreshes automatically every time the app is opened or reloaded — no need to reopen Edit Trip and hit refresh yourself. Fails silently and keeps the existing forecast if the live lookup can\'t reach the weather service.',
  },
];

// Newest first, for display.
export function getVersionHistory(): VersionHistoryEntry[] {
  return [...VERSION_HISTORY].reverse();
}
