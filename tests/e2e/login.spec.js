const { test, expect } = require("@playwright/test");

test.describe("E2E - login via test route", () => {
    test("can seed a session via test route and open dashboard", async ({
        page,
    }) => {
        // Navigate to the test login endpoint which is only available in test mode.
        await page.goto("/__test/login");

        // After redirect we should land on /dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Basic smoke check: dashboard page should show something expected
        // e.g., a heading or nav element (adjust selector if needed)
        await expect(page.locator("h1").first()).toBeVisible();
    });
});
