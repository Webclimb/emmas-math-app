// M0 "no behaviour change" check for the UI: put v1 (source/index.html) and the port (dist/index.html)
// in the same state with the same seed, screenshot both, and compare pixels.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { url } from './helpers';

const V1 = 'file://' + resolve(process.cwd(), 'source/index.html');
const MULBERRY = `(s => { let a = s | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })`;

// One script, run in both pages. `port` is true in the port, where state lives on window.__ns.
const SETUP = `(port) => {
  const ns = window.__ns;
  const api = port ? { newProfile: ns.newProfile, setProf: ns.setProf, render: ns.render, makeQuestion: ns.makeQuestion, newCurrent: ns.newCurrent, ACT: ns.ACT, G: ns.G, seed: ns.seed, dayKey: ns.dayKey }
    : { newProfile, setProf, render, makeQuestion, ACT, dayKey, newCurrent: q => ({ q, phase: 'answer', hinted: false, hintShown: false, entry: '', chosen: null, fchosen: null, b: q.kind === 'build' ? initBuild(q.build) : null, buildMiss: false }),
        seed: n => { Math.random = (${MULBERRY})(n); } };
  const set = (k, v) => { if (port) ns.G[k] = v; else if (k === 'S') S = v; else if (k === 'Cur') Cur = v; };
  const UIo = port ? ns.G.UI : UI;
  api.seed(1);
  const p = api.newProfile('Sam', '🦊'); p.id = 'p1'; p.created = 0;
  if (port) { ns.G.store.data = { v: 1, profiles: { p1: p }, current: 'p1', updated: 0 }; } else { APP.profiles = { p1: p }; APP.current = 'p1'; }
  api.setProf();
  const now = Date.now(), day = 864e5;
  ['quantity','numberline','placevalue','makes10','addition','subtraction','multmeaning'].forEach((id, i) => { const s = p.skills[id]; s.mastered = true; s.stage = 2; s.best = 2; s.pL = [.95,.93,.92]; s.att = [4,5,6]; s.cor = [4,4,5]; s.lastSeen = now - (i % 4) * day; });
  Object.assign(p.skills.divmeaning, { stage: 1, best: 1, pL: [.93,.55,.1], att: [5,3,0], cor: [5,2,0], lastSeen: now });
  p.placementDone = true; p.focus = 'divmeaning'; p.gems = 46;
  p.days = [0,1,3,4].map(d => api.dayKey(new Date(now - d * day)));
  p.mis = { 'op-sub-for-div': { count: 4, last: now }, 'fact-neighbor': { count: 2, last: now - day }, regroup: { count: 1, last: now - 3 * day } };
  p.sessions = [{ d: now - 3 * day, n: 10, c: 7, min: 8, m: 'practice' }, { d: now - day, n: 10, c: 8, min: 7, m: 'placement' }];
  window.__show = (screen, skill, stage, easy, seed, unsure) => {
    api.seed(seed);
    UIo.modal = null; UIo.toast = null;
    if (screen === 'practice') {
      set('S', { mode: 'practice', n: 10, i: 3, answered: 3, correct: 2, gems: 5, start: now, events: [], P: null, early: false });
      const q = makeQ(skill, stage, easy); q.review = false;
      set('Cur', api.newCurrent(q));
    }
    UIo.screen = screen; api.render();
    if (unsure) { api.ACT.unsure(); }
    window.scrollTo(0, 0);
  };
  function makeQ(a, b, c) { return api.makeQuestion(a, b, c); }
}`;

async function prep(page: Page, port: boolean) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  // Speech availability changes the layout (read-aloud button); make both pages the same.
  await page.addInitScript(() => { try { delete (window as unknown as Record<string, unknown>).speechSynthesis; } catch { /* */ } Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  await page.goto(port ? url(true) : V1);
  await expect(page.locator('.boot')).toHaveCount(0, { timeout: 5000 });
  await page.evaluate(`(${SETUP})(${port})`);
}

// Tolerance 24/255 per channel absorbs anti-aliasing noise: at zero tolerance the only differences seen
// were 84 edge pixels of the progress bar (at most 16/255) on 8 of 174 screens.
async function diff(page: Page, a: Buffer, b: Buffer): Promise<{ w: number; h: number; changed: number; sizeMatch: boolean }> {
  return page.evaluate(async ([a64, b64]) => {
    const load = (s: string) => new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(a64), load(b64)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const px = (img: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!; x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = px(ia), db = px(ib); let changed = 0;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > 24 || Math.abs(da[i + 1] - db[i + 1]) > 24 || Math.abs(da[i + 2] - db[i + 2]) > 24) changed++;
    return { w, h, changed, sizeMatch: ia.width === ib.width && ia.height === ib.height };
  }, [a.toString('base64'), b.toString('base64')]);
}

const CASES: [string, string, number, boolean, boolean][] = [['home', '', 0, false, false], ['shop', '', 0, false, false], ['grown', '', 0, false, false]];
const SKILLS = ['quantity', 'numberline', 'placevalue', 'makes10', 'addition', 'subtraction', 'multmeaning', 'multeasy', 'multmid', 'multhard', 'divmeaning', 'divfacts', 'whichop', 'fractions'];
for (const s of SKILLS) for (let st = 0; st < 3; st++) { CASES.push(['practice', s, st, st === 0, false]); CASES.push(['practice', s, st, st !== 0, true]); }

for (const theme of ['light', 'dark'] as const) {
  test(`port parity: ${CASES.length} screens look the same as v1 (${theme})`, async ({ browser }) => {
    test.setTimeout(240_000);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme });
    const pv1 = await ctx.newPage(), pport = await ctx.newPage(), scratch = await ctx.newPage();
    await prep(pv1, false); await prep(pport, true);
    const bad: string[] = [];
    let i = 0;
    for (const [screen, skill, stage, easy, unsure] of CASES) {
      const seed = 500 + i++;
      const args = JSON.stringify([screen, skill, stage, easy, seed, unsure]).slice(1, -1);
      await pv1.evaluate(`window.__show(${args})`); await pport.evaluate(`window.__show(${args})`);
      const [a, b] = [await pv1.screenshot({ fullPage: true, animations: 'disabled' }), await pport.screenshot({ fullPage: true, animations: 'disabled' })];
      const d = await diff(scratch, a, b);
      const name = `${screen}${skill ? ` ${skill}[${stage}]${easy ? 'e' : ''}${unsure ? ' feedback' : ''}` : ''}`;
      if (!d.sizeMatch || d.changed > 0) {
        const dir = resolve(process.cwd(), 'test-results/parity'); mkdirSync(dir, { recursive: true });
        const f = `${theme}-${name.replace(/[^a-z0-9]+/gi, '-')}`; writeFileSync(`${dir}/${f}-v1.png`, a); writeFileSync(`${dir}/${f}-port.png`, b);
        bad.push(`${name}: ${d.changed} px differ, size match ${d.sizeMatch} (${d.w}x${d.h})`);
      }
    }
    await ctx.close();
    expect(bad).toEqual([]);
  });
}
