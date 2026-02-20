# MASTER BOOK PIPELINE SYSTEM SPEC
Version: 1.0.0  
Status: Production Handoff Blueprint  
Scope: End-to-end architecture, skill contracts, deployment, validation, and operations for the local AI book-building pipeline.

## 1) Executive Intent
This document is the single source of truth for reproducing and operating the full pipeline you built: voice-first narrative capture, schema-first story structuring, pre-draft validation, continuity-safe drafting, refinement, human editing, and audio feedback loops. It is designed so a no-code/low-code operator can hand this spec to a capable coding agent (Codex/Claude Code class) and deploy the system on a local machine with predictable behavior.

## 2) Core Philosophy (Non-Negotiable)
1. Execution over guessing: the system should execute structure, not improvise canon.
2. Local artifact authority: the local filesystem is source of truth.
3. Skill architecture over prompt hacking: behavior should be encoded in reusable skill logic.
4. Gated progression: no draft generation without readiness validation.
5. Human final authority: AI builds, human decides.

## 3) Pipeline Topology
```text
Voice Idea Capture
  -> Book Brain Builder (BBB)
  -> Dossier Evaluation Squad
  -> Auto Book Builder
  -> Claude Cowork Refinement
  -> Raptor Write Surgical Edit
  -> ElevenLabs Audio Review + Voice Notes
  -> Final Human Edit
```

## 4) System Components
### 4.1 Skill Layer
- `book-brain-builder`: pre-production schema construction.
- `dossier-evaluation-squad`: readiness scoring + repair loop.
- `auto-book-builder`: continuity-safe manuscript generation engine.

### 4.2 Runtime Layer
- Codex desktop (or equivalent local file-capable coding agent).
- Optional Claude environment for second-pass refinement.
- Optional audio tools (ElevenLabs Reader) for auditory QA.

### 4.3 Artifact Layer
- `DOSSIER.md`
- `VOICE_PROFILE.md`
- `BBB_READINESS_REPORT.md`
- `<NOVEL_TITLE>_Build_Log.md`
- `<NOVEL_TITLE>_Continuity_Bible.md`
- `<NOVEL_TITLE>_Session_Memory.md`
- `Chapter_XX.md`
- `ACT_<ROMAN>_COMPLETE_README.md`
- `<NOVEL_TITLE>_Full_Manuscript.md`

## 5) Environment Contract
## 5.1 Host Assumptions
- OS: macOS (recommended) or Linux.
- Filesystem: local workspace write access.
- Terminal + shell available.
- LLM coding agent supports local file operations.

## 5.2 Tooling Baseline
- Git
- Python 3.9+
- Node.js 18+ (only if adjacent tools in project require it)
- Optional:
  - Pandoc (for DOCX publishing flows)
  - FFmpeg/audio tooling (if custom audio processing is added)

## 5.3 Credentials/Secrets
- Do not store API keys in published docs.
- Use local environment variables or secure secret store.
- Recommended vars (adjust to provider stack):
  - `OPENAI_API_KEY` (if using OpenAI API features)
  - `ANTHROPIC_API_KEY` (if using Claude API features)
  - Any provider-specific keys for audio/TTS tools

## 6) Directory Contract
Recommended root shape:
```text
<PROJECT_ROOT>/
  DOSSIER.md
  VOICE_PROFILE.md
  BBB_READINESS_REPORT.md
  templates/
    DOSSIER_TEMPLATE.md
    BUILD_LOG_TEMPLATE.md
    CONTINUITY_BIBLE_TEMPLATE.md
    SESSION_MEMORY_TEMPLATE.md
  <NOVEL_TITLE>/
    Chapter_01.md
    ...
    <NOVEL_TITLE>_Build_Log.md
    <NOVEL_TITLE>_Continuity_Bible.md
    <NOVEL_TITLE>_Session_Memory.md
    ACT_I_COMPLETE_README.md
    ACT_II_COMPLETE_README.md
    ACT_III_COMPLETE_README.md
    <NOVEL_TITLE>_Full_Manuscript.md
```

## 7) Skill Contracts (Formal)
## 7.1 Book Brain Builder Contract
### Mission
Convert rough story intent into a complete Book Brain package.

### Inputs
- Brain dump, minimal seed, or partial dossier.

### Outputs
- `DOSSIER.md`
- `VOICE_PROFILE.md`
- `BBB_READINESS_REPORT.md`

### Hard Rules
- Must not draft chapters/scenes.
- Must not create manuscript continuity artifacts.
- Must ask clarifying questions for missing critical fields.
- Must emit explicit handoff state (`READY` / `NOT_READY`).

### Critical completeness criteria
- Premise
- Genre + audience/tone
- Protagonist want/need/flaw
- Antagonistic force
- Stakes
- World constraints
- Core conflict
- Arc direction
- Beat spine
- Must-have/must-avoid

## 7.2 Dossier Evaluation Squad Contract
### Mission
Evaluate pre-draft structural readiness through five personas.

