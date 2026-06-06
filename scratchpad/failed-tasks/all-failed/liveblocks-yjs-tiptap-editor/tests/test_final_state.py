import json
import os
import re
import socket
import subprocess
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
APP_PORT = 3000
APP_BASE_URL = f"http://localhost:{APP_PORT}"

RUN_ID = os.environ.get("ZEALT_RUN_ID", "zr-local")
ROOM_ID = f"liveblocks-yjs-tiptap-{RUN_ID}"
ROOM_URL = f"{APP_BASE_URL}/r/{ROOM_ID}"
ALICE = f"alice-{RUN_ID}"
BOB = f"bob-{RUN_ID}"
TEXT_PAYLOAD = f"Hello-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _wait_http_ready(url: str, timeout: float = 120.0) -> None:
    deadline = time.time() + timeout
    last_err = None
    while time.time() < deadline:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code < 500:
                return
        except requests.RequestException as exc:
            last_err = exc
        time.sleep(1.0)
    raise RuntimeError(f"Server at {url} did not become ready within {timeout}s; last error: {last_err}")


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Start the Next.js dev server using xprocess and wait for the port to open."""

    class Starter(ProcessStarter):
        name = "next_dev"
        args = ["npm", "run", "dev", "--", "-p", str(APP_PORT)]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", APP_PORT)

    xprocess.ensure(Starter.name, Starter)
    # Extra wait for Next.js to compile the first page request.
    _wait_http_ready(APP_BASE_URL, timeout=120)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_liveblocks_auth_returns_token(start_app):
    """POST /api/liveblocks-auth returns a real Liveblocks ID token."""
    resp = requests.post(
        f"{APP_BASE_URL}/api/liveblocks-auth",
        json={"username": ALICE, "room": ROOM_ID},
        timeout=30,
    )
    assert resp.status_code == 200, (
        f"Auth endpoint returned {resp.status_code}: {resp.text[:500]}"
    )
    body = resp.json()
    assert isinstance(body, dict), f"Auth response was not a JSON object: {body!r}"
    token = body.get("token")
    assert isinstance(token, str) and len(token) > 16, (
        f"Auth response missing a non-empty 'token' field. Got: {body!r}"
    )


def _run_two_client_playwright_test(timeout_seconds: int = 90) -> dict:
    """Spawn a child process that runs Playwright with two contexts and returns a result dict."""
    runner = r'''
import json
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright, expect

ROOM_URL = os.environ["__ROOM_URL"]
ALICE = os.environ["__ALICE"]
BOB = os.environ["__BOB"]
TEXT_PAYLOAD = os.environ["__TEXT"]

result = {
    "single_count_ok": False,
    "alice_connected_user_visible_a": False,
    "two_count_a": False,
    "two_count_b": False,
    "alice_visible_b": False,
    "bob_visible_a": False,
    "text_synced_b": False,
    "bold_synced_a": False,
    "italic_synced_b": False,
    "errors": [],
}

def set_username(context, username):
    # Inject username into localStorage AND attach a cookie before any navigation so the
    # client-side auth flow can pick it up.
    context.add_cookies([
        {"name": "username", "value": username, "url": ROOM_URL},
    ])
    context.add_init_script(
        "(() => { try { window.localStorage.setItem('username', %s); } catch (e) {} })();" % json.dumps(username)
    )

def wait_for_editor(page, timeout=60000):
    page.wait_for_selector('[data-testid="tiptap-editor"] [contenteditable="true"]', timeout=timeout)

def wait_for_count(page, expected, timeout=30000):
    locator = page.locator('[data-testid="connected-count"]')
    expect(locator).to_have_text(re.compile(r"^\s*%d\s+connected\s*$" % expected), timeout=timeout)

def wait_for_user_label(page, username, timeout=30000):
    deadline = time.time() + (timeout / 1000.0)
    while time.time() < deadline:
        try:
            page.wait_for_selector('.connected-user', timeout=2000)
        except Exception:
            pass
        texts = page.eval_on_selector_all('.connected-user', 'els => els.map(e => (e.textContent || "").trim())')
        if any(username in (t or "") for t in texts):
            return True
        time.sleep(0.5)
    return False

def wait_for_editor_text(page, needle, timeout=30000):
    deadline = time.time() + (timeout / 1000.0)
    while time.time() < deadline:
        try:
            text = page.eval_on_selector('[data-testid="tiptap-editor"] [contenteditable="true"]', "el => el.innerText")
        except Exception:
            text = ""
        if needle in (text or ""):
            return True
        time.sleep(0.5)
    return False

def wait_for_tag_containing(page, tag, needle, timeout=30000):
    deadline = time.time() + (timeout / 1000.0)
    selector = f'[data-testid="tiptap-editor"] [contenteditable="true"] {tag}'
    while time.time() < deadline:
        try:
            texts = page.eval_on_selector_all(selector, "els => els.map(e => (e.textContent || ''))")
        except Exception:
            texts = []
        if any(needle in (t or "") for t in texts):
            return True
        time.sleep(0.5)
    return False

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
    context_a = browser.new_context()
    context_b = browser.new_context()
    try:
        set_username(context_a, ALICE)
        set_username(context_b, BOB)

        page_a = context_a.new_page()
        page_b = context_b.new_page()

        page_a.goto(ROOM_URL, wait_until="domcontentloaded")
        wait_for_editor(page_a)

        try:
            wait_for_count(page_a, 1, timeout=30000)
            result["single_count_ok"] = True
        except Exception as exc:
            result["errors"].append(f"single count A: {exc}")

        if wait_for_user_label(page_a, ALICE, timeout=15000):
            result["alice_connected_user_visible_a"] = True
        else:
            result["errors"].append("alice label not visible in context A")

        page_b.goto(ROOM_URL, wait_until="domcontentloaded")
        wait_for_editor(page_b)

        try:
            wait_for_count(page_a, 2, timeout=30000)
            result["two_count_a"] = True
        except Exception as exc:
            result["errors"].append(f"two count A: {exc}")
        try:
            wait_for_count(page_b, 2, timeout=30000)
            result["two_count_b"] = True
        except Exception as exc:
            result["errors"].append(f"two count B: {exc}")

        if wait_for_user_label(page_b, ALICE, timeout=15000):
            result["alice_visible_b"] = True
        else:
            result["errors"].append("alice label not visible in context B")
        if wait_for_user_label(page_a, BOB, timeout=15000):
            result["bob_visible_a"] = True
        else:
            result["errors"].append("bob label not visible in context A")

        editor_a = page_a.locator('[data-testid="tiptap-editor"] [contenteditable="true"]')
        editor_a.click()
        # Clear any pre-existing content (best effort).
        page_a.keyboard.press("Control+A")
        page_a.keyboard.press("Delete")
        page_a.keyboard.type(TEXT_PAYLOAD, delay=20)

        if wait_for_editor_text(page_b, TEXT_PAYLOAD, timeout=30000):
            result["text_synced_b"] = True
        else:
            result["errors"].append("text did not sync from A to B")

        editor_b = page_b.locator('[data-testid="tiptap-editor"] [contenteditable="true"]')
        editor_b.click()
        page_b.keyboard.press("Control+A")
        page_b.locator('[data-testid="toolbar-bold"]').click()
        if wait_for_tag_containing(page_a, "strong", TEXT_PAYLOAD, timeout=30000):
            result["bold_synced_a"] = True
        else:
            result["errors"].append("bold formatting did not sync from B to A")

        editor_a.click()
        page_a.keyboard.press("Control+A")
        page_a.locator('[data-testid="toolbar-italic"]').click()
        if wait_for_tag_containing(page_b, "em", TEXT_PAYLOAD, timeout=30000):
            result["italic_synced_b"] = True
        else:
            result["errors"].append("italic formatting did not sync from A to B")
    finally:
        context_a.close()
        context_b.close()
        browser.close()

print("___RESULT___" + json.dumps(result))
'''
    env = os.environ.copy()
    env["__ROOM_URL"] = ROOM_URL
    env["__ALICE"] = ALICE
    env["__BOB"] = BOB
    env["__TEXT"] = TEXT_PAYLOAD

    proc = subprocess.run(
        ["python3", "-c", runner],
        capture_output=True,
        text=True,
        env=env,
        timeout=timeout_seconds,
    )
    combined = (proc.stdout or "") + "\n" + (proc.stderr or "")
    marker_idx = combined.rfind("___RESULT___")
    if marker_idx < 0:
        raise AssertionError(
            "Playwright runner did not emit a result marker. stdout/stderr:\n"
            f"{combined[-4000:]}"
        )
    try:
        payload = json.loads(combined[marker_idx + len("___RESULT___"):].strip().splitlines()[0])
    except Exception as exc:  # noqa: BLE001
        raise AssertionError(
            f"Failed to parse Playwright result JSON ({exc}). Output:\n{combined[-4000:]}"
        ) from exc
    return payload


@pytest.fixture(scope="session")
def playwright_results(start_app):
    return _run_two_client_playwright_test(timeout_seconds=300)


def test_single_client_connected_count_is_one(playwright_results):
    assert playwright_results["single_count_ok"], (
        "Expected [data-testid='connected-count'] to read '1 connected' for a single client. "
        f"Errors: {playwright_results['errors']}"
    )


def test_single_client_shows_alice_user(playwright_results):
    assert playwright_results["alice_connected_user_visible_a"], (
        f"Expected a .connected-user element containing '{ALICE}' for context A. "
        f"Errors: {playwright_results['errors']}"
    )


def test_two_clients_connected_count_is_two_in_both(playwright_results):
    assert playwright_results["two_count_a"] and playwright_results["two_count_b"], (
        "Expected '2 connected' to be reported in both browser contexts once both are online. "
        f"Errors: {playwright_results['errors']}"
    )


def test_two_clients_show_each_others_names(playwright_results):
    assert playwright_results["alice_visible_b"], (
        f"Expected '{ALICE}' to appear as a .connected-user in context B. "
        f"Errors: {playwright_results['errors']}"
    )
    assert playwright_results["bob_visible_a"], (
        f"Expected '{BOB}' to appear as a .connected-user in context A. "
        f"Errors: {playwright_results['errors']}"
    )


def test_text_syncs_between_clients(playwright_results):
    assert playwright_results["text_synced_b"], (
        f"Expected text '{TEXT_PAYLOAD}' typed in context A to appear in context B's editor. "
        f"Errors: {playwright_results['errors']}"
    )


def test_bold_formatting_syncs(playwright_results):
    assert playwright_results["bold_synced_a"], (
        f"Expected bold formatting applied in context B to appear as <strong> "
        f"in context A's editor. Errors: {playwright_results['errors']}"
    )


def test_italic_formatting_syncs(playwright_results):
    assert playwright_results["italic_synced_b"], (
        f"Expected italic formatting applied in context A to appear as <em> "
        f"in context B's editor. Errors: {playwright_results['errors']}"
    )
