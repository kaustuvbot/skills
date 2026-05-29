
<!-- skill:premrg-validate -->
# Pre-Merge PR Validation

## Purpose

Validate an open PR before merge. Focus: implementation matches acceptance criteria, accurate description, sufficient tests. Use caveman style for output.

## Arguments

`/premrg-validate` — validate current branch's PR (or most recent open PR from current branch).

## Steps

### 1. Get PR context

- `gh pr view --json title,body,number,state,isDraft,additions,deletions,changedFiles,baseRefName --jq '.'`
- Confirm not draft. If draft, warn user.
- Note base branch.

### 2. Get diff

- `gh pr diff <number> --name-only` — list changed files
- `gh pr diff <number>` — full diff (or targeted per file)
- Filter out worktree subproject entries.

### 3. Review PR description

- Check summary against actual diff.
- Flag: AI fluff, vague wording, placeholder tasks, inaccurate claims.
- Propose specific edits. Do not modify without user approval.

### 3b. Write manual validation instructions into PR body

After reviewing, edit the PR description to append per-section manual validation instructions **directly below each checklist section**.

For each section in the PR body (e.g., "### File & Image Sharing", "### Rich File Sharing", "### Message Search"):

1. Find the checklist for that section in the PR body
2. Append a `**Manual validation:**` block directly below that checklist
3. Format: one line per checklist item — exact route, exact action, exact expected result

Example — for "### File & Image Sharing (PR #34)":
```
**Manual validation:**
1. Route: `/client/messages/conv_01` (seeded conversation)
2. Upload image — JPG under 10MB at attachment upload button
3. Expected: image previews inline in chat bubble
4. Upload PDF — at attachment upload button
5. Expected: download row with filename, size, download icon
6. Upload >10MB file — at attachment upload button
7. Expected: error shown — file too large
```

Append these instructions to the PR body via:
```
gh pr edit <number> --body "$(gh pr view <number> --json body --jq '.body' | python3 -c 'import sys,json; d=sys.stdin.read(); print(d + sys.argv[1])' "$NEW_INSTRUCTIONS")"
```

Or use a temp file to build the new body, then `gh pr edit --body-file`.

Do not replace existing PR body content — only append the manual validation block below each checklist section.

### 4. Run automated validation

Run in parallel where possible:

- `pnpm --filter @hostby/web lint`
- `pnpm --filter @hostby/web typecheck`
- `pnpm --filter @hostby/web test`

For each failure: classify as **pre-existing** or **PR-introduced**.

### 5. File review

Read changed implementation files. Summarize in table:

| File | Status | Finding |
|------|--------|---------|
| path/to/file.tsx | OK / ISSUE | brief finding |

### 6. Acceptance criteria validation

For each AC from PR description:

- Compare code against AC.
- Mark: PASS / PARTIAL / FAIL.
- One-line justification.

### 7. .planning validation

Find relevant task plans in `.planning/` based on current branch or changed files:

```
PLANNING_DIR=$(git rev-parse --show-toplevel)/.planning
CURRENT_BRANCH=$(git branch --show-current)
```

- Find matching plan folders by task ID in branch name (e.g., `TASK-0011` matches `*-task-0011-*/task_plan.md`).
- If no direct match, find plans that reference changed files (grep for file paths in task_plan.md).
- Extract acceptance criteria and scope from matched plan(s).

Validate implementation against plan AC:

| Plan | AC | Implementation Status | Gap |
|------|----|-----------------------|-----|
| TASK-0011 | MC can manage up to 10 image entries | PASS/FAIL/PARTIAL | brief |

- Flag if implementation does more than plan scope.
- Flag if plan scope items are missing from implementation.
- Flag if .planning folder exists but implementation diverges significantly.

#### Seed gap detection

After validating AC, check if manual test cases have the data they need:

1. Parse `## Manual tests to run before merge` from each matched task_plan.md
2. For each test case, identify what model/records it requires
3. Cross-reference with `apps/api/prisma/seed.ts` — scan for existing IDs of that model
4. If required data is absent: note as **SEED GAP**

