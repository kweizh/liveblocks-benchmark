"""Final-state verification for the liveblocks-room-readonly-access task.

Verifies that the Next.js access-token auth endpoint correctly grants
READ_ACCESS or FULL_ACCESS based on the requested role, and that the room
page (a) renders required test-id elements, (b) disables the increment
button for viewers, and (c) propagates editor mutations live to viewers
without allowing viewer-side Storage writes.
"""

import os
import socket
import subprocess
import time
from typing import Optional

import pytest
import requests
from playwright.sync_api import sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:3000"
RUN_ID = os.environ.get("ZEALT_RUN_ID", "local").strip() or "local"

ROOM_ID = f"room-readonly-{RUN_ID}"
EDITOR_USER = f"editor-{RUN_ID}"
VIEWER_USER = f"viewer-{RUN_ID}"


def _wait_for_port(host: str, port: int, timeout: float = 180.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(1)
    return False


def _wait_for_http_ok(url: str, timeout: float = 180.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code < 500:
                return True
        except requests.RequestException:
            pass
        time.sleep(1)
    return False


@pytest.fixture(scope="session")
def next_server(xprocess):
    """Start `npm run dev` on port 3000 and wait until it is reachable."""

    class Starter(ProcessStarter):
        name = "next_dev"
        args = ["npm", "run", "dev", "--", "-p", "3000"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            return _wait_for_port("127.0.0.1", 3000, timeout=2)

    xprocess.ensure(Starter.name, Starter)

    assert _wait_for_http_ok(BASE_URL, timeout=180), (
        "Next.js dev server did not become HTTP-ready in time."
    )

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _post_auth(body: dict) -> requests.Response:
    return requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        json=body,
        timeout=30,
    )


# ---------------------------------------------------------------------------
# Auth endpoint tests
# ---------------------------------------------------------------------------


def test_auth_editor_receives_token(next_server):
    r = _post_auth({"room": ROOM_ID, "userId": EDITOR_USER, "role": "editor"})
    assert r.status_code == 200, (
        f"Expected HTTP 200 for editor auth, got {r.status_code}: {r.text!r}"
    )
    data = r.json()
    assert isinstance(data.get("token"), str) and data["token"], (
        f"Editor auth response must include a non-empty 'token' string. Got: {data!r}"
    )


def test_auth_viewer_receives_token(next_server):
    r = _post_auth({"room": ROOM_ID, "userId": VIEWER_USER, "role": "viewer"})
    assert r.status_code == 200, (
        f"Expected HTTP 200 for viewer auth, got {r.status_code}: {r.text!r}"
    )
    data = r.json()
    assert isinstance(data.get("token"), str) and data["token"], (
        f"Viewer auth response must include a non-empty 'token' string. Got: {data!r}"
    )


def test_auth_rejects_invalid_role(next_server):
    r = _post_auth({"room": ROOM_ID, "userId": EDITOR_USER, "role": "admin"})
    assert r.status_code == 400, (
        f"Expected HTTP 400 for invalid role, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"400 response must include a non-empty 'error' string. Got: {body!r}"
    )


def test_auth_rejects_missing_fields(next_server):
    r = _post_auth({"room": ROOM_ID})
    assert r.status_code == 400, (
        f"Expected HTTP 400 for missing userId/role, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"400 response must include a non-empty 'error' string. Got: {body!r}"
    )


# ---------------------------------------------------------------------------
# Browser-level helpers
# ---------------------------------------------------------------------------


def _wait_for_test_id_text(
    page, test_id: str, expected: str, timeout_ms: int = 45000
) -> Optional[str]:
    deadline = time.time() + timeout_ms / 1000.0
    last_text: Optional[str] = None
    while time.time() < deadline:
        locator = page.get_by_test_id(test_id)
        if locator.count() > 0:
            try:
                text = (locator.first.text_content() or "").strip().lower()
            except Exception:
                text = None
            if text is not None:
                last_text = text
                if expected.lower() in text:
                    return text
        page.wait_for_timeout(500)
    return last_text


def _wait_for_test_id_value_change(
    page, test_id: str, baseline: str, timeout_ms: int = 15000
) -> Optional[str]:
    deadline = time.time() + timeout_ms / 1000.0
    last_text: Optional[str] = baseline
    while time.time() < deadline:
        locator = page.get_by_test_id(test_id)
        if locator.count() > 0:
            try:
                text = (locator.first.text_content() or "").strip()
            except Exception:
                text = baseline
            last_text = text
            if text != baseline:
                return text
        page.wait_for_timeout(500)
    return last_text


# ---------------------------------------------------------------------------
# Browser-level integration tests
# ---------------------------------------------------------------------------


def test_room_page_editor_and_viewer_role_based_ui_and_storage(next_server):
    """End-to-end two-context test: editor mutates, viewer observes read-only."""

    editor_url = (
        f"{BASE_URL}/rooms/{ROOM_ID}?userId={EDITOR_USER}&role=editor"
    )
    viewer_url = (
        f"{BASE_URL}/rooms/{ROOM_ID}?userId={VIEWER_USER}&role=viewer"
    )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            # --- Editor context ---
            editor_ctx = browser.new_context()
            editor_page = editor_ctx.new_page()
            er = editor_page.goto(editor_url, wait_until="domcontentloaded", timeout=60000)
            assert er is not None and er.status < 400, (
                f"Editor page request failed: {er.status if er else 'no-response'}"
            )

            for tid in ("connection-status", "counter-value", "role-label", "increment-button"):
                assert editor_page.get_by_test_id(tid).count() > 0, (
                    f"Editor room page must render an element with data-testid='{tid}'."
                )

            editor_role = (
                editor_page.get_by_test_id("role-label").first.text_content() or ""
            ).strip().lower()
            assert "editor" in editor_role, (
                f"Editor role-label must contain 'editor'. Got {editor_role!r}."
            )

            editor_btn = editor_page.get_by_test_id("increment-button").first
            assert editor_btn.is_disabled() is False, (
                "Editor's increment-button must NOT be disabled."
            )

            editor_status = _wait_for_test_id_text(
                editor_page, "connection-status", "connected", timeout_ms=60000
            )
            assert editor_status is not None and "connected" in editor_status, (
                f"Editor connection-status must eventually show 'connected'. "
                f"Last value: {editor_status!r}"
            )

            # --- Viewer context ---
            viewer_ctx = browser.new_context()
            viewer_page = viewer_ctx.new_page()
            vr = viewer_page.goto(viewer_url, wait_until="domcontentloaded", timeout=60000)
            assert vr is not None and vr.status < 400, (
                f"Viewer page request failed: {vr.status if vr else 'no-response'}"
            )

            for tid in ("connection-status", "counter-value", "role-label", "increment-button"):
                assert viewer_page.get_by_test_id(tid).count() > 0, (
                    f"Viewer room page must render an element with data-testid='{tid}'."
                )

            viewer_role = (
                viewer_page.get_by_test_id("role-label").first.text_content() or ""
            ).strip().lower()
            assert "viewer" in viewer_role, (
                f"Viewer role-label must contain 'viewer'. Got {viewer_role!r}."
            )

            viewer_btn = viewer_page.get_by_test_id("increment-button").first
            assert viewer_btn.is_disabled() is True, (
                "Viewer's increment-button MUST be disabled."
            )

            viewer_status = _wait_for_test_id_text(
                viewer_page, "connection-status", "connected", timeout_ms=60000
            )
            assert viewer_status is not None and "connected" in viewer_status, (
                f"Viewer connection-status must eventually show 'connected'. "
                f"Last value: {viewer_status!r}"
            )

            # --- Mutation propagation: editor -> viewer ---
            editor_before = (
                editor_page.get_by_test_id("counter-value").first.text_content() or ""
            ).strip()
            editor_btn.click()
            editor_after = _wait_for_test_id_value_change(
                editor_page, "counter-value", editor_before, timeout_ms=15000
            )
            assert editor_after is not None and editor_after != editor_before, (
                f"Editor's counter-value must update after clicking increment. "
                f"before={editor_before!r}, after={editor_after!r}"
            )

            viewer_after = _wait_for_test_id_value_change(
                viewer_page, "counter-value", editor_before, timeout_ms=15000
            )
            assert viewer_after is not None and viewer_after == editor_after, (
                f"Viewer's counter-value must reflect the editor's mutation in real time. "
                f"editor_after={editor_after!r}, viewer_after={viewer_after!r}"
            )

            # --- Viewer cannot mutate (server-side enforcement) ---
            # Force-click bypasses the `disabled` UI guard so we exercise the
            # underlying Storage write attempt. The Liveblocks server must
            # reject it because the viewer's token only has READ_ACCESS.
            try:
                viewer_btn.click(force=True)
            except Exception:
                # Clicking a disabled button may raise depending on the browser
                # build; that itself counts as the read-only UI guard working.
                pass

            # Give some time for any (rejected) write to propagate.
            time.sleep(5)

            editor_final = (
                editor_page.get_by_test_id("counter-value").first.text_content() or ""
            ).strip()
            assert editor_final == editor_after, (
                "Viewer's attempted Storage write must NOT take effect. "
                f"Editor counter changed from {editor_after!r} to {editor_final!r}."
            )
        finally:
            browser.close()


def test_no_hardcoded_liveblocks_secret_in_source_tree():
    """Ensure no hard-coded Liveblocks secret token strings ship in user code."""
    forbidden_prefixes = ("sk_dev_", "sk_prod_")
    for sub in ("app", "components", "lib"):
        root = os.path.join(PROJECT_DIR, sub)
        if not os.path.isdir(root):
            continue
        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                path = os.path.join(dirpath, name)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                except OSError:
                    continue
                for prefix in forbidden_prefixes:
                    assert prefix not in content, (
                        f"Hard-coded Liveblocks secret-looking string ({prefix}...) "
                        f"found in {path}. The implementation must read the key from "
                        "the LIVEBLOCKS_SECRET_KEY environment variable instead."
                    )
