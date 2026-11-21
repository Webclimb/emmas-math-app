// F-22 workbook check (milestone MW): UI criteria. A stand-in for the Claude artifact runtime answers
// the photo-reading call, so these run offline and record exactly what would be sent.
import { expect, test, type Page } from '@playwright/test';
import { createLearner, grownTab, holdGrownUps, open, saved } from './helpers';

const TOPIC = 'Dividing 2-digit numbers ZQXTOPIC';
// A 1×1 PNG stands in for the photo.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

async function fakeClaude(page: Page, reply: unknown = { topic: TOPIC, skills: ['divfacts', 'bogus'], beyond: ['long division with remainders'] }) {
  await page.addInitScript(r => {
    const w = window as unknown as { __calls: unknown[]; claude: unknown };
    w.__calls = [];
    const sample = Object.assign(async () => ({ text: '' }), {
      limits: async () => ({ maxPromptBytes: 262144, images: { maxCount: 1, mediaTypes: ['image/png', 'image/jpeg'] } }),
      json: async (input: string, opts: { images: Blob[] }) => { w.__calls.push({ input, images: opts.images.length, bytes: opts.images[0].size }); return r; },
    });
    w.claude = { use: async (n: string) => (n === 'sample' ? sample : null) };
  }, reply);
}

async function toWorkbookTab(page: Page, name = 'Robin') {
  await createLearner(page, name, 0);
  await page.click('[data-act=skipPlace]');
  await holdGrownUps(page);
  await grownTab(page, 'workbook');
}

