import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
NODE_MODULES = os.path.join(PROJECT_DIR, "node_modules")
LIVEBLOCKS_CONFIG = os.path.join(PROJECT_DIR, "liveblocks.config.ts")


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    assert os.path.isfile(PACKAGE_JSON), f"{PACKAGE_JSON} does not exist."


def test_package_json_has_next_and_liveblocks():
    with open(PACKAGE_JSON) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    assert "next" in deps, "next is not declared as a dependency in package.json."
    assert "@liveblocks/client" in deps, (
        "@liveblocks/client is not declared as a dependency in package.json."
    )
    assert "@liveblocks/react" in deps, (
        "@liveblocks/react is not declared as a dependency in package.json."
    )


def test_package_json_has_dev_script():
    with open(PACKAGE_JSON) as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {}) or {}
    assert "dev" in scripts, "package.json is missing the 'dev' script."


def test_node_modules_installed():
    assert os.path.isdir(NODE_MODULES), (
        f"{NODE_MODULES} does not exist; dependencies must be pre-installed in the image."
    )
    assert os.path.isdir(os.path.join(NODE_MODULES, "next")), (
        "next is not installed under node_modules."
    )
    assert os.path.isdir(os.path.join(NODE_MODULES, "@liveblocks", "react")), (
        "@liveblocks/react is not installed under node_modules."
    )
    assert os.path.isdir(os.path.join(NODE_MODULES, "@liveblocks", "client")), (
        "@liveblocks/client is not installed under node_modules."
    )


def test_liveblocks_config_exists_with_storage_type():
    assert os.path.isfile(LIVEBLOCKS_CONFIG), (
        f"{LIVEBLOCKS_CONFIG} does not exist; the Liveblocks config skeleton must be present."
    )
    with open(LIVEBLOCKS_CONFIG) as f:
        content = f.read()
    assert "todos" in content, (
        "liveblocks.config.ts must declare a `todos` field on the Storage type."
    )
    assert "LiveList" in content, (
        "liveblocks.config.ts must reference LiveList in the Storage type."
    )
    assert "LiveObject" in content, (
        "liveblocks.config.ts must reference LiveObject in the Storage type."
    )


def _find_page_files():
    candidates = []
    for base in ("app", "src/app", "pages", "src/pages"):
        base_path = os.path.join(PROJECT_DIR, base)
        if not os.path.isdir(base_path):
            continue
        for root, _dirs, files in os.walk(base_path):
            for name in files:
                if name.startswith("page.") or name in {"index.tsx", "index.ts", "index.jsx", "index.js"}:
                    candidates.append(os.path.join(root, name))
    return candidates


def test_root_page_skeleton_exists():
    pages = _find_page_files()
    assert pages, (
        "Could not find a Next.js page entry file (app/page.* or pages/index.*) in the project."
    )


def test_root_layout_or_provider_present():
    """The skeleton must already wire up LiveblocksProvider / RoomProvider somewhere."""
    found = False
    for base in ("app", "src/app", "pages", "src/pages", "components", "src/components"):
        base_path = os.path.join(PROJECT_DIR, base)
        if not os.path.isdir(base_path):
            continue
        for root, _dirs, files in os.walk(base_path):
            for name in files:
                if not name.endswith((".tsx", ".ts", ".jsx", ".js")):
                    continue
                with open(os.path.join(root, name), errors="ignore") as f:
                    content = f.read()
                if "RoomProvider" in content or "LiveblocksProvider" in content:
                    found = True
                    break
            if found:
                break
        if found:
            break
    assert found, (
        "Skeleton must already include a RoomProvider/LiveblocksProvider so the executor only "
        "needs to implement the todo CRUD logic."
    )


def test_auth_endpoint_skeleton_exists():
    """An /api/liveblocks-auth route handler must exist so credentials are wired up."""
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.tsx"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.js"),
        os.path.join(PROJECT_DIR, "src", "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "pages", "api", "liveblocks-auth.ts"),
        os.path.join(PROJECT_DIR, "pages", "api", "liveblocks-auth.js"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        "Skeleton must include a Liveblocks auth route (e.g. app/api/liveblocks-auth/route.ts)."
    )


def test_todo_mutations_not_yet_implemented():
    """The skeleton must NOT already implement the todo CRUD mutations."""
    page_files = []
    for base in ("app", "src/app", "pages", "src/pages", "components", "src/components"):
        base_path = os.path.join(PROJECT_DIR, base)
        if not os.path.isdir(base_path):
            continue
        for root, _dirs, files in os.walk(base_path):
            for name in files:
                if name.endswith((".tsx", ".ts", ".jsx", ".js")):
                    page_files.append(os.path.join(root, name))

    assert page_files, "Expected at least one source file under app/, pages/, or components/."

    aggregated = ""
    for path in page_files:
        with open(path, errors="ignore") as f:
            aggregated += f.read() + "\n"

    # Must NOT yet implement the CRUD: there should be no use of LiveList.push / .delete /
    # useMutation calls that mutate `todos`.
    forbidden_markers = [
        "useMutation",
        ".push(",
        "LiveObject(",
    ]
    matches = [m for m in forbidden_markers if m in aggregated]
    assert not matches, (
        "Initial skeleton already implements todo mutations; expected the executor to add them. "
        f"Found markers: {matches}"
    )


def test_env_keys_referenced_or_documented():
    """The skeleton must reference (not hardcode) the required Liveblocks env keys."""
    found_secret = False
    found_public = False
    for root, _dirs, files in os.walk(PROJECT_DIR):
        # skip node_modules and .next to keep the scan fast
        parts = root.split(os.sep)
        if "node_modules" in parts or ".next" in parts:
            continue
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md", ".env", ".local")):
                continue
            try:
                with open(os.path.join(root, name), errors="ignore") as f:
                    content = f.read()
            except OSError:
                continue
            if "LIVEBLOCKS_SECRET_KEY" in content:
                found_secret = True
            if "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY" in content:
                found_public = True
            if found_secret and found_public:
                break
        if found_secret and found_public:
            break
    assert found_secret, (
        "Skeleton must reference the LIVEBLOCKS_SECRET_KEY env var somewhere (e.g. the auth route)."
    )
    assert found_public, (
        "Skeleton must reference the NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY env var somewhere "
        "(e.g. the LiveblocksProvider configuration)."
    )
