---
name: db-seed
description: Analyze task plans and append database seed entries required for manual test cases
---

# db-seed

Analyze `.planning/` task plans to find seed requirements for manual test cases, and append seed entries to `apps/api/prisma/seed.ts`.

## Usage

```
/db-seed [task-id] [--execute]
```

**Without `--execute`** (default): report-only — analyze and show what entries would be created, no file changes.

**With `--execute`**: append seed entries directly to `apps/api/prisma/seed.ts`.

If `task-id` is omitted, derives it from current branch name (e.g., `feat/TASK-0080-f-006-08-consultation-call-sessions` → `TASK-0080`).

## Process

### Step 1 — Identify relevant task plans

```
CURRENT_BRANCH=$(git branch --show-current)
PLANNING_DIR=$(git rev-parse --show-toplevel)/.planning
```

Find all plan dirs matching the task ID. Read each `task_plan.md`:
- `## Seed Data` section
- `## Manual tests to run before merge`
- `## Proposed Files` (to cross-reference changed files)

Also scan for cross-references: if the feature involves messaging, also check task plans for related features (e.g., TASK-0044/0045/0046 are all related to messaging).

### Step 2 — Read current seed

Read `apps/api/prisma/seed.ts`:
- Note all entity IDs already created (e.g., `booking_01`, `client_01`, `conv_01`)
- Map which models already have data vs. which are empty
- Note existing sequential ID patterns and time helper usage (`daysAgo()`, `daysFromNow()`)

### Step 3 — Parse requirements

For each relevant task plan:
1. Extract `## Seed Data` specifications — what records to create
2. Extract `## Manual tests to run before merge` — what test data each TC needs
3. Build a map: `{ model: string, gap: string, testCase: string, spec: SeedSpec }`

### Step 4 — Identify gaps

Compare requirements against current seed.ts:
- List models that need new entries
- List which existing entities need new related records (e.g., new message in existing conversation)
- Flag if foreign key targets don't exist in seed (must create those too)

### Step 5 — Generate seed entries

For each gap, generate TypeScript seed entries following the existing seed pattern:
- Deterministic IDs: `msg_01`, `msg_02` for messages, `att_01`, `att_02` for attachments, etc.
- Time offsets via `daysAgo()` / `daysFromNow()` so data stays fresh
- Proper foreign key references to existing seed entities
- Wrap each block in a clearly delimited comment header:

```typescript
// ─── TASK-0044: File sharing seed entries ───
// Required for: TC-0044-001, TC-0044-002, TC-0044-003
// ...

// ─── End TASK-0044 ───
```

Use `upsert` patterns for idempotency where possible (e.g., `prisma.message.upsert`).

### Step 6 — Execute (with `--execute` only)

Use the Edit tool to append generated seed blocks to `apps/api/prisma/seed.ts`.
Place each block after its related existing entries (e.g., CallSession after Conversation, Attachment after Message).

### Step 7 — Verify

After executing:
1. Confirm seed.ts passes `tsx` compile: check there are no syntax errors in appended blocks
2. Run `pnpm db:seed` — should complete without constraint violations
3. If there are FK errors, note which referenced IDs are missing and generate those entries first

## Output

### Report mode (no --execute)

```
## db-seed: TASK-0044

### Seed Gaps Found
| Model | Gap | Manual Test |
|-------|-----|-------------|
| Attachment | No seed rows | TC-0044-001 |
| Message | No multi-attachment messages | TC-0045-001 |

### Seed Entries to Append
[typescript code block]

### Foreign Key Dependencies
| ID | Must Exist In Seed |
|----|-------------------|
| client_01 | YES (exists) |
| conv_01 | YES (exists) |

▶ Run `/db-seed TASK-0044 --execute` to append entries.
```

### Execute mode (with --execute)

```
## db-seed: TASK-0044 — APPLIED

### Entries Appended
- 2x Attachment rows (att_01_image, att_02_document)
- 1x Message with 2 attachments (msg_attachment_test)

### Verification
Run: pnpm db:seed
Then re-run: /premrg-validate [pr-num]
```

## Important

- Do not delete or modify existing seed entries
- Always use upsert (`.upsert({ where: { id }, update: {}, create })`) or createMany for new entries
- Foreign keys must reference IDs that exist in seed — if they don't, generate those entries first
- Time-based fields should use `daysAgo(n)` and `daysFromNow(n)` helpers already in seed.ts
- Label each block clearly with the task ID and test cases it serves
