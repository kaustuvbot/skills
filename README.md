# @kaustuv/skills

Personal Claude Code and Codex skills installer. Install skills by name, group, or project with a single `npx` command.

## Install

No global install needed — use `npx`:

```bash
npx @kaustuv/skills <command>
```

## Commands

```bash
npx @kaustuv/skills list                       # Show all projects, groups, and skills
npx @kaustuv/skills install --project hostby   # Install all skills for a project
npx @kaustuv/skills install --group pr-ops      # Install all skills in a group
npx @kaustuv/skills install premrg-validate     # Install one skill
npx @kaustuv/skills update                      # Check for a newer version
```

## Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--project` | project name | — | Install all skills required by a project |
| `--group` | group name | — | Install all skills in a group |
| `--level` | `repo`, `user` | `repo` | `repo` installs into `.claude/skills/` in current directory. Use `--level user` to install globally into `~/.claude/skills/` |
| `--tool` | `claude`, `codex`, `all` | `all` | Target tool. Skipped silently if not installed. |

### Examples

```bash
# Install all skills for a project (repo level, default)
npx @kaustuv/skills install --project hostby

# Install all skills in a group (repo level, default)
npx @kaustuv/skills install --group pr-ops

# Install one skill at user level (global)
npx @kaustuv/skills install premrg-validate --level user

# Install for Codex only
npx @kaustuv/skills install --group pm-ops --tool codex

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

### pm-ops

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
| `hostby` | pr-ops, pm-ops | Hostby project skills |

## How users discover skills

The npm page (`https://www.npmjs.com/package/@kaustuv/skills`) shows the full README — including all groups, skills, and descriptions. Running `npx @kaustuv/skills list` also lists everything locally.

Each skill's `description` field in `registry.json` is what Claude Code reads to decide when to trigger the skill — so keep it specific and match the skill file's own description.

## Adding Skills

1. Add a directory under `skills/<group>/<skill-name>/` with a `SKILL.md`
2. Register it in `registry.json` (add to the group's `skills` array and add a `skills.<name>` entry)
3. Bump the version in `package.json` and `npm publish`

## Skill file format

Each skill lives at `skills/<group>/<skill-name>/SKILL.md`:

```yaml
---
name: skill-name
description: When to trigger, what it does. Be specific — this is how Claude Code decides to use it.
---

# Skill Title

## Purpose
...

## Steps
...
```

Skills can belong to multiple groups by adding the skill name to each group's `skills` array in `registry.json`, pointing at the same `path`.