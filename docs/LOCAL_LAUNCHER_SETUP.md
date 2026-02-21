# Local Launcher Setup (macOS)

This repo includes one-click launcher assets for the Auto Book Builder local server.

## Included Files
- `scripts/start-autobook.sh`
- `scripts/stop-autobook.sh`
- `scripts/status-autobook.sh`
- `scripts/build-macos-launcher-app.sh`
- `launchers/macos/AutoBookBuilder.command`
- `launchers/macos/StopAutoBookBuilder.command`
- `launchers/macos/AutoBookBuilderLauncher.applescript`
- `launchers/macos/AutoBookBuilderLauncher.app`

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
2. Double-click `AutoBookBuilderLauncher.app` to launch.
3. Drag `AutoBookBuilderLauncher.app` to `/Applications` to make it appear in Launchpad.
4. Optional: assign a custom icon in Finder (`Get Info` -> paste icon).

## Rebuild the `.app` Launcher
If you update launcher behavior and want to rebuild the app bundle:

```bash
./scripts/build-macos-launcher-app.sh
```

## Notes
- Launcher scripts are designed for local personal use.
- If the app fails to start, inspect `.runtime/autobook.log`.
