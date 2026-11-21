// Test access for the Playwright UI checks (v1's smoke test drove page globals the same way).
// Installed only when the page URL carries ?nstest, so normal use exposes nothing.
import { makeQuestion } from '../engine/generators';
import { newProfile } from '../engine/model';
import { seed } from '../engine/rng';
import { SKILLS } from '../engine/skills';
import { digitAt } from '../engine/visuals';
import { ACT, holdTimer, initBuild, newCurrent, padKey, render, renderLayer, setProf } from './flow';
import { G } from './state';
import { dayKey } from './util';

export function installTestHooks(): void {
  try { if (!/[?&]nstest\b/.test(location.search)) return; } catch { return; }
  (window as unknown as Record<string, unknown>).__ns = { G, ACT, render, renderLayer, makeQuestion, initBuild, newCurrent, padKey, setProf, newProfile, seed, dayKey, SKILLS, holdTimer, digitAt };
}
