const { test, expect } = require('@playwright/test');

test.describe('Login Screen Verification', () => {
  test('should render the login screen correctly', async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Wait for the login screen and some time for animations
    await expect(page.locator('#loginScreen')).toBeVisible();
    await page.waitForTimeout(1000); // Wait for animations to settle
    await page.screenshot({ path: 'login-screen-verification.png', fullPage: true });
  });
});
