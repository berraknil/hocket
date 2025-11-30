import { test, expect, Page } from "@playwright/test";

// Helper function to setup authenticated state with API mocking
async function setupAuthenticatedState(page: Page) {
  const mockSession = {
    did: "did:plc:test123",
    handle: "test.bsky.social",
    accessJwt: "mock-jwt",
    refreshJwt: "mock-refresh",
    active: true,
    service: "https://bsky.social",
  };

  // Mock the ATProto API calls to avoid actual network requests
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
    } else if (url.includes("com.atproto.repo.getRecord")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          uri: "at://did:plc:test/cc.hocket.sketch/123",
          cid: "test-cid",
          value: {
            name: "Test Sketch",
            panes: [{ target: "strudel", content: 'sound("bd")', order: 0 }],
            sessionName: "test-session",
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }
  });

  await page.goto("/");
  await page.evaluate((session) => {
    localStorage.setItem("hocket-session", JSON.stringify(session));
  }, mockSession);
}

test.describe("Sketch Management - ATproto Save/Load", () => {
  test("should show save option when authenticated", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/s/test-save");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for save
    await page.fill("[cmdk-input]", "save");

    // Should show save to ATproto option
    await expect(page.getByText("Save to ATproto")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should open save dialog when clicking save option", async ({
    page,
  }) => {
    await setupAuthenticatedState(page);

    await page.goto("/s/test-save-dialog");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Click save option
    await page.fill("[cmdk-input]", "save");
    await page.click("text=Save to ATproto");

    // Save dialog should open
    await page.waitForTimeout(500);
  });

  test("should show download option in command palette", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/s/test-download");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });

    // Open command dialog
    await page.keyboard.press("Control+j");
    await expect(
      page.getByRole("dialog", { name: "Command Menu" }),
    ).toBeVisible({ timeout: 5000 });

    // Search for download
    await page.fill("[cmdk-input]", "download");

    // Should show download option
    await expect(page.getByText("Download")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Sketch List on Dashboard", () => {
  test("should show empty state when no sketches", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should show empty state
    await expect(page.getByText("No sketches")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Get started by creating a new sketch"),
    ).toBeVisible();
  });

  test("should show refresh button", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Should show refresh button
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should navigate to new session when clicking New Sketch", async ({
    page,
  }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.click('button:has-text("New Sketch")', { timeout: 10000 });

    // Should navigate to a new session
    await expect(page).toHaveURL(/\/s\//);
  });
});

test.describe("Sketch Loading from URL", () => {
  test("should accept sketch parameter in URL", async ({ page }) => {
    await setupAuthenticatedState(page);

    // Navigate with sketch parameter
    const sketchUri = "at://did:plc:test/cc.hocket.sketch/123";
    await page.goto(`/s/test-session?sketch=${encodeURIComponent(sketchUri)}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".cm-editor").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
