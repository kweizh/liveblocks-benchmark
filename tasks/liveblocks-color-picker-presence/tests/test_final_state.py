import os
import re
import socket
import subprocess
import time

import pytest
import requests
from playwright.sync_api import sync_playwright
from xprocess import ProcessStarter


PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _build_env() -> dict:
    env = os.environ.copy()
    run_id = env.get("ZEALT_RUN_ID", "")
    # Re-export the public run-id so Next.js bakes it into the client bundle.
    env["NEXT_PUBLIC_ZEALT_RUN_ID"] = run_id
    return env


@pytest.fixture(scope="session", autouse=True)
def build_project():
    """Run `npm run build` so NEXT_PUBLIC_* values are baked in correctly."""
    env = _build_env()
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=600,
    )
    assert result.returncode == 0, (
        f"`npm run build` failed in {PROJECT_DIR}.\n"
        f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
    yield


@pytest.fixture(scope="session")
def start_app(xprocess, build_project):
    """Start the Next.js production server in the background."""
    build_env = _build_env()

    class Starter(ProcessStarter):
        name = "next_start"
        args = ["npm", "run", "start"]
        env = build_env
        timeout = 180
        terminate_on_interrupt = True
        popen_kwargs = {"cwd": PROJECT_DIR}

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    # Extra readiness wait: server may be open before app fully responds.
    deadline = time.time() + 60
    last_err = None
    while time.time() < deadline:
        try:
            r = requests.get(BASE_URL + "/", timeout=5)
            if r.status_code == 200:
                break
        except Exception as e:  # noqa: BLE001
            last_err = e
        time.sleep(1)
    else:
        raise RuntimeError(f"Server not responding 200 at {BASE_URL}/: {last_err}")

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_homepage_renders_color_input_and_user_list(start_app):
    """The page must contain #color-input and #user-colors elements."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(BASE_URL + "/", wait_until="domcontentloaded")
            page.wait_for_selector("#color-input", timeout=30000)
            page.wait_for_selector("#user-colors", timeout=30000)
            color_input_type = page.eval_on_selector(
                "#color-input", "el => el.getAttribute('type')"
            )
            assert color_input_type == "color", (
                f"#color-input must have type='color', got: {color_input_type!r}"
            )
            tag = page.eval_on_selector("#user-colors", "el => el.tagName")
            assert tag.lower() == "ul", f"#user-colors must be a <ul>, got <{tag.lower()}>"
        finally:
            browser.close()


def _set_color(page, hex_color: str) -> None:
    """Set color value and dispatch an input event to trigger React updates."""
    page.eval_on_selector(
        "#color-input",
        """
        (el, color) => {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, color);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        """,
        hex_color,
    )


def _normalize_hex(value: str) -> str:
    """Normalize hex colors to lowercase #rrggbb."""
    if value is None:
        return ""
    v = value.strip().lower()
    if not v.startswith("#"):
        v = "#" + v
    return v


def _rgb_to_hex(rgb: str) -> str:
    """Convert e.g. 'rgb(255, 0, 0)' or 'rgba(255,0,0,1)' to '#ff0000'."""
    m = re.search(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", rgb)
    if not m:
        return ""
    r, g, b = (int(m.group(i)) for i in (1, 2, 3))
    return f"#{r:02x}{g:02x}{b:02x}"


def _read_swatches(page):
    """Return list of (connection_id, data_color_lower, css_bg_hex_lower)."""
    handles = page.query_selector_all("#user-colors > li")
    out = []
    for h in handles:
        cid = h.get_attribute("data-connection-id") or ""
        color = _normalize_hex(h.get_attribute("data-color") or "")
        bg = page.evaluate("el => getComputedStyle(el).backgroundColor", h)
        out.append((cid, color, _rgb_to_hex(bg or "")))
    return out


def test_two_contexts_share_presence_colors(start_app):
    """Two contexts must each see two distinct connections with #ff0000 and #00ff00."""
    color_a = "#ff0000"
    color_b = "#00ff00"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            ctx_a = browser.new_context()
            ctx_b = browser.new_context()

            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(BASE_URL + "/", wait_until="domcontentloaded")
            page_a.wait_for_selector("#color-input", timeout=30000)
            page_a.wait_for_selector("#user-colors", timeout=30000)

            page_b.goto(BASE_URL + "/", wait_until="domcontentloaded")
            page_b.wait_for_selector("#color-input", timeout=30000)
            page_b.wait_for_selector("#user-colors", timeout=30000)

            _set_color(page_a, color_a)
            _set_color(page_b, color_b)

            def _wait_two_colors(page, timeout_s: float = 30.0):
                deadline = time.time() + timeout_s
                last = []
                while time.time() < deadline:
                    swatches = _read_swatches(page)
                    last = swatches
                    if len(swatches) == 2:
                        colors = sorted(s[1] for s in swatches)
                        if colors == sorted([color_a, color_b]):
                            return swatches
                    # Re-assert colors to handle late-arriving presence.
                    _set_color(page, color_a if page is page_a else color_b)
                    time.sleep(0.5)
                raise AssertionError(
                    f"Timed out waiting for 2 swatches with {color_a} and {color_b}. "
                    f"Last seen: {last}"
                )

            swatches_a = _wait_two_colors(page_a)
            swatches_b = _wait_two_colors(page_b)

            for label, swatches in (("A", swatches_a), ("B", swatches_b)):
                colors = sorted(s[1] for s in swatches)
                assert colors == sorted([color_a, color_b]), (
                    f"Context {label}: expected colors {[color_a, color_b]}, got {colors}"
                )
                connection_ids = [s[0] for s in swatches]
                assert all(connection_ids), (
                    f"Context {label}: every <li> must have a non-empty data-connection-id, "
                    f"got {connection_ids}"
                )
                assert len(set(connection_ids)) == 2, (
                    f"Context {label}: connection IDs must be distinct, got {connection_ids}"
                )
                for cid, color, bg_hex in swatches:
                    assert bg_hex == color, (
                        f"Context {label}: <li data-connection-id='{cid}'> "
                        f"background-color {bg_hex!r} does not match data-color {color!r}"
                    )
        finally:
            browser.close()
