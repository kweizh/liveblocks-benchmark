"""Final-state verification for the liveblocks-shared-stopwatch task.

These tests boot the executor's Next.js app and verify, against the running
production server and real Liveblocks cloud, that:

* `/api/liveblocks-auth` mints a real session token,
* two browser contexts visiting `/` stay in sync,
* clicking start/stop/reset propagates to the other client and updates the
  shared elapsed-ms display correctly.
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

RUN_ID = os.environ.get("ZEALT_RUN_ID", "local")
ROOM = f"stopwatch-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts.

    We must inject NEXT_PUBLIC_ZEALT_RUN_ID at build time so the browser
    bundle has access to it.
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


_server_env = os.environ.copy()
_server_env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID


@pytest.fixture(scope="session")
def app_server(xprocess, build_app):
    """Start the production Next.js server on port 3000."""

    class Starter(ProcessStarter):
        name = "liveblocks_stopwatch_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = _server_env
        timeout = 180
        terminate_on_interrupt = True
        popen_kwargs = {"cwd": PROJECT_DIR}

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)
    # Extra grace: Next.js may accept connections before being fully ready.
    deadline = time.time() + 60
    last_err = None
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/", timeout=5)
            if r.status_code < 500:
                break
        except requests.RequestException as exc:
            last_err = exc
            time.sleep(1)
    else:
        pytest.fail(
            f"Next.js server did not respond on port {PORT} in time: "
            f"{last_err!r}"
        )

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
    for root, _dirs, files in os.walk(PROJECT_DIR):
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
# Playwright two-context end-to-end test
# ---------------------------------------------------------------------------


def _wait_for_state(page, expected: str, timeout_ms: int = 15_000) -> None:
    locator = page.locator("#stopwatch-state")
    locator.wait_for(state="visible", timeout=timeout_ms)
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        last = (locator.text_content() or "").strip()
        if last == expected:
            return
        time.sleep(0.2)
    raise AssertionError(
        f"Timed out waiting for #stopwatch-state to equal {expected!r}; "
        f"last observed: {last!r}"
    )


def _read_elapsed(page) -> int:
    text = (page.locator("#stopwatch-elapsed-ms").text_content() or "").strip()
    assert re.match(r"^\d+$", text), (
        f"#stopwatch-elapsed-ms must contain a base-10 integer, got: "
        f"{text!r}"
    )
    return int(text)


def _wait_for_elapsed_at_least(page, threshold: int,
                               timeout_ms: int = 15_000) -> int:
    locator = page.locator("#stopwatch-elapsed-ms")
    locator.wait_for(state="visible", timeout=timeout_ms)
    deadline = time.time() + timeout_ms / 1000.0
    last_value = None
    while time.time() < deadline:
        last_value = _read_elapsed(page)
        if last_value >= threshold:
            return last_value
        time.sleep(0.1)
    raise AssertionError(
        f"Timed out waiting for #stopwatch-elapsed-ms >= {threshold}; "
        f"last observed: {last_value!r}"
    )


def _wait_for_elapsed_below(page, threshold: int,
                            timeout_ms: int = 15_000) -> int:
    locator = page.locator("#stopwatch-elapsed-ms")
    locator.wait_for(state="visible", timeout=timeout_ms)
    deadline = time.time() + timeout_ms / 1000.0
    last_value = None
    while time.time() < deadline:
        last_value = _read_elapsed(page)
        if last_value < threshold:
            return last_value
        time.sleep(0.1)
    raise AssertionError(
        f"Timed out waiting for #stopwatch-elapsed-ms < {threshold}; "
        f"last observed: {last_value!r}"
    )


def test_two_client_realtime_sync(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context()
            ctx_b = browser.new_context()
            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(url, wait_until="domcontentloaded", timeout=60_000)
            page_b.goto(url, wait_until="domcontentloaded", timeout=60_000)

            for page in (page_a, page_b):
                page.locator("#stopwatch-start").wait_for(
                    state="visible", timeout=30_000
                )
                page.locator("#stopwatch-stop").wait_for(
                    state="visible", timeout=30_000
                )
                page.locator("#stopwatch-reset").wait_for(
                    state="visible", timeout=30_000
                )
                page.locator("#stopwatch-state").wait_for(
                    state="visible", timeout=30_000
                )
                page.locator("#stopwatch-elapsed-ms").wait_for(
                    state="visible", timeout=30_000
                )

            # Both pages should initially show "stopped".
            _wait_for_state(page_a, "stopped")
            _wait_for_state(page_b, "stopped")

            # 1. A clicks start; both see running.
            page_a.locator("#stopwatch-start").click()
            _wait_for_state(page_a, "running")
            _wait_for_state(page_b, "running")

            # 2. Wait ~1.5s; both see elapsed >= 1000.
            time.sleep(1.5)
            elapsed_a = _wait_for_elapsed_at_least(page_a, 1000)
            elapsed_b = _wait_for_elapsed_at_least(page_b, 1000)
            # Both clients must agree within a small clock-skew tolerance.
            assert abs(elapsed_a - elapsed_b) < 500, (
                f"Elapsed values diverged between clients: "
                f"A={elapsed_a}, B={elapsed_b}"
            )

            # 3. B clicks stop; both see stopped.
            page_b.locator("#stopwatch-stop").click()
            _wait_for_state(page_a, "stopped")
            _wait_for_state(page_b, "stopped")

            # Give the stopped state ~250 ms to settle so the local interval
            # has converged on the final accumulated value on both clients.
            time.sleep(0.25)
            e_a_stop = _read_elapsed(page_a)
            e_b_stop = _read_elapsed(page_b)
            assert abs(e_a_stop - e_b_stop) < 500, (
                f"Stopped elapsed values diverged: "
                f"A={e_a_stop}, B={e_b_stop}"
            )

            # 4. Wait 1s; both should still show ~the same value (not counting).
            time.sleep(1.0)
            e_a_after = _read_elapsed(page_a)
            e_b_after = _read_elapsed(page_b)
            assert abs(e_a_after - e_a_stop) < 200, (
                f"Stopwatch kept counting on A after stop: "
                f"before={e_a_stop}, after={e_a_after}"
            )
            assert abs(e_b_after - e_b_stop) < 200, (
                f"Stopwatch kept counting on B after stop: "
                f"before={e_b_stop}, after={e_b_after}"
            )

            # 5. A clicks reset; both see stopped + elapsed < 50.
            page_a.locator("#stopwatch-reset").click()
            _wait_for_state(page_a, "stopped")
            _wait_for_state(page_b, "stopped")
            _wait_for_elapsed_below(page_a, 50)
            _wait_for_elapsed_below(page_b, 50)
        finally:
            browser.close()
