"""Initial-state verification for the liveblocks-active-users-list task.

These tests confirm that the Next.js + Liveblocks scaffolding required by the
task is already in place BEFORE the executor begins work, and that the
presence-driven UI behaviour is NOT YET implemented.
"""

import json
import os
import shutil


PROJECT_DIR = "/home/user/project"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
APP_DIR = os.path.join(PROJECT_DIR, "app")
ACTIVE_USERS_DIR = os.path.join(APP_DIR, "active-users")
ACTIVE_USERS_PAGE = os.path.join(ACTIVE_USERS_DIR, "page.tsx")
AUTH_ROUTE = os.path.join(APP_DIR, "api", "liveblocks-auth", "route.ts")
LIVEBLOCKS_CONFIG = os.path.join(PROJECT_DIR, "liveblocks.config.ts")


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_package_json_exists():
    assert os.path.isfile(PACKAGE_JSON), (
        f"package.json not found at {PACKAGE_JSON}."
    )


def test_package_json_declares_liveblocks_dependencies():
    with open(PACKAGE_JSON) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies") or {})
    deps.update(pkg.get("devDependencies") or {})
    for required in (
        "next",
        "react",
        "react-dom",
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
    ):
        assert required in deps, (
            f"Expected {required} to be listed in package.json dependencies."
        )


def test_node_modules_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"Expected pre-installed node_modules at {node_modules}."
    )
    for pkg in (
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
        "next",
    ):
        assert os.path.isdir(os.path.join(node_modules, pkg)), (
            f"Expected {pkg} to be pre-installed under node_modules."
        )


def test_active_users_route_skeleton_exists():
    assert os.path.isdir(ACTIVE_USERS_DIR), (
        f"Expected active-users route directory at {ACTIVE_USERS_DIR}."
    )
    assert os.path.isfile(ACTIVE_USERS_PAGE), (
        f"Expected active-users page skeleton at {ACTIVE_USERS_PAGE}."
    )


def test_liveblocks_auth_route_exists():
    assert os.path.isfile(AUTH_ROUTE), (
        f"Expected Liveblocks auth route at {AUTH_ROUTE}."
    )


def test_liveblocks_config_skeleton_exists():
    assert os.path.isfile(LIVEBLOCKS_CONFIG), (
        f"Expected liveblocks.config.ts at {LIVEBLOCKS_CONFIG}."
    )


def test_active_users_dom_contract_not_yet_implemented():
    """The executor must add the active-users list, count, and presence wiring."""
    with open(ACTIVE_USERS_PAGE) as f:
        source = f.read()
    for marker in ('id="active-users"', 'id="active-users-count"',
                   'data-connection-id'):
        assert marker not in source, (
            f"Initial skeleton already contains '{marker}'. The DOM contract "
            "must be implemented by the executor."
        )
    assert "TODO" in source or "todo" in source.lower(), (
        "Expected the active-users skeleton to contain a TODO marker so the "
        "executor knows where to implement the presence-driven UI."
    )
