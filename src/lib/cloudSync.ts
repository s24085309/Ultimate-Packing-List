// Real-time multi-device sync via Firebase (Firestore + Auth).
// The whole app state (trips, packing items, master library, departure tasks,
// settings) is mirrored as one JSON document per signed-in user. Any device
// signed in with the same email/password stays in sync automatically.

import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, type Auth, type User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp, type Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'packing-cloud-config';

// Baked in so Cloud Sync works out of the box, no manual setup needed.
// Firebase web config values are meant to be public (they identify the
// project, not authorize access) — real protection comes from the Firestore
// security rules set up in the wizard, which scope every document to its
// owner's signed-in uid.
const BUILT_IN_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyB-EO8MAV3iO1pBYYYq1N9I8KeeW5MoUds',
  authDomain: 'spongie-ultimate-packing-list.firebaseapp.com',
  projectId: 'spongie-ultimate-packing-list',
  storageBucket: 'spongie-ultimate-packing-list.firebasestorage.app',
  messagingSenderId: '42977164077',
  appId: '1:42977164077:web:2952ea7c9edbf5d5e7b1a4',
};

export function loadCloudConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to built-in config
  }
  return BUILT_IN_CONFIG;
}

export function hasCustomCloudConfig(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function saveCloudConfig(config: FirebaseConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearCloudConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let currentConfigKey = '';

export function getCloudApp(config: FirebaseConfig): { auth: Auth; db: Firestore } {
  const key = JSON.stringify(config);
  if (app && currentConfigKey === key && auth && db) return { auth, db };
  if (app) { deleteApp(app).catch(() => {}); app = null; }
  app = initializeApp(config, `packing-sync-${Date.now()}`);
  auth = getAuth(app);
  db = getFirestore(app);
  currentConfigKey = key;
  // Avoids accidentally hitting a local emulator if one happens to be running on the same machine.
  void connectAuthEmulator;
  return { auth, db };
}

export async function signUp(config: FirebaseConfig, email: string, password: string): Promise<User> {
  const { auth: a } = getCloudApp(config);
  const cred = await createUserWithEmailAndPassword(a, email.trim(), password);
  return cred.user;
}

export async function signIn(config: FirebaseConfig, email: string, password: string): Promise<User> {
  const { auth: a } = getCloudApp(config);
  const cred = await signInWithEmailAndPassword(a, email.trim(), password);
  return cred.user;
}

export async function signOutCloud(config: FirebaseConfig): Promise<void> {
  const { auth: a } = getCloudApp(config);
  await signOut(a);
}

export function watchAuthState(config: FirebaseConfig, cb: (user: User | null) => void): () => void {
  const { auth: a } = getCloudApp(config);
  return onAuthStateChanged(a, cb);
}

export interface SyncPayload {
  trips: unknown[];
  packingItems: unknown[];
  masterPackingItems: unknown[];
  departureTasks: unknown[];
  settings: unknown;
  clientUpdatedAt: number;
}

export function pushCloudState(config: FirebaseConfig, uid: string, payload: SyncPayload): Promise<void> {
  const { db: d } = getCloudApp(config);
  return setDoc(doc(d, 'packingSync', uid), { ...payload, serverUpdatedAt: serverTimestamp() });
}

export function watchCloudState(config: FirebaseConfig, uid: string, cb: (payload: SyncPayload | null) => void): () => void {
  const { db: d } = getCloudApp(config);
  return onSnapshot(doc(d, 'packingSync', uid), snap => {
    cb(snap.exists() ? (snap.data() as SyncPayload) : null);
  });
}

export const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /packingSync/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}`;
