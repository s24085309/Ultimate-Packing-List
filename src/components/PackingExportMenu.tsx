import { useState } from 'react';
import { X, FileText, FileSpreadsheet, FileCode, Printer, Share2, Loader2, CheckSquare, Square, Table, Mail } from 'lucide-react';
import Portal from './Portal';
import type { Trip, PackingItem, DepartureTask, MasterPackingItem } from '../types';
import {
  buildExportModel, buildMasterExportModel, DEFAULT_EXPORT_OPTIONS, filenameFor, masterFilenameFor,
  downloadBlob, shareOrDownloadBlob, VIEW_FILTER_LABEL, buildMasterCsv, buildTripCsv,
  buildMasterPlainText, buildTripPlainText, mailtoHref, type ExportOptions, type ViewFilter,
} from '../lib/packingExport';
import s from '../widgets/shared.module.css';

interface Props {
  trip: Trip | null;
  items: PackingItem[];
  tasks: DepartureTask[];
  masterItems: MasterPackingItem[];
  viewFilter: ViewFilter;
  onClose: () => void;
  scope?: 'trip' | 'master';
}

const OPTION_LABELS: { key: keyof ExportOptions; label: string }[] = [
  { key: 'includePacked', label: 'Include Packed Items' },
  { key: 'includePackLater', label: 'Include Pack Later' },
  { key: 'includeNotes', label: 'Include Notes' },
  { key: 'includeWeather', label: 'Include Weather' },
  { key: 'includeDepartureTasks', label: 'Include Departure Tasks' },
  { key: 'includeCharging', label: 'Include Charging List' },
];

type Busy = 'pdf' | 'word' | 'excel' | 'csv' | 'html' | 'share' | 'print' | 'quickpdf' | 'currentview' | null;

