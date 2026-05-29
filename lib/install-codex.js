import { readFileSync, existsSync } from 'fs';
import pkg from 'fs-extra';
const { appendFile, ensureDir, readFile, writeFile } = pkg;
import { join, resolve } from 'path';
import { homedir } from 'os';

export async function installCodex(skills, { level, repoRoot }) {
  const target = level === 'user'
    ? join(homedir(), '.codex', 'instructions.md')
    : join(process.cwd(), 'AGENTS.md');

  if (level === 'user') {
    await ensureDir(join(homedir(), '.codex'));
  }

  for (const skill of skills) {
    const skillMdPath = resolve(repoRoot, skill.path, 'SKILL.md');
    if (!existsSync(skillMdPath)) continue;

    const content = readFileSync(skillMdPath, 'utf8');
    // Strip YAML frontmatter
    const body = content.replace(/^---[\s\S]*?---\n/, '').trim();

    let existing = '';
    if (existsSync(target)) {
      existing = await readFile(target, 'utf8');
    }

    const marker = `<!-- skill:${skill.name} -->`;
    const section = `\n${marker}\n${body}\n${marker}\n`;

    if (existing.includes(marker)) {
      // Replace existing section
      const updated = existing.replace(
        new RegExp(`${marker}[\\s\\S]*?${marker}`, 'g'),
        section.trim()
      );
      await writeFile(target, updated, 'utf8');
    } else {
      await appendFile(target, section, 'utf8');
    }
  }

  return target;
}
