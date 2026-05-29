---
name: pmops-start-task
description: Claim a tracked task, create its branch, and load its task file
---

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
