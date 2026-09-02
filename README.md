# 🧽 Spongie Ultimate Travel Packing List

This repo is a **reference snapshot** of the Spongie Ultimate Travel Packing List
feature, extracted from [s24085309/Home-Dashboard](https://github.com/s24085309/Home-Dashboard)
(see [PR #7](https://github.com/s24085309/Home-Dashboard/pull/7)), where it lives
as one page inside a larger touchscreen home-dashboard app.

**This repo is not standalone-runnable as-is.** It contains the actual feature
source files, unmodified, so the implementation is easy to read, review, or
lift into another project — but `useStore.ts`, `db.ts`, and `demoData.ts` still
carry the rest of the dashboard app's state (widgets, recipes, calendar sync,
etc.) alongside the packing-specific pieces, and `shared.module.css` /
`PackingPage.tsx` reference the dashboard's theme (`--grad-a`, `.glass`, etc.)
and layout shell (`Portal`, `lucide-react` icons). The canonical, actively
maintained version — kept in sync going forward — is the one in Home-Dashboard.

## What's here

- **`src/pages/PackingPage.tsx`** — trip management, packing groups/items
  (quantity, notes, pack later, charging, favourites, gifts for friends),
  departure tasks, and the Master Packing Library.
- **`src/components/PackingExportMenu.tsx`** — the Export/Share modal:
  PDF, Word, Excel, HTML, Print, and native Share, plus export options,
  Quick PDF, and Export Current View.
- **`src/lib/packingExport.ts`** — the shared export data model, filename
  rules, and the "READY TO GO! / NOT QUITE READY" status logic.
- **`src/lib/packingPrintHtml.ts` + `src/lib/packingPdf.ts`** — the printable
  A4 HTML document, PDF export (jsPDF + html2canvas) with header/footer/page
  numbers, the browser Print flow, and the standalone `.html` export.
- **`src/lib/packingWord.ts`** — real, editable `.docx` export via the `docx`
  library.
- **`src/lib/packingExcel.ts`** — real `.xlsx` export via `exceljs`, with the
  7 worksheets (Summary, Packing List, Packed, Not Packed, Pack Later,
  Charging, Departure Tasks).
- **`src/types.ts`, `src/store/db.ts`, `src/store/useStore.ts`,
  `src/store/demoData.ts`** — the Dexie schema, Zustand store actions, and
  seed data (including the full Master Packing Library, imported from the
  user's own spreadsheet) that the feature depends on.
- **`src/widgets/shared.module.css`** — the shared button/list/input styles
  the packing UI uses from the dashboard's design system.

## Backup vs. Export

Two distinct, separate mechanisms:

- **💾 Backup** (`exportBackup`/`importBackup` in `useStore.ts`) — a complete
  internal-data JSON export/import for restoring the whole app.
- **📤 Export** (this feature) — human-readable PDF/Word/Excel/HTML documents
  for printing, sharing, viewing, and editing. Never used as the backup
  mechanism.
