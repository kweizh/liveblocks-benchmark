import os
import re
import socket
import time

import pytest
import requests
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"

RUN_ID = os.environ.get("ZEALT_RUN_ID", "local")
ROOM_ID = f"kanban-{RUN_ID}"
CARD_TITLE = f"Card-A-{RUN_ID}"


@pytest.fixture(scope="session")
def start_app(xprocess):
    """Build (if needed) and start the Next.js production server."""

    class Starter(ProcessStarter):
        name = "kanban_app"
        # Use npm run start which the agent should configure (next build + next start).
        # We assume build was performed during preparation; if not, we fall back.
        args = ["npm", "run", "start"]
        env = os.environ.copy()
        # Ensure NEXT_PUBLIC_ZEALT_RUN_ID is set so the client joins the right room.
        env["NEXT_PUBLIC_ZEALT_RUN_ID"] = RUN_ID
        env["PORT"] = str(PORT)
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
        }
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", PORT)) == 0

    # Try to build first (idempotent — Next.js skips unchanged work).
    import subprocess

    subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        env={**os.environ, "NEXT_PUBLIC_ZEALT_RUN_ID": RUN_ID},
        check=False,
        timeout=600,
    )

    xprocess.ensure(Starter.name, Starter)
    # Give the page hydration a moment before tests start.
    time.sleep(2)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_index_renders_three_columns(start_app):
    """The page must visibly render the three column titles."""
    resp = requests.get(BASE_URL, timeout=30)
    assert resp.status_code == 200, f"GET / returned {resp.status_code}: {resp.text[:200]}"
    body = resp.text
    for title in ["To Do", "In Progress", "Done"]:
        assert title in body, f"Column title '{title}' not found on /"


def test_auth_endpoint_returns_token(start_app):
    """POST /api/liveblocks-auth must return a JSON object containing a token."""
    payload = {"room": ROOM_ID}
    resp = requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        json=payload,
        timeout=30,
    )
    assert resp.status_code == 200, (
        f"Liveblocks auth endpoint returned {resp.status_code}: {resp.text[:500]}"
    )
    try:
        data = resp.json()
    except ValueError:
        pytest.fail(f"Auth endpoint did not return JSON: {resp.text[:200]}")
    # Liveblocks tokens are returned as `{ token: "..." }`.
    assert isinstance(data, dict), "Auth endpoint must return a JSON object."
    assert "token" in data and isinstance(data["token"], str) and data["token"], (
        f"Auth response must contain a non-empty 'token' string. Got: {data}"
    )


