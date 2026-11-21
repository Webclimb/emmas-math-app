// Design tokens: the only source of colours, fonts, type, radius, borders, spacing and sizes.
// Reads design/tokens.json (direction B "Star Lines", milestone MD, SPEC.md D-18).
// Token values are short phrases ("52px compact, 56-58px from 720px"); this module turns them into
// CSS custom properties, with the compact values switched in under the compact breakpoint.
import raw from '../../design/tokens.json';

type ColorSet = Record<string, { value: string; role: string }>;
export type AccentKey = 'accent' | 'accent-ink' | 'accent-soft' | 'accent-text' | 'focus';
export interface AccentTheme { name: string; priceGems: number; light: Record<AccentKey, string>; dark: Record<AccentKey, string> }

export const TOKENS = raw as unknown as {
  version: string;
  color: { light: ColorSet; dark: ColorSet };
  accentThemes: Record<string, AccentTheme>;
  font: Record<'display' | 'body', { family: string; fallback: string; weights: number[] }>;
  type: Record<string, string>;
  radius: Record<string, string>;
  border: Record<string, string>;
  space: Record<string, string>;
  size: Record<string, string>;
  motion: Record<string, string>;
  graphics: {
    tenFrame: { cell: number; gap: number; counterRadius: number };
    array: { pitch: number; dotRadius: number };
    numberLine: { viewBox: string; axisY: number; left: number; right: number; markerRadius: number; majorTick: number; minorTick: number };
    fractionBar: { viewBox: string };
    fractionCircle: { viewBox: string; radius: number };
    factTriangle: { viewBox: string; nodeRadius: number };
    star: { viewBox: string; outerRadius: number; innerRadius: number; points: number };
  };
};

/** "480 x 112" -> [480, 112] */
export function viewBox(s: string): [number, number] {
  const m = s.match(/([\d.]+)\s*x\s*([\d.]+)/);
  if (!m) throw new Error(`bad viewBox token "${s}"`);
  return [Number(m[1]), Number(m[2])];
}

export const G = TOKENS.graphics;
export const THEMES = TOKENS.accentThemes;
export const DEFAULT_THEME = 'cobalt';
export const FALLBACK_ACCENT = TOKENS.color.light.accent.value;
export const RADIUS_TENFRAME_CELL = parseFloat(TOKENS.radius.tenFrameCell);

/** Breakpoints from size.breakpoints: compact under the first, wide from the second. */
export const BREAKPOINTS = (() => {
  const s = TOKENS.size.breakpoints;
  const compact = Number(s.match(/compact under (\d+)px/)![1]);
  const wide = Number(s.match(/wide from (\d+)px/)![1]);
  return { compact, wide };
})();

/** Split on commas that are not inside parentheses. */
function topLevelSplit(s: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export interface Measure { base?: string; max?: string; narrow?: string }
/** Reads a size phrase: "16px (14px under 720px wide)", "52px compact, 56-58px from 720px", "clamp(...)", "10-12px". */
export function parseMeasure(s: string): Measure {
  const out: Measure = {};
  const n = s.match(/(\d+(?:\.\d+)?px)\s+(?:apart\s+)?(?:under \d+px wide|compact)/);
  if (n) out.narrow = n[1];
  const w = s.match(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?px\s+(?:apart\s+)?from \d+px/);
  if (w) { out.base = w[1] + 'px'; if (w[2]) out.max = w[2] + 'px'; return out; }
  if (s.startsWith('clamp(')) { out.base = topLevelSplit(s)[0].startsWith('clamp(') ? s.slice(0, matchParen(s, 5) + 1) : s; return out; }
  const f = s.match(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?(px|%)/);
  if (f) { out.base = f[1] + f[3]; if (f[2]) out.max = f[2] + f[3]; }
  return out;
}
function matchParen(s: string, open: number): number { let d = 0; for (let i = open; i < s.length; i++) { if (s[i] === '(') d++; if (s[i] === ')' && --d === 0) return i; } return s.length - 1; }

/** "clamp(27px, 2.7vw, 34px) / 1.08, 700, display, -0.01em" -> size, lh, weight, family, tracking, transform. */
export function parseType(s: string): Record<string, string> {
  const main = s.split(';')[0].replace(/\s\([^()]*\)\s*$/, '');
  const parts = topLevelSplit(main), out: Record<string, string> = {};
  const [size, lh] = parts[0].split(/\s+\/\s+/);
  const r = size.trim().match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)px$/);
  if (r) { out.size = r[1] + 'px'; out['size-max'] = r[2] + 'px'; } else out.size = size.trim();
  if (lh) out.lh = lh.trim();
  for (const p of parts.slice(1)) {
    if (/^\d{3}$/.test(p)) out.weight = p;
    else if (p === 'display' || p === 'body') out.family = `var(--font-${p})`;
    else if (p === 'uppercase') out.transform = p;
    else if (/em tracking$/.test(p)) out.tracking = p.replace(/\s*tracking$/, '');
    else if (/^-?[\d.]+em$/.test(p)) out.tracking = p;
  }
  return out;
}

