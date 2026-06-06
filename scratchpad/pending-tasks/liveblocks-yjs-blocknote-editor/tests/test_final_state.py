import json
import os
import socket
import time
import uuid
from typing import List

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:3000"


def _room_id() -> str:
    run_id = os.environ.get("ZEALT_RUN_ID") or f"local{uuid.uuid4().hex[:8]}"
    return f"blocknote-{run_id}"


ROOM_ID = _room_id()


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the Next.js dev server and wait until it serves on port 3000."""

    class Starter(ProcessStarter):
        name = "start_app"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("localhost", 3000)) != 0:
                    return False
            try:
                r = requests.get(f"{BASE_URL}/editor?room={ROOM_ID}", timeout=5)
                return r.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _wait_editor_ready(page, timeout_ms: int = 30000) -> None:
    """Wait until the BlockNote editor's contenteditable surface is mounted."""
    page.wait_for_selector('[contenteditable="true"]', timeout=timeout_ms)
    # Give Liveblocks a moment to connect and sync awareness.
    page.wait_for_timeout(1500)


def _get_editor_text(page) -> str:
    return page.evaluate(
        """() => {
            const el = document.querySelector('[contenteditable="true"]');
            return el ? el.innerText : '';
        }"""
    )


def _focus_editor_end(page) -> None:
    page.evaluate(
        """() => {
            const el = document.querySelector('[contenteditable="true"]');
            if (!el) return;
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }"""
    )


def test_snapshot_endpoint_empty_state_returns_404(start_app):
    r = requests.get(f"{BASE_URL}/api/snapshots", params={"roomId": ROOM_ID}, timeout=10)
    assert r.status_code == 404, (
        f"Expected 404 for missing snapshot, got {r.status_code}: {r.text}"
    )
    body = r.json()
    assert body.get("error") == "not_found", (
        f"Expected error=not_found, got: {body}"
    )


def test_two_context_realtime_sync_and_snapshot(start_app):
    from playwright.sync_api import sync_playwright

    websocket_urls: List[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context()
            ctx_b = browser.new_context()

            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            for page in (page_a, page_b):
                page.on("websocket", lambda ws: websocket_urls.append(ws.url))

            editor_url = f"{BASE_URL}/editor?room={ROOM_ID}"

            page_a.goto(editor_url, wait_until="domcontentloaded")
            page_b.goto(editor_url, wait_until="domcontentloaded")

            _wait_editor_ready(page_a)
            _wait_editor_ready(page_b)

            # User A types a heading and a paragraph.
            _focus_editor_end(page_a)
            page_a.keyboard.type("# ", delay=20)
            page_a.keyboard.type("Hello from A", delay=20)
            page_a.keyboard.press("Enter")
            page_a.keyboard.type("This is a paragraph from A.", delay=20)

            # Wait for sync to context B.
            deadline = time.time() + 20
            text_b = ""
            while time.time() < deadline:
                text_b = _get_editor_text(page_b)
                if "Hello from A" in text_b and "This is a paragraph from A." in text_b:
                    break
                page_b.wait_for_timeout(500)
            assert "Hello from A" in text_b, (
                f"Expected 'Hello from A' to sync from A to B, B sees: {text_b!r}"
            )
            assert "This is a paragraph from A." in text_b, (
                f"Expected paragraph text to sync from A to B, B sees: {text_b!r}"
            )

            # User B adds a bullet list item.
            _focus_editor_end(page_b)
            page_b.keyboard.press("Enter")
            page_b.keyboard.type("- ", delay=20)
            page_b.keyboard.type("B bullet item", delay=20)

            # Wait for sync back to context A.
            deadline = time.time() + 20
            text_a = ""
            while time.time() < deadline:
                text_a = _get_editor_text(page_a)
                if "B bullet item" in text_a:
                    break
                page_a.wait_for_timeout(500)
            assert "B bullet item" in text_a, (
                f"Expected B's bullet to sync to A, A sees: {text_a!r}"
            )

            # Click Save snapshot in context A and capture the POST response.
            with page_a.expect_response(
                lambda resp: "/api/snapshots" in resp.url and resp.request.method == "POST",
                timeout=15000,
            ) as resp_info:
                page_a.get_by_role("button", name="Save snapshot").click()
            post_resp = resp_info.value
            assert post_resp.status == 200, (
                f"POST /api/snapshots returned {post_resp.status}"
            )
            post_body = post_resp.json()
            assert post_body.get("ok") is True, f"POST body missing ok=true: {post_body}"
            assert post_body.get("roomId") == ROOM_ID, (
                f"POST body roomId mismatch: {post_body}"
            )
            assert isinstance(post_body.get("blockCount"), int) and post_body["blockCount"] >= 3, (
                f"Expected blockCount>=3, got: {post_body}"
            )
        finally:
            browser.close()

    # GET the snapshot and verify contents.
    r = requests.get(f"{BASE_URL}/api/snapshots", params={"roomId": ROOM_ID}, timeout=10)
    assert r.status_code == 200, (
        f"Expected 200 from GET /api/snapshots after save, got {r.status_code}: {r.text}"
    )
    snap = r.json()
    assert snap.get("roomId") == ROOM_ID, f"Snapshot roomId mismatch: {snap}"
    blocks = snap.get("blocks")
    assert isinstance(blocks, list) and len(blocks) > 0, (
        f"Expected non-empty blocks array, got: {snap}"
    )
    flattened = json.dumps(blocks)
    for needle in ("Hello from A", "This is a paragraph from A.", "B bullet item"):
        assert needle in flattened, (
            f"Expected snapshot blocks to include {needle!r}; got: {flattened[:500]}..."
        )

    # Verify Liveblocks was actually used (real cloud, not mocked).
    assert any("liveblocks.io" in url for url in websocket_urls), (
        f"Expected at least one WebSocket to liveblocks.io; observed: {websocket_urls}"
    )


def test_snapshot_endpoint_accepts_empty_blocks(start_app):
    r = requests.post(
        f"{BASE_URL}/api/snapshots",
        json={"roomId": ROOM_ID, "blocks": []},
        timeout=10,
    )
    assert r.status_code == 200, (
        f"Expected 200 from POST with empty blocks, got {r.status_code}: {r.text}"
    )
    body = r.json()
    assert body.get("ok") is True, f"Expected ok=true, got: {body}"
    assert body.get("blockCount") == 0, f"Expected blockCount=0, got: {body}"
