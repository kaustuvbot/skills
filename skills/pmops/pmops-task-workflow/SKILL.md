---
name: pmops-task-workflow
description: Keep one active task, its board row, and its task file aligned during execution
---

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
