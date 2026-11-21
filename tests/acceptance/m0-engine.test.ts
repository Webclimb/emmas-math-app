// M0 acceptance criteria that can be checked without a browser (spec section 13, M0 exit check).
// Test names carry the criterion ID. Never edit a test to make it pass.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import * as E from '../../src/engine';
import type { Option, Profile, Question, Stage } from '../../src/engine';
import { migrateApp, migrateProfile, parseBackup, backupCode } from '../../src/storage/schema';
import { THEMES } from '../../src/design/tokens';

const SPEC = readFileSync(resolve(process.cwd(), 'SPEC.md'), 'utf8');
const STAGES: Stage[] = [0, 1, 2];
const N = 400;

function eachQuestion(n: number, f: (q: Question, where: string) => void) {
  for (const s of E.SKILLS) for (const st of STAGES) for (const easy of [true, false]) for (let i = 0; i < n; i++) {
    const where = `${s.id}[${st}]${easy ? 'e' : ''}`;
    f(E.makeQuestion(s.id, st, easy), where);
  }
}

// ---------- F-2 Skill map ----------
describe('F-2 skill map', () => {
  test('test_F2_AC1: the 14 v1 skills, their groups and prerequisites match SPEC.md section 12', () => {
    const sec = SPEC.slice(SPEC.indexOf('**Skills (id: name, group, prerequisites)**'), SPEC.indexOf('v1 teaching order'));
    const rows = sec.split('\n').filter(l => /^\| [a-z0-9]+ \|/.test(l) && !/^\| id \|/.test(l)).map(l => l.split('|').slice(1, -1).map(c => c.trim()));
    expect(rows).toHaveLength(14);
    // Ids and prerequisites unchanged from v1; names and lines are the French ones in the table (D-21).
    const table = rows.map(([id, , , pre, nom, ligne]) => ({ id, name: nom, group: ligne, pre: pre === 'none' ? [] : pre.split(/,\s*/) }));
    expect(E.SKILLS.slice(0, 14).map(s => ({ id: s.id, name: s.name, group: s.group, pre: s.pre }))).toEqual(table);
    const order = SPEC.match(/v1 teaching order \(also the placement ladder\): ([a-z0-9, ]+)\./)![1].split(/,\s*/);
    expect([...E.V1_LADDER]).toEqual(order);
    expect(E.LADDER.slice(0, 14)).toEqual(order);
  });

  test('test_F2_AC2: a skill with any unmastered prerequisite is never selected for new practice', () => {
    E.seed(42);
    for (let trial = 0; trial < 300; trial++) {
      const p = E.newProfile('T', '🦊');
      for (const s of E.SKILLS) p.skills[s.id].mastered = E.random() < 0.5;
      p.focus = E.random() < 0.5 ? E.pick(E.SKILLS).id : null; // a stale or locked focus must be ignored
      for (let i = 0; i < 40; i++) {
        const it = E.nextItem(p, { i });
        if (!it) break;
        if (!it.review) expect(E.SK[it.skill].pre.every(id => p.skills[id].mastered), `${it.skill} picked with an unmastered prerequisite`).toBe(true);
        E.record(p, it.skill, it.stage, E.random() < 0.6, { G: 0.25, review: it.review });
      }
    }
  });
});