Seed gaps are **pre-condition blockers** — not code bugs. The fix is to run `/db-seed [task-id] --execute`.

Example seed gap detection logic:
```
TC-0044-001 "Upload image attachment" → requires Attachment rows → grep seed.ts for "attachment.create" → NOT FOUND → SEED GAP
TC-0080-001 "Create audio call" → requires CallSession rows → grep seed.ts for "callSession.create" → NOT FOUND → SEED GAP
```

### 8. Manual test instructions

If UI testing required:

- **Startup**: `pnpm dev:local` — starts full stack (web + api + DB + Mailpit). NOT `pnpm dev`.
- Exact route
- Numbered steps
- Exact expected behavior per step

No vague QA instructions. No "verify it works".

### 9. Output

Structured report following caveman style:

```
## PR #NN — [title]

### Automated Tests
| Check | Result | Reason |
|-------|--------|--------|
| lint | PASS/FAIL | concise |
| typecheck | PASS/FAIL | concise |
| test | PASS/FAIL | concise |

Failures: pre-existing vs PR-introduced classification.

### File Review
| File | Status | Finding |
|------|--------|---------|
| ... | OK/ISSUE | ... |

### Acceptance Criteria
- [ ] [AC 1]: PASS / PARTIAL / FAIL — justification
- [ ] [AC 2]: PASS / PARTIAL / FAIL — justification

### .planning Validation
| Plan | Acceptance Criteria | Status | Gap |
|------|---------------------|--------|-----|
| TASK-XXXX | ... | PASS/PARTIAL/FAIL | brief |

Scope check: PASS / FAIL — implementation matches / diverges from plan scope

### Seed Gaps (run /db-seed to resolve)
| Model | Gap | Manual Test |
|-------|-----|-------------|
| ... | ... | ... |

▶ Run: `/db-seed [task-id] --execute` then re-run `/premrg-validate`

### Manual Tests
1. Start full stack: `pnpm dev:local`
2. Route: URL
3. Steps...

### Risks / Blockers
- [risk 1]
- [risk 2]

### Merge Recommendation
READY / READY WITH NOTES / BLOCKED — reason
```

## Output Rules

- Short sections. Short lines.
- PASS / FAIL / PARTIAL clearly.
- Tables for file summaries.
- Short technical justifications.
- Exact commands and routes.
- Only real merge blockers mentioned.
- Distinguish: pre-existing vs PR-introduced.
- Distinguish: **code blockers** vs **SEED GAPS** (pre-condition blockers requiring `/db-seed`)
- No long prose. No PM narratives. No AI fluff.
- Focus: practical merge readiness.
<!-- skill:premrg-validate -->

<!-- skill:combine-prs -->
# Combine PRs

Combines multiple open PRs into a single main PR (the highest-numbered one), updates the main PR description with a combined summary, and closes all other PRs.

## Usage

```
/combine-prs
```

When invoked, you will be asked to confirm the main PR number (defaults to highest open PR).

## Process

1. **Identify PRs**: Find all open PRs on the repo.
2. **Confirm main PR**: The highest-numbered open PR is the main PR. Verify this with the user.
3. **Build combined description**:
   - Add a header explaining this PR combines multiple PRs
   - List each sub-PR with its number, title, and summary
   - Merge all acceptance criteria into one checklist
   - Merge all test plan items into one checklist
   - Add a clear note that sub-PRs are being closed in favor of this combined PR
4. **Update main PR**: Set the body to the combined description.
5. **Close all other PRs**: Close each sub-PR with a comment noting it's closed in favor of the combined PR.
6. **Report**: Confirm all actions taken.

## Sub-PR Description Format

```
### PR #[N]: [Title]
[One-line summary of this PR's changes]
```

## Main PR Combined Description Template

