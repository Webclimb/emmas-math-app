// Shared engine types. The engine has no DOM access: visuals are HTML/SVG strings.

export type Stage = 0 | 1 | 2;
export type Kind = 'mc' | 'pad' | 'build';

export interface Skill {
  id: string;
  name: string;
  group: string;
  pre: string[];
  /** Grown-up description. */
  about: string;
  /** Learner description. */
  kid: string;
}

export interface Misconception { kid: string; parent: string; act: string }

export interface Option { value: string | number; label: string; mis?: string | null }

export type Build =
  | { type: 'tenframe'; frames: number; preset: number; target: number }
  | { type: 'blocks'; target: number; hundreds: boolean }
  | { type: 'nlplace'; min: number; max: number; labels: number[]; target: number }
  | { type: 'jumps'; start: number; target: number; tens: boolean }
  | { type: 'crossout'; n: number; k: number; e: string }
  | { type: 'groups'; a: number; b: number; e: string }
  | { type: 'rows'; target: number; each: number }
  | { type: 'share'; n: number; k: number; e: string }
  | { type: 'makegroups'; n: number; k: number; e: string }
  | { type: 'shade'; n: number; k: number };
export type BuildType = Build['type'];

export interface Followup { prompt: string; say?: string; options: Option[]; answer: string | number }

/** Arithmetic behind a question, for pattern checks. a op b. */
export interface QMeta { op: '+' | '−' | '×' | '÷'; a: number; b: number }

export interface Question {
  prompt: string;
  say: string | null;
  kind: Kind;
  lead?: string;
  visual: string | null;
  hint: { text: string; visual?: string } | null;
  explain: { text: string; visual?: string };
  options?: Option[];
  answer?: string | number;
  padMis?: Record<number, string>;
  build?: Build;
  followup?: Followup;
  chart?: boolean;
  meta?: QMeta;
  skill: string;
  stage: Stage;
  review?: boolean;
}

export interface SkillState {
  stage: Stage;
  best: number;
  mastered: boolean;
  pL: [number, number, number];
  att: [number, number, number];
  cor: [number, number, number];
  recent: [number[], number[], number[]];
  visit: [number, number, number];
  lastSeen: number;
  masteredAt: number;
}

export interface LogEntry {
  t: number; s: string; g: number; ok: boolean; h?: number; m: string | null; r?: number; u?: number; p?: number;
}

export interface SessionRecord { d: number; n: number; c: number; min: number; m: string }

export interface Settings { sessionLen: number; sound: boolean; autoRead: boolean; chart: boolean; [k: string]: unknown }

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  created: number;
  placementDone: boolean;
  skills: Record<string, SkillState>;
  focus: string | null;
  mis: Record<string, { count: number; last: number }>;
  gems: number;
  owned: { avatars: string[]; themes: string[] };
  theme: string;
  days: string[];
  sessions: SessionRecord[];
  log: LogEntry[];
  settings: Settings;
}

export type ModelEvent =
  | { type: 'up' | 'back' | 'down'; skill: string; stage: Stage }
  | { type: 'mastered' | 'refresh'; skill: string }
  | { type: 'prereq'; skill: string; to: string };

export interface Item { skill: string; stage: Stage; review: boolean }

export interface Placement {
  lo: number; hi: number; mid: number | null; asked: number; firstOk: boolean | null; tested: Record<string, 'pass' | 'fail'>;
}
