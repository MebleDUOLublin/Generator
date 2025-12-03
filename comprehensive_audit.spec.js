const { test, expect } = require('@playwright/test');

test.describe('Pesteczka OS Comprehensive System Audit', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        // Log in as Alekrzesla
        await page.click('.profile-card:has-text("Alekrzesła")');
        // Wait for desktop to be active
        await expect(page.locator('#desktop')).toHaveClass(/active/);
        await page.waitForTimeout(1000); // Wait for animations
    });

    test('Offer Generator App - Full Workflow', async ({ page }) => {
        // 1. Open the offers window
        await page.dblclick('[data-window="offers"]');
        const offersWindow = page.locator('#window-offers');
        await expect(offersWindow).toBeVisible();
        await expect(offersWindow).toHaveClass(/focused/);

        // 2. Add a new product
        await page.click('#addProductBtn');
        const productList = offersWindow.locator('#productList');
        await expect(productList.locator('.product-card')).toHaveCount(1);
        const productNameInput = productList.locator('.product-card input[placeholder="Nazwa produktu"]');
        await productNameInput.fill('Test Product');
        await expect(productNameInput).toHaveValue('Test Product');

        // 3. Save the offer
        const offerName = `Test-Offer-${Date.now()}`;
        await page.click('button:has-text("Zapisz ofertę")');
        await page.fill('#saveOfferName', offerName);
        await page.click('#saveOfferConfirm');
        await expect(page.locator('.toast.success')).toBeVisible();

        // 4. Clear and Load the offer
        await page.click('button:has-text("Wyczyść")');
        await expect(productList.locator('.product-card')).toHaveCount(0);
        await page.click('button:has-text("Wczytaj ofertę")');
        await page.click(`.load-offer-item:has-text("${offerName}")`);
        await page.click('#loadOfferConfirm');
        await expect(productList.locator('.product-card')).toHaveCount(1);
        await expect(productList.locator('input[value="Test Product"]')).toBeVisible();

        // 5. Check PDF generation button
        await expect(page.locator('button:has-text("Generuj PDF")')).toBeEnabled();

        // 6. Close the window
        await offersWindow.locator('.window-control-btn[data-action="close"]').click();
        await expect(offersWindow).not.toBeVisible();
    });

    test('Settings App - Save and Verify', async ({ page }) => {
        // 1. Open the settings window
        await page.dblclick('[data-window="settings"]');
        const settingsWindow = page.locator('#window-settings');
        await expect(settingsWindow).toBeVisible();

        // 2. Change a setting
        const newFullName = `Test User ${Date.now()}`;
        const fullNameInput = settingsWindow.locator('#profileFullName');
        await fullNameInput.fill(newFullName);
        await expect(fullNameInput).toHaveValue(newFullName);

        // 3. Save settings
        await settingsWindow.locator('#saveProfileSettingsBtn').click();
        await expect(page.locator('.toast.success')).toBeVisible();

        // 4. Close and reopen to verify persistence
        await settingsWindow.locator('.window-control-btn[data-action="close"]').click();
        await expect(settingsWindow).not.toBeVisible();

        await page.dblclick('[data-window="settings"]');
        await expect(settingsWindow).toBeVisible();
        await expect(settingsWindow.locator('#profileFullName')).toHaveValue(newFullName);

        // 5. Close the window
        await settingsWindow.locator('.window-control-btn[data-action="close"]').click();
    });

    test('Other Apps - Open and Close', async ({ page }) => {
        const apps = ['dashboard', 'snake', 'domator'];
        for (const app of apps) {
            const windowSelector = `#window-${app}`;
            const iconSelector = `[data-window="${app}"]`;

            await page.dblclick(iconSelector);
            const appWindow = page.locator(windowSelector);
            await expect(appWindow).toBeVisible({ timeout: 10000 }); // Increased timeout for loading

            await page.screenshot({ path: `audit_screenshot_${app}.png` });

            await appWindow.locator('.window-control-btn[data-action="close"]').click();
            await expect(appWindow).not.toBeVisible();
        }
    });

    test('Core UI - Window Management and Logout', async ({ page }) => {
        // 1. Open a window and test minimize
        await page.dblclick('[data-window="offers"]');
        const offersWindow = page.locator('#window-offers');
        await expect(offersWindow).toBeVisible();

        await offersWindow.locator('.window-control-btn[data-action="minimize"]').click();
        await expect(offersWindow).not.toBeVisible();

        // 2. Click taskbar icon to restore
        await page.click('.taskbar-icon[data-window="offers"]');
        await expect(offersWindow).toBeVisible();

        // 3. Logout
        await page.click('#startBtn');
        await page.click('#logoutBtn');
        await expect(page.locator('#loginScreen')).not.toHaveClass(/hidden/);
    });
});
