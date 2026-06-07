"""Final-state verification for the liveblocks-active-users-list task.

These tests boot the executor's Next.js production server and verify, against
real Liveblocks v2 cloud, that:

* the `/api/liveblocks-auth` endpoint actually mints a session token;
* three Playwright browser contexts visiting `/active-users` join the same
  Liveblocks room and see the same realtime participant list;
* the count and the list items satisfy the documented DOM contract;
* no source file mocks `@liveblocks/*`.
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
ROOM = f"active-users-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _build_env() -> dict:
    """Build environment used by both `npm run build` and `npm run start`.

    Re-exports `NEXT_PUBLIC_ZEALT_RUN_ID` so the value is embedded into the
    Next.js client bundle at build time. The room id observed by the browser
    therefore matches the verifier's `ROOM`.
    """

    env = os.environ.copy()
    env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID
    return env


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts."""
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=600,
        env=_build_env(),
    )
    assert result.returncode == 0, (
        f"`npm run build` failed (exit {result.returncode}).\n"
        f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    )


@pytest.fixture(scope="session")
def app_server(xprocess, build_app):
    """Start the production Next.js server on port 3000."""

    class Starter(ProcessStarter):
        name = "liveblocks_active_users_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = _build_env()
        cwd = PROJECT_DIR
        stdout = sys.stdout
        stderr = sys.stderr
        close_fds = True
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    # Extra grace: Next sometimes accepts connections before fully ready.
    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/active-users", timeout=5)
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
    for required in ("@liveblocks/client", "@liveblocks/react",
                     "@liveblocks/node"):
        assert required in deps, (
            f"{required} must remain a real dependency (no mocks)."
        )

    src_root = PROJECT_DIR
    forbidden_patterns = (
        re.compile(r"jest\.mock\([^\)]*liveblocks", re.IGNORECASE),
        re.compile(r"vi\.mock\([^\)]*liveblocks", re.IGNORECASE),
    )
    for root, _dirs, files in os.walk(src_root):
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
# Playwright three-context end-to-end test
# ---------------------------------------------------------------------------


def _wait_for_count(page, expected: int, timeout_ms: int = 30_000) -> str:
    locator = page.locator("span#active-users-count")
    locator.wait_for(state="attached", timeout=timeout_ms)
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        last = (locator.text_content() or "").strip()
        if last == str(expected):
            return last
        time.sleep(0.5)
    raise AssertionError(
        f"#active-users-count never reached {expected}; last observed: {last!r}"
    )


def _wait_for_li_count(page, expected: int, timeout_ms: int = 30_000) -> int:
    list_locator = page.locator("ul#active-users")
    list_locator.wait_for(state="attached", timeout=timeout_ms)
    items = page.locator("ul#active-users > li")
    deadline = time.time() + timeout_ms / 1000.0
    last = -1
    while time.time() < deadline:
        last = items.count()
        if last == expected:
            return last
        time.sleep(0.5)
    raise AssertionError(
        f"ul#active-users never had exactly {expected} <li> children; "
        f"last observed count: {last}"
    )


def test_three_client_realtime_presence(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/active-users"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        contexts = []
        try:
            pages = []
            for _ in range(3):
                ctx = browser.new_context()
                contexts.append(ctx)
                page = ctx.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=60_000)
                pages.append(page)

            # All three pages must report 3 connected users and 3 list items.
            for page in pages:
                _wait_for_count(page, 3)
                _wait_for_li_count(page, 3)

            for page in pages:
                items = page.locator("ul#active-users > li")
                count = items.count()
                assert count == 3, (
                    f"Expected exactly 3 <li> elements under #active-users, "
                    f"got {count} on page {page.url!r}."
                )
                ids = []
                for i in range(count):
                    li = items.nth(i)
                    conn_id = li.get_attribute("data-connection-id")
                    assert conn_id is not None and conn_id.strip() != "", (
                        "Each <li> under #active-users must expose a "
                        "non-empty data-connection-id attribute; got "
                        f"{conn_id!r}."
                    )
                    text = (li.text_content() or "").strip()
                    expected_text = f"User-{conn_id}"
                    assert text == expected_text, (
                        f"<li data-connection-id=\"{conn_id}\"> must have text "
                        f"content {expected_text!r}, got {text!r}."
                    )
                    ids.append(conn_id)

                assert len(set(ids)) == 3, (
                    "Expected 3 distinct data-connection-id values under "
                    f"#active-users; got {ids!r}."
                )

                count_text = (
                    page.locator("span#active-users-count")
                    .text_content()
                    or ""
                ).strip()
                assert count_text == "3", (
                    f"span#active-users-count must read '3'; got "
                    f"{count_text!r}."
                )
        finally:
            for ctx in contexts:
                try:
                    ctx.close()
                except Exception:
                    pass
            browser.close()