export default function PackingExportMenu({ trip, items, tasks, masterItems, viewFilter, onClose, scope = 'trip' }: Props) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [masterMode, setMasterMode] = useState(scope === 'master');

  const toggle = (key: keyof ExportOptions) => setOptions(o => ({ ...o, [key]: !o[key] }));

  const model = trip ? buildExportModel(trip, items, tasks, options, 'all') : null;

  const run = async (which: Busy, fn: () => Promise<void>) => {
    setBusy(which);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage(`Something went wrong: ${(err as Error)?.message ?? 'export failed'}`);
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = () => trip && model && run('pdf', async () => {
    const { buildPdfBlob } = await import('../lib/packingPdf');
    const blob = await buildPdfBlob(model);
    downloadBlob(blob, filenameFor(trip, 'pdf'));
  });

  const exportWord = () => run('word', async () => {
    if (masterMode) {
      const { buildMasterDocx } = await import('../lib/packingWord');
      const blob = await buildMasterDocx(buildMasterExportModel(masterItems));
      downloadBlob(blob, masterFilenameFor('docx'));
    } else if (trip && model) {
      const { buildTripDocx } = await import('../lib/packingWord');
      const blob = await buildTripDocx(model);
      downloadBlob(blob, filenameFor(trip, 'docx'));
    }
  });

  const exportExcel = () => run('excel', async () => {
    if (masterMode) {
      const { buildMasterXlsx } = await import('../lib/packingExcel');
      const blob = await buildMasterXlsx(masterItems);
      downloadBlob(blob, masterFilenameFor('xlsx'));
    } else if (trip && model) {
      const { buildTripXlsx } = await import('../lib/packingExcel');
      const blob = await buildTripXlsx(trip, items, tasks, model);
      downloadBlob(blob, filenameFor(trip, 'xlsx'));
    }
  });

  const exportHtml = () => trip && model && run('html', async () => {
    const { buildStandaloneHtmlDocument } = await import('../lib/packingPrintHtml');
    const blob = new Blob([buildStandaloneHtmlDocument(model)], { type: 'text/html' });
    downloadBlob(blob, filenameFor(trip, 'html'));
  });

  const exportCsv = () => run('csv', async () => {
    const csv = masterMode ? buildMasterCsv(masterItems) : (model ? buildTripCsv(model) : '');
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, masterMode ? masterFilenameFor('csv') : filenameFor(trip!, 'csv'));
  });

  const doPrint = () => trip && model && run('print', async () => {
    const { openPrintWindow } = await import('../lib/packingPdf');
    openPrintWindow(model);
  });

  const doShare = () => run('share', async () => {
    if (masterMode) {
      const { buildMasterXlsx } = await import('../lib/packingExcel');
      const blob = await buildMasterXlsx(masterItems);
      const result = await shareOrDownloadBlob(blob, masterFilenameFor('xlsx'), 'Master Packing Library');
      setMessage(result === 'shared' ? 'Shared!' : result === 'downloaded' ? 'Your device doesn\'t support sharing files directly — downloaded instead.' : null);
    } else if (trip && model) {
      const { buildPdfBlob } = await import('../lib/packingPdf');
      const blob = await buildPdfBlob(model);
      const result = await shareOrDownloadBlob(blob, filenameFor(trip, 'pdf'), `${trip.name} — Packing List`);
      setMessage(result === 'shared' ? 'Shared!' : result === 'downloaded' ? 'Your device doesn\'t support sharing files directly — downloaded instead.' : null);
    }
  });

  const doEmail = () => {
    const subject = masterMode ? 'Master Packing Library' : `${trip?.name ?? 'Trip'} — Packing List`;
    const body = masterMode ? buildMasterPlainText(masterItems) : (model ? buildTripPlainText(model) : '');
    window.location.href = mailtoHref(subject, body);
  };

  const quickPdf = () => trip && run('quickpdf', async () => {
    const quickModel = buildExportModel(trip, items, tasks, DEFAULT_EXPORT_OPTIONS, 'all');
    const { buildPdfBlob } = await import('../lib/packingPdf');
    const blob = await buildPdfBlob(quickModel);
    downloadBlob(blob, filenameFor(trip, 'pdf'));
  });

  const exportCurrentView = () => trip && run('currentview', async () => {
    const viewModel = buildExportModel(trip, items, tasks, options, viewFilter);
    const { buildPdfBlob } = await import('../lib/packingPdf');
    const blob = await buildPdfBlob(viewModel);
    downloadBlob(blob, filenameFor(trip, 'pdf').replace('.pdf', `_${viewFilter}.pdf`));
  });

  const canShare = typeof navigator !== 'undefined' && !!(navigator as any).canShare;

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,3,10,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div className="glass" style={{ width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 19 }}>📤 Export / Share</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
          </div>

          {!trip && (
            <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>No trip selected — you can still export the Master Packing Library below.</div>
          )}

          {(trip || masterItems.length > 0) && (
            <div className={s.row} style={{ gap: 8 }}>
              <button
                className={!masterMode ? s.btnPrimary : s.btnGhost}
                disabled={!trip}
                onClick={() => setMasterMode(false)}
                style={{ flex: 1, fontSize: 13, opacity: !trip ? 0.5 : 1 }}
              >🧳 This Trip</button>
              <button
                className={masterMode ? s.btnPrimary : s.btnGhost}
                onClick={() => setMasterMode(true)}
                style={{ flex: 1, fontSize: 13 }}
              >🗃️ Master Library</button>
            </div>
          )}

          {!masterMode && trip && (
            <>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-lo)', fontWeight: 700, marginBottom: 8 }}>EXPORT OPTIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {OPTION_LABELS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                        borderRadius: 10, border: '1px solid var(--card-border)',
                        background: 'rgba(255,255,255,0.04)', color: 'var(--text-hi)', fontSize: 12.5, textAlign: 'left',
                      }}
                    >
                      {options[key] ? <CheckSquare size={16} color="var(--accent-3)" /> : <Square size={16} color="var(--text-lo)" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button className={s.btnGhost} onClick={quickPdf} disabled={busy !== null} style={{ justifyContent: 'center' }}>
                {busy === 'quickpdf' ? <Loader2 size={18} className="spin" /> : '📤'} Quick PDF — no setup needed
              </button>
            </>
          )}

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-lo)', fontWeight: 700, marginBottom: 8 }}>
              {masterMode ? 'EXPORT MASTER LIBRARY' : 'EXPORT'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <button className={s.btnPrimary} onClick={exportPdf} disabled={busy !== null || masterMode || !trip} style={{ flexDirection: 'column', height: 74, opacity: masterMode ? 0.4 : 1 }}>
                {busy === 'pdf' ? <Loader2 size={20} className="spin" /> : <FileText size={20} />}
                <span style={{ fontSize: 13 }}>PDF</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Printable checklist</span>
              </button>
              <button className={s.btnPrimary} onClick={exportWord} disabled={busy !== null} style={{ flexDirection: 'column', height: 74 }}>
                {busy === 'word' ? <Loader2 size={20} className="spin" /> : <FileText size={20} />}
                <span style={{ fontSize: 13 }}>WORD</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Editable checklist</span>
              </button>
              <button className={s.btnPrimary} onClick={exportExcel} disabled={busy !== null} style={{ flexDirection: 'column', height: 74 }}>
                {busy === 'excel' ? <Loader2 size={20} className="spin" /> : <FileSpreadsheet size={20} />}
                <span style={{ fontSize: 13 }}>EXCEL</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Full packing data</span>
              </button>
              <button className={s.btnPrimary} onClick={exportCsv} disabled={busy !== null || (!masterMode && !trip)} style={{ flexDirection: 'column', height: 74 }}>
                {busy === 'csv' ? <Loader2 size={20} className="spin" /> : <Table size={20} />}
                <span style={{ fontSize: 13 }}>CSV</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Plain spreadsheet data</span>
              </button>
              <button className={s.btnPrimary} onClick={exportHtml} disabled={busy !== null || masterMode || !trip} style={{ flexDirection: 'column', height: 74, opacity: masterMode ? 0.4 : 1 }}>
                {busy === 'html' ? <Loader2 size={20} className="spin" /> : <FileCode size={20} />}
                <span style={{ fontSize: 13 }}>HTML</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Opens in any browser</span>
              </button>
              <button className={s.btnPrimary} onClick={doPrint} disabled={busy !== null || masterMode || !trip} style={{ flexDirection: 'column', height: 74, opacity: masterMode ? 0.4 : 1 }}>
                {busy === 'print' ? <Loader2 size={20} className="spin" /> : <Printer size={20} />}
                <span style={{ fontSize: 13 }}>PRINT</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Print packing list</span>
              </button>
              <button className={s.btnGhost} onClick={doShare} disabled={busy !== null || (!masterMode && !trip)} style={{ flexDirection: 'column', height: 74 }}>
                {busy === 'share' ? <Loader2 size={20} className="spin" /> : <Share2 size={20} />}
                <span style={{ fontSize: 13 }}>SHARE</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>{canShare ? 'AirDrop, Mail…' : 'Share file'}</span>
              </button>
              <button className={s.btnGhost} onClick={doEmail} disabled={!masterMode && !trip} style={{ flexDirection: 'column', height: 74 }}>
                <Mail size={20} />
                <span style={{ fontSize: 13 }}>EMAIL</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>Opens your mail app</span>
              </button>
            </div>
          </div>

          {!masterMode && trip && viewFilter !== 'all' && (
            <button className={s.btnGhost} onClick={exportCurrentView} disabled={busy !== null} style={{ justifyContent: 'center' }}>
              {busy === 'currentview' ? <Loader2 size={18} className="spin" /> : '📤'} Export Current View ({VIEW_FILTER_LABEL[viewFilter]})
            </button>
          )}

          {message && <div style={{ fontSize: 12.5, color: 'var(--text-lo)', textAlign: 'center' }}>{message}</div>}
        </div>
      </div>
      <style>{`.spin { animation: packingSpin 0.8s linear infinite; } @keyframes packingSpin { to { transform: rotate(360deg); } }`}</style>
    </Portal>
  );
}
