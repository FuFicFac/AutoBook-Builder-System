# Security and Secrets

## Principles
- Local filesystem is authoritative.
- API credentials are never committed to repo.
- Human review gates remain mandatory.

## Secrets Handling
- Use environment variables or local secret manager.
- Keep `.env` out of version control.
- Rotate keys periodically and on exposure.

## Access Boundaries
- Separate generation/refinement/export environments when possible.
- Restrict automated write permissions to designated project folders.

## Data Safety
- Keep private manuscripts local unless explicitly exporting.
- Redact personal/sensitive details in shared fixtures.
