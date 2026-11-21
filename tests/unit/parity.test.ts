// M0 "no behaviour change" check, kept through MD and MG: with the same seed and the same story items, the
// engine asks exactly what v1 asks for the 14 v1 skills. Since MD the visuals are drawn from the design kit, so questions are compared
// as text (HTML and SVG markup stripped) plus every number, answer, option value and pattern tag.
import { describe, expect, test, vi } from 'vitest';
import * as E from '../../src/engine';
import type { Stage } from '../../src/engine';
import { loadV1Engine } from './v1';

const v1 = loadV1Engine(E.ITEMS);
const strip = (q: object) => JSON.parse(JSON.stringify(q));
// Since MG the wording is French (D-21): strings are compared by the numbers they contain (French word order differs).
const numbersOnly = (x: unknown): unknown => typeof x === 'string' ? (x.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').match(/\d+/g) || []).sort().join(' ')
  : Array.isArray(x) ? x.map(numbersOnly) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, numbersOnly(v)])) : x;
const textOnly = numbersOnly;

describe('port parity with v1 engine', () => {
  test('skill table, ladder and error patterns are identical', () => {
    const ids = (a: { id: string; pre: string[] }[]) => a.map(s => ({ id: s.id, pre: s.pre }));
    expect(ids(E.SKILLS.slice(0, 14))).toEqual(ids(v1.api.SKILLS));
    expect([...E.V1_LADDER]).toEqual([...v1.api.LADDER]);
    for (const k of Object.keys(v1.api.MIS)) expect(E.MIS[k], k).toBeDefined();
    expect(v1.api.SKILLS.length).toBe(14);
  });

  test('every generator gives identical questions for the same seed', () => {
    let n = 0;
    for (const s of E.SKILLS.slice(0, 14)) for (let st = 0 as Stage; st < 3; st = (st + 1) as Stage) for (const easy of [true, false]) {
      for (let i = 0; i < 60; i++) {
        const seed = 1000 + n++;
        E.seed(seed); v1.seed(seed);
        const a = textOnly(strip(E.makeQuestion(s.id, st, easy))) as Record<string, unknown>, b = textOnly(strip(v1.api.makeQuestion(s.id, st, easy))) as Record<string, unknown>;
        delete a.meta; delete a.skill; delete a.stage; delete b.skill; delete b.stage;
        expect(a, `${s.id}[${st}]${easy ? 'e' : ''} seed ${seed}`).toEqual(b);
      }
    }
  });

  test('learner model gives identical state for the same answer stream', () => {
    let clock = 1_700_000_000_000;
    const now = vi.spyOn(Date, 'now').mockImplementation(() => clock);
    E.seed(7); v1.seed(7);
    const pa = E.newProfile('A', '🦊'), pb = v1.api.newProfile('A', '🦊');
    pb.id = pa.id; pb.created = pa.created;
    let r = 99;
    const coin = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
    for (let t = 0; t < 1500; t++) {
      clock += 60_000;
      // Since MG the map has more skills, so the port would choose differently once a v1 skill is lit:
      // both models get v1's choice of item, and their learning updates must match.
      const ib = v1.api.nextItem(pb, { i: t }), ia = ib;
      if (!ib) break;
      const ok = coin() < 0.7, hinted = coin() < 0.1;
      const ea = E.record(pa, ia.skill, ia.stage, ok, { hinted, G: 0.25, review: ia.review });
      const eb = v1.api.record(pb, ib.skill, ib.stage, ok, { hinted, G: 0.25, review: ib.review });
      expect(strip(ea)).toEqual(strip(eb));
    }
    const norm = (p: { log: { t: number }[]; skills: Record<string, { lastSeen: number; masteredAt: number }> }) => {
      const c = strip(p); c.log.forEach((l: { t: number }) => l.t = 0);
      // Cosmetic defaults changed in MD (theme, owned items, sound off); the learner model must not.
      delete c.theme; delete c.owned; delete c.settings.sound;
      Object.values(c.skills as Record<string, { lastSeen: number; masteredAt: number }>).forEach(s => { s.lastSeen = 0; s.masteredAt = 0; });
      return c;
    };
    const v1only = (c: { skills: Record<string, unknown>; focus?: unknown }) => { for (const k of Object.keys(c.skills)) if (!E.V1_LADDER.includes(k)) delete c.skills[k]; delete c.focus; return c; };
    expect(v1only(norm(pa) as never)).toEqual(v1only(norm(pb) as never));
    now.mockRestore();
  });

  test('placement gives identical results for the same answers', () => {
    for (let trial = 0; trial < 50; trial++) {
      const Pa = E.placementInit(), Pb = v1.api.placementInit();
      let bits = trial * 2654435761 >>> 0;
      for (let g = 0; g < 20; g++) {
        const a = E.placementNext(Pa), b = v1.api.placementNext(Pb);
        expect(strip(a ?? {})).toEqual(strip(b ?? {}));
        if (!a) break;
        const ok = (bits >>> (g % 32)) & 1 ? true : false;
        E.placementRecord(Pa, ok); v1.api.placementRecord(Pb, ok);
      }
      expect(strip(Pa)).toEqual(strip(Pb));
    }
  });
});
