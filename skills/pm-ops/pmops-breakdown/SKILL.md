---
name: pmops-breakdown
description: Break a vague feature-spec task into 2-4 concrete implementation tasks
---

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
