import { useEffect, useState, type CSSProperties } from 'react';
import { Cloud, CloudOff, X, RefreshCw, BatteryCharging } from 'lucide-react';
import { useStore } from './store/useStore';
import PackingPage from './pages/PackingPage';
import PullToRefresh from './components/PullToRefresh';
import Portal from './components/Portal';
import CloudSyncWizard from './components/CloudSyncWizard';
import { applyAppearance, FONT_SIZE_SCALE } from './lib/appearance';
import { startCloudSync, restartCloudSync } from './lib/useCloudSync';
import { useChargeReminder } from './lib/chargeReminder';

const CLOUD_PROMPT_SEEN_KEY = 'spongie-cloud-prompt-seen';

export default function App() {
  const ready = useStore(s => s.ready);
  const init = useStore(s => s.init);
  const settings = useStore(s => s.settings);
  const cloudStatus = useStore(s => s.cloudStatus);
  const cloudEmail = useStore(s => s.cloudEmail);
  const cloudLastSyncedAt = useStore(s => s.cloudLastSyncedAt);
  const [showCloudPrompt, setShowCloudPrompt] = useState(false);
  const [showCloudWizard, setShowCloudWizard] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { startCloudSync(); }, []);
  useEffect(() => { applyAppearance(settings); }, [settings.fontFamily, settings.textColor, settings.accentColor, settings.themeMode]);

  // First launch only: once Firebase has resolved auth state (cloudStatus
  // settles from 'connecting' to 'disabled'/'signed-out'), offer to connect
  // to cloud sync. Tapping it jumps straight into sign-in via the wizard,
  // which already skips the config steps since Firebase config is built in.
  useEffect(() => {
    if (cloudStatus !== 'disabled' && cloudStatus !== 'signed-out') return;
    let seen = false;
    try { seen = localStorage.getItem(CLOUD_PROMPT_SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (!seen) setShowCloudPrompt(true);
  }, [cloudStatus]);

  const dismissCloudPrompt = () => {
    setShowCloudPrompt(false);
    try { localStorage.setItem(CLOUD_PROMPT_SEEN_KEY, '1'); } catch { /* ignore */ }
  };

  // For anyone already signed in: whenever cloud sync can't reach the
  // server — whether that's discovered right when the app opens, or the
  // connection drops while it's already running — surface it every time,
  // not just once. Clears itself as soon as a sync succeeds.
  useEffect(() => {
    if (cloudStatus === 'error' && cloudEmail) { setShowDisconnected(true); setRetrying(false); }
    else if (cloudStatus === 'synced') setShowDisconnected(false);
  }, [cloudStatus, cloudEmail]);

  const retryCloudConnection = () => {
    setRetrying(true);
    restartCloudSync();
  };

  const [chargeReminder, dismissChargeReminder] = useChargeReminder();

  if (!ready) {
    return (
      <div style={{ height: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', background: 'var(--bg-0)' }}>
        Loading your packing list…
      </div>
    );
  }

  // Text-size scaling uses transform:scale (not CSS `zoom`) so it applies
  // uniformly to every element, including `vw`/clamp()-based font sizes
  // (headings) that `zoom` doesn't scale the same way as plain px values.
  // The container is pre-shrunk by the inverse of the scale factor so that,
  // once scaled, it lands back at exactly 100vw x 100dvh — without this the
  // enlarged content overflows its unscaled box and gets clipped, which is
  // what caused the app to appear to shift/cut off on the right when the
  // text size was increased.
  const scale = FONT_SIZE_SCALE[settings.fontSize];
  return (
    <>
      <div
        style={{
          width: `${100 / scale}vw`, height: `${100 / scale}dvh`, overflow: 'hidden',
          transform: `scale(${scale})`, transformOrigin: 'top left',
          paddingTop: `calc(max(var(--safe-margin), env(safe-area-inset-top)) / ${scale})`,
          paddingBottom: `calc(max(var(--safe-margin), env(safe-area-inset-bottom)) / ${scale})`,
          paddingLeft: `calc(max(var(--safe-margin), env(safe-area-inset-left)) / ${scale})`,
          paddingRight: `calc(max(var(--safe-margin), env(safe-area-inset-right)) / ${scale})`,
        } as CSSProperties}
      >
        <PullToRefresh>
          <PackingPage />
        </PullToRefresh>
      </div>
      {showCloudPrompt && (
        <Portal>
          <div
            role="button"
            tabIndex={0}
            onClick={() => { dismissCloudPrompt(); setShowCloudWizard(true); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { dismissCloudPrompt(); setShowCloudWizard(true); } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)', padding: 20, cursor: 'pointer',
            }}
          >
            <div
              style={{
                background: 'var(--bg-1, #1c1c1e)', borderRadius: 16, padding: 24, maxWidth: 340,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={e => { e.stopPropagation(); dismissCloudPrompt(); }}
                aria-label="Dismiss"
                style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--text-lo)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
              <Cloud size={40} color="var(--accent, #4da3ff)" style={{ marginTop: -12 }} />
              <div style={{ fontWeight: 800, fontSize: 18 }}>Connect Cloud Sync?</div>
              <div style={{ fontSize: 14, color: 'var(--text-lo)' }}>
                Sign in to keep your trips and packing lists synced across devices. Tap to sign in now, or dismiss to set it up later in Settings.
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent, #4da3ff)', marginTop: 4 }}>Tap anywhere to sign in →</div>
            </div>
          </div>
        </Portal>
      )}
      {showCloudWizard && <CloudSyncWizard onClose={() => setShowCloudWizard(false)} />}
      {showDisconnected && (
        <Portal>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)', padding: 20,
            }}
          >
            <div
              style={{
                background: 'var(--bg-1, #1c1c1e)', borderRadius: 16, padding: 24, maxWidth: 340,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => setShowDisconnected(false)}
                aria-label="Dismiss"
                style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--text-lo)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
              <CloudOff size={40} color="#fda4af" style={{ marginTop: -12 }} />
              <div style={{ fontWeight: 800, fontSize: 18 }}>Not Connected to Cloud Sync</div>
              <div style={{ fontSize: 14, color: 'var(--text-lo)' }}>
                Last connection: {cloudLastSyncedAt ? new Date(cloudLastSyncedAt).toLocaleString() : 'never'}. Please check your Internet.
              </div>
              <button
                onClick={retryCloudConnection}
                disabled={retrying}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '10px 20px',
                  borderRadius: 10, border: 'none', background: 'var(--accent, #4da3ff)', color: '#fff',
                  fontWeight: 700, fontSize: 14, cursor: retrying ? 'default' : 'pointer', opacity: retrying ? 0.7 : 1,
                }}
              >
                <RefreshCw size={16} className={retrying ? 'spin' : ''} /> Try Again
              </button>
            </div>
          </div>
        </Portal>
      )}
      {chargeReminder && (
        <Portal>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)', padding: 20,
            }}
          >
            <div
              style={{
                background: 'var(--bg-1, #1c1c1e)', borderRadius: 16, padding: 24, maxWidth: 340,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={dismissChargeReminder}
                aria-label="Dismiss"
                style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--text-lo)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
              <BatteryCharging size={40} color="#22d3ee" style={{ marginTop: -12 }} />
              <div style={{ fontWeight: 800, fontSize: 18 }}>Charge your devices</div>
              <div style={{ fontSize: 14, color: 'var(--text-lo)' }}>
                {chargeReminder.tripName} departs in 3 hours.
                {chargeReminder.itemNames.length > 0
                  ? ` Still to charge: ${chargeReminder.itemNames.join(', ')}.`
                  : ' Everything on your charge list is already charged.'}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
