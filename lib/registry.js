import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, '..', 'registry.json');

export function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
}

export function resolveSkills(registry, { skill, group }) {
  if (group) {
    const g = registry.groups[group];
    if (!g) throw new Error(`Group "${group}" not found. Available: ${Object.keys(registry.groups).join(', ')}`);
    return g.skills.map(name => {
      if (!registry.skills[name]) throw new Error(`Skill "${name}" in group "${group}" not found in registry`);
      return { name, ...registry.skills[name] };
    });
  }
  if (skill) {
    const s = registry.skills[skill];
    if (!s) throw new Error(`Skill "${skill}" not found. Available: ${Object.keys(registry.skills).join(', ')}`);
    return [{ name: skill, ...s }];
  }
  throw new Error('Specify --group <name> or a skill name');
}

export function getRepoRoot() {
  return join(__dirname, '..');
}
