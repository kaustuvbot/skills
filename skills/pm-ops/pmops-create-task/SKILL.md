---
name: pmops-create-task
description: Create a repo task row and task file under docs/ops
---

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
