// Shared question builders for the generators (v1 helpers, unchanged).
import { shuffle } from './rng';
import type { Option, Question, Stage } from './types';

export type QInput = Partial<Question> & Pick<Question, 'prompt' | 'kind'>;
export type Gen = (easy: boolean) => Question;

export function Q(o: QInput): Question { return Object.assign({ visual: null, hint: null, explain: { text: '' }, say: null, skill: '', stage: 0 as Stage }, o) as Question; }
export function numOpts(correct: number, ds: ({ v: number; mis?: string } | null | undefined)[] = [], { min = 0, n = 4 }: { min?: number; n?: number } = {}): { options: Option[]; answer: number } {
  const out: Option[] = [{ value: correct, label: String(correct), mis: null }], seen = new Set([correct]);
  for (const d of ds) { if (!d) continue; const v = d.v; if (!Number.isInteger(v) || v < min || seen.has(v)) continue; seen.add(v); out.push({ value: v, label: String(v), mis: d.mis || null }); if (out.length >= n) break; }
  let step = 1; while (out.length < 3 && step < 60) { for (const v of [correct + step, correct - step]) { if (out.length < 3 && v >= min && !seen.has(v)) { seen.add(v); out.push({ value: v, label: String(v), mis: step === 1 ? 'off-by-one' : null }); } } step++; }
  return { options: shuffle(out), answer: correct };
}
/** Typed-answer pattern map: wrong value -> pattern id. First listed pattern wins. */
export function pm(pairs: [number, string][], ans: number): Record<number, string> { const m: Record<number, string> = {}; for (const [v, mis] of pairs) { if (Number.isInteger(v) && v >= 0 && v !== ans && !(v in m)) m[v] = mis; } return m; }
