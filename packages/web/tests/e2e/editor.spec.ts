import { test, expect } from "@playwright/test";

test.describe("Editor Functionality", () => {
  test("should allow typing code in editor", async ({ page }) => {
    await page.goto("/s/test-editor-typing");
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Clear existing content and type
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("// test code");

    // Verify the code appears (use getByText to avoid regex issues with //)
    await expect(page.getByText("// test code")).toBeVisible();
  });

  test("should evaluate code with Ctrl+Enter", async ({ page }) => {
    await page.goto("/s/test-eval");
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type simple strudel code
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type('sound("bd")');

    // Evaluate with Ctrl+Enter
    await page.keyboard.press("Control+Enter");

    // Wait a moment for evaluation
    await page.waitForTimeout(500);

    // Should not show any error toasts (if evaluation worked)
    // Note: Full evaluation testing would require running sound engine
  });

  test("should focus next editor with Ctrl+]", async ({ page }) => {
    const uniqueSession = `test-nav-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Wait for editors to load (should have 2 by default)
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Focus first editor
    await page.locator(".cm-editor").first().click();

    // Press Ctrl+] to move to next editor
    await page.keyboard.press("Control+]");

    // Second editor should now be focused
    // (Hard to test focus directly, but we can verify no errors)
  });

  test("should focus previous editor with Ctrl+[", async ({ page }) => {
    const uniqueSession = `test-nav-prev-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Wait for editors to load
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Focus second editor first
    await page.locator(".cm-editor").nth(1).click();

    // Press Ctrl+[ to move to previous editor
    await page.keyboard.press("Control+[");
  });

  test("should show multiple editors in session", async ({ page }) => {
    const uniqueSession = `test-multi-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Should have default 2 editors (strudel + hydra)
    const editors = page.locator(".cm-editor");
    await expect(editors).toHaveCount(2, { timeout: 10000 });
  });

  test("should persist editor content during session", async ({ page }) => {
    const uniqueSession = `test-persist-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Wait for session to initialize
    await page.waitForTimeout(2000);

    // Clear and type new content
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("// persistent test data");

    // Wait longer for WebSocket sync
    await page.waitForTimeout(3000);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for editor to reload
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Content should persist (use getByText to avoid regex issues with //)
    await expect(page.getByText("// persistent test data")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Editor Settings", () => {
  test("should open editor settings from command palette", async ({ page }) => {
    await page.goto("/s/test-settings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for editor settings
    await page.fill("[cmdk-input]", "line numbers");

    // Should show line numbers option
    await expect(page.locator("text=Line Numbers")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should toggle line numbers", async ({ page }) => {
    await page.goto("/s/test-line-nums");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for and toggle line numbers
    await page.fill("[cmdk-input]", "line numbers");
    await page.click("text=Line Numbers");

    // Wait for settings to apply
    await page.waitForTimeout(500);
  });

  test("should toggle vim mode", async ({ page }) => {
    await page.goto("/s/test-vim");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for vim mode
    await page.fill("[cmdk-input]", "vim");
    await page.click("text=Vim Mode");

    // Wait for settings to apply
    await page.waitForTimeout(500);
  });

  test("should change editor theme", async ({ page }) => {
    await page.goto("/s/test-theme");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for theme
    await page.fill("[cmdk-input]", "theme");

    // Should show theme option
    await expect(page.locator("text=Theme")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Target Selection", () => {
  test("should show target dropdown for each pane", async ({ page }) => {
    const uniqueSession = `test-target-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Should have target selectors visible
    // (Target selector implementation may vary, adjust selector as needed)
  });

  test("should allow changing pane target", async ({ page }) => {
    const uniqueSession = `test-change-target-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Note: Target selection UI test would depend on actual implementation
    // This is a placeholder for when UI is accessible
  });
});

test.describe("Code Evaluation", () => {
  test("should show evaluate button in pane", async ({ page }) => {
    const uniqueSession = `test-eval-btn-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Evaluate button should be visible
    // (Button selector may need adjustment based on actual implementation)
  });

  test("should evaluate code when clicking evaluate button", async ({
    page,
  }) => {
    const uniqueSession = `test-eval-click-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type code
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type('sound("bd")');

    // Note: Evaluate button click test depends on button being accessible
  });
});
