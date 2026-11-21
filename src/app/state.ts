// Live app state, shared by views and actions. Mirrors v1's globals (APP, prof, S, Cur, UI).
import type { ModelEvent, Placement, Profile, Question } from '../engine/types';
import type { Check } from '../engine/workbook';
import type { Store } from '../storage/store';

export interface Session {
  /** practice, the first-run warm-up, or the F-22 workbook check. */
  mode: 'practice' | 'placement' | 'check';
  n: number; i: number; answered: number; correct: number; gems: number; start: number;
  events: ModelEvent[]; P: Placement | null; early: boolean; downs?: Record<string, number>; C?: Check;
}

// Build-widget working state; fields depend on the widget type.
export interface BuildState {
  done?: boolean; msg?: string | null; tries?: number;
  cells?: number[]; h?: number; t?: number; o?: number; m?: number | null;
  pos?: number; hist?: unknown[]; lo?: number; hi?: number; x?: boolean[];
  a?: number; b?: number; r?: number; plates?: number[]; g?: number; s?: boolean[];
  [k: string]: unknown;
}

export interface Current {
  q: Question; phase: 'answer' | 'feedback'; hinted: boolean; hintShown: boolean; entry: string;
  chosen: number | null; fchosen: number | null; b: BuildState | null; buildMiss: boolean;
  ok?: boolean; mis?: string | null; unsure?: boolean; gain?: number; events?: ModelEvent[];
}

export type Modal =
  | { type: 'event'; ev: ModelEvent }
  | { type: 'confirm'; title: string; text: string; yes: string; act: string }
  | { type: 'star'; id: string }
  | { type: 'chart'; hi: [number, number] | null };

export interface UIState {
  screen: 'boot' | 'welcome' | 'profiles' | 'placeIntro' | 'practice' | 'placed' | 'checked' | 'summary' | 'shop' | 'grown' | 'home';
  modal: Modal | null;
  toast: string | null;
  tmp: { av?: string; name?: string; adding?: boolean; code?: string | null; restore?: Profile | null; gtab?: string; stab?: string; wb?: WorkbookDraft };
}

/** The grown-up's workbook step (F-22). Lives in memory only: never saved. */
export interface WorkbookDraft {
  step: 'start' | 'reading' | 'confirm';
  picks: string[];
  topic?: string;
  beyond?: string[];
  err?: string;
}

export const G = {
  store: null as unknown as Store,
  prof: null as Profile | null,
  S: null as Session | null,
  Cur: null as Current | null,
  UI: { screen: 'boot', modal: null, toast: null, tmp: {} } as UIState,
  /** Whether this view can read workbook photos (null until known). */
  photos: null as boolean | null,
};

/** The current learner. Only call where a learner is guaranteed (every screen after welcome). */
export const P = (): Profile => G.prof!;
export const app = () => G.store.data;
