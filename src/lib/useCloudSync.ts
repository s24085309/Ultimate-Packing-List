import { useStore } from '../store/useStore';
import { loadCloudConfig, watchAuthState, watchCloudState, pushCloudState } from './cloudSync';

let started = false;

// Singleton: call once (from App.tsx). Keeps exactly one Firestore listener alive
// for the lifetime of the app, with sync status mirrored into the zustand store
// so any component can read it without creating its own subscription.
export function startCloudSync() {
  if (started) return;
  started = true;

  const config = loadCloudConfig();
  const { setCloudStatus } = useStore.getState();
  if (!config) { setCloudStatus('disabled'); return; }
  setCloudStatus('connecting');

  let suppressPush = false;
  let uid: string | null = null;
  let unsubState: (() => void) | null = null;
  let pushTimer: number | null = null;

  watchAuthState(config, user => {
    if (unsubState) { unsubState(); unsubState = null; }
    uid = user?.uid ?? null;
    if (!user) { setCloudStatus('signed-out', null); return; }
    setCloudStatus('connecting', user.email);
    // Backstop: if Firestore never calls back (blocked rules, no network, etc.)
    // don't leave the status stuck on "Connecting" forever.
    const stallTimer = window.setTimeout(() => {
      if (useStore.getState().cloudStatus === 'connecting') setCloudStatus('error', user.email);
    }, 12000);
    unsubState = watchCloudState(
      config, user.uid,
      payload => {
        window.clearTimeout(stallTimer);
        if (payload) {
          suppressPush = true;
          useStore.getState().importBackup(JSON.stringify(payload)).finally(() => {
            setTimeout(() => { suppressPush = false; }, 300);
          });
        }
        setCloudStatus('synced', user.email);
      },
      () => { window.clearTimeout(stallTimer); setCloudStatus('error', user.email); },
    );
  });

  useStore.subscribe((state, prev) => {
    if (suppressPush || !uid) return;
    if (
      state.trips === prev.trips && state.packingItems === prev.packingItems &&
      state.masterPackingItems === prev.masterPackingItems && state.departureTasks === prev.departureTasks &&
      state.settings === prev.settings
    ) return;
    if (pushTimer) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(async () => {
      const cfg = loadCloudConfig();
      if (!cfg || !uid) return;
      try {
        const backup = JSON.parse(await useStore.getState().exportBackup());
        await pushCloudState(cfg, uid, {
          trips: backup.trips, packingItems: backup.packingItems,
          masterPackingItems: backup.masterPackingItems, departureTasks: backup.departureTasks,
          settings: backup.settings, clientUpdatedAt: Date.now(),
        });
        setCloudStatus('synced');
      } catch {
        setCloudStatus('error');
      }
    }, 1500);
  });
}

// Called after the wizard successfully saves a new config, so sync starts
// immediately without requiring a page reload.
export function restartCloudSync() {
  started = false;
  startCloudSync();
}
