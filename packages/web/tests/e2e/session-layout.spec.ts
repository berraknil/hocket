import { test, expect } from '@playwright/test';

test.describe('Session Layout - Header and Footer', () => {
  test('should display header on session page', async ({ page }) => {
    await page.goto('/s/test-layout');
    await page.waitForLoadState('networkidle');

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Logo should be in header
    await expect(page.locator('header').getByText('H0CK3T')).toBeVisible();
  });

  test('should display footer on session page', async ({ page }) => {
    await page.goto('/s/test-layout');
    await page.waitForLoadState('networkidle');

    // Footer should be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Footer should contain "Built with" text
    await expect(footer.getByText('Built with')).toBeVisible();
  });

  test('should display Playground link in header', async ({ page }) => {
    await page.goto('/s/test-layout');
    await page.waitForLoadState('networkidle');

    // Playground link should be visible in header
    await expect(page.locator('header').getByText('Playground')).toBeVisible();
  });

  test('should navigate to landing page when clicking logo', async ({ page }) => {
    await page.goto('/s/test-layout');
    await page.waitForLoadState('networkidle');

    // Click the logo
    await page.locator('header a').first().click();

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });
});

test.describe('Session Layout - Constrained Width', () => {
  test('should have constrained editor container with max-w-7xl', async ({ page }) => {
    await page.goto('/s/test-constrained');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // The main content should have max-w-7xl class
    const mainContent = page.locator('main .max-w-7xl');
    await expect(mainContent).toBeVisible();
  });

  test('should have rounded corners on editor container', async ({ page }) => {
    await page.goto('/s/test-rounded');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // The editor container should have rounded-lg class
    const editorContainer = page.locator('main .rounded-lg');
    await expect(editorContainer).toBeVisible();
  });

  test('should have stone-50 background on page wrapper', async ({ page }) => {
    await page.goto('/s/test-background');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // The main wrapper div should have bg-stone-50 and min-h-screen classes
    const wrapper = page.locator('div.min-h-screen.bg-stone-50');
    await expect(wrapper).toBeVisible();
  });
});

test.describe('Session Layout - Buttons Position', () => {
  test('should display command button inside editor area', async ({ page }) => {
    await page.goto('/s/test-buttons');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Command button should be visible (inside the constrained area)
    const commandButton = page.locator('button:has(svg.lucide-command)');
    await expect(commandButton).toBeVisible();
  });

  test('command button should open command dialog', async ({ page }) => {
    await page.goto('/s/test-buttons-click');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Click command button
    const commandButton = page.locator('button:has(svg.lucide-command)');
    await commandButton.click();

    // Command dialog should open
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Session Layout - Responsive', () => {
  test('should maintain layout on different viewport sizes', async ({ page }) => {
    // Set a larger viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/s/test-responsive-large');
    await page.waitForLoadState('networkidle');

    // Header and footer should still be visible
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('footer')).toBeVisible();

    // Editor should be visible
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show main content area below header with proper padding', async ({ page }) => {
    await page.goto('/s/test-layout-order');
    await page.waitForLoadState('networkidle');

    // Wait for editor to load
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Header should be fixed at top
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Main should have pt-16 class for padding below fixed header
    const main = page.locator('main.pt-16');
    await expect(main).toBeVisible();
    
    // Footer should be visible at bottom
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Editor should be visible inside main
    await expect(page.locator('main .cm-editor').first()).toBeVisible();
  });
});
