---
name: pipeline-designer
description: Guides the user through designing a new automation pipeline using the factory assembly line framework. Use when the user wants to build a new automated workflow, pipeline, or slash command that moves data from a source to a deliverable through discrete steps.
---

<objective>
Turn a vague automation idea into a fully designed pipeline — with mapped stations, tools, failure rules, and a ready-to-use slash command file saved to ~/.claude/commands/.
</objective>

<essential_principles>
**The Assembly Line Model**

Every pipeline has the same shape:
- **Raw material** — what goes in (a topic, a URL, a file, a search term)
- **Stations** — discrete steps that each do one job and pass output to the next
- **Finished product** — what comes out (a report, an email, a file, a notification)

Each station must answer:
1. What does it receive?
2. What does it produce?
3. What tool does it use?
4. What happens if it fails — stop the line, or warn and continue?
5. Is it instant, or async (needs polling + timeout)?

**Failure rule of thumb:**
- Stop when nothing downstream can work without this step
- Warn and continue when partial data still produces value
</essential_principles>

<quick_start>
Ask the 4 questions, map the stations, write the slash command. Follow the process below exactly.
</quick_start>

<process>
**Step 1 — Get the raw material**

Ask: *What is the input that triggers this pipeline? (a search topic, a URL, a file path, a keyword, something else?)*

Wait for answer.

**Step 2 — Get the finished product**

Ask: *What do you want to end up with when it's done? (a file, a report, a message, a database entry, something else?)*

Wait for answer.

**Step 3 — Confirm available tools**

Ask: *What tools or services do you already have access to? (e.g., CLI tools, APIs, existing skills/slash commands, scripts)*

Wait for answer. Note what exists vs. what will need to be built.

**Step 4 — Write the one-line test**

Before mapping stations, write the pipeline as one sentence:

> `[raw material] → [station] → [station] → [finished product]`

Show this to the user and confirm it matches their intent. Adjust if needed.

**Step 5 — Map the stations**

Fill in this table for every station between input and output:

| Station | Receives | Produces | Tool | If it fails |
|---------|----------|----------|------|-------------|
| (name)  | (input)  | (output) | (tool or "build needed") | Stop / Warn+continue |

Rules:
- Each station does exactly one job
- No station skips a transformation step
- Mark async stations with ⏱ (they need polling logic)
- If a tool doesn't exist yet, mark it "build needed"

**Step 6 — Flag async stations**

For any station marked ⏱, specify:
- How to check if it's done (poll endpoint, status field, file exists)
- Timeout (how long before giving up)
- What to do on timeout (stop? retry? skip?)

**Step 7 — Review with user**

Present the completed station table and one-line test. Ask:
*Does this match what you had in mind? Any stations missing or wrong?*

Adjust based on feedback.

**Step 8 — Generate the slash command**

Using the template at `templates/slash-command.md`, generate the slash command file.

Save it to:
```
~/.claude/commands/<pipeline-name>.md
```

Where `<pipeline-name>` is a lowercase-hyphenated name derived from the pipeline's purpose (e.g., `reddit-research`, `rss-to-slack`, `pdf-to-summary`).

**Step 9 — Confirm completion**

Tell the user:
- The slash command name and where it was saved
- How to invoke it (e.g., `/reddit-research AI agents`)
- Any stations marked "build needed" that require follow-up work
</process>

<success_criteria>
- [ ] Raw material and finished product clearly defined
- [ ] One-line pipeline test written and confirmed
- [ ] Every station has: input, output, tool, failure rule
- [ ] Async stations have polling and timeout defined
- [ ] Slash command file saved to ~/.claude/commands/
- [ ] User knows what still needs to be built
</success_criteria>
