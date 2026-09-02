import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType,
} from 'docx';
import type { ExportModel, MasterExportModel } from './packingExport';
import { statusLine } from './packingExport';

const PURPLE = '9333EA';
const PINK = 'EC4899';
const LIGHT = 'F5F3FF';
const GREY = '6B7280';

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
}

function infoLine(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: GREY }),
      new TextRun({ text: value || '—' }),
    ],
  });
}

function checkboxTable(rows: { checked: boolean; primary: string; secondary?: string; tertiary?: string }[], headers: string[]) {
  const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      shading: { type: ShadingType.SOLID, color: PURPLE, fill: PURPLE },
      borders,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })] })],
    })),
  });
  const dataRows = rows.map(r => new TableRow({
    children: [
      new TableCell({ borders, children: [new Paragraph({ text: r.checked ? '☑' : '☐' })], width: { size: 6, type: WidthType.PERCENTAGE } }),
      new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: r.primary, strike: r.checked })] })] }),
      new TableCell({ borders, children: [new Paragraph({ text: r.secondary ?? '' })], width: { size: 12, type: WidthType.PERCENTAGE } }),
      new TableCell({ borders, children: [new Paragraph({ text: r.tertiary ?? '' })] }),
    ],
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
}

export async function buildTripDocx(model: ExportModel): Promise<Blob> {
  const { trip, options } = model;
  const status = statusLine(model);
  const children: (Paragraph | Table)[] = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: '🧽 SPONGIE ULTIMATE TRAVEL PACKING LIST', bold: true, size: 40, color: PURPLE })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: trip.name, bold: true, size: 28, color: PINK })],
  }));

  children.push(heading('✈️ Trip Information'));
  children.push(infoLine('Destination(s)', trip.destinations));
  children.push(infoLine('Departure', trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : '—'));
  children.push(infoLine('Return', trip.returnDate ? new Date(trip.returnDate).toLocaleDateString() : '—'));
  children.push(infoLine('Duration', `${model.days} day${model.days === 1 ? '' : 's'}`));
  children.push(infoLine('Accommodation', trip.accommodation));
  children.push(infoLine('Trip Type', trip.tripType));
  if (trip.notes) children.push(infoLine('Notes', trip.notes));

  if (options.includeWeather && (trip.weatherConditions || trip.weatherNotes || trip.weatherLow != null)) {
    children.push(heading('🌦️ Weather Summary'));
    if (trip.weatherLow != null || trip.weatherHigh != null) {
      children.push(infoLine('Expected Range', `${trip.weatherLow ?? '?'}° – ${trip.weatherHigh ?? '?'}°`));
    }
    if (trip.weatherConditions) children.push(infoLine('Conditions', trip.weatherConditions));
    if (trip.weatherNotes) children.push(infoLine('Notes', trip.weatherNotes));
  }

  children.push(heading('📊 Packing Progress'));
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `${model.packedItems} of ${model.totalItems} items packed (${model.progressPct}%)`, bold: true })],
  }));

  children.push(heading('🧳 To Pack'));
  if (model.groups.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'Nothing to pack here.', italics: true })] }));
  }
  for (const g of model.groups) {
    children.push(new Paragraph({ text: g.group, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(checkboxTable(
      g.items.map(i => ({
        checked: i.packed,
        primary: i.qty > 1 ? `${i.name} × ${i.qty}` : i.name,
        secondary: options.includeNotes ? (i.notes ?? '') : '',
        tertiary: i.isGift ? `🎁 ${i.giftFor ? `for ${i.giftFor}` : 'Gift'}` : '',
      })),
      ['✓', 'Item', 'Notes', 'Gift'],
    ));
  }

  if (options.includePackLater && model.packLaterItems.length > 0) {
    children.push(heading('⏰ Pack Later'));
    children.push(checkboxTable(
      model.packLaterItems.map(i => ({ checked: i.packed, primary: i.qty > 1 ? `${i.name} × ${i.qty}` : i.name, secondary: i.group })),
      ['✓', 'Item', 'Group'],
    ));
  }

  if (options.includeCharging && model.chargingItems.length > 0) {
    children.push(heading('🔋 Charge Devices'));
    children.push(checkboxTable(
      model.chargingItems.map(i => ({ checked: i.charged, primary: i.name, secondary: i.charged ? 'Charged' : 'Needs charging' })),
      ['✓', 'Device', 'Status'],
    ));
  }

  if (model.giftItems.length > 0) {
    children.push(heading('🎁 Gifts To Take'));
    children.push(checkboxTable(
      model.giftItems.map(i => ({ checked: i.packed, primary: i.qty > 1 ? `${i.name} × ${i.qty}` : i.name, secondary: i.giftFor ?? '' })),
      ['✓', 'Gift', 'For'],
    ));
  }

  if (options.includeDepartureTasks && model.departureTasks.length > 0) {
    children.push(heading('✈️ Departure Tasks'));
    children.push(checkboxTable(
      model.departureTasks.map(t => ({ checked: t.done, primary: t.text })),
      ['✓', 'Task'],
    ));
  }

  children.push(new Paragraph({
    spacing: { before: 400 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `${status.emoji} ${status.text}`, bold: true, size: 32, color: model.ready ? '22C55E' : 'F97316' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: `Generated by Spongie on ${model.generatedAt.toLocaleString()}`, italics: true, size: 18, color: GREY })],
  }));

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
    background: { color: 'FFFFFF' },
  });
  return Packer.toBlob(doc);
}

export async function buildMasterDocx(model: MasterExportModel): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: '🧽 SPONGIE — MASTER PACKING LIBRARY', bold: true, size: 36, color: PURPLE })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: `${model.groups.reduce((n, g) => n + g.items.length, 0)} items across ${model.groups.length} groups`, color: GREY })],
  }));
  for (const g of model.groups) {
    children.push(heading(g.group, HeadingLevel.HEADING_2));
    children.push(checkboxTable(
      g.items.map(i => ({ checked: false, primary: i.qty > 1 ? `${i.name} × ${i.qty}` : i.name, secondary: i.notes ?? '', tertiary: i.isGift ? '🎁 Gift' : (i.requiresCharging ? '🔋 Charging' : '') })),
      ['☐', 'Item', 'Notes', 'Tags'],
    ));
  }
  const doc = new Document({ sections: [{ properties: {}, children }], background: { color: LIGHT } });
  return Packer.toBlob(doc);
}