### Personas
- ATLAS: structure and causality.
- PSYCH: character logic.
- NOVA: world integrity.
- TEMPO: pacing architecture.
- NICHE: market/genre alignment.

### Output order (full mode)
1. ATLAS
2. PSYCH
3. NOVA
4. TEMPO
5. NICHE
6. CONSENSUS SUMMARY
7. FOUNDATION VERDICT
8. NEXT STEPS

### Score semantics
- 1-4: STOP
- 5-6: CAUTION
- 7-8: SOLID
- 9-10: GREENLIGHT

### Consensus priority
Structure > Character > World > Pacing > Market

### Repair protocol trigger
Any persona score <= 4 blocks drafting and launches targeted repair loop.

## 7.3 Auto Book Builder Contract
### Mission
Transform validated dossier into continuity-safe chaptered manuscript.

### Required inputs
- `DOSSIER.md`
- Template files:
  - `templates/DOSSIER_TEMPLATE.md`
  - `templates/BUILD_LOG_TEMPLATE.md`
  - `templates/CONTINUITY_BIBLE_TEMPLATE.md`
  - `templates/SESSION_MEMORY_TEMPLATE.md`

### Workflow
1. Preflight validation.
2. First-run initialization (if needed).
3. Act/chapter planning.
4. Chapter drafting.
5. Continuity artifact updates.
6. Act completion readme + full-manuscript assembly.

### Hard rules
- No silent rewrites of approved chapters.
- No progression on missing critical inputs.
- Preserve user edits in existing plans/maps when extending.
- Resolve canon conflicts by prioritizing approved chapter text.

## 8) Source-of-Truth Hierarchy
When conflicts exist:
1. Approved chapter text
2. Continuity Bible + Build Log
3. DOSSIER intent
4. Session Memory notes

Behavior:
- Preserve canon in chapters.
- Record ambiguity/conflict in Session Memory.
- Continue with explicit assumptions.

## 9) State Machines
## 9.1 BBB
`INGEST -> EXTRACT -> SCORE -> INTERVIEW_LOOP -> BUILD_ARTIFACTS -> HANDOFF`

## 9.2 Evaluation Squad
`INGEST_DOSSIER -> PERSONA_EVAL -> CONSENSUS -> VERDICT -> (REPAIR_LOOP if needed)`

## 9.3 Auto Book Builder
`PREFLIGHT -> INIT(if first run) -> PLAN -> DRAFT -> UPDATE_CONTINUITY -> COMPLETE`

## 10) Artifact Schemas
## 10.1 DOSSIER.md (minimum)
- Title/logline
- Genre/audience/tone
- Story promise/hook
- Theme/dilemma
- Protagonist + arc
- Antagonistic force
- Supporting cast
- World rules
- Stakes/escalation ladder
- Act/beat spine
- Set pieces
- Must-have/must-avoid
- Ending profile

## 10.2 VOICE_PROFILE.md (minimum)
- Voice descriptors
- POV/tense/distance
- Prose texture/rhythm
- Dialogue profile
- Emotional temperature
- Pacing profile
- Style boundaries

## 10.3 BBB_READINESS_REPORT.md
- Completeness score
- Critical gaps (resolved/unresolved)
- Assumptions
- Handoff state
- Next required question (if not ready)

## 10.4 Build Log
- Chronological events
- Causal impacts
- Change ledger
- Open risks

## 10.5 Continuity Bible
- Character states
- Location states
- Object states
- Timeline
- Setups/payoffs
- Open threads

## 10.6 Session Memory
- Current drafting scope
- Active threads
- Emotional pacing snapshot
- Immediate next steps
- Assumptions taken

## 11) Deployment Runbook (No-Code Operator)
## 11.1 Bootstrap
1. Create project root folder.
2. Place this spec and required templates in root.
3. Add initial `DOSSIER.md` or run BBB to generate it.
4. Confirm skill files are available to the coding agent.

## 11.2 First-time execution order
1. Run `book-brain-builder` to produce dossier/voice/readiness.
2. Run `dossier-evaluation-squad` until score threshold is acceptable.
3. Run `auto-book-builder` for requested scope (chapter/act).
4. Run refinement pass in Claude environment.
5. Perform surgical edit + audio loop.

## 11.3 Operator prompts (canonical)
- BBB:
  - "Use BBB mode. Build DOSSIER.md + VOICE_PROFILE.md from this brain dump."
- Evaluation:
  - "Run full Dossier Evaluation Squad and return consensus + fix priority."
- Drafting:
  - "Run Auto Book Builder for Act I, chapters 1-4, continuity-safe."

## 12) Validation Harness (Pass/Fail)
## 12.1 Fixture Pack
Create three fixture scenarios:
1. `fixture_minimal_seed`
2. `fixture_partial_dossier`
3. `fixture_continuation_with_existing_chapters`

