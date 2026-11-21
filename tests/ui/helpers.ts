// Shared helpers for UI checks. They run against the built single file, dist/index.html.
import { expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';

export const DIST = resolve(process.cwd(), 'dist/index.html');
export const url = (hooks = true) => 'file://' + DIST + (hooks ? '?nstest' : '');

/** Blocks font requests (the only network the app makes) so checks run offline, and collects page errors. */
export async function open(page: Page, { hooks = true, save }: { hooks?: boolean; save?: string } = {}) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (save !== undefined) await page.addInitScript(s => { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('numbersky.v1', s); sessionStorage.setItem('__seeded', '1'); } }, save);
  await page.goto(url(hooks));
  await expect(page.locator('.boot')).toHaveCount(0, { timeout: 5000 });
  return errors;
}

/** Creates a learner from the welcome screen. */
export async function createLearner(page: Page, name: string, avatarIndex = 0) {
  await page.fill('#pname', name);
  await page.click(`button.av >> nth=${avatarIndex}`);
  await page.click('button[type=submit]');
}

/** Opens the grown-up view with the press-and-hold gate. */
export async function holdGrownUps(page: Page) {
  await page.locator('[data-hold]').scrollIntoViewIfNeeded();
  const box = (await page.locator('[data-hold]').boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
  await expect(page.getByText('Grown-up view')).toBeVisible();
}

/** Opens one tab of the grown-up view (Progress, Patterns, Sessions, Settings, Data). */
export async function grownTab(page: Page, tab: 'progress' | 'patterns' | 'sessions' | 'settings' | 'data') {
  await page.click(`[data-act=gtab][data-d=${tab}]`);
}

/** The learner's name as the home and grown-up headers show it. */
export const nameOnHome = (page: Page) => page.locator('.head .who .name');

export const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('numbersky.v1') || 'null'));
