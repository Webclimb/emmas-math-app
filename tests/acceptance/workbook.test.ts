// F-22 workbook check (milestone MW): the engine side. UI criteria are in tests/ui/workbook.spec.ts.
import { describe, expect, test } from 'vitest';
import * as E from '../../src/engine';
import type { Profile } from '../../src/engine';
import { cleanReading, workbookPrompt } from '../../src/app/workbook';

const LADDER_SKILLS = E.LADDER;
/** A learner with the given skills lit. */
function learner(lit: string[]): Profile {
  const p = E.newProfile('Robin', 'frame:square');
  for (const id of lit) Object.assign(p.skills[id], { mastered: true, stage: 2, best: 2, pL: [0.95, 0.93, 0.92] });
  p.placementDone = true;
  return p;
}
/** Runs a check with an answer rule; returns the questions asked, in order. */
function runCheck(C: E.Check, knows: (skill: string) => boolean): string[] {
  const asked: string[] = [];
  for (let guard = 0; guard < 50; guard++) {
    const it = E.checkNext(C); if (!it) break;
    expect(it.stage).toBe(2);
    asked.push(it.skill);
    E.checkRecord(C, knows(it.skill));
  }
  return asked;
}

describe('F-22 workbook check', () => {
  test('test_F22_AC4: two numbers-level questions per skill, in teaching order, stepping back to prerequisites, at most 16', () => {
    // She knows everything: two questions on each confirmed skill, teaching order, nothing else.
    let C = E.checkInit(['divfacts', 'multmeaning']);
    expect(runCheck(C, () => true)).toEqual(['multmeaning', 'multmeaning', 'divfacts', 'divfacts']);
    expect(C.probed).toEqual({ multmeaning: 'pass', divfacts: 'pass' });
    // She doesn't know division facts: its prerequisites are checked next, one skill at a time.
    C = E.checkInit(['divfacts']);
    const asked = runCheck(C, id => id !== 'divfacts');
    expect(asked[0]).toBe('divfacts');
    expect(C.probed.divfacts).toBe('fail');
    expect(asked.slice(1)).toEqual(['multeasy', 'multeasy', 'divmeaning', 'divmeaning']);
    // A wrong first answer ends that skill's probe at once (no second question).
    expect(asked.filter(x => x === 'divfacts')).toHaveLength(1);
    // Knows nothing: steps back toward fundamentals and stops at 16 questions.
    C = E.checkInit(['multhard', 'fractions']);
    const all = runCheck(C, () => false);
    expect(all.length).toBeLessThanOrEqual(E.CHECK_MAX);
    expect(E.CHECK_MAX).toBe(16);
    for (let i = 1; i < all.length; i++) {
      // Each newly probed skill after a failure is a prerequisite of something already failed, or a confirmed skill.
      const id = all[i], failed = Object.keys(C.probed).filter(k => C.probed[k] === 'fail');
      expect(['multhard', 'fractions'].includes(id) || failed.some(f => E.SK[f].pre.includes(id)), id).toBe(true);
    }
    // Stepping back reaches the first fundamental, Seeing amounts.
    expect(C.probed.quantity).toBe('fail');
    // Unknown ids are ignored.
    expect(E.checkInit(['nope', 'quantity']).queue).toEqual(['quantity']);
  });

  test('test_F22_AC5: passed skills light, failed skills reopen at pictures level, focus is the earliest unlit skill on the path', () => {
    const p = learner(LADDER_SKILLS.slice(0, 8)); // up to and including × 2, 5, 10
    p.workbook = E.newWorkbookGoal(['divfacts']);
    const C = E.checkInit(p.workbook.skills);
    runCheck(C, id => id !== 'divfacts' && id !== 'divmeaning');
    E.checkApply(p, C, 1_700_000_000_000);
    expect(p.workbook.checkedAt).toBe(1_700_000_000_000);
    expect(p.workbook.results).toEqual(C.probed);
    expect(p.skills.divfacts.mastered).toBe(false);
    expect(p.skills.divfacts.stage).toBe(1);
    expect(p.skills.divmeaning.mastered).toBe(false);
    expect(p.skills.divmeaning.stage).toBe(1);
    expect(p.skills.multeasy.mastered).toBe(true);
    // divmeaning comes before divfacts on the path; its prerequisites are lit, so it is the focus.
    expect(E.pickFocus(p)).toBe('divmeaning');
    // A skill she passes but had not lit before becomes lit.
    const q = learner([]);
    q.workbook = E.newWorkbookGoal(['quantity']);
    const C2 = E.checkInit(['quantity']); runCheck(C2, () => true); E.checkApply(q, C2);
    expect(q.skills.quantity.mastered).toBe(true);
    // A lit skill she fails is reopened.
    const r = learner(['quantity', 'numberline']);
    r.workbook = E.newWorkbookGoal(['numberline']);
    const C3 = E.checkInit(['numberline']); runCheck(C3, id => id === 'quantity'); E.checkApply(r, C3);
    expect(r.skills.numberline.mastered).toBe(false);
    expect(r.skills.numberline.stage).toBe(1);
    expect(E.pickFocus(r)).toBe('numberline');
  });

  test('test_F22_AC6: practice follows the path to the goal, favours goal skills in review once lit, and returns to normal when cleared', () => {
    E.seed(4);
    const p = learner(LADDER_SKILLS.slice(0, 6)); // through Taking away
    // Without a goal the next stop is Equal groups (teaching order).
    expect(E.pickFocus(p)).toBe('multmeaning');
    // Goal: Fractions (needs Sharing equally, which needs Equal groups and Taking away).
    p.focus = null; p.workbook = E.newWorkbookGoal(['fractions']); p.workbook.checkedAt = 1;
    const path = E.goalPath(['fractions']);
    for (let i = 0; i < 300; i++) {
      const it = E.nextItem(p, { i });
      if (!it) break;
      if (!it.review) expect(path.has(it.skill), it.skill).toBe(true);
      E.record(p, it.skill, it.stage, E.random() < 0.9, { G: 0.25, review: it.review });
      if (p.skills.fractions.mastered) break;
    }
    expect(p.skills.fractions.mastered).toBe(true);
    expect(E.workbookReady(p)).toBe(true);
    // Once lit, reviews pick the goal's skills.
    for (let i = 3; i < 40; i += 4) { const it = E.nextItem(p, { i })!; if (it.review) expect(it.skill).toBe('fractions'); }
    // Her own choice of an open skill still wins (F-15.AC-3).
    const q = learner(LADDER_SKILLS.slice(0, 6)); q.workbook = E.newWorkbookGoal(['fractions']);
    q.focus = 'numberline'; // not open (lit) -> ignored
    expect(E.pickFocus(q)).toBe('multmeaning');
    // Cleared goal: back to teaching order.
    q.workbook = null; q.focus = null;
    expect(E.pickFocus(q)).toBe('multmeaning');
  });

  test('test_F22_AC3: the request to Claude holds the skill map only, never learner data', () => {
    const prompt = workbookPrompt();
    for (const s of E.SKILLS) expect(prompt).toContain(`"id":"${s.id}"`);
    const p = learner(['quantity']);
    for (const leak of [p.name, p.id, 'Robin', 'gems', 'focus']) expect(prompt).not.toContain(leak);
    expect(prompt).toMatch(/do not copy any names, school, teacher/i);
  });

  test('test_F22_AC7: Claude only names skills: anything else in its reply is dropped, and questions come from the tested generators', () => {
    const r = cleanReading({ topic: '  Dividing\nby 1-digit   numbers ', skills: ['divfacts', 'bogus', 7, 'divfacts', 'multhard'], beyond: ['long division', 3, 'x'.repeat(200)], answers: [1, 2, 3], questions: ['What is 6 × 7?'] });
    expect(r).toEqual({ topic: 'Dividing by 1-digit numbers', skills: ['divfacts', 'multhard'], beyond: ['long division', 'x'.repeat(60)] });
    expect(Object.keys(r).sort()).toEqual(['beyond', 'skills', 'topic']);
    expect(cleanReading('not json')).toEqual({ topic: '', skills: [], beyond: [] });
    expect(workbookPrompt()).toMatch(/Do not solve the exercises/);
    // Every check item is a (skill, level) the generators already cover.
    const C = E.checkInit(['fractions', 'multhard']);
    for (let i = 0; i < 20; i++) { const it = E.checkNext(C); if (!it) break; expect(E.GEN[it.skill][it.stage]).toBeTypeOf('function'); E.checkRecord(C, i % 3 !== 0); }
  });
});
