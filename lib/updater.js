import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseVersion(v) {
  return v.replace(/^v/, '').split('.').map(Number);
}

function isNewer(remote, local) {
  const r = parseVersion(remote);
  const l = parseVersion(local);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}

export async function checkForUpdate(chalk) {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    const res = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`);
    if (!res.ok) return null;
    const data = await res.json();
    if (isNewer(data.version, pkg.version)) {
      return { current: pkg.version, latest: data.version, name: pkg.name };
    }
  } catch {
    // network unavailable — silent
  }
  return null;
}

export function printUpdateNotice(update, chalk) {
  console.log(
    chalk.yellow(`\nUpdate available: ${update.current} → ${update.latest}`) +
    chalk.dim(`\nRun: npx ${update.name}@latest\n`)
  );
}
