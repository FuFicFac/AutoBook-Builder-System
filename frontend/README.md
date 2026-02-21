# Auto Book Builder (Frontend Module)

Local browser UI for a voice-first narrative workflow using Codex CLI as the local orchestration brain.

## What it does
- Runs conversational intake sessions with Codex CLI.
- Supports microphone dictation + typed follow-up prompts.
- Auto-fills story intake fields from conversation and uploaded files.
- Ingests `.md`, `.txt`, `.docx`, `.pdf` (plus `.json/.yaml/.yml/.csv`) for context.
- Runs evaluation and exports intake artifacts (`STORY_INTAKE.md`, `DOSSIER_DRAFT.md`, transcript).

## Prerequisites
- Node.js 18+ and npm.
- Codex CLI installed and authenticated (`codex login`).
- Local skill directory available at `~/codex/skills` (auto-detected) or your custom path.
- Browser with microphone support (Chrome recommended for Web Speech API).

## Run locally
```bash
cd frontend
npm install
npm run start
```

Open:
- http://127.0.0.1:8787

## AI-Agent Deployment Notes
- If another AI agent is setting this up, tell it to:
1. Install dependencies in `frontend/`.
2. Verify `codex --version` and `codex login` state.
3. Start server with `npm run start`.
4. Confirm `GET /api/health` returns `{"status":"ok"}`.
5. Open `http://127.0.0.1:8787`.

## Notes
- This app runs locally and does not publish your data.
- It is an orchestrator, not a direct skill API.
- For `.docx` and `.pdf`, auto-fill extraction is best-effort; uploaded files are still attached as context even if field parsing is partial.
