// Loads the v1 engine (<script id="engine"> in source/index.html) in a sandbox, with Math.random
// replaced by the same seedable generator the port uses, so outputs can be compared exactly.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

export function loadV1Engine() {
  const html = readFileSync(resolve(__dirname, '../../source/index.html'), 'utf8');
  const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('v1 engine script not found');
  let a = 0;
  const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const SandMath = Object.create(Math); SandMath.random = rnd;
  const ctx: Record<string, unknown> = { console, Math: SandMath, Date, JSON, Object, Array, String, Number, Set, Map };
  vm.createContext(ctx);
  vm.runInContext(m[1] + '\n;this.API={GEN,SKILLS,SK,LADDER,MIS,makeQuestion,newProfile,record,nextItem,pickFocus,frontier,guessFor,placementInit,placementNext,placementRecord,placementApply};', ctx);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { api: ctx.API as any, seed: (n: number) => { a = n | 0; } };
}
