
from playwright.sync_api import Page, expect, sync_playwright

def verify_wallpaper_previews(page: Page):

    # 1. Arrange: Go to the application.
    page.goto("http://localhost:8080")

    # 2. Act: Login and open the settings window.
    page.locator('.profile-card').first.click()

    # Wait for the desktop to be active
    expect(page.locator('#desktop')).to_have_class('desktop active')

    # Click the settings icon on the desktop
    page.locator('.desktop-icon[data-window="settings"]').click()

    # Wait for the settings window title to be visible
    expect(page.locator('#window-settings-title')).to_be_visible()

    # 3. Assert: Check if the wallpaper previews are visible.
    expect(page.locator('.wallpaper-preview[data-wallpaper="wallpaper1"]')).to_be_visible()
    expect(page.locator('.wallpaper-preview[data-wallpaper="wallpaper2"]')).to_be_visible()
    expect(page.locator('.wallpaper-preview[data-wallpaper="wallpaper3"]')).to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="frontend_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_wallpaper_previews(page)
        finally:
            browser.close()
