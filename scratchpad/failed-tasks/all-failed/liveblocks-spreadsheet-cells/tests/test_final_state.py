"""Final-state verification for liveblocks-spreadsheet-cells.

This test drives a real Next.js dev server and two independent Playwright
browser contexts against the real Liveblocks cloud to verify the spreadsheet
syncs cell writes, formula evaluation, and the remote-editing indicator.
"""

import os
import re
import socket
import time

import pytest
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/project"
BASE_URL = "http://localhost:3000"
SYNC_TIMEOUT_MS = 20_000


# ---------------------------------------------------------------------------
# Service fixture: `npm run dev`
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "spreadsheet_dev"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        # NEXT_PUBLIC_ZEALT_RUN_ID must be exposed for the client room id.
        env.setdefault("NEXT_PUBLIC_ZEALT_RUN_ID", env.get("ZEALT_RUN_ID", "local"))
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 300
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("127.0.0.1", 3000)) == 0

    xprocess.ensure(Starter.name, Starter)
    # Small grace period for the Next.js compile after the port opens.
    time.sleep(3)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


# ---------------------------------------------------------------------------
# Playwright fixture: two independent browser contexts
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def two_contexts(start_app):
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx_a = browser.new_context()
        ctx_b = browser.new_context()
        page_a = ctx_a.new_page()
        page_b = ctx_b.new_page()

        page_a.goto(BASE_URL, wait_until="domcontentloaded")
        page_b.goto(BASE_URL, wait_until="domcontentloaded")

        page_a.wait_for_selector("[data-cell='A1']", timeout=SYNC_TIMEOUT_MS)
        page_b.wait_for_selector("[data-cell='A1']", timeout=SYNC_TIMEOUT_MS)

        yield page_a, page_b

        ctx_a.close()
        ctx_b.close()
        browser.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _all_labels():
    return [f"{c}{r}" for c in "ABCDE" for r in "12345"]


def _set_cell(page, label, value):
    """Click a cell, type the value, press Enter to commit."""
    cell = page.locator(f"[data-cell='{label}']")
    cell.click()
    # Cell should expose a textbox (input or contenteditable) after click.
    editable = cell.locator(
        "input, textarea, [contenteditable='true'], [contenteditable='']"
    ).first
    editable.wait_for(state="visible", timeout=SYNC_TIMEOUT_MS)
    # Clear any current content
    try:
        editable.fill("")
    except Exception:
        page.keyboard.press("Control+A")
        page.keyboard.press("Delete")
    page.keyboard.type(value)
    page.keyboard.press("Enter")


def _wait_for_cell_text(page, label, needle, timeout=SYNC_TIMEOUT_MS):
    end = time.time() + timeout / 1000.0
    last = None
    while time.time() < end:
        try:
            last = page.locator(f"[data-cell='{label}']").inner_text()
            if needle in last:
                return last
        except Exception:
            pass
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for cell {label} to contain {needle!r}; last value={last!r}"
    )


def _wait_for_attr(page, label, attr, value, timeout=SYNC_TIMEOUT_MS):
    end = time.time() + timeout / 1000.0
    last = None
    while time.time() < end:
        try:
            last = page.locator(f"[data-cell='{label}']").get_attribute(attr)
            if last == value:
                return
        except Exception:
            pass
        time.sleep(0.25)
    raise AssertionError(
        f"Timed out waiting for {label} {attr}={value!r}; last={last!r}"
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_initial_grid_has_25_cells(two_contexts):
    page_a, page_b = two_contexts
    for page in (page_a, page_b):
        labels = page.eval_on_selector_all(
            "[data-cell]",
            "els => els.map(e => e.getAttribute('data-cell'))",
        )
        assert sorted(labels) == sorted(_all_labels()), (
            f"Expected 25 cells A1..E5; got {sorted(labels)}"
        )


def test_a_writes_b_observes(two_contexts):
    page_a, page_b = two_contexts
    _set_cell(page_a, "A1", "10")
    _set_cell(page_a, "A2", "5")
    _wait_for_cell_text(page_b, "A1", "10")
    _wait_for_cell_text(page_b, "A2", "5")


def test_b_writes_formula_both_see_sum(two_contexts):
    page_a, page_b = two_contexts
    _set_cell(page_b, "B1", "=SUM(A1,A2)")
    _wait_for_cell_text(page_b, "B1", "15")
    _wait_for_cell_text(page_a, "B1", "15")


def test_formula_is_case_insensitive_and_whitespace_tolerant(two_contexts):
    page_a, page_b = two_contexts
    _set_cell(page_a, "C1", "=sum( A1 , A2 )")
    _wait_for_cell_text(page_a, "C1", "15")
    _wait_for_cell_text(page_b, "C1", "15")


def test_malformed_formula_shows_err(two_contexts):
    page_a, _ = two_contexts
    _set_cell(page_a, "D1", "=AVG(A1,A2)")
    _wait_for_cell_text(page_a, "D1", "#ERR")


def test_remote_editing_indicator(two_contexts):
    page_a, page_b = two_contexts

    # A starts editing C3 but does NOT commit.
    cell_a = page_a.locator("[data-cell='C3']")
    cell_a.click()
    editable = cell_a.locator(
        "input, textarea, [contenteditable='true'], [contenteditable='']"
    ).first
    editable.wait_for(state="visible", timeout=SYNC_TIMEOUT_MS)

    # B should observe data-remote-editing='true' on C3.
    _wait_for_attr(page_b, "C3", "data-remote-editing", "true")

    edited_border = page_b.eval_on_selector(
        "[data-cell='C3']",
        "el => getComputedStyle(el).borderColor",
    )
    baseline_border = page_b.eval_on_selector(
        "[data-cell='E5']",
        "el => getComputedStyle(el).borderColor",
    )
    assert edited_border and edited_border != baseline_border, (
        f"C3 should have a non-default border while remotely edited; "
        f"edited={edited_border!r} baseline={baseline_border!r}"
    )

    # A finishes editing by pressing Escape (or blur).
    page_a.keyboard.press("Escape")
    # Some implementations only commit on blur; click outside as a fallback.
    page_a.mouse.click(5, 5)

    _wait_for_attr(page_b, "C3", "data-remote-editing", "false")


def test_real_liveblocks_cloud_used(two_contexts):
    """A real Liveblocks cloud connection must be in use (no mocking).

    We capture network requests from the page and require at least one
    websocket or HTTPS request to a liveblocks.io host.
    """
    page_a, _ = two_contexts
    seen = {"hit": False}

    def on_request(req):
        url = req.url
        if "liveblocks.io" in url:
            seen["hit"] = True

    page_a.on("request", on_request)
    # Trigger a fresh interaction that should produce traffic.
    _set_cell(page_a, "E1", "ping")
    end = time.time() + 10
    while time.time() < end and not seen["hit"]:
        time.sleep(0.5)

    assert seen["hit"], (
        "No request to liveblocks.io observed; the task must use the real "
        "Liveblocks cloud (NEVER mock)."
    )
