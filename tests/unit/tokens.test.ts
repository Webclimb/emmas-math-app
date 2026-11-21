// Spec section 7 (Design system): no colour or font literal outside the token file.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseType, tokenCss, TOKENS } from '../../src/design/tokens';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
}
const SRC = resolve(process.cwd(), 'src');

describe('design tokens', () => {
  test('no colour literal (hex, rgb, hsl) and no font family name appears in src/ outside the token module', () => {
    const bad: string[] = [];
    const families = Object.values(TOKENS.font).flatMap(f => [f.family, ...f.fallback.split(',').map(s => s.trim().replace(/"/g, ''))]);
    for (const f of files(SRC)) {
      if (f.endsWith('design/tokens.ts')) continue;
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)) bad.push(`${f.slice(SRC.length)}: ${m[0]}`);
      for (const fam of families) if (fam && !/^(system-ui|sans-serif|monospace)$/.test(fam) && text.includes(fam)) bad.push(`${f.slice(SRC.length)}: font ${fam}`);
      for (const m of text.matchAll(/font-family:\s*([^;}"'`]+)/g)) if (!/^var\(--font-/.test(m[1].trim())) bad.push(`${f.slice(SRC.length)}: font-family ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  test('generated CSS carries every colour token for both modes, and v1 values are unchanged', () => {
    const css = tokenCss();
    for (const mode of ['light', 'dark'] as const) for (const [k, v] of Object.entries(TOKENS.color[mode])) expect(css).toContain(`--${k}:${v.value};`);
    expect(TOKENS.color.light.accent.value).toBe('#E59A0B');
    expect(TOKENS.color.dark.bg.value).toBe('#0D1330');
    expect(css).toContain('--font-display:"Bricolage Grotesque","Trebuchet MS",system-ui,sans-serif');
    expect(css).toContain('--font-mono:ui-monospace,Menlo,monospace');
    expect(css).toContain('--size-primaryButtonHeight:56px');
    expect(css).toContain('--size-primaryButtonHeight-max:62px');
    expect(css).toContain('--space-cardPadding-narrow:16px');
  });

  test('type tokens parse into size, line height, weight, transform and tracking', () => {
    expect(parseType('clamp(1.85rem, 6vw, 2.5rem) / 1.12, 800')).toEqual({ size: 'clamp(1.85rem, 6vw, 2.5rem)', lh: '1.12', weight: '800' });
    expect(parseType('0.85rem, 600, uppercase, 0.08em tracking')).toEqual({ size: '0.85rem', weight: '600', transform: 'uppercase', tracking: '0.08em' });
    expect(parseType('18px / 1.5')).toEqual({ size: '18px', lh: '1.5' });
  });

  test('every CSS custom property used in the stylesheet is defined', () => {
    const css = readFileSync(join(SRC, 'app/styles.css'), 'utf8'), defined = tokenCss();
    const used = new Set([...css.matchAll(/var\((--[a-zA-Z0-9-]+)\)/g)].map(m => m[1]));
    const missing = [...used].filter(v => !defined.includes(v + ':'));
    expect(missing).toEqual([]);
  });
});