// ---------- F-5 Questions ----------
const stripTags = (s: unknown) => String(s).replace(/<[^>]+>/g, '');
function checkText(errors: string[], where: string, s: unknown) {
  if (s == null) return;
  if (/undefined|NaN|\[object|null/.test(stripTags(s))) errors.push(`${where}: bad text "${stripTags(s).slice(0, 120)}"`);
}
function checkMC(errors: string[], where: string, opts: Option[] | undefined, ans: unknown) {
  if (!Array.isArray(opts) || opts.length < 2) { errors.push(`${where}: <2 options`); return; }
  const vals = opts.map(o => String(o.value));
  if (new Set(vals).size !== vals.length) errors.push(`${where}: duplicate option values ${vals}`);
  const hits = vals.filter(v => v === String(ans)).length;
  if (hits !== 1) errors.push(`${where}: answer ${ans} appears ${hits}x in ${vals}`);
  const labels = opts.map(o => stripTags(o.label).trim());
  if (new Set(labels).size !== labels.length) errors.push(`${where}: duplicate labels ${labels}`);
  opts.forEach(o => { checkText(errors, where + ' label', o.label); if (o.mis && !E.MIS[o.mis]) errors.push(`${where}: unknown mis ${o.mis}`); });
  opts.forEach(o => { if (typeof o.value === 'number' && (o.value < 0 || !Number.isInteger(o.value))) errors.push(`${where}: bad numeric option ${o.value}`); });
  // Decimal options (F-23) are canonical strings: no negatives, comma not point.
  opts.forEach(o => { if (typeof o.value === 'string' && /^[-−]\d|\d\.\d/.test(o.value)) errors.push(`${where}: bad decimal option ${o.value}`); });
}
function checkBuild(errors: string[], where: string, bd: NonNullable<Question['build']>) {
  switch (bd.type) {
    case 'tenframe': if (!(bd.target >= 1 && bd.target <= bd.frames * 10 && bd.preset < bd.target)) errors.push(`${where}: tenframe infeasible`); break;
    case 'blocks': { const h = Math.floor(bd.target / 100); if (h > 3 || (h > 0 && !bd.hundreds)) errors.push(`${where}: blocks infeasible ${bd.target}`); break; }
    case 'nlplace': if (!(bd.target > bd.min && bd.target < bd.max)) errors.push(`${where}: nlplace`); break;
    case 'jumps': { const lo = Math.floor(bd.start / 10) * 10, hi = Math.max(lo + 20, Math.ceil((bd.target + 1) / 10) * 10); if (bd.target > hi || bd.target < bd.start) errors.push(`${where}: jumps out of range`); if (hi - lo > 60) errors.push(`${where}: jumps range too wide`); break; }
    case 'crossout': if (!(bd.k >= 1 && bd.k < bd.n)) errors.push(`${where}: crossout`); break;
    case 'groups': if (!(bd.a >= 1 && bd.a <= 6 && bd.b >= 1 && bd.b <= 6)) errors.push(`${where}: groups out of stepper range`); break;
    case 'rows': if (!(bd.target >= 1 && bd.target <= 10)) errors.push(`${where}: rows`); break;
    case 'share': if (bd.n % bd.k !== 0) errors.push(`${where}: share not divisible`); break;
    case 'makegroups': if (bd.n % bd.k !== 0) errors.push(`${where}: makegroups not divisible`); break;
    case 'shade': if (!(bd.k >= 1 && bd.k < bd.n)) errors.push(`${where}: shade`); break;
    // F-23 widgets
    case 'pvchart': {
      // every digit of the target sits in one of the chart's columns
      const pow: Record<string, number> = { cm: 5, dm: 4, um: 3, c: 2, d: 1, u: 0, ds: -1, cs: -2, ms: -3 };
      const rebuilt = bd.cols.reduce((t, c) => t + (Math.floor(bd.target / Math.round(1000 * 10 ** pow[c])) % 10) * Math.round(1000 * 10 ** pow[c]), 0);
      if (rebuilt !== bd.target || bd.target <= 0) errors.push(`${where}: pvchart target ${bd.target} does not fit ${bd.cols}`); break;
    }
    case 'shift': { const t = bd.k > 0 ? bd.start * 10 ** bd.k : bd.start / 10 ** -bd.k; if (!Number.isInteger(t) || t < 1 || t >= 10_000_000) errors.push(`${where}: shift target ${t}`); break; }
    case 'steps':
      if (!bd.steps.length) errors.push(`${where}: no steps`);
      for (const st of bd.steps) {
        checkText(errors, where + ' step', st.prompt); checkText(errors, where + ' step done', st.done);
        if (st.choices) { if (st.choices.filter(c => c === st.answer).length !== 1) errors.push(`${where}: step answer ${st.answer} not once in ${st.choices}`); }
        else if (!/^\d+(,\d+)?$/.test(st.answer) || (!st.decimal && st.answer.includes(','))) errors.push(`${where}: bad step answer ${st.answer}`);
      }
      break;
  }
}

describe('F-5 questions', () => {
  test('test_F5_AC1: 400 questions per (skill, level, easy/hard) each have one correct answer, no duplicate or bad options, no undefined/NaN text', () => {
    E.seed(20261120);
    const errors: string[] = []; let count = 0;
    eachQuestion(N, (q, where) => {
      count++;
      checkText(errors, where + ' prompt', q.prompt);
      checkText(errors, where + ' explain', q.explain && q.explain.text);
      if (q.hint) checkText(errors, where + ' hint', q.hint.text);
      if (!q.explain || !q.explain.text) errors.push(`${where}: no explain`);
      if (q.kind === 'mc') checkMC(errors, where, q.options, q.answer);
      else if (q.kind === 'pad') {
        // Whole answers up to 999 999; decimals only in F-23 decimal questions, written canonically with a comma.
        const a = String(q.answer);
        if (q.decimal ? !/^\d+(,\d{1,3})?$/.test(a) || /,\d*0$/.test(a) : !/^\d{1,6}$/.test(a)) errors.push(`${where}: bad pad answer ${a}`);
        if (/^0\d/.test(a)) errors.push(`${where}: leading zero ${a}`);
        if (q.padMis) for (const [k, v] of Object.entries(q.padMis)) { if (k === a) errors.push(`${where}: padMis includes answer`); if (!E.MIS[v]) errors.push(`${where}: unknown mis ${v}`); }
      } else if (q.kind === 'build') {
        checkBuild(errors, where, q.build!);
        if (q.followup) checkMC(errors, where + ' followup', q.followup.options, q.followup.answer);
      } else errors.push(`${where}: unknown kind ${q.kind}`);
    });
    expect(count).toBe(E.SKILLS.length * 3 * 2 * N);
    expect([...new Set(errors)].slice(0, 30)).toEqual([]);
  });
});

// ---------- F-6 Error patterns ----------
const SPEC_PATTERNS = SPEC.match(/\*\*Error patterns \(21\):\*\* ([a-z0-9, -]+)\./)![1].split(/,\s*/);

describe('F-6 error patterns', () => {
  test('test_F6_AC2: the 21 v1 patterns exist and each is detectable from a chosen option or typed answer', () => {
    expect(SPEC_PATTERNS).toHaveLength(21);
    for (const id of SPEC_PATTERNS) expect(E.MIS[id], id).toBeDefined();
    E.seed(5);
    const seen = new Set<string>();
    eachQuestion(150, q => {
      const opts = [...(q.options || []), ...(q.followup ? q.followup.options : [])];
      opts.forEach(o => { if (o.mis) seen.add(o.mis); });
      if (q.padMis) Object.values(q.padMis).forEach(m => seen.add(m));
      // Build tasks with no follow-up record no pattern (v1); off-by-one is also added by numOpts.
    });
    expect(SPEC_PATTERNS.filter(p => !seen.has(p))).toEqual([]);
  });

  test('test_F6_AC2: subtract-on-division is detected whenever the answer equals dividend minus divisor', () => {
    E.seed(6);
    let checked = 0;
    eachQuestion(N, (q, where) => {
      if (!q.meta || q.meta.op !== '÷') return;
      const wrong = q.meta.a - q.meta.b;
      const opts = q.kind === 'mc' ? q.options! : q.followup ? q.followup.options : [];
      // When the right answer itself equals dividend minus divisor (4 ÷ 2), it is not an error.
      const correct = q.kind === 'build' ? q.followup?.answer : q.answer;
      const o = wrong === correct ? undefined : opts.find(x => x.value === wrong);
      if (o) { checked++; expect(o.mis, `${where} option ${wrong}`).toBe('op-sub-for-div'); }
      if (q.kind === 'pad' && wrong !== q.answer) { checked++; expect(q.padMis![wrong], `${where} typed ${wrong}`).toBe('op-sub-for-div'); }
    });
    expect(checked).toBeGreaterThan(1000);
    // Text options that describe taking away carry the same pattern.
    eachQuestion(50, q => {
      if (q.meta?.op !== '÷' || q.kind !== 'mc') return;
      q.options!.filter(o => /^Take \d+ away|−/.test(stripTags(o.label))).forEach(o => expect(o.mis).toBe('op-sub-for-div'));
    });
  });

  test('test_F6_AC2: a detected pattern is recorded on the learner', () => {
    const p = E.newProfile('T', '🦊');
    E.record(p, 'divmeaning', 2, false, { mis: 'op-sub-for-div', G: 0.03 });
    E.record(p, 'divmeaning', 2, false, { mis: 'op-sub-for-div', G: 0.03 });
    E.record(p, 'quantity', 1, false, { mis: 'off-by-one', G: 0.25 });
    expect(p.mis['op-sub-for-div'].count).toBe(2);
    expect(p.mis['off-by-one'].count).toBe(1);
    expect(p.log.at(-1)!.m).toBe('off-by-one');
  });

  test('test_F6_AC3: each pattern has a child-facing sentence, a grown-up description and an at-home activity', () => {
    for (const [id, m] of Object.entries(E.MIS)) {
      expect(m.kid.length, id).toBeGreaterThan(10);
      expect(m.parent.length, id).toBeGreaterThan(10);
      expect(m.act.length, id).toBeGreaterThan(10);
    }
  });
});

// ---------- F-7 Learner model ----------
function fresh(): Profile { return E.newProfile('T', '🦊'); }

describe('F-7 learner model', () => {
  test('test_F7_AC1: BKT with learn 0.12, slip 0.10, guess by mode, starting estimates 0.30 / 0.20 / 0.10', () => {
    expect(E.BKT).toEqual({ T: 0.12, S: 0.1 });
    expect(fresh().skills.quantity.pL).toEqual([0.3, 0.2, 0.1]);
    expect(E.guessFor({ kind: 'mc', options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }] })).toBeCloseTo(1 / 3);
    expect(E.guessFor({ kind: 'mc', options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }] })).toBe(0.25);
    expect(E.guessFor({ kind: 'pad' })).toBe(0.03);
    expect(E.guessFor({ kind: 'build' })).toBe(0.05);
    // One correct keypad answer from 0.1: posterior, then learning step.
    const p = 0.1, G = 0.03, post = p * 0.9 / (p * 0.9 + 0.9 * G), want = post + (1 - post) * 0.12;
    const prof = fresh();
    E.record(prof, 'quantity', 2, true, { G });
    expect(prof.skills.quantity.pL[2]).toBeCloseTo(want, 10);
    // And one wrong choice answer.
    const prof2 = fresh(), G2 = 0.25, p2 = 0.3, post2 = p2 * 0.1 / (p2 * 0.1 + 0.7 * 0.75);
    E.record(prof2, 'quantity', 0, false, { G: G2 });
    expect(prof2.skills.quantity.pL[0]).toBeCloseTo(post2 + (1 - post2) * 0.12, 10);
  });

  test('test_F7_AC2: move up when the estimate is at least 0.90 and the last 3 answers at that level were clean', () => {
    const p = fresh(), sk = p.skills.quantity;
    sk.pL[0] = 0.85;
    const ev1 = E.record(p, 'quantity', 0, true, { G: 0.05 });
    expect(ev1).toEqual([]); // estimate passes 0.90 but only 1 clean answer
    E.record(p, 'quantity', 0, true, { G: 0.05 });
    const ev3 = E.record(p, 'quantity', 0, true, { G: 0.05 });
    expect(ev3).toEqual([{ type: 'up', skill: 'quantity', stage: 1 }]);
    expect(sk.stage).toBe(1);
    // Three clean answers with a low estimate do not move up.
    const q = fresh(); q.skills.quantity.pL[0] = 0.05;
    for (let i = 0; i < 3; i++) expect(E.record(q, 'quantity', 0, true, { G: 0.25 })).toEqual([]);
    expect(q.skills.quantity.stage).toBe(0);
    // At numbers level the same rule masters the skill.
    const r = fresh(); r.skills.quantity.stage = 2; r.skills.quantity.pL[2] = 0.95;
    E.record(r, 'quantity', 2, true, { G: 0.03 }); E.record(r, 'quantity', 2, true, { G: 0.03 });
    expect(E.record(r, 'quantity', 2, true, { G: 0.03 })).toEqual([{ type: 'mastered', skill: 'quantity' }]);
  });

  test('test_F7_AC3: move down after 3+ answers with 2 of the last 3 not clean and estimate below 0.40', () => {
    const p = fresh(), sk = p.skills.addition; sk.stage = 1;
    expect(E.record(p, 'addition', 1, false, { G: 0.25 })).toEqual([]);
    expect(E.record(p, 'addition', 1, true, { hinted: true, G: 0.25 })).toEqual([]); // only 2 answers since arriving
    expect(sk.pL[1]).toBeLessThan(0.4);
    expect(E.record(p, 'addition', 1, false, { G: 0.25 })).toEqual([{ type: 'down', skill: 'addition', stage: 0 }]);
    expect(sk.stage).toBe(0);
    // Same answers with the estimate at or above 0.40 hold the level.
    const q = fresh(), qs = q.skills.addition; qs.stage = 1; qs.pL[1] = 0.99; qs.recent[1] = [0, 0]; qs.visit[1] = 2;
    expect(E.record(q, 'addition', 1, false, { G: 0.25 })).toEqual([]);
    expect(qs.pL[1]).toBeGreaterThanOrEqual(0.4);
    expect(qs.stage).toBe(1);
    // Fewer than 2 of the last 3 not clean holds the level.
    const t = fresh(), ts = t.skills.addition; ts.stage = 1; ts.pL[1] = 0.05; ts.recent[1] = [1, 1]; ts.visit[1] = 2;
    expect(E.record(t, 'addition', 1, false, { G: 0.25 })).toEqual([]);
    // From hands-on, the weakest prerequisite reopens at pictures level instead.
    const r = fresh();
    for (const id of ['quantity', 'numberline', 'placevalue', 'makes10']) { r.skills[id].mastered = true; r.skills[id].stage = 2; r.skills[id].pL = [0.95, 0.92, 0.9]; }
    r.skills.placevalue.pL[2] = 0.7;
    let ev: E.ModelEvent[] = [];
    for (let i = 0; i < 3; i++) ev = E.record(r, 'addition', 0, false, { G: 0.05 });
    expect(ev).toEqual([{ type: 'prereq', skill: 'addition', to: 'placevalue' }]);
    expect(r.skills.placevalue.mastered).toBe(false);
    expect(r.skills.placevalue.stage).toBe(1);
    expect(r.skills.addition.stage).toBe(0);
    expect(E.pickFocus(r)).toBe('placevalue');
  });

  test('test_F7_AC4: a correct answer after a hint raises the estimate by half a learning step and never counts toward moving up', () => {
    const p = fresh(), sk = p.skills.quantity; sk.pL[0] = 0.95;
    const before = sk.pL[0];
    E.record(p, 'quantity', 0, true, { hinted: true, G: 0.05 });
    expect(sk.pL[0]).toBeCloseTo(before + (1 - before) * 0.12 * 0.5, 12);
    E.record(p, 'quantity', 0, true, { G: 0.05 });
    E.record(p, 'quantity', 0, true, { G: 0.05 });
    expect(sk.stage).toBe(0); // the hinted answer is one of the last three
    expect(E.record(p, 'quantity', 0, true, { G: 0.05 })).toEqual([{ type: 'up', skill: 'quantity', stage: 1 }]);
    // Hinted answers only: never move up however high the estimate.
    const q = fresh(); q.skills.quantity.pL[0] = 0.99;
    for (let i = 0; i < 10; i++) expect(E.record(q, 'quantity', 0, true, { hinted: true, G: 0.05 })).toEqual([]);
  });
});

