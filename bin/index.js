#!/usr/bin/env node
import { execSync } from 'child_process';
import { program } from 'commander';
import chalk from 'chalk';
import { loadRegistry, resolveSkills, getRepoRoot } from '../lib/registry.js';
import { installClaude } from '../lib/install-claude.js';
import { installCodex } from '../lib/install-codex.js';
import { checkForUpdate, printUpdateNotice } from '../lib/updater.js';
import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  const level = opts.level || 'repo';
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

async function execInstall(registry, cmd, label) {
  const pluginKey = Object.entries(registry.plugins || {}).find(([, p]) => p.install === cmd)?.[0] || label;
  const scriptPath = path.join(__dirname, 'setup-plugin.js');
  return new Promise((resolve) => {
    try {
      console.log(chalk.cyan(`\n# Installing ${label}...`));
      execSync(`node "${scriptPath}" "${pluginKey}" "${cmd}"`, { stdio: 'inherit' });
      resolve(true);
    } catch {
      console.log(chalk.yellow(`⚠ ${label} install failed`));
      resolve(false);
    }
  });
}

async function configureCavemanForProject(repoRoot) {
  // Add caveman auto-init hook to .claude/settings.json
  const settingsPath = path.join(repoRoot, '.claude', 'settings.json');
  let settings = {};
  if (await fs.pathExists(settingsPath)) {
    const content = await fs.readFile(settingsPath, 'utf8');
    try { settings = JSON.parse(content); } catch {}
  }

  // Ensure hooks.caveman exists to trigger auto-init
  settings.hooks = settings.hooks || {};
  settings.hooks['session:start'] = settings.hooks['session:start'] || [];
  const hookCmd = 'npx caveman-shrink';
  if (!settings.hooks['session:start'].includes(hookCmd)) {
    settings.hooks['session:start'].push(hookCmd);
  }

  await fs.ensureDir(path.join(repoRoot, '.claude'));
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  console.log(chalk.green('✓ Added caveman session hook to .claude/settings.json'));
}

function printPlugins(registry, projectName) {
  const project = registry.projects?.[projectName];
  if (!project?.plugins?.length) return;

  console.log(chalk.bold('\n3rd-party plugins for this project:\n'));
  for (const pluginKey of project.plugins) {
    const plugin = registry.plugins?.[pluginKey];
    if (!plugin) continue;
    console.log(chalk.magenta(`  ${pluginKey}`) + chalk.dim(` (${plugin.name})`));
    console.log(chalk.dim(`  ${plugin.description}`));
    console.log(chalk.cyan(`  Install: ${plugin.install}`));
    if (plugin.installHint) {
      console.log(chalk.dim(`  Hint:   ${plugin.installHint}`));
    }
    console.log();
  }
}

async function runSetup(projectName, opts) {
  const registry = loadRegistry();
  const repoRoot = getRepoRoot();
  const project = registry.projects?.[projectName];
  if (!project) {
    console.error(chalk.red(`Project "${projectName}" not found. Available: ${Object.keys(registry.projects || {}).join(', ')}`));
    process.exit(1);
  }

  console.log(chalk.bold(`\nSetting up project: ${projectName}\n`));
  console.log(chalk.dim(`${project.description}\n`));

  // Show skills
  const skills = resolveSkills(registry, { project: projectName });
  if (skills.length > 0) {
    console.log(chalk.bold('Skills:'));
    for (const s of skills) {
      console.log(`  ${chalk.cyan(s.name)}`);
    }
    console.log(chalk.dim('Run: ') + chalk.cyan(`npx @kaustuv/skills install --project ${projectName}`) + chalk.dim(' to install them\n'));
  }

  // Show plugins
  if (project.plugins?.length) {
    printPlugins(registry, projectName);

    const response = await prompts({
      type: 'confirm',
      name: 'install',
      message: 'Would you like to install the 3rd-party plugins now?',
      initial: true,
    });

    if (response.install) {
      for (const pluginKey of project.plugins) {
        const plugin = registry.plugins?.[pluginKey];
        if (!plugin) continue;

        if (pluginKey === 'caveman') {
          // Special handling for caveman - install + configure project hook
          const ok = await execInstall(registry, plugin.install, plugin.name);
          if (ok) {
            await configureCavemanForProject(repoRoot);
            console.log(chalk.green('\n✓ Caveman is active. New Claude Code sessions will auto-enable it.'));
          }
        } else {
          await execInstall(registry, plugin.install, plugin.name);
        }
      }
    }
  }
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
      if (opts.project) {
        const registry = loadRegistry();
        const project = registry.projects?.[opts.project];
        if (project?.plugins?.length) {
          printPlugins(registry, opts.project);
          console.log(chalk.dim('Run: ') + chalk.cyan(`npx @kaustuv/skills setup ${opts.project}`) + chalk.dim(' to install them\n'));
        }
      }
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

program
  .command('setup [project-name]')
  .description('Set up a project: install skills, 3rd-party plugins, and configure hooks')
  .action(async (projectName, opts) => {
    if (!projectName) {
      const registry = loadRegistry();
      const names = Object.keys(registry.projects || {});
      if (names.length === 0) {
        console.log(chalk.yellow('No projects defined.'));
        return;
      }
      for (const name of names) {
        await runSetup(name, opts);
      }
      return;
    }
    try {
      await runSetup(projectName, opts);
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
        if (project.plugins?.length) {
          console.log(chalk.dim(`  plugins: ${project.plugins.join(', ')}`));
        }
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

    if (registry.plugins && Object.keys(registry.plugins).length > 0) {
      console.log(chalk.bold('Available plugins:\n'));
      for (const [key, plugin] of Object.entries(registry.plugins)) {
        console.log(chalk.magenta(`  ${key}`) + chalk.dim(` (${plugin.name})`));
        console.log(chalk.dim(`  ${plugin.description}`));
        console.log(chalk.cyan(`  ${plugin.install}`));
        console.log();
      }
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
  ${chalk.cyan('setup')} [project]              Set up project: install skills + 3rd-party plugins
  ${chalk.cyan('update')}                       Check for a newer version

${chalk.bold('Install examples:')}
  npx @kaustuv/skills install --project hostby          ${chalk.dim('# all skills for a project (repo level)')}
  npx @kaustuv/skills install --group pr-ops            ${chalk.dim('# all skills in a group (repo level)')}
  npx @kaustuv/skills install premrg-validate           ${chalk.dim('# single skill (repo level)')}
  npx @kaustuv/skills setup hostby                        ${chalk.dim('# install skills + 3rd-party plugins, configure hooks')}

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