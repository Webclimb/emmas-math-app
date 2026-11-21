// Placement warm-up (spec F-8): v1 binary search along the 14-step ladder, two numbers-level
// questions per probe. Strand-based placement replaces this in M3 (F-8.AC-2, CHANGE).
import { newSkillState, pickFocus } from './model';
import { LADDER } from './skills';
import type { Placement, Profile, Stage } from './types';

export const PLACEMENT_MAX = 12;

export function placementInit(): Placement { return { lo: 0, hi: LADDER.length - 1, mid: null, asked: 0, firstOk: null, tested: {} }; }

export function placementNext(P: Placement): { skill: string; stage: Stage } | null {
  if (P.lo > P.hi || P.asked >= PLACEMENT_MAX) return null;
  if (P.mid === null) P.mid = Math.floor((P.lo + P.hi) / 2);
  return { skill: LADDER[P.mid], stage: 2 };
}

export function placementRecord(P: Placement, ok: boolean): void {
  P.asked++; const id = LADDER[P.mid!];
  if (P.firstOk === null) {
    if (ok) { P.firstOk = true; return; }
    P.tested[id] = 'fail'; P.hi = P.mid! - 1; P.mid = null; P.firstOk = null; return;
  }
  if (ok) { P.tested[id] = 'pass'; P.lo = P.mid! + 1; } else { P.tested[id] = 'fail'; P.hi = P.mid! - 1; }
  P.mid = null; P.firstOk = null;
}

/** Marks every ladder skill below the entry point as mastered (v1 behaviour). Returns the entry index. */
export function placementApply(p: Profile, P: Pick<Placement, 'lo' | 'tested'>): number {
  const start = P.lo;
  LADDER.forEach((id, i) => {
    const s = newSkillState();
    if (i < start) { s.mastered = true; s.stage = 2; s.best = 2; s.pL = [0.95, 0.92, P.tested[id] === 'pass' ? 0.92 : 0.88]; s.masteredAt = Date.now(); }
    p.skills[id] = s;
  });
  p.placementDone = true; p.focus = null; pickFocus(p); return start;
}
