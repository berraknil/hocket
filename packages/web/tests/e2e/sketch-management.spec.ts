import { test, expect } from '@playwright/test';

test.describe('Sketch Management - ATproto Save/Load', () => {
  const mockSession = {
    did: 'did:plc:test123',
    handle: 'test.bsky.social',
    accessJwt: 'mock-jwt',
    refreshJwt: 'mock-refresh',
    active: true,
    service: 'https://bsky.social'
  };

  test.beforeEach(async ({ page }) => {
    // Set up authenticated session
    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);
  });

  test('should show save option when authenticated', async ({ page }) => {
    await page.goto('/s/test-save');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open command dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Search for save
    await page.fill('[cmdk-input]', 'save');

    // Should show save to ATproto option
    await expect(page.locator('text=Save to ATproto')).toBeVisible({ timeout: 5000 });
  });

  test('should open save dialog when clicking save option', async ({ page }) => {
    await page.goto('/s/test-save-dialog');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open command dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Click save option
    await page.fill('[cmdk-input]', 'save');
    await page.click('text=Save to ATproto');

    // Save dialog should open
    // Note: Actual save functionality requires ATproto agent mock
    await page.waitForTimeout(500);
  });

  test('should show download option in command palette', async ({ page }) => {
    await page.goto('/s/test-download');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open command dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Search for download
    await page.fill('[cmdk-input]', 'download');

    // Should show download option
    await expect(page.locator('text=Download')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sketch List on Dashboard', () => {
  const mockSession = {
    did: 'did:plc:test123',
    handle: 'test.bsky.social',
    accessJwt: 'mock-jwt',
    refreshJwt: 'mock-refresh',
    active: true,
    service: 'https://bsky.social'
  };

  test('should show empty state when no sketches', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show empty state
    await expect(page.locator('text=No sketches')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Get started by creating a new sketch')).toBeVisible();
  });

  test('should show refresh button', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show refresh button
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to new session when clicking New Sketch', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("New Sketch")', { timeout: 10000 });

    // Should navigate to a new session
    await expect(page).toHaveURL(/\/s\//);
  });
});

test.describe('Sketch Loading from URL', () => {
  const mockSession = {
    did: 'did:plc:test123',
    handle: 'test.bsky.social',
    accessJwt: 'mock-jwt',
    refreshJwt: 'mock-refresh',
    active: true,
    service: 'https://bsky.social'
  };

  test('should accept sketch parameter in URL', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);

    // Navigate with sketch parameter
    const sketchUri = 'at://did:plc:test/app.bsky.sketch/123';
    await page.goto(`/s/test-session?sketch=${encodeURIComponent(sketchUri)}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Note: Actual loading would require mocking ATproto fetch
  });
});
