import os
import socket
import time

import pytest
from playwright.sync_api import expect, sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"
PROPAGATION_TIMEOUT_MS = 15000


def _wait_for_port(host: str, port: int, timeout: float = 90.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(0.5)
    return False


@pytest.fixture(scope="session")
def start_app(xprocess):
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID must be set in the verifier environment."

    env = os.environ.copy()
    env["ZEALT_RUN_ID"] = run_id
    env["NEXT_PUBLIC_ZEALT_RUN_ID"] = run_id
    env.setdefault("PORT", str(PORT))

    class Starter(ProcessStarter):
        name = "next_app"
        args = ["npm", "run", "dev"]
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True, "env": env}
        timeout = 180
        terminate_on_interrupt = True

        def startup_check(self):
            return _wait_for_port("localhost", PORT, timeout=1.0)

    xprocess.ensure(Starter.name, Starter)

    assert _wait_for_port("localhost", PORT, timeout=180), (
        f"Next.js dev server did not start on port {PORT} within timeout."
    )

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def two_browsers(start_app):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx_a = browser.new_context()
        ctx_b = browser.new_context()
        page_a = ctx_a.new_page()
        page_b = ctx_b.new_page()

        page_a.goto(BASE_URL, wait_until="domcontentloaded")
        page_b.goto(BASE_URL, wait_until="domcontentloaded")

        # Wait until the skeleton input is rendered in both tabs.
        page_a.wait_for_selector('[data-testid="new-todo-input"]', timeout=PROPAGATION_TIMEOUT_MS)
        page_b.wait_for_selector('[data-testid="new-todo-input"]', timeout=PROPAGATION_TIMEOUT_MS)

        # Make sure storage from any previous run-id leak is cleared by deleting any pre-existing todos in A.
        _wipe_all_todos(page_a)
        _wait_for_count(page_b, 0)

        yield page_a, page_b

        ctx_a.close()
        ctx_b.close()
        browser.close()


# --------------------------- helpers ---------------------------

def _todo_row(page, text: str):
    return page.locator(f'[data-testid="todo-item"][data-todo-text="{text}"]')


def _all_texts(page):
    items = page.locator('[data-testid="todo-item"]')
    return [items.nth(i).get_attribute("data-todo-text") for i in range(items.count())]


def _wait_for_count(page, expected: int):
    expect(page.locator('[data-testid="todo-item"]')).to_have_count(
        expected, timeout=PROPAGATION_TIMEOUT_MS
    )


def _add_todo(page, text: str):
    page.fill('[data-testid="new-todo-input"]', text)
    page.click('[data-testid="add-todo-button"]')


def _wipe_all_todos(page):
    # Delete every existing todo to start from a clean room state.
    items = page.locator('[data-testid="todo-item"]')
    while items.count() > 0:
        items.first.locator('[data-testid="delete-todo-button"]').click()
        page.wait_for_timeout(150)


# --------------------------- tests ---------------------------

def test_skeleton_elements_visible(two_browsers):
    page_a, page_b = two_browsers
    for page in (page_a, page_b):
        expect(page.locator('[data-testid="new-todo-input"]')).to_be_visible()
        expect(page.locator('[data-testid="add-todo-button"]')).to_be_visible()
        expect(page.locator('[data-testid="clear-completed-button"]')).to_be_visible()
        expect(page.locator('[data-testid="todo-list"]')).to_be_visible()


def test_add_propagates_a_to_b(two_browsers):
    page_a, page_b = two_browsers
    _add_todo(page_a, "Buy milk")

    expect(_todo_row(page_a, "Buy milk")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    # Input should be cleared after a successful add.
    expect(page_a.locator('[data-testid="new-todo-input"]')).to_have_value("")

    expect(_todo_row(page_b, "Buy milk")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)


def test_toggle_propagates_a_to_b(two_browsers):
    page_a, page_b = two_browsers
    row_a = _todo_row(page_a, "Buy milk")
    expect(row_a).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    row_a.locator('[data-testid="todo-checkbox"]').click()

    expect(row_a.locator('[data-testid="todo-checkbox"]')).to_be_checked(
        timeout=PROPAGATION_TIMEOUT_MS
    )
    expect(
        _todo_row(page_b, "Buy milk").locator('[data-testid="todo-checkbox"]')
    ).to_be_checked(timeout=PROPAGATION_TIMEOUT_MS)


def test_add_propagates_b_to_a(two_browsers):
    page_a, page_b = two_browsers
    _add_todo(page_b, "Write tests")

    expect(_todo_row(page_b, "Write tests")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    expect(
        _todo_row(page_b, "Write tests").locator('[data-testid="todo-checkbox"]')
    ).not_to_be_checked()

    expect(_todo_row(page_a, "Write tests")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    expect(
        _todo_row(page_a, "Write tests").locator('[data-testid="todo-checkbox"]')
    ).not_to_be_checked()


def test_delete_propagates(two_browsers):
    page_a, page_b = two_browsers
    row_a = _todo_row(page_a, "Write tests")
    expect(row_a).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    row_a.locator('[data-testid="delete-todo-button"]').click()

    expect(_todo_row(page_a, "Write tests")).to_have_count(0, timeout=PROPAGATION_TIMEOUT_MS)
    expect(_todo_row(page_b, "Write tests")).to_have_count(0, timeout=PROPAGATION_TIMEOUT_MS)


def test_clear_completed_is_batched(two_browsers):
    page_a, page_b = two_browsers
    # Precondition: only "Buy milk" (done=true) is in the list. Add an undone "Pay rent" from B.
    _add_todo(page_b, "Pay rent")
    expect(_todo_row(page_a, "Pay rent")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)

    # Click Clear completed in A. Only "Buy milk" should be removed.
    page_a.click('[data-testid="clear-completed-button"]')

    expect(_todo_row(page_a, "Buy milk")).to_have_count(0, timeout=PROPAGATION_TIMEOUT_MS)
    expect(_todo_row(page_a, "Pay rent")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)
    expect(_todo_row(page_b, "Buy milk")).to_have_count(0, timeout=PROPAGATION_TIMEOUT_MS)
    expect(_todo_row(page_b, "Pay rent")).to_have_count(1, timeout=PROPAGATION_TIMEOUT_MS)

    # The full set must be exactly {"Pay rent"} (no orphan empty rows).
    assert set(_all_texts(page_a)) == {"Pay rent"}, (
        f"Expected only 'Pay rent' after clear-completed in A, got {_all_texts(page_a)}"
    )
    assert set(_all_texts(page_b)) == {"Pay rent"}, (
        f"Expected only 'Pay rent' after clear-completed in B, got {_all_texts(page_b)}"
    )


def test_empty_input_is_rejected(two_browsers):
    page_a, page_b = two_browsers
    before_a = _all_texts(page_a)
    page_a.fill('[data-testid="new-todo-input"]', "")
    page_a.click('[data-testid="add-todo-button"]')
    # Give realtime sync a moment.
    page_a.wait_for_timeout(1500)
    after_a = _all_texts(page_a)
    after_b = _all_texts(page_b)
    assert before_a == after_a, (
        f"Empty add should be a no-op in A, before={before_a}, after={after_a}"
    )
    assert "" not in after_a and None not in after_a, (
        f"No row with empty text should be present in A, got {after_a}"
    )
    assert "" not in after_b and None not in after_b, (
        f"No row with empty text should be present in B, got {after_b}"
    )
