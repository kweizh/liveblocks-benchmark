import json
import os
import re
import shutil
import subprocess

PROJECT_DIR = "/home/user/myapp"


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Expected project directory at {PROJECT_DIR}."
    )


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json missing at {pkg_path}."


def test_package_json_declares_liveblocks_deps():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    for key in ("dependencies", "devDependencies"):
        deps.update(pkg.get(key) or {})
    for required in (
        "next",
        "react",
        "react-dom",
        "@liveblocks/react",
        "@liveblocks/react-ui",
        "@liveblocks/node",
        "@liveblocks/client",
    ):
        assert required in deps, (
            f"package.json must declare dependency '{required}'."
        )


def test_node_modules_preinstalled():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), "node_modules must be pre-installed in the image."
    for pkg in (
        "next",
        "@liveblocks/react",
        "@liveblocks/react-ui",
        "@liveblocks/node",
    ):
        assert os.path.isdir(os.path.join(nm, pkg)), (
            f"node_modules/{pkg} must be pre-installed."
        )


def test_inbox_page_skeleton_exists():
    inbox_path = os.path.join(PROJECT_DIR, "app", "inbox", "page.tsx")
    assert os.path.isfile(inbox_path), (
        f"Inbox page skeleton missing at {inbox_path}."
    )


def test_auth_route_exists():
    route_path = os.path.join(
        PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"
    )
    assert os.path.isfile(route_path), (
        f"Liveblocks auth route missing at {route_path}."
    )


def test_auth_route_identifies_user_1():
    route_path = os.path.join(
        PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"
    )
    with open(route_path) as f:
        content = f.read()
    assert "user-1" in content, (
        "Auth route stub must identify the request user as 'user-1'."
    )
    assert "identifyUser" in content, (
        "Auth route stub must use Liveblocks identifyUser."
    )


def test_providers_stub_exists():
    providers_path = os.path.join(PROJECT_DIR, "app", "Providers.tsx")
    assert os.path.isfile(providers_path), (
        f"Providers stub missing at {providers_path}."
    )


def test_inbox_page_not_yet_wired():
    """The starter inbox page must NOT yet call the Liveblocks inbox hooks.

    The agent's job is to wire them up; if they are already there, the
    initial state is not a real starting point.
    """
    inbox_path = os.path.join(PROJECT_DIR, "app", "inbox", "page.tsx")
    with open(inbox_path) as f:
        content = f.read()
    for forbidden in (
        "useInboxNotifications",
        "useUnreadInboxNotificationsCount",
        "useMarkAllInboxNotificationsAsRead",
        "InboxNotificationList",
    ):
        assert forbidden not in content, (
            f"Initial inbox page must NOT yet reference '{forbidden}'."
        )


def test_npx_can_invoke_next():
    """Sanity check that the Next.js CLI is reachable through the installed deps."""
    result = subprocess.run(
        ["node", "-e", "require.resolve('next/package.json')"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"Unable to resolve 'next' from {PROJECT_DIR}: {result.stderr}"
    )


def test_required_env_vars_present_in_dotenv_or_env():
    """Either the Docker env or a committed .env.local provides the Liveblocks keys.

    The harness will inject env vars at runtime; we only assert the names
    appear somewhere the dev server can read.
    """
    env_local = os.path.join(PROJECT_DIR, ".env.local")
    keys = ("LIVEBLOCKS_SECRET_KEY", "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY")
    env_local_contents = ""
    if os.path.isfile(env_local):
        with open(env_local) as f:
            env_local_contents = f.read()
    for key in keys:
        present_in_env = os.environ.get(key) is not None
        present_in_dotenv = re.search(rf"^{re.escape(key)}=", env_local_contents, re.M) is not None
        assert present_in_env or present_in_dotenv, (
            f"Environment variable {key} must be available to the Next.js app "
            f"either via the process environment or .env.local."
        )
