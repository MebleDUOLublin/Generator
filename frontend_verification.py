
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        try:
            await page.goto("http://localhost:8080")
            await page.wait_for_selector(".profile-card", timeout=10000)
            print("Profile cards are visible.")
            await page.screenshot(path="frontend_verification.png")
            print("Screenshot saved to frontend_verification.png")
        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="frontend_verification_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
