// Exact decimals for F-23: every decimal is generated as a whole number of thousandths (milli),
// so answers never suffer floating-point error, then written the Québec way: decimal comma and a
// narrow space between thousands from 10 000 (D-21).

/** Narrow no-break space, the Québec thousands separator. */
export const THIN = ' ';

/** Group an integer string's digits by three from the right (only from 10 000, as in Québec usage). */
function groupInt(s: string): string {
  if (s.length < 5) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) { if (i && (s.length - i) % 3 === 0) out += THIN; out += s[i]; }
  return out;
}

/** Integer to Québec text: 48 297, 4507. */
export function nf(n: number): string { return groupInt(String(Math.trunc(n))); }

/** Thousandths to Québec text with the fewest decimals: 48297 -> "48,297", 3500 -> "3,5", 2000 -> "2". */
export function fmtM(milli: number, minDp = 0): string {
  const neg = milli < 0; milli = Math.abs(Math.round(milli));
  const int = Math.floor(milli / 1000), frac = String(milli % 1000).padStart(3, '0');
  let dec = frac.replace(/0+$/, '');
  while (dec.length < minDp) dec += '0';
  return (neg ? '−' : '') + groupInt(String(int)) + (dec ? ',' + dec : '');
}

/** Thousandths to the canonical answer string (no spaces): 105734 -> "105,734". */
export function canon(milli: number): string { return fmtM(milli).replace(new RegExp(THIN, 'g'), ''); }

/** Normalize what she typed: "," or ".", no spaces, no leading zeros, no trailing decimal zeros. */
export function normAnswer(s: string): string {
  let t = String(s).replace(/[\s  ]/g, '').replace('.', ',');
  if (!/^\d*(,\d*)?$/.test(t)) return t;
  let [i, d = ''] = t.split(',');
  i = i.replace(/^0+(?=\d)/, '') || '0';
  d = d.replace(/0+$/, '');
  return d ? `${i},${d}` : i;
}

/** Parse a typed answer to thousandths; null if not a number or finer than thousandths. */
export function parseM(s: string): number | null {
  const t = normAnswer(s);
  const m = t.match(/^(\d+)(?:,(\d{1,3}))?$/);
  if (!m) return null;
  return Number(m[1]) * 1000 + Number((m[2] || '').padEnd(3, '0'));
}

/** Number of decimals needed to write a value in thousandths. */
export function dpOf(milli: number): number { const f = Math.abs(milli) % 1000; return f === 0 ? 0 : f % 100 === 0 ? 1 : f % 10 === 0 ? 2 : 3; }

/** Product of two thousandths values, in thousandths, or null if it needs more than 3 decimals. */
export function mulM(a: number, b: number): number | null {
  const p = a * b; // millionths
  return p % 1000 === 0 ? p / 1000 : null;
}
