// Milestone MG (D-23), UI side: F-23 comma key and hands-on widgets, F-8.AC-4 warm-up at grade level.
import { expect, test, type Page } from '@playwright/test';
import { createLearner, open, saved } from './helpers';

/** Shows a question made by the engine; returns what the test needs to answer it. */
async function show(page: Page, skill: string, stage: number, easy: boolean, want?: 'decimal' | 'whole') {
  return page.evaluate(([sk, st, e, w]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ns = (window as any).__ns, G = ns.G;
    G.S = { mode: 'practice', n: 10, i: 0, answered: 0, correct: 0, gems: 0, start: Date.now(), events: [], P: null, early: false };
    let q: any; for (let i = 0; i < 200; i++) { q = ns.makeQuestion(sk, st, e); if (!w || (w === 'decimal') === !!q.decimal) break; }
    q.review = false; G.Cur = ns.newCurrent(q); G.UI.screen = 'practice'; ns.render();
    return { answer: String(q.answer), decimal: !!q.decimal, build: q.build,
      followup: q.followup ? q.followup.options.findIndex((o: { value: unknown }) => String(o.value) === String(q.followup.answer)) : -1 };
  }, [skill, stage, easy, want] as [string, number, boolean, string | undefined]);
}
const key = (page: Page, k: string) => page.locator(`[data-act=key][data-d="${k}"]`);

test('test_F23_AC4: decimal questions have a comma key; whole-number questions do not', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Lou', 0);
  await page.click('[data-act=skipPlace]');
  // Whole number: no comma key.
  await show(page, 'addcol', 2, true);
  await expect(page.locator('.pad')).toBeVisible();
  await expect(key(page, ',')).toHaveCount(0);
  // Decimal: comma key, tapped.
  const q = await show(page, 'multdec', 2, true, 'decimal');
  expect(q.decimal).toBe(true);
  await expect(key(page, ',')).toBeVisible();
  await expect(key(page, ',')).toHaveAccessibleName('Virgule');
  for (const ch of q.answer) await key(page, ch).click();
  await expect(page.locator('.padshow')).toContainText(q.answer);
  await key(page, 'ok').click();
  await expect(page.locator('#fb.good')).toBeVisible();
  expect(errors).toEqual([]);
});

test('test_F23_AC4: a physical keyboard types the comma with "," or "."; trailing zeros still count as right (F-23.AC-3)', async ({ page }) => {
  await open(page);
  await createLearner(page, 'Noa', 0);
  await page.click('[data-act=skipPlace]');
  for (const sep of [',', '.']) {
    const q = await show(page, 'multdec', 2, true, 'decimal');
    expect(q.answer).toContain(',');
    for (const ch of q.answer + '0') await page.keyboard.press(ch === ',' ? sep : ch);
    await expect(page.locator('.padshow')).toContainText(q.answer + '0');
    await page.keyboard.press('Enter');
    await expect(page.locator('#fb.good')).toBeVisible();
  }
  // In a whole-number question the comma does nothing.
  await show(page, 'addcol', 2, true);
  await page.keyboard.press('1'); await page.keyboard.press(','); await page.keyboard.press('.'); await page.keyboard.press('2');
  await expect(page.locator('.padshow')).toHaveText('12');
});

// Real taps on the hands-on widgets of each new skill (F-23.AC-2, F-5.AC-2).
for (const skill of ['grandsnombres', 'puissances', 'decimaux', 'arrondir', 'addcol', 'multcol', 'multdec', 'probdec']) {
  test(`test_F23_AC2: ${skill} hands-on solved by real taps is marked correct`, async ({ page }) => {
    const errors = await open(page);
    await createLearner(page, 'Tap', 0);
    await page.click('[data-act=skipPlace]');
    for (const easy of [true, false]) {
      const q = await show(page, skill, 0, easy), bd = q.build;
      expect(['pvchart', 'shift', 'steps']).toContain(bd.type);
      if (bd.type === 'pvchart') {
        const digits: number[] = await page.evaluate(b => b.cols.map((c: string) => (window as any).__ns.digitAt(b.target, c)), bd); // eslint-disable-line @typescript-eslint/no-explicit-any
        for (let i = 0; i < digits.length; i++) for (let n = 0; n < digits[i]; n++) await page.locator(`[data-act=pvc][data-d="${i}+"]`).click();
        await page.click('[data-act=bcheck]');
      } else if (bd.type === 'shift') {
        for (let n = 0; n < Math.abs(bd.k); n++) await page.click(`[data-act=shift][data-d=${bd.k > 0 ? 'm' : 'd'}]`);
        await page.click('[data-act=bcheck]');
      } else {
        for (const st of bd.steps as { answer: string; choices?: string[] }[]) {
          if (st.choices) await page.locator(`[data-act=stepChoice][data-d="${st.answer}"]`).click();
          else { for (const ch of st.answer) await key(page, ch).click(); await key(page, 'ok').click(); }
        }
        await expect(page.locator('.steplog li')).toHaveCount(bd.steps.length);
      }
      if (q.followup >= 0) await page.locator(`[data-act=fopt][data-i="${q.followup}"]`).click();
      await expect(page.locator('#fb.good')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

test('test_F8_AC4: the first-run warm-up starts at grade level, steps back on misses, and sets the workbook goal', async ({ page }) => {
  const errors = await open(page);
  await createLearner(page, 'Mia', 0);
  await expect(page.getByText('D’abord, un petit échauffement')).toBeVisible();
  await page.click('[data-act=beginPlace]');
  const targets: string[] = await page.evaluate(() => (window as any).__ns.G.prof.workbook.skills); // eslint-disable-line @typescript-eslint/no-explicit-any
  expect([...targets].sort()).toEqual(['decimaux', 'multdec', 'probdec']);
  const asked: string[] = [];
  for (let i = 0; i < 20; i++) {
    if (await page.locator('[data-act=home]').count()) break;
    await expect(page.locator('.bar .chip').first()).toHaveText('Échauffement');
    const it = await page.evaluate(() => { const C = (window as any).__ns.G.Cur.q; return { skill: C.skill, stage: C.stage }; }); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(it.stage).toBe(2);
    asked.push(it.skill);
    await page.click('[data-act=unsure]');
    await page.click('[data-act=next]');
  }
  expect(targets).toContain(asked[0]);
  expect(asked.length).toBeLessThanOrEqual(16);
  expect(asked.some(id => !targets.includes(id))).toBe(true); // stepped back toward fundamentals
  await expect(page.getByText('Échauffement terminé')).toBeVisible();
  const d = await saved(page), p = d.profiles[d.current];
  expect(p.placementDone).toBe(true);
  expect(p.workbook.checkedAt).toBeGreaterThan(0);
  expect(p.sessions.at(-1).m).toBe('placement');
  await page.click('[data-act=home]');
  await expect(page.locator('.mapcard')).toBeVisible();
  expect(errors).toEqual([]);
});
