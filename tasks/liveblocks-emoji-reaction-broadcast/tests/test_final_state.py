"""Final-state verification for the liveblocks-emoji-reaction-broadcast task.

These tests boot the executor's Next.js app and verify, against real Liveblocks
cloud, that:

* the `/api/liveblocks-auth` endpoint actually mints session tokens;
* the reactions page renders the required DOM contract;
* clicking emoji buttons in one client broadcasts events that the OTHER
  connected client receives via `useEventListener`, appends as
  `.emoji-toast` divs in `#reactions-feed`, and counts in
  `#reactions-total-count`.
"""

import json
import os
import re
import socket
import subprocess
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/project"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"

LIVEBLOCKS_SECRET = os.environ.get("LIVEBLOCKS_SECRET_KEY", "")
RUN_ID = os.environ.get("ZEALT_RUN_ID", "local")
ROOM = f"emoji-reactions-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts."""
    build_env = os.environ.copy()
    # Ensure the public run-id env is exposed at build time so the app can
    # reference NEXT_PUBLIC_ZEALT_RUN_ID in the bundle if it wants.
    build_env.setdefault("NEXT_PUBLIC_ZEALT_RUN_ID", RUN_ID)
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=600,
        env=build_env,
    )
    assert result.returncode == 0, (
        f"`npm run build` failed (exit {result.returncode}).\n"
        f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    )


@pytest.fixture(scope="session")
def app_server(xprocess, build_app):
    """Start the production Next.js server on port 3000."""

    server_env = os.environ.copy()
    server_env.setdefault("NEXT_PUBLIC_ZEALT_RUN_ID", RUN_ID)

    class Starter(ProcessStarter):
        name = "liveblocks_emoji_reaction_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = server_env
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/reactions/{ROOM}", timeout=5)
            if r.status_code < 500:
                break
        except requests.RequestException:
            time.sleep(1)
    else:
        pytest.fail("Next.js server did not respond on port 3000 in time.")

    yield BASE_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _assert_no_liveblocks_mocks():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {
        **(pkg.get("dependencies") or {}),
        **(pkg.get("devDependencies") or {}),
    }
    for required in ("@liveblocks/client", "@liveblocks/react",
                     "@liveblocks/node"):
        assert required in deps, (
            f"{required} must remain a real dependency (no mocks)."
        )

    forbidden_patterns = (
        re.compile(r"jest\.mock\([^\)]*liveblocks", re.IGNORECASE),
        re.compile(r"vi\.mock\([^\)]*liveblocks", re.IGNORECASE),
    )
    for root, dirs, files in os.walk(PROJECT_DIR):
        if any(part in root for part in ("/node_modules", "/.next", "/.git")):
            continue
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs")):
                continue
            path = os.path.join(root, name)
            try:
                with open(path, encoding="utf-8", errors="ignore") as fh:
                    body = fh.read()
            except OSError:
                continue
            for pat in forbidden_patterns:
                assert not pat.search(body), (
                    f"Found mocked Liveblocks usage in {path}: {pat.pattern}"
                )


def test_no_liveblocks_mocks_or_stubs(app_server):
    _assert_no_liveblocks_mocks()


def test_auth_endpoint_returns_real_token(app_server):
    response = requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        json={"room": ROOM},
        timeout=15,
    )
    assert response.status_code == 200, (
        f"Expected 200 from /api/liveblocks-auth, got "
        f"{response.status_code}. Body: {response.text[:500]}"
    )
    body = response.json()
    token1 = body.get("token")
    assert isinstance(token1, str) and len(token1) >= 16, (
        f"Auth endpoint did not return a non-empty `token` string. "
        f"Body: {body!r}"
    )

    response2 = requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        json={"room": ROOM},
        timeout=15,
    )
    assert response2.status_code == 200, (
        "Second call to /api/liveblocks-auth failed."
    )
    token2 = response2.json().get("token")
    assert isinstance(token2, str), (
        "Second auth response missing `token`."
    )
    assert token1 != token2, (
        "Auth endpoint returned identical tokens on two calls — looks like a "
        "static fixture; the endpoint must call into @liveblocks/node."
    )


