import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import type { Environment } from '../../../environments/environment';

export const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
export const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
export const FIRESTORE_EMULATOR_PORT = 8080;

export interface FirebaseServices {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;
}

let cached: FirebaseServices | undefined;

/**
 * Initializes Firebase once and memoises the result, so emulators connect only once.
 * Emulators are connected only when `env.useEmulators` is true, and only for a `demo-` project.
 */
export function initFirebase(env: Environment): FirebaseServices {
  if (cached) {
    return cached;
  }
  if (env.useEmulators && !env.firebase.projectId.startsWith('demo-')) {
    throw new Error('Emulators may only be used with a project id starting with "demo-".');
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(env.firebase);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (env.useEmulators) {
    connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
    connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  }
  cached = { app, auth, db };
  return cached;
}

/** Test helper: forget the memoised services. */
export function resetFirebaseForTests(): void {
  cached = undefined;
}
