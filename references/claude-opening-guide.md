# Claude.ai Browser Automation Guide (Session Injection)

This guide documents the reliable procedure for opening claude.ai using playwright-cli on the CDW laptop, bypassing Cloudflare challenges using pre-captured session cookies.

## 1. Prerequisites
- playwright-cli installed.
- A valid claude_session.json (captured via CDP refresh if stale).
- Microsoft Edge (msedge) available.

## 2. Step-by-Step Execution Protocol

### Step 1: Clean Up Previous Sessions
Ensure no stale browser locks exist on the profile directory.
`ash
playwright-cli close-all
`

### Step 2: Prepare the Session File
Copy the canonical session file to the current working directory so the Playwright sandbox can access it.
`ash
cp "C:\Users\jeffkit\.claude\claude_session.json" ./claude_session.json
`

### Step 3: Launch the Browser (No URL)
Open Edge with an isolated persistent profile. **Do not** pass a URL yet to avoid hitting Cloudflare before cookies are loaded.
`ash
playwright-cli open --browser=msedge --headed --persistent --profile="C:\Users\jeffkit\.claude\claude_profile"
`

### Step 4: Inject Session Cookies
Load the captured state into the active browser session.
`ash
playwright-cli state-load claude_session.json
`

### Step 5: Navigate to Claude
Now that the browser has the authentication and clearance cookies, navigate to the target page.
`ash
playwright-cli goto https://claude.ai/new
`

### Step 6: Submit a Prompt
Use a role-based locator to target the prompt textbox and submit your query.
`ash
playwright-cli fill "getByRole('textbox', { name: 'Write your prompt to Claude' })" "Your prompt here" --submit
`

## 3. Critical Rules
- **Separate Commands:** Never chain playwright-cli commands with && (except for specific CDP attach flows). Chaining can cause session termination.
- **Headed Mode:** Always use --headed. Headless mode is aggressively blocked by Cloudflare.
- **Order Matters:** Always open -> state-load -> goto. If you goto before state-load, you will get stuck at a "Just a moment..." challenge page.
- **Role Locators:** Always use getByRole for elements, as reference IDs (e.g., e153) change across sessions.
