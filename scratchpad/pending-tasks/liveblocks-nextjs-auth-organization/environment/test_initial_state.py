"""Initial-state verification for the liveblocks-nextjs-auth-organization task.

These tests run *before* the executor begins. They confirm that the project
skeleton is in place, that dependencies are pre-installed, and that the
`/api/liveblocks-auth` route is still the unimplemented stub.
"""

import json
import os
import shutil
import subprocess

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project dir {PROJECT_DIR} does not exist."


def test_package_json_exists_and_declares_liveblocks_deps():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"{pkg_path} does not exist."
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    for required in ("next", "react", "react-dom", "@liveblocks/node", "@liveblocks/client", "@liveblocks/react"):
        assert required in deps, f"package.json must declare a dependency on '{required}'."


def test_node_modules_pre_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"{node_modules} does not exist. Dependencies must be pre-installed in the Docker image."
    )
    for pkg in ("next", "@liveblocks/node", "@liveblocks/client", "@liveblocks/react"):
        pkg_dir = os.path.join(node_modules, *pkg.split("/"))
        assert os.path.isdir(pkg_dir), f"Expected pre-installed dependency at {pkg_dir}."


def test_next_binary_available():
    next_bin = os.path.join(PROJECT_DIR, "node_modules", ".bin", "next")
    assert os.path.isfile(next_bin) or os.path.islink(next_bin), (
        f"Expected the Next.js CLI binary at {next_bin}."
    )


def test_next_config_present():
    candidates = [
        os.path.join(PROJECT_DIR, "next.config.js"),
        os.path.join(PROJECT_DIR, "next.config.mjs"),
        os.path.join(PROJECT_DIR, "next.config.ts"),
    ]
    assert any(os.path.isfile(c) for c in candidates), (
        "No next.config.{js,mjs,ts} file found in the project root."
    )


def test_app_router_layout_exists():
    layout = os.path.join(PROJECT_DIR, "app", "layout.tsx")
    assert os.path.isfile(layout), f"Expected the App Router root layout at {layout}."


def test_auth_route_handler_is_a_stub_returning_501():
    route_path = os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts")
    assert os.path.isfile(route_path), (
        f"Expected the auth route handler stub at {route_path}."
    )
    with open(route_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "501" in content, (
        "The auth route handler must start as an unimplemented stub returning HTTP 501."
    )
    assert "identifyUser" not in content, (
        "The auth route handler stub must not yet call liveblocks.identifyUser; "
        "implementing that is the executor's job."
    )


def test_room_page_stub_exists():
    page_path = os.path.join(PROJECT_DIR, "app", "rooms", "[roomId]", "page.tsx")
    assert os.path.isfile(page_path), (
        f"Expected the room page stub at {page_path}."
    )


def test_no_hardcoded_liveblocks_secret_in_source():
    """Ensure the skeleton never ships a hard-coded Liveblocks secret key."""
    for root, _dirs, files in os.walk(os.path.join(PROJECT_DIR, "app")):
        for name in files:
            path = os.path.join(root, name)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            assert "sk_dev_" not in content and "sk_prod_" not in content, (
                f"Hard-coded Liveblocks secret-looking string found in {path}."
            )


def test_next_cli_invokable():
    """Run `next --version` against the pre-installed binary to confirm it works."""
    next_bin = os.path.join(PROJECT_DIR, "node_modules", ".bin", "next")
    result = subprocess.run(
        [next_bin, "--version"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, (
        f"`next --version` failed (rc={result.returncode}). stdout={result.stdout!r} stderr={result.stderr!r}"
    )
    assert result.stdout.strip(), "`next --version` produced no output."


def test_required_env_vars_present():
    for var in ("LIVEBLOCKS_SECRET_KEY", "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"):
        value = os.environ.get(var)
        assert value, f"Environment variable {var} must be set for this task."
