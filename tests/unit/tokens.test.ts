// Spec section 7 (Design system): no colour or font literal outside the token file.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { BREAKPOINTS, parseBorder, parseMeasure, parseType, tokenCss, TOKENS } from '../../src/design/tokens';

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
      for (const m of text.matchAll(/font-family:\s*([^;}"'`]+)/g)) if (!/^var\(--(font-|type-[a-zA-Z0-9]+-family)/.test(m[1].trim())) bad.push(`${f.slice(SRC.length)}: font-family ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  test('generated CSS carries every colour token for both modes, from design/tokens.json', () => {
    const css = tokenCss();
    for (const mode of ['light', 'dark'] as const) for (const [k, v] of Object.entries(TOKENS.color[mode])) expect(css).toContain(`--${k}:${v.value};`);
    expect(TOKENS.version).toBe('2.0.0');
    expect(TOKENS.color.light.accent.value).toBe('#2547D0');
    expect(css).toContain('--font-display:"Space Grotesk","Segoe UI",system-ui,sans-serif');
    expect(css).toContain('--size-primaryButtonHeight:56px');
    expect(css).toContain('--border-heroCard:2px solid var(--ink)');
    expect(css).toMatch(/@media \(max-width: 719px\)\{:root\{[^}]*--space-cardPadding:14px/);
  });

  test('type, size and border phrases parse', () => {
    expect(parseType('clamp(27px, 2.7vw, 34px) / 1.08, 700, display, -0.01em')).toEqual({ size: 'clamp(27px, 2.7vw, 34px)', lh: '1.08', weight: '700', family: 'var(--font-display)', tracking: '-0.01em' });
    expect(parseType('13-14px / 1.2, 700, display, uppercase, 0.06em tracking')).toEqual({ size: '13px', 'size-max': '14px', lh: '1.2', weight: '700', family: 'var(--font-display)', transform: 'uppercase', tracking: '0.06em' });
    expect(parseType('clamp(19px, 1.9vw, 24px) / 1.4, 400, body; numbers in the prompt 700')).toEqual({ size: 'clamp(19px, 1.9vw, 24px)', lh: '1.4', weight: '400', family: 'var(--font-body)' });
    expect(parseMeasure('52px compact, 56-58px from 720px')).toEqual({ narrow: '52px', base: '56px', max: '58px' });
    expect(parseMeasure('16px (14px under 720px wide)')).toEqual({ narrow: '14px', base: '16px' });
    expect(parseMeasure('stations 91px apart compact, 140px apart from 720px')).toEqual({ narrow: '91px', base: '140px' });
    expect(parseMeasure('clamp(16px, 4vw, 48px)')).toEqual({ base: 'clamp(16px, 4vw, 48px)' });
    expect(parseBorder('2.5-3px dashed warm (options); 2px solid warm (feedback card)')).toBe('3px dashed var(--warm)');
    expect(BREAKPOINTS).toEqual({ compact: 720, wide: 1024 });
  });

  test('every CSS custom property used in the stylesheet is defined', () => {
    const css = readFileSync(join(SRC, 'app/styles.css'), 'utf8'), defined = tokenCss();
    const used = new Set([...css.matchAll(/var\((--[a-zA-Z0-9-]+)\)/g)].map(m => m[1]));
    const missing = [...used].filter(v => !defined.includes(v + ':') && !css.includes(v + ':'));
    expect(missing).toEqual([]);
  });
});
