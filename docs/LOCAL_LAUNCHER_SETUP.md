# Local Launcher Setup (macOS)

This repo includes one-click launcher assets for the Auto Book Builder local server.

## Included Files
- `scripts/start-autobook.sh`
- `scripts/stop-autobook.sh`
- `scripts/status-autobook.sh`
- `launchers/macos/AutoBookBuilder.command`
- `launchers/macos/StopAutoBookBuilder.command`

## What Start Does
- Ensures `frontend/node_modules` exists (runs `npm install` on first run).
- Starts `frontend/server.js` in the background.
- Writes PID to `.runtime/autobook.pid`.
- Writes logs to `.runtime/autobook.log`.
- Waits for `http://127.0.0.1:8787/api/health`.
- Opens `http://127.0.0.1:8787` in your default browser.

## Usage
From repo root:

```bash
chmod +x scripts/*.sh launchers/macos/*.command
./launchers/macos/AutoBookBuilder.command
```

Stop:

```bash
./launchers/macos/StopAutoBookBuilder.command
```

Status:

```bash
./scripts/status-autobook.sh
```

## Make It a Dock/App Shortcut
1. Open Finder to `launchers/macos`.
2. Double-click `AutoBookBuilder.command` once to confirm it launches.
3. Drag that `.command` file to your Dock, or create an Automator wrapper app that runs it.
4. Optional: assign a custom icon in Finder (`Get Info` -> paste icon).

## Notes
- Launcher scripts are designed for local personal use.
- If the app fails to start, inspect `.runtime/autobook.log`.
