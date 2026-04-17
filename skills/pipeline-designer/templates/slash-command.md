# Slash Command Template

Use this template to generate the slash command file for the designed pipeline.

Copy, fill in all placeholders, then save to `~/.claude/commands/<pipeline-name>.md`.

---

```markdown
---
description: "<One sentence: what this pipeline does and what it outputs. Usage: /<pipeline-name> <argument-hint>>"
---

# <Pipeline Title>

You are executing a <N>-step automated pipeline. The user's input is: **$ARGUMENTS**

Parse the arguments:
- **<primary input>** = <what to extract from $ARGUMENTS>
- **<secondary input>** = <optional flags or defaults>

---

## STEP 01 — PRE-FLIGHT

<List any auth checks, dependency checks, or input validation here.>

If any check fails, stop and tell the user what to fix.

Print status:
```
✅ Pre-flight complete
📌 Input: <value>
📦 Output: <value>
```

---

<Repeat the following block for each station in the pipeline>

## STEP <N> — <STATION NAME IN CAPS>

<What this station does in one sentence.>

```bash
<command or script to run>
```

<How to parse the output. What variable to store. What to show the user.>

<If async: poll every X seconds. Timeout after Y minutes. Show progress.>

<If this station fails: [stop and explain] OR [log warning and continue]>

---

## COMPLETION SUMMARY

Print a final summary:

```
✅ Pipeline complete for: "<input>"

📊 Deliverables:
   - <file or output 1>
   - <file or output 2>

💡 Key results:
[Top 3–5 insights or outputs]
```
```
