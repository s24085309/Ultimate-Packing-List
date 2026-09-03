import type { ExportModel } from './packingExport';
import { formatDateRange, statusLine, tripDays, departureCountdown, conditionEmoji } from './packingExport';

function esc(text: string | number | undefined | null): string {
  return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const DOC_STYLE = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Inter, Arial, sans-serif; color: #201a2e; background: #ffffff; }
  .page { width: 794px; padding: 40px 44px; background: #ffffff; }
  .banner { border-radius: 16px; padding: 22px 26px; background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; margin-bottom: 20px; }
  .banner h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: 0.3px; }
  .banner .sub { font-size: 15px; opacity: 0.95; font-weight: 600; }
  .infoGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin-bottom: 18px; }
  .infoItem { font-size: 12.5px; padding: 8px 12px; background: #f6f3fb; border-radius: 10px; border: 1px solid #ece6f7; }
  .infoItem b { display: block; color: #7c3aed; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
  .progressWrap { margin: 18px 0 22px; }
  .progressLabel { font-size: 13px; font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between; }
  .progressBar { height: 14px; border-radius: 999px; background: #eee5fb; overflow: hidden; }
  .progressFill { height: 100%; background: linear-gradient(90deg, #a855f7, #22d3ee); }
  h2.section { font-size: 15px; margin: 22px 0 8px; color: #7c3aed; border-bottom: 2px solid #ede4fb; padding-bottom: 4px; }
  h3.group { font-size: 13px; margin: 14px 0 6px; color: #201a2e; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  table.items td { padding: 4px 6px; font-size: 12.5px; border-bottom: 1px solid #f0eaf9; vertical-align: top; }
  td.chk { width: 22px; font-size: 14px; }
  td.qty { color: #7c3aed; font-weight: 600; white-space: nowrap; width: 60px; }
  td.notes { color: #7a7188; font-style: italic; }
  .packed-row { color: #a9a2ba; text-decoration: line-through; }
  .tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 999px; background: #fde8f4; color: #db2777; margin-left: 6px; }
  .status { margin-top: 26px; text-align: center; padding: 16px; border-radius: 14px; font-size: 20px; font-weight: 800; }
  .status.ready { background: #dcfce7; color: #15803d; }
  .status.notready { background: #ffedd5; color: #c2410c; }
  .footerNote { margin-top: 10px; text-align: center; font-size: 10.5px; color: #a29ab8; }
  .empty { font-size: 12px; color: #a29ab8; font-style: italic; }
  .countdown { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.22); font-size: 12.5px; font-weight: 700; }
  .forecastRow { display: flex; gap: 8px; overflow-x: auto; margin: 4px 0 18px; }
  .forecastDay { flex-shrink: 0; min-width: 62px; text-align: center; padding: 8px 6px; border-radius: 10px; background: #f6f3fb; border: 1px solid #ece6f7; }
  .forecastDay .d { font-size: 10.5px; font-weight: 700; color: #7c3aed; }
  .forecastDay .e { font-size: 18px; margin: 3px 0; }
  .forecastDay .t { font-size: 11.5px; font-weight: 700; }
  .forecastDay .t .lo { color: #7a7188; font-weight: 500; }
  .forecastDay .c { font-size: 9px; color: #a389d4; margin-top: 2px; }
`;

function infoGrid(model: ExportModel): string {
  const { trip } = model;
  const items = [
    ['Destination(s)', trip.destinations],
    ['Departure', trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : '—'],
    ['Return', trip.returnDate ? new Date(trip.returnDate).toLocaleDateString() : '—'],
    ['Duration', `${tripDays(trip)} day${tripDays(trip) === 1 ? '' : 's'}`],
    ['Accommodation', trip.accommodation || '—'],
    ['Trip Type', trip.tripType],
  ];
  return `<div class="infoGrid">${items.map(([l, v]) => `<div class="infoItem"><b>${esc(l)}</b>${esc(v)}</div>`).join('')}</div>`;
}

function weatherBlock(model: ExportModel): string {
  const { trip, options } = model;
  const hasDaily = (trip.weatherDaily?.length ?? 0) > 0;
  if (!options.includeWeather || (!trip.weatherConditions && !trip.weatherNotes && trip.weatherLow == null && !hasDaily)) return '';
  const range = trip.weatherLow != null || trip.weatherHigh != null ? `${trip.weatherLow ?? '?'}°–${trip.weatherHigh ?? '?'}°` : '';
  const forecastHtml = hasDaily ? `
    <div class="forecastRow">
      ${trip.weatherDaily!.map((d, i) => `
        <div class="forecastDay">
          <div class="d">${esc(d.day || `Day ${i + 1}`)}</div>
          <div class="e">${conditionEmoji(d.conditions)}</div>
          <div class="t">${d.high != null ? `${d.high}°` : '—'} <span class="lo">${d.low != null ? `${d.low}°` : ''}</span></div>
          ${d.city ? `<div class="c">${esc(d.city)}</div>` : ''}
        </div>`).join('')}
    </div>` : '';
  return `
    <h2 class="section">🌦️ Weather Summary</h2>
    ${forecastHtml}
    <div class="infoItem" style="max-width: 100%;">
      ${range ? `<b>Expected Range</b>${esc(range)}<br/>` : ''}
      ${trip.weatherConditions ? `<div style="margin-top:4px;">${esc(trip.weatherConditions)}</div>` : ''}
      ${trip.weatherNotes ? `<div style="margin-top:4px; color:#7a7188;">${esc(trip.weatherNotes)}</div>` : ''}
    </div>`;
}

function itemsTable(items: ExportModel['groups'][number]['items'], showNotes: boolean): string {
  if (items.length === 0) return `<div class="empty">Nothing here.</div>`;
  const rows = items.map(i => `
    <tr class="${i.packed ? 'packed-row' : ''}">
      <td class="chk">${i.packed ? '☑' : '☐'}</td>
      <td>${esc(i.name)}${i.isGift ? `<span class="tag">🎁 ${esc(i.giftFor || 'Gift')}</span>` : ''}${i.requiresCharging ? `<span class="tag" style="background:#e0f2fe;color:#0369a1;">🔋 ${i.charged ? 'Charged' : 'Charge'}</span>` : ''}</td>
      <td class="qty">${i.qty > 1 ? `× ${i.qty}` : ''}</td>
      <td class="notes">${showNotes ? esc(i.notes || '') : ''}</td>
    </tr>`).join('');
  return `<table class="items"><tbody>${rows}</tbody></table>`;
}

export function buildPrintableHtml(model: ExportModel): string {
  const { trip, options } = model;
  const status = statusLine(model);

  const groupsHtml = model.groups.length === 0
    ? `<div class="empty">Nothing to pack yet.</div>`
    : model.groups.map(g => `<h3 class="group">${esc(g.group)}</h3>${itemsTable(g.items, options.includeNotes)}`).join('');

  const packLaterHtml = options.includePackLater && model.packLaterItems.length > 0 ? `
    <h2 class="section">⏰ Pack Later</h2>
    ${itemsTable(model.packLaterItems, options.includeNotes)}` : '';

  const chargingHtml = options.includeCharging && model.chargingItems.length > 0 ? `
    <h2 class="section">🔋 Charge Devices</h2>
    <table class="items"><tbody>
      ${model.chargingItems.map(i => `<tr><td class="chk">${i.charged ? '☑' : '☐'}</td><td>${esc(i.name)}</td><td class="notes">${i.charged ? 'Charged' : 'Needs charging'}</td></tr>`).join('')}
    </tbody></table>` : '';

  const giftsHtml = model.giftItems.length > 0 ? `
    <h2 class="section">🎁 Gifts To Take</h2>
    <table class="items"><tbody>
      ${model.giftItems.map(i => `<tr class="${i.packed ? 'packed-row' : ''}"><td class="chk">${i.packed ? '☑' : '☐'}</td><td>${esc(i.name)}${i.qty > 1 ? ` × ${i.qty}` : ''}</td><td class="notes">${esc(i.giftFor ? `for ${i.giftFor}` : '')}</td></tr>`).join('')}
    </tbody></table>` : '';

  const tasksHtml = options.includeDepartureTasks && model.departureTasks.length > 0 ? `
    <h2 class="section">✈️ Departure Tasks</h2>
    <table class="items"><tbody>
      ${model.departureTasks.map(t => `<tr class="${t.done ? 'packed-row' : ''}"><td class="chk">${t.done ? '☑' : '☐'}</td><td colspan="3">${esc(t.text)}</td></tr>`).join('')}
    </tbody></table>` : '';

  return `
    <div class="page">
      <div class="banner">
        <h1>🧽 Ultimate Travel Packing List</h1>
        <div class="sub">${esc(trip.name)} · ${esc(formatDateRange(trip))}</div>
        <div class="countdown">${esc(departureCountdown(trip))}</div>
      </div>
      ${infoGrid(model)}
      ${weatherBlock(model)}
      <div class="progressWrap">
        <div class="progressLabel"><span>📊 Packing Progress</span><span>${model.packedItems}/${model.totalItems} packed (${model.progressPct}%)</span></div>
        <div class="progressBar"><div class="progressFill" style="width:${model.progressPct}%;"></div></div>
      </div>
      <h2 class="section">🧳 To Pack</h2>
      ${groupsHtml}
      ${packLaterHtml}
      ${chargingHtml}
      ${giftsHtml}
      ${tasksHtml}
      <div class="status ${model.ready ? 'ready' : 'notready'}">${status.emoji} ${status.text}</div>
      <div class="footerNote">Generated ${model.generatedAt.toLocaleString()}</div>
    </div>
  `;
}

export function buildStandaloneHtmlDocument(model: ExportModel): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(model.trip.name)} — Packing List</title>
<style>
  ${DOC_STYLE}
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: auto; padding: 0; }
    @page { size: A4; margin: 14mm 12mm; }
  }
</style>
</head>
<body>${buildPrintableHtml(model)}</body>
</html>`;
}

export function docStyleTag(): string {
  return `<style>${DOC_STYLE}</style>`;
}
