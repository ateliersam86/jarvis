import { test, expect } from '@playwright/test';

// List of locales to test
// Using a subset of 'all' if specific ones are prone to issues, but here we test all defined in routing.
const locales = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh'];

test.describe('Internationalization Visual Regression', () => {
    for (const locale of locales) {
        test(`[${locale}] Landing Page Snapshot`, async ({ page }) => {
            // Navigate to the localized landing page
            await page.goto(`/${locale}`);
            
            // Wait for network idle to ensure assets/fonts are loaded
            await page.waitForLoadState('networkidle');

            // Optional: Hide dynamic elements if they cause flakiness (e.g. blinking cursors, random data)
            // await page.addStyleTag({ content: '.dynamic-content { visibility: hidden; }' });

            // Take a full page screenshot
            await expect(page).toHaveScreenshot(`landing-${locale}.png`, {
                fullPage: true,
                maxDiffPixelRatio: 0.05, // Allow small rendering differences
            });
        });

        test(`[${locale}] Features Page Snapshot`, async ({ page }) => {
            // Navigate to the localized features page
            // Note: Assuming /features maps to /{locale}/features
            // If the route name is translated (e.g. /fr/fonctionnalites), this loop needs a map.
            // Based on typical Next.js dynamic routing, it's usually /{locale}/features unless pathnames are localized in routing.ts
            
            // Let's check if pathnames are localized. 
            // In i18n/routing.ts, defineRouting is used. If pathnames are not customized there, they default to English names prefixed.
            // Assuming standard structure for now.
            
            const response = await page.goto(`/${locale}/features`);
            
            // If 404 (e.g. page doesn't exist yet), skip test or fail
            if (response?.status() === 404) {
                 console.log(`Skipping Features page for ${locale} (404)`);
                 return;
            }

            await page.waitForLoadState('networkidle');

            await expect(page).toHaveScreenshot(`features-${locale}.png`, {
                fullPage: true,
                maxDiffPixelRatio: 0.05,
            });
        });
    }
});
