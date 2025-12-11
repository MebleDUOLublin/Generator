const { test, expect } = require('@playwright/test');

test('diagnose login screen javascript errors', async ({ page }) => {
  const consoleLogs = [];
  const pageErrors = [];

  // Listen for all console messages
  page.on('console', msg => {
    const text = msg.text();
    // Filter out noisy Vite dev server messages if they appear
    if (!text.includes('[vite]')) {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  // Listen for uncaught exceptions
  page.on('pageerror', error => {
    pageErrors.push(error.stack);
  });

  // Navigate and wait for things to happen (or fail)
  try {
    await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // Give scripts time to run and fail
  } catch (e) {
    console.log(`Navigation failed: ${e.message}`);
  }

  // Take a screenshot for visual confirmation
  await page.screenshot({ path: 'login_screen_diagnosis_2.png' });

  // Output the captured logs
  console.log('--- DIAGNOSTIC REPORT ---');
  console.log('\n--- BROWSER CONSOLE ---');
  if (consoleLogs.length > 0) {
    console.log(consoleLogs.join('\n'));
  } else {
    console.log('No console messages were captured.');
  }

  console.log('\n--- UNCAUGHT EXCEPTIONS ---');
  if (pageErrors.length > 0) {
    console.log(pageErrors.join('\n'));
  } else {
    console.log('No uncaught exceptions were reported.');
  }
  console.log('\n--- END REPORT ---');

  // A dummy expectation to ensure the test runner sees a valid test
  expect(true).toBe(true);
});
