---
name: pmops-board-audit
description: Check task-board hygiene, ownership, branches, and dependency drift
---

# Board Audit

Run:

```bash
plugins/pmops/scripts/audit-board.sh
```

- Use this before handoff, before release, and when task drift is suspected.
- Treat audit failures as workflow issues that need explicit cleanup.
