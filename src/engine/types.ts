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
  /** Québec Progression des apprentissages item (F-21.AC-2), for grade-level skills. */
  pda?: string;
}

export interface Misconception { kid: string; parent: string; act: string }

export interface Option { value: string | number; label: string; mis?: string | null }

export type Build =
  | { type: 'tenframe'; frames: number; preset: number; target: number }
  | { type: 'blocks'; target: number; hundreds: boolean }
  | { type: 'nlplace'; min: number; max: number; labels: number[]; target: number; scale?: number }
  | { type: 'jumps'; start: number; target: number; tens: boolean }
  | { type: 'crossout'; n: number; k: number; e: string }
  | { type: 'groups'; a: number; b: number; e: string }
  | { type: 'rows'; target: number; each: number }
  | { type: 'share'; n: number; k: number; e: string }
  | { type: 'makegroups'; n: number; k: number; e: string }
  | { type: 'shade'; n: number; k: number }
  /** F-23: place-value chart with counters per column; target in thousandths. */
  | { type: 'pvchart'; cols: string[]; target: number }
  /** F-23: slide digits with × 10 / ÷ 10 until start × 10^k (k may be negative); values in thousandths. */
  | { type: 'shift'; cols: string[]; start: number; k: number; op: string }
  /** F-23: guided column work, one answer per step (typed, or chosen from choices). */
  | { type: 'steps'; steps: Step[] };

export interface Step {
  /** What she is asked at this step (HTML). */
  prompt: string;
  /** Canonical answer: digits with a comma for decimals, or the chosen choice. */
  answer: string;
  /** If present, she picks one of these instead of typing. */
  choices?: string[];
  /** Shown in the list once the step is right. */
  done: string;
  /** Whether the typed answer may have a comma. */
  decimal?: boolean;
}
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
  /** Typed wrong answer (normalized text) -> pattern id. */
  padMis?: Record<string, string>;
  /** F-23.AC-4: the keypad offers a comma; the answer is a canonical decimal string. */
  decimal?: boolean;
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
  /** F-22: the confirmed workbook goal. Skill ids and dates only. */
  workbook?: WorkbookGoal | null;
}

export interface WorkbookGoal {
  /** When the grown-up confirmed it. */
  at: number;
  /** Confirmed skill ids, in teaching order. */
  skills: string[];
  /** When the learner finished the check; 0 until then. */
  checkedAt: number;
  /** Check results per probed skill. */
  results: Record<string, 'pass' | 'fail'>;
}

export type ModelEvent =
  | { type: 'up' | 'back' | 'down'; skill: string; stage: Stage }
  | { type: 'mastered' | 'refresh'; skill: string }
  | { type: 'prereq'; skill: string; to: string };

export interface Item { skill: string; stage: Stage; review: boolean }

export interface Placement {
  lo: number; hi: number; mid: number | null; asked: number; firstOk: boolean | null; tested: Record<string, 'pass' | 'fail'>;
}
