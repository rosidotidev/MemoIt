// Copy this file to environment.prod.ts (gitignored) and fill in your Firebase web app config.
// The production build (scripts/check-prod-env.mjs) fails while any YOUR_ placeholder remains.
import type { Environment } from './environment.model';

export type { Environment };

export const environment: Environment = {
  useEmulators: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_WEB_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    appId: 'YOUR_FIREBASE_APP_ID',
  },
};
