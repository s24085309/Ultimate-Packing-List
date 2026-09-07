import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import Portal from './Portal';
import s from '../widgets/shared.module.css';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

export default function DatePicker({ value, onChange, placeholder = 'Select date' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 260 });

  const parsed = parseIso(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? today.getMonth());

  useEffect(() => {
    if (open) {
      const p = parseIso(value);
      setViewYear(p?.y ?? today.getFullYear());
      setViewMonth(p?.m ?? today.getMonth());
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: Math.max(260, rect.width) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const yearOptions = Array.from({ length: 12 }, (_, i) => today.getFullYear() - 4 + i);

  const displayText = parsed
    ? new Date(parsed.y, parsed.m, parsed.d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : placeholder;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={s.input}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', color: parsed ? 'var(--text-hi)' : 'var(--text-lo)', cursor: 'pointer' }}
      >
        <span>{displayText}</span>
        <CalendarDays size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
      </button>

      {open && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 800 }} onClick={() => setOpen(false)}>
            <div
              className="glass"
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: coords.top, left: coords.left, width: coords.width, maxWidth: 'calc(100vw - 24px)',
                padding: 14, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 801,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button" onClick={() => setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11; } return m - 1; })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-lo)', flexShrink: 0 }}
                ><ChevronLeft size={18} /></button>

                <select
                  value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}
                  className={s.input} style={{ height: 36, fontSize: 13, flex: 1, padding: '0 6px' }}
                >
                  {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                  value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
                  className={s.input} style={{ height: 36, fontSize: 13, width: 84, padding: '0 6px' }}
                >
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <button
                  type="button" onClick={() => setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0; } return m + 1; })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-lo)', flexShrink: 0 }}
                ><ChevronRight size={18} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                {WEEKDAY_LABELS.map((w, i) => (
                  <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-lo)', padding: '2px 0' }}>{w}</div>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const isSelected = parsed && parsed.y === viewYear && parsed.m === viewMonth && parsed.d === day;
                  const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { onChange(toIso(viewYear, viewMonth, day)); setOpen(false); }}
                      style={{
                        aspectRatio: '1', borderRadius: 8, border: isToday && !isSelected ? '1px solid var(--accent-3)' : '1px solid transparent',
                        background: isSelected ? 'var(--grad-a)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-hi)', fontWeight: isSelected ? 700 : 500, fontSize: 13,
                      }}
                    >{day}</button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { onChange(toIso(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false); }}
                className={s.btnGhost}
                style={{ minHeight: 34, fontSize: 12.5, justifyContent: 'center' }}
              >Today</button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