// ---------- F-20 Storage ----------
describe('F-20 storage', () => {
  const v1raw = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/v1-save.json'), 'utf8'));

  test('test_F20_AC1: a save written by the v1 prototype loads and migrates', () => {
    const d = migrateApp(structuredClone(v1raw))!;
    expect(d).not.toBeNull();
    expect(d.v).toBe(1);
    const p = d.profiles[d.current!];
    expect(p.name).toBe('Robin');
    migrateProfile(p);
    expect(Object.keys(p.skills).sort()).toEqual(E.SKILLS.map(s => s.id).sort());
    expect(p.settings).toMatchObject({ sessionLen: 10, sound: true, autoRead: false, chart: true });
    expect(E.nextItem(p, { i: 0 })).not.toBeNull();
    // An older v1 profile missing later fields still loads.
    const old = structuredClone(p) as Partial<Profile> & Profile;
    delete (old as Partial<Profile>).owned; delete (old as Partial<Profile>).theme; delete (old as Partial<Profile>).settings;
    old.skills.quantity.best = undefined as unknown as number;
    migrateProfile(old);
    // Since MD (SPEC.md D-18): v1 emoji buddies load as the default badge and missing themes as Cobalt (F-15.AC-6).
    expect(old.avatar).toBe('frame:square');
    expect(old.owned.avatars).toContain(old.avatar);
    expect(old.theme).toBe('cobalt');
    expect(typeof old.skills.quantity.best).toBe('number');
  });

  test('test_F15_AC6: themes are the design set, and a v1 theme outside it loads as Cobalt and stays owned', () => {
    expect(Object.keys(THEMES)).toEqual(['cobalt', 'ocean', 'berry', 'graphite']);
    expect(THEMES.cobalt.priceGems).toBe(0);
    const d = migrateApp(structuredClone(v1raw))!, p = d.profiles[d.current!];
    for (const [saved, loads] of [['marigold', 'cobalt'], ['lime', 'cobalt'], ['coral', 'cobalt'], ['lavender', 'cobalt'], ['ocean', 'ocean'], ['berry', 'berry']]) {
      const q = structuredClone(p); q.theme = saved; q.owned.themes = ['marigold', saved];
      migrateProfile(q);
      expect(q.theme, saved).toBe(loads);
      expect(q.owned.themes, saved).toContain(saved);
      expect(q.owned.themes, saved).toContain('cobalt');
    }
  });

  test('test_F20_AC3: a backup code round-trips, and malformed codes are rejected', () => {
    const d = migrateApp(structuredClone(v1raw))!, p = d.profiles[d.current!];
    const code = backupCode(p);
    expect(parseBackup(code)).toEqual(JSON.parse(JSON.stringify(p)));
    for (const bad of ['', 'hello', '{', '{}', '{"profile":{}}', '{"profile":{"skills":{}}}', code.slice(0, -5), '[1,2]', 'null'])
      expect(parseBackup(bad), JSON.stringify(bad)).toBeNull();
  });
});
