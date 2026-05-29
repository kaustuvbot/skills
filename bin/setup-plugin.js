#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';

function isAvailable(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(cmd, silent = false) {
  try {
    execSync(cmd, { stdio: silent ? 'ignore' : 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function installDep(dep) {
  console.log(chalk.cyan(`\n# Installing ${dep} dependency...`));
  switch (dep) {
    case 'uv':
      if (isAvailable('curl')) {
        return run('curl -LsSf https://astral.sh/uv/install.sh | sh');
      } else if (isAvailable('brew')) {
        return run('brew install uv');
      } else if (isAvailable('pip')) {
        return run('pip install uv');
      }
      return false;
    case 'go':
      console.log(chalk.yellow('  go not found and auto-install not supported. Install from https://go.dev/dl'));
      return false;
    default:
      return false;
  }
}

async function installPlugin(name, cmd) {
  const match = cmd.match(/^(npm|uv|pip|npx|go|curl)/);
  if (!match) {
    console.log(chalk.red(`Unknown install command for ${name}: ${cmd}`));
    return false;
  }

  const primary = match[1];
  const deps = [];

  // Detect required dependencies per command prefix
  if (cmd.startsWith('uv ') && !isAvailable('uv')) deps.push('uv');
  if (cmd.startsWith('go ') && !isAvailable('go')) deps.push('go');

  // Try installing deps first
  for (const dep of deps) {
    const ok = installDep(dep);
    if (!ok) {
      console.log(chalk.yellow(`⚠ ${dep} not available — ${name} install may fail`));
    }
  }

  // Retry tool check after installing deps
  if (cmd.startsWith('uv ') && !isAvailable('uv')) {
    console.log(chalk.yellow(`⚠ uv still not found after install attempt — ${name} skipped`));
    return false;
  }
  if (cmd.startsWith('go ') && !isAvailable('go')) {
    console.log(chalk.yellow(`⚠ go still not found — ${name} skipped`));
    return false;
  }

  // Run the install
  console.log(chalk.cyan(`\n# Installing ${name}...`));
  console.log(chalk.dim(`  ${cmd}`));
  const ok = run(cmd);
  if (ok) {
    console.log(chalk.green(`✓ ${name} installed`));
  } else {
    console.log(chalk.yellow(`⚠ ${name} install failed`));
  }
  return ok;
}

const [,, name, ...cmdParts] = process.argv;
if (!name || !cmdParts.length) {
  console.error('Usage: node setup-plugin.js <plugin-name> "<install-command>"');
  process.exit(1);
}

const cmd = cmdParts.join(' ');
installPlugin(name, cmd).then(ok => process.exit(ok ? 0 : 1));