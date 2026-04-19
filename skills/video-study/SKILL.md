---
name: video-study
description: Takes a YouTube URL, creates a NotebookLM notebook, generates a full set of study materials (briefing report, infographic, blog post, mind map), and saves everything to a Learning/ folder named after the video. Add "for Ethan" to also generate a lesson plan via claude.ai.
---

<objective>
Turn a single YouTube video into a complete set of study materials: NotebookLM notebook, overview chat, briefing report, infographic, blog post, and mind map — all saved to a dedicated folder in Learning/. If "for Ethan" is specified, also generate a lesson plan via claude.ai using the mind map.
</objective>

<quick_start>
Auth check → create blank notebook → add source → wait → get notebook title → create Learning folder → overview chat → generate 4 artifacts → wait & download → (Ethan: upload mind map to claude.ai → generate lesson plan → download DOCX)
</quick_start>

<inputs>
- `URL` — YouTube URL (required)
- `ETHAN_MODE` — set to true if user says "for Ethan", "it is for Ethan", or passes `--ethan`
- `LEARNING_DIR` — `C:\Users\huske\OneDrive\ClaudeCode_Life\Learning`
</inputs>

<process>

---

## STEP 1 — AUTH CHECK

```bash
notebooklm auth check --json
```

If auth fails, stop and tell the user to run `notebooklm login` first.

---

## STEP 2 — CREATE BLANK NOTEBOOK

```bash
notebooklm create "" --json
```

Parse and store `NOTEBOOK_ID`.

---

## STEP 3 — ADD SOURCE

```bash
notebooklm source add "<URL>" --notebook <NOTEBOOK_ID> --json
```

Parse and store:
- `SOURCE_ID` — from `source.id`
- `VIDEO_TITLE` — from `source.title` (used as fallback only)

Print:
```
📹 Video: <VIDEO_TITLE>
📓 Notebook ID: <NOTEBOOK_ID>
```

---

## STEP 4 — WAIT FOR SOURCE PROCESSING

```bash
PYTHONUTF8=1 notebooklm source wait <SOURCE_ID> --notebook <NOTEBOOK_ID> --timeout 120
```

After processing, NotebookLM auto-assigns a meaningful notebook title.

---

## STEP 5 — GET NOTEBOOK TITLE

```bash
notebooklm list --json
```

Find the entry matching `NOTEBOOK_ID`. Store as `NOTEBOOK_TITLE`.

---

## STEP 6 — CHECK IF FOLDER ALREADY EXISTS

Sanitize `NOTEBOOK_TITLE` for use as a folder name (replace `: / \ * ? " < > |` with `-`). Store as `FOLDER_NAME`.

Check if `<LEARNING_DIR>\<FOLDER_NAME>\` already exists:

```bash
python -c "import os; print(os.path.exists(r'C:\Users\huske\OneDrive\ClaudeCode_Life\Learning\<FOLDER_NAME>'))"
```

If the folder **already exists**, warn the user:
```
⚠️ A study folder already exists for this video:
   Learning\<FOLDER_NAME>\
   NotebookLM notebook <NOTEBOOK_ID> was created but not populated.
   Run `notebooklm delete --notebook <NOTEBOOK_ID>` to clean it up.
