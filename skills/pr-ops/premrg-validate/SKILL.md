---
name: premrg-validate
description: Pre-merge PR validation and review. Validate implementation against acceptance criteria before merge.
---

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
