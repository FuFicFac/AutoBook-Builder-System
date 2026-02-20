# Auto Book Builder Spec

## Purpose
Generate continuity-safe manuscript chapters from validated story architecture.

## Required Inputs
- `DOSSIER.md`
- `templates/DOSSIER_TEMPLATE.md`
- `templates/BUILD_LOG_TEMPLATE.md`
- `templates/CONTINUITY_BIBLE_TEMPLATE.md`
- `templates/SESSION_MEMORY_TEMPLATE.md`

## Workflow
1. Preflight validation (fail fast if missing required files).
2. Initialize project scaffold (first run only).
3. Plan requested scope (chapter/act).
4. Draft chapters in sequence.
5. Update continuity artifacts after each batch.
6. Emit act completion readme and optional full manuscript.

## Hard Rules
- No silent rewrites of approved chapters.
- Preserve chapter canon as top truth.
- Do not overwrite user-edited plans when extension is possible.
- Report file updates explicitly each run.

## Continuity Artifacts
- `<NOVEL_TITLE>_Build_Log.md`
- `<NOVEL_TITLE>_Continuity_Bible.md`
- `<NOVEL_TITLE>_Session_Memory.md`
