// Saved-data shape and migrations (spec F-20.AC-1). A v1 save must load in every later version.
import { DEFAULT_SETTINGS, newSkillState } from '../engine/model';
import { SKILLS } from '../engine/skills';
import type { Profile } from '../engine/types';

/** Current schema version. v1 saves carry v:1. Bump and add a step to MIGRATIONS when the shape changes. */
export const SCHEMA_VERSION = 1;
/** The key v1 used; kept so existing saves load. */
export const LS_KEY = 'numbersky.v1';

export interface AppData { v: number; profiles: Record<string, Profile>; current: string | null; updated: number }

export function emptyApp(): AppData { return { v: SCHEMA_VERSION, profiles: {}, current: null, updated: 0 }; }

/** Steps from version n to n+1. Empty while the schema is still v1. */
const MIGRATIONS: Record<number, (d: AppData) => AppData> = {};

/** Bring any saved object up to the current schema. Returns null for something that is not a save. */
export function migrateApp(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<AppData>;
  if (!d.profiles || typeof d.profiles !== 'object') return null;
  let out: AppData = { v: typeof d.v === 'number' ? d.v : 1, profiles: d.profiles, current: d.current ?? null, updated: d.updated || 0 };
  while (out.v < SCHEMA_VERSION) { const step = MIGRATIONS[out.v]; if (!step) break; out = step(out); }
  return out;
}

/** Fill in fields a profile may lack (v1 `migrate`). Called when a profile becomes current. */
export function migrateProfile(p: Profile | null): void {
  if (!p) return;
  SKILLS.forEach(s => {
    if (!p.skills[s.id]) p.skills[s.id] = newSkillState();
    const k = p.skills[s.id];
    if (typeof k.best !== 'number') k.best = k.mastered ? 2 : k.stage;
  });
  p.settings = Object.assign({ ...DEFAULT_SETTINGS }, p.settings || {});
  p.mis = p.mis || {}; p.log = p.log || []; p.sessions = p.sessions || []; p.days = p.days || [];
  p.owned = p.owned || { avatars: [p.avatar], themes: ['marigold'] }; p.theme = p.theme || 'marigold';
  if (typeof p.gems !== 'number') p.gems = 0;
}

/** Backup code (spec F-20.AC-3): the current learner as JSON text. */
export function backupCode(p: Profile): string { return JSON.stringify({ numbersky: 1, profile: p }); }

/** Parse a pasted backup code. Returns the profile, or null if the code is malformed. */
export function parseBackup(text: string): Profile | null {
  let obj: { profile?: Profile } | null = null;
  try { obj = JSON.parse(text.trim()); } catch { return null; }
  if (!obj || typeof obj !== 'object' || !obj.profile || !obj.profile.skills || !obj.profile.id) return null;
  return obj.profile;
}