```
Then stop.

---

## STEP 7 — CREATE LEARNING FOLDER

```bash
python -c "import os; os.makedirs(r'C:\Users\huske\OneDrive\ClaudeCode_Life\Learning\<FOLDER_NAME>', exist_ok=True)"
```

Store `OUTPUT_DIR` = `C:\Users\huske\OneDrive\ClaudeCode_Life\Learning\<FOLDER_NAME>`.

Print:
```
📁 Created: Learning\<FOLDER_NAME>\
```

---

## STEP 8 — OVERVIEW CHAT + SAVE AS NOTE

```bash
PYTHONUTF8=1 notebooklm ask "Give me a comprehensive overview of this video: what is the main topic, who is presenting, what are the key points covered, and what are the most important takeaways?" --notebook <NOTEBOOK_ID>
```

Display the answer as a **Video Overview**.

Save the conversation as a note:
```bash
PYTHONUTF8=1 notebooklm history --save --note-title "Video Overview: <VIDEO_TITLE>" --notebook <NOTEBOOK_ID>
```

---

## STEP 9 — GENERATE ALL ARTIFACTS

Kick off all four in sequence:

**Briefing Report:**
```bash
PYTHONUTF8=1 notebooklm generate report --format briefing-doc --notebook <NOTEBOOK_ID> --json
```
Store `BRIEFING_ID`.

**Infographic:**
```bash
PYTHONUTF8=1 notebooklm generate infographic --notebook <NOTEBOOK_ID> --orientation landscape --detail standard --json
```
Store `INFOGRAPHIC_ID`.

**Blog Post:**
```bash
PYTHONUTF8=1 notebooklm generate report --format blog-post --notebook <NOTEBOOK_ID> --json
```
Store `BLOG_ID`.

**Mind Map** (instant — no wait needed):
```bash
PYTHONUTF8=1 notebooklm generate mind-map --notebook <NOTEBOOK_ID> --json
```
Store `MINDMAP_ID` from `mind_map` response (use `note_id` field if no `task_id`).

Print:
```
⚙️ Generating: briefing report, infographic, blog post, mind map...
```

---

## STEP 10 — WAIT FOR ARTIFACTS

Wait for the three async artifacts:

```bash
PYTHONUTF8=1 notebooklm artifact wait <BRIEFING_ID> --notebook <NOTEBOOK_ID> --timeout 900
PYTHONUTF8=1 notebooklm artifact wait <INFOGRAPHIC_ID> --notebook <NOTEBOOK_ID> --timeout 900
PYTHONUTF8=1 notebooklm artifact wait <BLOG_ID> --notebook <NOTEBOOK_ID> --timeout 900
```

---

## STEP 11 — DOWNLOAD ALL ARTIFACTS

Build a `SLUG` = lowercase-hyphenated version of `FOLDER_NAME` (truncated to 40 chars).

```bash
PYTHONUTF8=1 notebooklm download report "<OUTPUT_DIR>\<SLUG>-briefing.md" --artifact <BRIEFING_ID> --notebook <NOTEBOOK_ID>
PYTHONUTF8=1 notebooklm download infographic "<OUTPUT_DIR>\<SLUG>-infographic.png" --artifact <INFOGRAPHIC_ID> --notebook <NOTEBOOK_ID>
PYTHONUTF8=1 notebooklm download report "<OUTPUT_DIR>\<SLUG>-blog.md" --artifact <BLOG_ID> --notebook <NOTEBOOK_ID>
PYTHONUTF8=1 notebooklm download mind-map "<OUTPUT_DIR>\<SLUG>-mindmap.json" --artifact <MINDMAP_ID> --notebook <NOTEBOOK_ID>
```

---

## STEP 12 — ETHAN LESSON PLAN (only if ETHAN_MODE = true)

If the user said "for Ethan" or `--ethan`, generate a lesson plan from the mind map using claude.ai via playwright-cli.

**Open claude.ai:**
```bash
playwright-cli open --browser=chrome --persistent --headed https://claude.ai/new
```

**Upload the mind map:**
```bash
playwright-cli click "getByRole('button', { name: 'Add files, connectors, and more' })"
playwright-cli click "getByRole('menuitem', { name: 'Add files or photos' })"
playwright-cli upload "<OUTPUT_DIR>\<SLUG>-mindmap.json"
```

**Fill prompt and submit** (each as a SEPARATE Bash call — never chain with &&):
```bash
playwright-cli fill "getByRole('textbox', { name: 'Write your prompt to Claude' })" "create a detailed lesson plan from this mind map"
playwright-cli press Enter
```

**Wait for response** — take a snapshot after ~30 seconds to check if generation is complete:
```bash
playwright-cli snapshot
```

Look for a Download button on a DOCX artifact. When visible, click it:
```bash
playwright-cli click "getByRole('button', { name: 'Download' })"
```

The DOCX will download to `.playwright-cli\`. Move the most recently created DOCX to the output folder:
```bash
python -c "import os, glob, shutil; f = max(glob.glob(r'C:\Users\huske\OneDrive\ClaudeCode_Life\.playwright-cli\*.docx'), key=os.path.getctime); shutil.move(f, r'<OUTPUT_DIR>\<SLUG>-lesson-plan.docx'); print('Moved:', f)"
```

---

## COMPLETION SUMMARY

```
✅ Video study complete: "<NOTEBOOK_TITLE>"

📓 NotebookLM: <NOTEBOOK_TITLE> (ID: <NOTEBOOK_ID>)
📁 Saved to: Learning\<FOLDER_NAME>\
   - <SLUG>-briefing.md
   - <SLUG>-infographic.png
   - <SLUG>-blog.md
   - <SLUG>-mindmap.json
   [- <SLUG>-lesson-plan.docx  (Ethan mode)]

🔗 Continue in NotebookLM: https://notebooklm.google.com
```

</process>

<success_criteria>
- NotebookLM notebook created with auto-assigned title
- Overview chat run and saved as note
- All 4 artifacts generated and downloaded to Learning\<FOLDER_NAME>\
- If Ethan mode: lesson plan DOCX downloaded and moved to same folder
</success_criteria>
