// Port of the v1 learner simulations in source/tests/engine_test.js. v1 printed the outcomes; here the
// v1 outcomes are asserted so a regression shows. The fuller simulation criterion is F-7.AC-7 (milestone M1).
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as E from '../../src/engine';
import type { Profile, Stage } from '../../src/engine';

function simulate(seed: number, pCorrect: (sk: string, st: Stage, p: Profile) => number, steps: number) {
  E.seed(seed);
  const p = E.newProfile('Test', '🦊'), P = E.placementInit();
  let guard = 0;
  for (;;) { const it = E.placementNext(P); if (!it || guard++ > 20) break; E.placementRecord(P, E.random() < pCorrect(it.skill, 2, p)); }
  E.placementApply(p, P);
  const sess = { i: 0 }, events: Record<string, number> = {};
  for (let t = 0; t < steps; t++) {
    const it = E.nextItem(p, sess); if (!it) break;
    const q = E.makeQuestion(it.skill, it.stage, false);
    const ok = E.random() < pCorrect(it.skill, it.stage, p);
    E.record(p, it.skill, it.stage, ok, { G: E.guessFor(q), review: it.review }).forEach(e => events[e.type] = (events[e.type] || 0) + 1);
    sess.i++;
  }
  return { start: E.LADDER[P.lo], mastered: E.SKILLS.filter(s => p.skills[s.id].mastered).length, p, events };
}
const idx = (id: string) => E.LADDER.indexOf(id);

// Reviews pick the least recently seen skill, so answers need distinct times: a simulated clock keeps runs deterministic.
let clock = 0;
beforeEach(() => { clock = 1_700_000_000_000; vi.spyOn(Date, 'now').mockImplementation(() => (clock += 30_000)); });
afterEach(() => { vi.restoreAllMocks(); });

describe('v1 learner simulations', () => {
  test('a strong learner (95% right) masters all 14 skills', () => {
    for (const seed of [1, 2, 3]) expect(simulate(seed, () => 0.95, 800).mastered).toBe(14);
  });

  test('an uneven learner (fine to subtraction, weak beyond until practised) masters all skills within 1500 answers', () => {
    for (const seed of [1, 2, 3]) {
      const r = simulate(seed, (sk, st, p) => {
        const base = idx(sk) <= idx('subtraction') ? 0.85 : 0.5, stageBoost = [0.25, 0.1, 0][st];
        const practice = Math.min(0.3, p.skills[sk].att.reduce((a, b) => a + b, 0) * 0.01);
        return Math.min(0.97, base + stageBoost + practice);
      }, 1500);
      expect(r.mastered).toBe(14);
      expect(r.events.down || 0).toBeGreaterThan(0); // she was moved down at least once on the way
    }
  });

  test('a struggling learner (55/40/30% by level) masters nothing and stays on the first skill', () => {
    for (const seed of [1, 2, 3]) {
      const r = simulate(seed, (_sk, st) => [0.55, 0.4, 0.3][st], 600);
      expect(r.start).toBe('quantity');
      expect(r.mastered).toBe(0);
      expect(r.p.focus).toBe('quantity');
    }
  });
});
