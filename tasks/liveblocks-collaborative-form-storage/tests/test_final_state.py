"""Final-state verification for the liveblocks-collaborative-form-storage task.

These tests boot the executor's Next.js app and verify, against real Liveblocks
cloud (v2), that:

* the `/api/liveblocks-auth` endpoint actually mints session tokens via
  `@liveblocks/node`;
* the root form page renders the DOM contract (`#form-name`, `#form-email`,
  `#form-message`, `#form-last-update`);
* edits in one browser context propagate through Liveblocks Storage to a
  second context viewing the same room (both A -> B and B -> A);
* `#form-last-update` is set to an ISO timestamp after edits;
* the form values persist across a reload (Storage durability);
* the Storage schema reported by Liveblocks REST v2 is `LiveObject` with the
  expected fields and matches the most recent edits;
* no part of the project mocks the Liveblocks packages.
"""

import json
import os
import re
import signal
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
ROOM = f"form-storage-{RUN_ID}"

ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$")


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def _kill_existing_server():
    """Best-effort: kill any leftover node process holding port 3000."""
    try:
        out = subprocess.run(
            ["bash", "-lc", f"lsof -tiTCP:{PORT} -sTCP:LISTEN || true"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        pids = [int(p) for p in out.stdout.split() if p.strip().isdigit()]
        for pid in pids:
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        if pids:
            time.sleep(2)
            for pid in pids:
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
    except Exception:
        pass


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts.

    NEXT_PUBLIC_ZEALT_RUN_ID must be exported BEFORE `npm run build` so that
    Next.js inlines the room id into the client bundle.
    """
    _kill_existing_server()

    build_env = os.environ.copy()
    build_env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID

    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        env=build_env,
        capture_output=True,
        text=True,
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
        name = "liveblocks_form_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = server_env
        stdout = sys.stdout
        stderr = sys.stderr
        close_fds = True
        preexec_fn = os.setsid if hasattr(os, "setsid") else None
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            r = requests.get(BASE_URL + "/", timeout=5)
            if r.status_code < 500:
                break
        except requests.RequestException:
            time.sleep(1)
    else:
        pytest.fail("Next.js server did not respond on port 3000 in time.")

    yield BASE_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()
    _kill_existing_server()


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
# Playwright browser tests
# ---------------------------------------------------------------------------


def _wait_input_value(page, selector: str, expected: str,
                      timeout_ms: int = 20_000) -> None:
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        try:
            last = page.eval_on_selector(
                selector, "(el) => el.value"
            )
        except Exception:
            last = None
        if last == expected:
            return
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for `{selector}` to equal {expected!r}; "
        f"last={last!r}."
    )


def _wait_text(page, selector: str, predicate, timeout_ms: int = 20_000):
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        try:
            last = (page.text_content(selector) or "").strip()
        except Exception:
            last = None
        if last is not None and predicate(last):
            return last
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for `{selector}` predicate; last={last!r}."
    )


def _fill_input(page, selector: str, value: str) -> None:
    locator = page.locator(selector)
    locator.fill("")
    locator.fill(value)
    # nudge React to flush by blurring focus.
    page.locator("body").click(position={"x": 1, "y": 1})


def test_collaborative_form_storage_workflow(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx_a = browser.new_context()
            page_a = ctx_a.new_page()
            page_a.goto(url, wait_until="domcontentloaded", timeout=60_000)

            ctx_b = browser.new_context()
            page_b = ctx_b.new_page()
            page_b.goto(url, wait_until="domcontentloaded", timeout=60_000)

            for page in (page_a, page_b):
                for sel in ("#form-name", "#form-email", "#form-message",
                            "#form-last-update"):
                    page.locator(sel).wait_for(state="attached",
                                               timeout=30_000)

            # ---- A -> B: A fills all three fields ----
            _fill_input(page_a, "#form-name", "Ada Lovelace")
            _fill_input(page_a, "#form-email", "ada@example.com")
            _fill_input(page_a, "#form-message", "Hello from A")

            _wait_input_value(page_b, "#form-name", "Ada Lovelace")
            _wait_input_value(page_b, "#form-email", "ada@example.com")
            _wait_input_value(page_b, "#form-message", "Hello from A")

            # ---- B -> A: B overwrites email ----
            _fill_input(page_b, "#form-email", "ada2@example.com")
            _wait_input_value(page_a, "#form-email", "ada2@example.com")

            # ---- lastUpdate badge shows ISO timestamp on both contexts ----
            for page, label in ((page_a, "A"), (page_b, "B")):
                value = _wait_text(
                    page,
                    "#form-last-update",
                    lambda v: bool(ISO_RE.match(v)),
                )
                assert ISO_RE.match(value), (
                    f"#form-last-update on context {label} is not an ISO "
                    f"timestamp: {value!r}"
                )

            # ---- Persistence: close A, reopen, expect Storage durable ----
            ctx_a.close()
            ctx_a2 = browser.new_context()
            page_a2 = ctx_a2.new_page()
            page_a2.goto(url, wait_until="domcontentloaded", timeout=60_000)
            for sel in ("#form-name", "#form-email", "#form-message"):
                page_a2.locator(sel).wait_for(state="attached",
                                              timeout=30_000)

            _wait_input_value(page_a2, "#form-name", "Ada Lovelace")
            _wait_input_value(page_a2, "#form-email", "ada2@example.com")
            _wait_input_value(page_a2, "#form-message", "Hello from A")
        finally:
            browser.close()


def test_storage_schema_via_liveblocks_rest(app_server):
    if not LIVEBLOCKS_SECRET:
        pytest.skip("LIVEBLOCKS_SECRET_KEY not provided; skipping REST check.")

    headers = {"Authorization": f"Bearer {LIVEBLOCKS_SECRET}"}
    deadline = time.time() + 60
    last_body = None
    while time.time() < deadline:
        resp = requests.get(
            f"https://api.liveblocks.io/v2/rooms/{ROOM}/storage",
            headers=headers,
            timeout=20,
        )
        if resp.status_code == 200:
            last_body = resp.json()
            data = last_body.get("data") if isinstance(last_body, dict) else None
            form = (data or {}).get("form")
            if isinstance(form, dict) and form.get("liveblocksType") == "LiveObject":
                fields = form.get("data") or {}
                if (
                    "name" in fields
                    and "email" in fields
                    and "message" in fields
                    and "lastUpdate" in fields
                ):
                    # Sanity-check the latest values written by the browser
                    # test. Tolerate ScalarOrLiveObject wrapping.
                    def _unwrap(value):
                        if isinstance(value, dict):
                            return value.get("data", value)
                        return value

                    name = _unwrap(fields.get("name"))
                    email = _unwrap(fields.get("email"))
                    message = _unwrap(fields.get("message"))
                    last_update = _unwrap(fields.get("lastUpdate"))
                    assert name == "Ada Lovelace", (
                        f"Expected name='Ada Lovelace' in storage, got {name!r}"
                    )
                    assert email == "ada2@example.com", (
                        f"Expected email='ada2@example.com' in storage, "
                        f"got {email!r}"
                    )
                    assert message == "Hello from A", (
                        f"Expected message='Hello from A' in storage, "
                        f"got {message!r}"
                    )
                    assert isinstance(last_update, str) and ISO_RE.match(
                        last_update
                    ), (
                        f"Expected ISO `lastUpdate` in storage, got "
                        f"{last_update!r}"
                    )
                    return
        time.sleep(2)
    pytest.fail(
        "Storage schema check failed; last body: "
        f"{json.dumps(last_body)[:1000] if last_body else 'no body'}"
    )
