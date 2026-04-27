# Capturing a claude.ai Session File (Cloudflare-Protected Sites)

How to capture `claude_session.json` for use with `playwright-cli state-load` on sites behind Cloudflare (claude.ai) or Google's automation detection.

## The problem

Playwright-controlled browsers are blocked by:

1. **Cloudflare's challenge page** (`Just a moment…`) — triggered on first navigation to claude.ai from an automated browser that doesn't already have a valid `cf_clearance` cookie.
2. **Google's automation detection** — if the site uses Google SSO, Google shows "This browser or app may not be secure" and refuses login.

You cannot log in *through* a playwright-controlled browser to generate a session. You need to capture the session from a real browser where the user has already logged in.

Additionally, `claude_session.json` is **machine-specific**. `cf_clearance` binds to browser fingerprint + IP, so a session file captured on laptop A fails on laptop B. The file is gitignored in `~/.claude/.gitignore` and must be regenerated on each machine.

## The solution: attach via CDP, then state-save

### Step 1 — User logs in manually

Ask the user to log in to claude.ai in their normal Edge (or Chrome), clearing any Cloudflare challenge themselves. They stay logged in; leave that tab open.

### Step 2 — User enables remote debugging on the running browser

This is the key unlock. Normally, `attach --cdp=msedge` requires the browser to have been launched with `--remote-debugging-port`, which a user's normal Edge launch does not have. But:

- The user opens `edge://inspect/#remote-debugging` (or `chrome://inspect/#remote-debugging`) in their existing browser.
- They check **"Allow remote debugging for this browser instance"**.
- No relaunch needed — CDP is now live on the already-running browser.

### Step 3 — Attach and capture

```bash
playwright-cli close-all                   # release any isolated-profile sessions
playwright-cli attach --cdp=msedge         # connects to the real Edge via CDP
playwright-cli state-save claude_session.json
cp claude_session.json ~/.claude/claude_session.json
playwright-cli close-all                   # detach; does NOT close the user's Edge
```

Verify `attach` worked by inspecting its output — you should see the claude.ai tab listed with page title `Claude` (not `Just a moment…`). If the title is the Cloudflare challenge, the user isn't actually logged in yet.

### Step 4 — Use the captured session in future runs

With a fresh `claude_session.json` in both `~/.claude/` and the CWD, future playwright runs can use session injection against an isolated profile:

```bash
playwright-cli close-all
playwright-cli open --browser=msedge --headed --persistent --profile="./.claude/claude_profile"
playwright-cli state-load claude_session.json     # cookies MUST load before navigation
playwright-cli goto https://claude.ai/new
```

Page title should be `Claude`, not `Just a moment…`. If Cloudflare challenges again, the session has expired — repeat Step 1–3.

## Gotchas

- **`state-load` IndexedDB error:** `state-load` may warn about restoring IndexedDB (`Unable to restore IndexedDB: Internal error`). This is cosmetic — the cookies do load, and `cf_clearance` is what matters for passing Cloudflare.
- **CWD requirement:** `state-load` and `state-save` write/read from the current working directory. The file at `~/.claude/claude_session.json` is the canonical copy; `cp` it to CWD before `state-load`.
- **Session expiry:** `cf_clearance` typically lasts 30 min – 1 day. Plan to refresh mid-session if a long flow hits a challenge.
- **Do NOT copy the file between machines.** It will fail. Each laptop needs its own capture.
- **`close-all` after `attach`:** This releases the CDP connection without killing the user's browser. Do not use `kill-all` while attached — it may kill the user's Edge process.

## Related references

- `session-management.md` — general `attach --cdp` syntax, browser session isolation, and persistent profiles.
- `storage-state.md` — details on `state-save` / `state-load` mechanics.
