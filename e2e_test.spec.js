const { test, expect } = require('@playwright/test');

test.describe('Pesteczka OS End-to-End Verification', () => {
  test('should load, log in, and open an application', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('http://localhost:8080');

    // 2. Verify the login screen is displayed correctly
    await expect(page).toHaveTitle('Pesteczka OS - Premium Business System');
    await expect(page.locator('h1')).toHaveText('Pesteczka OS');

    // Wait for profile cards to be populated by JavaScript
    await page.waitForSelector('.profile-card', { timeout: 10000 });

    // 3. Log in as a user
    const profileCard = page.locator('.profile-card', { hasText: 'Meble Duo' });
    await expect(profileCard).toBeVisible();
    await profileCard.click();

    // 4. Verify that the desktop is visible after login
    await expect(page.locator('#desktop')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#loginScreen')).not.toBeVisible();

    // 5. Verify that desktop icons are rendered
    const dashboardIcon = page.locator('.desktop-icon[data-window="dashboard"]');
    await expect(dashboardIcon).toBeVisible();

    // 6. Open the Dashboard application
    await dashboardIcon.dblclick();

    // 7. Verify the application window appears
    const window = page.locator('#window-dashboard');
    await expect(window).toBeVisible();
    await expect(window.locator('.window-title')).toHaveText('Pulpit');

    console.log("✅ E2E test passed successfully!");
  });
});
