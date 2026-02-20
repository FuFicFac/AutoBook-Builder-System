# Versioning and Migrations

## Versioning Policy
Use semantic versioning for this documentation and artifact schemas:
- MAJOR: breaking schema/workflow changes
- MINOR: additive non-breaking changes
- PATCH: clarifications/fixes

## Artifact Schema Versioning
Add a schema header to key artifacts:
- `DOSSIER_SCHEMA_VERSION`
- `VOICE_PROFILE_SCHEMA_VERSION`
- `CONTINUITY_SCHEMA_VERSION`

## Migration Rules
- Breaking change requires migration notes and example mapping.
- Do not remove required fields without migration instructions.
- Keep one previous schema supported during transition.
