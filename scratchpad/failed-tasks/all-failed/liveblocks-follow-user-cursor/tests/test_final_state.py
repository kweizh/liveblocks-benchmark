"""Final-state verification for the liveblocks-follow-user-cursor task.

These tests boot the executor's Next.js app and verify, against real Liveblocks
cloud, that:

* the `/api/liveblocks-auth` endpoint mints a session token;
* two browser contexts visiting `/follow/<room>` see each other in the
  `#avatars` panel as `[data-follow-user]` buttons;
* clicking a remote user's avatar in context B sets `#following-name` to the
  followed user's `presence.name` and updates `#viewport`'s
  `data-follow-x` / `data-follow-y` to track that user's live cursor.
"""

import json
import os
import re
import socket
import subprocess
import sys
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/project"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"

LIVEBLOCKS_SECRET = os.environ.get("LIVEBLOCKS_SECRET_KEY", "")
RUN_ID = os.environ.get("ZEALT_RUN_ID", "local")
ROOM = f"follow-cursor-{RUN_ID}"

# Tolerance (in CSS pixels) for cursor coordinate comparisons after they have
# round-tripped through real Liveblocks cloud and back.
COORD_TOLERANCE = 5


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts.

    Re-exports ZEALT_RUN_ID as NEXT_PUBLIC_ZEALT_RUN_ID so the room id literal
    is baked into the client bundle.
    """
    build_env = os.environ.copy()
    build_env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID
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
    server_env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID

    class Starter(ProcessStarter):
        name = "liveblocks_follow_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = server_env
        stdout = sys.stdout
        stderr = sys.stderr
        close_fds = True
        preexec_fn = os.setsid
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    # Extra grace: Next sometimes accepts connections before fully ready.
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/follow/{ROOM}", timeout=5)
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
    """Make sure no source file replaces Liveblocks with a stub."""
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {
        **(pkg.get("dependencies") or {}),
        **(pkg.get("devDependencies") or {}),
    }
    for required in (
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
    ):
        assert required in deps, (
            f"{required} must remain a real dependency (no mocks)."
        )

    src_root = PROJECT_DIR
    forbidden_patterns = (
        re.compile(r"jest\.mock\([^\)]*liveblocks", re.IGNORECASE),
        re.compile(r"vi\.mock\([^\)]*liveblocks", re.IGNORECASE),
    )
    for root, dirs, files in os.walk(src_root):
        if any(
            part in root
            for part in ("/node_modules", "/.next", "/.git")
        ):
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
    """The /api/liveblocks-auth endpoint must mint a real session token."""
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
    token = body.get("token")
    assert isinstance(token, str) and len(token) >= 16, (
        f"Auth endpoint did not return a non-empty `token` string. "
        f"Body: {body!r}"
    )


# ---------------------------------------------------------------------------
# Playwright two-context end-to-end test
# ---------------------------------------------------------------------------


def _set_identity(page, value: str) -> None:
    locator = page.locator('[data-testid="identity-input"]')
    locator.wait_for(state="visible", timeout=30_000)
    locator.fill("")
    locator.fill(value)
    locator.press("Tab")


def _wait_for_follow_button(page, label: str, timeout_ms: int = 30_000):
    """Wait until #avatars contains a button labelled `label`."""
    locator = page.locator(
        f'#avatars button[data-follow-user]:has-text("{label}")'
    )
    locator.first.wait_for(state="visible", timeout=timeout_ms)
    return locator.first


def _read_int_attr(page, selector: str, attr: str):
    raw = page.locator(selector).get_attribute(attr)
    if raw is None:
        return None
    try:
        return int(round(float(raw)))
    except (TypeError, ValueError):
        return None


def _wait_for_follow_coords(
    page,
    expected_x: int,
    expected_y: int,
    tolerance: int = COORD_TOLERANCE,
    timeout_ms: int = 20_000,
):
    deadline = time.time() + timeout_ms / 1000.0
    last_x = last_y = None
    while time.time() < deadline:
        x = _read_int_attr(page, "#viewport", "data-follow-x")
        y = _read_int_attr(page, "#viewport", "data-follow-y")
        last_x, last_y = x, y
        if (
            x is not None
            and y is not None
            and abs(x - expected_x) <= tolerance
            and abs(y - expected_y) <= tolerance
        ):
            return x, y
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for #viewport[data-follow-x≈{expected_x},"
        f"data-follow-y≈{expected_y}] (tolerance ±{tolerance}). "
        f"Last observed: x={last_x!r}, y={last_y!r}."
    )


def _wait_for_following_name(page, name: str, timeout_ms: int = 20_000) -> None:
    locator = page.locator("#following-name")
    locator.wait_for(state="attached", timeout=timeout_ms)
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        last = (locator.text_content() or "").strip()
        if last == name:
            return
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for #following-name to equal {name!r}; "
        f"last observed: {last!r}."
    )


def _move_pointer(page, x: int, y: int) -> None:
    """Move the real pointer over the page so onPointerMove fires."""
    # Two moves so browsers reliably emit pointermove (not just pointerenter).
    page.mouse.move(x - 5, y - 5)
    page.mouse.move(x, y)


def test_two_context_follow_cursor(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/follow/{ROOM}"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context(viewport={"width": 1280, "height": 720})
            ctx_b = browser.new_context(viewport={"width": 1280, "height": 720})
            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(url, wait_until="domcontentloaded", timeout=60_000)
            page_b.goto(url, wait_until="domcontentloaded", timeout=60_000)

            for page in (page_a, page_b):
                page.locator('[data-testid="identity-input"]').wait_for(
                    state="visible", timeout=30_000
                )
                page.locator("#avatars").wait_for(
                    state="attached", timeout=30_000
                )
                page.locator("#viewport").wait_for(
                    state="attached", timeout=30_000
                )
                page.locator("#following-name").wait_for(
                    state="attached", timeout=30_000
                )

            _set_identity(page_a, "alice")
            _set_identity(page_b, "bob")

            # Both pages should eventually see EACH OTHER as a follow button.
            _wait_for_follow_button(page_a, "bob")
            alice_btn_on_b = _wait_for_follow_button(page_b, "alice")

            # A: move pointer to a known location so presence.cursor updates.
            target_x, target_y = 137, 209
            _move_pointer(page_a, target_x, target_y)
            # Give Liveblocks a moment to broadcast presence.
            time.sleep(1.0)

            # B clicks alice's avatar -> follow alice.
            alice_btn_on_b.click()

            _wait_for_following_name(page_b, "alice")
            _wait_for_follow_coords(page_b, target_x, target_y)

            # Move A's pointer again -> B's viewport must update.
            new_x, new_y = 60, 410
            _move_pointer(page_a, new_x, new_y)
            _wait_for_follow_coords(page_b, new_x, new_y)
        finally:
            browser.close()