```markdown
# Combined PR — Multi-Feature Merge

This PR combines multiple PRs into a single merge to streamline the review and reduce CI noise.

## Combined PRs

### PR #[N]: [Title]
[Summary]

### PR #[N]: [Title]
[Summary]

## Merged Acceptance Criteria

- [ ] [Criteria from all PRs, deduplicated]

## Merged Test Plan

- [ ] [Test case from all PRs, deduplicated]

## Note

All sub-PRs (#[N], #[N], #[N]) are closed in favor of this combined PR.
```

## Important

- Only close PRs that are open.
- Do not force-push to update PR descriptions — use `gh pr edit`.
- Add a comment to each closed PR noting it's closed in favor of the combined PR.
- If any sub-PR has merge conflicts with main, flag this before closing.
<!-- skill:combine-prs -->

<!-- skill:db-seed -->
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
<!-- skill:db-seed -->

<!-- skill:pmops-board-audit -->
# Board Audit

Run:

```bash
plugins/pmops/scripts/audit-board.sh
```

- Use this before handoff, before release, and when task drift is suspected.
- Treat audit failures as workflow issues that need explicit cleanup.
<!-- skill:pmops-board-audit -->

<!-- skill:pmops-breakdown -->
# Break Down a Feature Task

## Purpose

The task board has high-level feature specs (e.g. "F-003-01 Full-Text Search"). This skill converts one spec into 2–4 scoped, actionable implementation tasks — each with a clear goal, named files, and testable acceptance criteria — then creates them on the board.

## Arguments

`/pmops-breakdown TASK-NNNN`

## Steps

### 1. Read context

Read these files before doing anything:
- `CLAUDE.md`
- `docs/ops/task-index.csv` — find the target task and its current status
- The task file at the path listed in task-index.csv
- `.codex/context/project-architecture.md` — understand the stack
- Any related files in `docs/ops/epics/` or `docs/ai/` if relevant

Also run:
```bash
# Find the next available TASK ID
tail -5 docs/ops/task-index.csv
```

### 2. Analyse the feature spec

Understand what the feature spec is asking for. Consider:
- What already exists in the codebase for this feature? (grep/read relevant files)
- What is NOT yet built?
- What are the natural seams — API endpoint, UI component, integration wiring, test coverage?

### 3. Produce implementation tasks

Break the spec into **2–4 implementation tasks**. Each task must be:

- **One branch, one PR** — scoped to a single developer's work session
- **Concrete** — names specific files, endpoints, or components to touch
- **Testable** — has acceptance criteria you can verify in a browser or with a curl command
- **Not duplicating** existing work — check what's already done

Use this mental model from Phase 2 of the client dashboard:
> Good task: "Wire GET /search to /client/browse page, replace mock data, add loading skeleton"
> Bad task: "Implement search feature"

**Task sizing guide:**
- Small (half-day): single endpoint + single page, or a UI component
- Medium (1 day): API + UI + integration wiring
- Large (2 days): complex state machine, multi-step flow — split further if possible

### 4. Create the tasks

For each implementation task, run:
```bash
# Get next task ID first
python3 -c "
import csv
with open('docs/ops/task-index.csv') as f:
    rows = list(csv.DictReader(f))
    ids = [int(r['id'].replace('TASK-','')) for r in rows if r['id'].startswith('TASK-')]
    print(f'TASK-{max(ids)+1:04d}')
"
```

Then create it:
```bash
bash plugins/pmops/scripts/new-task.sh TASK-NNNN "Implementation task title" Area Priority TASK-XXXX
```

After creating, open the generated task file and fill in:
- `## Goal` — one sentence, what this task delivers
- `## Scope` — in scope / out of scope bullets
- `## Linked Files` — specific files that will be created or modified
- `## Acceptance Criteria` — verifiable checks (curl command, browser nav, typecheck)

### 5. Update the parent spec task

If the parent task (the one being broken down) is still `Todo`, update its `## Notes` section:
```
- Broken down into TASK-XXXX, TASK-YYYY, TASK-ZZZZ on YYYY-MM-DD
```

