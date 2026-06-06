"""Final-state verification for the liveblocks-history-undo-redo task.

These tests boot the executor's Next.js app and verify, against real Liveblocks
cloud, that:

* the `/api/liveblocks-auth` endpoint actually mints session tokens;
* the palette page wires `useUndo`, `useRedo`, `useCanUndo`, `useCanRedo`;
* the `Drag-edit first` button uses `useHistory().pause()` / `resume()` so all
  rapid writes collapse into a single history entry;
* edits / deletes are themselves undoable & redoable;
* the underlying Storage layout is a `LiveList` of strings.
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
ROOM = f"palette-room-{RUN_ID}"


def _port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session", autouse=True)
def build_app():
    """Build the Next.js app once before the server fixture starts."""
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
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

    class Starter(ProcessStarter):
        name = "liveblocks_history_app"
        args = ["npm", "run", "start", "--", "-p", str(PORT)]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open("localhost", PORT)

    xprocess.ensure(Starter.name, Starter)

    deadline = time.time() + 60
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/palette/{ROOM}", timeout=5)
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
# Playwright browser test
# ---------------------------------------------------------------------------


def _add_color(page, value: str) -> None:
    page.locator('[data-testid="new-color-input"]').fill(value)
    page.locator('[data-testid="add-color"]').click()


def _row(page, index: int):
    return page.locator(f'[data-testid="palette-row"][data-index="{index}"]')


def _wait_row_count(page, expected: int, timeout_ms: int = 15_000) -> None:
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        last = page.locator('[data-testid="palette-row"]').count()
        if last == expected:
            return
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for palette-row count {expected}; last={last}."
    )


def _wait_color(page, index: int, expected: str, timeout_ms: int = 15_000) -> None:
    locator = _row(page, index).locator('[data-testid="color-label"]')
    deadline = time.time() + timeout_ms / 1000.0
    last = None
    while time.time() < deadline:
        try:
            last = (locator.text_content() or "").strip()
        except Exception:
            last = None
        if last == expected:
            return
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for row {index} color to be {expected!r}; last={last!r}."
    )


def _is_disabled(page, testid: str) -> bool:
    return page.locator(f'[data-testid="{testid}"]').is_disabled()


def test_history_workflow(app_server):
    from playwright.sync_api import sync_playwright

    url = f"{BASE_URL}/palette/{ROOM}"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            ctx = browser.new_context()
            page = ctx.new_page()

            page.goto(url, wait_until="domcontentloaded", timeout=60_000)

            for tid in ("new-color-input", "add-color", "undo-btn",
                         "redo-btn", "drag-edit"):
                page.locator(f'[data-testid="{tid}"]').wait_for(
                    state="visible", timeout=30_000
                )

            # Wait until storage is loaded — Liveblocks may take a moment.
            # An empty fresh room: 0 rows, undo disabled, redo disabled.
            _wait_row_count(page, 0, timeout_ms=20_000)
            # Buttons reflect can-undo / can-redo == false initially.
            deadline = time.time() + 15
            while time.time() < deadline:
                if _is_disabled(page, "undo-btn") and _is_disabled(page, "redo-btn"):
                    break
                time.sleep(0.25)
            assert _is_disabled(page, "undo-btn"), (
                "Undo button must be disabled when there is no history."
            )
            assert _is_disabled(page, "redo-btn"), (
                "Redo button must be disabled when there is no redo stack."
            )

            # Button labels must include the parenthesised shortcut text.
            undo_text = (page.locator('[data-testid="undo-btn"]').text_content()
                         or "").strip()
            redo_text = (page.locator('[data-testid="redo-btn"]').text_content()
                         or "").strip()
            assert "Undo (Ctrl+Z)" in undo_text, (
                f"Undo button label must include 'Undo (Ctrl+Z)'; got: {undo_text!r}"
            )
            assert "Redo (Ctrl+Y)" in redo_text, (
                f"Redo button label must include 'Redo (Ctrl+Y)'; got: {redo_text!r}"
            )

            # 1. Add three colors.
            _add_color(page, "red")
            _wait_row_count(page, 1)
            _wait_color(page, 0, "red")
            _add_color(page, "green")
            _wait_row_count(page, 2)
            _wait_color(page, 1, "green")
            _add_color(page, "blue")
            _wait_row_count(page, 3)
            _wait_color(page, 2, "blue")

            assert not _is_disabled(page, "undo-btn"), (
                "Undo must be enabled after performing 3 add operations."
            )

            # 2. Undo twice — one row remains.
            page.locator('[data-testid="undo-btn"]').click()
            _wait_row_count(page, 2)
            page.locator('[data-testid="undo-btn"]').click()
            _wait_row_count(page, 1)
            _wait_color(page, 0, "red")

            assert not _is_disabled(page, "redo-btn"), (
                "Redo must be enabled after undoing operations."
            )

            # 3. Redo once — two rows again.
            page.locator('[data-testid="redo-btn"]').click()
            _wait_row_count(page, 2)
            _wait_color(page, 1, "green")

            # 4. Drag-edit batches into one undo step.
            page.locator('[data-testid="drag-edit"]').click()
            # After drag-edit, the row at index 0 must have changed away from "red"
            # to whatever the final color in the drag sequence is. We don't pin a
            # specific final color (the task allows any 3 writes), but it must
            # differ from "red".
            deadline = time.time() + 15
            last_label = None
            while time.time() < deadline:
                try:
                    last_label = (
                        _row(page, 0).locator('[data-testid="color-label"]')
                        .text_content() or ""
                    ).strip()
                except Exception:
                    last_label = None
                if last_label and last_label != "red":
                    break
                time.sleep(0.25)
            assert last_label and last_label != "red", (
                f"Drag-edit did not change row 0 away from 'red' (got "
                f"{last_label!r})."
            )
            # Row count must not have changed.
            assert page.locator('[data-testid="palette-row"]').count() == 2, (
                "Drag-edit must not change the number of rows."
            )

            # One undo click reverts the entire drag sequence to 'red'.
            page.locator('[data-testid="undo-btn"]').click()
            _wait_color(page, 0, "red")

            # 5. Edit row 1 (green) -> magenta, then delete it; both must be undoable.
            edit_input = _row(page, 1).locator('[data-testid="color-edit-input"]')
            edit_input.fill("magenta")
            _row(page, 1).locator('[data-testid="color-save"]').click()
            _wait_color(page, 1, "magenta")

            _row(page, 1).locator('[data-testid="color-delete"]').click()
            _wait_row_count(page, 1)

            page.locator('[data-testid="undo-btn"]').click()
            _wait_row_count(page, 2)
            page.locator('[data-testid="undo-btn"]').click()
            _wait_color(page, 1, "green")
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
            palette = (data or {}).get("palette")
            if isinstance(palette, dict) and palette.get(
                "liveblocksType"
            ) == "LiveList":
                entries = palette.get("data") or []
                # Entries should be string scalars (or wrapped scalar objects).
                for entry in entries:
                    if isinstance(entry, dict):
                        # Some LiveList serializations wrap scalars.
                        assert "data" in entry or "liveblocksType" in entry, (
                            f"Unexpected LiveList entry shape: {entry!r}"
                        )
                    else:
                        assert isinstance(entry, str), (
                            f"Expected LiveList entries to be strings; "
                            f"got {entry!r}"
                        )
                return
        time.sleep(2)
    pytest.fail(
        "Storage schema check failed; last body: "
        f"{json.dumps(last_body)[:1000] if last_body else 'no body'}"
    )
