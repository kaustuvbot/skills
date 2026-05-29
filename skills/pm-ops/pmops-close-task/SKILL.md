---
name: pmops-close-task
description: Mark a tracked task as Done, Blocked, or Cancelled and update the board
---

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
