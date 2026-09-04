import { useEffect, type CSSProperties } from 'react';
import { useStore } from './store/useStore';
import PackingPage from './pages/PackingPage';
import { applyAppearance, FONT_SIZE_SCALE } from './lib/appearance';

export default function App() {
  const ready = useStore(s => s.ready);
  const init = useStore(s => s.init);
  const settings = useStore(s => s.settings);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { applyAppearance(settings); }, [settings.fontFamily, settings.textColor, settings.accentColor, settings.themeMode]);

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
        // eslint-disable-next-line -- zoom scales the whole UI to the chosen text size; unsupported browsers just render at 100%
        zoom: FONT_SIZE_SCALE[settings.fontSize],
      } as CSSProperties}
    >
      <PackingPage />
    </div>
  );
}
