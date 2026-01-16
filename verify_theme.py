import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        try:
            await page.goto("http://localhost:8080")

            # Wait for profile cards to be visible
            await expect(page.locator(".profile-card").first).to_be_visible(timeout=20000)
            print("Profile cards are visible.")

            # Click the "Meble Duo" profile
            meble_duo_profile = page.locator('[data-profile-id="mebleduo"]')
            await expect(meble_duo_profile).to_be_visible(timeout=10000)
            print("Meble Duo profile is visible.")
            await meble_duo_profile.click()
            print("Clicked Meble Duo profile.")

            # Wait for the desktop to be visible after login
            await expect(page.locator("#desktop")).to_be_visible(timeout=10000)
            print("Desktop is visible.")

            # Wait for the welcome toast to appear and disappear
            welcome_toast = page.locator(".toast", has_text="Witaj, Meble Duo!")
            await expect(welcome_toast).to_be_visible(timeout=10000)
            print("Welcome toast is visible.")
            await expect(welcome_toast).not_to_be_visible(timeout=10000)
            print("Welcome toast has disappeared.")

            # Check if the theme CSS variables are applied
            body = page.locator("body")

            # Key theme colors for Meble Duo (red theme)
            # These values are taken directly from the profile's theme object
            expected_primary_color = "#dc2626"
            expected_accent_color = "#b91c1c"

            await expect(body).to_have_css("--primary-500", expected_primary_color, timeout=5000)
            print(f"Verified: --primary-500 is {expected_primary_color}")

            await expect(body).to_have_css("--accent-500", expected_accent_color, timeout=5000)
            print(f"Verified: --accent-500 is {expected_accent_color}")

            print("Theme verification successful for Meble Duo!")

            # Add a delay to see if it's a repaint issue
            await page.wait_for_timeout(2000) # 2 second delay

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/theme_verification_error.png")
            raise
        finally:
            await page.screenshot(path="/home/jules/verification/theme_verification_final_delayed.png")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
