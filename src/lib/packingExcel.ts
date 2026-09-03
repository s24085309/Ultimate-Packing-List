import ExcelJS from 'exceljs';
import type { Trip, PackingItem, DepartureTask, MasterPackingItem } from '../types';
import { tripDays, statusLine, formatDateRange, departureCountdown, conditionEmoji, type ExportModel } from './packingExport';

const HEADER_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9333EA' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };

function styleHeader(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  row.height = 20;
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach(col => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, cell => {
      const len = String(cell.value ?? '').length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 50);
  });
}

export async function buildTripXlsx(trip: Trip, allItems: PackingItem[], allTasks: DepartureTask[], model: ExportModel): Promise<Blob> {
  const items = allItems.filter(i => i.tripId === trip.id);
  const tasks = allTasks.filter(t => t.tripId === trip.id);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ultimate Travel Packing List';
  wb.created = new Date();

  // Sheet 1 — Summary
  const summary = wb.addWorksheet('Summary');
  summary.columns = [{ width: 26 }, { width: 40 }];
  const status = statusLine(model);
  const summaryRows: [string, string | number][] = [
    ['Trip Name', trip.name],
    ['Departure Countdown', departureCountdown(trip)],
    ['Destination(s)', trip.destinations],
    ['Dates', formatDateRange(trip)],
    ['Duration', `${tripDays(trip)} day(s)`],
    ['Accommodation', trip.accommodation],
    ['Trip Type', trip.tripType],
    ['Overall Progress', `${model.progressPct}%`],
    ['Items Remaining', items.filter(i => !i.packed).length],
    ['Pack Later Count', items.filter(i => i.packLater).length],
    ['Charging Count', items.filter(i => i.requiresCharging).length],
    ['Departure Task Count', tasks.length],
    ['Final Readiness Status', `${status.emoji} ${status.text}`],
  ];
  summary.addRow(['🧽 Ultimate Travel Packing List', '']);
  summary.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF9333EA' } };
  summary.addRow([]);
  for (const [label, value] of summaryRows) summary.addRow([label, value]);
  summary.getColumn(1).font = { bold: true };

  if (trip.weatherDaily && trip.weatherDaily.length > 0) {
    summary.addRow([]);
    const forecastHeaderRow = summary.addRow(['Daily Forecast', 'High / Low', 'Conditions']);
    forecastHeaderRow.font = { bold: true, color: { argb: 'FF9333EA' } };
    trip.weatherDaily.forEach((d, i) => {
      summary.addRow([
        d.day || `Day ${i + 1}`,
        d.high != null ? `${d.high}° / ${d.low ?? '?'}°` : '',
        `${conditionEmoji(d.conditions)} ${d.conditions ?? ''}`,
      ]);
    });
  }

  // Sheet 2 — Packing List
  const list = wb.addWorksheet('Packing List');
  list.columns = [
    { header: 'Packed', key: 'packed', width: 10 },
    { header: 'Item', key: 'item', width: 28 },
    { header: 'Group', key: 'group', width: 20 },
    { header: 'Quantity', key: 'qty', width: 10 },
    { header: 'Pack Later', key: 'packLater', width: 12 },
    { header: 'Requires Charging', key: 'charging', width: 16 },
    { header: 'Charged', key: 'charged', width: 10 },
    { header: 'Favourite', key: 'fav', width: 10 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(list.getRow(1));
  for (const i of items) {
    list.addRow({
      packed: i.packed ? 'Yes' : 'No', item: i.name, group: i.group, qty: i.qty,
      packLater: i.packLater ? 'Yes' : 'No', charging: i.requiresCharging ? 'Yes' : 'No',
      charged: i.requiresCharging ? (i.charged ? 'Yes' : 'No') : '', fav: i.favourite ? 'Yes' : 'No',
      notes: i.notes ?? '',
    });
  }
  list.autoFilter = { from: 'A1', to: 'I1' };

  // Sheet 3 — Packed
  const packed = wb.addWorksheet('Packed');
  packed.columns = [
    { header: 'Item', key: 'item', width: 28 }, { header: 'Group', key: 'group', width: 20 },
    { header: 'Quantity', key: 'qty', width: 10 }, { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(packed.getRow(1));
  items.filter(i => i.packed).forEach(i => packed.addRow({ item: i.name, group: i.group, qty: i.qty, notes: i.notes ?? '' }));

  // Sheet 4 — Not Packed
  const notPacked = wb.addWorksheet('Not Packed');
  notPacked.columns = [
    { header: 'Item', key: 'item', width: 28 }, { header: 'Group', key: 'group', width: 20 },
    { header: 'Quantity', key: 'qty', width: 10 }, { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(notPacked.getRow(1));
  items.filter(i => !i.packed).forEach(i => notPacked.addRow({ item: i.name, group: i.group, qty: i.qty, notes: i.notes ?? '' }));

  // Sheet 5 — Pack Later
  const packLater = wb.addWorksheet('Pack Later');
  packLater.columns = [
    { header: 'Item', key: 'item', width: 28 }, { header: 'Group', key: 'group', width: 20 },
    { header: 'Quantity', key: 'qty', width: 10 }, { header: 'Packed', key: 'packed', width: 10 },
  ];
  styleHeader(packLater.getRow(1));
  items.filter(i => i.packLater).forEach(i => packLater.addRow({ item: i.name, group: i.group, qty: i.qty, packed: i.packed ? 'Yes' : 'No' }));

  // Sheet 6 — Charging
  const charging = wb.addWorksheet('Charging');
  charging.columns = [
    { header: 'Device', key: 'item', width: 28 }, { header: 'Charged', key: 'charged', width: 10 },
    { header: 'Packed', key: 'packed', width: 10 }, { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(charging.getRow(1));
  items.filter(i => i.requiresCharging).forEach(i => charging.addRow({ item: i.name, charged: i.charged ? 'Yes' : 'No', packed: i.packed ? 'Yes' : 'No', notes: i.notes ?? '' }));

  // Sheet 7 — Departure Tasks
  const dep = wb.addWorksheet('Departure Tasks');
  dep.columns = [{ header: 'Task', key: 'text', width: 40 }, { header: 'Done', key: 'done', width: 10 }];
  styleHeader(dep.getRow(1));
  tasks.forEach(t => dep.addRow({ text: t.text, done: t.done ? 'Yes' : 'No' }));

  [list, packed, notPacked, packLater, charging, dep].forEach(autoWidth);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function buildMasterXlsx(masterItems: MasterPackingItem[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ultimate Travel Packing List';
  wb.created = new Date();
  const sheet = wb.addWorksheet('Master Library');
  sheet.columns = [
    { header: 'Item', key: 'item', width: 28 }, { header: 'Group', key: 'group', width: 20 },
    { header: 'Default Qty', key: 'qty', width: 12 }, { header: 'Requires Charging', key: 'charging', width: 16 },
    { header: 'Gift', key: 'gift', width: 10 }, { header: 'Gift For', key: 'giftFor', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(sheet.getRow(1));
  masterItems.forEach(i => sheet.addRow({
    item: i.name, group: i.group, qty: i.qty, charging: i.requiresCharging ? 'Yes' : 'No',
    gift: i.isGift ? 'Yes' : 'No', giftFor: i.giftFor ?? '', notes: i.notes ?? '',
  }));
  sheet.autoFilter = { from: 'A1', to: 'G1' };
  autoWidth(sheet);
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
