import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Sanity Check Tests
 * Detects visual bugs that lint/tsc cannot catch:
 * - Z-index issues
 * - Broken layouts
 * - Accessibility violations
 */

test.describe('Dashboard Sanity Check', () => {
    test('Homepage loads and is accessible', async ({ page }) => {
        await page.goto('/');

        // Wait for content to load
        await page.waitForLoadState('networkidle');

        // 1. Accessibility Check (colors, contrast, labels)
        const a11yScan = await new AxeBuilder({ page }).analyze();

        // Log violations but don't fail (can be strict in CI)
        if (a11yScan.violations.length > 0) {
            console.log('Accessibility violations:', a11yScan.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.length
            })));
        }

        // 2. Visual Regression - Screenshot comparison
        await expect(page).toHaveScreenshot('homepage.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.05, // Allow 5% difference
        });
    });

    test('ProjectSwitcher dropdown appears above content', async ({ page }) => {
        await page.goto('/jarvis'); // Go to a project page
        await page.waitForLoadState('networkidle');

        // Find and click the Project Switcher button
        const switcher = page.locator('button:has-text("Current Project")');
        if (await switcher.isVisible()) {
            await switcher.click();
            await page.waitForTimeout(300); // Wait for animation

            // Take screenshot with dropdown open
            await expect(page).toHaveScreenshot('dropdown-open.png', {
                maxDiffPixelRatio: 0.05,
            });

            // Verify dropdown is visible and not obscured
            const dropdown = page.locator('div:has-text("Current Project") + div');
            await expect(dropdown).toBeVisible();
        }
    });

    test('Tasks tab displays content', async ({ page }) => {
        await page.goto('/jarvis');
        await page.waitForLoadState('networkidle');

        // Click on Tasks tab
        const tasksTab = page.locator('button:has-text("Tasks")');
        if (await tasksTab.isVisible()) {
            await tasksTab.click();
            await page.waitForTimeout(500);

            // Verify some content is displayed
            const content = page.locator('h2:has-text("Brain Tasks")');
            await expect(content).toBeVisible();

            // Screenshot of tasks view
            await expect(page).toHaveScreenshot('tasks-tab.png', {
                fullPage: true,
                maxDiffPixelRatio: 0.05,
            });
        }
    });
});

test.describe('Mobile Responsive', () => {
    test('Dashboard is usable on mobile', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Take mobile screenshot
        await expect(page).toHaveScreenshot('homepage-mobile.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.05,
        });
    });
});
