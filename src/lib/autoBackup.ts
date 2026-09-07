import { useEffect, useState } from 'react';
import { db } from '../store/db';
import { useStore } from '../store/useStore';

const HANDLE_ID = 'backupFolder';
const FILE_PREFIX = 'spongie-backup-';
const FILE_SUFFIX = '.json';
const KEEP_COUNT = 5;
const INTERVAL_MS = 60_000; // 1 minute

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  const row = await db.handles.get(HANDLE_ID);
  return row?.handle ?? null;
}

// Checks (without prompting) whether we can currently read+write the stored
// folder. Permission can silently revert to 'prompt' after a reload — the
// browser won't let us re-grant it without a user gesture (a click), so this
// is what tells the UI to show a "tap to re-authorize" button instead of
// silently failing every backup.
export async function hasWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
}

// Must be called from a user gesture (a click) — browsers require that for
// both the initial picker and any later re-authorization prompt.
export async function chooseBackupFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  const handle = await window.showDirectoryPicker!({ id: 'spongie-auto-backup', mode: 'readwrite' });
  const granted = await handle.requestPermission({ mode: 'readwrite' });
  if (granted !== 'granted') return null;
  await db.handles.put({ id: HANDLE_ID, handle });
  return handle;
}

export async function reauthorizeBackupFolder(): Promise<boolean> {
  const handle = await getStoredFolderHandle();
  if (!handle) return false;
  const granted = await handle.requestPermission({ mode: 'readwrite' });
  return granted === 'granted';
}

export async function clearBackupFolder(): Promise<void> {
  await db.handles.delete(HANDLE_ID);
}

// Writes one new backup file, then deletes any of ours beyond the newest
// KEEP_COUNT — oldest first, keyed by the epoch-ms timestamp in the filename
// (which also sorts correctly as plain text).
export async function runBackupNow(handle: FileSystemDirectoryHandle): Promise<void> {
  const json = await useStore.getState().exportBackup();
  const fileHandle = await handle.getFileHandle(`${FILE_PREFIX}${Date.now()}${FILE_SUFFIX}`, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(json);
  await writable.close();

  const ours: string[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && entry.name.startsWith(FILE_PREFIX) && entry.name.endsWith(FILE_SUFFIX)) {
      ours.push(entry.name);
    }
  }
  ours.sort().reverse(); // newest (largest timestamp) first
  for (const name of ours.slice(KEEP_COUNT)) {
    await handle.removeEntry(name).catch(() => { /* already gone, ignore */ });
  }
}

export interface AutoBackupState {
  supported: boolean;
  folderName: string | null;
  authorized: boolean;
  lastBackupAt: number | null;
  lastError: string | null;
  running: boolean;
}

// Drives the whole feature: loads the saved folder handle on mount, then
// (while authorized) writes a fresh backup every INTERVAL_MS and prunes down
// to the newest 5 — entirely independent of Cloud Sync or manual export.
export function useAutoBackup() {
  const [state, setState] = useState<AutoBackupState>({
    supported: isFileSystemAccessSupported(),
    folderName: null,
    authorized: false,
    lastBackupAt: null,
    lastError: null,
    running: false,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      const handle = await getStoredFolderHandle();
      if (!handle) { setState(s => ({ ...s, folderName: null, authorized: false })); return; }
      const authorized = await hasWritePermission(handle);
      if (cancelled) return;
      setState(s => ({ ...s, folderName: handle.name, authorized }));
      if (!authorized) return;
      try {
        setState(s => ({ ...s, running: true }));
        await runBackupNow(handle);
        if (!cancelled) setState(s => ({ ...s, running: false, lastBackupAt: Date.now(), lastError: null }));
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, running: false, lastError: err instanceof Error ? err.message : 'Backup failed' }));
      }
    };

    tick();
    timer = window.setInterval(tick, INTERVAL_MS);
    return () => { cancelled = true; if (timer) window.clearInterval(timer); };
  }, []);

  const choose = async () => {
    try {
      const handle = await chooseBackupFolder();
      if (handle) {
        setState(s => ({ ...s, folderName: handle.name, authorized: true, lastError: null }));
        await runBackupNow(handle);
        setState(s => ({ ...s, lastBackupAt: Date.now() }));
      }
    } catch (err) {
      setState(s => ({ ...s, lastError: err instanceof Error ? err.message : 'Could not access that folder' }));
    }
  };

  const reauthorize = async () => {
    const ok = await reauthorizeBackupFolder();
    setState(s => ({ ...s, authorized: ok }));
  };

  const stop = async () => {
    await clearBackupFolder();
    setState(s => ({ ...s, folderName: null, authorized: false, lastBackupAt: null, lastError: null }));
  };

  return { ...state, choose, reauthorize, stop };
}
