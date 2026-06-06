"""Final-state verification for the liveblocks-mind-map-nodes task.

Uses pytest-xprocess to boot the Next.js dev server and Playwright (Python)
to drive two concurrent browser contexts that simulate two distinct users
joining the same Liveblocks room. The test asserts that one user's CRUD
operations (create, drag, rename, recursive delete) on the mind-map nodes
propagate through the real Liveblocks cloud and become visible in the
other user's DOM.
"""

import os
import socket
import time

import pytest
from xprocess import ProcessStarter
from playwright.sync_api import sync_playwright

PROJECT_DIR = "/home/user/myproject"
BASE_URL = "http://localhost:3000"

CANVAS_SELECTOR = '[data-testid="mind-map-canvas"]'
NODE_SELECTOR = '[data-testid="mind-map-node"]'
LABEL_SELECTOR = '[data-testid="mind-map-label"]'
EDGE_SELECTOR = '[data-testid="mind-map-edge"]'

SYNC_TIMEOUT_S = 20.0
DEV_START_TIMEOUT_S = 240.0


def _wait_for_port(host: str, port: int, timeout: float = DEV_START_TIMEOUT_S) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(1)
    return False


@pytest.fixture(scope="session")
def required_env():
    for key in (
        "LIVEBLOCKS_SECRET_KEY",
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY",
        "ZEALT_RUN_ID",
    ):
        assert os.environ.get(key), (
            f"Required environment variable {key} is not set for the verifier."
        )
    return os.environ["ZEALT_RUN_ID"]


@pytest.fixture(scope="session")
def start_app(required_env, xprocess):
    env = os.environ.copy()
    # Forward ZEALT_RUN_ID to the client bundle as a NEXT_PUBLIC_* variable
    # in case the executor reads it from there.
    env.setdefault("NEXT_PUBLIC_ZEALT_RUN_ID", env["ZEALT_RUN_ID"])

    class Starter(ProcessStarter):
        name = "mindmap_dev"
        args = ["npm", "run", "dev"]
        popen_kwargs = {
            "cwd": PROJECT_DIR,
            "text": True,
            "env": env,
        }
        timeout = DEV_START_TIMEOUT_S
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", 3000)) == 0

    xprocess.ensure(Starter.name, Starter)

    assert _wait_for_port("localhost", 3000, timeout=DEV_START_TIMEOUT_S), (
        "Next.js dev server did not become ready on port 3000."
    )
    # Give Next.js a moment to compile the first page on first request.
    time.sleep(3)

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def _list_node_ids(page):
    return page.eval_on_selector_all(
        NODE_SELECTOR,
        "els => els.map(e => e.getAttribute('data-node-id'))",
    )


def _list_edges(page):
    return page.eval_on_selector_all(
        EDGE_SELECTOR,
        "els => els.map(e => ({"
        " parent: e.getAttribute('data-parent-id'),"
        " child: e.getAttribute('data-child-id') }))",
    )


def _node_center(page, node_id):
    box = page.eval_on_selector(
        f'{NODE_SELECTOR}[data-node-id="{node_id}"]',
        "el => { const r = el.getBoundingClientRect(); "
        "return { x: r.left + r.width/2, y: r.top + r.height/2, "
        "w: r.width, h: r.height }; }",
    )
    return box


def _wait_until(predicate, timeout_s=SYNC_TIMEOUT_S, poll_s=0.5):
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        try:
            last = predicate()
            if last:
                return last
        except Exception as e:  # pragma: no cover - debug aid
            last = e
        time.sleep(poll_s)
    raise AssertionError(f"Timed out waiting for condition; last value={last!r}")


def _label_text(page, node_id):
    return page.eval_on_selector(
        f'{LABEL_SELECTOR}[data-node-id="{node_id}"]',
        "el => el.textContent || ''",
    )


