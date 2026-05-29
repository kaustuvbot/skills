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
  const skills = resolveSkills(registry, { skill: skillName, group: opts.group });
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

  // Check for updates (non-blocking)
  const update = await checkForUpdate(chalk);
  if (update) printUpdateNotice(update, chalk);
}

program
  .name('skills')
  .description('Install personal Claude/Codex skills')
  .version('1.0.0');

program
  .command('install [skill-name]')
  .description('Install a skill or group of skills')
  .option('-g, --group <name>', 'Install all skills in a group')
  .option('-l, --level <level>', 'Installation level: user or repo', 'user')
  .option('-t, --tool <tool>', 'Target tool: claude, codex, or all', 'all')
  .action(async (skillName, opts) => {
    if (!skillName && !opts.group) {
      console.error(chalk.red('Specify a skill name or --group <name>'));
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
  .description('List all available groups and skills')
  .action(() => {
    const registry = loadRegistry();
    console.log(chalk.bold('\nAvailable skills:\n'));
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
  .description('Update to the latest version')
  .action(async () => {
    const update = await checkForUpdate(chalk);
    if (update) {
      console.log(chalk.yellow(`Updating ${update.name} from ${update.current} to ${update.latest}...`));
      console.log(chalk.dim(`Run: npx ${update.name}@latest install --group <group>`));
    } else {
      console.log(chalk.green('Already up to date.'));
    }
  });

program.parse();
