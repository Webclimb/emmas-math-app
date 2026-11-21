// M0 acceptance criteria that need the real page (spec section 13). Run against dist/index.html.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createLearner, holdGrownUps, open, saved } from './helpers';

const TOKENS = JSON.parse(readFileSync(resolve(process.cwd(), 'design/tokens.v1.json'), 'utf8'));
const V1_SAVE = readFileSync(resolve(process.cwd(), 'tests/fixtures/v1-save.json'), 'utf8');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ns = (page: Page, f: (ns: any) => unknown) => page.evaluate(`(${f.toString()})(window.__ns)`);

// ---------- F-1 Learner profile ----------
test('test_F1_AC1: with no saved data the welcome screen opens, and a learner is created with a 1-20 character nickname and one free avatar', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('#pname')).toBeVisible();
  // Only free avatars are offered at sign-up.
  const offered = await page.locator('button.av').allTextContents();
  expect(offered).toEqual(['🦊', '🐢', '🐙']);
  // Empty nickname is refused.
  await page.click('button[type=submit]');
  await expect(page.locator('#pname')).toBeVisible();
  expect(await saved(page)).toBeNull();
  // 25 characters typed: 20 kept.
  await page.fill('#pname', '');
  await page.locator('#pname').pressSequentially('ABCDEFGHIJKLMNOPQRSTUVWXY');
  await page.click('button.av >> nth=2');
  await page.click('button[type=submit]');
  await expect(page.getByText('First, a quick warm-up')).toBeVisible();
  let d = await saved(page), p = d.profiles[d.current];
  expect(p.name).toBe('ABCDEFGHIJKLMNOPQRST');
  expect(p.avatar).toBe('🐙');
  expect(p.owned.avatars).toEqual(['🐙']);
  // A 1-character nickname also works (second learner, from the grown-up view).
  await page.click('[data-act=skipPlace]');
  await holdGrownUps(page);
  await page.click('[data-act=addLearner]');
  await createLearner(page, 'Z', 0);
  d = await saved(page); p = d.profiles[d.current];
  expect(p.name).toBe('Z');
  expect(p.avatar).toBe('🦊');
  expect(errors).toEqual([]);
});

// F-1.AC-2 (CHANGE) was approved on 2026-11-21 (SPEC.md v2.1-draft). The test is unchanged from when it was parked.
test('test_F1_AC2: the welcome form asks for a nickname, not a full name, and stores no birth date, school or diagnosis', async ({ page }) => {
  await open(page);
  await expect(page.locator('label[for=pname]')).toContainText(/nickname/i);
  await expect(page.locator('#newp')).not.toContainText(/full name/i);
  expect(await page.locator('#newp input, #newp select, #newp textarea').count()).toBe(1);
  await createLearner(page, 'Sky', 0);
  const d = await saved(page), p = d.profiles[d.current];
  expect(Object.keys(p).sort()).toEqual(['avatar', 'created', 'days', 'focus', 'gems', 'id', 'log', 'mis', 'name', 'owned', 'placementDone', 'sessions', 'settings', 'skills', 'theme']);
});

test('test_F1_AC3: with two learners the grown-up view switches between them and progress stays separate', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Ana', 0);
  await page.click('[data-act=skipPlace]');
  await page.click('[data-act=start]');
  await page.click('[data-act=unsure]');
  await page.click('[data-act=next]');
  await page.click('[data-act=quit]'); await page.click('[data-act=doQuit]');
  await page.click('[data-act=home]');
  const ana = await ns(page, n => ({ gems: n.G.prof.gems, log: n.G.prof.log.length, id: n.G.prof.id })) as { gems: number; log: number; id: string };
  expect(ana.log).toBe(1);
  await holdGrownUps(page);
  await page.click('[data-act=addLearner]');
  await createLearner(page, 'Ben', 1);
  await page.click('[data-act=skipPlace]');
  const ben = await ns(page, n => ({ gems: n.G.prof.gems, log: n.G.prof.log.length, name: n.G.prof.name })) as { gems: number; log: number; name: string };
  expect(ben).toEqual({ gems: 10, log: 0, name: 'Ben' });
  await holdGrownUps(page);
  await expect(page.locator('.learners li')).toHaveCount(2);
  await page.click(`[data-act=switchTo][data-d="${ana.id}"]`);
  await expect(page.locator('.hello .hi')).toHaveText('Hi, Ana');
  const back = await ns(page, n => ({ gems: n.G.prof.gems, log: n.G.prof.log.length })) as { gems: number; log: number };
  expect(back).toEqual({ gems: ana.gems, log: 1 });
  const d = await saved(page);
  expect(Object.values(d.profiles).map((p: unknown) => (p as { name: string }).name).sort()).toEqual(['Ana', 'Ben']);
  expect(errors).toEqual([]);
});

