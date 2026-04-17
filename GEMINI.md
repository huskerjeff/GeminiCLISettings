# Gemini Automation Mandates (CDW Laptop)

Whenever I am asked about skills or browser automation, I must prioritize the instructions below and also check `C:\Users\jeffkit\.claude`.

## Environment: CDW Laptop (LT-AAD-F9FHV96C)
- **Primary Browser:** Microsoft Edge (`msedge`)
- **Main Profile:** `C:\Users\jeffkit\AppData\Local\Microsoft\Edge\User Data`
- **Isolated Profile:** `./.claude/claude_profile`
- **Session State File:** `.claude/claude_session.json`
- **Preferred AI:** Google Gemini (`https://gemini.google.com/`) or Claude (`https://claude.ai/`)

## Operational Protocol (Critical)
1. **Isolated Profiles (Preferred):** Use `--persistent --profile="./.claude/claude_profile"`. This allows the automated browser to run **simultaneously** with the user's main Edge browser. No `playwright-cli close-all` is required for this mode.
2. **Main Profile Mode:** Using the "real" Edge User Data path requires `playwright-cli close-all` first to release file locks.
3. **Session Injection:** For Claude/ServiceNow, always use `playwright-cli state-load .claude/claude_session.json` to inject authenticated cookies and bypass security blocks.
4. **Visibility:** Always use `--headed`. Headless mode is blocked by corporate security and Cloudflare.
5. **Stability:** Run each interaction command as a separate call (do not use `&&`).
6. **Locators:** Prioritize role-based locators (`getByRole`) over element references (`e1`).

## Standard Interaction Sequence
### Claude / ServiceNow (Isolated Stealth Mode)
*Note: Works WHILE main Edge is open.*
```bash
playwright-cli open --browser=msedge --headed --persistent --profile="./.claude/claude_profile"
playwright-cli state-load .claude/claude_session.json
playwright-cli goto https://claude.ai/new
```

### Gemini (Main Profile Mode)
*Note: Requires CLOSING main Edge first.*
```bash
playwright-cli close-all
playwright-cli open --browser=msedge --headed --profile="C:\Users\jeffkit\AppData\Local\Microsoft\Edge\User Data" https://gemini.google.com/
```

### NotebookLM: Authentication Refresh
If the `notebooklm` skill reports "Authentication expired":
1. Run `notebooklm login` manually in a terminal.
2. Log in via the browser that appears.
3. **Crucial:** You must press **Enter** in the terminal to save the session data.

## Project Context
- Project logic and additional skills are stored in `C:\Users\jeffkit\.claude\`.
- Always check `.claude/GEMINI.md` for project-specific refinements.
