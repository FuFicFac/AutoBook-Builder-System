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
- `skills/`: Individual skill contracts.
- `deployment/`: Setup, config, schemas, validation, acceptance.
- `operations/`: Recovery, versioning, security, maintenance.
- `CONTRIBUTING.md`: How collaborators should propose changes.

## Quick Start
1. Read `MASTER_BOOK_PIPELINE_SYSTEM_SPEC.md`.
2. Follow `deployment/DEPLOYMENT_RUNBOOK.md`.
3. Validate with `deployment/VALIDATION_AND_ACCEPTANCE.md`.
4. Operate and troubleshoot with `operations/OPERATIONS_AND_RECOVERY.md`.

## Intended Audience
- No-code / low-code operators using Codex/Claude Code-style agents.
- Technical collaborators implementing or maintaining pipeline behavior.

## Source of Truth
The local project filesystem and artifact contracts in `deployment/ARTIFACT_SCHEMAS.md` are authoritative.
