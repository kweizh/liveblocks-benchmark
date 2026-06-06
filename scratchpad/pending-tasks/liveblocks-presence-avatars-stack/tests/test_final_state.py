import os
import socket
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/project"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"


def _run_id() -> str:
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID is not set in the verifier environment."
    return rid


def _room_name() -> str:
    return f"presence-avatars-{_run_id()}"


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the Next.js dev server (long-running) via xprocess."""

    class Starter(ProcessStarter):
        name = "next_dev"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("localhost", PORT)) != 0:
                    return False
            try:
                r = requests.get(BASE_URL, timeout=5)
                return r.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _auth_route_source() -> str:
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.tsx"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            with open(c) as f:
                return f.read()
    raise AssertionError("Auth route file not found.")


def test_auth_endpoint_returns_token(start_app):
    """POST /api/liveblocks-auth should return 200 with a Liveblocks token."""
    r = requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        json={"room": _room_name()},
        cookies={"mockUser": "1"},
        timeout=20,
    )
    assert r.status_code == 200, (
        f"/api/liveblocks-auth returned {r.status_code}: {r.text[:500]}"
    )
    body = r.json()
    assert isinstance(body, dict) and isinstance(body.get("token"), str) and body["token"], (
        f"/api/liveblocks-auth response missing 'token' string: {body}"
    )


def test_auth_route_uses_identify_user_with_user_info():
    """Static check: server route must call identifyUser AND pass userInfo with name/avatar/color."""
    src = _auth_route_source()
    assert "identifyUser" in src, "Auth route must call Liveblocks.identifyUser"
    assert "userInfo" in src, "Auth route must pass a userInfo payload to identifyUser"
    # All three keys must be wired through userInfo.
    for key in ("name", "avatar", "color"):
        assert key in src, f"Auth route must include `{key}` in the userInfo payload"


def _open_context_for_user(browser, user_index: int):
    """Open a fresh browser context impersonating mock user `user_index`."""
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    ctx.add_cookies([
        {
            "name": "mockUser",
            "value": str(user_index),
            "url": BASE_URL,
        }
    ])
    page = ctx.new_page()
    page.goto(BASE_URL, wait_until="domcontentloaded")
    return ctx, page


def _visible_avatar_count(page) -> int:
    return page.locator('[data-testid="avatar-item"]').count()


def _overflow_count(page) -> int:
    return page.locator('[data-testid="avatar-overflow"]').count()


def test_avatar_stack_overflow_with_six_users(start_app):
    """Open 6 contexts; the first one must show 4 avatars + a "+2" overflow badge."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = []
        try:
            # Open context 0 (the observer) first.
            ctx0, page0 = _open_context_for_user(browser, 0)
            contexts.append(ctx0)
            # Wait until at least the self avatar shows up.
            page0.wait_for_selector('[data-testid="avatar-item"]', timeout=30_000)

            # Open the other 5 contexts.
            pages = [page0]
            for i in range(1, 6):
                ctx, page = _open_context_for_user(browser, i)
                contexts.append(ctx)
                pages.append(page)
                page.wait_for_selector('[data-testid="avatar-item"]', timeout=30_000)

            # In context 0, wait for exactly 4 visible avatars and "+2" overflow.
            deadline = time.time() + 30
            ok = False
            last_state = (None, None, None)
            while time.time() < deadline:
                count = _visible_avatar_count(page0)
                overflow = _overflow_count(page0)
                overflow_text = (
                    page0.locator('[data-testid="avatar-overflow"]').first.text_content().strip()
                    if overflow == 1
                    else None
                )
                last_state = (count, overflow, overflow_text)
                if count == 4 and overflow == 1 and overflow_text == "+2":
                    ok = True
                    break
                time.sleep(0.5)
            assert ok, (
                "Expected 4 avatar-item elements + 1 avatar-overflow with text '+2' "
                f"in context 0; last observed (count, overflow, text)={last_state}"
            )

            # Leftmost avatar must be self with data-user-id=user-0.
            first = page0.locator('[data-testid="avatar-item"]').first
            assert first.get_attribute("data-self") == "true", (
                "Leftmost avatar must have data-self=\"true\" (the current user)."
            )
            assert first.get_attribute("data-user-id") == "user-0", (
                "Leftmost avatar must have data-user-id=\"user-0\" for mock user 0."
            )

            # Each visible avatar must contain an online-dot child.
            online_dots = page0.locator('[data-testid="avatar-item"] [data-testid="online-dot"]').count()
            assert online_dots == 4, (
                f"Expected 4 online-dot indicators (one per visible avatar); got {online_dots}."
            )
        finally:
            for ctx in contexts:
                try:
                    ctx.close()
                except Exception:
                    pass
            browser.close()