def test_two_context_collaborative_mind_map(start_app, required_env):
    run_id = required_env

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            ctx_a = browser.new_context(viewport={"width": 1280, "height": 800})
            ctx_b = browser.new_context(viewport={"width": 1280, "height": 800})
            page_a = ctx_a.new_page()
            page_b = ctx_b.new_page()

            page_a.goto(BASE_URL, wait_until="networkidle")
            page_b.goto(BASE_URL, wait_until="networkidle")

            # Step 0: canvas present, no nodes yet
            page_a.wait_for_selector(CANVAS_SELECTOR, timeout=30000)
            page_b.wait_for_selector(CANVAS_SELECTOR, timeout=30000)

            assert len(_list_node_ids(page_a)) == 0, (
                "Expected no nodes initially in User A."
            )
            assert len(_list_node_ids(page_b)) == 0, (
                "Expected no nodes initially in User B."
            )

            # ---------------------------------------------------------------
            # Step 1: User A creates three nodes by clicking the canvas.
            # ---------------------------------------------------------------
            canvas_box = page_a.eval_on_selector(
                CANVAS_SELECTOR,
                "el => { const r = el.getBoundingClientRect(); "
                "return { x: r.left, y: r.top, w: r.width, h: r.height }; }",
            )

            click_points = [
                (canvas_box["x"] + 200, canvas_box["y"] + 200),
                (canvas_box["x"] + 500, canvas_box["y"] + 260),
                (canvas_box["x"] + 360, canvas_box["y"] + 460),
            ]
            for cx, cy in click_points:
                page_a.mouse.click(cx, cy)
                time.sleep(0.4)

            # A: three nodes present
            ids_a = _wait_until(
                lambda: (
                    _list_node_ids(page_a)
                    if len(_list_node_ids(page_a)) == 3
                    else None
                ),
                timeout_s=15.0,
            )
            assert len(ids_a) == 3 and all(ids_a), (
                f"Expected 3 nodes in User A with non-empty ids, got {ids_a}"
            )

            edges_a = _list_edges(page_a)
            assert len(edges_a) >= 2, (
                f"Expected at least 2 connector edges in User A, got {edges_a}"
            )

            # B sees the same three nodes
            ids_b = _wait_until(
                lambda: (
                    _list_node_ids(page_b)
                    if len(_list_node_ids(page_b)) == 3
                    else None
                ),
                timeout_s=SYNC_TIMEOUT_S,
            )
            assert set(ids_a) == set(ids_b), (
                f"User B did not see the same node ids as User A: "
                f"A={ids_a} B={ids_b}"
            )
            _wait_until(
                lambda: len(_list_edges(page_b)) >= 2,
                timeout_s=SYNC_TIMEOUT_S,
            )

            # ---------------------------------------------------------------
            # Step 2: User A drags one non-root child node.
            # ---------------------------------------------------------------
            # Identify the root: the node whose id never appears as 'child' in edges.
            children = {e["child"] for e in edges_a}
            parents = {e["parent"] for e in edges_a}
            root_candidates = [i for i in ids_a if i not in children]
            assert root_candidates, (
                f"Could not identify a root node (no node without an incoming "
                f"edge). edges={edges_a}, ids={ids_a}"
            )
            root_id = root_candidates[0]
            child_ids = [i for i in ids_a if i != root_id]
            assert child_ids, "Expected at least one child node to drag."

            drag_target = child_ids[0]
            start_box_a = _node_center(page_a, drag_target)
            dx, dy = 180.0, 120.0

            # Perform a slow drag (multiple intermediate steps) so the throttled
            # mutation has time to emit several updates.
            page_a.mouse.move(start_box_a["x"], start_box_a["y"])
            page_a.mouse.down()
            steps = 12
            for i in range(1, steps + 1):
                page_a.mouse.move(
                    start_box_a["x"] + dx * i / steps,
                    start_box_a["y"] + dy * i / steps,
                )
                time.sleep(0.04)
            page_a.mouse.up()
            time.sleep(0.5)

            # A: node moved
            end_box_a = _node_center(page_a, drag_target)
            assert (end_box_a["x"] - start_box_a["x"]) > 50, (
                f"User A's dragged node did not move horizontally: "
                f"start={start_box_a}, end={end_box_a}"
            )
            assert (end_box_a["y"] - start_box_a["y"]) > 30, (
                f"User A's dragged node did not move vertically: "
                f"start={start_box_a}, end={end_box_a}"
            )

            # B: same node moved to similar coordinates
            def _b_moved():
                box_b = _node_center(page_b, drag_target)
                if (
                    abs(box_b["x"] - end_box_a["x"]) < 25
                    and abs(box_b["y"] - end_box_a["y"]) < 25
                ):
                    return box_b
                return None

            _wait_until(_b_moved, timeout_s=SYNC_TIMEOUT_S)

            # ---------------------------------------------------------------
            # Step 3: User A renames a different child node.
            # ---------------------------------------------------------------
            rename_target = child_ids[1] if len(child_ids) > 1 else child_ids[0]
            new_label = f"Renamed-{run_id}"

            # Set up the next prompt() answer (in case the implementation uses
            # window.prompt for the rename UX).
            page_a.once("dialog", lambda dialog: dialog.accept(new_label))

            center = _node_center(page_a, rename_target)
            page_a.mouse.dblclick(center["x"], center["y"])
            time.sleep(0.5)

            # If the implementation uses an inline <input>/<textarea> instead
            # of prompt(), try to fill it and press Enter.
            try:
                edit_input = page_a.query_selector(
                    'input[data-testid="mind-map-rename-input"], '
                    'textarea[data-testid="mind-map-rename-input"]'
                )
                if edit_input is not None:
                    edit_input.fill(new_label)
                    edit_input.press("Enter")
            except Exception:
                pass

            time.sleep(0.5)

            _wait_until(
                lambda: new_label in _label_text(page_a, rename_target),
                timeout_s=10.0,
            )
            _wait_until(
                lambda: new_label in _label_text(page_b, rename_target),
                timeout_s=SYNC_TIMEOUT_S,
            )

            # ---------------------------------------------------------------
            # Step 4: User A deletes the root → recursive removal.
            # ---------------------------------------------------------------
            root_center = _node_center(page_a, root_id)
            page_a.mouse.click(root_center["x"], root_center["y"])
            time.sleep(0.3)
            # Use the SVG-wide keypress so selection-based handlers receive it.
            page_a.keyboard.press("Delete")
            time.sleep(0.5)

            _wait_until(
                lambda: len(_list_node_ids(page_a)) == 0,
                timeout_s=10.0,
            )
            assert len(_list_edges(page_a)) == 0, (
                "Expected all edges to be removed in User A after deleting the root."
            )

            _wait_until(
                lambda: len(_list_node_ids(page_b)) == 0,
                timeout_s=SYNC_TIMEOUT_S,
            )
            assert len(_list_edges(page_b)) == 0, (
                "Expected all edges to be removed in User B after deleting the root."
            )

        finally:
            browser.close()