Do NOT change the parent task status — it stays as a spec anchor.

### 6. Report

List the created tasks with one-line descriptions. Ask the user which one to start first.

## Rules

- Maximum 4 implementation tasks per breakdown. If you need more, the feature is too big — break into two breakdown sessions.
- Do not create tasks for work already done. Check git log and existing pages/endpoints first.
- Do not pad with obvious tasks like "write tests" or "add error handling" unless they are genuinely non-trivial for this feature.
- Each task title must be a verb phrase: "Add X", "Wire Y to Z", "Implement X flow for Y".
- Do not auto-start any task. Report and wait for user to choose.
<!-- skill:pmops-breakdown -->

<!-- skill:pmops-create-task -->
# Create Task

Read:
- `AGENTS.md`
- `docs/ops/task-index.csv`
- matching epic in `docs/ops/epics/`, if relevant

Run:

```bash
plugins/pmops/scripts/new-task.sh TASK-NNNN "Task title" Area Priority [DependsOn]
```

- Create both the board row and the task file together.
- Do not hand-edit the board row unless the script cannot be used.
<!-- skill:pmops-create-task -->

<!-- skill:pmops-handoff-task -->
# Handoff Task

Read:
- `AGENTS.md`
- `docs/ops/task-index.csv`
- active task file

Run:

```bash
plugins/pmops/scripts/handoff-task.sh TASK-NNNN
```

- Leave the board and task file aligned.
- Write the next step clearly.
- Use handoffs for interrupted or transferred work, not for completed tasks.
<!-- skill:pmops-handoff-task -->

<!-- skill:pmops-close-task -->
# Close Task

Read:
- `AGENTS.md`
- `docs/ops/task-index.csv`
- active task file

Run:

```bash
plugins/pmops/scripts/close-task.sh TASK-NNNN [Done|Blocked|Cancelled]
```

Default status is `Review` if no second argument is given.

- Use `Done` only after merge.
- Use `Blocked` when a dependency is unresolved.
- Use `Cancelled` when the task is no longer needed.
- Do not mark Done before the branch is merged.
- Run `/pmops-board-audit` after closing to verify board integrity.
<!-- skill:pmops-close-task -->

<!-- skill:pmops-start-task -->
# Start Task

Read:
- `AGENTS.md`
- `.codex/context/project-architecture.md`
- `docs/ops/task-index.csv`
- target task file

Run:

```bash
plugins/pmops/scripts/start-task.sh TASK-NNNN owner-name
```

- Do not begin meaningful implementation before this script succeeds.
- The task must become `In Progress`.
- The task must have exactly one owner.
- The task branch must exist before implementation starts.
<!-- skill:pmops-start-task -->

<!-- skill:pmops-task-workflow -->
# Task Workflow

Read:
- `AGENTS.md`
- `.codex/context/project-architecture.md`
- `docs/ops/task-index.csv`
- active task file — including Goal, Scope, Linked Files, Acceptance Criteria

Rules:
- Work on one task only.
- Do not start another task from the same branch.
- Keep the task file current at checkpoints.
- Keep the board current when status, owner, or branch changes.
- If the task becomes blocked, record the dependency and reason.

Linked Files:
- Read the `Linked Files` section before making changes.
- Add any newly discovered relevant files to `Linked Files` during the session.

Session Notes:
- At end of session, append to `Notes` (caveman, max 3 bullets):
  - what changed
  - what's next
  - any blockers
- Keep notes minimal — no prose, no summaries, just state.
<!-- skill:pmops-task-workflow -->

<!-- skill:pmops-release-task -->
# Release Task

Read:
- `AGENTS.md`
- `docs/ops/task-index.csv`
- active task file

Run:

```bash
plugins/pmops/scripts/prepare-pr.sh TASK-NNNN
```

- PR title must include the task ID.
- The task should move to `Review`.
- Do not claim the work is ready until validation is complete.
<!-- skill:pmops-release-task -->
