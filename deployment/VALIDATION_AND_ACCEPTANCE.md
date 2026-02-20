# Validation and Acceptance

## Fixture Scenarios
1. Minimal seed story input.
2. Partial dossier repair flow.
3. Continuation run with existing chapters.

## Required Checks
## BBB
- Emits all three artifacts.
- Produces explicit handoff state.

## Evaluation Squad
- Outputs all five persona sections in correct order.
- Emits consensus and verdict.
- Triggers repair loop on low score.

## Auto Book Builder
- First run creates scaffold.
- Continuation appends (no destructive overwrite).
- Continuity artifacts update after each batch.

## Pass Criteria
- No blocked state silently proceeds.
- All required files are present when needed.
- Continuity regressions are absent in fixture sequence.
- Run summary lists file changes + assumptions.

## Fail Criteria
- Missing-file runs continue without blocking.
- Chapter canon overwritten without explicit request.
- Persona outputs omit required sections/order.