test('test_F22_AC1: a photo is read into skills from the skill map plus a list of skills the app lacks; without photo reading the grown-up picks by hand', async ({ page }) => {
  await fakeClaude(page);
  const errors = await open(page);
  await toWorkbookTab(page);
  await page.locator('#wbPhoto').setInputFiles({ name: 'page.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('Quelles habiletés la page demande-t-elle?')).toBeVisible();
  await expect(page.getByText(TOPIC)).toBeVisible();
  // Known ids are pre-selected; unknown ones are dropped.
  const picked = await page.locator('[data-act=wbToggle][aria-pressed=true]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.d));
  expect(picked).toEqual(['divfacts']);
  await expect(page.getByText('Aussi nécessaire, pas encore dans l’appli')).toBeVisible();
  await expect(page.getByText('long division with remainders')).toBeVisible();
  expect(errors).toEqual([]);
});

test('test_F22_AC1: without the Claude runtime there is no photo button, and skills can be chosen by hand', async ({ page }) => {
  const errors = await open(page);
  await toWorkbookTab(page);
  await expect(page.locator('#wbPhoto')).toHaveCount(0);
  await expect(page.getByText('La lecture de photos fonctionne quand l’appli est ouverte dans Claude.')).toBeVisible({ timeout: 15000 });
  await page.click('[data-act=wbManual]');
  await page.click('[data-act=wbToggle][data-d=fractions]');
  await page.click('[data-act=wbConfirm]');
  const d = await saved(page);
  expect(d.profiles[d.current].workbook.skills).toEqual(['fractions']);
  expect(errors).toEqual([]);
});

test('test_F22_AC2: nothing changes until the grown-up confirms; skills can be added and removed; cancel leaves no goal', async ({ page }) => {
  await fakeClaude(page);
  await open(page);
  await toWorkbookTab(page);
  const before = await saved(page);
  await page.locator('#wbPhoto').setInputFiles({ name: 'page.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('Quelles habiletés la page demande-t-elle?')).toBeVisible();
  const p0 = before.profiles[before.current], d1 = await saved(page), p1 = d1.profiles[d1.current];
  expect(p1.skills).toEqual(p0.skills); expect(p1.focus).toEqual(p0.focus); expect(p1.workbook ?? null).toBeNull();
  await page.click('[data-act=wbCancel]');
  const d2 = await saved(page); expect(d2.profiles[d2.current].workbook ?? null).toBeNull();
  // Again, then edit the list and confirm.
  await page.locator('#wbPhoto').setInputFiles({ name: 'page.png', mimeType: 'image/png', buffer: PNG });
  await page.click('[data-act=wbToggle][data-d=divfacts]');           // remove
  await expect(page.locator('[data-act=wbConfirm]')).toBeDisabled();
  await page.click('[data-act=wbToggle][data-d=multmid]');            // add
  await page.click('[data-act=wbToggle][data-d=fractions]');          // add
  await page.click('[data-act=wbConfirm]');
  const d3 = await saved(page), g = d3.profiles[d3.current].workbook;
  expect(g.skills).toEqual(['multmid', 'fractions']);
  expect(g.checkedAt).toBe(0);
});

test('test_F22_AC3: the photo goes only to the reading call and is never stored; nothing from the page or the learner is kept or sent', async ({ page }) => {
  await fakeClaude(page);
  await open(page);
  await toWorkbookTab(page, 'Robin');
  await page.locator('#wbPhoto').setInputFiles({ name: 'page.png', mimeType: 'image/png', buffer: PNG });
  await page.click('[data-act=wbConfirm]');
  const calls = await page.evaluate(() => (window as unknown as { __calls: { input: string; images: number; bytes: number }[] }).__calls);
  expect(calls).toHaveLength(1);
  expect(calls[0].images).toBe(1);
  expect(calls[0].bytes).toBe(PNG.length);
  expect(calls[0].input).not.toContain('Robin');
  const all = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
  expect(all).not.toContain(TOPIC);
  expect(all).not.toContain('long division');
  expect(all).not.toMatch(/data:image|iVBORw0K/);
  const d = await saved(page), g = d.profiles[d.current].workbook;
  expect(Object.keys(g).sort()).toEqual(['at', 'checkedAt', 'results', 'skills']);
  // The file input is cleared after reading.
  expect(await page.locator('#wbPhoto').inputValue().catch(() => '')).toBe('');
});

test('test_F22_AC4: the learner takes the check from home: numbers level, no hints, "I\'m not sure" on every question, no score', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Kai', 0);
  await page.click('[data-act=skipPlace]');
  await page.evaluate(() => { const ns = (window as any).__ns; ns.G.prof.workbook = { at: Date.now(), skills: ['divfacts'], checkedAt: 0, results: {} }; ns.G.store.save(); ns.G.UI.screen = 'home'; ns.render(); });
  await expect(page.getByText('Vérifions les habiletés de ton cahier')).toBeVisible();
  await page.click('[data-act=beginCheck]');
  for (let i = 0; i < 20; i++) {
    if (await page.locator('[data-act=home]').count()) break;
    await expect(page.locator('.chip').first()).toHaveText('Vérification du cahier');
    await expect(page.locator('[data-act=hint]')).toHaveCount(0);
    await expect(page.locator('[data-act=chart]')).toHaveCount(0);
    await expect(page.locator('[data-act=unsure]')).toBeVisible();
    expect(await page.evaluate(() => (window as any).__ns.G.Cur.q.stage)).toBe(2);
    await page.click('[data-act=unsure]');
    await expect(page.locator('#fb')).not.toContainText(/pointage|faux|mauvais/i);
    await page.click('[data-act=next]');
  }
  await expect(page.getByText('Vérification terminée')).toBeVisible();
  expect(errors).toEqual([]);
});

test('test_F22_AC5: after the check, the results screen shows what is solid and where she starts, and home aims at the path', async ({ page }) => {
  await open(page);
  await createLearner(page, 'Ida', 0);
  await page.click('[data-act=skipPlace]');
  // Lit through × 2, 5, 10; goal: division facts. She will get division-facts questions wrong and the rest right.
  await page.evaluate(() => { const ns = (window as any).__ns, p = ns.G.prof;
    for (const id of ['quantity', 'numberline', 'placevalue', 'makes10', 'addition', 'subtraction', 'multmeaning', 'multeasy', 'divmeaning']) Object.assign(p.skills[id], { mastered: true, stage: 2, best: 2 });
    p.focus = null; p.workbook = { at: Date.now(), skills: ['divfacts'], checkedAt: 0, results: {} }; ns.G.store.save(); ns.G.UI.screen = 'home'; ns.render(); });
  await page.click('[data-act=beginCheck]');
  for (let i = 0; i < 20; i++) {
    if (await page.locator('[data-act=home]').count()) break;
    const right = await page.evaluate(() => { const ns = (window as any).__ns, q = ns.G.Cur.q; if (q.skill === 'divfacts') return null; return q.kind === 'pad' ? String(q.answer) : q.options.findIndex((o: { value: unknown }) => String(o.value) === String(q.answer)); });
    if (right === null) await page.click('[data-act=unsure]');
    else if (typeof right === 'string') { for (const ch of right) await page.click(`[data-act=key][data-d="${ch}"]`); await page.click('[data-act=key][data-d=ok]'); }
    else await page.click(`[data-act=opt][data-i="${right}"]`);
    await page.click('[data-act=next]');
  }
  await expect(page.getByText('On va construire ces habiletés')).toBeVisible();
  await expect(page.locator('.card')).toContainText('Faits de division');
  const p = await page.evaluate(() => (window as any).__ns.G.prof);
  expect(p.workbook.results.divfacts).toBe('fail');
  expect(p.workbook.checkedAt).toBeGreaterThan(0);
  expect(p.skills.divfacts.stage).toBe(1);
  await page.click('[data-act=home]');
  await expect(page.locator('.side .next .eyebrow').last()).toHaveText(/pour ton cahier/i);
});

test('test_F22_AC6: the grown-up can clear the goal and practice returns to the usual order', async ({ page }) => {
  await open(page);
  await createLearner(page, 'Lu', 0);
  await page.click('[data-act=skipPlace]');
  await page.evaluate(() => { const ns = (window as any).__ns; ns.G.prof.workbook = { at: Date.now(), skills: ['fractions'], checkedAt: 1, results: {} }; ns.G.store.save(); });
  await holdGrownUps(page);
  await grownTab(page, 'workbook');
  await expect(page.getByText('Objectif actuel du cahier')).toBeVisible();
  await page.click('[data-act=wbClear]');
  await page.click('[data-act=doWbClear]');
  const d = await saved(page);
  expect(d.profiles[d.current].workbook).toBeNull();
});
