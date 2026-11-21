// F-22 workbook check: probe the skills a workbook page depends on, stepping back to prerequisites
// when she does not have one, then aim practice along the path to the page. Pure, no DOM.
import { newSkillState, pickFocus } from './model';
import { LADDER, SK } from './skills';
import type { Profile, Stage, WorkbookGoal } from './types';

export const CHECK_MAX = 16;
export const CHECK_PER_SKILL = 2;

const byLadder = (a: string, b: string) => LADDER.indexOf(a) - LADDER.indexOf(b);

/** Valid, unique skill ids in teaching order. */
export function cleanSkillIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((x): x is string => typeof x === 'string' && !!SK[x]))].sort(byLadder);
}

export function newWorkbookGoal(skills: string[], at = Date.now()): WorkbookGoal {
  return { at, skills: cleanSkillIds(skills), checkedAt: 0, results: {} };
}

export interface Check {
  queue: string[];
  probed: Record<string, 'pass' | 'fail'>;
  cur: string | null;
  firstOk: boolean | null;
  asked: number;
}

export function checkInit(skills: string[]): Check {
  return { queue: cleanSkillIds(skills), probed: {}, cur: null, firstOk: null, asked: 0 };
}

/** The next probe: a numbers-level question on the current skill, or null when the check is over. */
export function checkNext(C: Check): { skill: string; stage: Stage } | null {
  if (C.asked >= CHECK_MAX) return null;
  if (C.cur === null) {
    while (C.queue.length && C.probed[C.queue[0]]) C.queue.shift();
    const next = C.queue.shift();
    if (!next) return null;
    C.cur = next; C.firstOk = null;
  }
  return { skill: C.cur, stage: 2 };
}

/** Record one answer. Two right in a row passes a skill; a wrong answer fails it and queues its prerequisites first. */
export function checkRecord(C: Check, ok: boolean): void {
  if (C.cur === null) return;
  C.asked++;
  const id = C.cur;
  if (ok && C.firstOk === null && CHECK_PER_SKILL > 1) { C.firstOk = true; return; }
  if (ok) C.probed[id] = 'pass';
  else {
    C.probed[id] = 'fail';
    const back = SK[id].pre.filter(pid => !C.probed[pid] && !C.queue.includes(pid)).sort(byLadder);
    C.queue.unshift(...back);
  }
  C.cur = null; C.firstOk = null;
}

/** Ancestors of the goal skills (prerequisites, transitively), plus the skills themselves. */
export { goalPathOf as goalPath } from './model';

export function workbookActive(p: Profile): boolean { return !!(p.workbook && p.workbook.skills.length); }
export function workbookReady(p: Profile): boolean { return workbookActive(p) && p.workbook!.skills.every(id => p.skills[id].mastered); }

/** Apply the check: passed skills lit, failed skills reopened at pictures level, focus on the path. */
export function checkApply(p: Profile, C: Check, now = Date.now()): void {
  for (const [id, r] of Object.entries(C.probed)) {
    const s = p.skills[id];
    if (r === 'pass') {
      if (!s.mastered) { s.mastered = true; s.stage = 2; s.best = 2; s.pL = [Math.max(s.pL[0], 0.95), Math.max(s.pL[1], 0.92), Math.max(s.pL[2], 0.92)]; s.masteredAt = now; }
    } else {
      const fresh = newSkillState();
      s.mastered = false; s.stage = 1; s.best = Math.max(s.best, 1);
      s.pL[1] = Math.min(s.pL[1] || fresh.pL[1], 0.6); s.pL[2] = Math.min(s.pL[2], 0.3);
      s.visit = [0, 0, 0]; s.recent = [[], [], []];
    }
  }
  if (p.workbook) { p.workbook.checkedAt = now; p.workbook.results = { ...C.probed }; }
  p.focus = null; pickFocus(p);
}
