// Milestone MG (D-23): F-23 grade-level decimals and F-8.AC-4 warm-up at grade level, engine side.
// The UI side (comma key, warm-up from the welcome screen) is in tests/ui/mg.spec.ts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import * as E from '../../src/engine';
import type { Profile, Question, Stage } from '../../src/engine';
import { canon, normAnswer, parseM } from '../../src/engine/decimal';

const SPEC = readFileSync(resolve(__dirname, '../../SPEC.md'), 'utf8');
/** The F-23 table rows as the spec writes them: id, Nom, Line, Prerequisites. */
function specTable(): { id: string; name: string; line: string; pre: string[] }[] {
  const sec = SPEC.slice(SPEC.indexOf('### F-23'), SPEC.indexOf('- F-23.AC-1'));
  return sec.split('\n').filter(l => /^\| [a-z]+ \|/.test(l) && !l.startsWith('| id ')).map(l => {
    const c = l.split('|').map(x => x.trim());
    return { id: c[1], name: c[2], line: c[3], pre: c[4].split(',').map(x => x.trim()) };
  });
}
const NEW = specTable().map(r => r.id);
function each(n: number, f: (q: Question, where: string) => void) {
  for (const id of NEW) for (const st of [0, 1, 2] as Stage[]) for (const easy of [true, false]) for (let i = 0; i < n; i++) f(E.makeQuestion(id, st, easy), `${id}[${st}${easy ? 'e' : 'h'}]`);
}

