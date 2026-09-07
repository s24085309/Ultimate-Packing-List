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
          const local = useStore.getState();
          const localHasData = local.trips.length > 0 || local.packingItems.length > 0 ||
            local.masterPackingItems.length > 0 || local.departureTasks.length > 0;
          const remoteIsEmpty = !payload.trips?.length && !payload.packingItems?.length &&
            !payload.masterPackingItems?.length && !payload.departureTasks?.length;
          // Cloud Sync has no merge logic — it's whole-document overwrite in
          // both directions. If this device (or another app instance signed
          // into the same account) briefly has an empty/thinner local state
          // — e.g. a fresh install that hasn't pulled yet — and that gets
          // pushed up, a normal pull-down here would silently wipe real,
          // non-empty local data with nothing. Refuse that specific case;
          // a real, intentional "delete everything" still applies normally
          // since that only happens via Clear All Trip Data (which never
          // touches the cloud sync path at all).
          if (remoteIsEmpty && localHasData) {
            console.warn('Cloud Sync: ignoring an empty remote snapshot — local data is non-empty, refusing to overwrite it.');
          } else {
            suppressPush = true;
            useStore.getState().importBackup(JSON.stringify(payload)).finally(() => {
              setTimeout(() => { suppressPush = false; }, 300);
            });
          }
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
