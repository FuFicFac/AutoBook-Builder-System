# Deployment Runbook

## Goal
Deploy the full narrative pipeline for local operation with a coding agent.

## Prerequisites
- Local machine access to project files
- Codex/Claude Code-style agent with filesystem permissions
- Required templates available
- API credentials configured locally

## Step-by-Step
1. Create project root and template folder.
2. Place template files listed in `CONFIGURATION_REFERENCE.md`.
3. Run BBB to create:
  - `DOSSIER.md`
  - `VOICE_PROFILE.md`
  - `BBB_READINESS_REPORT.md`
4. Run Dossier Evaluation Squad until verdict is not STOP.
5. Run Auto Book Builder for limited scope first (1-2 chapters).
6. Verify continuity artifacts updated.
7. Expand to act-level generation.
8. Perform refinement/edit/audio review loop.

## First Dry Run
- Scope: one chapter
- Expected result:
  - chapter file generated
  - continuity artifacts updated
  - assumptions logged

## Go-Live Criteria
- Validation suite passed (`VALIDATION_AND_ACCEPTANCE.md`)
- Recovery path tested once
- Operator knows rollback steps
