---
name: youtube-search
description: Search YouTube and extract video metadata and captions using yt-dlp. Use when the user wants to search YouTube, find video transcripts, research topics via YouTube, or feed video content into other tools like NotebookLM.
---

<objective>
Search YouTube for videos matching a query, browse a channel's latest videos, or filter a channel by topic. Extracts metadata (title, URL, channel, views, date, duration) and English captions/transcripts, and returns structured JSON for further use. Shorts (videos under 60 seconds) are automatically skipped in channel mode.
</objective>

<quick_start>
Three modes — pick the one that fits:

**Search mode** (topic search across all of YouTube):
```bash
python "C:/Users/jeffkit/.claude/skills/youtube-search/scripts/yt_scraper.py" "QUERY" --max-results 5
```

**Channel mode** (latest N videos from a specific channel, no Shorts):
```bash
python "C:/Users/jeffkit/.claude/skills/youtube-search/scripts/yt_scraper.py" --channel @ChannelName --max-results 10
```

**Channel + topic mode** (topic-filtered videos from a channel, newest first, no Shorts):
```bash
python "C:/Users/jeffkit/.claude/skills/youtube-search/scripts/yt_scraper.py" "topic keywords" --channel @ChannelName --max-results 10
```

Parse the JSON output and present results to the user in a readable format.
</quick_start>

<process>

**Step 1: Determine mode and parameters**

From the user's request, determine:
- `query` — search string or topic filter keywords (optional in channel mode)
- `channel` — channel handle with or without `@` (e.g. `@VMware` or `VMware`)
- `max_results` — number of videos to return (default 5)

| User asks for | Mode |
|---------------|------|
| Topic only | Search mode: `"query" -n N` |
| Channel only (`@Handle N videos`) | Channel mode: `--channel @Handle -n N` |
| Topic from a channel | Channel+topic mode: `"topic" --channel @Handle -n N` |

**Step 2: Run the script**

```bash
python "C:/Users/jeffkit/.claude/skills/youtube-search/scripts/yt_scraper.py" [query] [--channel @Handle] --max-results N
```

The script outputs a JSON array to stdout. Each item contains:
- `title` — video title
- `url` — full YouTube URL
- `channel` — channel name
- `view_count` — integer or null
- `upload_date` — YYYYMMDD string or null
- `duration_seconds` — integer or null (videos <60s are skipped in channel modes)
- `captions` — English transcript text or "No captions available"

**Channel mode behavior:**
- Pulls videos from `https://www.youtube.com/@Handle/videos` (newest first)
- Automatically skips videos under 60 seconds (Shorts)
- Fetches extra entries internally to account for filtered videos
- Topic filter matches any keyword against the video title (case-insensitive)

**Step 3: Present results**

Format the results for the user. For each video, show title, channel, URL, upload date, and a caption summary if available. If the user wants to use results in NotebookLM or another tool, offer to save the JSON to a file.

**Step 4: Handle errors**

If a video shows `"No captions available"`, note it but continue. If the script itself errors, check that yt-dlp is installed (`pip install yt-dlp`) and that the channel handle is correct.

</process>

<success_criteria>
- Script runs without crashing
- JSON output contains metadata for each result
- Shorts (<60s) excluded in channel modes
- Results sorted newest first in channel modes
- Captions extracted where available; graceful fallback where not
- Results presented clearly to the user
</success_criteria>

<setup>
**First-time setup:**

```bash
pip install yt-dlp
```

No API key required. yt-dlp scrapes YouTube directly.

**Script location:** `C:/Users/jeffkit/.claude/skills/youtube-search/scripts/yt_scraper.py`
</setup>