/** "2px solid ink (today card...)" -> "2px solid var(--ink)". Ranges take the upper value. */
export function parseBorder(s: string): string | null {
  const m = s.split(';')[0].match(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?px\s+(solid|dashed|dotted)\s+([a-z-]+)/);
  return m ? `${m[2] || m[1]}px ${m[3]} var(--${m[4]})` : null;
}

const GENERIC = /^(system-ui|ui-[a-z-]+|serif|sans-serif|monospace|cursive|fantasy)$/;
function family(f: { family: string; fallback: string }) {
  const first = GENERIC.test(f.family) ? f.family : `"${f.family}"`;
  return `${first},${f.fallback.replace(/,\s*/g, ',')}`;
}

function colorVars(mode: 'light' | 'dark'): string {
  return Object.entries(TOKENS.color[mode]).map(([k, x]) => `--${k}:${x.value};`).join('') + `color-scheme:${mode};`;
}

/** Everything that does not change with the colour mode, plus the compact overrides. */
function staticVars(): { wide: string[]; narrow: string[] } {
  const wide: string[] = [], narrow: string[] = [];
  const put = (name: string, m: Measure) => {
    if (m.base) wide.push(`${name}:${m.base}`);
    if (m.max) wide.push(`${name}-max:${m.max}`);
    if (m.narrow) narrow.push(`${name}:${m.narrow}`);
  };
  wide.push(`--font-display:${family(TOKENS.font.display)}`, `--font-body:${family(TOKENS.font.body)}`);
  for (const [k, v] of Object.entries(TOKENS.type)) for (const [p, x] of Object.entries(parseType(v))) wide.push(`--type-${k}-${p}:${x}`);
  for (const [k, v] of Object.entries(TOKENS.radius)) {
    put(`--radius-${k}`, parseMeasure(v.split(';')[0]));
    const hero = v.match(/hero cards (\d+px)/); if (hero) wide.push(`--radius-${k}-hero:${hero[1]}`);
  }
  for (const [k, v] of Object.entries(TOKENS.border)) { const b = parseBorder(v); if (b) wide.push(`--border-${k}:${b}`); }
  for (const [k, v] of Object.entries(TOKENS.space)) put(`--space-${k}`, parseMeasure(v));
  for (const [k, v] of Object.entries(TOKENS.size)) {
    if (k === 'breakpoints') continue;
    if (k === 'contentMaxWidth') { for (const part of v.split(';')) { const m = part.match(/([a-z-]+)[a-z -]*?(\d+px)/i); if (m) wide.push(`--size-max-${m[1]}:${m[2]}`); } continue; }
    put(`--size-${k}`, parseMeasure(v));
  }
  for (const [k, v] of Object.entries(TOKENS.motion)) { const m = v.match(/^(\d+ms)/); if (m) wide.push(`--motion-${k}:${m[1]}`); }
  return { wide, narrow };
}

/** The full :root block: light by default, dark by system preference or data-theme="dark", compact overrides. */
export function tokenCss(): string {
  const light = colorVars('light'), dark = colorVars('dark'), sv = staticVars();
  return `:root{${sv.wide.join(';')};${light}}`
    + `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`
    + `:root[data-theme="dark"]{${dark}}`
    + `@media (max-width: ${BREAKPOINTS.compact - 1}px){:root{${sv.narrow.join(';')}}}`;
}
