# Narrative System Deployment Blueprint

Repository-ready documentation package for deploying and operating a local AI-assisted fiction pipeline:

- Voice-first idea ingestion
- Book Brain Builder (pre-production)
- Dossier Evaluation Squad (validation)
- Auto Book Builder (continuity-safe drafting)
- Refinement, surgical edit, and audio QA loop

## What This Repo Contains
- `MASTER_BOOK_PIPELINE_SYSTEM_SPEC.md`: Complete canonical specification.
- `PIPELINE_ARCHITECTURE.md`: End-to-end flow and stage responsibilities.
- `frontend/`: `Auto Book Builder` local browser GUI (voice-first Codex CLI workflow).
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
4. Browser microphone permission granted for voice intake.
5. Run and verify:
   - `cd frontend`
   - `npm install`
   - `npm run start`
   - open `http://127.0.0.1:8787`

## Intended Audience
- No-code / low-code operators using Codex/Claude Code-style agents.
- Technical collaborators implementing or maintaining pipeline behavior.

## Source of Truth
The local project filesystem and artifact contracts in `deployment/ARTIFACT_SCHEMAS.md` are authoritative.
