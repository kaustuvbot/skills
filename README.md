# @kaustuv/skills

Personal Claude Code and Codex skills installer. Install skills by name or group with a single `npx` command.

## Install

No global install needed — use `npx`:

```bash
npx @kaustuv/skills <command>
```

## Commands

### List available skills

```bash
npx @kaustuv/skills list
```

### Install a skill by name

```bash
npx @kaustuv/skills install premrg-validate
```

### Install all skills in a group

```bash
npx @kaustuv/skills install --group personal
```

### Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--project` | project name | — | Install all skills required by a project |
| `--group` | group name | — | Install all skills in a group |
| `--level` | `user`, `repo` | `user` | User-level (`~/.claude/skills/`) or repo-level (`.claude/skills/`) |
| `--tool` | `claude`, `codex`, `all` | `all` | Target tool. Skipped silently if not installed. |

### Examples

```bash
# Install all skills for a project
npx @kaustuv/skills install --project hostby

# Install all skills in a group
npx @kaustuv/skills install --group pr-ops

# Install one skill at repo level
npx @kaustuv/skills install premrg-validate --level repo

# Install for Codex only
npx @kaustuv/skills install --group pmops --tool codex

# Check for updates
npx @kaustuv/skills update
```

## Skills

### personal

| Skill | Description |
|-------|-------------|
| `premrg-validate` | Pre-merge PR validation and review. Validate implementation against acceptance criteria before merge. |

### pr-ops

| Skill | Description |
|-------|-------------|
| `premrg-validate` | Pre-merge PR validation and review. Validate implementation against acceptance criteria before merge. |
| `combine-prs` | Combine multiple PRs into one main PR with combined description |
| `db-seed` | Analyze task plans and append database seed entries required for manual test cases |

### pmops

| Skill | Description |
|-------|-------------|
| `pmops-board-audit` | Check task-board hygiene, ownership, branches, and dependency drift |
| `pmops-breakdown` | Break a vague feature-spec task into 2-4 concrete implementation tasks |
| `pmops-create-task` | Create a repo task row and task file under docs/ops |
| `pmops-handoff-task` | Write a structured handoff for a paused or transferred tracked task |
| `pmops-close-task` | Mark a tracked task as Done, Blocked, or Cancelled and update the board |
| `pmops-start-task` | Claim a tracked task, create its branch, and load its task file |
| `pmops-task-workflow` | Keep one active task, its board row, and its task file aligned during execution |
| `pmops-release-task` | Move an active task to review and generate task-ID-first PR text |

## Projects

| Project | Groups | Description |
|---------|--------|-------------|
| `hostby` | pr-ops, pmops | Hostby project skills |

## Adding Skills

1. Add a directory under `skills/<group>/<skill-name>/` with a `SKILL.md`
2. Register it in `registry.json`
3. Bump the version in `package.json` and `npm publish`
