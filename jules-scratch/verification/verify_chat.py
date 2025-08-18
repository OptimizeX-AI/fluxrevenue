from playwright.sync_api import sync_playwright, Page, expect
import time

def verify_chat_interface(page: Page):
    """
    This script verifies the full chat flow:
    1. Logs into the dashboard.
    2. Opens the chat widget.
    3. Sends a message.
    4. Receives a response.
    5. Takes a screenshot.
    """
    try:
        # 1. Login
        # Port 8080 is for the web_interface service
        page.goto("http://localhost:8080", timeout=30000)
        page.get_by_label("Username:").fill("jules")
        page.get_by_label("Password:").fill("supersecret")
        page.get_by_role("button", name="Login").click()
        expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)
        print("Login successful.")

        # 2. Open Chat
        chat_toggle_button = page.get_by_role("button", name="💬")
        expect(chat_toggle_button).to_be_visible()
        chat_toggle_button.click()
        print("Chat toggle button clicked.")

        # 3. Send a message
        chat_input = page.get_by_placeholder("Ask FluxRevenue...")
        expect(chat_input).to_be_visible()
        chat_input.fill("olá")
        send_button = page.get_by_role("button", name="Send")
        expect(send_button).to_be_enabled()
        send_button.click()
        print("Message sent.")

        # 4. Wait for and verify the bot's response
        # We expect a bot message to appear. The locator finds the last message from the bot.
        bot_response_locator = page.locator(".chat-message-bot").last
        expect(bot_response_locator).to_be_visible(timeout=15000) # Wait longer for response
        expect(bot_response_locator).to_contain_text("Olá!")
        print("Bot response received and verified.")

        # 5. Take Screenshot
        screenshot_path = "jules-scratch/verification/chat_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred during Playwright verification: {e}")
        page.screenshot(path="jules-scratch/verification/chat_error_screenshot.png")
        raise

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        verify_chat_interface(page)
        browser.close()
