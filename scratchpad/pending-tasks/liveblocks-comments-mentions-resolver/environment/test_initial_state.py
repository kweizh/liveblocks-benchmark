import json
import os
import re
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def _read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists_and_declares_liveblocks_deps():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"{pkg_path} does not exist."
    pkg = json.loads(_read(pkg_path))
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    for required in [
        "next",
        "react",
        "react-dom",
        "@liveblocks/client",
        "@liveblocks/node",
        "@liveblocks/react",
        "@liveblocks/react-ui",
    ]:
        assert required in deps, (
            f"Expected dependency '{required}' to be declared in package.json."
        )


def test_node_modules_preinstalled():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), (
        "node_modules should be pre-installed by the Dockerfile so the dev server "
        "can start without a fresh npm install."
    )
    for pkg_dir in [
        "next",
        "react",
        "@liveblocks/client",
        "@liveblocks/node",
        "@liveblocks/react",
        "@liveblocks/react-ui",
    ]:
        assert os.path.isdir(os.path.join(nm, pkg_dir)), (
            f"node_modules/{pkg_dir} is missing - dependencies were not pre-installed."
        )


def test_users_api_route_exists():
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "users", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "users", "route.tsx"),
        os.path.join(PROJECT_DIR, "app", "api", "users", "route.js"),
    ]
    assert any(os.path.isfile(c) for c in candidates), (
        "Expected the /api/users route file under app/api/users/route.{ts,tsx,js}."
    )
    # Search the whole app/ subtree (route may delegate to a shared users.ts module).
    combined = ""
    for root, _dirs, files in os.walk(os.path.join(PROJECT_DIR, "app")):
        for fn in files:
            if fn.endswith((".ts", ".tsx", ".js", ".jsx")):
                try:
                    combined += _read(os.path.join(root, fn)) + "\n"
                except (OSError, UnicodeDecodeError):
                    continue
    for uid in ["user-alice", "user-bob", "user-charlie", "user-dave", "user-eve"]:
        assert uid in combined, (
            f"Expected the scaffold's user directory (e.g. /api/users or a shared "
            f"module) to declare the hardcoded user id '{uid}'."
        )
    for name in ["Alice", "Bob", "Charlie", "Dave", "Eve"]:
        assert name in combined, (
            f"Expected the scaffold's user directory to declare the hardcoded user name '{name}'."
        )


def test_liveblocks_auth_route_exists_and_uses_identify_user():
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.tsx"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.js"),
    ]
    found = None
    for c in candidates:
        if os.path.isfile(c):
            found = c
            break
    assert found is not None, (
        "Expected the /api/liveblocks-auth route under app/api/liveblocks-auth/route.{ts,tsx,js}."
    )
    content = _read(found)
    assert "identifyUser" in content, (
        "Auth route must call `Liveblocks.identifyUser` (ID tokens)."
    )
    assert "@liveblocks/node" in content, (
        "Auth route must import from `@liveblocks/node`."
    )


def test_liveblocks_provider_wrapper_exists():
    # Some sort of provider wrapper file with LiveblocksProvider + RoomProvider must exist.
    found_provider = False
    for root, _dirs, files in os.walk(os.path.join(PROJECT_DIR, "app")):
        for fn in files:
            if not fn.endswith((".tsx", ".ts", ".jsx", ".js")):
                continue
            text = _read(os.path.join(root, fn))
            if "LiveblocksProvider" in text and "RoomProvider" in text:
                found_provider = True
                break
        if found_provider:
            break
    assert found_provider, (
        "Expected a file under app/ that wraps the tree with both "
        "`LiveblocksProvider` and `RoomProvider`."
    )


def test_composer_rendered_on_page():
    # The scaffold must already render <Composer /> from @liveblocks/react-ui.
    found_composer = False
    for root, _dirs, files in os.walk(os.path.join(PROJECT_DIR, "app")):
        for fn in files:
            if not fn.endswith((".tsx", ".jsx")):
                continue
            text = _read(os.path.join(root, fn))
            if "@liveblocks/react-ui" in text and re.search(r"<\s*Composer\b", text):
                found_composer = True
                break
        if found_composer:
            break
    assert found_composer, (
        "Expected the scaffold to render `<Composer />` from `@liveblocks/react-ui` on a page under app/."
    )


def test_resolve_mention_suggestions_not_implemented_yet():
    # The executor must add this. It should NOT exist in the scaffold.
    matches = []
    for root, _dirs, files in os.walk(PROJECT_DIR):
        if "node_modules" in root or "/.next" in root or root.endswith("/.next"):
            continue
        for fn in files:
            if not fn.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            path = os.path.join(root, fn)
            try:
                text = _read(path)
            except (OSError, UnicodeDecodeError):
                continue
            if "resolveMentionSuggestions" in text:
                matches.append(path)
    assert not matches, (
        "Initial state should NOT yet wire `resolveMentionSuggestions` (found in "
        f"{matches}). The executor is expected to implement it."
    )


def test_resolve_users_not_implemented_yet():
    matches = []
    for root, _dirs, files in os.walk(PROJECT_DIR):
        if "node_modules" in root or "/.next" in root or root.endswith("/.next"):
            continue
        for fn in files:
            if not fn.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            path = os.path.join(root, fn)
            try:
                text = _read(path)
            except (OSError, UnicodeDecodeError):
                continue
            if "resolveUsers" in text:
                matches.append(path)
    assert not matches, (
        "Initial state should NOT yet wire `resolveUsers` (found in "
        f"{matches}). The executor is expected to implement it."
    )


def test_liveblocks_env_vars_present():
    assert os.environ.get("LIVEBLOCKS_SECRET_KEY"), (
        "LIVEBLOCKS_SECRET_KEY must be set in the environment."
    )
    assert os.environ.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"), (
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY must be set in the environment."
    )


def test_zealt_run_id_present():
    run_id = os.environ.get("ZEALT_RUN_ID", "")
    assert run_id, "ZEALT_RUN_ID must be set in the environment."
    assert re.fullmatch(r"zr-[a-z0-9]+", run_id), (
        f"ZEALT_RUN_ID '{run_id}' must match 'zr-[a-z0-9]+'."
    )


def test_playwright_chromium_installed():
    # The Dockerfile must pre-install Playwright Chromium for verification.
    assert shutil.which("npx") is not None, "npx must be available."
    # Best-effort: ensure the Playwright browsers cache exists.
    cache_root = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/ms-playwright")
    assert os.path.isdir(cache_root), (
        f"Playwright browser cache '{cache_root}' should exist (Chromium pre-installed)."
    )
    # At least one chromium directory must exist under the cache root.
    has_chromium = any(
        name.startswith("chromium") for name in os.listdir(cache_root)
    )
    assert has_chromium, (
        f"No 'chromium*' directory found under {cache_root}; Playwright Chromium not installed."
    )
