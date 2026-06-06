import os
import socket
import subprocess
import time

import pytest
import requests
from playwright.sync_api import expect, sync_playwright
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
APP_PORT = 3000
APP_URL = f"http://localhost:{APP_PORT}"


def _port_open(port: int, host: str = "localhost") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


@pytest.fixture(scope="session")
def app_server(xprocess):
    """Build the Next.js project, then start it via `npm run start`."""

    build = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=600,
    )
    assert build.returncode == 0, (
        f"`npm run build` failed.\nSTDOUT:\n{build.stdout}\nSTDERR:\n{build.stderr}"
    )

    class Starter(ProcessStarter):
        name = "poll_app"
        args = ["npm", "run", "start"]
        env = os.environ.copy()
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            return _port_open(APP_PORT)

    xprocess.ensure(Starter.name, Starter)

    # Give Next.js an extra moment to fully boot before serving the first page
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            r = requests.get(APP_URL, timeout=3)
            if r.status_code < 500:
                break
        except requests.RequestException:
            pass
        time.sleep(1)

    yield APP_URL

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_auth_endpoint_owner(app_server):
    """The auth endpoint must mint a real Liveblocks ID token for the owner."""
    r = requests.post(
        f"{app_server}/api/liveblocks-auth",
        json={"userId": "alice", "name": "Alice"},
        timeout=20,
    )
    assert r.status_code == 200, (
        f"POST /api/liveblocks-auth for owner returned {r.status_code}: {r.text}"
    )
    body = r.json()
    token = body.get("token") or body.get("accessToken") or body.get("idToken")
    assert isinstance(token, str) and len(token) > 20, (
        f"Auth endpoint must return a non-empty Liveblocks token; got: {body}"
    )


def test_auth_endpoint_voter(app_server):
    """The auth endpoint must also mint a token for a voter (non-owner) user."""
    r = requests.post(
        f"{app_server}/api/liveblocks-auth",
        json={"userId": "bob", "name": "Bob"},
        timeout=20,
    )
    assert r.status_code == 200, (
        f"POST /api/liveblocks-auth for voter returned {r.status_code}: {r.text}"
    )
    body = r.json()
    token = body.get("token") or body.get("accessToken") or body.get("idToken")
    assert isinstance(token, str) and len(token) > 20, (
        f"Auth endpoint must return a non-empty Liveblocks token; got: {body}"
    )


def _wait_for_label(page, label_text: str, timeout_ms: int = 30000):
    """Wait until a data-testid='label-*' element with the given text appears,
    and return its option id."""
    locator = page.locator(f"[data-testid^='label-']", has_text=label_text)
    expect(locator.first).to_be_visible(timeout=timeout_ms)
    testid = locator.first.get_attribute("data-testid")
    assert testid and testid.startswith("label-"), (
        f"Expected a data-testid starting with 'label-' for option '{label_text}', got '{testid}'."
    )
    return testid[len("label-"):]