## 12.2 Required checks
- BBB emits all 3 artifacts.
- Evaluation outputs all persona sections in exact order.
- Auto Book Builder:
  - creates scaffold on first run,
  - appends (does not overwrite) on continuation,
  - updates continuity artifacts every batch.

## 12.3 Acceptance criteria
- No blocked run proceeds silently.
- Every run returns explicit file update report.
- Continuity regression count = 0 across fixture sequence.

## 13) Observability and Debugging
## 13.1 Required run log fields
- `run_id`
- `stage` (BBB/Eval/ABB)
- `scope` (chapter/act)
- `inputs_detected`
- `outputs_written`
- `assumptions`
- `warnings/blockers`

## 13.2 Error taxonomy
- `MISSING_REQUIRED_FILE`
- `MISSING_CRITICAL_DOSSIER_FIELDS`
- `CANON_CONFLICT`
- `SCOPE_MISMATCH`
- `WRITE_FAILURE`

## 13.3 Debug policy
- Never hide blocked states.
- Report exact missing paths/fields.
- Include actionable next command/instruction.

## 14) Recovery and Rollback
## 14.1 Partial write recovery
- If run fails mid-batch:
  1. Keep existing chapter files untouched.
  2. Mark failed scope in Session Memory.
  3. Resume from last fully completed chapter.

## 14.2 Canon conflict recovery
- Preserve chapter truth.
- Record discrepancy in Session Memory.
- Add repair ticket in Build Log.

## 14.3 Rollback strategy
- Keep timestamped backups of:
  - Continuity Bible
  - Session Memory
  - Build Log
- On rollback, restore latest coherent trio together (not individually).

## 15) Versioning and Migration Policy
- Spec version: semantic versioning (`MAJOR.MINOR.PATCH`).
- Artifact schema versions stored in each artifact header.
- Migration rule:
  - MAJOR changes require explicit migration script or mapping note.
  - MINOR adds optional fields.
  - PATCH fixes formatting/instructions only.

## 16) Security and Control
- Local files are authority; cloud tools are processors.
- Never commit plaintext keys.
- Keep model outputs reviewed before irreversible edits.
- Separate environments for:
  - generation,
  - refinement,
  - publishing/export.

## 17) Human-in-the-Loop Controls
- Mandatory review checkpoints:
  - post-BBB readiness,
  - post-evaluation consensus,
  - post-act draft,
  - post-audio review.
- Human override can:
  - freeze canon,
  - re-open blocked stages,
  - enforce rewrites for specific chapters only.

## 18) Multi-Model Coordination Rules
- Codex role: structural scaffolding and state integrity.
- Claude role: emotional depth/rhythm polishing.
- Raptor Write role: surgical line control.
- Audio loop role: cadence/clarity defect detection.

Constraint:
- Never allow downstream refinement to mutate continuity truth without logging change.

## 19) Esoteric Insights (Operationalized)
From your article, the “why” is codified as system constraints:
1. Voice-first ingestion preserves narrative instinct.
2. Architecture-first prevents drift.
3. Validation-before-drafting is non-negotiable.
4. Skill iteration beats prompt tinkering for quality scaling.
5. Auditory review reveals defects visual reading misses.

## 20) Deployment Readiness Checklist
A deployment is ready only when all are true:
- [ ] Environment contract satisfied.
- [ ] Templates present at required paths.
- [ ] BBB outputs generated and complete.
- [ ] Evaluation threshold passed or accepted with caution.
- [ ] Auto Book Builder dry run completed on fixture.
- [ ] Observability logs available with run IDs.
- [ ] Backup/rollback procedure tested once.
- [ ] Operator handoff notes written.

## 21) Minimal Operator SOP
1. Capture story by voice.
2. Run BBB until `READY`.
3. Run Evaluation Squad until no STOP verdict.
4. Run Auto Book Builder for small scope first.
5. Review continuity artifacts.
6. Expand scope to full act.
7. Refine, edit, audio-check, final edit.

## 22) Known Risks and Mitigations
- Risk: model drift in long runs  
  Mitigation: strict continuity updates + short scoped batches.
- Risk: contradictory feedback from evaluators  
  Mitigation: consensus arbitration priority.
- Risk: accidental overwrites  
  Mitigation: append/merge policy + backups.
- Risk: style collapse in refinement  
  Mitigation: enforce `VOICE_PROFILE.md` in all refinement prompts.

## 23) Governance
- Change owner: pipeline architect.
- Review cadence: per completed act.
- Mandatory regression check: before each major skill revision.
- Deprecation rule: do not remove fields without migration note.

## 24) Handoff Package (What to Share)
For external operator enablement, provide:
1. This master spec.
2. Template files.
3. Example fixture project.
4. Expected outputs from one known-good run.
5. Troubleshooting cheat sheet.

## 25) Final Principle
The pipeline succeeds when the model is constrained to execute explicit story architecture, and human judgment is preserved as the final quality gate. The objective is not “better prompts”; it is reliable creative systems engineering.
