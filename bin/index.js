#!/usr/bin/env node
import { execSync } from 'child_process';
import { program } from 'commander';
import chalk from 'chalk';
import { loadRegistry, resolveSkills, getRepoRoot } from '../lib/registry.js';
import { installClaude } from '../lib/install-claude.js';
import { installCodex } from '../lib/install-codex.js';
import { checkForUpdate, printUpdateNotice } from '../lib/updater.js';

function isToolInstalled(tool) {
  try {
    execSync(`which ${tool}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function runInstall(skillName, opts) {
  const registry = loadRegistry();
  const repoRoot = getRepoRoot();
  const skills = resolveSkills(registry, { skill: skillName, group: opts.group, project: opts.project });
  const level = opts.level || 'user';
  const tool = opts.tool || 'all';

  const useClaude = (tool === 'all' || tool === 'claude') && isToolInstalled('claude');
  const useCodex = (tool === 'all' || tool === 'codex') && isToolInstalled('codex');

  if (!useClaude && !useCodex) {
    if (tool === 'all') {
      console.log(chalk.yellow('Neither claude nor codex found in PATH. Nothing installed.'));
    } else {
      console.log(chalk.yellow(`${tool} not found in PATH. Skipping.`));
    }
    return;
  }

  const names = skills.map(s => chalk.cyan(s.name)).join(', ');
  console.log(`Installing ${names} at ${chalk.bold(level)} level...`);

  if (useClaude) {
    const dest = await installClaude(skills, { level, repoRoot });
    console.log(chalk.green(`✓ Claude: ${dest}`));
  } else if (tool === 'claude') {
    console.log(chalk.yellow('claude not found in PATH, skipping.'));
  }

  if (useCodex) {
    const dest = await installCodex(skills, { level, repoRoot });
    console.log(chalk.green(`✓ Codex: ${dest}`));
  } else if (tool === 'codex') {
    console.log(chalk.yellow('codex not found in PATH, skipping.'));
  }

  const update = await checkForUpdate(chalk);
  if (update) printUpdateNotice(update, chalk);
}

program
  .name('skills')
  .description('Install personal Claude/Codex skills')
  .version('1.0.0');

program
  .command('install [skill-name]')
  .description('Install a skill, group, or all skills for a project')
  .option('-g, --group <name>', 'Install all skills in a group')
  .option('-p, --project <name>', 'Install all skills required by a project')
  .option('-l, --level <level>', 'Installation level: repo (default) or user (~/.claude/skills/)', 'repo')
  .option('-t, --tool <tool>', 'Target tool: claude, codex, or all', 'all')
  .action(async (skillName, opts) => {
    if (!skillName && !opts.group && !opts.project) {
      console.error(chalk.red('Specify a skill name, --group <name>, or --project <name>'));
      process.exit(1);
    }
    try {
      await runInstall(skillName, opts);
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available projects, groups, and skills')
  .action(() => {
    const registry = loadRegistry();

    if (registry.projects && Object.keys(registry.projects).length > 0) {
      console.log(chalk.bold('\nProjects:\n'));
      for (const [name, project] of Object.entries(registry.projects)) {
        console.log(chalk.magenta(`[${name}]`) + chalk.dim(` — ${project.description}`));
        console.log(chalk.dim(`  groups: ${project.groups.join(', ')}`));
      }
    }

    console.log(chalk.bold('\nGroups & skills:\n'));
    for (const [groupName, group] of Object.entries(registry.groups)) {
      console.log(chalk.yellow(`[${groupName}]`) + chalk.dim(` — ${group.description}`));
      if (group.skills.length === 0) {
        console.log(chalk.dim('  (no skills yet)'));
      }
      for (const skillName of group.skills) {
        const s = registry.skills[skillName];
        console.log(`  ${chalk.cyan(skillName)} — ${s.description}`);
      }
      console.log();
    }
  });

program
  .command('update')
  .description('Check for the latest version')
  .action(async () => {
    const update = await checkForUpdate(chalk);
    if (update) {
      console.log(chalk.yellow(`Updating ${update.name} from ${update.current} to ${update.latest}...`));
      console.log(chalk.dim(`Run: npx ${update.name}@latest install --project <name>`));
    } else {
      console.log(chalk.green('Already up to date.'));
    }
  });

// Show help when no command given
if (process.argv.length <= 2) {
  console.log(`
${chalk.bold('@kaustuv/skills')} — personal Claude/Codex skill installer

${chalk.bold('Usage:')}
  npx @kaustuv/skills <command> [options]

${chalk.bold('Commands:')}
  ${chalk.cyan('list')}                         Show all projects, groups, and skills
  ${chalk.cyan('install')} <skill|--group|--project>  Install skills
  ${chalk.cyan('update')}                       Check for a newer version

${chalk.bold('Install examples:')}
  npx @kaustuv/skills install --project hostby          ${chalk.dim('# all skills for a project (repo level)')}
  npx @kaustuv/skills install --group pr-ops            ${chalk.dim('# all skills in a group (repo level)')}
  npx @kaustuv/skills install premrg-validate           ${chalk.dim('# single skill (repo level)')}

${chalk.bold('Flags:')}
  ${chalk.cyan('--level repo')}   Install into .claude/skills/ in current directory ${chalk.green('(default)')}
  ${chalk.cyan('--level user')}   Install globally into ~/.claude/skills/
  ${chalk.cyan('--tool claude')}  Claude Code only
  ${chalk.cyan('--tool codex')}   Codex CLI only
  ${chalk.cyan('--tool all')}     Both tools (default, skips missing ones)

${chalk.dim('Docs: https://www.npmjs.com/package/@kaustuv/skills')}
`);
  process.exit(0);
}

program.parse();
