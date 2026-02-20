# Pipeline Architecture

## System Flow
```text
Voice Capture
  -> Book Brain Builder
  -> Dossier Evaluation Squad
  -> Auto Book Builder
  -> Claude Cowork Refinement
  -> Raptor Write Surgical Edit
  -> ElevenLabs Audio Review + Voice Notes
  -> Final Human Edit
```

## Stage Contracts
## 1. Voice Capture
- Goal: preserve instinctive narrative material.
- Output: raw idea corpus (notes/transcript).

## 2. Book Brain Builder (BBB)
- Goal: create production-ready story blueprint.
- Outputs:
  - `DOSSIER.md`
  - `VOICE_PROFILE.md`
  - `BBB_READINESS_REPORT.md`
- Hard rule: no chapter prose.

## 3. Dossier Evaluation Squad
- Goal: pre-draft quality control.
- Personas: ATLAS, PSYCH, NOVA, TEMPO, NICHE.
- Hard rule: drafting lock if low-score threshold is hit.

## 4. Auto Book Builder
- Goal: continuity-safe chapter generation from validated dossier.
- Outputs:
  - chapters
  - continuity artifacts
  - act completion notes
  - optional full manuscript assembly

## 5. Refinement + Human QA
- Claude Cowork: emotional/rhythm pass.
- Raptor Write: line-level surgical editing.
- Audio loop: cadence and clarity defect detection.
- Human: final authority.

## Design Principles
1. Execution over guessing
2. Local artifacts as source of truth
3. Validation before generation
4. Skill-level logic over ad-hoc prompting
5. Human final approval
