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
| `--level` | `user`, `repo` | `user` | User-level (`~/.claude/skills/`) or repo-level (`.claude/skills/`) |
| `--tool` | `claude`, `codex`, `all` | `all` | Target tool. Skipped silently if not installed. |

### Examples

```bash
# Install all personal skills for Claude at user level
npx @kaustuv/skills install --group personal

# Install one skill at repo level
npx @kaustuv/skills install premrg-validate --level repo

# Install for Codex only
npx @kaustuv/skills install --group personal --tool codex

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

## Adding Skills

1. Add a directory under `skills/<group>/<skill-name>/` with a `SKILL.md`
2. Register it in `registry.json`
3. Bump the version in `package.json` and `npm publish`
