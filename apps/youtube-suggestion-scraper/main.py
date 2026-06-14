import io
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DATA_FILE = Path(__file__).parent / "videos.json"

CHANNELS: list[dict] = [
    {
        "url": "https://www.youtube.com/channel/UC3UVENYr99HSHFi01lLMohg",
        "name": "TheKota",
    },
    {
        "url": "https://www.youtube.com/@viniproductionsofficial",
        "name": "Vini Productions",
    },
    {"url": "https://www.youtube.com/@wasthi", "name": "Wasthi"},
]


def date_3_months_ago() -> datetime:
    today = datetime.now()
    month = today.month - 3
    year = today.year
    if month <= 0:
        month += 12
        year -= 1
    try:
        return datetime(year, month, today.day)
    except ValueError:
        import calendar

        last_day = calendar.monthrange(year, month)[1]
        return datetime(year, month, last_day)


def load_existing() -> dict:
    if DATA_FILE.exists():
        with DATA_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"channels": {}, "last_updated": None}


def save(data: dict) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved to {DATA_FILE}")


def scrape_channel(channel_url: str, dateafter: str) -> list[dict]:
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dateafter",
        dateafter,
        "--dump-json",
        "--no-warnings",
        "--ignore-errors",
        f"{channel_url}/videos",
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT (120s) — skipping")
        return []

    if result.returncode != 0 and not result.stdout.strip():
        print(f"  ERROR: {result.stderr.strip() or 'unknown error'}")
        return []

    videos = []
    for line in result.stdout.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue

        video_id = item.get("id")
        if not video_id:
            continue

        videos.append(
            {
                "id": video_id,
                "title": item.get("title"),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "upload_date": item.get("upload_date", ""),
                "upload_date_display": _display_date(item.get("upload_date", "")),
                "duration": item.get("duration"),
                "view_count": item.get("view_count"),
                "like_count": item.get("like_count"),
                "comment_count": item.get("comment_count"),
                "thumbnail": item.get("thumbnail")
                or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            }
        )

    videos.sort(key=lambda v: v["upload_date"], reverse=True)
    return videos


def _display_date(ymd: str) -> str:
    if len(ymd) == 8:
        return f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:]}"
    return ymd


def merge(existing_videos: list[dict], new_videos: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {v["id"]: v for v in existing_videos}
    for v in new_videos:
        by_id[v["id"]] = v
    return sorted(by_id.values(), key=lambda v: v["upload_date"], reverse=True)


def summary(videos: list[dict]) -> None:
    if not videos:
        print("    (no videos)")
        return
    for v in videos[:5]:
        date = v.get("upload_date_display") or v["upload_date"]
        title = (v.get("title") or "?")[:60]
        print(f"    {date}  {title}")


def main() -> None:
    print("=" * 60)
    print("  YouTube Sri Lankan Comedy Video Scraper")
    print("=" * 60)

    cutoff = date_3_months_ago()
    dateafter = cutoff.strftime("%Y%m%d")
    print(f"  Looking back to: {cutoff.strftime('%Y-%m-%d')} (3 months)\n")

    data = load_existing()
    total = 0

    for ch in CHANNELS:
        name = ch["name"]
        url = ch["url"]
        print(f"[{name}]")
        print(f"  URL: {url}")

        new_vids = scrape_channel(url, dateafter)
        print(f"  Found: {len(new_vids)} video(s) since {cutoff.strftime('%Y-%m-%d')}")

        existing_vids = (data["channels"].get(name) or {}).get("videos", [])
        merged_vids = merge(existing_vids, new_vids)
        print(f"  Total: {len(merged_vids)} video(s) in DB")

        summary(merged_vids)

        data["channels"][name] = {
            "url": url,
            "name": name,
            "last_updated": datetime.now().isoformat(),
            "videos": merged_vids,
        }
        total += len(new_vids)
        print()

    data["last_updated"] = datetime.now().isoformat()
    save(data)
    print(f"\nDone — {total} new/updated video(s) across {len(CHANNELS)} channel(s).")


if __name__ == "__main__":
    main()
