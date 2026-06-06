import os
import socket
import time

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myproject"
PORT = 3000
BASE_URL = f"http://localhost:{PORT}"


def _wait_for_port(host: str, port: int, timeout: float = 180.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.0)
            if s.connect_ex((host, port)) == 0:
                return True
        time.sleep(1.0)
    return False


@pytest.fixture(scope="session")
def start_app(xprocess):
    class Starter(ProcessStarter):
        name = "start_app"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                return s.connect_ex(("localhost", PORT)) == 0

    xprocess.ensure(Starter.name, Starter)
    # Give Next.js a few extra seconds to JIT the routes on first request.
    assert _wait_for_port("localhost", PORT, timeout=240), (
        f"Dev server did not start on port {PORT}."
    )
    # Hit the root once to trigger compilation.
    try:
        requests.get(BASE_URL, timeout=60)
    except requests.RequestException:
        pass

    yield

    info = xprocess.getinfo(Starter.name)
    info.terminate()


def test_users_api_returns_directory(start_app):
    resp = requests.get(f"{BASE_URL}/api/users", timeout=30)
    assert resp.status_code == 200, (
        f"GET /api/users expected 200, got {resp.status_code}: {resp.text[:500]}"
    )
    data = resp.json()
    assert isinstance(data, list), f"Expected a JSON array, got {type(data)}"
    by_id = {u.get("id"): u for u in data if isinstance(u, dict)}
    for uid in ["user-alice", "user-bob", "user-charlie", "user-dave", "user-eve"]:
        assert uid in by_id, f"Expected user id '{uid}' in /api/users response."
        u = by_id[uid]
        assert u.get("name"), f"User '{uid}' must have a non-empty 'name'."
        assert u.get("avatar"), f"User '{uid}' must have a non-empty 'avatar'."
    assert by_id["user-alice"]["name"] == "Alice", (
        "Expected `user-alice`'s name to be exactly 'Alice'."
    )


def test_liveblocks_auth_returns_token(start_app):
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID must be set."
    room = f"comments-mentions-{run_id}"
    resp = requests.post(
        f"{BASE_URL}/api/liveblocks-auth",
        headers={"Content-Type": "application/json"},
        json={"room": room},
        timeout=30,
    )
    assert resp.status_code == 200, (
        f"POST /api/liveblocks-auth expected 200, got {resp.status_code}: "
        f"{resp.text[:500]}"
    )
    # The response body shape is `{ token: string }` (or sometimes raw JSON
    # passed through from prepareSession). Accept either, but require a token.
    try:
        body = resp.json()
    except ValueError:
        body = {"token": resp.text}
    token = body.get("token") if isinstance(body, dict) else None
    assert isinstance(token, str) and len(token) > 20, (
        f"Auth endpoint must return a non-empty Liveblocks token; got: {body}"
    )


def test_mentions_resolver_browser(start_app):
    reason = (
        "Verify that `resolveMentionSuggestions` and `resolveUsers` are correctly "
        "wired on `<LiveblocksProvider />`, so typing `@al` in the Composer shows "
        "Alice in the mention suggestion dropdown, and the submitted comment "
        "renders the resolved user name 'Alice' (not the raw user id 'user-alice')."
    )
    truth = (
        f"Navigate to {BASE_URL}. Wait for the page to finish loading and for the "
        "Liveblocks `<Composer />` editor (a [contenteditable] element) to be "
        "visible. Click the editor to focus it. Type the literal characters "
        "`@al` one at a time. Verify that within 10 seconds a mention suggestion "
        "list appears that contains the visible name 'Alice' (the resolved user "
        "name from `resolveUsers`); the raw token 'user-alice' must NOT be the "
        "displayed label. Press Enter (or click) to select the 'Alice' "
        "suggestion. Type ' hello' (a space followed by the word hello) after "
        "the inserted mention chip. Submit the comment by pressing Ctrl+Enter "
        "(or Cmd+Enter on Mac) inside the composer. Wait for the submitted "
        "comment to render inside a Thread on the page. Verify that the rendered "
        "comment contains the visible text 'Alice' (the resolved name) and the "
        "text 'hello'. Verify that the raw text 'user-alice' does NOT appear in "
        "the rendered thread body. The browser console must not show errors "
        "mentioning `resolveMentionSuggestions is not defined` or `resolveUsers "
        "is not defined`."
    )
    verifier = PochiVerifier()
    result = verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_mentions_resolver_browser",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"
