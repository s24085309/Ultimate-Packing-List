# 🧽 Ultimate Travel Packing List

A standalone, installable web app for trip packing: trips with a day-by-day
weather forecast and departure countdown, packing groups/items (quantity,
notes, pack later, charging, favourites, gifts for friends), departure
tasks, and a shared Master Packing Library — plus a full export system
(PDF, Word, Excel, HTML, Print, native Share).

This started as a feature inside [s24085309/Home-Dashboard](https://github.com/s24085309/Home-Dashboard)
and now lives here as its own app, kept in sync with that version going
forward.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL. All data is stored locally in the browser
(IndexedDB via Dexie) — nothing leaves your device.

## Using it on your phone

Open the deployed URL in Safari (iPhone/iPad) or Chrome (Android), then
**Share → Add to Home Screen**. It installs as a full-screen app and works
offline after the first load.

## Features

- **Trips** — destinations, dates, accommodation, trip type, a manual
  weather summary plus an optional day-by-day forecast strip, and a live
  "Departs in N days" countdown.
- **Packing groups & items** — quantity, notes, pack-later, requires
  charging (with a charged toggle), favourites, and gifts to take on
  behalf of friends.
- **Master Packing Library** — a reusable item library (pre-seeded with a
  ~170-item starter list) you can add to any trip in one tap.
- **Departure tasks** — a simple pre-departure checklist per trip.
- **Export / Share**
  - **PDF** — a professional A4 checklist (jsPDF + html2canvas) with
    header/footer/page numbers, a dedicated **Print** action, and a
    one-tap **Quick PDF**.
  - **Word** — a real, editable `.docx` (via `docx`), not a renamed file.
  - **Excel** — a real `.xlsx` (via `exceljs`) with 7 worksheets: Summary,
    Packing List, Packed, Not Packed, Pack Later, Charging, Departure Tasks.
  - **HTML** — a self-contained `.html` file that opens in any browser.
  - **Share** — the native Web Share API (AirDrop/Mail/Messages/etc. on
    iPhone/iPad), falling back to a plain download.
  - Export options, **Export Current View** for whichever filter tab is
    open, and a separate Master Library export independent of any trip.

## Backup vs. Export

Two distinct, separate mechanisms:

- **💾 Backup** (`exportBackup`/`importBackup` in `useStore.ts`) — a complete
  internal-data JSON export/import for restoring the whole app.
- **📤 Export** (the feature above) — human-readable PDF/Word/Excel/HTML
  documents for printing, sharing, viewing, and editing. Never used as the
  backup mechanism.

## Stack

React + TypeScript + Vite, Zustand for state, Dexie (IndexedDB) for local
storage, `docx`/`exceljs`/`jspdf`+`html2canvas` for exports, deployed to
GitHub Pages as an installable PWA.
