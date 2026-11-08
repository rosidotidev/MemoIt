import type { Environment } from './environment.model';

export type { Environment };

// Local development: Firebase Emulator Suite only. These values are not secrets.
export const environment: Environment = {
  useEmulators: true,
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-memoit.firebaseapp.com',
    projectId: 'demo-memoit',
    appId: 'demo-app-id',
  },
};