def test_tooltip_shows_user_name_with_you_suffix(start_app):
    """Hovering the self avatar shows '<name> (You)'; hovering another shows that user's name."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = []
        try:
            # Two contexts is enough for this check.
            ctx0, page0 = _open_context_for_user(browser, 0)
            contexts.append(ctx0)
            ctx1, page1 = _open_context_for_user(browser, 1)
            contexts.append(ctx1)

            # Wait until context 0 sees at least 2 avatars.
            deadline = time.time() + 30
            while time.time() < deadline and _visible_avatar_count(page0) < 2:
                time.sleep(0.5)
            assert _visible_avatar_count(page0) >= 2, (
                "Context 0 should see at least 2 avatars (self + one other)."
            )

            avatars = page0.locator('[data-testid="avatar-item"]')

            # Hover the leftmost (self) and check tooltip.
            self_avatar = avatars.first
            self_avatar.hover()
            self_tooltip = self_avatar.locator('[data-testid="avatar-tooltip"]')
            self_tooltip.wait_for(state="visible", timeout=10_000)
            self_text = self_tooltip.text_content().strip()
            assert self_text == "Charlie Cloud (You)", (
                f"Self tooltip text must be 'Charlie Cloud (You)'; got {self_text!r}"
            )

            # Hover the second avatar (which is the other user, mock user 1).
            other_avatar = avatars.nth(1)
            other_avatar.hover()
            other_tooltip = other_avatar.locator('[data-testid="avatar-tooltip"]')
            other_tooltip.wait_for(state="visible", timeout=10_000)
            other_text = other_tooltip.text_content().strip()
            assert other_text == "Dakota Drift", (
                f"Other-user tooltip must be 'Dakota Drift' (mock user 1); got {other_text!r}"
            )
        finally:
            for ctx in contexts:
                try:
                    ctx.close()
                except Exception:
                    pass
            browser.close()


def test_closing_contexts_reduces_avatars(start_app):
    """After closing 3 of 6 contexts, the observer should see exactly 3 avatars (no overflow)."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = []
        try:
            ctx0, page0 = _open_context_for_user(browser, 0)
            contexts.append(ctx0)
            for i in range(1, 6):
                ctx, page = _open_context_for_user(browser, i)
                contexts.append(ctx)
                page.wait_for_selector('[data-testid="avatar-item"]', timeout=30_000)

            # Wait for the +2 overflow first.
            deadline = time.time() + 30
            while time.time() < deadline:
                if _visible_avatar_count(page0) == 4 and _overflow_count(page0) == 1:
                    break
                time.sleep(0.5)
            assert _visible_avatar_count(page0) == 4 and _overflow_count(page0) == 1, (
                "Could not reach the initial 4-avatar + overflow state before closing contexts."
            )

            # Close contexts 3, 4, 5.
            for i in (5, 4, 3):
                try:
                    contexts[i].close()
                except Exception:
                    pass

            # Now expect exactly 3 avatars and no overflow.
            deadline = time.time() + 60
            ok = False
            last = (None, None)
            while time.time() < deadline:
                count = _visible_avatar_count(page0)
                overflow = _overflow_count(page0)
                last = (count, overflow)
                if count == 3 and overflow == 0:
                    ok = True
                    break
                time.sleep(1.0)
            assert ok, (
                "Expected exactly 3 avatar-item and 0 avatar-overflow after closing 3 contexts; "
                f"last observed (count, overflow)={last}"
            )
        finally:
            for ctx in contexts:
                try:
                    ctx.close()
                except Exception:
                    pass
            browser.close()


def test_single_user_case(start_app):
    """With only the observer connected, exactly 1 avatar is visible, no overflow."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        contexts = []
        try:
            ctx0, page0 = _open_context_for_user(browser, 0)
            contexts.append(ctx0)
            page0.wait_for_selector('[data-testid="avatar-item"]', timeout=30_000)

            deadline = time.time() + 30
            ok = False
            last = (None, None)
            while time.time() < deadline:
                count = _visible_avatar_count(page0)
                overflow = _overflow_count(page0)
                last = (count, overflow)
                if count == 1 and overflow == 0:
                    ok = True
                    break
                time.sleep(0.5)
            assert ok, (
                "Expected exactly 1 avatar-item and 0 avatar-overflow when only the observer "
                f"is connected; last observed (count, overflow)={last}"
            )

            only_avatar = page0.locator('[data-testid="avatar-item"]').first
            assert only_avatar.get_attribute("data-self") == "true", (
                "The lone avatar must have data-self=\"true\"."
            )
            assert only_avatar.get_attribute("data-user-id") == "user-0", (
                "The lone avatar must have data-user-id=\"user-0\"."
            )
        finally:
            for ctx in contexts:
                try:
                    ctx.close()
                except Exception:
                    pass
            browser.close()
