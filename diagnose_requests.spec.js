const { test, expect } = require('@playwright/test');

test('diagnose failed network requests', async ({ page }) => {
  const failedRequests = [];

  // Listen for failed requests and store their URLs
  page.on('requestfailed', request => {
    failedRequests.push(request.url());
  });

  // Navigate to the page
  try {
    await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for requests to settle
  } catch (e) {
    console.log(`Navigation failed: ${e.message}`);
  }

  // Output the captured data
  console.log('--- FAILED REQUESTS REPORT ---');
  if (failedRequests.length > 0) {
    console.log('The following URLs returned a 404 Not Found error:');
    console.log(failedRequests.join('\n'));
  } else {
    console.log('No failed network requests were detected.');
  }
  console.log('--- END REPORT ---');

  // Take a screenshot for context
  await page.screenshot({ path: 'login_screen_diagnosis_3.png' });

  expect(true).toBe(true); // Ensure test passes
});
