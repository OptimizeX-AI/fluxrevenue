from playwright.sync_api import sync_playwright, Page, expect

def verify_dashboard(page: Page):
    """
    This script verifies that a user can successfully log in and view the dashboard.
    """
    try:
        # 1. Arrange: Go to the web interface homepage.
    # The service is mapped to port 8080 on the host.
    page.goto("http://localhost:8080", timeout=30000)

        # 2. Act: Fill in the login form and submit it.
        page.get_by_label("Username:").fill("jules")
        page.get_by_label("Password:").fill("supersecret")
        page.get_by_role("button", name="Login").click()

        # 3. Assert: Confirm that the dashboard has loaded.
        dashboard_heading = page.get_by_role("heading", name="Dashboard")
        expect(dashboard_heading).to_be_visible(timeout=10000)

        expect(page.get_by_text("System Overview")).to_be_visible()
        expect(page.get_by_text("Active Projects:")).to_be_visible()

        # 4. Screenshot: Capture the final result.
        screenshot_path = "jules-scratch/verification/dashboard_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred during Playwright verification: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        raise

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        verify_dashboard(page)
        browser.close()
