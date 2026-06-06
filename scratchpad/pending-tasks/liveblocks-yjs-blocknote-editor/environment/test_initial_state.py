import json
import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), f"package.json missing at {pkg}."


def test_package_json_has_required_deps():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    pkg = json.loads(_read(pkg_path))
    deps = {}
    deps.update(pkg.get("dependencies") or {})
    deps.update(pkg.get("devDependencies") or {})
    required = [
        "next",
        "react",
        "react-dom",
        "@blocknote/core",
        "@blocknote/react",
        "@blocknote/mantine",
        "yjs",
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/yjs",
    ]
    missing = [name for name in required if name not in deps]
    assert not missing, f"package.json is missing required dependencies: {missing}"


def test_node_modules_installed():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), "node_modules directory is missing (deps should be pre-installed)."
    for pkg in [
        "next",
        "react",
        "@blocknote/core",
        "@blocknote/react",
        "@blocknote/mantine",
        "yjs",
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/yjs",
    ]:
        assert os.path.isdir(os.path.join(nm, pkg)), f"Dependency not installed: node_modules/{pkg}"


def test_app_router_exists():
    app_dir = os.path.join(PROJECT_DIR, "app")
    assert os.path.isdir(app_dir), "Next.js `app/` directory is missing."


def test_editor_route_exists():
    editor_page = os.path.join(PROJECT_DIR, "app", "editor", "page.tsx")
    assert os.path.isfile(editor_page), f"Expected initial editor page at {editor_page}."


def test_initial_editor_uses_blocknote_without_collaboration():
    """The starter editor must scaffold BlockNote + BlockNoteView, but Liveblocks Yjs
    collaboration must NOT yet be wired (no Y.Doc / LiveblocksYjsProvider / awareness)."""
    # Search anywhere under app/ for the editor implementation.
    app_dir = os.path.join(PROJECT_DIR, "app")
    found_blocknote = False
    found_blocknote_view = False
    forbidden_hits = []
    forbidden_tokens = [
        "@liveblocks/yjs",
        "LiveblocksYjsProvider",
        "getYjsProviderForRoom",
        "from \"yjs\"",
        "from 'yjs'",
        "collaboration:",
        "doc.getXmlFragment",
    ]
    for root, _dirs, files in os.walk(app_dir):
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            content = _read(os.path.join(root, name))
            if "useCreateBlockNote" in content:
                found_blocknote = True
            if "BlockNoteView" in content:
                found_blocknote_view = True
            for tok in forbidden_tokens:
                if tok in content:
                    forbidden_hits.append((os.path.join(root, name), tok))
    assert found_blocknote, "Expected initial scaffold to use `useCreateBlockNote`."
    assert found_blocknote_view, "Expected initial scaffold to render `BlockNoteView`."
    assert not forbidden_hits, (
        "Initial scaffold must NOT yet wire Liveblocks Yjs collaboration. "
        f"Found forbidden tokens: {forbidden_hits}"
    )


def test_snapshots_route_not_yet_implemented():
    route_dir = os.path.join(PROJECT_DIR, "app", "api", "snapshots")
    # It is fine if the directory is absent; the executor will create it.
    if os.path.isdir(route_dir):
        for name in os.listdir(route_dir):
            assert not name.startswith("route."), (
                "Initial scaffold must NOT yet implement `app/api/snapshots/route.*`."
            )


def test_playwright_available_in_env():
    """Playwright (Python) and Chromium are installed in the verifier image."""
    result = subprocess.run(
        ["python3", "-c", "import playwright.sync_api; print('ok')"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"Playwright Python package not importable: {result.stderr}"


def test_liveblocks_env_vars_present():
    assert os.environ.get("LIVEBLOCKS_SECRET_KEY"), (
        "LIVEBLOCKS_SECRET_KEY env var must be present in the task environment."
    )
    assert os.environ.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"), (
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY env var must be present in the task environment."
    )
