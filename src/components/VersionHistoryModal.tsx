import { X } from 'lucide-react';
import Portal from './Portal';
import { APP_VERSION, CATEGORY_EMOJI, getVersionHistory } from '../lib/versionHistory';

export default function VersionHistoryModal({ onClose }: { onClose: () => void }) {
  const entries = getVersionHistory();

  return (
    <Portal>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 750, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            background: '#0D0D14', border: '1px solid #FFB3E6', borderRadius: 20,
            boxShadow: '0 0 40px 4px rgba(255,110,199,0.25)', overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', borderBottom: '1px solid rgba(255,179,230,0.25)',
            background: 'linear-gradient(135deg, rgba(255,110,199,0.12), rgba(255,63,174,0.06))',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 19 }}>📜</span>
                <span style={{
                  fontWeight: 800, fontSize: 17, color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text',
                  backgroundImage: 'linear-gradient(135deg, #FF6EC7, #FF3FAE)',
                }}>Version History</span>
              </div>
              <div style={{ fontSize: 12, color: '#F2F2F5', opacity: 0.6, marginTop: 4 }}>
                Current version <span style={{ color: '#FF6EC7', fontWeight: 700 }}>v{APP_VERSION}</span> · {entries.length} logged change{entries.length === 1 ? '' : 's'}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,179,230,0.3)', borderRadius: 10, color: '#F2F2F5', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <X size={17} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 12, padding: '13px 4px',
                  borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{CATEGORY_EMOJI[e.category]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#22d3ee' }}>v{e.version}</span>
                    <span style={{ fontSize: 11.5, color: '#F2F2F5', opacity: 0.55 }}>{e.date}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', color: '#FF6EC7', textTransform: 'uppercase' }}>{e.category}</span>
                    {e.backfilled && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#F2F2F5', opacity: 0.7 }}>
                        Backfilled / approximate
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#F2F2F5', lineHeight: 1.5 }}>{e.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  );
}
