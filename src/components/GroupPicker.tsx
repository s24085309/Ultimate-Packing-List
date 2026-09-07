import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import Portal from './Portal';
import s from '../widgets/shared.module.css';

// Native <select> dropdowns misposition themselves under WebKit's CSS `zoom`
// (used app-wide for the text-size setting) — the options list can render
// shifted away from the control. This is a Portal-rendered replacement,
// centred on screen exactly like DatePicker, so it isn't affected by zoom.
export default function GroupPicker({ value, groups, onChange, placeholder = 'Other (default)' }: {
  value: string; groups: string[]; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const close = () => { setOpen(false); setCustomOpen(false); setCustomText(''); };
  const pick = (v: string) => { onChange(v); close(); };
  const addCustom = () => { if (customText.trim()) pick(customText.trim()); };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={s.input}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', color: value ? 'var(--text-hi)' : 'var(--text-lo)', cursor: 'pointer' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        <ChevronDown size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
      </button>

      {open && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={close}>
            <div
              className="glass"
              onClick={e => e.stopPropagation()}
              style={{ width: 300, maxWidth: '100%', maxHeight: '70vh', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>Choose a group</div>
              {customOpen ? (
                <>
                  <input
                    className={s.input} autoFocus placeholder="New group name (emoji OK)"
                    value={customText} onChange={e => setCustomText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setCustomOpen(false); }}
                  />
                  <div className={s.row}>
                    <button className={s.btnPrimary} onClick={addCustom} disabled={!customText.trim()}>Add</button>
                    <button className={s.btnGhost} onClick={() => setCustomOpen(false)}>Back</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                  {!groups.includes('') && (
                    <button
                      onClick={() => pick('')}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                        padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)',
                        background: !value ? 'var(--grad-a)' : 'rgba(255,255,255,0.04)', color: !value ? '#fff' : 'var(--text-hi)', fontSize: 13.5,
                      }}
                    >{placeholder}</button>
                  )}
                  {groups.map(g => (
                    <button
                      key={g} onClick={() => pick(g)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                        padding: '10px 12px', borderRadius: 10, border: '1px solid var(--card-border)',
                        background: value === g ? 'var(--grad-a)' : 'rgba(255,255,255,0.04)', color: value === g ? '#fff' : 'var(--text-hi)', fontSize: 13.5,
                      }}
                    >{g}</button>
                  ))}
                  <button
                    onClick={() => setCustomOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
                      padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--card-border)',
                      background: 'transparent', color: 'var(--text-lo)', fontSize: 13.5,
                    }}
                  ><Plus size={14} /> New group…</button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
