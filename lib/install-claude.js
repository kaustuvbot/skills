import pkg from 'fs-extra';
const { copy, ensureDir } = pkg;
import { join, resolve } from 'path';
import { homedir } from 'os';

export async function installClaude(skills, { level, repoRoot }) {
  const base = level === 'user'
    ? join(homedir(), '.claude', 'skills')
    : join(process.cwd(), '.claude', 'skills');

  await ensureDir(base);

  for (const skill of skills) {
    const src = resolve(repoRoot, skill.path);
    const dest = join(base, skill.name);
    await copy(src, dest, { overwrite: true });
  }

  return base;
}
