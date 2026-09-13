#!/usr/bin/env python3
"""Submit and download the approved MiniMax-H3 v4 dialogue clips.

The script reuses the current Chrome login, never prints cookie values, writes
request IDs to a resumable manifest, and limits active jobs to three.
"""

from __future__ import annotations

import base64
import importlib.util
import json
import mimetypes
import os
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any


PROJECT = Path(__file__).resolve().parents[1]
PUBLIC = PROJECT / "public"
V4_DIR = PUBLIC / "video-demo" / "v4"
PLAN_PATH = V4_DIR / "dialogue-regeneration-plan-v4.json"
MANIFEST_PATH = V4_DIR / "generation-manifest-v4.json"
COOKIE_HELPER = Path("/Users/jolin/.codex/skills/generate-xdf-avatar-audio/scripts/generate_audio.py")
CHROME_PROFILE = Path.home() / "Library/Application Support/Google/Chrome/Default"
CREATE_URL = "https://aigc.xdf.cn/drawing/api/video/v2"
STATUS_URL = "https://aigc.xdf.cn/drawing/api/video/{req_id}"
REFERER = "https://aigc.xdf.cn/video/index"
MAX_ACTIVE = 3
POLL_SECONDS = 20
POLL_TIMEOUT_SECONDS = 45 * 60


def load_cookie_helper():
    spec = importlib.util.spec_from_file_location("xdf_cookie_helper", COOKIE_HELPER)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load the Chrome cookie helper")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_cookie_header() -> str:
    helper = load_cookie_helper()
    cookies = helper.read_chrome_cookies(CHROME_PROFILE)
    # HTTP cookie headers are latin-1. The AIGC API auth cookies are ASCII; omit
    # display-name cookies that contain Chinese characters.
    values = [f"{name}={value}" for name, value in cookies.items() if value and value.isascii()]
    if not values:
        raise RuntimeError("No usable XDF login cookies were found")
    return "; ".join(values)


def api_json(
    url: str,
    cookie_header: str,
    payload: dict[str, Any] | None = None,
    allowed_codes: tuple[int, ...] = (0,),
) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        method="POST" if body is not None else "GET",
        headers={
            "Cookie": cookie_header,
            "Content-Type": "application/json",
            "Referer": REFERER,
            "Origin": "https://aigc.xdf.cn",
            "User-Agent": "Mozilla/5.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        error_text = exc.read().decode("utf-8", "replace")[:500]
        raise RuntimeError(f"AIGC API HTTP {exc.code}: {error_text}") from exc
    if result.get("code") not in allowed_codes:
        raise RuntimeError(f"AIGC API rejected request: code={result.get('code')} message={result.get('message')}")
    return result


def reference_data_url(reference: str) -> str:
    if not reference.startswith("/video-demo/"):
        raise ValueError(f"Unexpected reference path: {reference}")
    path = PUBLIC / reference.lstrip("/")
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise


def load_or_create_manifest(plan: dict[str, Any]) -> dict[str, Any]:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        "version": "4.0",
        "model": plan["model"],
        "resolution": plan["resolution"],
        "submitted_at": None,
        "completed_at": None,
        "estimated_generation_seconds": plan["estimated_generation_seconds"],
        "estimated_generation_cost_cny": plan["estimated_generation_cost_cny"],
        "status": "prepared",
        "tasks": [
            {
                "id": task["id"],
                "duration": task["duration"],
                "reference": task["reference"],
                "req_id": None,
                "status": "prepared",
            }
            for task in plan["tasks"]
        ],
    }


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": REFERER})
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = destination.with_suffix(destination.suffix + ".part")
    with urllib.request.urlopen(request, timeout=180) as response, temp.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    os.replace(temp, destination)


def main() -> int:
    plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    manifest = load_or_create_manifest(plan)
    cookie_header = build_cookie_header()
    lock = threading.Lock()
    manifest_tasks = {task["id"]: task for task in manifest["tasks"]}

    def persist() -> None:
        with lock:
            atomic_write_json(MANIFEST_PATH, manifest)

    def submit(task: dict[str, Any]) -> tuple[str, int]:
        item = manifest_tasks[task["id"]]
        if item.get("req_id"):
            return task["id"], int(item["req_id"])
        payload = {
            "picture": reference_data_url(task["reference"]),
            "description": task["prompt"],
            "incantations": "",
            "promptOptimizer": bool(plan.get("promptOptimizer", False)),
            "model": plan["model"],
            "resolution": plan["resolution"],
            "duration": int(task["duration"]),
        }
        result = api_json(CREATE_URL, cookie_header, payload)
        req_id = result.get("data", {}).get("reqId")
        if not req_id:
            raise RuntimeError(f"Task {task['id']} returned no reqId")
        with lock:
            item["req_id"] = int(req_id)
            item["status"] = "submitted"
            item["submitted_at"] = datetime.now().astimezone().isoformat(timespec="seconds")
            if manifest.get("submitted_at") is None:
                manifest["submitted_at"] = item["submitted_at"]
            manifest["status"] = "generating"
            atomic_write_json(MANIFEST_PATH, manifest)
        print(f"SUBMITTED {task['id']} req={req_id}", flush=True)
        return task["id"], int(req_id)

    pending_submit = [task for task in plan["tasks"] if not manifest_tasks[task["id"]].get("req_id")]
    deadline = time.monotonic() + POLL_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        active = [
            item for item in manifest["tasks"]
            if item.get("req_id") and item.get("status") != "downloaded"
        ]
        while pending_submit and len(active) < MAX_ACTIVE:
            task = pending_submit.pop(0)
            submit(task)
            active.append(manifest_tasks[task["id"]])

        unfinished = [item for item in manifest["tasks"] if item.get("status") != "downloaded"]
        if not unfinished:
            manifest["status"] = "downloaded"
            manifest["completed_at"] = datetime.now().astimezone().isoformat(timespec="seconds")
            persist()
            print("ALL_DOWNLOADED", flush=True)
            return 0

        progress_changed = False
        for item in active:
            result = api_json(
                STATUS_URL.format(req_id=item["req_id"]),
                cookie_header,
                allowed_codes=(0, 5),
            )
            if result.get("code") == 5:
                continue
            pictures = result.get("data", {}).get("pictures") or []
            if not pictures:
                if item.get("status") != "generating":
                    item["status"] = "generating"
                    progress_changed = True
                continue
            picture = pictures[0]
            output = V4_DIR / f"{item['id']}-h3-768p-v4.mp4"
            poster = V4_DIR / f"{item['id']}-poster-v4.jpg"
            if not output.exists():
                download(picture["url"], output)
            if picture.get("coverUrl") and not poster.exists():
                download(picture["coverUrl"], poster)
            item.update(
                {
                    "status": "downloaded",
                    "output_asset": f"/video-demo/v4/{output.name}",
                    "poster_asset": f"/video-demo/v4/{poster.name}" if poster.exists() else None,
                    "result_id": picture.get("resultId"),
                    "inspection_pass": picture.get("inspectionPass"),
                }
            )
            progress_changed = True
            print(f"DOWNLOADED {item['id']}", flush=True)
        if progress_changed:
            persist()
        remaining = sum(1 for item in manifest["tasks"] if item.get("status") != "downloaded")
        print(f"WAITING remaining={remaining}", flush=True)
        time.sleep(POLL_SECONDS)

    manifest["status"] = "poll_timeout"
    persist()
    print("POLL_TIMEOUT", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
