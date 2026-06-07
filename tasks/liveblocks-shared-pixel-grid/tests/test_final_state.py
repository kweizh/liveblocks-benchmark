import os
import socket
import time

import pytest
from playwright.sync_api import sync_playwright, expect
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"

RUN_ID = os.environ.get("ZEALT_RUN_ID", "")
ROOM_ID = f"pixel-grid-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "next_app"
        args = ["npm", "run", "start"]
        env = {**os.environ, "PORT": str(PORT), "NODE_ENV": "production"}
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)
    # extra grace for Next.js readiness
    deadline = time.time() + 60
    while time.time() < deadline and not _port_open("localhost", PORT):
        time.sleep(1)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _wait_for_grid(page, timeout_ms: int = 30000):
    page.wait_for_selector("#pixel-grid", timeout=timeout_ms)
    page.wait_for_selector("#pixel-color", timeout=timeout_ms)
    page.wait_for_selector("#clear-grid", timeout=timeout_ms)
    page.wait_for_function(
        "document.querySelectorAll('#pixel-grid button[data-pixel]').length === 64",
        timeout=timeout_ms,
    )


def _set_color(page, hex_color: str):
    page.evaluate(
        """(color) => {
            const input = document.querySelector('#pixel-color');
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            setter.call(input, color);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        hex_color,
    )


def _click_pixel(page, r: int, c: int):
    page.click(f'#pixel-grid button[data-pixel="{r},{c}"]')


def _wait_for_data_color(page, r: int, c: int, expected: str, timeout_ms: int = 15000):
    page.wait_for_function(
        """([r, c, expected]) => {
            const btn = document.querySelector(
                `#pixel-grid button[data-pixel="${r},${c}"]`
            );
            return btn && btn.getAttribute('data-color') === expected;
        }""",
        arg=[r, c, expected],
        timeout=timeout_ms,
    )


def _wait_for_all_cleared(page, timeout_ms: int = 20000):
    page.wait_for_function(
        """() => {
            const buttons = document.querySelectorAll(
                '#pixel-grid button[data-pixel]'
            );
            if (buttons.length !== 64) return false;
            for (const btn of buttons) {
                if (btn.getAttribute('data-color') !== '') return false;
            }
            return true;
        }""",
        timeout=timeout_ms,
    )


def test_shared_pixel_grid_collaboration(start_app):
    assert RUN_ID, "ZEALT_RUN_ID environment variable must be set for verification."
    assert _port_open("localhost", PORT), (
        f"Next.js production server is not reachable on port {PORT}."
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context_a = browser.new_context()
            context_b = browser.new_context()

            page_a = context_a.new_page()
            page_b = context_b.new_page()

            page_a.goto(BASE_URL, wait_until="domcontentloaded")
            page_b.goto(BASE_URL, wait_until="domcontentloaded")

            _wait_for_grid(page_a)
            _wait_for_grid(page_b)

            # Context A paints (0,0) and (1,1) red.
            _set_color(page_a, "#ff0000")
            _click_pixel(page_a, 0, 0)
            _click_pixel(page_a, 1, 1)

            # Context B paints (7,7) green.
            _set_color(page_b, "#00ff00")
            _click_pixel(page_b, 7, 7)

            for page, label in ((page_a, "A"), (page_b, "B")):
                _wait_for_data_color(page, 0, 0, "#ff0000")
                _wait_for_data_color(page, 1, 1, "#ff0000")
                _wait_for_data_color(page, 7, 7, "#00ff00")

                for r, c, expected in (
                    (0, 0, "#ff0000"),
                    (1, 1, "#ff0000"),
                    (7, 7, "#00ff00"),
                ):
                    actual = page.get_attribute(
                        f'#pixel-grid button[data-pixel="{r},{c}"]',
                        "data-color",
                    )
                    assert actual == expected, (
                        f"Context {label}: button ({r},{c}) expected "
                        f"data-color={expected!r}, got {actual!r}"
                    )

            # Context B clears the grid.
            page_b.click("#clear-grid")

            _wait_for_all_cleared(page_a)

            buttons = page_a.query_selector_all(
                "#pixel-grid button[data-pixel]"
            )
            assert len(buttons) == 64, (
                f"Expected 64 pixel buttons in context A after clear, got {len(buttons)}."
            )
            for btn in buttons:
                color = btn.get_attribute("data-color")
                pixel = btn.get_attribute("data-pixel")
                assert color == "", (
                    f"Context A: button {pixel} expected empty data-color after "
                    f"clear, got {color!r}"
                )

            context_a.close()
            context_b.close()
        finally:
            browser.close()
