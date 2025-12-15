const { test, expect } = require('@playwright/test');

test.describe('Profile Selection', () => {
  test('clicking a profile should log in and display the desktop', async ({ page }) => {
    // Navigate to the application's entry point
    await page.goto('http://localhost:8080');

    // Wait for the profile selector to be ready and profiles to be loaded
    await expect(page.locator('#profileSelector')).toBeVisible();

    // Avoid race conditions by waiting for the loading spinner to disappear.
    // We target the first profile card, which should exist after loading.
    const firstProfile = page.locator('.profile-card').first();
    await expect(firstProfile).toBeVisible({ timeout: 10000 }); // Increased timeout for slower machines

    // Click the first profile card to attempt login
    await firstProfile.click();

    // Wait for the login screen to disappear, which is a reliable indicator
    // that the login process has been initiated successfully.
    await expect(page.locator('#loginScreen')).not.toBeVisible({ timeout: 5000 });

    // After a successful login, the desktop container should become visible.
    // This is the key assertion to verify the login functionality.
    const desktop = page.locator('#desktop');
    await expect(desktop).toBeVisible({ timeout: 5000 });
  });
});
