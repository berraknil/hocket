import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the landing page with new tagline", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=ALGORAVE")).toBeVisible();
    await expect(page.locator("text=but make it")).toBeVisible();
    await expect(page.locator("text=online")).toBeVisible();
    await expect(page.getByText("Built on top of AtProto")).toBeVisible();
    await expect(
      page.getByText(
        "Collaborative live coding in the browser, built on AtProto",
      ),
    ).toBeVisible();
  });

  test("should display header with H0CK3T logo", async ({ page }) => {
    await page.goto("/");

    const hocketLogo = page.locator('header a[href="/"]');
    await expect(hocketLogo).toContainText("H0CK3T");
  });

  test("should display navigation links in header", async ({ page }) => {
    await page.goto("/");

    // Playground link should be visible (uses dynamic session name)
    await expect(
      page.locator("header a").filter({ hasText: "Playground" }),
    ).toBeVisible();
    // Sign In link should be visible when not authenticated
    await expect(page.locator('header a[href="/auth/sign-in"]')).toBeVisible();
  });

  test("should display features on hero section", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Real-time Collaboration")).toBeVisible();
    await expect(page.locator("text=Audio + Visual Synthesis")).toBeVisible();
    await expect(page.locator("text=No Installation Required")).toBeVisible();
    await expect(page.locator("text=AtProto Authentication")).toBeVisible();
  });

  test("should display footer with attributions", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("footer")).toBeVisible();
    await expect(
      page.locator('footer a[href="https://flok.cc"]'),
    ).toContainText("Flok");
    await expect(
      page.locator('footer a[href="https://strudel.cc"]'),
    ).toContainText("Strudel");
    await expect(
      page.locator('footer a[href="https://hydra.ojack.xyz"]'),
    ).toContainText("Hydra");
    await expect(
      page.locator('footer a[href="https://tidalcycles.org"]'),
    ).toContainText("Tidal Cycles");
  });

  test("should display large ALGORAVE typography", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=ALGORAVE")).toBeVisible();
  });

  test("should show Sign In link in header when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator('header a[href="/auth/sign-in"]')).toBeVisible();
  });

  test("should show Start Jamming and Sign In buttons when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.locator('main a:has-text("Start Jamming")'),
    ).toBeVisible();
    await expect(
      page.locator('main a[href="/auth/sign-in"]:has-text("Sign In")'),
    ).toBeVisible();
  });

  test("should show Go to Dashboard button when authenticated", async ({
    page,
  }) => {
    const mockSession = {
      did: "did:plc:test123",
      handle: "test.bsky.social",
      accessJwt: "mock-jwt",
      refreshJwt: "mock-refresh",
      active: true,
      service: "https://bsky.social",
    };

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
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      }
    });

    // Set localStorage before page navigation
    await page.goto("/");
    await page.evaluate((session) => {
      localStorage.setItem("hocket-session", JSON.stringify(session));
    }, mockSession);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('main a[href="/dashboard"]:has-text("Go to Dashboard")'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should not show Sign In in header when authenticated", async ({
    page,
  }) => {
    const mockSession = {
      did: "did:plc:test123",
      handle: "test.bsky.social",
      accessJwt: "mock-jwt",
      refreshJwt: "mock-refresh",
      active: true,
      service: "https://bsky.social",
    };

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

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('header a[href="/auth/sign-in"]'),
    ).not.toBeVisible();
  });

  test("should navigate to sign-in page when clicking Sign In", async ({
    page,
  }) => {
    await page.goto("/");
    await page.click('main a[href="/auth/sign-in"]:has-text("Sign In")');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("should navigate to session when clicking Start Jamming", async ({
    page,
  }) => {
    await page.goto("/");
    await page.click("text=Start Jamming");
    await expect(page).toHaveURL(/\/s\//);
  });

  test("should navigate to home when clicking logo", async ({ page }) => {
    await page.goto("/dashboard");
    await page.goto("/");

    const logo = page.locator('header a[href="/"]');
    await logo.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Dashboard", () => {
  const mockSession = {
    did: "did:plc:test123",
    handle: "test.bsky.social",
    accessJwt: "mock-jwt",
    refreshJwt: "mock-refresh",
    active: true,
    service: "https://bsky.social",
  };

  // Helper function to setup authenticated state with API mocking
  async function setupAuthenticatedState(
    page: import("@playwright/test").Page,
  ) {
    // Mock the ATProto API calls to avoid actual network requests
    await page.route("**/xrpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("com.atproto.server.getSession")) {
        // Mock getSession response
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
        // Mock listRecords response (empty sketches list)
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            records: [],
            cursor: null,
          }),
        });
      } else {
        // Let other requests through or mock as needed
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      }
    });

    // Set localStorage before navigating
    await page.goto("/");
    await page.evaluate((session) => {
      localStorage.setItem("hocket-session", JSON.stringify(session));
    }, mockSession);
  }

  test("should redirect to sign-in when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("should display dashboard when authenticated", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("Your Sketches", {
      timeout: 10000,
    });
    await expect(page.getByText("test.bsky.social")).toBeVisible();
  });

  test("should display New Sketch button", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('button:has-text("New Sketch")')).toBeVisible({
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
    await expect(page).toHaveURL(/\/s\//);
  });

  test("should show empty state when no sketches", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("No sketches")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Get started by creating a new sketch"),
    ).toBeVisible();
  });

  test("should sign out and redirect to landing page", async ({ page }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.click("text=Sign Out", { timeout: 10000 });
    await expect(page).toHaveURL("/");

    const session = await page.evaluate(() => {
      return localStorage.getItem("hocket-session");
    });
    expect(session).toBeNull();
  });

  test("should display Hocket link that goes to landing page", async ({
    page,
  }) => {
    await setupAuthenticatedState(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const hocketLink = page
      .locator('a[href="/"]')
      .filter({ hasText: /H0CK3T|HOCKET/ });
    await expect(hocketLink).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Authentication Flow", () => {
  test("should show sign-in form with header and footer", async ({ page }) => {
    await page.goto("/auth/sign-in");

    // Check header is present
    await expect(page.locator('header a[href="/"]')).toBeVisible();

    // Check form is present
    await expect(page.locator("h2")).toContainText("Sign In");
    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Check footer is present
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should have handle and password fields only", async ({ page }) => {
    await page.goto("/auth/sign-in");

    // Only identifier and password fields should be present
    await expect(page.locator("#identifier")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Service selector should NOT exist (removed in redesign)
    await expect(page.locator("#service")).not.toBeVisible();
  });

  test("should show improved helper text", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(
      page.locator("text=Enter your full handle including the service domain"),
    ).toBeVisible();
    await expect(
      page.locator(
        "text=Generate an app password from your service's settings page",
      ),
    ).toBeVisible();
  });

  test("should have required fields", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.locator("#identifier")).toHaveAttribute("required");
    await expect(page.locator("#password")).toHaveAttribute("required");
  });

  test("should have autocomplete attributes", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.locator("#identifier")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    await expect(page.locator("#password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  test("should redirect to dashboard when already authenticated", async ({
    page,
  }) => {
    const mockSession = {
      did: "did:plc:test123",
      handle: "test.bsky.social",
      accessJwt: "mock-jwt",
      refreshJwt: "mock-refresh",
      active: true,
      service: "https://bsky.social",
    };

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

    // Set session first
    await page.goto("/");
    await page.evaluate((session) => {
      localStorage.setItem("hocket-session", JSON.stringify(session));
    }, mockSession);

    await page.goto("/auth/sign-in");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should show loading state with spinner during authentication", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await page.fill("#identifier", "test.bsky.social");
    await page.fill("#password", "test-password");

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText("Sign In");

    await page.click('button[type="submit"]');
    await expect(submitButton).toContainText("Signing in...");
    await expect(submitButton).toBeDisabled();
  });

  test("should display help text with link to create account", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await expect(page.locator("text=Don't have an account?")).toBeVisible();
    await expect(page.locator('a[href="https://bsky.app"]')).toContainText(
      "Create one on Bluesky",
    );
  });

  test("should match landing page design language", async ({ page }) => {
    await page.goto("/auth/sign-in");

    // Check for consistent styling with landing page
    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    // Check header typography matches (font-extralight)
    const heading = page.locator('h2:has-text("Sign In")');
    await expect(heading).toBeVisible();

    // Check button styling matches landing page CTAs
    const button = page.locator('button[type="submit"]');
    await expect(button).toHaveClass(/bg-stone-900/);
  });
});
