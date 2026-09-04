import { useRef, useState } from 'react';
import { X, Download, Upload, Sun, Moon, Lock, Unlock, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import PinPrompt from './PinPrompt';
import VersionHistoryModal from './VersionHistoryModal';
import { APP_VERSION } from '../lib/versionHistory';
import { FONT_STACKS, FONT_SIZE_LABEL, effectiveTextColor } from '../lib/appearance';
import type { FontFamilyId, FontSizeId } from '../types';
import s from '../widgets/shared.module.css';

const ACCENT_PRESETS = ['#a855f7', '#ec4899', '#22d3ee', '#f97316', '#22c55e', '#3b82f6', '#f43f5e', '#eab308'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-lo)' }}>{title}</div>
      {children}
    </div>
  );
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useStore(st => st.settings);
  const updateSettings = useStore(st => st.updateSettings);
  const exportBackup = useStore(st => st.exportBackup);
  const importBackup = useStore(st => st.importBackup);
  const clearAllData = useStore(st => st.clearAllData);

  const [showVersionPin, setShowVersionPin] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showRemovePin, setShowRemovePin] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestVersionHistory = () => {
    if (settings.adminPassword) { setShowVersionPin(true); return; }
    setShowVersionHistory(true);
  };

  const setPin = () => {
    if (pinDraft.length < 4) return;
    updateSettings({ adminPassword: pinDraft });
    setPinDraft('');
  };

  const handleExport = async () => {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultimate-packing-list-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      await importBackup(text);
      setImportMsg('Backup restored successfully.');
    } catch {
      setImportMsg('That file could not be read as a valid backup.');
    }
    setTimeout(() => setImportMsg(''), 4000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(5,3,10,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="glass" style={{ width: 'min(560px,100%)', maxHeight: '85vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 18 }}>⚙️ Settings</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-lo)', opacity: 0.7 }}>v{APP_VERSION}</span>
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
        </div>

        <Section title="📜 VERSION">
          <div className={s.row} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-lo)' }}>App version <b style={{ color: 'var(--text-hi)' }}>v{APP_VERSION}</b></span>
            <button
              onClick={requestVersionHistory}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 18px',
                borderRadius: 14, cursor: 'pointer',
                background: 'linear-gradient(135deg, #FF6EC7, #FF3FAE)',
                border: '1px solid #FFB3E6', color: '#fff', fontWeight: 800, fontSize: 14,
                boxShadow: '0 0 14px 2px rgba(255,110,199,0.55)',
                animation: 'settingsVersionGlow 2.4s ease-in-out infinite',
              }}
            >
              📜 Version History
            </button>
            <style>{`
              @keyframes settingsVersionGlow {
                0%, 100% { box-shadow: 0 0 10px 1px rgba(255,110,199,0.45); }
                50% { box-shadow: 0 0 20px 4px rgba(255,63,174,0.75); }
              }
            `}</style>
          </div>
        </Section>

        <Section title="🔤 FONT">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(FONT_STACKS) as FontFamilyId[]).map(id => (
              <button
                key={id}
                onClick={() => updateSettings({ fontFamily: id })}
                className={settings.fontFamily === id ? s.btnPrimary : s.btnGhost}
                style={{ fontFamily: FONT_STACKS[id].body, fontSize: 13.5 }}
              >
                {FONT_STACKS[id].label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="📏 FONT SIZE">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(FONT_SIZE_LABEL) as FontSizeId[]).map(id => (
              <button
                key={id}
                onClick={() => updateSettings({ fontSize: id })}
                className={settings.fontSize === id ? s.btnPrimary : s.btnGhost}
              >
                {FONT_SIZE_LABEL[id]}
              </button>
            ))}
          </div>
        </Section>

        <Section title="🎨 FONT COLOUR & ACCENT">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12.5, color: 'var(--text-lo)', fontWeight: 700, display: 'block', marginBottom: 6 }}>Text colour</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="color" value={effectiveTextColor(settings)}
                  onChange={e => updateSettings({ textColor: e.target.value })}
                  style={{ width: 44, height: 40, borderRadius: 10, border: '1px solid var(--card-border)', background: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-lo)' }}>{effectiveTextColor(settings)}{!settings.textColor ? ' (theme default)' : ''}</span>
                {settings.textColor && (
                  <button className={s.btnGhost} style={{ minHeight: 34, padding: '0 12px', fontSize: 12.5 }} onClick={() => updateSettings({ textColor: undefined })}>
                    Reset to theme default
                  </button>
                )}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: 'var(--text-lo)', fontWeight: 700, display: 'block', marginBottom: 6 }}>Accent colour</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {ACCENT_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSettings({ accentColor: c })}
                    aria-label={c}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: settings.accentColor === c ? '3px solid var(--text-hi)' : '1px solid rgba(255,255,255,0.25)',
                      boxShadow: `0 0 10px 1px ${c}88`,
                    }}
                  />
                ))}
                <input
                  type="color" value={settings.accentColor}
                  onChange={e => updateSettings({ accentColor: e.target.value })}
                  style={{ width: 44, height: 40, borderRadius: 10, border: '1px solid var(--card-border)', background: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="🌗 APPEARANCE">
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={settings.themeMode === 'dark' ? s.btnPrimary : s.btnGhost}
              onClick={() => updateSettings({ themeMode: 'dark' })}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              className={settings.themeMode === 'light' ? s.btnPrimary : s.btnGhost}
              onClick={() => updateSettings({ themeMode: 'light' })}
            >
              <Sun size={16} /> Light
            </button>
          </div>
        </Section>

        <Section title="🔒 ADMINISTRATOR PASSWORD">
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-lo)' }}>
            Optional — protects the Version History panel below.
          </p>
          {settings.adminPassword ? (
            <div className={s.row} style={{ justifyContent: 'space-between' }}>
              <span className={s.row}><Lock size={16} color="var(--accent-3)" /> Password is set</span>
              <button className={s.btnGhost} onClick={() => setShowRemovePin(true)}><Unlock size={14} /> Remove</button>
            </div>
          ) : (
            <div className={s.row} style={{ flexWrap: 'wrap' }}>
              <input
                className={s.input} style={{ maxWidth: 160 }} type="password" inputMode="numeric" placeholder="4–6 digits"
                value={pinDraft} onChange={e => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button className={s.btnPrimary} disabled={pinDraft.length < 4} onClick={setPin}>Set Password</button>
            </div>
          )}
        </Section>

        <Section title="💾 BACKUP">
          <div className={s.row} style={{ flexWrap: 'wrap' }}>
            <button className={s.btnGhost} onClick={handleExport}><Download size={16} /> Export Backup</button>
            <button className={s.btnGhost} onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import Backup</button>
            <input
              ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ''; }}
            />
            {importMsg && <span style={{ color: 'var(--text-lo)', fontSize: 13 }}>{importMsg}</span>}
          </div>
        </Section>

        <Section title="🗑️ DANGER ZONE">
          {!confirmClear ? (
            <button className={s.btnGhost} style={{ color: '#fda4af', alignSelf: 'flex-start' }} onClick={() => setConfirmClear(true)}>
              <Trash2 size={16} /> Clear All Trip Data
            </button>
          ) : (
            <div className={s.row} style={{ flexWrap: 'wrap' }}>
              <span style={{ color: '#fda4af', fontWeight: 600, fontSize: 13.5 }}>Erase every trip, item and task? This can't be undone.</span>
              <button className={s.btnPrimary} onClick={async () => { await clearAllData(); setConfirmClear(false); }}>Confirm</button>
              <button className={s.btnGhost} onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-lo)' }}>The Master Library is never touched by this — use Archive there instead.</p>
        </Section>
      </div>

      {showVersionPin && settings.adminPassword && (
        <PinPrompt
          expected={settings.adminPassword}
          title="Enter Administrator Password"
          onSuccess={() => { setShowVersionPin(false); setShowVersionHistory(true); }}
          onCancel={() => setShowVersionPin(false)}
        />
      )}
      {showRemovePin && settings.adminPassword && (
        <PinPrompt
          expected={settings.adminPassword}
          title="Enter current password to remove it"
          onSuccess={() => { updateSettings({ adminPassword: undefined }); setShowRemovePin(false); }}
          onCancel={() => setShowRemovePin(false)}
        />
      )}
      {showVersionHistory && <VersionHistoryModal onClose={() => setShowVersionHistory(false)} />}
    </div>
  );
}
