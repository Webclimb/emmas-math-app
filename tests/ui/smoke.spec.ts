// Port of v1 source/tests/smoke.py, plus real-click solving. Covers F-5.AC-2:
// every build task is solvable within the widget's limits, and solving it through the UI is marked correct.
import { expect, test } from '@playwright/test';
import { createLearner, holdGrownUps, open } from './helpers';

test('test_F5_AC2: every skill, level and build widget solves correctly through the action handlers (v1 smoke sweep)', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Ava', 1);
  await page.click('[data-act=beginPlace]');
  for (let i = 0; i < 14; i++) {
    if (await page.locator('[data-act=home]').count()) break;
    if (await page.locator('[data-act=next]').count() === 0) {
      if (await page.locator('[data-act=opt]').count()) await page.click('[data-act=opt] >> nth=0');
      else await page.click('[data-act=unsure]');
    }
    await page.click('[data-act=next]');
  }
  await page.click('[data-act=home]');

  const res: string[] = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ns = (window as any).__ns, G = ns.G, ACT = ns.ACT, out: string[] = [];
    ns.seed(20261121);
    G.S = { mode: 'practice', n: 10, i: 0, answered: 0, correct: 0, gems: 0, start: Date.now(), events: [], P: null, early: false };
    G.UI.screen = 'practice';
    const click = (act: string, attrs: Record<string, string> = {}) => { const el = document.createElement('button'); el.dataset.act = act; Object.assign(el.dataset, attrs); ACT[act](el, { clientX: 0 }); };
    for (const s of ns.SKILLS) for (let st = 0; st < 3; st++) for (const easy of [true, false]) for (let rep = 0; rep < 6; rep++) {
      try {
        const q = ns.makeQuestion(s.id, st, easy); q.review = false;
        G.Cur = ns.newCurrent(q); ns.render();
        ACT.hint(); ns.render();
        if (q.kind === 'build') {
          const bd = q.build;
          switch (bd.type) {
            case 'tenframe': for (let i = bd.preset; i < bd.target; i++) click('cell', { i: String(i) }); click('bcheck'); break;
            case 'blocks': { const H = Math.floor(bd.target / 100), T = Math.floor(bd.target / 10) % 10, O = bd.target % 10; for (let i = 0; i < H; i++) click('blk', { d: 'h+' }); for (let i = 0; i < T; i++) click('blk', { d: 't+' }); for (let i = 0; i < O; i++) click('blk', { d: 'o+' }); click('bcheck'); break; }
            case 'nlplace': click('nlnudge', { d: '1' }); for (let i = 1; i < bd.target; i++) click('nlnudge', { d: '1' }); click('bcheck'); break;
            case 'jumps': { let rem = bd.target - bd.start; while (rem >= 10 && bd.tens) { click('jump', { d: '10' }); rem -= 10; } while (rem > 0) { click('jump', { d: '1' }); rem--; } click('jdone'); break; }
            case 'crossout': for (let i = 0; i < bd.k; i++) click('cross', { i: String(i) }); click('bcheck'); break;
            case 'groups': for (let i = 1; i < bd.a; i++) click('grp', { d: 'a+' }); for (let i = 1; i < bd.b; i++) click('grp', { d: 'b+' }); click('bcheck'); break;
            case 'rows': for (let i = 0; i < bd.target; i++) click('row', { d: '+' }); click('bcheck'); break;
            case 'share': for (let i = 0; i < bd.n; i++) click('plate', { i: String(i % bd.k) }); break;
            case 'makegroups': for (let i = 0; i < bd.n / bd.k; i++) click('mkgrp'); break;
            case 'shade': for (let i = 0; i < bd.k; i++) click('part', { i: String(i) }); click('bcheck'); break;
          }
          if (q.followup) {
            if (!G.Cur.b.done) out.push(`${s.id}[${st}] build not done (${bd.type})`);
            else { const i = q.followup.options.findIndex((o: { value: unknown }) => String(o.value) === String(q.followup.answer)); click('fopt', { i: String(i) }); }
          }
          if (G.Cur.phase !== 'feedback') out.push(`${s.id}[${st}] no feedback after build ${bd.type}`);
          else if (!G.Cur.ok) out.push(`${s.id}[${st}] correct build marked wrong (${bd.type})`);
        } else if (q.kind === 'mc') {
          const i = q.options.findIndex((o: { value: unknown }) => String(o.value) === String(q.answer));
          click('opt', { i: String(i) });
          if (!G.Cur.ok) out.push(`${s.id}[${st}] correct mc marked wrong`);
        } else {
          for (const ch of String(q.answer)) ns.padKey(ch); ns.padKey('ok');
          if (!G.Cur.ok) out.push(`${s.id}[${st}] correct pad marked wrong`);
        }
        ns.render();
        const q2 = ns.makeQuestion(s.id, st, easy); q2.review = false;
        G.Cur = ns.newCurrent(q2); ns.render(); ACT.unsure(); ns.render();
        if (!document.querySelector('#fb')) out.push(`${s.id}[${st}] no feedback card`);
      } catch (e) { out.push(`${s.id}[${st}] threw ${(e as Error).message}`); }
    }
    return out;
  });
  expect(res).toEqual([]);

  // A real session start, a few real taps, then out through stop and the shop and grown-ups.
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ns = (window as any).__ns, prof = ns.G.prof;
    prof.skills.divmeaning.stage = 0; prof.focus = 'divmeaning';
    for (const id of ['quantity', 'numberline', 'placevalue', 'makes10', 'addition', 'subtraction', 'multmeaning']) prof.skills[id].mastered = true;
    ns.G.UI.screen = 'home'; ns.render();
  });
  await page.click('[data-act=start]');
  for (let i = 0; i < 30; i++) {
    if (await page.locator('[data-act=eventOk]').count()) { await page.click('[data-act=eventOk]'); continue; }
    if (await page.locator('[data-act=more]').count()) break;
    if (await page.locator('[data-act=next]').count()) { await page.click('[data-act=next]'); continue; }
    if (await page.locator('[data-act=unsure]').count()) { await page.click('[data-act=unsure]'); continue; }
  }
  await expect(page.locator('[data-act=more]')).toBeVisible();
  await page.click('[data-act=home]');
  await page.click('[data-act=shop]');
  await page.click('[data-act=home]');
  await holdGrownUps(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.click('[data-act=back]');
  await expect(page.locator('.mapcard')).toBeVisible();
  expect(errors).toEqual([]);
});

