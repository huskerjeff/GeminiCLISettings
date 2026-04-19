#!/usr/bin/env python3
"""YouTube search and caption scraper using yt-dlp. Outputs JSON to stdout."""

import sys
import json
import argparse
import tempfile
import os
import re

try:
    import yt_dlp
except ImportError:
    print(json.dumps({"error": "yt-dlp not installed. Run: pip install yt-dlp"}))
    sys.exit(1)


def _suppress_stdout():
    """Context manager to redirect stdout to stderr during yt-dlp calls."""
    import io
    old_stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        yield
    finally:
        sys.stdout = old_stdout


from contextlib import contextmanager
_suppress_stdout = contextmanager(_suppress_stdout)


class _StderrLogger:
    def debug(self, msg): sys.stderr.write(msg + "\n")
    def info(self, msg): sys.stderr.write(msg + "\n")
    def warning(self, msg): sys.stderr.write(msg + "\n")
    def error(self, msg): sys.stderr.write(msg + "\n")


def extract_captions(video_url: str) -> str:
    """Attempt to extract English captions from a video. Returns text or fallback message."""
    with tempfile.TemporaryDirectory() as tmpdir:
        subtitle_opts = {
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en"],
            "subtitlesformat": "vtt",
            "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "logtostderr": True,
            "logger": _StderrLogger(),
            "progress_hooks": [],
        }
        try:
            with _suppress_stdout():
                with yt_dlp.YoutubeDL(subtitle_opts) as ydl:
                    info = ydl.extract_info(video_url, download=True)

            # Look for downloaded .vtt file
            video_id = info.get("id", "")
            for fname in os.listdir(tmpdir):
                if fname.startswith(video_id) and fname.endswith(".vtt"):
                    vtt_path = os.path.join(tmpdir, fname)
                    with open(vtt_path, "r", encoding="utf-8") as f:
                        raw = f.read()
                    # Strip VTT markup and deduplicate lines
                    lines = raw.splitlines()
                    seen = set()
                    text_lines = []
                    for line in lines:
                        line = line.strip()
                        if (
                            not line
                            or "-->" in line
                            or line.startswith("WEBVTT")
                            or line.startswith("NOTE")
                            or re.match(r"^\d+$", line)
                        ):
                            continue
                        clean = re.sub(r"<[^>]+>", "", line).strip()
                        if clean and clean not in seen:
                            seen.add(clean)
                            text_lines.append(clean)
                    return " ".join(text_lines) if text_lines else "No captions available"
        except Exception:
            return "No captions available"
    return "No captions available"


def search_youtube(query: str, max_results: int = 5) -> list[dict]:
    """Search YouTube and extract metadata + captions for each result."""
    search_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "skip_download": True,
        "noprogress": True,
        "logger": _StderrLogger(),
        "progress_hooks": [],
    }

    search_url = f"ytsearch{max_results}:{query}"
    results = []

    with _suppress_stdout():
        with yt_dlp.YoutubeDL(search_opts) as ydl:
            try:
                info = ydl.extract_info(search_url, download=False)
                entries = info.get("entries", [])
            except Exception as e:
                return [{"error": f"Search failed: {str(e)}"}]

    for entry in entries:
        if not entry:
            continue

        video_id = entry.get("id") or entry.get("url", "")
        video_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else entry.get("url", "")

        video = {
            "title": entry.get("title", "Unknown"),
            "url": video_url,
            "channel": entry.get("uploader") or entry.get("channel", "Unknown"),
            "view_count": entry.get("view_count"),
            "upload_date": entry.get("upload_date"),
            "duration_seconds": entry.get("duration"),
            "captions": extract_captions(video_url) if video_url else "No captions available",
        }
        results.append(video)

    return results


def fetch_channel_videos(channel: str, max_results: int = 5, topic: str = None) -> list[dict]:
    """Fetch latest videos from a YouTube channel, skipping Shorts (<60s).

    Args:
        channel: Channel handle with or without '@' (e.g. '@VMware' or 'VMware').
        max_results: Number of videos to return after filtering.
        topic: Optional topic string to filter by title keywords.
    """
    handle = channel.lstrip("@")
    channel_url = f"https://www.youtube.com/@{handle}/videos"

    # Fetch extra entries to have enough after filtering Shorts and topic misses
    fetch_count = max_results * 4 if topic else max_results * 3
    fetch_count = min(max(fetch_count, 20), 200)

    fetch_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "skip_download": True,
        "noprogress": True,
        "playlistend": fetch_count,
        "logger": _StderrLogger(),
        "progress_hooks": [],
    }

    with _suppress_stdout():
        with yt_dlp.YoutubeDL(fetch_opts) as ydl:
            try:
                info = ydl.extract_info(channel_url, download=False)
                entries = info.get("entries", []) if info else []
            except Exception as e:
                return [{"error": f"Channel fetch failed: {str(e)}"}]

    topic_words = [w.lower() for w in topic.split()] if topic else []

    results = []
    for entry in entries:
        if not entry:
            continue

        duration = entry.get("duration")

        # Skip Shorts — videos under 60 seconds (only filter when duration is known)
        if duration is not None and duration < 60:
            continue

        # Topic filter: at least one keyword must appear in the title
        if topic_words:
            title_lower = entry.get("title", "").lower()
            if not any(word in title_lower for word in topic_words):
                continue

        video_id = entry.get("id") or entry.get("url", "")
        video_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else entry.get("url", "")

        video = {
            "title": entry.get("title", "Unknown"),
            "url": video_url,
            "channel": entry.get("uploader") or entry.get("channel", handle),
            "view_count": entry.get("view_count"),
            "upload_date": entry.get("upload_date"),
            "duration_seconds": duration,
            "captions": extract_captions(video_url) if video_url else "No captions available",
        }
        results.append(video)

        if len(results) >= max_results:
            break

    return results


def main():
    parser = argparse.ArgumentParser(description="YouTube search and caption scraper")
    parser.add_argument("query", nargs="?", default=None, help="Search query or topic filter (optional when --channel is used)")
    parser.add_argument("--max-results", "-n", type=int, default=5, help="Max number of results (default: 5)")
    parser.add_argument("--channel", "-c", default=None, help="YouTube channel handle, e.g. @VMware or VMware")
    args = parser.parse_args()

    if args.channel:
        results = fetch_channel_videos(args.channel, args.max_results, topic=args.query)
    elif args.query:
        results = search_youtube(args.query, args.max_results)
    else:
        print(json.dumps({"error": "Provide a query, --channel, or both. Example: yt_scraper.py --channel @VMware -n 10"}))
        sys.exit(1)

    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
