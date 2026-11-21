// The one seedable random generator (spec section 7, Determinism). Every random choice in the
// engine and app goes through random(); nothing else may call Math.random.
// mulberry32: small, fast, and good enough for question generation.

let state = 0;

export function seed(n: number): void { state = n | 0; }

/** A float in [0, 1). */
export function random(): number {
  state = (state + 0x6D2B79F5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Seed from the clock (and crypto when available) so normal use differs run to run. */
export function seedFromEnvironment(): number {
  let s = Date.now() | 0;
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c && c.getRandomValues) { const a = new Uint32Array(1); c.getRandomValues(a); s ^= a[0]; }
  } catch { /* clock only */ }
  seed(s);
  return s;
}

/** Current internal state, so a caller can save and restore a stream. */
export function getState(): number { return state; }

export const ri = (a: number, b: number): number => a + Math.floor(random() * (b - a + 1));
export const pick = <T>(a: readonly T[]): T => a[Math.floor(random() * a.length)];
export function shuffle<T>(a: readonly T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

seedFromEnvironment();
