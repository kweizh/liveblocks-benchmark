"""Final-state verification for the liveblocks-cursor-positions task.

These tests boot the executor's Next.js app (production build) and verify,
against real Liveblocks cloud, that two browser contexts visiting
`/cursors/<room>` see each other's pointer positions broadcast through
Liveblocks Presence and rendered as DOM elements with `data-cursor-user`,
`data-x`, and `data-y` attributes.
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
ROOM = f"cursor-positions-{RUN_ID}"

CONTAINER_W = 800
CONTAINER_H = 600


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once with NEXT_PUBLIC_ZEALT_RUN_ID exported."""
    env = os.environ.copy()
    env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID

    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        env=env,
        timeout=600,
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
        name = "liveblocks_cursors_app"
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
            r = requests.get(f"{BASE_URL}/cursors/{ROOM}", timeout=5)
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
# Playwright two-context cursor-presence test
# ---------------------------------------------------------------------------


def _wait_for_container(page, timeout_ms: int = 30_000):
    locator = page.locator("#cursors-container")
    locator.wait_for(state="visible", timeout=timeout_ms)
    return locator


def _container_box(page):
    box = page.locator("#cursors-container").bounding_box()
    assert box is not None, "Could not get bounding box for #cursors-container."
    return box


def _move_pointer_to_local(page, local_x: int, local_y: int):
    box = _container_box(page)
    page.mouse.move(box["x"] + local_x, box["y"] + local_y, steps=8)


def _wait_for_remote_cursor(
    page, expected_x: int, expected_y: int, tolerance: int = 5,
    timeout_ms: int = 20_000,
):
    """Wait until any element with data-cursor-user has x,y near expected."""
    deadline = time.time() + timeout_ms / 1000.0
    last_seen = None
    while time.time() < deadline:
        elements = page.locator("[data-cursor-user]")
        count = elements.count()
        for i in range(count):
            el = elements.nth(i)
            try:
                user = el.get_attribute("data-cursor-user")
                dx = el.get_attribute("data-x")
                dy = el.get_attribute("data-y")
            except Exception:
                continue
            if dx is None or dy is None:
                continue
            try:
                xi, yi = int(dx), int(dy)
            except ValueError:
                continue
            last_seen = (user, xi, yi)
            if abs(xi - expected_x) <= tolerance and abs(yi - expected_y) <= tolerance:
                return user, xi, yi
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for a remote cursor near ({expected_x},{expected_y}). "
        f"Last seen: {last_seen!r}"
    )


def _wait_for_no_remote_cursor(page, connection_id: str, timeout_ms: int = 20_000):
    deadline = time.time() + timeout_ms / 1000.0
    while time.time() < deadline:
        locator = page.locator(f'[data-cursor-user="{connection_id}"]')
        if locator.count() == 0:
            return
        time.sleep(0.25)
    raise AssertionError(
        f"Remote cursor for connection {connection_id!r} did not disappear in time."
    )


def test_two_client_cursor_sync(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/cursors/{ROOM}"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context(
                viewport={"width": 1280, "height": 800}
            )
            ctx_b = browser.new_context(
                viewport={"width": 1280, "height": 800}
            )
            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(url, wait_until="domcontentloaded", timeout=60_000)
            page_b.goto(url, wait_until="domcontentloaded", timeout=60_000)

            _wait_for_container(page_a)
            _wait_for_container(page_b)

            # Give Liveblocks a moment to establish both WebSocket sessions.
            time.sleep(3)

            # 1. A moves to (120, 180); B should observe a remote cursor near
            #    that position with A's connection id.
            target_a_x, target_a_y = 120, 180
            _move_pointer_to_local(page_a, target_a_x, target_a_y)
            user_a_id, ax, ay = _wait_for_remote_cursor(
                page_b, target_a_x, target_a_y
            )
            assert user_a_id, "Remote cursor element missing data-cursor-user."

            # 2. B moves to (400, 50); A should observe a remote cursor near
            #    that position with B's connection id.
            target_b_x, target_b_y = 400, 50
            _move_pointer_to_local(page_b, target_b_x, target_b_y)
            user_b_id, bx, by = _wait_for_remote_cursor(
                page_a, target_b_x, target_b_y
            )
            assert user_b_id, "Remote cursor element missing data-cursor-user."
            assert user_b_id != user_a_id, (
                "Both contexts produced the same connectionId — they should be "
                "distinct sessions."
            )

            # 3. Move A's pointer well outside the container so its cursor is
            #    set back to null. B should see A's cursor element removed.
            page_a.mouse.move(2000, 2000)
            # Pointer leaving the container element should fire pointerleave.
            box = _container_box(page_a)
            page_a.mouse.move(box["x"] - 50, box["y"] - 50)
            _wait_for_no_remote_cursor(page_b, user_a_id)
        finally:
            browser.close()