describe('F-23 grade-level decimals', () => {
  test('test_F23_AC1: the eight skills, lines and prerequisites match the spec table, each with its PDA item', () => {
    const rows = specTable();
    expect(rows).toHaveLength(8);
    for (const r of rows) {
      const s = E.SK[r.id];
      expect(s, r.id).toBeDefined();
      expect(s.name, r.id).toBe(r.name);
      expect(s.group, r.id).toBe(r.line);
      expect([...s.pre].sort(), r.id).toEqual([...r.pre].sort());
      expect((s.pda || '').length, `${r.id} PDA`).toBeGreaterThan(10);
      expect(E.LADDER, r.id).toContain(r.id);
    }
    // Prerequisites come earlier in teaching order.
    for (const r of rows) for (const pre of r.pre) expect(E.LADDER.indexOf(pre), `${pre} before ${r.id}`).toBeLessThan(E.LADDER.indexOf(r.id));
  });

  test('test_F23_AC2: three levels; hands-on is a place-value chart or a column layout, never base-ten blocks', () => {
    E.seed(23);
    const HANDS_ON = ['pvchart', 'shift', 'steps'];
    each(40, (q, where) => {
      if (q.stage === 0) {
        expect(q.kind, where).toBe('build');
        expect(HANDS_ON, where).toContain(q.build!.type);
      } else {
        expect(q.kind, where).not.toBe('build');
      }
      // A rod still always means ten (F-3.AC-3): no base-ten blocks in decimal skills.
      const html = [q.prompt, q.visual || '', q.explain.visual || '', q.hint?.visual || ''].join('');
      expect(html, where).not.toMatch(/class="blocks/);
      if (q.stage === 1) expect(!!q.visual || (q.options || []).some(o => /<svg|<table/.test(o.label)), `${where} pictures level shows a picture`).toBe(true);
    });
  });

  test('test_F23_AC3: decimal answers are exact thousandths written with a comma; trailing zeros are accepted', () => {
    E.seed(233);
    let decimals = 0;
    each(150, (q, where) => {
      const answers: string[] = [];
      if (q.kind === 'pad' || q.kind === 'mc') answers.push(String(q.answer));
      if (q.build && q.build.type === 'steps') q.build.steps.forEach(s => answers.push(s.answer));
      for (const a of answers) {
        if (!/^\d/.test(a)) continue; // text choices such as "×"
        expect(a, where).not.toContain('.');
        const m = parseM(a);
        expect(m, `${where} ${a}`).not.toBeNull();
        expect(Number.isInteger(m), `${where} ${a}`).toBe(true);
        expect(canon(m!), where).toBe(a);
        if (a.includes(',')) {
          decimals++;
          expect(normAnswer(a + '0'), `${where} ${a}0`).toBe(normAnswer(a));
          expect(normAnswer(a.replace(',', '.')), where).toBe(normAnswer(a));
        }
      }
    });
    expect(decimals).toBeGreaterThan(500);
    expect(normAnswer('3,50')).toBe(normAnswer('3,5'));
    expect(normAnswer('3,500')).toBe('3,5');
  });

  test('test_F23_AC5: the seven new patterns exist with all three texts and each is detectable', () => {
    const NEW_PATTERNS = ['dec-point', 'dix-diz', 'longer-larger', 'placeholder-zero', 'carry-forgot', 'pv-skip', 'fois-moins'];
    for (const id of NEW_PATTERNS) {
      const m = E.MIS[id];
      expect(m, id).toBeDefined();
      for (const k of ['kid', 'parent', 'act'] as const) expect(m[k].length, `${id}.${k}`).toBeGreaterThan(10);
    }
    E.seed(235);
    const seen = new Set<string>();
    each(150, q => {
      [...(q.options || []), ...(q.followup ? q.followup.options : [])].forEach(o => { if (o.mis) seen.add(o.mis); });
      if (q.padMis) Object.values(q.padMis).forEach(m => seen.add(m));
    });
    expect(NEW_PATTERNS.filter(p => !seen.has(p))).toEqual([]);
  });
});

// ---------- F-8.AC-4 warm-up at grade level ----------
function runCheck(C: E.Check, knows: (skill: string) => boolean): string[] {
  const asked: string[] = [];
  for (let guard = 0; guard < 50; guard++) { const it = E.checkNext(C); if (!it) break; asked.push(it.skill); E.checkRecord(C, knows(it.skill)); }
  return asked;
}
const fresh = (): Profile => E.newProfile('Robin', 'frame:square');

describe('F-8.AC-4 warm-up at grade level', () => {
  test('test_F8_AC4: the warm-up starts at the grade-level skills', () => {
    expect([...E.GRADE_TARGETS].sort()).toEqual(['decimaux', 'multdec', 'probdec']);
    for (const id of E.GRADE_TARGETS) expect(NEW).toContain(id);
    const C = E.checkInit(E.GRADE_TARGETS);
    expect(E.GRADE_TARGETS).toContain(E.checkNext(C)!.skill);
  });

  test('test_F8_AC4: a miss steps back through prerequisites, one skill at a time, within 16 questions', () => {
    const C = E.checkInit(E.GRADE_TARGETS), asked = runCheck(C, () => false);
    expect(asked.length).toBeLessThanOrEqual(E.CHECK_MAX);
    expect(asked.some(id => !E.GRADE_TARGETS.includes(id))).toBe(true);
    // Each skill asked after the first is a grade target or a prerequisite of one already missed.
    const pre = new Set<string>();
    asked.forEach((id, i) => { if (i && !E.GRADE_TARGETS.includes(id)) expect(pre.has(id), `${id} stepped back from a miss`).toBe(true); E.SK[id].pre.forEach(x => pre.add(x)); });
  });

  test('test_F8_AC4: passed skills and the unchecked prerequisites under them are known; results become the workbook goal', () => {
    const p = fresh();
    p.workbook = E.newWorkbookGoal(E.GRADE_TARGETS);
    const C = E.checkInit(p.workbook.skills);
    // She knows decimals but not multiplying them.
    runCheck(C, id => !['multdec', 'probdec', 'multcol'].includes(id));
    E.checkApply(p, C, 1_700_000_000_000);
    expect(C.probed.decimaux).toBe('pass');
    expect(p.skills.decimaux.mastered).toBe(true);
    for (const anc of E.goalPath(['decimaux'])) if (!C.probed[anc]) expect(p.skills[anc].mastered, `${anc} under decimaux`).toBe(true);
    expect(p.skills.placevalue.mastered).toBe(true);
    expect(p.skills.multdec.mastered).toBe(false);
    expect(p.workbook.checkedAt).toBe(1_700_000_000_000);
    expect(p.workbook.results).toEqual(C.probed);
    // Practice climbs back toward grade level: focus is on the path to the targets.
    const f = E.pickFocus(p)!;
    expect(E.goalPath(E.GRADE_TARGETS).has(f)).toBe(true);
    expect(p.skills[f].mastered).toBe(false);
  });
});
