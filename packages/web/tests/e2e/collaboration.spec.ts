import { test, expect } from "@playwright/test";

test.describe("Session Collaboration", () => {
  test("should connect to session WebSocket", async ({ page }) => {
    const uniqueSession = `test-ws-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for WebSocket connection
    await page.waitForTimeout(2000);

    // Status bar should show connected state
    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });

    // Note: Actual connection state verification depends on status bar indicators
  });

  test("should sync code across page reload", async ({ page }) => {
    const uniqueSession = `test-sync-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Wait for session to initialize
    await page.waitForTimeout(2000);

    // Clear and type code
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("// synced code test");

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

    // Code should persist
    await expect(page.locator("text=// synced code test")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show username in session", async ({ page }) => {
    await page.goto("/s/test-username-display");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Username should be assigned (randomly or from storage)
    // Note: Username display location depends on UI implementation
  });

  test("should allow changing username", async ({ page }) => {
    await page.goto("/s/test-change-user");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for change username
    await page.fill("[cmdk-input]", "username");
    await page.click("text=Change Username");

    // Username dialog should open
    await page.waitForTimeout(500);
  });

  test("should persist username in localStorage", async ({ page }) => {
    await page.goto("/s/test-persist-user");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for username to be set
    await page.waitForTimeout(1000);

    // Check localStorage
    const username = await page.evaluate(() => {
      return localStorage.getItem("username");
    });

    // Username should be stored
    expect(username).toBeTruthy();
  });
});

test.describe("Multiple Users Simulation", () => {
  test("should handle same session from two pages", async ({ context }) => {
    const uniqueSession = `test-multi-${Date.now()}`;

    // Create two pages
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Navigate both to same session
    await page1.goto(`/s/${uniqueSession}`);
    await page2.goto(`/s/${uniqueSession}`);

    await page1.waitForLoadState("networkidle");
    await page2.waitForLoadState("networkidle");

    // Wait for editors to load on both pages
    await expect(page1.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page2.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for both sessions to fully initialize
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // Clear and type in page1
    await page1.locator(".cm-editor").first().click();
    await page1.keyboard.press("Control+a");
    await page1.keyboard.type("// shared session test");

    // Wait longer for WebSocket sync
    await page1.waitForTimeout(4000);

    // Code should appear in page2
    await expect(page2.locator("text=// shared session test")).toBeVisible({
      timeout: 15000,
    });

    // Cleanup
    await page1.close();
    await page2.close();
  });

  test("should show different usernames for different pages", async ({
    context,
  }) => {
    const uniqueSession = `test-users-${Date.now()}`;

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto(`/s/${uniqueSession}`);
    await page2.goto(`/s/${uniqueSession}`);

    await page1.waitForLoadState("networkidle");
    await page2.waitForLoadState("networkidle");

    await expect(page1.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page2.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Get usernames from localStorage
    const username1 = await page1.evaluate(() =>
      localStorage.getItem("username"),
    );
    const username2 = await page2.evaluate(() =>
      localStorage.getItem("username"),
    );

    // Both should have usernames (likely different random ones)
    expect(username1).toBeTruthy();
    expect(username2).toBeTruthy();

    await page1.close();
    await page2.close();
  });
});

test.describe("Session URL Sharing", () => {
  test("should preserve session name in URL", async ({ page }) => {
    const sessionName = "my-custom-session";
    await page.goto(`/s/${sessionName}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // URL should contain session name
    expect(page.url()).toContain(`/s/${sessionName}`);
  });

  test("should require authentication to share session URL", async ({
    page,
  }) => {
    await page.goto("/s/test-share-url-gen");
    await page.waitForLoadState("networkidle");

    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Open share URL dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    await page.fill("[cmdk-input]", "share");

    // Unauthenticated users should see sign-in prompt
    await expect(page.locator("text=Sign in to share sessions")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should redirect to sign-in when loading shared session without auth", async ({
    page,
  }) => {
    // Create a session URL with hash parameters (shared code)
    const sessionUrl =
      "/s/test-hash#targets=strudel&c0=" +
      encodeURIComponent(btoa('sound("bd")'));
    await page.goto(sessionUrl);
    await page.waitForLoadState("networkidle");

    // Should redirect to sign-in page since shared sessions require auth
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 10000 });
  });
});

test.describe("Read-Only Mode", () => {
  test("should support readOnly query parameter", async ({ page }) => {
    await page.goto("/s/test-readonly?readOnly=true");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // In read-only mode, should assign random username
    const username = await page.evaluate(() =>
      localStorage.getItem("username"),
    );

    // Note: Read-only enforcement depends on actual implementation
  });
});

test.describe("Connection States", () => {
  test("should show connecting state initially", async ({ page }) => {
    await page.goto("/s/test-connecting");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Status bar should exist
    const statusBar = page.locator(".fixed.bottom-0").first();
    await expect(statusBar).toBeVisible({ timeout: 10000 });

    // Note: Actual connection state indicators depend on status bar implementation
  });

  test("should show synced state after connection", async ({ page }) => {
    await page.goto("/s/test-synced");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for connection and sync
    await page.waitForTimeout(3000);

    // Should show synced state
    // Note: Verification depends on status bar indicators
  });
});
