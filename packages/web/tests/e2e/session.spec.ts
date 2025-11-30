import { test, expect } from "@playwright/test";

test.describe("Session Page", () => {
  test("should load session page", async ({ page }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Should be on the session page
    await expect(page).toHaveURL(/\/s\/test-session/);
  });

  test("should show session editor", async ({ page }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Wait for the editor to be visible (no dialogs should appear)
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show two panes by default (strudel and hydra)", async ({
    page,
  }) => {
    // Use a unique session name to ensure empty state
    const uniqueSession = `test-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Wait for editors to load
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Should have two editors (strudel and hydra)
    const editors = page.locator(".cm-editor");
    await expect(editors).toHaveCount(2, { timeout: 10000 });
  });

  test("should show sample code in new session", async ({ page }) => {
    // Use a unique session name to ensure empty state
    const uniqueSession = `test-sample-${Date.now()}`;
    await page.goto(`/s/${uniqueSession}`);
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Check for strudel sample code (from Strudel Recipes)
    await expect(page.locator("text=From Strudel Recipes").first()).toBeVisible(
      { timeout: 10000 },
    );
  });

  test("should open command dialog with keyboard shortcut", async ({
    page,
  }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Press Ctrl+J to open command dialog
    await page.keyboard.press("Control+j");

    // Command dialog should be visible
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should show status bar", async ({ page }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Status bar should be visible at bottom
    await expect(page.locator(".fixed.bottom-0").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Session Save/Download Functionality", () => {
  const mockSession = {
    did: "did:plc:test123",
    handle: "test.bsky.social",
    accessJwt: "mock-jwt",
    refreshJwt: "mock-refresh",
    active: true,
    service: "https://bsky.social",
  };

  test("should show save option in command dialog when authenticated", async ({
    page,
  }) => {
    // Mock the ATProto API calls
    await page.route("**/xrpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("com.atproto.server.getSession")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            did: mockSession.did,
            handle: mockSession.handle,
            active: true,
          }),
        });
      } else if (url.includes("com.atproto.repo.listRecords")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ records: [], cursor: null }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      }
    });

    // Set up authenticated session before navigation
    await page.goto("/");
    await page.evaluate((session) => {
      localStorage.setItem("hocket-session", JSON.stringify(session));
    }, mockSession);

    // Now navigate to session
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Wait for session to fully initialize
    await page.waitForTimeout(2000);

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for save option
    await page.fill("[cmdk-input]", "save");

    // Wait a bit for filtering
    await page.waitForTimeout(500);

    // Should show save to ATproto option
    await expect(page.getByText("Save to ATproto")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show download option in command dialog", async ({ page }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Wait for editor to load (no dialogs should appear)
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for download option
    await page.fill("[cmdk-input]", "download");

    // Should show download option
    await expect(page.locator("text=Download")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Session Navigation", () => {
  test("should navigate to new session from landing", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Start Jamming");

    // Should be on a session page
    await expect(page).toHaveURL(/\/s\//);
  });

  test("should show editor in session", async ({ page }) => {
    await page.goto("/s/test-session");
    await page.waitForLoadState("networkidle");

    // Verify the session loaded with editor
    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
