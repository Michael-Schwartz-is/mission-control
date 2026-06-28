# Task Provenance And Activity Log Plan

## Goal

Make every task explain who created it, when it changed, how it entered the system, and what source material justified it. This must work for human UI edits and agent/API writes.

## Data Model

### Task Metadata

Add optional fields to tasks so legacy rows stay valid:

- `createdByUserId`
- `createdByName`
- `createdByEmail`
- `createdVia`: `web`, `api`, `import`, `agent`, or `legacy`
- `updatedAt`
- `completedAt`
- `sourceRefIds`

Keep existing `createdAt`.

### Source Storage

Add `sourceArtifacts` for stored evidence:

- uploaded file storage id
- title, filename, mime type
- optional URL
- text preview
- checksum
- creator metadata
- creation source and timestamp

Use Convex file storage for file bodies. Store metadata in `sourceArtifacts`.

### Source References

Add `sourceRefs` as precise pointers into source artifacts:

- `artifactId`
- target type/id, such as task or project
- label
- optional quote
- optional path and line range
- optional timestamp range
- confidence

`sourceRef` is the pointer. `sourceArtifact` is the stored evidence.

### Events

Add `taskEvents`:

- `taskCreated`
- `taskUpdated`
- `statusChanged`
- `priorityChanged`
- `completed`
- `taskDeleted`
- `imported`

Each event stores actor, source, timestamp, optional before/after values, and optional `sourceRefId`.

### Operations

Add `operations` for bulk work:

- `bulkImport`
- `agentPopulate`
- `manualBatch`
- `migration`

Each operation stores actor, source, timestamp, summary, counts, and optional source artifact id.

## Implementation Slices

1. Add schema and backend helpers with optional fields only.
2. Write task events from web mutations and HTTP imports.
3. Show compact metadata on task cards and task dialog.
4. Add task activity timeline in dialog.
5. Add source artifact upload and source reference attachment UI.
6. Add project-level activity view and filters.
7. Add non-destructive backfill tool that marks existing tasks as `legacy`.

## Safety Rules

- Do not delete existing rows during provenance rollout.
- Do not run bulk import or migration without explicit approval.
- Keep all new task fields optional until backfill is reviewed.
- Preserve current API response shape while adding optional metadata.
