---
name: pmops-release-task
description: Move an active task to review and generate task-ID-first PR text
---

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
