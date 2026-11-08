import { defineConfig } from '@playwright/test';

// Runs against the Firebase emulators only (demo-memoit); start them with `npm run test:e2e`.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    viewport: { width: 412, height: 915 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
