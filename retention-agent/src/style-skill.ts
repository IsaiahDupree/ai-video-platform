import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';
import type { StyleSkill } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, '..', 'config', 'style-skills');

export function loadStyleSkill(id: string): StyleSkill {
  const file = path.join(SKILLS_DIR, `${id}.yaml`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Style skill "${id}" not found at ${file}. Available: ${listStyleSkills().join(', ')}`
    );
  }
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = yaml.load(raw) as StyleSkill;
  validateStyleSkill(parsed);
  return parsed;
}

export function listStyleSkills(): string[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''));
}

function validateStyleSkill(skill: StyleSkill): void {
  if (!skill.id) throw new Error('Style skill missing id');
  if (!skill.section_shape || skill.section_shape.length === 0) {
    throw new Error(`Style skill ${skill.id} has no section_shape`);
  }
  const total = skill.section_shape.reduce((s, e) => s + e.percent, 0);
  if (Math.abs(total - 100) > 0.5) {
    throw new Error(
      `Style skill ${skill.id} section_shape percentages sum to ${total}, must sum to ~100`
    );
  }
  if (!skill.voice?.voice_id) throw new Error(`Style skill ${skill.id} missing voice.voice_id`);
  if (!skill.pacing) throw new Error(`Style skill ${skill.id} missing pacing rules`);
}