// ---------- F-6 Feedback and error patterns ----------
function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const rgb = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

test('test_F6_AC1: a wrong answer shows not-right, the pattern sentence, a worked explanation with a visual, then the answer; no red, no buzzer, no lost gems', async ({ page }) => {
  await page.addInitScript(() => {
    // Record every tone the page plays.
    const w = window as unknown as { __tones: { f: number; type: string }[] }; w.__tones = [];
    const AC = window.AudioContext;
    if (AC) {
      const orig = AC.prototype.createOscillator;
      AC.prototype.createOscillator = function () { const o = orig.call(this); const start = o.start.bind(o); o.start = (t?: number) => { w.__tones.push({ f: o.frequency.value, type: o.type }); start(t); }; return o; };
    }
  });
  const errors = await open(page);
  await createLearner(page, 'Mo', 0);
  await page.click('[data-act=skipPlace]');
  const q = await ns(page, n => {
    n.seed(11);
    n.G.S = { mode: 'practice', n: 10, i: 0, answered: 0, correct: 0, gems: 0, start: Date.now(), events: [], P: null, early: false };
    const q = n.makeQuestion('divfacts', 2, false); q.review = false; n.G.Cur = n.newCurrent(q); n.G.UI.screen = 'practice'; n.render();
    return { a: q.meta.a, b: q.meta.b, answer: q.answer, gems: n.G.prof.gems };
  }) as { a: number; b: number; answer: number; gems: number };
  for (const ch of String(q.a - q.b)) await page.click(`[data-act=key][data-d="${ch}"]`);
  await page.click('[data-act=key][data-d=ok]');
  const fb = page.locator('#fb');
  await expect(fb).toBeVisible();
  const order = await fb.evaluate(el => [...el.children].map(c => c.tagName.toLowerCase() + (c.className ? '.' + c.className : '')));
  expect(order.slice(0, 5)).toEqual(['h2', 'p', 'p', 'div.visual', 'p.ans']);
  await expect(fb.locator('h2')).toHaveText("Not quite. Let's look at it another way.");
  await expect(fb.locator('p').nth(0)).toHaveText('That answer comes from taking away. Dividing means sharing into equal groups.');
  await expect(fb.locator('p').nth(1)).toContainText(`÷ ${q.b} = ${q.answer}`);
  await expect(fb.locator('.visual svg')).toHaveCount(1);
  await expect(fb.locator('p.ans')).toHaveText(`The answer is ${q.answer}.`);
  // Gems: +1 for trying, never deducted.
  const after = await ns(page, n => n.G.prof.gems) as number;
  expect(after).toBe(q.gems + 1);
  // Not red: the card and the typed answer use the warm token, whose hue is orange, not red.
  const warm = TOKENS.color.light.warm.value;
  expect(await fb.evaluate(el => getComputedStyle(el).borderTopColor)).toBe(rgb(warm));
  for (const mode of ['light', 'dark']) { const hh = hue(TOKENS.color[mode].warm.value); expect(hh, mode).toBeGreaterThan(12); expect(hh, mode).toBeLessThan(45); }
  // No buzzer: one soft sine tone.
  const tones = await page.evaluate(() => (window as unknown as { __tones: { f: number; type: string }[] }).__tones);
  expect(tones).toEqual([{ f: 392, type: 'sine' }]);
  expect(errors).toEqual([]);
});

test('test_F6_AC3: the grown-up view lists observed patterns by count with the grown-up description and an at-home activity', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Pat', 0);
  await page.click('[data-act=skipPlace]');
  await ns(page, n => { const now = Date.now(); n.G.prof.mis = { regroup: { count: 1, last: now }, 'op-sub-for-div': { count: 5, last: now }, 'off-by-one': { count: 3, last: now } }; n.G.store.save(); });
  await holdGrownUps(page);
  const items = page.locator('ul.mis > li');
  await expect(items).toHaveCount(3);
  expect(await items.evaluateAll(els => els.map(e => e.getAttribute('data-pattern')))).toEqual(['op-sub-for-div', 'off-by-one', 'regroup']);
  await expect(items.nth(0)).toContainText('Used subtraction on a division question');
  await expect(items.nth(0)).toContainText('5×');
  await expect(items.nth(0)).toContainText('Try at home: Deal real objects');
  expect(errors).toEqual([]);
});

