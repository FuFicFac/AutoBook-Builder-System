# Operations and Recovery

## Run Logging (Minimum)
- `run_id`
- `stage` (BBB/EVAL/ABB)
- `scope`
- `inputs_detected`
- `outputs_written`
- `assumptions`
- `warnings`

## Error Classes
- `MISSING_REQUIRED_FILE`
- `MISSING_CRITICAL_FIELDS`
- `CANON_CONFLICT`
- `SCOPE_MISMATCH`
- `WRITE_FAILURE`

## Recovery Playbooks
## Partial Draft Failure
1. Stop current batch.
2. Preserve existing chapters.
3. Record failure in Session Memory.
4. Resume from last complete chapter.

## Canon Conflict
1. Preserve chapter text as source of truth.
2. Record conflict in Session Memory + Build Log.
3. Continue with explicit assumption notes.

## Recommended Backup Strategy
- Backup trio together before major runs:
  - Build Log
  - Continuity Bible
  - Session Memory
