import os
import socket
import time

import pytest
from playwright.sync_api import expect, sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session")
def next_dev_server(xprocess):
    """Start the Next.js dev server for verification."""

    run_id = os.environ.get("ZEALT_RUN_ID", "")
    server_env = os.environ.copy()
    server_env["NEXT_PUBLIC_ZEALT_RUN_ID"] = run_id
    server_env["PORT"] = str(PORT)
    server_env["BROWSER"] = "none"
    server_env["CI"] = "1"

    class Starter(ProcessStarter):
        name = "next_dev_server"
        args = ["npm", "run", "dev", "--", "--port", str(PORT)]
        env = server_env
        timeout = 240
        terminate_on_interrupt = True
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    # Give Next.js a moment to be fully responsive on the first request.
    deadline = time.time() + 60
    last_err = None
    while time.time() < deadline:
        try:
            import urllib.request

            with urllib.request.urlopen(BASE_URL, timeout=5) as r:
                if r.status == 200:
                    break
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(2)
    else:
        raise RuntimeError(f"Next.js dev server did not become ready: {last_err}")

    yield BASE_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def playwright_session():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


def _li_locator(page, product_id: str):
    return page.locator(f'#cart-items li[data-cart-item="{product_id}"]')


def _total_locator(page):
    return page.locator("#cart-total-qty")


def test_collaborative_shopping_cart(next_dev_server, playwright_session):
    base_url = next_dev_server
    browser = playwright_session

    context_a = browser.new_context()
    context_b = browser.new_context()
    try:
        page_a = context_a.new_page()
        page_b = context_b.new_page()

        page_a.goto(base_url, wait_until="networkidle")
        page_b.goto(base_url, wait_until="networkidle")

        # Initial DOM contract: catalog buttons, empty list, total=0.
        for product in ("apple", "bread", "milk"):
            expect(page_a.locator(f'button[data-add-product="{product}"]')).to_be_visible(
                timeout=30_000
            )
            expect(page_b.locator(f'button[data-add-product="{product}"]')).to_be_visible(
                timeout=30_000
            )
        expect(page_a.locator("#cart-items")).to_be_visible(timeout=30_000)
        expect(page_b.locator("#cart-items")).to_be_visible(timeout=30_000)
        expect(_total_locator(page_a)).to_have_text("0", timeout=30_000)
        expect(_total_locator(page_b)).to_have_text("0", timeout=30_000)

        # User A: add apple twice, bread once.
        page_a.click('button[data-add-product="apple"]')
        page_a.click('button[data-add-product="apple"]')
        page_a.click('button[data-add-product="bread"]')

        # User B observes A's changes.
        expect(_li_locator(page_b, "apple")).to_have_attribute("data-qty", "2", timeout=20_000)
        expect(_li_locator(page_b, "bread")).to_have_attribute("data-qty", "1", timeout=20_000)
        expect(page_b.locator('#cart-items li[data-cart-item="milk"]')).to_have_count(
            0, timeout=20_000
        )
        expect(_total_locator(page_b)).to_have_text("3", timeout=20_000)

        # Each row in B must expose its remove button.
        expect(page_b.locator('button[data-remove-item="apple"]')).to_be_visible()
        expect(page_b.locator('button[data-remove-item="bread"]')).to_be_visible()

        # User B: add milk; User A observes.
        page_b.click('button[data-add-product="milk"]')

        expect(_li_locator(page_a, "milk")).to_have_attribute("data-qty", "1", timeout=20_000)
        expect(_li_locator(page_a, "apple")).to_have_attribute("data-qty", "2", timeout=20_000)
        expect(_li_locator(page_a, "bread")).to_have_attribute("data-qty", "1", timeout=20_000)
        expect(_total_locator(page_a)).to_have_text("4", timeout=20_000)

        # User B: remove bread; User A observes removal.
        page_b.click('button[data-remove-item="bread"]')

        expect(page_a.locator('#cart-items li[data-cart-item="bread"]')).to_have_count(
            0, timeout=20_000
        )
        expect(_li_locator(page_a, "apple")).to_have_attribute("data-qty", "2", timeout=20_000)
        expect(_li_locator(page_a, "milk")).to_have_attribute("data-qty", "1", timeout=20_000)
        expect(_total_locator(page_a)).to_have_text("3", timeout=20_000)
    finally:
        context_a.close()
        context_b.close()
