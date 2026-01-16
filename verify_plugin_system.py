# verify_plugin_system.py
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them to the terminal
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

        try:
            print("Navigating to the application...")
            await page.goto("http://localhost:8080", wait_until="networkidle")
            print("Page loaded.")

            print("Logging in as 'mebleduo'...")
            await page.locator('[data-profile-id="mebleduo"]').click()
            await expect(page.locator("#desktop")).to_be_visible(timeout=10000)
            print("Login successful, desktop is visible.")

            print("Opening the Offer Generator window via its desktop icon...")
            await page.locator('#desktopIcons [data-window="offers"]').dblclick()

            # Add a short delay to allow the plugin UI to render
            await page.wait_for_timeout(500)

            print("Verifying that the Offer Generator window is visible...")
            offers_window = page.locator("#window-offers")
            await expect(offers_window).to_be_visible(timeout=5000)
            print("Offer Generator window is visible.")

            print("Verifying that the plugin's HTML content has been loaded...")
            # We'll check for an element that is unique to the offers UI, like the 'Add Product' button.
            # First, we need to switch to the "Products" tab.
            await offers_window.locator('[data-tab="products"]').click()
            add_product_button = offers_window.locator("#addProductBtn")
            await expect(add_product_button).to_be_visible(timeout=5000)
            print("Plugin content (#addProductBtn) is visible inside the window.")

            print("✅ Verification successful! The plugin system correctly loaded the Offer Generator app.")

        except Exception as e:
            print(f"❌ Verification failed: {e}")
            await page.screenshot(path="plugin_verification_failure.png")
            print("Screenshot saved to plugin_verification_failure.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
