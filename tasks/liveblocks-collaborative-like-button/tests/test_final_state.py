import os
import socket
import time

import pytest
from playwright.sync_api import sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
APP_URL = "http://localhost:3000/"
PORT = 3000


def _env_with_public_run_id():
    env = os.environ.copy()
    run_id = env.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID must be set in the environment for verification."
    env["NEXT_PUBLIC_ZEALT_RUN_ID"] = run_id
    public_key = env.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY")
    assert public_key, "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY must be set for verification."
    return env


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Build and start the Next.js production server, ensure port 3000 is open."""

    class Starter(ProcessStarter):
        name = "next_app"
        args = ["bash", "-lc", "npm run build && npm run start -- -p 3000"]
        env = _env_with_public_run_id()
        timeout = 600
        terminate_on_interrupt = True
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", PORT)) == 0

    xprocess.ensure(Starter.name, Starter)

    # Extra warm-up to give Next.js time to compile on first hit.
    for _ in range(60):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", PORT)) == 0:
                break
        time.sleep(1)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _wait_for_count(page, expected, timeout_ms=30000):
    """Poll #like-count until its text equals `expected` (string) or timeout."""
    deadline = time.time() + timeout_ms / 1000.0
    last_value = None
    while time.time() < deadline:
        try:
            page.wait_for_selector("#like-count", timeout=5000)
            last_value = page.locator("#like-count").inner_text().strip()
            if last_value == str(expected):
                return
        except Exception:
            pass
        time.sleep(0.5)
    raise AssertionError(
        f"Timed out waiting for #like-count to equal {expected!r}; last seen {last_value!r}"
    )


def _click_n(page, n):
    page.wait_for_selector("#like-button", timeout=15000)
    for _ in range(n):
        page.locator("#like-button").click()
        time.sleep(0.25)


def test_initial_render_and_collaborative_increment_and_persistence(start_app):
    """End-to-end Liveblocks Storage verification using two browser contexts."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context_a = browser.new_context()
            context_b = browser.new_context()
            try:
                page_a = context_a.new_page()
                page_b = context_b.new_page()

                # Load both pages.
                page_a.goto(APP_URL, wait_until="domcontentloaded")
                page_b.goto(APP_URL, wait_until="domcontentloaded")

                # 1) Required DOM elements + initial count == 0
                page_a.wait_for_selector("#like-button", timeout=30000)
                page_a.wait_for_selector("#like-count", timeout=30000)
                page_b.wait_for_selector("#like-button", timeout=30000)
                page_b.wait_for_selector("#like-count", timeout=30000)

                _wait_for_count(page_a, 0)
                _wait_for_count(page_b, 0)

                # 2) Two-context collaborative increment: 3 in A, 2 in B -> both see 5
                _click_n(page_a, 3)
                _click_n(page_b, 2)

                _wait_for_count(page_a, 5, timeout_ms=30000)
                _wait_for_count(page_b, 5, timeout_ms=30000)

                # 3) Storage persistence across hard reload in context A
                page_a.reload(wait_until="domcontentloaded")
                page_a.wait_for_selector("#like-count", timeout=30000)
                _wait_for_count(page_a, 5, timeout_ms=30000)
            finally:
                context_a.close()
                context_b.close()
        finally:
            browser.close()
