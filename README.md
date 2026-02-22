# Auto Book Builder No Microphone

Repository-ready package for deploying and operating a local AI-assisted fiction pipeline with a browser GUI (no microphone/speech recognition):

- Typed/pasted idea intake
- Book Brain Builder (pre-production)
- Dossier Evaluation Squad (validation)
- Auto Book Builder (continuity-safe drafting)
- Refinement, surgical edit, and audio QA loop

## What This Repo Contains
- `MASTER_BOOK_PIPELINE_SYSTEM_SPEC.md`: Complete canonical specification.
- `PIPELINE_ARCHITECTURE.md`: End-to-end flow and stage responsibilities.
- `frontend/`: `Auto Book Builder No Microphone` local browser GUI (typed Codex CLI workflow).
- `skills/`: Individual skill contracts.
- `deployment/`: Setup, config, schemas, validation, acceptance.
- `operations/`: Recovery, versioning, security, maintenance.
- `CONTRIBUTING.md`: How collaborators should propose changes.

## Quick Start
1. Read `MASTER_BOOK_PIPELINE_SYSTEM_SPEC.md`.
2. Follow `deployment/DEPLOYMENT_RUNBOOK.md`.
3. Start `frontend/` (`npm install && npm run start` in that folder).
4. Validate with `deployment/VALIDATION_AND_ACCEPTANCE.md`.
5. Operate and troubleshoot with `operations/OPERATIONS_AND_RECOVERY.md`.

## Frontend Prerequisites (For Humans or AI Setup Agents)
1. Node.js 18+ and npm installed.
2. Codex CLI installed and authenticated locally.
3. Local skill directory present (`/Users/lastresort/codex/skills` by default).
5. Run and verify:
   - `cd frontend`
   - `npm install`
   - `npm run start`
   - open `http://127.0.0.1:8787`

## One-Click Local Launcher (macOS)
- Launcher docs: `docs/LOCAL_LAUNCHER_SETUP.md`
- Start: `./launchers/macos/AutoBookBuilder.command`
- App launcher: `launchers/macos/AutoBookBuilderLauncher.app` (Launchpad-friendly; launches the no-microphone app variant in this repo)
- Stop: `./launchers/macos/StopAutoBookBuilder.command`
- Status: `./scripts/status-autobook.sh`
- Rebuild app bundle: `./scripts/build-macos-launcher-app.sh`

First-time setup:
- `chmod +x scripts/*.sh launchers/macos/*.command`

## Intended Audience
- No-code / low-code operators using Codex/Claude Code-style agents.
- Technical collaborators implementing or maintaining pipeline behavior.

## Source of Truth
The local project filesystem and artifact contracts in `deployment/ARTIFACT_SCHEMAS.md` are authoritative.
