---
name: combine-prs
description: Combine multiple PRs into one main PR with combined description
---

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
