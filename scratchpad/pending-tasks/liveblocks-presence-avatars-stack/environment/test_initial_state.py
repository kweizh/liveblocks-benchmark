import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/project"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists_and_has_next():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"{pkg_path} does not exist."
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    assert "next" in deps, "Next.js must be listed in package.json dependencies."
    assert "@liveblocks/react" in deps, "@liveblocks/react must be listed in package.json dependencies."
    assert "@liveblocks/node" in deps, "@liveblocks/node must be listed in package.json dependencies."
    assert "@liveblocks/client" in deps, "@liveblocks/client must be listed in package.json dependencies."


def test_node_modules_preinstalled():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), "node_modules must be pre-installed in the project."
    assert os.path.isdir(os.path.join(nm, "next")), "next must be installed in node_modules."
    assert os.path.isdir(os.path.join(nm, "@liveblocks", "react")), "@liveblocks/react must be installed."
    assert os.path.isdir(os.path.join(nm, "@liveblocks", "node")), "@liveblocks/node must be installed."


def test_liveblocks_config_exists():
    p = os.path.join(PROJECT_DIR, "liveblocks.config.ts")
    assert os.path.isfile(p), "liveblocks.config.ts must already be present in the scaffold."


def test_room_provider_and_page_exist():
    page = os.path.join(PROJECT_DIR, "app", "page.tsx")
    assert os.path.isfile(page), "app/page.tsx must exist in the scaffold."
    room = os.path.join(PROJECT_DIR, "app", "Room.tsx")
    assert os.path.isfile(room), "app/Room.tsx must exist in the scaffold."
    # RoomProvider may live in either app/page.tsx or app/Room.tsx in the scaffold.
    contents = open(page).read() + "\n" + open(room).read()
    assert "RoomProvider" in contents, (
        "Either app/page.tsx or app/Room.tsx must wire up RoomProvider in the scaffold."
    )


def test_header_component_skeleton_exists():
    """The scaffold ships a Header component with a skeleton, but the avatar stack from useOthers is NOT yet implemented."""
    header = os.path.join(PROJECT_DIR, "app", "components", "Header.tsx")
    assert os.path.isfile(header), "app/components/Header.tsx must already exist in the scaffold."
    with open(header) as f:
        content = f.read()
    # The skeleton header must be present
    assert "<header" in content, "Header.tsx must render a <header> element in the skeleton."
    # The avatar stack must NOT be implemented yet
    assert "useOthers" not in content, (
        "Header.tsx must NOT yet use useOthers() in the initial state — "
        "implementing the avatar stack is the task."
    )
    assert "avatar-stack" not in content, (
        "Header.tsx must NOT yet contain the avatar-stack test id in the initial state — "
        "implementing the avatar stack is the task."
    )


def test_auth_route_exists_but_no_userinfo_yet():
    """The auth route exists and authenticates, but does NOT attach userInfo yet."""
    route_candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.tsx"),
    ]
    route = next((p for p in route_candidates if os.path.isfile(p)), None)
    assert route is not None, "app/api/liveblocks-auth/route.ts must exist in the scaffold."
    with open(route) as f:
        content = f.read()
    assert "identifyUser" in content, "Auth route must already use identifyUser in the scaffold."
    assert "userInfo" not in content, (
        "Auth route must NOT yet pass a userInfo object in the initial state — "
        "wiring userInfo (name, avatar, color) into identifyUser is part of the task."
    )


def test_mock_users_fixture_exists():
    fx = os.path.join(PROJECT_DIR, "app", "lib", "mock-users.ts")
    assert os.path.isfile(fx), "app/lib/mock-users.ts must ship with the scaffold (fixture of 6 mock users)."
    with open(fx) as f:
        content = f.read()
    # Sanity check: we expect at least 6 mock users for the verification scenario.
    assert content.count("userId") >= 6 or content.count("user-") >= 6, (
        "mock-users.ts must define at least 6 mock users for the presence test scenario."
    )


def test_env_vars_present():
    assert os.environ.get("LIVEBLOCKS_SECRET_KEY"), "LIVEBLOCKS_SECRET_KEY env var must be set in the environment."
    assert os.environ.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"), (
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY env var must be set in the environment."
    )


def test_playwright_chromium_available():
    """Playwright + Chromium must be pre-installed for the verifier."""
    assert shutil.which("playwright") is not None or shutil.which("npx") is not None, (
        "Either the playwright CLI or npx must be available."
    )
