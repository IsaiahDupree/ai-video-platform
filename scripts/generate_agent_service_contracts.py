#!/usr/bin/env python3
"""Generate a standalone repository service and contract guide."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[1]
CONFIG_PATH = REPO_ROOT / ".agent-contracts.json"
DEFAULT_OUTPUT = REPO_ROOT / "AGENT_SERVICE_CONTRACTS.md"

EXCLUDED_PARTS = {
    ".git",
    ".next",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "fixtures",
    "node_modules",
    "Pods",
    "test",
    "tests",
    "vendor",
    "venv",
}
SOURCE_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".swift"}
HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"}
WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
ENV_PATTERNS = [
    re.compile(r"os\.getenv\(\s*['\"]([A-Z][A-Z0-9_]*)['\"]"),
    re.compile(r"os\.environ(?:\.get)?\[?\(?\s*['\"]([A-Z][A-Z0-9_]*)['\"]"),
    re.compile(r"process\.env\.([A-Z][A-Z0-9_]*)"),
    re.compile(r"Deno\.env\.get\(\s*['\"]([A-Z][A-Z0-9_]*)['\"]"),
    re.compile(r"ProcessInfo\.processInfo\.environment\[\s*['\"]([A-Z][A-Z0-9_]*)['\"]"),
]


def ascii_text(value: Any, limit: int | None = None) -> str:
    text = str(value or "").translate(
        str.maketrans(
            {
                "\u2013": "-",
                "\u2014": "-",
                "\u2018": "'",
                "\u2019": "'",
                "\u201c": '"',
                "\u201d": '"',
                "\u2190": "<-",
                "\u2191": "^",
                "\u2192": "->",
                "\u2193": "v",
            }
        )
    )
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\s+", " ", text).strip()
    if limit and len(text) > limit:
        return text[: limit - 3].rstrip() + "..."
    return text


def md(value: Any, limit: int | None = None) -> str:
    return (ascii_text(value, limit) or "-").replace("|", "\\|").replace("`", "\\`")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def excluded(path: Path) -> bool:
    try:
        parts = path.relative_to(REPO_ROOT).parts
    except ValueError:
        return True
    if any(part in EXCLUDED_PARTS or part.startswith(".worktree") for part in parts):
        return True
    return path.name.startswith(("test_", "test-")) or path.name.endswith((".test.ts", ".test.js", ".spec.ts", ".spec.js"))


def iter_files(suffixes: set[str] | None = None) -> Iterable[Path]:
    for path in REPO_ROOT.rglob("*"):
        if not path.is_file() or excluded(path):
            continue
        if suffixes is not None and path.suffix.lower() not in suffixes:
            continue
        if path.stat().st_size > 2_000_000:
            continue
        yield path


def load_config() -> dict[str, Any]:
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if data.get("schema_version") != "1.0":
        raise ValueError(".agent-contracts.json must use schema_version 1.0")
    if not data.get("repository") or not data.get("purpose"):
        raise ValueError("repository and purpose are required")
    return data


def walk_refs(value: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "$ref" and isinstance(child, str):
                found.add(child)
            else:
                found.update(walk_refs(child))
    elif isinstance(value, list):
        for child in value:
            found.update(walk_refs(child))
    return found


def walk_join_keys(value: Any, prefix: str = "") -> set[str]:
    found: set[str] = set()
    if not isinstance(value, dict):
        return found
    properties = value.get("properties")
    if isinstance(properties, dict):
        for name, definition in properties.items():
            path = f"{prefix}.{name}" if prefix else name
            if name == "id" or name.endswith("_id"):
                found.add(path)
            found.update(walk_join_keys(definition, path))
    for key in ("$defs", "definitions"):
        children = value.get(key)
        if isinstance(children, dict):
            for name, child in children.items():
                found.update(walk_join_keys(child, f"{key}.{name}"))
    for key in ("allOf", "anyOf", "oneOf"):
        children = value.get(key)
        if isinstance(children, list):
            for index, child in enumerate(children):
                found.update(walk_join_keys(child, f"{key}[{index}]"))
    return found


def discover_contracts() -> list[dict[str, Any]]:
    paths = {
        path
        for path in iter_files()
        if path.name.endswith(".schema.json")
        or (
            "openapi" in path.name.lower()
            and path.suffix.lower() in {".json", ".yaml", ".yml"}
        )
    }
    contracts = []
    for path in sorted(paths):
        raw = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix.lower() == ".json":
            value = json.loads(raw)
            is_openapi = isinstance(value, dict) and "openapi" in value
            if is_openapi:
                paths_count = len(value.get("paths", {}))
                operations = sum(
                    1
                    for item in value.get("paths", {}).values()
                    if isinstance(item, dict)
                    for method in item
                    if method.upper() in HTTP_METHODS
                )
                title = value.get("info", {}).get("title", path.name)
                description = value.get("info", {}).get("description", "")
                required = []
                joins = walk_join_keys(value)
                refs = walk_refs(value)
                kind = "openapi"
            else:
                if not isinstance(value, dict):
                    raise ValueError(f"Contract root must be an object: {relative(path)}")
                title = value.get("title", path.stem)
                description = value.get("description", "")
                required = sorted(value.get("required", []))
                joins = walk_join_keys(value)
                refs = walk_refs(value)
                paths_count = 0
                operations = 0
                kind = "json_schema"
        else:
            title_match = re.search(r"(?ms)^info:\s*.*?^\s{2}title:\s*['\"]?([^\n'\"]+)", raw)
            title = title_match.group(1).strip() if title_match else path.name
            description = "OpenAPI YAML contract"
            paths_count = len(re.findall(r"(?m)^\s{2}/[^:]+:\s*$", raw))
            operations = len(re.findall(r"(?m)^\s{4}(get|post|put|patch|delete|options|head):\s*$", raw, re.I))
            required = []
            joins = set()
            refs = set(re.findall(r"\$ref:\s*['\"]?([^\s'\"]+)", raw))
            kind = "openapi"
        contracts.append(
            {
                "path": relative(path),
                "kind": kind,
                "title": ascii_text(title),
                "description": ascii_text(description, 220),
                "required": required,
                "join_keys": sorted(joins),
                "refs": sorted(refs),
                "path_count": paths_count,
                "operation_count": operations,
                "sha256": sha256(path),
            }
        )
    return contracts


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def next_route(path: Path, text: str) -> list[dict[str, str]]:
    parts = path.relative_to(REPO_ROOT).parts
    route_parts: tuple[str, ...] | None = None
    if "app" in parts and "api" in parts and path.stem == "route":
        api_index = parts.index("api")
        route_parts = parts[api_index + 1 : -1]
    elif "pages" in parts and "api" in parts:
        api_index = parts.index("api")
        route_parts = parts[api_index + 1 : -1] + (path.stem,)
    elif parts and parts[0] == "api":
        route_parts = parts[1:-1] + (path.stem,)
    if route_parts is None:
        return []
    clean = []
    for part in route_parts:
        if part in {"index", "route"}:
            continue
        if part.startswith("[[...") and part.endswith("]]"):
            part = "{" + part[5:-2] + "...}"
        elif part.startswith("[...") and part.endswith("]"):
            part = "{" + part[4:-1] + "...}"
        elif part.startswith("[") and part.endswith("]"):
            part = "{" + part[1:-1] + "}"
        clean.append(part)
    route_path = "/api" + ("/" + "/".join(clean) if clean else "")
    methods = set(
        match.group(1).upper()
        for match in re.finditer(
            r"export\s+(?:(?:async\s+)?function|const)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b",
            text,
        )
    )
    if not methods:
        methods = {"ANY"}
    return [
        {"method": method, "path": route_path, "source": relative(path), "line": 1}
        for method in sorted(methods)
    ]


def discover_routes() -> list[dict[str, Any]]:
    routes: dict[tuple[str, str, str, int], dict[str, Any]] = {}
    patterns = [
        re.compile(
            r"@(?:[A-Za-z_][\w]*\.)?(get|post|put|patch|delete|options|head)\(\s*[rubfRUBF]*['\"]([^'\"]+)['\"]"
        ),
        re.compile(
            r"\b(?:app|router|server|api)\.(get|post|put|patch|delete|options|head)\(\s*['\"]([^'\"]+)['\"]"
        ),
        re.compile(
            r"\b(?:app\.)?router\.add_(get|post|put|patch|delete|options|head)\(\s*['\"]([^'\"]+)['\"]"
        ),
        re.compile(
            r"\badd_api_route\(\s*['\"]([^'\"]+)['\"][^\n]*methods\s*=\s*\[\s*['\"](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)['\"]"
        ),
    ]
    for path in iter_files(SOURCE_SUFFIXES):
        text = path.read_text(encoding="utf-8", errors="replace")
        for route in next_route(path, text):
            key = (route["method"], route["path"], route["source"], route["line"])
            routes[key] = route
        for index, pattern in enumerate(patterns):
            for match in pattern.finditer(text):
                if index == 3:
                    route_path, method = match.group(1), match.group(2).upper()
                else:
                    method, route_path = match.group(1).upper(), match.group(2)
                if not route_path.startswith("/"):
                    continue
                route = {
                    "method": method,
                    "path": ascii_text(route_path),
                    "source": relative(path),
                    "line": line_number(text, match.start()),
                }
                key = (method, route["path"], route["source"], route["line"])
                routes[key] = route
    return sorted(routes.values(), key=lambda item: (item["path"], item["method"], item["source"], item["line"]))


def discover_models() -> list[dict[str, str]]:
    models: dict[tuple[str, str, str], dict[str, str]] = {}
    patterns = {
        "python-pydantic": re.compile(r"(?m)^class\s+([A-Za-z_][\w]*)\s*\([^\n]*(?:BaseModel|TypedDict)[^\n]*\)\s*:"),
        "typescript-interface": re.compile(r"(?m)^export\s+interface\s+([A-Za-z_][\w]*)\b"),
        "typescript-type": re.compile(r"(?m)^export\s+type\s+([A-Za-z_][\w]*)\s*="),
        "zod-schema": re.compile(r"(?m)^(?:export\s+)?const\s+([A-Za-z_][\w]*Schema)\s*=\s*z\."),
        "swift-codable": re.compile(r"(?m)^(?:public\s+)?struct\s+([A-Za-z_][\w]*)\s*:\s*[^\n]*(?:Codable|Decodable|Encodable)"),
    }
    for path in iter_files(SOURCE_SUFFIXES):
        text = path.read_text(encoding="utf-8", errors="replace")
        for kind, pattern in patterns.items():
            for match in pattern.finditer(text):
                item = {"name": match.group(1), "kind": kind, "source": relative(path)}
                models[(kind, item["name"], item["source"])] = item
    return sorted(models.values(), key=lambda item: (item["kind"], item["name"], item["source"]))


def discover_database_objects() -> list[dict[str, str]]:
    objects: dict[tuple[str, str, str], dict[str, str]] = {}
    pattern = re.compile(
        r"(?is)\bCREATE\s+(?:OR\s+REPLACE\s+)?(TABLE|VIEW|MATERIALIZED\s+VIEW|TYPE)\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_.\"-]+)"
    )
    for path in iter_files({".sql"}):
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in pattern.finditer(text):
            kind = " ".join(match.group(1).upper().split())
            name = match.group(2).strip('"')
            item = {"kind": kind, "name": name, "source": relative(path)}
            objects[(kind, name, item["source"])] = item
    return sorted(objects.values(), key=lambda item: (item["kind"], item["name"], item["source"]))


def discover_environment_names() -> list[str]:
    names: set[str] = set()
    for path in iter_files(SOURCE_SUFFIXES):
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in ENV_PATTERNS:
            names.update(pattern.findall(text))
    return sorted(names)


def discover_package_scripts() -> list[dict[str, Any]]:
    packages = []
    for path in iter_files({".json"}):
        if path.name != "package.json":
            continue
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        scripts = value.get("scripts", {})
        if isinstance(scripts, dict):
            packages.append(
                {
                    "path": relative(path),
                    "package": value.get("name", path.parent.name),
                    "scripts": sorted(scripts),
                }
            )
    return sorted(packages, key=lambda item: item["path"])


def source_fingerprint(groups: list[Iterable[dict[str, Any]]]) -> str:
    normalized = json.dumps(list(groups), sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(normalized.encode()).hexdigest()


def render(config: dict[str, Any]) -> str:
    contracts = discover_contracts()
    routes = discover_routes()
    models = discover_models()
    database_objects = discover_database_objects()
    environment_names = discover_environment_names()
    packages = discover_package_scripts()
    fingerprint = source_fingerprint([contracts, routes, models, database_objects, packages])

    route_methods = defaultdict(int)
    for route in routes:
        route_methods[route["method"]] += 1
    write_route_count = sum(1 for route in routes if route["method"] in WRITE_METHODS or route["method"] == "ANY")

    lines = [
        f"# {ascii_text(config['repository'])} Agent Service and Contract Guide",
        "",
        "> Repository-owned documentation. It does not require an external control plane.",
        "",
        ascii_text(config["purpose"]),
        "",
        "## Agent operating rules",
        "",
        "1. Read this guide before changing an API, queue, schema, provider adapter, database object, or cross-system payload.",
        "2. Treat JSON Schema and OpenAPI files as authoritative. Typed application models are implementation contracts unless explicitly exported.",
        "3. Do not guess route parameters, environment values, account IDs, provider IDs, or receipt fields.",
        "4. Read operations do not authorize writes. Provider writes, publishing, messages, paid compute, destructive controls, and migrations require their owning approval policy.",
        "5. Persist idempotency and provider/job receipts before retrying an accepted or ambiguous external write.",
        "6. Never place credential values in source, docs, fixtures, logs, generated artifacts, or receipts.",
        "",
        "## Inventory summary",
        "",
        f"- Static API routes: **{len(routes)}** ({write_route_count} potentially mutating)",
        f"- Formal JSON Schema/OpenAPI contracts: **{len(contracts)}**",
        f"- Typed application models: **{len(models)}**",
        f"- Database objects declared in migrations: **{len(database_objects)}**",
        f"- Environment-variable names: **{len(environment_names)}**",
        f"- Package manifests with scripts: **{len(packages)}**",
        f"- Source fingerprint: `{fingerprint}`",
        "",
        "This is a static source inventory, not a live health report. Dynamic routes and runtime registrations must be verified through the repository's own health/discovery interface.",
        "",
        "## Service entrypoints",
        "",
        "| Package | Manifest | Script names |",
        "|---|---|---|",
    ]
    if not packages:
        lines.append("| - | - | No package.json scripts discovered |")
    for package in packages:
        lines.append(
            f"| `{md(package['package'], 80)}` | [`{package['path']}`]({package['path']}) | {md(', '.join(package['scripts']), 240)} |"
        )

    lines.extend(
        [
            "",
            "## HTTP and API surface",
            "",
            "| Method | Route | Source | Write review |",
            "|---|---|---|---|",
        ]
    )
    if not routes:
        lines.append("| - | No static routes discovered | - | Inspect runtime registration |")
    for route in routes:
        review = "required" if route["method"] in WRITE_METHODS or route["method"] == "ANY" else "read"
        lines.append(
            f"| `{route['method']}` | `{md(route['path'], 180)}` | [`{route['source']}:{route['line']}`]({route['source']}#L{route['line']}) | `{review}` |"
        )

    lines.extend(
        [
            "",
            "## Formal file contracts",
            "",
            "| Contract | Kind | Required fields | Join fields | Hash |",
            "|---|---|---|---|---|",
        ]
    )
    if not contracts:
        lines.append("| - | None declared | - | - | Formal cross-system contract gap |")
    for contract in contracts:
        required = ", ".join(contract["required"]) or "-"
        joins = ", ".join(sorted({item.split(".")[-1] for item in contract["join_keys"]})) or "-"
        lines.append(
            f"| [`{md(contract['title'], 100)}`]({contract['path']})<br>`{contract['path']}` | `{contract['kind']}` | {md(required, 220)} | {md(joins, 180)} | `{contract['sha256'][:12]}` |"
        )

    lines.extend(
        [
            "",
            "## Typed application models",
            "",
            "| Model | Kind | Source |",
            "|---|---|---|",
        ]
    )
    if not models:
        lines.append("| - | No supported typed models discovered | - |")
    for model in models:
        lines.append(
            f"| `{model['name']}` | `{model['kind']}` | [`{model['source']}`]({model['source']}) |"
        )

    lines.extend(
        [
            "",
            "## Database contracts",
            "",
            "| Object | Kind | Migration/source |",
            "|---|---|---|",
        ]
    )
    if not database_objects:
        lines.append("| - | No SQL objects discovered | - |")
    for item in database_objects:
        lines.append(
            f"| `{md(item['name'], 120)}` | `{item['kind']}` | [`{item['source']}`]({item['source']}) |"
        )

    lines.extend(
        [
            "",
            "## Runtime configuration contract",
            "",
            "Only variable names are documented. Values belong in the repository's approved secret/configuration store.",
            "",
        ]
    )
    if environment_names:
        lines.append(", ".join(f"`{name}`" for name in environment_names))
    else:
        lines.append("No runtime environment-variable references were statically discovered.")

    lines.extend(
        [
            "",
            "## Validation and drift",
            "",
            "```bash",
            "python3 scripts/generate_agent_service_contracts.py --check",
            "```",
            "",
            "Regenerate this document after changing routes, schemas, typed models, migrations, package scripts, or runtime configuration names:",
            "",
            "```bash",
            "python3 scripts/generate_agent_service_contracts.py",
            "```",
            "",
            "The generator reads repository source only. It does not call providers, start services, execute routes, read credential values, publish content, or spend money.",
        ]
    )
    return "\n".join(lines) + "\n"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    content = render(load_config())
    if args.check:
        if not args.output.exists() or args.output.read_text(encoding="utf-8") != content:
            print(f"Contract documentation drift: {args.output}", file=sys.stderr)
            return 1
    else:
        args.output.write_text(content, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