// Real taps on real elements, one question per build widget.
const WIDGETS: [string, number][] = [['quantity', 0], ['numberline', 0], ['placevalue', 0], ['makes10', 0], ['addition', 0], ['subtraction', 0], ['multmeaning', 0], ['multeasy', 0], ['divmeaning', 0], ['divfacts', 0], ['fractions', 0]];
for (const [skill, stage] of WIDGETS) {
  test(`test_F5_AC2: ${skill} hands-on build solved by real taps is marked correct`, async ({ page }) => {
    const errors = await open(page);
    await createLearner(page, 'Tap', 0);
    await page.click('[data-act=skipPlace]');
    for (const easy of [true, false]) {
      const q = await page.evaluate(([sk, st, e]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ns = (window as any).__ns, G = ns.G;
        G.S = { mode: 'practice', n: 10, i: 0, answered: 0, correct: 0, gems: 0, start: Date.now(), events: [], P: null, early: false };
        const q = ns.makeQuestion(sk, st, e); q.review = false; G.Cur = ns.newCurrent(q); G.UI.screen = 'practice'; ns.render();
        return { build: q.build, followup: q.followup ? q.followup.options.findIndex((o: { value: unknown }) => String(o.value) === String(q.followup.answer)) : -1 };
      }, [skill, stage, easy] as [string, number, boolean]);
      const bd = q.build, tap = (sel: string, n = 1) => (async () => { for (let i = 0; i < n; i++) await page.locator(sel).first().click(); })();
      switch (bd.type) {
        case 'tenframe': for (let i = bd.preset; i < bd.target; i++) await page.locator(`[data-act=cell][data-i="${i}"]`).click(); await tap('[data-act=bcheck]'); break;
        case 'blocks': await tap('[data-act=blk][data-d="h+"]', Math.floor(bd.target / 100)); await tap('[data-act=blk][data-d="t+"]', Math.floor(bd.target / 10) % 10); await tap('[data-act=blk][data-d="o+"]', bd.target % 10); await tap('[data-act=bcheck]'); break;
        case 'nlplace': await tap('[data-act=nlnudge][data-d="1"]', bd.target); await tap('[data-act=bcheck]'); break;
        case 'jumps': { let rem = bd.target - bd.start; while (rem >= 10 && bd.tens) { await tap('[data-act=jump][data-d="10"]'); rem -= 10; } await tap('[data-act=jump][data-d="1"]', rem); await tap('[data-act=jdone]'); break; }
        case 'crossout': for (let i = 0; i < bd.k; i++) await page.locator(`[data-act=cross][data-i="${i}"]`).click(); await tap('[data-act=bcheck]'); break;
        case 'groups': await tap('[data-act=grp][data-d="a+"]', bd.a - 1); await tap('[data-act=grp][data-d="b+"]', bd.b - 1); await tap('[data-act=bcheck]'); break;
        case 'rows': await tap('[data-act=row][data-d="+"]', bd.target); await tap('[data-act=bcheck]'); break;
        case 'share': for (let i = 0; i < bd.n; i++) await page.locator(`[data-act=plate][data-i="${i % bd.k}"]`).click(); break;
        case 'makegroups': await tap('[data-act=mkgrp]', bd.n / bd.k); break;
        case 'shade': for (let i = 0; i < bd.k; i++) await page.locator(`[data-act=part][data-i="${i}"]`).click(); await tap('[data-act=bcheck]'); break;
      }
      if (q.followup >= 0) await page.locator(`[data-act=fopt][data-i="${q.followup}"]`).click();
      await expect(page.locator('#fb.good')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
