// M0 "no behaviour change" check: with the same seed, the ported engine produces exactly what v1 produces.
import { describe, expect, test, vi } from 'vitest';
import * as E from '../../src/engine';
import type { Stage } from '../../src/engine';
import { loadV1Engine } from './v1';

const v1 = loadV1Engine();
const strip = (q: object) => JSON.parse(JSON.stringify(q));

describe('port parity with v1 engine', () => {
  test('skill table, ladder and error patterns are identical', () => {
    expect(strip(E.SKILLS)).toEqual(strip(v1.api.SKILLS));
    expect([...E.LADDER]).toEqual([...v1.api.LADDER]);
    expect(strip(E.MIS)).toEqual(strip(v1.api.MIS));
  });

  test('every generator gives identical questions for the same seed', () => {
    let n = 0;
    for (const s of E.SKILLS) for (let st = 0 as Stage; st < 3; st = (st + 1) as Stage) for (const easy of [true, false]) {
      for (let i = 0; i < 60; i++) {
        const seed = 1000 + n++;
        E.seed(seed); v1.seed(seed);
        const a = strip(E.makeQuestion(s.id, st, easy)), b = strip(v1.api.makeQuestion(s.id, st, easy));
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
      const ia = E.nextItem(pa, { i: t }), ib = v1.api.nextItem(pb, { i: t });
      expect(strip(ia ?? {})).toEqual(strip(ib ?? {}));
      if (!ia) break;
      const ok = coin() < 0.7, hinted = coin() < 0.1;
      const ea = E.record(pa, ia.skill, ia.stage, ok, { hinted, G: 0.25, review: ia.review });
      const eb = v1.api.record(pb, ib.skill, ib.stage, ok, { hinted, G: 0.25, review: ib.review });
      expect(strip(ea)).toEqual(strip(eb));
    }
    const norm = (p: { log: { t: number }[]; skills: Record<string, { lastSeen: number; masteredAt: number }> }) => {
      const c = strip(p); c.log.forEach((l: { t: number }) => l.t = 0);
      Object.values(c.skills as Record<string, { lastSeen: number; masteredAt: number }>).forEach(s => { s.lastSeen = 0; s.masteredAt = 0; });
      return c;
    };
    expect(norm(pa)).toEqual(norm(pb));
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
