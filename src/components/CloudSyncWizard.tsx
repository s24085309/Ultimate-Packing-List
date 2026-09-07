import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Copy, Cloud, ExternalLink, Loader2 } from 'lucide-react';
import Portal from './Portal';
import { useStore } from '../store/useStore';
import {
  type FirebaseConfig, saveCloudConfig, loadCloudConfig, clearCloudConfig,
  getCloudApp, signUp, signIn, signOutCloud, FIRESTORE_RULES_SNIPPET,
} from '../lib/cloudSync';
import { restartCloudSync } from '../lib/useCloudSync';
import s from '../widgets/shared.module.css';

const EMPTY_CONFIG: FirebaseConfig = {
  apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '',
};

const CONFIG_FIELDS: { key: keyof FirebaseConfig; label: string }[] = [
  { key: 'apiKey', label: 'apiKey' },
  { key: 'authDomain', label: 'authDomain' },
  { key: 'projectId', label: 'projectId' },
  { key: 'storageBucket', label: 'storageBucket' },
  { key: 'messagingSenderId', label: 'messagingSenderId' },
  { key: 'appId', label: 'appId' },
];

function StepShell({ step, total, title, children, onBack, onNext, nextLabel, nextDisabled, nextLoading }: {
  step: number; total: number; title: string; children: React.ReactNode;
  onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextLoading?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-lo)', letterSpacing: '0.05em' }}>STEP {step} OF {total}</div>
      <div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
      <div className={s.row} style={{ justifyContent: 'space-between', marginTop: 8 }}>
        {onBack ? (
          <button className={s.btnGhost} onClick={onBack}><ChevronLeft size={16} /> Back</button>
        ) : <span />}
        {onNext && (
          <button className={s.btnPrimary} onClick={onNext} disabled={nextDisabled}>
            {nextLoading ? <Loader2 size={16} className="spin" /> : null}
            {nextLabel ?? 'Next'} {!nextLoading && <ChevronRight size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        margin: 0, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--card-border)',
        fontSize: 11.5, lineHeight: 1.5, overflowX: 'auto', color: 'var(--text-hi)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>{text}</pre>
      <button
        onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className={s.btnGhost}
        style={{ position: 'absolute', top: 8, right: 8, minHeight: 30, padding: '0 10px', fontSize: 11.5 }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function CloudSyncWizard({ onClose }: { onClose: () => void }) {
  const cloudStatus = useStore(st => st.cloudStatus);
  const cloudEmail = useStore(st => st.cloudEmail);
  const existingConfig = loadCloudConfig();

  const [step, setStep] = useState(existingConfig ? 5 : 1);
  const [config, setConfig] = useState<FirebaseConfig>(existingConfig ?? EMPTY_CONFIG);
  const [configError, setConfigError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const configComplete = CONFIG_FIELDS.every(f => config[f.key].trim().length > 0);

  const testAndSaveConfig = async () => {
    setConfigError(null);
    setTesting(true);
    try {
      getCloudApp(config); // throws on malformed config
      saveCloudConfig(config);
      restartCloudSync();
      setStep(5);
    } catch (err) {
      setConfigError((err as Error)?.message || 'Could not connect with these values — double-check them and try again.');
    } finally {
      setTesting(false);
    }
  };

  const doAuth = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      if (mode === 'signup') await signUp(config, email, password);
      else await signIn(config, email, password);
      setStep(6);
    } catch (err) {
      setAuthError((err as Error)?.message?.replace('Firebase: ', '') || 'Something went wrong.');
    } finally {
      setAuthBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect cloud sync on this device? Your local data stays untouched.')) return;
    try { await signOutCloud(config); } catch { /* ignore */ }
    clearCloudConfig();
    onClose();
    location.reload();
  };

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(5,3,10,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div className="glass" style={{ width: 'min(520px,100%)', maxHeight: '88vh', overflowY: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Cloud size={20} /> Cloud Sync Setup</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-lo)' }}><X size={22} /></button>
          </div>

          {step === 1 && (
            <StepShell step={1} total={6} title="Create a free Firebase project" onNext={() => setStep(2)}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-lo)', lineHeight: 1.6 }}>
                Firebase (by Google) is what will store and sync your trips across devices in real time, for free.
                You'll need a Google account.
              </p>
              <a
                href="https://console.firebase.google.com/" target="_blank" rel="noreferrer"
                className={s.btnGhost} style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                Open Firebase Console <ExternalLink size={14} />
              </a>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.8 }}>
                <li>Click <b>"Add project"</b> (or "Create a project")</li>
                <li>Give it any name, e.g. "Spongie Packing"</li>
                <li>You can disable Google Analytics — not needed</li>
                <li>Click <b>Create project</b> and wait for it to finish</li>
              </ol>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell step={2} total={6} title="Turn on Firestore & sign-in" onBack={() => setStep(1)} onNext={() => setStep(3)}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-lo)' }}>In your new project's left sidebar:</p>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.9 }}>
                <li>Go to <b>Build → Firestore Database</b> → <b>Create database</b> → pick a location → <b>Start in production mode</b></li>
                <li>Go to <b>Build → Authentication</b> → <b>Get started</b></li>
                <li>Under "Sign-in method", enable <b>Email/Password</b> and Save</li>
              </ol>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              step={3} total={6} title="Register a web app & paste its config"
              onBack={() => setStep(2)} onNext={testAndSaveConfig}
              nextLabel="Test & Save" nextDisabled={!configComplete || testing} nextLoading={testing}
            >
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.9 }}>
                <li>Click the gear icon → <b>Project settings</b></li>
                <li>Under "Your apps", click the <b>{'</>'}</b> (web) icon to add a web app</li>
                <li>Give it any nickname and click <b>Register app</b></li>
                <li>Copy each value from the <code>firebaseConfig</code> object shown into the fields below</li>
              </ol>
              {CONFIG_FIELDS.map(f => (
                <input
                  key={f.key}
                  className={s.input}
                  placeholder={f.label}
                  value={config[f.key]}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value.trim() }))}
                />
              ))}
              {configError && <div style={{ fontSize: 12.5, color: '#fda4af' }}>{configError}</div>}
            </StepShell>
          )}

          {step === 4 && (
            <StepShell step={4} total={6} title="Lock the data down to just you" onBack={() => setStep(3)} onNext={() => setStep(5)}>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-lo)', lineHeight: 1.6 }}>
                In Firestore Database → <b>Rules</b> tab, replace everything with this, then click <b>Publish</b>:
              </p>
              <CopyBlock text={FIRESTORE_RULES_SNIPPET} />
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-lo)' }}>
                This makes sure only you (signed in) can ever read or write your synced data.
              </p>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell
              step={5} total={6} title={mode === 'signup' ? 'Create your sync account' : 'Sign in'}
              onBack={existingConfig ? undefined : () => setStep(4)} onNext={doAuth}
              nextLabel={mode === 'signup' ? 'Create Account' : 'Sign In'}
              nextDisabled={!email.trim() || password.length < 6 || authBusy} nextLoading={authBusy}
            >
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-lo)' }}>
                Use the same email and password on every device you want synced together.
              </p>
              <input className={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              <input className={s.input} type="password" placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
              {authError && <div style={{ fontSize: 12.5, color: '#fda4af' }}>{authError}</div>}
              <button
                className={s.btnGhost} style={{ justifyContent: 'center', fontSize: 12.5 }}
                onClick={() => { setMode(m => m === 'signup' ? 'signin' : 'signup'); setAuthError(null); }}
              >
                {mode === 'signup' ? 'Already have a sync account? Sign in' : "First time? Create an account instead"}
              </button>
            </StepShell>
          )}

          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40 }}>☁️✅</div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>You're synced!</div>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-lo)', lineHeight: 1.6, maxWidth: 360 }}>
                Open this app on your other device, tap ⚙️ Settings → Cloud Sync, and sign in with the
                same email and password. Your trips will appear automatically.
              </p>
              <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>
                Status: <b style={{ color: cloudStatus === 'synced' ? '#4ade80' : cloudStatus === 'error' ? '#fda4af' : 'var(--text-hi)' }}>{cloudStatus}</b>
                {cloudEmail && <> · {cloudEmail}</>}
              </div>
              {cloudStatus === 'error' && (
                <p style={{ margin: 0, fontSize: 12.5, color: '#fda4af', lineHeight: 1.6, maxWidth: 360 }}>
                  Signed in, but sync can't reach your data. This almost always means the Firestore security
                  rules weren't published — go back to step 4, paste the rules snippet into
                  Firestore Database → Rules, and click <b>Publish</b>.
                </p>
              )}
              <div className={s.row}>
                <button className={s.btnPrimary} onClick={onClose}>Done</button>
                <button className={s.btnGhost} style={{ color: '#fda4af' }} onClick={disconnect}>Disconnect</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