# ---------------------------------------------------------------------------
# Playwright cross-browser test
# ---------------------------------------------------------------------------


def _wait_visible(page, selector: str, timeout_ms: int = 30_000) -> None:
    page.locator(selector).first.wait_for(state="visible", timeout=timeout_ms)


def _toast_emojis(page):
    return page.locator('#reactions-feed .emoji-toast').evaluate_all(
        "els => els.map(el => el.getAttribute('data-emoji'))"
    )


def _toast_count(page) -> int:
    return page.locator('#reactions-feed .emoji-toast').count()


def _total_count(page) -> int:
    txt = (page.locator('#reactions-total-count').text_content() or "").strip()
    digits = re.search(r"-?\d+", txt)
    if not digits:
        return -1
    return int(digits.group(0))


def _wait_toast_count(page, expected: int, timeout_ms: int = 20_000) -> int:
    deadline = time.time() + timeout_ms / 1000.0
    last = 0
    while time.time() < deadline:
        last = _toast_count(page)
        if last >= expected:
            return last
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for #reactions-feed to contain >= {expected} "
        f"toasts; last={last}."
    )


def test_initial_dom_contract(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/reactions/{ROOM}"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx = browser.new_context()
            page = ctx.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=60_000)

            for sel in (
                'button[data-emoji="🎉"]',
                'button[data-emoji="❤️"]',
                'button[data-emoji="🔥"]',
                '#reactions-feed',
                '#reactions-total-count',
            ):
                _wait_visible(page, sel)

            assert _toast_count(page) == 0, (
                "Expected #reactions-feed to be empty on initial page load."
            )
            assert _total_count(page) == 0, (
                "Expected #reactions-total-count to display 0 on initial page load."
            )
        finally:
            browser.close()


def test_cross_client_emoji_broadcast(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/reactions/{ROOM}"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context()
            page_a = ctx_a.new_page()
            page_a.goto(url, wait_until="domcontentloaded", timeout=60_000)
            _wait_visible(page_a, 'button[data-emoji="🎉"]')

            ctx_b = browser.new_context()
            page_b = ctx_b.new_page()
            page_b.goto(url, wait_until="domcontentloaded", timeout=60_000)
            _wait_visible(page_b, '#reactions-feed')

            # Give Liveblocks time to fully connect both clients to the room.
            time.sleep(3)

            # On A: click 🎉, 🎉, 🔥 (in that order).
            page_a.locator('button[data-emoji="🎉"]').click()
            time.sleep(0.4)
            page_a.locator('button[data-emoji="🎉"]').click()
            time.sleep(0.4)
            page_a.locator('button[data-emoji="🔥"]').click()

            # B should receive all 3 via useEventListener.
            _wait_toast_count(page_b, 3, timeout_ms=20_000)

            b_emojis = _toast_emojis(page_b)
            assert b_emojis[:3] == ["🎉", "🎉", "🔥"], (
                "Expected client B's #reactions-feed to contain 3 toasts with "
                f"data-emoji order ['🎉', '🎉', '🔥']; got {b_emojis!r}."
            )

            b_total = _total_count(page_b)
            assert b_total >= 3, (
                "Expected client B's #reactions-total-count to be >= 3; "
                f"got {b_total}."
            )

            # A should also have at least 3 local toasts since the sender must
            # see their own reactions too.
            _wait_toast_count(page_a, 3, timeout_ms=10_000)
            a_total = _total_count(page_a)
            assert a_total >= 3, (
                "Expected sender client A's #reactions-total-count to be >= 3 "
                f"after 3 clicks; got {a_total}."
            )
        finally:
            browser.close()
