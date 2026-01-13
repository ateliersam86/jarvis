import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Config
 * Runs sanity checks on key pages to detect visual bugs like:
 * - Z-index issues
 * - Broken layouts on mobile
 * - Accessibility issues (via Axe-Core)
 */
export default defineConfig({
    testDir: './e2e',
    snapshotDir: './e2e/snapshots',
    outputDir: './e2e/results',

    // Only run visual tests when explicitly requested
    testMatch: ['**/*.spec.ts'],

    // Timeout for each test
    timeout: 30000,

    // Web server config
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },

    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
        },
        {
            name: 'mobile',
            use: { ...devices['iPhone 12'] },
        },
    ],

    // Reporter
    reporter: [
        ['list'],
        ['html', { outputFolder: './e2e/report', open: 'never' }],
    ],
});
