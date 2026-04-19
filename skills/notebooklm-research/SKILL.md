---
name: notebooklm-research
description: Takes a topic, creates a NotebookLM notebook, uses NotebookLM's built-in web research to find sources automatically, then analyzes and generates an infographic + briefing report. No URLs needed — NotebookLM searches the web itself.
---

<objective>
Create a NotebookLM notebook, trigger NotebookLM's built-in web research on the topic, wait for sources to be imported, run analysis, and generate deliverables. Never ask the user for URLs.
</objective>

<quick_start>
Take the topic. Create notebook. Run web research. Wait for sources. Ask 3 questions. Generate deliverables.
</quick_start>

<process>

**Inputs:**
- `TOPIC` — the research query (required)
- `--research deep` — use deep web research (20+ sources, 2–5 min). Default is `fast` (5–10 sources, seconds)
- `OUTPUT` — output type(s), default: `infographic,report`
- `SLUG` — lowercase-hyphenated version of topic (truncated to 40 chars), used for filenames

---

**STEP 1 — CREATE NOTEBOOK**

```bash
notebooklm create "Research: <TOPIC>" --json
```

Parse and store the `id` field as `NOTEBOOK_ID`.

Print:
```
📓 Notebook created: Research: <TOPIC> (ID: <NOTEBOOK_ID>)
```

---

**STEP 2 — WEB RESEARCH**

Trigger NotebookLM's built-in web research on the topic.

**If `--research deep` was specified:**
```bash
notebooklm source add-research "<TOPIC>" --mode deep --no-wait --notebook <NOTEBOOK_ID>
```

**Otherwise (default — fast):**
```bash
notebooklm source add-research "<TOPIC>" --mode fast --no-wait --notebook <NOTEBOOK_ID>
```

Wait for research to complete — `--import-all` handles adding sources to the notebook automatically:

```bash
PYTHONUTF8=1 notebooklm research wait --notebook <NOTEBOOK_ID> --import-all --timeout 300
```

Print:
```
🌐 Web research complete — sources imported
```

---

**STEP 3 — ANALYZE**

Ask 3 questions to synthesize the research:

```bash
notebooklm ask "What are the key themes, concepts, and insights about <TOPIC>?" --notebook <NOTEBOOK_ID>
notebooklm ask "What are the most important facts, statistics, and expert perspectives on <TOPIC>?" --notebook <NOTEBOOK_ID>
notebooklm ask "What are the practical takeaways and open questions about <TOPIC>?" --notebook <NOTEBOOK_ID>
```

Summarize each answer in 3–5 bullet points. Display as a **Research Brief**.

---

**STEP 4 — GENERATE DELIVERABLES**

**Infographic:**
```bash
PYTHONUTF8=1 notebooklm generate infographic --notebook <NOTEBOOK_ID> --orientation landscape --detail standard --json
```
Store `task_id`. Wait:
```bash
PYTHONUTF8=1 notebooklm artifact wait <task_id> --notebook <NOTEBOOK_ID> --timeout 900 --json
```
Download:
```bash
PYTHONUTF8=1 notebooklm download infographic "./<SLUG>-infographic.png" --artifact <task_id> --notebook <NOTEBOOK_ID> --json
```

**Briefing Report:**
```bash
PYTHONUTF8=1 notebooklm generate report --format briefing-doc --notebook <NOTEBOOK_ID> --json
```
Store `task_id`. Wait:
```bash
PYTHONUTF8=1 notebooklm artifact wait <task_id> --notebook <NOTEBOOK_ID> --timeout 900 --json
```
Download:
```bash
PYTHONUTF8=1 notebooklm download report "./<SLUG>-briefing.md" --artifact <task_id> --notebook <NOTEBOOK_ID> --json
```

**Other output types** (if `--output` specified):

| Type | Command |
|------|---------|
| `podcast` | `notebooklm generate audio "Deep dive on <TOPIC>" --notebook <NOTEBOOK_ID> --json` |
| `video` | `notebooklm generate video "Explainer on <TOPIC>" --notebook <NOTEBOOK_ID> --json` |
| `quiz` | `notebooklm generate quiz --notebook <NOTEBOOK_ID> --json` |
| `flashcards` | `notebooklm generate flashcards --notebook <NOTEBOOK_ID> --json` |
| `slide-deck` | `notebooklm generate slide-deck --notebook <NOTEBOOK_ID> --json` |
| `mind-map` | `notebooklm generate mind-map --notebook <NOTEBOOK_ID> --json` |
| `study-guide` | `notebooklm generate report --format study-guide --notebook <NOTEBOOK_ID> --json` |

For each: wait with `artifact wait`, then download to `./<SLUG>-<type>.<ext>`.

If rate limited, tell the user and suggest:
```bash
notebooklm generate <type> --notebook <NOTEBOOK_ID> --retry 2
```

---

**COMPLETION SUMMARY**

```
✅ Research complete for: "<TOPIC>"

📓 Notebook: Research: <TOPIC> (ID: <NOTEBOOK_ID>)
🌐 Sources: imported via web research
📊 Deliverables saved:
   - <SLUG>-infographic.png
   - <SLUG>-briefing.md

💡 Research Brief:
[3–5 key insights from Step 3]

🔗 Continue in NotebookLM: https://notebooklm.google.com
```

</process>

<success_criteria>
- Notebook created
- Web research completed and sources imported
- 3 analysis questions answered and summarized
- Infographic and briefing report downloaded locally
- Completion summary printed with key insights
</success_criteria>
