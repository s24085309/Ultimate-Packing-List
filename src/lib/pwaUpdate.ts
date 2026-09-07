import { registerSW } from 'virtual:pwa-register';

// Registered once at startup. Storing the returned updateSW here lets any
// component (the pull-to-refresh gesture) trigger "check for and activate a
// new version" on demand, instead of only via the plugin's own background polling.
const updateSW = registerSW({ immediate: true });

// registration.update() only kicks off the background fetch/install of a
// newer service worker — it does not wait for that worker to finish
// installing. Calling updateSW(true) (skipWaiting) before the new worker
// reaches the 'installed'/waiting state is a no-op, so the page would just
// reload back into the same old cached version. This waits (with a safety
// timeout) for an in-flight install to finish before proceeding.
function waitForInstall(registration: ServiceWorkerRegistration): Promise<void> {
  return new Promise(resolve => {
    const worker = registration.installing ?? registration.waiting;
    if (!worker || worker.state === 'installed' || worker.state === 'redundant') {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, 8000);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'redundant') {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

// Pull-to-refresh handler: checks for a new version, waits for it to finish
// installing, activates it (which reloads the page automatically), and
// falls back to a plain reload if there was nothing new to fetch.
export async function refreshApp(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.update();
      await waitForInstall(registration);
    }
  } catch {
    // ignore — still fall through to updateSW/reload below
  }
  try {
    await updateSW(true);
  } catch {
    // ignore
  }
  window.location.reload();
}