def test_poll_two_context_realtime(app_server):
    """Drive two real browser contexts through the full poll workflow against
    the real Liveblocks cloud and validate cross-context synchronisation."""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            ctx_a = browser.new_context()
            ctx_b = browser.new_context()
            try:
                page_a = ctx_a.new_page()
                page_b = ctx_b.new_page()

                # Step 1: Alice (owner) joins the room.
                page_a.goto(f"{app_server}/?userId=alice&name=Alice", timeout=60000)
                expect(page_a.locator("[data-testid='question-input']")).to_be_visible(
                    timeout=45000
                )

                # Step 2: Alice writes the question.
                question = "What is your favorite color?"
                q_input = page_a.locator("[data-testid='question-input']")
                q_input.fill(question)
                q_input.blur()

                # Step 3: Alice adds three options.
                for label in ("Red", "Green", "Blue"):
                    page_a.locator("[data-testid='new-option-input']").fill(label)
                    page_a.locator("[data-testid='add-option-btn']").click()
                    expect(
                        page_a.locator(
                            "[data-testid^='label-']", has_text=label
                        ).first
                    ).to_be_visible(timeout=20000)

                red_id = _wait_for_label(page_a, "Red")
                green_id = _wait_for_label(page_a, "Green")
                blue_id = _wait_for_label(page_a, "Blue")

                assert len({red_id, green_id, blue_id}) == 3, (
                    f"Option IDs must be unique, got: {red_id}, {green_id}, {blue_id}"
                )

                # Step 4: Bob (voter) joins.
                page_b.goto(f"{app_server}/?userId=bob&name=Bob", timeout=60000)

                # Bob must see the three options that Alice created via real cloud sync.
                expect(
                    page_b.locator("[data-testid^='label-']", has_text="Red").first
                ).to_be_visible(timeout=45000)
                expect(
                    page_b.locator("[data-testid^='label-']", has_text="Green").first
                ).to_be_visible(timeout=45000)
                expect(
                    page_b.locator("[data-testid^='label-']", has_text="Blue").first
                ).to_be_visible(timeout=45000)

                # Step 5: Bob (voter) UI must NOT show owner-only controls.
                assert (
                    page_b.locator("[data-testid='add-option-btn']").count() == 0
                ), "Voter Bob must NOT see the 'add-option-btn' control."
                assert (
                    page_b.locator("[data-testid='new-option-input']").count() == 0
                ), "Voter Bob must NOT see the 'new-option-input' control."
                assert (
                    page_b.locator("[data-testid^='remove-']").count() == 0
                ), "Voter Bob must NOT see any per-option 'remove-*' control."

                # Voter question-input must be either absent or non-editable.
                q_on_b = page_b.locator("[data-testid='question-input']")
                if q_on_b.count() > 0:
                    disabled = q_on_b.first.get_attribute("disabled")
                    readonly = q_on_b.first.get_attribute("readonly")
                    assert disabled is not None or readonly is not None, (
                        "Voter must not be able to edit the poll question."
                    )

                # Step 6: Each user casts a vote.
                page_a.locator(f"[data-testid='vote-{red_id}']").click()
                page_b.locator(f"[data-testid='vote-{green_id}']").click()

                # Both contexts should converge to 2 total votes.
                expect(page_a.locator("[data-testid='total-votes']")).to_have_text(
                    "Total votes: 2", timeout=30000
                )
                expect(page_b.locator("[data-testid='total-votes']")).to_have_text(
                    "Total votes: 2", timeout=30000
                )

                # Bars should be 50% / 50% / 0%.
                expect(page_a.locator(f"[data-testid='bar-{red_id}']")).to_contain_text(
                    "50%", timeout=30000
                )
                expect(
                    page_a.locator(f"[data-testid='bar-{green_id}']")
                ).to_contain_text("50%", timeout=30000)
                expect(
                    page_a.locator(f"[data-testid='bar-{blue_id}']")
                ).to_contain_text("0%", timeout=30000)
                expect(page_b.locator(f"[data-testid='bar-{red_id}']")).to_contain_text(
                    "50%", timeout=30000
                )
                expect(
                    page_b.locator(f"[data-testid='bar-{green_id}']")
                ).to_contain_text("50%", timeout=30000)

                # Step 7: Bob changes his vote from Green to Red.
                page_b.locator(f"[data-testid='vote-{red_id}']").click()

                # Total still 2, but Red == 100%, Green == 0%, Blue == 0% in both contexts.
                expect(page_a.locator("[data-testid='total-votes']")).to_have_text(
                    "Total votes: 2", timeout=30000
                )
                expect(page_b.locator("[data-testid='total-votes']")).to_have_text(
                    "Total votes: 2", timeout=30000
                )
                expect(page_a.locator(f"[data-testid='bar-{red_id}']")).to_contain_text(
                    "100%", timeout=30000
                )
                expect(
                    page_a.locator(f"[data-testid='bar-{green_id}']")
                ).to_contain_text("0%", timeout=30000)
                expect(
                    page_a.locator(f"[data-testid='bar-{blue_id}']")
                ).to_contain_text("0%", timeout=30000)
                expect(page_b.locator(f"[data-testid='bar-{red_id}']")).to_contain_text(
                    "100%", timeout=30000
                )

            finally:
                ctx_a.close()
                ctx_b.close()
        finally:
            browser.close()
