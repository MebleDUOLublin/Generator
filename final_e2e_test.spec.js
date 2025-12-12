const { test, expect } = require('@playwright/test');

test.describe('Pesteczka OS Final End-to-End Verification', () => {
  test('should load, log in, open an app, and verify content', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('http://localhost:8080');

    // 2. Verify the login screen is displayed correctly
    await expect(page).toHaveTitle('Pesteczka OS - Premium Business System');
    await expect(page.locator('h1.login-title')).toHaveText('Pesteczka OS');

    // 3. Wait for profile cards to be populated and verify "Meble Duo" is present
    await page.waitForSelector('.profile-card', { timeout: 10000 });
    const profileCard = page.locator('.profile-card', { hasText: 'Meble Duo' });
    await expect(profileCard).toBeVisible();

    // 4. Click the profile and log in
    await profileCard.click();

    // 5. Verify that the desktop is visible and the login screen is hidden
    await expect(page.locator('#desktop')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#loginScreen')).not.toBeVisible();

    // 6. Verify that the "Dashboard" desktop icon is rendered
    const dashboardIcon = page.locator('.desktop-icon[data-window="dashboard"]');
    await expect(dashboardIcon).toBeVisible();

    // 7. Double-click the icon to open the Dashboard application
    await dashboardIcon.dblclick();

    // 8. Verify the application window appears and has the correct title
    const window = page.locator('#window-dashboard');
    await expect(window).toBeVisible();
    await expect(window.locator('.window-title span').last()).toHaveText('Pulpit');

    // 9. Verify the content of the dashboard window is loaded
    const welcomeHeader = window.locator('h1');
    await expect(welcomeHeader).toHaveText('Witaj w Pesteczka OS, Meble Duo!');

    console.log("✅ Final E2E test passed successfully! The application is stable.");
  });
});
