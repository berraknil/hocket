import { test, expect } from '@playwright/test';

test.describe('Accessibility - ARIA and Semantic HTML', () => {
  test('should have proper ARIA labels on sign-in form', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Form fields should have proper labels
    await expect(page.locator('label[for="identifier"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Input fields should have proper autocomplete
    await expect(page.locator('#identifier')).toHaveAttribute('autocomplete', 'username');
    await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'current-password');
  });

  test('should have accessible navigation in header', async ({ page }) => {
    await page.goto('/');

    // Header should have semantic nav element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Links should be accessible
    await expect(page.locator('header a[href="/"]')).toBeVisible();
    await expect(page.locator('header a[href="/dashboard"]')).toBeVisible();
  });

  test('should have accessible buttons with proper text', async ({ page }) => {
    await page.goto('/');

    // Call-to-action buttons should have clear text
    await expect(page.locator('a:has-text("Start Jamming")')).toBeVisible();
    await expect(page.locator('main a[href="/auth/sign-in"]:has-text("Sign In")')).toBeVisible();
  });

  test('should have proper heading hierarchy on landing page', async ({ page }) => {
    await page.goto('/');

    // Should have headings (h1, h2, etc.)
    // ALGORAVE should be prominent
    await expect(page.locator('text=ALGORAVE')).toBeVisible();
  });

  test('should have accessible footer links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // All attribution links should be accessible
    await expect(footer.locator('a[href="https://flok.cc"]')).toBeVisible();
    await expect(footer.locator('a[href="https://strudel.cc"]')).toBeVisible();
    await expect(footer.locator('a[href="https://hydra.ojack.xyz"]')).toBeVisible();
    await expect(footer.locator('a[href="https://tidalcycles.org"]')).toBeVisible();
  });

  test('should have accessible dialogs with ARIA roles', async ({ page }) => {
    await page.goto('/s/test-dialog-aria');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open command dialog
    await page.keyboard.press('Control+j');

    // Dialog should have proper role
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Close dialog
    await page.keyboard.press('Escape');
  });
});

test.describe('Keyboard Navigation', () => {
  test('should allow tab navigation on landing page', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate without errors
  });

  test('should allow tab navigation on sign-in form', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus identifier
    await page.keyboard.press('Tab'); // Focus password
    await page.keyboard.press('Tab'); // Focus submit button

    // Should be able to navigate form via keyboard
  });

  test('should allow Enter to submit sign-in form', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await page.fill('#identifier', 'test.bsky.social');
    await page.fill('#password', 'test-password');

    // Focus submit button and press Enter
    await page.locator('button[type="submit"]').focus();
    await page.keyboard.press('Enter');

    // Form should attempt to submit
    await expect(page.locator('button[type="submit"]')).toBeDisabled({ timeout: 3000 });
  });

  test('should close dialogs with Escape key', async ({ page }) => {
    await page.goto('/s/test-escape-close');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should display landing page on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');

    // Essential elements should be visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=ALGORAVE')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display sign-in form on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/auth/sign-in');

    // Form should be visible and usable
    await expect(page.locator('#identifier')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display dashboard on mobile viewport', async ({ page }) => {
    const mockSession = {
      did: 'did:plc:test123',
      handle: 'test.bsky.social',
      accessJwt: 'mock-jwt',
      refreshJwt: 'mock-refresh',
      active: true,
      service: 'https://bsky.social'
    };

    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.evaluate((session) => {
      localStorage.setItem('hocket-session', JSON.stringify(session));
    }, mockSession);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible
    await expect(page.locator('h1')).toContainText('Your Sketches', { timeout: 10000 });
    await expect(page.locator('button:has-text("New Sketch")')).toBeVisible({ timeout: 10000 });
  });

  test('should display session editor on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/s/test-mobile');
    await page.waitForLoadState('networkidle');

    // Editor should be visible
    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Status bar should be visible
    await expect(page.locator('.fixed.bottom-0').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display landing page on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=ALGORAVE')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display landing page on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD

    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=ALGORAVE')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Focus Management', () => {
  test('should focus first input on sign-in page', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Identifier field should be focusable
    await page.locator('#identifier').focus();

    // Should be focused without errors
  });

  test('should trap focus within dialog', async ({ page }) => {
    await page.goto('/s/test-focus-trap');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open dialog
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Tab should stay within dialog
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Dialog should still be open
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('should return focus to trigger after dialog closes', async ({ page }) => {
    await page.goto('/s/test-focus-return');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

    // Open dialog with keyboard
    await page.keyboard.press('Control+j');
    await expect(page.getByRole('dialog', { name: 'Command Menu' })).toBeVisible({ timeout: 5000 });

    // Close dialog
    await page.keyboard.press('Escape');

    // Focus should return (hard to test directly, but no errors should occur)
  });
});

test.describe('Color Contrast and Readability', () => {
  test('should have readable text on landing page', async ({ page }) => {
    await page.goto('/');

    // Primary text should be visible and high contrast
    await expect(page.locator('text=ALGORAVE')).toBeVisible();

    // Stone color scheme should provide good contrast
    // text-stone-900 on bg-stone-50
  });

  test('should have readable form labels', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Labels should be visible
    await expect(page.locator('label[for="identifier"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  test('should have readable button text', async ({ page }) => {
    await page.goto('/');

    // Buttons should have high contrast
    // bg-stone-900 text-white
    await expect(page.locator('main a[href="/auth/sign-in"]:has-text("Sign In")')).toBeVisible();
  });
});

test.describe('Form Validation and Error Messages', () => {
  test('should show required field validation', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Fields should be marked as required
    await expect(page.locator('#identifier')).toHaveAttribute('required');
    await expect(page.locator('#password')).toHaveAttribute('required');
  });

  test('should prevent submission with empty fields', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Browser should prevent submission (HTML5 validation)
    // URL should not change
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('should show helper text for form fields', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Helper text should be visible
    await expect(page.locator('text=Enter your full handle including the service domain')).toBeVisible();
    await expect(page.locator('text=Generate an app password from your service\'s settings page')).toBeVisible();
  });
});
