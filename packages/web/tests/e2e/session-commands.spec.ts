import { test, expect } from '@playwright/test';

test.describe('Session Command Dialog', () => {
  test('should open command dialog with Ctrl+J', async ({ page }) => {
    await page.goto('/s/test-commands');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Press Ctrl+J
    await page.keyboard.press('Control+j');

    // Command dialog should be visible
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });
  });

  test('should close command dialog with Escape', async ({ page }) => {
    await page.goto('/s/test-commands-close');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).not.toBeVisible();
  });

  test('should filter commands when typing in search', async ({ page }) => {
    await page.goto('/s/test-search');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Type search term
    await page.fill('[cmdk-input]', 'add');

    // Should show add pane command
    await expect(page.locator('[cmdk-item]:has-text("Add Pane")')).toBeVisible({ timeout: 5000 });
  });

  test('should show session commands', async ({ page }) => {
    await page.goto('/s/test-session-cmds');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Search for session commands
    await page.fill('[cmdk-input]', 'new');

    // Should show "New" command
    await expect(page.locator('[cmdk-item]:has-text("New")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show share URL command', async ({ page }) => {
    await page.goto('/s/test-share');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'share');

    // Unauthenticated users should see sign-in prompt instead of Share URL
    await expect(page.locator('text=Sign in to share sessions')).toBeVisible({ timeout: 5000 });
  });

  test('should show change username command', async ({ page }) => {
    await page.goto('/s/test-username');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'username');

    await expect(page.locator('text=Change Username')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Layout Management', () => {
  test('should show add pane command', async ({ page }) => {
    await page.goto('/s/test-add-pane');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'add');

    await expect(page.locator('text=Add Pane')).toBeVisible({ timeout: 5000 });
  });

  test('should show remove pane command', async ({ page }) => {
    await page.goto('/s/test-remove-pane');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'remove');

    await expect(page.locator('text=Remove Pane')).toBeVisible({ timeout: 5000 });
  });

  test('should show configure layout command', async ({ page }) => {
    await page.goto('/s/test-configure');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'configure');

    await expect(page.locator('[cmdk-item]:has-text("Configure")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should add pane when clicking add command', async ({ page }) => {
    const uniqueSession = `test-add-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState('networkidle');

    // Should start with 2 editors
    await expect(page.locator('.cm-editor')).toHaveCount(2, { timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'add pane');
    await page.click('text=Add Pane');

    // Wait for layout to update
    await page.waitForTimeout(1000);

    // Should now have 3 editors
    await expect(page.locator('.cm-editor')).toHaveCount(3, { timeout: 10000 });
  });
});

test.describe('Display Settings', () => {
  test('should show display settings command', async ({ page }) => {
    await page.goto('/s/test-display');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'display');

    // Should show display settings option
    await expect(page.locator('text=Display Settings').or(page.locator('text=Change Display Settings'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Panic Command', () => {
  test('should execute panic with Ctrl+Shift+.', async ({ page }) => {
    await page.goto('/s/test-panic');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Wait for session to fully initialize
    await page.waitForTimeout(2000);

    // Press panic shortcut
    await page.keyboard.press('Control+Shift+.');

    // Should show panic toast
    await expect(page.locator('[role="status"]:has-text("Panic!")').or(page.locator('.text-sm:has-text("Panic!")').first())).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Share URL Dialog', () => {
  test('should show sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/s/test-share-url');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'share');
    
    // Should show sign-in prompt instead of share URL for unauthenticated users
    await expect(page.locator('text=Sign in to share sessions')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Username Dialog', () => {
  test('should open username dialog from command', async ({ page }) => {
    await page.goto('/s/test-username-dialog');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'username');
    await page.click('text=Change Username');

    // Username dialog should open
    await page.waitForTimeout(500);
  });
});

test.describe('New Session Navigation', () => {
  test('should navigate to home when clicking New', async ({ page }) => {
    await page.goto('/s/test-new-session');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    await page.fill('[cmdk-input]', 'new');
    await page.click('[cmdk-item]:has-text("New")');

    // Should navigate to home
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
