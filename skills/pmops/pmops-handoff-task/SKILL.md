---
name: pmops-handoff-task
description: Write a structured handoff for a paused or transferred tracked task
---

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
