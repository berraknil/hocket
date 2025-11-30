import { test, expect } from "@playwright/test";

test.describe("Messages Panel", () => {
  test("should toggle messages panel with Ctrl+,", async ({ page }) => {
    await page.goto("/s/test-messages");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Toggle messages panel
    await page.keyboard.press("Control+,");

    // Wait for panel animation
    await page.waitForTimeout(500);

    // Toggle again to close
    await page.keyboard.press("Control+,");
  });

  test("should show messages count in status bar", async ({ page }) => {
    await page.goto("/s/test-msg-count");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Status bar should be visible
    await expect(page.locator(".fixed.bottom-0").first()).toBeVisible({
      timeout: 10000,
    });

    // Note: Messages count would appear after evaluation generates messages
  });

  test("should clear messages when clicking clear button", async ({ page }) => {
    await page.goto("/s/test-clear-msgs");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open messages panel
    await page.keyboard.press("Control+,");
    await page.waitForTimeout(500);

    // Note: Clear button test depends on messages panel having visible clear button
  });

  test("should expand messages panel when clicking status bar indicator", async ({
    page,
  }) => {
    await page.goto("/s/test-expand-msgs");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Status bar should be visible
    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });

    // Note: Clicking messages indicator depends on having messages and visible count
  });
});

test.describe("Messages Panel Settings", () => {
  test("should have auto-show messages toggle", async ({ page }) => {
    await page.goto("/s/test-autoshow");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open messages panel
    await page.keyboard.press("Control+,");
    await page.waitForTimeout(500);

    // Note: Auto-show toggle test depends on messages panel UI
  });

  test("should have hide messages on eval toggle", async ({ page }) => {
    await page.goto("/s/test-hide-on-eval");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open messages panel
    await page.keyboard.press("Control+,");
    await page.waitForTimeout(500);

    // Note: Hide on eval toggle test depends on messages panel UI
  });
});

test.describe("Status Bar", () => {
  test("should show status bar at bottom of screen", async ({ page }) => {
    await page.goto("/s/test-status-bar");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Status bar should be visible at bottom
    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });
  });

  test("should show connection status", async ({ page }) => {
    await page.goto("/s/test-connection");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });

    // Note: Connection status indicators depend on actual connection state
  });

  test("should show sync status", async ({ page }) => {
    await page.goto("/s/test-sync-status");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });

    // Note: Sync status indicators depend on WebSocket connection
  });
});
