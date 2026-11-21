import { defineConfig } from '@playwright/test';

// UI checks run against the built single file (dist/index.html), the same file that ships.
export default defineConfig({
  testDir: 'tests/ui',
  timeout: 120_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    viewport: { width: 390, height: 844 },
    trace: 'off',
    actionTimeout: 10_000,
  },
});
