"""Final-state verification for the liveblocks-nextjs-auth-organization task.

Verifies that the Next.js auth endpoint correctly gates room access by
organization (using the real Liveblocks cloud) and that the room page
exposes the connection status and counter via stable test ids.
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

ROOM_OK_A = f"org-a:project-{RUN_ID}"
ROOM_OK_B = f"org-b:project-{RUN_ID}"
USER_A = f"user-a-{RUN_ID}"
USER_B = f"user-b-{RUN_ID}"


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

    # Belt-and-braces: also wait for HTTP-level readiness.
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


def test_auth_allows_org_a_in_its_own_room(next_server):
    r = _post_auth({"room": ROOM_OK_A, "userId": USER_A, "orgId": "org-a"})
    assert r.status_code == 200, (
        f"Expected 200 for org-a in org-a room, got {r.status_code}: {r.text!r}"
    )
    data = r.json()
    assert isinstance(data.get("token"), str) and data["token"], (
        f"Response must include a non-empty 'token' string. Got: {data!r}"
    )


def test_auth_allows_org_b_in_its_own_room(next_server):
    r = _post_auth({"room": ROOM_OK_B, "userId": USER_B, "orgId": "org-b"})
    assert r.status_code == 200, (
        f"Expected 200 for org-b in org-b room, got {r.status_code}: {r.text!r}"
    )
    data = r.json()
    assert isinstance(data.get("token"), str) and data["token"], (
        f"Response must include a non-empty 'token' string. Got: {data!r}"
    )


def test_auth_rejects_cross_org_access(next_server):
    r = _post_auth({"room": ROOM_OK_B, "userId": USER_A, "orgId": "org-a"})
    assert r.status_code == 403, (
        f"Expected 403 for org-a trying to enter org-b room, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"403 response must include a non-empty 'error' string. Got: {body!r}"
    )


def test_auth_rejects_room_without_org_prefix(next_server):
    r = _post_auth({"room": f"plain-room-{RUN_ID}", "userId": USER_A, "orgId": "org-a"})
    assert r.status_code == 403, (
        f"Expected 403 for a room without an org prefix, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"403 response must include a non-empty 'error' string. Got: {body!r}"
    )


def test_auth_rejects_unknown_org(next_server):
    r = _post_auth({"room": f"org-c:project-{RUN_ID}", "userId": USER_A, "orgId": "org-c"})
    assert r.status_code == 403, (
        f"Expected 403 for an unknown organization, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"403 response must include a non-empty 'error' string. Got: {body!r}"
    )


def test_auth_rejects_missing_fields(next_server):
    r = _post_auth({"room": ROOM_OK_A})
    assert r.status_code == 400, (
        f"Expected 400 for missing userId/orgId, got {r.status_code}: {r.text!r}"
    )
    body = r.json()
    assert isinstance(body.get("error"), str) and body["error"], (
        f"400 response must include a non-empty 'error' string. Got: {body!r}"
    )


def _wait_for_test_id_text(page, test_id: str, expected: str, timeout_ms: int = 30000) -> Optional[str]:
    """Poll the page for a test-id element to display the expected text. Returns the final text seen."""
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


def _collect_test_id_text_until(page, test_id: str, forbidden: str, duration_s: float = 20.0) -> bool:
    """Watch a test-id element for ``duration_s`` seconds and confirm it never displays ``forbidden``."""
    deadline = time.time() + duration_s
    while time.time() < deadline:
        locator = page.get_by_test_id(test_id)
        if locator.count() > 0:
            try:
                text = (locator.first.text_content() or "").strip().lower()
            except Exception:
                text = ""
            if forbidden.lower() in text:
                return False
        page.wait_for_timeout(500)
    return True


def test_room_page_renders_required_test_ids_and_connects_for_allowed_org(next_server):
    url = f"{BASE_URL}/rooms/{ROOM_OK_A}?userId={USER_A}&orgId=org-a"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            context = browser.new_context()
            page = context.new_page()
            response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
            assert response is not None, "Playwright returned no response for the room page."
            assert response.status < 400, (
                f"Expected HTTP 2xx/3xx for the room page, got {response.status}."
            )

            # The required DOM test-ids must be present.
            assert page.get_by_test_id("connection-status").count() > 0, (
                "Room page must render an element with data-testid='connection-status'."
            )
            assert page.get_by_test_id("counter-value").count() > 0, (
                "Room page must render an element with data-testid='counter-value'."
            )

            final_status = _wait_for_test_id_text(page, "connection-status", "connected", timeout_ms=45000)
            assert final_status is not None and "connected" in final_status, (
                f"Expected the connection-status element to display 'connected'. "
                f"Last value seen: {final_status!r}"
            )

            counter_text = (page.get_by_test_id("counter-value").first.text_content() or "").strip()
            assert "0" in counter_text, (
                f"Expected the initial counter value to render as '0'. Got {counter_text!r}."
            )
        finally:
            browser.close()


def test_room_page_does_not_connect_for_cross_org_access(next_server):
    url = f"{BASE_URL}/rooms/{ROOM_OK_B}?userId={USER_A}&orgId=org-a"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            context = browser.new_context()
            page = context.new_page()
            response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
            assert response is not None, "Playwright returned no response for the room page."
            assert response.status < 400, (
                f"Expected HTTP 2xx/3xx for the room page, got {response.status}."
            )

            assert page.get_by_test_id("connection-status").count() > 0, (
                "Room page must render an element with data-testid='connection-status' "
                "even for forbidden room access."
            )

            ok = _collect_test_id_text_until(page, "connection-status", "connected", duration_s=25.0)
            assert ok, (
                "When the org does not match the room prefix, the connection-status "
                "element must NEVER display 'connected'."
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