def test_two_context_realtime_sync(start_app):
    """
    Open two independent Playwright browser contexts (users A and B) against the
    same Liveblocks room. User A adds a card to the 'To Do' column, then drags it
    to 'In Progress'. User B must observe the same transitions in real time.
    """
    playwright_module = pytest.importorskip("playwright.sync_api")
    sync_playwright = playwright_module.sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            context_a = browser.new_context()
            context_b = browser.new_context()
            page_a = context_a.new_page()
            page_b = context_b.new_page()

            for page in (page_a, page_b):
                page.goto(BASE_URL, wait_until="domcontentloaded")
                # Wait for the three columns to be in the DOM.
                for title in ["To Do", "In Progress", "Done"]:
                    page.wait_for_selector(f"text={title}", timeout=30000)

            # ---- Add card on A ----
            # The scaffold/implementation should expose an input + add button per column.
            # We locate the To Do column container by its title and use the input/button inside it.
            todo_input_a = page_a.locator(
                "xpath=(//*[contains(., 'To Do')]/ancestor-or-self::*[self::section or self::div or self::li][1])"
                "//input[not(@type='hidden')] | "
                "(//*[contains(., 'To Do')]/ancestor-or-self::*[self::section or self::div or self::li][1])//textarea"
            ).first
            todo_input_a.wait_for(state="visible", timeout=30000)
            todo_input_a.fill(CARD_TITLE)
            # Try pressing Enter first; if the implementation uses a button, click it.
            todo_input_a.press("Enter")
            # Confirm card appears on A.
            page_a.wait_for_selector(f"text={CARD_TITLE}", timeout=30000)

            # ---- B observes the card in To Do ----
            deadline = time.time() + 20
            seen_in_todo = False
            while time.time() < deadline:
                if page_b.locator(f"text={CARD_TITLE}").count() > 0:
                    seen_in_todo = True
                    break
                time.sleep(0.5)
            assert seen_in_todo, (
                f"User B did not see card '{CARD_TITLE}' appear in the To Do column "
                "within 20 seconds — Liveblocks real-time sync is not working."
            )

            # ---- A drags card from To Do to In Progress ----
            source = page_a.locator(f"text={CARD_TITLE}").first
            target = page_a.locator(
                "xpath=(//*[contains(., 'In Progress')]"
                "/ancestor-or-self::*[self::section or self::div or self::li or self::ul or self::ol][1])"
            ).first
            source.scroll_into_view_if_needed()
            target.scroll_into_view_if_needed()

            # Use Playwright's built-in drag_to first; fall back to manual mouse move
            # to be compatible with HTML5 DnD libraries that need explicit events.
            try:
                source.drag_to(target, timeout=10000)
            except Exception:
                box_s = source.bounding_box()
                box_t = target.bounding_box()
                assert box_s and box_t, "Could not get bounding boxes for drag."
                page_a.mouse.move(box_s["x"] + box_s["width"] / 2, box_s["y"] + box_s["height"] / 2)
                page_a.mouse.down()
                page_a.mouse.move(
                    box_t["x"] + box_t["width"] / 2,
                    box_t["y"] + box_t["height"] / 2,
                    steps=20,
                )
                page_a.mouse.up()

            # ---- B observes the card move to In Progress ----
            deadline = time.time() + 25
            moved = False
            while time.time() < deadline:
                in_progress_block = page_b.locator(
                    "xpath=(//*[contains(., 'In Progress')]"
                    "/ancestor-or-self::*[self::section or self::div or self::li or self::ul or self::ol][1])"
                ).first
                todo_block = page_b.locator(
                    "xpath=(//*[contains(., 'To Do')]"
                    "/ancestor-or-self::*[self::section or self::div or self::li or self::ul or self::ol][1])"
                ).first
                try:
                    in_text = in_progress_block.inner_text(timeout=2000)
                    todo_text = todo_block.inner_text(timeout=2000)
                except Exception:
                    in_text, todo_text = "", ""
                if CARD_TITLE in in_text and CARD_TITLE not in todo_text:
                    moved = True
                    break
                time.sleep(0.75)

            assert moved, (
                f"User B did not observe card '{CARD_TITLE}' move from To Do to "
                "In Progress within 25 seconds — drag-and-drop sync via Liveblocks "
                "Storage is not working as required."
            )
        finally:
            browser.close()


def test_drag_mutation_is_single_batched_mutation():
    """
    Inspect the project source to confirm the drag-move is performed inside a single
    useMutation callback that touches BOTH the source column's cardIds and the target
    column's cardIds (i.e. delete + push/insert) — proving the operation is one
    batched Liveblocks transaction rather than two separate mutations.
    """
    candidate_files = []
    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", ".git", "out", "dist")]
        for name in files:
            if name.endswith((".ts", ".tsx", ".js", ".jsx")):
                candidate_files.append(os.path.join(root, name))

    # Find every useMutation(...) callback body and check if any single body
    # contains both a remove-from-source and an insert-into-target call on cardIds.
    pattern = re.compile(r"useMutation\s*\(\s*\(\s*\{[^)]*\}\s*[^)]*\)\s*=>\s*\{", re.DOTALL)

    def extract_callback_body(text, start_idx):
        """Return the text between matching braces starting at start_idx (the '{')."""
        depth = 0
        i = start_idx
        while i < len(text):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start_idx + 1 : i]
            i += 1
        return ""

    matched_any = False
    for path in candidate_files:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue
        for m in pattern.finditer(content):
            body = extract_callback_body(content, m.end() - 1)
            has_delete = bool(
                re.search(r"\.cardIds[\s\S]{0,200}?\.(delete|move)\s*\(", body)
            )
            has_insert = bool(
                re.search(r"\.cardIds[\s\S]{0,200}?\.(push|insert|set)\s*\(", body)
            )
            if has_delete and has_insert:
                matched_any = True
                break
        if matched_any:
            break

    assert matched_any, (
        "Expected a single useMutation callback that BOTH removes a card id from one "
        "column's cardIds and inserts it into another column's cardIds (batched "
        "Liveblocks transaction). No such mutation was found in the project source."
    )
