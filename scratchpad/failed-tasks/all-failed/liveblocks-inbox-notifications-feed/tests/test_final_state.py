import json
import os
import socket
import subprocess
import time

import pytest
import requests
from pochi_verifier import PochiVerifier
from xprocess import ProcessStarter

PROJECT_DIR = "/home/user/myapp"
USER_ID = "user-1"
COMMENTER_USER_ID = "user-2"
APP_URL = "http://localhost:3000"


def _run_id() -> str:
    rid = os.environ.get("ZEALT_RUN_ID")
    assert rid, "ZEALT_RUN_ID environment variable must be set."
    return rid


def _secret_key() -> str:
    key = os.environ.get("LIVEBLOCKS_SECRET_KEY")
    assert key, "LIVEBLOCKS_SECRET_KEY environment variable must be set."
    return key


@pytest.fixture(scope="session")
def seeded_thread():
    """Seed a fresh inbox notification for user-1 via the real Liveblocks cloud."""
    run_id = _run_id()
    room_id = f"inbox-task-room-{run_id}"
    seed_script = """
const { Liveblocks } = require("@liveblocks/node");

(async () => {
  const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY });
  const roomId = process.env.SEED_ROOM_ID;
  const mentionedUser = process.env.SEED_MENTIONED_USER;
  const commenterUser = process.env.SEED_COMMENTER_USER;

  // 1. Clear existing notifications for the mentioned user (best-effort).
  try {
    await liveblocks.deleteAllInboxNotifications({ userId: mentionedUser });
  } catch (e) {
    // ignore: nothing to delete
  }

  // 2. Ensure the room exists.
  try {
    await liveblocks.createRoom(roomId, { defaultAccesses: ["room:write"] });
  } catch (e) {
    if (!String(e && e.message).match(/already exists/i)) {
      // Try to update instead.
      try {
        await liveblocks.updateRoom(roomId, { defaultAccesses: ["room:write"] });
      } catch (e2) {
        // ignore - the room might exist with another config
      }
    }
  }

  // 3. Create a thread with a comment mentioning the user.
  const thread = await liveblocks.createThread({
    roomId,
    data: {
      comment: {
        userId: commenterUser,
        body: {
          version: 1,
          content: [
            {
              type: "paragraph",
              children: [
                { text: "Hey " },
                { type: "mention", kind: "user", id: mentionedUser },
                { text: " please review this." },
              ],
            },
          ],
        },
      },
    },
  });

  // 4. Poll until the notification shows up for the mentioned user.
  const deadline = Date.now() + 30_000;
  let found = null;
  while (Date.now() < deadline) {
    const { inboxNotifications } = await liveblocks.getInboxNotifications({ userId: mentionedUser });
    found = (inboxNotifications || []).find(
      (n) => n.kind === "thread" && n.roomId === roomId && n.threadId === thread.id && n.readAt == null
    );
    if (found) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!found) {
    console.error(JSON.stringify({ ok: false, reason: "notification not visible", threadId: thread.id }));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, threadId: thread.id, notificationId: found.id, roomId }));
})().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.stack || err) }));
  process.exit(1);
});
"""
    seed_path = "/tmp/liveblocks_seed.cjs"
    with open(seed_path, "w") as f:
        f.write(seed_script)

    env = os.environ.copy()
    env["SEED_ROOM_ID"] = room_id
    env["SEED_MENTIONED_USER"] = USER_ID
    env["SEED_COMMENTER_USER"] = COMMENTER_USER_ID
    env["LIVEBLOCKS_SECRET_KEY"] = _secret_key()

    result = subprocess.run(
        ["node", seed_path],
        cwd=PROJECT_DIR,
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert result.returncode == 0, (
        f"Seeding inbox notification failed.\nstdout: {result.stdout}\nstderr: {result.stderr}"
    )
    payload = None
    for line in result.stdout.splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                payload = json.loads(line)
            except Exception:
                continue
    assert payload and payload.get("ok"), (
        f"Seed script did not return ok payload. stdout={result.stdout!r} stderr={result.stderr!r}"
    )
    yield {
        "room_id": room_id,
        "thread_id": payload["threadId"],
        "notification_id": payload["notificationId"],
    }


@pytest.fixture(scope="session")
def start_app(seeded_thread, xprocess):
    """Start the Next.js dev server and wait until port 3000 accepts connections."""

    class Starter(ProcessStarter):
        name = "next_app"
        args = ["npm", "run", "dev"]
        env = os.environ.copy()
        popen_kwargs = {"cwd": PROJECT_DIR, "text": True}
        timeout = 240
        terminate_on_interrupt = True

        def startup_check(self):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(("127.0.0.1", 3000)) != 0:
                    return False
            try:
                r = requests.get(APP_URL, timeout=5)
                return r.status_code < 500
            except Exception:
                return False

    xprocess.ensure(Starter.name, Starter)
    # Give Next.js an extra moment for the first page compile.
    time.sleep(3)
    yield
    info = xprocess.getinfo(Starter.name)
    info.terminate()


@pytest.fixture(scope="session")
def browser_verifier():
    return PochiVerifier()


def test_inbox_page_shows_unread_notification_and_supports_mark_all_as_read(
    start_app, seeded_thread, browser_verifier
):
    thread_id = seeded_thread["thread_id"]
    room_id = seeded_thread["room_id"]

    reason = (
        "The /inbox page must render the authenticated user's Liveblocks inbox "
        "notifications, including an unread badge backed by "
        "useUnreadInboxNotificationsCount, a 'Mark all as read' action backed by "
        "useMarkAllInboxNotificationsAsRead, and All/Unread tabs that filter the list."
    )
    truth = (
        f"1. Navigate to {APP_URL}/inbox and wait for either "
        f"[data-testid='notification-list'] or [data-testid='empty-state'] to be attached. "
        f"The page must contain the text 'Inbox'.\n"
        f"2. Read the integer text of the element matching [data-testid='unread-badge']. "
        f"It MUST parse as an integer and MUST be >= 1.\n"
        f"3. The element matching [data-testid='tab-all'] MUST have attribute data-active='true' "
        f"by default. The element matching [data-testid='notification-list'] MUST contain at "
        f"least one anchor (<a>) whose href ends with '/rooms/{room_id}#{thread_id}'.\n"
        f"4. Click [data-testid='tab-unread']. After the click, [data-testid='tab-unread'] MUST "
        f"have data-active='true' and [data-testid='tab-all'] MUST NOT have data-active='true'. "
        f"The anchor whose href ends with '/rooms/{room_id}#{thread_id}' MUST still be visible.\n"
        f"5. Click [data-testid='tab-all']. Then click [data-testid='mark-all-read']. Within 10 "
        f"seconds, [data-testid='unread-badge'] MUST display exactly '0'.\n"
        f"6. Click [data-testid='tab-unread']. Within 10 seconds, an element matching "
        f"[data-testid='empty-state'] MUST exist and its text MUST contain 'No notifications'. "
        f"No anchor whose href ends with '/rooms/{room_id}#{thread_id}' may remain in the list."
    )

    result = browser_verifier.verify(
        reason=reason,
        truth=truth,
        use_browser_agent=True,
        trajectory_dir="/logs/verifier/pochi/test_inbox_flow",
    )
    assert result.status == "pass", f"Browser verification failed: {result.reason}"


def test_all_notifications_marked_read_via_rest_api(start_app, seeded_thread):
    """Cross-check: after the UI marks everything read, the REST API must agree."""
    secret = _secret_key()
    url = f"https://api.liveblocks.io/v2/users/{USER_ID}/inbox-notifications"
    deadline = time.time() + 30
    last_payload = None
    while time.time() < deadline:
        r = requests.get(url, headers={"Authorization": f"Bearer {secret}"}, timeout=15)
        assert r.status_code == 200, (
            f"Liveblocks REST API returned {r.status_code}: {r.text}"
        )
        payload = r.json()
        last_payload = payload
        notifications = payload.get("data", []) or payload.get("inboxNotifications", [])
        if notifications and all(n.get("readAt") for n in notifications):
            return
        time.sleep(2)
    pytest.fail(
        f"Expected every inbox notification for {USER_ID} to have a non-null readAt after the UI "
        f"marked them as read. Last payload: {json.dumps(last_payload)[:1000]}"
    )