// ---------- F-20 Storage ----------
test('test_F20_AC1: progress persists across reloads', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Rae', 0);
  await page.click('[data-act=skipPlace]');
  await page.click('[data-act=start]');
  await page.click('[data-act=unsure]');
  await page.click('[data-act=next]');
  const before = await ns(page, n => ({ gems: n.G.prof.gems, log: n.G.prof.log.length, mis: n.G.prof.mis })) as object;
  await page.reload();
  await expect(page.locator('.boot')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.hello .hi')).toHaveText('Hi, Rae');
  expect(await ns(page, n => ({ gems: n.G.prof.gems, log: n.G.prof.log.length, mis: n.G.prof.mis }))).toEqual(before);
  expect(errors).toEqual([]);
});

test('test_F20_AC1: the v1 fixture save opens on the learner\'s star chart with progress intact', async ({ page }) => {
  const v1 = JSON.parse(V1_SAVE), p1 = v1.profiles[v1.current];
  const errors = await open(page, { save: V1_SAVE });
  await expect(page.locator('.hello .hi')).toHaveText(`Hi, ${p1.name}`);
  await expect(page.locator('.gems b')).toHaveText(String(p1.gems));
  await holdGrownUps(page);
  await expect(page.locator('.sess li')).toHaveCount(p1.sessions.length);
  await expect(page.locator('ul.mis > li')).toHaveCount(Object.keys(p1.mis).length);
  expect(errors).toEqual([]);
});

test('test_F20_AC3: a backup code can be copied and restored; a malformed code is rejected with a message and changes nothing', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Kit', 0);
  await page.click('[data-act=skipPlace]');
  await page.click('[data-act=start]');
  await page.click('[data-act=unsure]');
  await page.click('[data-act=next]');
  await page.click('[data-act=quit]'); await page.click('[data-act=doQuit]');
  await page.click('[data-act=home]');
  await holdGrownUps(page);
  await page.click('[data-act=copyBackup]');
  const code = await page.locator('#codeOut').inputValue();
  expect(JSON.parse(code).profile.name).toBe('Kit');
  const original = await saved(page);

  // Malformed: message shown, nothing changes.
  for (const bad of ['not a code', '{"profile":{}}', code.slice(0, 40)]) {
    await page.fill('#restoreText', bad);
    await page.click('#restoreForm button[type=submit]');
    await expect(page.locator('.toast')).toHaveText("That code doesn't look right. Paste the whole backup code.");
    await expect(page.locator('.modal')).toHaveCount(0);
    expect(await saved(page)).toEqual(original);
  }

  // Reset, then restore the code.
  await page.click('[data-act=reset]'); await page.click('[data-act=doReset]');
  await page.click('[data-act=skipPlace]');
  expect(await ns(page, n => n.G.prof.log.length)).toBe(0);
  await holdGrownUps(page);
  await page.fill('#restoreText', code);
  await page.click('#restoreForm button[type=submit]');
  await expect(page.locator('.modal h2')).toHaveText('Restore Kit?');
  await page.click('[data-act=doRestore]');
  await expect(page.locator('.hello .hi')).toHaveText('Hi, Kit');
  const restored = await saved(page), p = restored.profiles[restored.current], o = original.profiles[original.current];
  expect(p.log).toEqual(o.log);
  expect(p.skills).toEqual(o.skills);
  expect(errors).toEqual([]);
});

test('test_F20_AC4: the app makes no network requests other than fonts', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => requests.push(r.url()));
  await open(page, { hooks: false });
  await createLearner(page, 'Net', 0);
  await page.click('[data-act=skipPlace]');
  await page.click('[data-act=start]');
  await page.click('[data-act=unsure]');
  await page.click('[data-act=next]');
  const external = requests.filter(u => !u.startsWith('file://'));
  expect(external.filter(u => !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u))).toEqual([]);
});
