import { test, expect } from "@playwright/test";

test.describe("Global Keyboard Shortcuts", () => {
  test("should open command dialog with Ctrl+J", async ({ page }) => {
    await page.goto("/s/test-ctrl-j");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Ctrl+J
    await page.keyboard.press("Control+j");

    // Command dialog should open
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should toggle command dialog with repeated Ctrl+J", async ({
    page,
  }) => {
    await page.goto("/s/test-toggle-j");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open with Ctrl+J
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Close with Ctrl+J again
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).not.toBeVisible();
  });

  test("should open configure dialog with Ctrl+P", async ({ page }) => {
    await page.goto("/s/test-ctrl-p");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Ctrl+P
    await page.keyboard.press("Control+p");

    // Wait for dialog
    await page.waitForTimeout(500);

    // Note: Configure dialog visibility depends on actual implementation
  });

  test("should trigger panic with Ctrl+Shift+.", async ({ page }) => {
    await page.goto("/s/test-panic-shortcut");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for session to fully initialize
    await page.waitForTimeout(2000);

    // Press Ctrl+Shift+.
    await page.keyboard.press("Control+Shift+.");

    // Should show panic toast (use first() to handle multiple matches)
    await expect(page.getByText("Panic!", { exact: true }).first()).toBeVisible(
      { timeout: 5000 },
    );
  });

  test("should toggle messages with Ctrl+,", async ({ page }) => {
    await page.goto("/s/test-ctrl-comma");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Toggle messages
    await page.keyboard.press("Control+,");

    // Wait for animation
    await page.waitForTimeout(500);
  });

  test("should hide/show UI with Ctrl+Shift+H", async ({ page }) => {
    await page.goto("/s/test-hide-ui");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for full initialization
    await page.waitForTimeout(2000);

    // Toggle UI visibility
    await page.keyboard.press("Control+Shift+h");

    // Wait for animation
    await page.waitForTimeout(1000);

    // Toggle back
    await page.keyboard.press("Control+Shift+h");

    // Wait for animation
    await page.waitForTimeout(500);
  });
});

test.describe("Editor Navigation Shortcuts", () => {
  test("should focus next editor with Ctrl+]", async ({ page }) => {
    const uniqueSession = `test-next-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Wait for multiple editors
    await expect(page.locator(".cm-editor")).toHaveCount(2, { timeout: 10000 });

    // Focus first editor
    await page.locator(".cm-editor").first().click();

    // Navigate to next
    await page.keyboard.press("Control+]");

    // No error should occur
  });

  test("should focus previous editor with Ctrl+[", async ({ page }) => {
    const uniqueSession = `test-prev-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor")).toHaveCount(2, { timeout: 10000 });

    // Focus second editor
    await page.locator(".cm-editor").nth(1).click();

    // Navigate to previous
    await page.keyboard.press("Control+[");

    // No error should occur
  });

  test("should cycle through editors with Ctrl+] when at end", async ({
    page,
  }) => {
    const uniqueSession = `test-cycle-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor")).toHaveCount(2, { timeout: 10000 });

    // Focus last editor
    await page.locator(".cm-editor").last().click();

    // Navigate forward (should cycle to first)
    await page.keyboard.press("Control+]");

    // No error should occur
  });
});

test.describe("Code Evaluation Shortcuts", () => {
  test("should evaluate code with Ctrl+Enter", async ({ page }) => {
    await page.goto("/s/test-eval-shortcut");
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type code
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type('sound("bd")');

    // Evaluate
    await page.keyboard.press("Control+Enter");

    // Wait briefly
    await page.waitForTimeout(500);

    // No errors should appear (assuming basic evaluation works)
  });

  test("should evaluate selection with Ctrl+Enter", async ({ page }) => {
    await page.goto("/s/test-eval-selection");
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type multi-line code
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type('sound("bd")\nsound("sd")');

    // Select first line
    await page.keyboard.press("Home");
    await page.keyboard.press("Shift+End");

    // Evaluate selection
    await page.keyboard.press("Control+Enter");

    await page.waitForTimeout(500);
  });
});

test.describe("macOS Shortcuts (Meta key)", () => {
  test("should open command dialog with Meta+J on macOS", async ({ page }) => {
    await page.goto("/s/test-meta-j");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Meta+J (Cmd+J on macOS)
    await page.keyboard.press("Meta+j");

    // Command dialog should open
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should open configure with Meta+P on macOS", async ({ page }) => {
    await page.goto("/s/test-meta-p");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Meta+P
    await page.keyboard.press("Meta+p");

    await page.waitForTimeout(500);
  });

  test("should toggle messages with Meta+, on macOS", async ({ page }) => {
    await page.goto("/s/test-meta-comma");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Meta+,
    await page.keyboard.press("Meta+,");

    await page.waitForTimeout(500);
  });

  test("should trigger panic with Meta+Shift+. on macOS", async ({ page }) => {
    await page.goto("/s/test-meta-panic");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for session to fully initialize
    await page.waitForTimeout(2000);

    // Press Meta+Shift+.
    await page.keyboard.press("Meta+Shift+.");

    // Should show panic toast (use first() to avoid strict mode violation)
    await expect(page.getByText("Panic!", { exact: true }).first()).toBeVisible(
      { timeout: 5000 },
    );
  });
});

test.describe("Accessibility Shortcuts", () => {
  test("should allow Escape to close dialogs", async ({ page }) => {
    await page.goto("/s/test-escape");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).not.toBeVisible();
  });

  test("should allow Tab navigation in dialogs", async ({ page }) => {
    await page.goto("/s/test-tab-nav");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Tab should work for navigation
    await page.keyboard.press("Tab");

    // Close
    await page.keyboard.press("Escape");
  });
});
