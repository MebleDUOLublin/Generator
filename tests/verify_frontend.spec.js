const { test, expect } = require('@playwright/test');

test('Pesteczka OS Frontend Verification', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Login
  await page.click('.profile-card');

  // Wait for desktop to be active
  await page.waitForSelector('#desktop.active');

  // Open the offer generator window
  await page.dblclick('[data-window="offers"]');

  // Wait for the window to open
  await page.waitForSelector('#window-offers.active');

  // Switch to the products tab
  await page.click('[data-tab="products"]');

  // Add a new product
  await page.click('#addProductBtn');

  // Wait for the new product card to be added
  await page.waitForSelector('.product-card');

  // Take a screenshot of the offers window
  const offersWindow = await page.$('#window-offers');
  await offersWindow.screenshot({ path: 'frontend_verification.png' });
});
