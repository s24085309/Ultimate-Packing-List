import { useEffect } from 'react';
import { useStore } from './store/useStore';
import PackingPage from './pages/PackingPage';

export default function App() {
  const ready = useStore(s => s.ready);
  const init = useStore(s => s.init);

  useEffect(() => { init(); }, [init]);

  if (!ready) {
    return (
      <div style={{ height: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-lo)', background: 'var(--bg-0)' }}>
        Loading your packing list…
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100dvh', width: '100vw', overflow: 'hidden',
        paddingTop: 'max(var(--safe-margin), env(safe-area-inset-top))',
        paddingBottom: 'max(var(--safe-margin), env(safe-area-inset-bottom))',
        paddingLeft: 'max(var(--safe-margin), env(safe-area-inset-left))',
        paddingRight: 'max(var(--safe-margin), env(safe-area-inset-right))',
      }}
    >
      <PackingPage />
    </div>
  );
}
