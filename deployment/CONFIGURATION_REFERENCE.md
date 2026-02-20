# Configuration Reference

## Required Files
- `DOSSIER.md`
- `templates/DOSSIER_TEMPLATE.md`
- `templates/BUILD_LOG_TEMPLATE.md`
- `templates/CONTINUITY_BIBLE_TEMPLATE.md`
- `templates/SESSION_MEMORY_TEMPLATE.md`

## Recommended Environment Variables
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Any provider-specific keys for transcription/audio tools

## Runtime Defaults
- Source-of-truth hierarchy:
  1. approved chapter text
  2. continuity artifacts
  3. dossier intent
  4. session memory notes

## Folder Baseline
```text
<ROOT>/
  DOSSIER.md
  VOICE_PROFILE.md
  BBB_READINESS_REPORT.md
  templates/
  <NOVEL_TITLE>/
```

## Safety Defaults
- Block drafting on missing required files.
- Block progression on evaluation STOP verdict.
- Preserve existing chapter canon unless revision explicitly requested.
