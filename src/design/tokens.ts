// Design tokens: the only source of colours, fonts, type, radius, spacing and graphic sizes.
// Reads design/tokens.v1.json today; swap the import for design/tokens.json when Claude Design delivers it.
import raw from '../../design/tokens.v1.json';

type ColorSet = Record<string, { value: string; role: string }>;
export interface AccentTheme {
  name: string;
  priceGems: number;
  light: Record<'accent' | 'accent-ink' | 'accent-soft', string>;
  dark: Record<'accent' | 'accent-ink' | 'accent-soft', string>;
}

export const TOKENS = raw as unknown as {
  version: string;
  color: { light: ColorSet; dark: ColorSet };
  accentThemes: Record<string, AccentTheme>;
  font: Record<'display' | 'body' | 'mono', { family: string; fallback: string; weights: number[] }>;
  type: Record<string, string>;
  radius: Record<string, string>;
  space: Record<string, string>;
  size: Record<string, string>;
  elevation: Record<string, string>;
  graphics: {
    tenFrame: { cell: number; gap: number; counterRadius: number };
    baseTen: { unit: string };
    array: { pitch: number; dotRadius: number };
    numberLine: { viewBox: string; axisY: number; left: number; right: number; markerRadius: number };
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
export const DEFAULT_THEME = 'marigold';
/** First accent colour, used where a computed style is unavailable. */
export const FALLBACK_ACCENT = TOKENS.color.light.accent.value;

/** Split on commas that are not inside parentheses. */
function topLevelSplit(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** "clamp(1.85rem, 6vw, 2.5rem) / 1.12, 800" -> size, line-height, weight, transform, tracking. */
export function parseType(s: string): Record<string, string> {
  const parts = topLevelSplit(s), out: Record<string, string> = {};
  const [size, lh] = parts[0].split(/\s+\/\s+/);
  out.size = size.trim();
  if (lh) out.lh = lh.trim();
  for (const p of parts.slice(1)) {
    if (/^\d{3}$/.test(p)) out.weight = p;
    else if (p === 'uppercase') out.transform = p;
    else if (/em tracking$/.test(p)) out.tracking = p.replace(/\s*tracking$/, '');
  }
  return out;
}

const GENERIC = /^(system-ui|ui-[a-z-]+|serif|sans-serif|monospace|cursive|fantasy)$/;
function family(f: { family: string; fallback: string }) {
  const first = GENERIC.test(f.family) ? f.family : `"${f.family}"`;
  return `${first},${f.fallback.replace(/,\s*/g, ',')}`;
}

/** CSS custom properties for one colour mode. Names match v1 (--bg, --surface, ...). */
function colorVars(mode: 'light' | 'dark'): string {
  const c = TOKENS.color[mode];
  const v = Object.entries(c).map(([k, x]) => `--${k}:${x.value};`).join('');
  return v + `--shadow:${mode === 'light' ? TOKENS.elevation.card : TOKENS.elevation.cardDark};color-scheme:${mode};`;
}

/** Everything that does not change with the colour mode. */
function staticVars(): string {
  const out: string[] = [];
  out.push(`--font-display:${family(TOKENS.font.display)}`, `--font-body:${family(TOKENS.font.body)}`, `--font-mono:${family(TOKENS.font.mono)}`);
  for (const [k, v] of Object.entries(TOKENS.type)) for (const [p, x] of Object.entries(parseType(v))) out.push(`--type-${k}-${p}:${x}`);
  for (const [k, v] of Object.entries(TOKENS.radius)) out.push(`--radius-${k}:${v}`);
  for (const [k, v] of Object.entries(TOKENS.space)) {
    const m = v.match(/^([\d.]+px)(?:\s*\(([\d.]+px) under ([\d.]+px) wide\))?/);
    if (!m) continue;
    out.push(`--space-${k}:${m[1]}`);
    if (m[2]) out.push(`--space-${k}-narrow:${m[2]}`);
  }
  for (const [k, v] of Object.entries(TOKENS.size)) {
    const m = v.match(/^([\d.]+)(?:-([\d.]+))?px$/);
    if (!m) continue;
    out.push(`--size-${k}:${m[1]}px`);
    if (m[2]) out.push(`--size-${k}-max:${m[2]}px`);
  }
  out.push(`--elev-button:${TOKENS.elevation.button}`, `--elev-button-pressed:${TOKENS.elevation.buttonPressed}`);
  const bt = TOKENS.graphics.baseTen.unit.match(/(\d+)px cube; rod (\d+) x (\d+); flat (\d+) x (\d+)/);
  if (bt) out.push(`--blk-unit:${bt[1]}px`, `--blk-rod-h:${bt[3]}px`, `--blk-flat:${bt[4]}px`);
  return out.join(';') + ';';
}

/** The full :root block, light by default, dark by system preference or data-theme="dark". */
export function tokenCss(): string {
  const light = colorVars('light'), dark = colorVars('dark');
  return `:root{${staticVars()}${light}}`
    + `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`
    + `:root[data-theme="dark"]{${dark}}`;
}
