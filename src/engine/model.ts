// Learner model (spec F-7): Bayesian Knowledge Tracing per (skill, level), level moves, review choice.
// Ported from v1 with no behaviour change.
import { DEFAULT_THEME } from '../design/tokens';
import { random } from './rng';
import { LADDER, SK, SKILLS } from './skills';
import type { Item, ModelEvent, Profile, Question, SkillState, Stage } from './types';

export const BKT = { T: 0.12, S: 0.1 };
export const START_PL: [number, number, number] = [0.3, 0.2, 0.1];
/** Sounds default off (design/MOTION.md, milestone MD); v1 defaulted them on. */
export const DEFAULT_SETTINGS = { sessionLen: 10, sound: false, autoRead: false, chart: true };
export const LOG_CAP = 400;

export function newSkillState(): SkillState {
  return { stage: 0, best: 0, mastered: false, pL: [...START_PL], att: [0, 0, 0], cor: [0, 0, 0], recent: [[], [], []], visit: [0, 0, 0], lastSeen: 0, masteredAt: 0 };
}

export function newProfile(name: string, avatar: string): Profile {
  const skills: Record<string, SkillState> = {}; SKILLS.forEach(s => skills[s.id] = newSkillState());
  return {
    id: 'p' + Date.now().toString(36) + Math.floor(random() * 1000), name, avatar, created: Date.now(), placementDone: false, skills, focus: null, mis: {}, gems: 10,
    owned: { avatars: [avatar], themes: [DEFAULT_THEME] }, theme: DEFAULT_THEME, days: [], sessions: [], log: [], settings: { ...DEFAULT_SETTINGS },
  };
}

/** One BKT update: posterior given the answer, then the learning transition. */
export function bkt(p: number, ok: boolean, G: number): number {
  const S = BKT.S;
  const post = ok ? p * (1 - S) / (p * (1 - S) + (1 - p) * G) : p * S / (p * S + (1 - p) * (1 - G));
  return Math.min(0.995, Math.max(0.01, post + (1 - post) * BKT.T));
}

/** Guess probability by answer mode. */
export function guessFor(q: Pick<Question, 'kind' | 'options'>): number {
  if (q.kind === 'mc') return 1 / q.options!.length;
  if (q.kind === 'pad') return 0.03;
  return 0.05;
}

/** Open skills: not mastered, every prerequisite mastered. */
export function frontier(p: Profile) { return SKILLS.filter(s => !p.skills[s.id].mastered && s.pre.every(id => p.skills[id].mastered)); }

export function pickFocus(p: Profile): string | null {
  const fr = frontier(p);
  if (p.focus && fr.some(s => s.id === p.focus)) return p.focus;
  fr.sort((a, b) => LADDER.indexOf(a.id) - LADDER.indexOf(b.id));
  p.focus = fr[0] ? fr[0].id : null;
  return p.focus;
}

/** Next practice item. Every fourth question (or always, once all are mastered) reviews the least recently seen mastered skill. */
export function nextItem(p: Profile, sess: { i: number }): Item | null {
  const mastered = SKILLS.filter(s => p.skills[s.id].mastered), f = pickFocus(p);
  if (mastered.length && (!f || sess.i % 4 === 3)) {
    mastered.sort((a, b) => p.skills[a.id].lastSeen - p.skills[b.id].lastSeen);
    return { skill: mastered[0].id, stage: random() < .7 ? 2 : 1, review: true };
  }
  if (!f) return null;
  return { skill: f, stage: p.skills[f].stage, review: false };
}

export function noteMis(p: Profile, mis: string | null | undefined): void {
  if (!mis) return;
  const m = p.mis[mis] || { count: 0, last: 0 }; m.count++; m.last = Date.now(); p.mis[mis] = m;
}

export interface RecordOpts { hinted?: boolean; mis?: string | null; G?: number; review?: boolean; unsure?: boolean }

/** Record one answer and apply level moves. Returns the events (up, back, down, prereq, mastered, refresh). */
export function record(p: Profile, skill: string, stage: Stage, ok: boolean, { hinted = false, mis = null, G = 0.25, review = false, unsure = false }: RecordOpts = {}): ModelEvent[] {
  const sk = p.skills[skill], ev: ModelEvent[] = [], clean = ok && !hinted;
  sk.pL[stage] = (ok && hinted) ? Math.min(0.995, sk.pL[stage] + (1 - sk.pL[stage]) * BKT.T * 0.5) : bkt(sk.pL[stage], ok, G);
  sk.att[stage]++; if (ok) sk.cor[stage]++;
  sk.recent[stage].push(clean ? 1 : 0); if (sk.recent[stage].length > 5) sk.recent[stage].shift();
  sk.visit[stage]++; sk.lastSeen = Date.now(); noteMis(p, mis);
  p.log.push({ t: Date.now(), s: skill, g: stage, ok, h: hinted ? 1 : 0, m: mis, r: review ? 1 : 0, u: unsure ? 1 : 0 }); if (p.log.length > LOG_CAP) p.log.splice(0, p.log.length - LOG_CAP);
  if (review) {
    if (sk.mastered && sk.pL[stage] < 0.4) { sk.mastered = false; sk.stage = stage; sk.visit = [0, 0, 0]; sk.recent = [[], [], []]; p.focus = skill; ev.push({ type: 'refresh', skill }); }
    return ev;
  }
  const rec = sk.recent[stage], last3ok = rec.length >= 3 && rec.slice(-3).every(x => x === 1);
  if (sk.pL[stage] >= 0.9 && last3ok) {
    if (stage < 2) {
      const back = (sk.best || 0) > stage; sk.stage = (stage + 1) as Stage; sk.best = Math.max(sk.best || 0, sk.stage); sk.visit[sk.stage] = 0; sk.recent[sk.stage] = [];
      ev.push({ type: back ? 'back' : 'up', skill, stage: sk.stage });
    } else { sk.mastered = true; sk.masteredAt = Date.now(); if (p.focus === skill) p.focus = null; ev.push({ type: 'mastered', skill }); }
    return ev;
  }
  const last3 = rec.slice(-3), wrong = last3.filter(x => x === 0).length;
  if (sk.visit[stage] >= 3 && last3.length >= 3 && wrong >= 2 && sk.pL[stage] < 0.4) {
    if (stage > 0) { sk.stage = (stage - 1) as Stage; sk.visit[sk.stage] = 0; sk.recent[sk.stage] = []; sk.recent[stage] = []; ev.push({ type: 'down', skill, stage: sk.stage }); }
    else {
      const pre = SK[skill].pre;
      if (pre.length) {
        const w = pre.slice().sort((a, b) => p.skills[a].pL[2] - p.skills[b].pL[2])[0], ws = p.skills[w];
        ws.mastered = false; ws.stage = 1; ws.pL[1] = Math.min(ws.pL[1], 0.6); ws.pL[2] = Math.min(ws.pL[2], 0.5); ws.visit = [0, 0, 0]; ws.recent = [[], [], []];
        sk.visit[0] = 0; sk.recent[0] = []; p.focus = w; ev.push({ type: 'prereq', skill, to: w });
      } else { sk.visit[0] = 0; sk.recent[0] = []; }
    }
  }
  return ev;
}
