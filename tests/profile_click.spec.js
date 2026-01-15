const { test, expect } = require('@playwright/test');

test.describe('Profile Selection and Desktop Verification', () => {
  test('clicking "Alekrzesła" profile should log in and display the correct desktop UI', async ({ page }) => {
    // Navigate to the application's entry point
    await page.goto('http://localhost:8080');

    // Wait for the profile selector to be ready and profiles to be loaded
    await expect(page.locator('#profileSelector')).toBeVisible();

    // Target the "Alekrzesła" profile card specifically
    const alekrzeslaProfile = page.locator('.profile-card:has-text("Alekrzesła")');
    await expect(alekrzeslaProfile).toBeVisible({ timeout: 10000 });

    // Click the profile card to log in
    await alekrzeslaProfile.click();

    // Wait for the login screen to disappear
    await expect(page.locator('#loginScreen')).not.toBeVisible({ timeout: 5000 });

    // Wait for the desktop to become active and visible
    const desktop = page.locator('#desktop');
    await expect(desktop).toBeVisible({ timeout: 5000 });
    await expect(desktop).toHaveClass(/active/);

    // Explicitly wait for a desktop icon to be rendered to ensure the UI is populated
    const offerIcon = page.locator('.desktop-icon[data-window="offers"]');
    await expect(offerIcon).toBeVisible({ timeout: 5000 });

    // Give a moment for animations to complete
    await page.waitForTimeout(1000);

    // Take a screenshot of the entire page to verify the desktop
    await page.screenshot({ path: '/home/jules/verification/frontend_verification.png', fullPage: true });
  });
});
