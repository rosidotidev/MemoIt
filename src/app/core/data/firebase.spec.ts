import { environment, type Environment } from '../../../environments/environment';
import { initFirebase, resetFirebaseForTests } from './firebase';

const mocks = vi.hoisted(() => ({
  connectAuthEmulator: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  getApps: () => [],
  getApp: () => ({}),
  initializeApp: () => ({}),
}));
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  connectAuthEmulator: mocks.connectAuthEmulator,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  connectFirestoreEmulator: mocks.connectFirestoreEmulator,
}));

const env = (useEmulators: boolean, projectId = 'demo-test'): Environment => ({
  useEmulators,
  firebase: { apiKey: 'k', authDomain: 'd', projectId, appId: 'a' },
});

describe('local environment', () => {
  it('uses the emulators and a demo project', () => {
    expect(environment.useEmulators).toBe(true);
    expect(environment.firebase.projectId).toMatch(/^demo-/);
  });
});

describe('initFirebase', () => {
  beforeEach(() => {
    resetFirebaseForTests();
    mocks.connectAuthEmulator.mockClear();
    mocks.connectFirestoreEmulator.mockClear();
  });

  it('connects the emulators when useEmulators is true', () => {
    initFirebase(env(true));
    expect(mocks.connectAuthEmulator).toHaveBeenCalledTimes(1);
    expect(mocks.connectFirestoreEmulator).toHaveBeenCalledTimes(1);
  });

  it('does not connect the emulators when useEmulators is false', () => {
    initFirebase(env(false, 'real-project'));
    expect(mocks.connectAuthEmulator).not.toHaveBeenCalled();
    expect(mocks.connectFirestoreEmulator).not.toHaveBeenCalled();
  });

  it('is memoised: a second call does not throw or reconnect', () => {
    const first = initFirebase(env(true));
    expect(initFirebase(env(true))).toBe(first);
    expect(mocks.connectAuthEmulator).toHaveBeenCalledTimes(1);
  });

  it('throws when emulators are requested for a non-demo project', () => {
    expect(() => initFirebase(env(true, 'real-project'))).toThrow(/demo-/);
    expect(mocks.connectAuthEmulator).not.toHaveBeenCalled();
  });
});
