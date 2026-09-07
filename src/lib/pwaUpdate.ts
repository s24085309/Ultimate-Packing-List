import { registerSW } from 'virtual:pwa-register';

// Registered once at startup. Storing the returned updateSW here lets any
// component (the pull-to-refresh gesture) trigger "check for and activate a
// new version" on demand, instead of only via the plugin's own background polling.
const updateSW = registerSW({ immediate: true });

// Pull-to-refresh handler: checks for a new version, activates it (which
// reloads the page automatically), and falls back to a plain reload if
// there was nothing new to fetch.
export async function refreshApp(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
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
