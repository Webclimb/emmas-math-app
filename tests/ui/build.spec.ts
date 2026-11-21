// M0 exit check "build is one file" (spec section 7): one self-contained index.html, at most 1.5 MB,
// inline script and styles, no remote scripts, images or styles other than the font stylesheet.
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { DIST } from './helpers';

test('build: dist holds exactly one self-contained index.html under 1.5 MB', () => {
  expect(readdirSync(DIST.replace(/index\.html$/, ''))).toEqual(['index.html']);
  expect(statSync(DIST).size).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  const html = readFileSync(DIST, 'utf8');
  expect(html).not.toMatch(/<script[^>]+src=/i);
  expect(html).not.toMatch(/<img[^>]+src=["']?https?:/i);
  const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]);
  expect(links.every(h => /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(h))).toBe(true);
  expect(html).toMatch(/<style[^>]*>/);
  // No alert/confirm (artifact constraint) and no analytics.
  expect(html).not.toMatch(/\b(alert|confirm)\(/);
  expect(html).not.toMatch(/google-analytics|gtag\(|segment\.io|mixpanel/i);
});
