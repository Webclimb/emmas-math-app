// Rendering, session flow, actions and input handling. Ported from v1 with no behaviour change.
import { h, render as preactRender } from 'preact';
import { guessFor, newProfile, noteMis, nextItem, record, LOG_CAP } from '../engine/model';
import { makeQuestion } from '../engine/generators';
import { placementApply, placementInit, placementNext, placementRecord } from '../engine/placement';
import { checkApply, checkInit, checkNext, checkRecord, newWorkbookGoal } from '../engine/workbook';
import { canReadPhotos, readWorkbookPhoto, READ_ERROR_TEXT, type ReadError } from './workbook';
import { SK, STAGE_WITH } from '../engine/skills';
import { NL } from '../engine/visuals';
import { THEMES } from '../design/tokens';
import type { Build, Question } from '../engine/types';
import { backupCode, migrateProfile, parseBackup } from '../storage/schema';
import { AVATARS, DEFAULT_AVATAR, GEMS, HOLD_MS, TOAST_MS } from './data';
import { applyAccent, reduced, speak, strip, tone, SND } from './effects';
import { G, P, app, type BuildState, type Current } from './state';
import { markDay } from './util';
import { Layer, Screen } from './views';

let $app: HTMLElement, $layer: HTMLElement;
export function mount(appEl: HTMLElement, layerEl: HTMLElement) { $app = appEl; $layer = layerEl; }

// ---------- render ----------
function focusKey(): string | null {
  const a = document.activeElement as HTMLElement | null;
  if (!a || a === document.body || !a.dataset) return null;
  if (a.id) return '#' + a.id;
  if (!a.dataset.act) return null;
  return `[data-act="${a.dataset.act}"]` + (a.dataset.i != null ? `[data-i="${a.dataset.i}"]` : '') + (a.dataset.d != null ? `[data-d="${a.dataset.d}"]` : '') + (a.dataset.k != null ? `[data-k="${a.dataset.k}"][data-v="${a.dataset.v}"]` : '');
}
export function render(): void {
  applyAccent(); const fk = focusKey();
  $app.dataset.screen = G.UI.screen;
  preactRender(h(Screen, null), $app);
  renderLayer();
  if (fk && !G.UI.modal) { try { const el = document.querySelector(fk) as HTMLButtonElement | null; if (el && !el.disabled) el.focus({ preventScroll: true }); } catch { /* bad selector */ } }
}
export function renderLayer(): void {
  preactRender(h(Layer, null), $layer);
  if (G.UI.modal) { const b = ($layer.querySelector('.modal [data-focus]') || $layer.querySelector('.modal button')) as HTMLElement | null; if (b) b.focus({ preventScroll: true }); }
}
let toastT: ReturnType<typeof setTimeout> | undefined;
export function toast(text: string): void { G.UI.toast = text; renderLayer(); clearTimeout(toastT); toastT = setTimeout(() => { G.UI.toast = null; renderLayer(); }, TOAST_MS); }

// ---------- profile and routing ----------
export function save(): void { G.store.save(); }
export function setProf(): void { const A = app(); G.prof = A.current && A.profiles[A.current] ? A.profiles[A.current] : null; migrateProfile(G.prof); }
export function routeHome(): void {
  setProf(); const UI = G.UI; UI.modal = null;
  if (!G.prof) UI.screen = Object.keys(app().profiles).length ? 'profiles' : 'welcome';
  else if (!G.prof.placementDone) UI.screen = 'placeIntro'; else UI.screen = 'home';
  render(); window.scrollTo(0, 0);
}
const sayFor = (q: Question) => (q.lead ? q.lead + ' ' : '') + (q.say || strip(q.prompt));

// ---------- build widgets ----------
export function initBuild(bd: Build): BuildState {
  switch (bd.type) {
    case 'tenframe': { const cells = Array(bd.frames * 10).fill(0); for (let i = 0; i < bd.preset; i++) cells[i] = 2; return { cells }; }
    case 'blocks': return { h: 0, t: 0, o: 0 };
    case 'nlplace': return { m: null };
    case 'jumps': { const lo = Math.floor(bd.start / 10) * 10; return { pos: bd.start, hist: [], lo, hi: Math.max(lo + 20, Math.ceil((bd.target + 1) / 10) * 10) }; }
    case 'crossout': return { x: Array(bd.n).fill(false) };
    case 'groups': return { a: 1, b: 1 };
    case 'rows': return { r: 0 };
    case 'share': return { plates: Array(bd.k).fill(0), hist: [] };
    case 'makegroups': return { g: 0 };
    case 'shade': return { s: Array(bd.n).fill(false) };
  }
}
export function buildRight(bd: Build, b: BuildState): boolean {
  switch (bd.type) {
    case 'tenframe': return b.cells!.filter(Boolean).length === bd.target;
    case 'blocks': return b.h! * 100 + b.t! * 10 + b.o! === bd.target;
    case 'nlplace': return b.m === bd.target;
    case 'jumps': return b.pos === bd.target;
    case 'crossout': return b.x!.filter(Boolean).length === bd.k;
    case 'groups': return b.a === bd.a && b.b === bd.b;
    case 'rows': return b.r === bd.target;
    case 'share': { const sum = b.plates!.reduce((a, c) => a + c, 0); return sum === bd.n && b.plates!.every(c => c === b.plates![0]); }
    case 'makegroups': return b.g! * bd.k === bd.n;
    case 'shade': return b.s!.filter(Boolean).length === bd.k;
  }
}
function buildNudge(bd: Build, b: BuildState): string {
  switch (bd.type) {
    case 'tenframe': return `Not quite. Count your dots again. You need ${bd.target} in all.`;
    case 'blocks': return 'Not quite. Check the tens and the ones again.';
    case 'nlplace': return b.m === null ? 'Tap the line to place the dot first.' : 'Not quite. Find the nearest labelled number, then count the ticks.';
    case 'jumps': return b.pos! < bd.target ? 'Not there yet. How many have you jumped so far?' : 'You went past it. Tap Undo and try again.';
    case 'crossout': return `You need to take away exactly ${bd.k}. Count the crossed-out ones.`;
    case 'groups': return `Check both numbers: ${bd.a} groups, with ${bd.b} in each group.`;
    case 'rows': return `You need ${bd.target} rows. Count the rows again.`;
    case 'share': return 'The plates aren\'t equal yet. Tap Undo to move some back, then share again.';
    case 'shade': return `Shade exactly ${bd.k} parts.`;
  }
  return 'Not quite. Try again.';
}

// ---------- session flow ----------
export function newCurrent(q: Question): Current {
  return { q, phase: 'answer', hinted: false, hintShown: false, entry: '', chosen: null, fchosen: null, b: q.kind === 'build' ? initBuild(q.build!) : null, buildMiss: false };
}
function beginSession(mode: 'practice' | 'placement' | 'check', n = 0): void {
  G.S = { mode, n: mode === 'placement' ? 12 : n, i: 0, answered: 0, correct: 0, gems: 0, start: Date.now(), events: [], P: mode === 'placement' ? placementInit() : null, early: false,
    C: mode === 'check' ? checkInit(P().workbook ? P().workbook!.skills : []) : undefined };
  G.UI.screen = 'practice'; nextQuestion();
}
function nextQuestion(): void {
  const S = G.S!, prof = P(); let item;
  if (S.mode === 'placement') { item = placementNext(S.P!); if (!item) return finishPlacement(); }
  else if (S.mode === 'check') { item = checkNext(S.C!); if (!item) return finishCheck(); }
  else { if (S.i >= S.n) return finishSession(false); item = nextItem(prof, S); if (!item) return finishSession(false); }
  const review = 'review' in item ? item.review : false;
  const sk = prof.skills[item.skill], easy = S.mode !== 'practice' ? false : (!review && sk.pL[item.stage] < 0.5);
  let q: Question; try { q = makeQuestion(item.skill, item.stage, easy); } catch { q = makeQuestion('quantity', 1, true); }
  q.review = !!review;
  G.Cur = newCurrent(q);
  save(); render(); window.scrollTo(0, 0); if (prof.settings.autoRead) speak(sayFor(q));
}
function submit(ok: boolean, mis: string | null, o: { unsure?: boolean } = {}): void {
  const Cur = G.Cur, S = G.S!, prof = P();
  if (!Cur || Cur.phase !== 'answer') return; const q = Cur.q, hinted = Cur.hinted;
  Cur.phase = 'feedback'; Cur.ok = ok; Cur.mis = ok ? null : mis; Cur.unsure = !!o.unsure; let gain = GEMS.answer + (ok && !hinted ? GEMS.clean : 0);
  if (S.mode !== 'practice') {
    if (S.mode === 'placement') placementRecord(S.P!, ok); else checkRecord(S.C!, ok);
    Cur.events = []; noteMis(prof, Cur.mis);
    prof.log.push({ t: Date.now(), s: q.skill, g: q.stage, ok, p: 1, m: Cur.mis }); if (prof.log.length > LOG_CAP) prof.log.splice(0, prof.log.length - LOG_CAP);
  } else {
    const ev = record(prof, q.skill, q.stage, ok, { hinted, mis: Cur.mis, G: guessFor(q), review: q.review, unsure: Cur.unsure });
    Cur.events = ev; S.events.push(...ev);
    ev.forEach(x => { if (x.type === 'up') gain += GEMS.up; if (x.type === 'back') gain += GEMS.back; if (x.type === 'mastered') gain += GEMS.mastered; });
  }
  Cur.gain = gain; prof.gems += gain; S.gems += gain; S.i++; S.answered++; if (ok) S.correct++; markDay(prof);
  // No sound for a wrong answer (design/MOTION.md, F-6.AC-1).
  save(); render(); if (ok) tone(SND.ok);
  requestAnimationFrame(() => { const fb = document.getElementById('fb'); if (fb) { fb.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); const nb = fb.querySelector('[data-act="next"]') as HTMLElement | null; if (nb) nb.focus({ preventScroll: true }); } });
}
const EV_ORDER = ['mastered', 'up', 'back', 'prereq', 'refresh', 'down'];
function afterFeedback(): void {
  const S = G.S!, ev = (G.Cur!.events || []).slice().sort((a, b) => EV_ORDER.indexOf(a.type) - EV_ORDER.indexOf(b.type))[0];
  if (ev && ev.type === 'back') { nextQuestion(); toast(`Back up to ${STAGE_WITH[ev.stage]} for ${SK[ev.skill].name}.`); return; }
  if (ev && ev.type === 'down') { S.downs = S.downs || {}; if (S.downs[ev.skill]) { nextQuestion(); toast(`Trying it with ${STAGE_WITH[ev.stage]} for a bit.`); return; } S.downs[ev.skill] = 1; }
  if (ev) { G.UI.modal = { type: 'event', ev }; render(); if (ev.type === 'mastered' || ev.type === 'up') tone(SND.up); return; }
  nextQuestion();
}
function finishSession(early: boolean): void {
  const S = G.S!, prof = P(); S.early = early;
  if (S.answered > 0) {
    prof.sessions.push({ d: Date.now(), n: S.answered, c: S.correct, min: Math.max(1, Math.round((Date.now() - S.start) / 60000)), m: S.mode }); if (prof.sessions.length > 100) prof.sessions.shift();
    if (!early) { prof.gems += GEMS.session; S.gems += GEMS.session; }
  }
  save(); G.Cur = null; G.UI.screen = S.answered > 0 ? 'summary' : 'home'; render(); window.scrollTo(0, 0);
  if (G.UI.screen === 'summary' && !early) tone(SND.up);
}
function finishPlacement(): void {
  const S = G.S!, prof = P();
  placementApply(prof, S.P!); prof.sessions.push({ d: Date.now(), n: S.answered, c: S.correct, min: Math.max(1, Math.round((Date.now() - S.start) / 60000)), m: 'placement' });
  save(); G.Cur = null; G.UI.screen = 'placed'; render(); window.scrollTo(0, 0); tone(SND.up);
}
function finishCheck(): void {
  const S = G.S!, prof = P();
  checkApply(prof, S.C!);
  prof.sessions.push({ d: Date.now(), n: S.answered, c: S.correct, min: Math.max(1, Math.round((Date.now() - S.start) / 60000)), m: 'check' }); if (prof.sessions.length > 100) prof.sessions.shift();
  save(); G.Cur = null; G.UI.screen = 'checked'; render(); window.scrollTo(0, 0); tone(SND.up);
}

// ---------- workbook (F-22) ----------
/** Learn whether photos can be read here, then re-render the workbook tab. */
export function probePhotos(): void {
  if (G.photos !== null) return;
  canReadPhotos().then(v => { G.photos = v; if (G.UI.screen === 'grown') render(); }, () => { G.photos = false; });
}
async function readPhoto(file: Blob): Promise<void> {
  G.UI.tmp.wb = { step: 'reading', picks: [] }; render();
  try {
    const r = await readWorkbookPhoto(file);
    G.UI.tmp.wb = { step: 'confirm', picks: r.skills, topic: r.topic, beyond: r.beyond };
  } catch (e) {
    const code = ((e as { code?: ReadError })?.code) || 'failed';
    if (code === 'unavailable' || code === 'not_granted') G.photos = false;
    G.UI.tmp.wb = { step: 'start', picks: [], err: READ_ERROR_TEXT[code] };
  }
  if (G.UI.screen === 'grown') render();
}

function buildCheck(): void {
  const Cur = G.Cur!, q = Cur.q, b = Cur.b!; if (Cur.phase !== 'answer' || b.done) return;
  if (buildRight(q.build!, b)) { b.done = true; b.msg = null; if (!q.followup) return submit(!Cur.buildMiss, null); render(); if (P().settings.autoRead) speak(q.followup.say || strip(q.followup.prompt)); return; }
  Cur.buildMiss = true; b.tries = (b.tries || 0) + 1; if (b.tries >= 2) return submit(false, null); b.msg = buildNudge(q.build!, b); render();
}
export function padKey(k: string): void {
  const Cur = G.Cur; if (!Cur || Cur.phase !== 'answer') return;
  if (k === 'del') Cur.entry = Cur.entry.slice(0, -1);
  else if (k === 'ok') { if (!Cur.entry) return; const v = parseInt(Cur.entry, 10), ok = v === Cur.q.answer; return submit(ok, ok ? null : ((Cur.q.padMis && Cur.q.padMis[v]) || null)); }
  else if (Cur.entry.length < 4) Cur.entry = (Cur.entry === '0' ? '' : Cur.entry) + k;
  render();
}

// ---------- actions (data-act) ----------
type El = HTMLElement;
const B = () => { const c = G.Cur; return !!(c && c.phase === 'answer' && c.b && !c.b.done); };
const bs = () => G.Cur!.b!;
export const ACT: Record<string, (el: El, e?: { clientX: number }) => void> = {
  start() { beginSession('practice', P().settings.sessionLen); },
  more() { beginSession('practice', 5); },
  home() { G.UI.screen = 'home'; G.UI.modal = null; render(); window.scrollTo(0, 0); },
  back() { G.UI.tmp = {}; routeHome(); },
  shop() { G.UI.screen = 'shop'; render(); window.scrollTo(0, 0); },
  star(el) { G.UI.modal = { type: 'star', id: el.dataset.d! }; renderLayer(); },
  focusSkill(el) { P().focus = el.dataset.d!; save(); G.UI.modal = null; render(); toast('Next practice: ' + SK[el.dataset.d!].name); },
  closeModal() { G.UI.modal = null; render(); },
  opt(el) { const Cur = G.Cur; if (!Cur || Cur.phase !== 'answer') return; const o = Cur.q.options![+el.dataset.i!]; Cur.chosen = +el.dataset.i!; submit(String(o.value) === String(Cur.q.answer), o.mis || null); },
  fopt(el) { const Cur = G.Cur; if (!Cur || Cur.phase !== 'answer') return; const f = Cur.q.followup!, o = f.options[+el.dataset.i!]; Cur.fchosen = +el.dataset.i!; const fok = String(o.value) === String(f.answer); submit(fok && !Cur.buildMiss, fok ? null : (o.mis || null)); },
  key(el) { padKey(el.dataset.d!); },
  hint() { if (!G.Cur) return; G.Cur.hintShown = true; G.Cur.hinted = true; render(); },
  unsure() { submit(false, null, { unsure: true }); },
  chart() { if (!G.Cur) return; G.Cur.hinted = true; G.UI.modal = { type: 'chart', hi: null }; render(); },
  chartcell(el) { const m = G.UI.modal; if (m && m.type === 'chart') m.hi = [+el.dataset.i!, +el.dataset.d!]; renderLayer(); },
  speak() { if (G.Cur) speak(sayFor(G.Cur.q)); },
  fspeak() { const f = G.Cur && G.Cur.q.followup; if (f) speak(f.say || strip(f.prompt)); },
  next() { afterFeedback(); },
  quit() { const m = G.S!.mode; G.UI.modal = { type: 'confirm', title: 'Stop for now?', text: m === 'placement' ? 'You can do the warm-up again later.' : m === 'check' ? 'You can do the workbook check again later.' : 'Everything you\'ve done so far is saved.', yes: 'Stop', act: 'doQuit' }; renderLayer(); },
  doQuit() { G.UI.modal = null; if (G.S!.mode !== 'practice') { G.Cur = null; routeHome(); return; } finishSession(true); },
  eventOk() { G.UI.modal = null; nextQuestion(); },
  cell(el) { if (!B()) return; const i = +el.dataset.i!, c = bs().cells!; if (c[i] === 2) return; c[i] = c[i] ? 0 : 1; bs().msg = null; render(); },
  blk(el) { if (!B()) return; const [k, d] = [el.dataset.d![0], el.dataset.d![1]], mx = k === 'h' ? 3 : 9, b = bs(); b[k] = Math.max(0, Math.min(mx, (b[k] as number) + (d === '+' ? 1 : -1))); b.msg = null; render(); },
  nltap(el, e) {
    if (!B()) return; const bd = G.Cur!.q.build as Extract<Build, { type: 'nlplace' }>, r = el.getBoundingClientRect();
    const g = NL; const xs = (e!.clientX - r.left) / r.width * g.W; const v = Math.round(bd.min + (xs - g.L) / (g.R - g.L) * (bd.max - bd.min));
    bs().m = Math.max(bd.min, Math.min(bd.max, v)); bs().msg = null; render();
  },
  nlnudge(el) { if (!B()) return; const bd = G.Cur!.q.build as Extract<Build, { type: 'nlplace' }>; const d = +el.dataset.d!; const m = bs().m == null ? (d > 0 ? bd.min + 1 : bd.max - 1) : bs().m! + d; bs().m = Math.max(bd.min, Math.min(bd.max, m)); bs().msg = null; render(); },
  jump(el) { if (!B()) return; const b = bs(), d = +el.dataset.d!; if (b.pos! + d > b.hi!) return; (b.hist as number[][]).push([b.pos!, b.pos! + d]); b.pos! += d; b.msg = null; render(); },
  jundo() { if (!B()) return; const b = bs(), j = (b.hist as number[][]).pop(); if (j) b.pos = j[0]; b.msg = null; render(); },
  jdone() { buildCheck(); },
  cross(el) { if (!B()) return; const i = +el.dataset.i!; bs().x![i] = !bs().x![i]; bs().msg = null; render(); },
  grp(el) { if (!B()) return; const k = el.dataset.d![0], d = el.dataset.d![1], b = bs(); b[k] = Math.max(1, Math.min(6, (b[k] as number) + (d === '+' ? 1 : -1))); b.msg = null; render(); },
  row(el) { if (!B()) return; const b = bs(); b.r = Math.max(0, Math.min(10, b.r! + (el.dataset.d === '+' ? 1 : -1))); b.msg = null; render(); },
  plate(el) {
    if (!B()) return; const bd = G.Cur!.q.build as Extract<Build, { type: 'share' }>, b = bs(), i = +el.dataset.i!; const left = bd.n - b.plates!.reduce((a, c) => a + c, 0); if (left <= 0) return;
    b.plates![i]++; (b.hist as number[]).push(i); b.msg = null;
    if (left - 1 === 0) { buildCheck(); return; } render();
  },
  sundo() { if (!B()) return; const b = bs(), i = (b.hist as number[]).pop(); if (i !== undefined) b.plates![i]--; b.msg = null; render(); },
  mkgrp() { if (!B()) return; const bd = G.Cur!.q.build as Extract<Build, { type: 'makegroups' }>, b = bs(); if (bd.n - b.g! * bd.k < bd.k) return; b.g!++; if (b.g! * bd.k === bd.n) { buildCheck(); return; } render(); },
  part(el) { if (!B()) return; const i = +el.dataset.i!; bs().s![i] = !bs().s![i]; bs().msg = null; render(); },
  bcheck() { buildCheck(); },
  pickAv(el) { G.UI.tmp.av = el.dataset.d; render(); },
  stab(el) { G.UI.tmp.stab = el.dataset.d; render(); },
  gtab(el) { G.UI.tmp.gtab = el.dataset.d; G.UI.tmp.code = null; if (el.dataset.d === 'workbook') probePhotos(); render(); window.scrollTo(0, 0); },
  wbManual() { G.UI.tmp.wb = { step: 'confirm', picks: [] }; render(); },
  wbToggle(el) { const wb = G.UI.tmp.wb; if (!wb) return; const id = el.dataset.d!; wb.picks = wb.picks.includes(id) ? wb.picks.filter(x => x !== id) : [...wb.picks, id]; render(); },
  wbCancel() { G.UI.tmp.wb = undefined; render(); },
  wbConfirm() {
    const wb = G.UI.tmp.wb; if (!wb || !wb.picks.length) return;
    P().workbook = newWorkbookGoal(wb.picks); G.UI.tmp.wb = undefined; save(); render(); toast('Workbook skills saved. The check starts from the home screen.');
  },
  wbClear() { G.UI.modal = { type: 'confirm', title: 'Clear the workbook goal?', text: 'Practice goes back to the usual order. Levels she has reached stay.', yes: 'Clear', act: 'doWbClear' }; renderLayer(); },
  doWbClear() { G.UI.modal = null; P().workbook = null; P().focus = null; save(); render(); },
  beginCheck() { if (P().workbook) beginSession('check'); },
  buyAv(el) {
    const prof = P(), a = el.dataset.d!, item = AVATARS.find(x => x.id === a); if (!item) return; const price = item.price;
    if (prof.owned.avatars.includes(a) || price === 0) { prof.avatar = a; save(); render(); return; }
    if (prof.gems < price) { toast(`You need ${price - prof.gems} more gems for that one.`); return; }
    prof.gems -= price; prof.owned.avatars.push(a); prof.avatar = a; save(); render(); tone(SND.up); toast('Unlocked!');
  },
  buyTheme(el) {
    const prof = P(), k = el.dataset.d!, t = THEMES[k]; if (!t) return;
    if (prof.owned.themes.includes(k) || t.priceGems === 0) { prof.theme = k; save(); render(); return; }
    if (prof.gems < t.priceGems) { toast(`You need ${t.priceGems - prof.gems} more gems for that one.`); return; }
    prof.gems -= t.priceGems; prof.owned.themes.push(k); prof.theme = k; save(); render(); tone(SND.up); toast('Unlocked!');
  },
  set(el) { const k = el.dataset.k!, v = el.dataset.v!; P().settings[k] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v); save(); render(); },
  copyBackup() {
    const code = backupCode(P()); G.UI.tmp.code = code; render();
    try { navigator.clipboard.writeText(code).then(() => toast('Backup code copied.'), () => toast('Select the code below and copy it.')); } catch { toast('Select the code below and copy it.'); }
  },
  doRestore() { const np = G.UI.tmp.restore; G.UI.tmp.restore = null; G.UI.modal = null; if (!np) return; app().profiles[np.id] = np; app().current = np.id; save(); toast('Progress restored.'); routeHome(); },
  redo() { G.UI.modal = { type: 'confirm', title: 'Redo the warm-up?', text: `${P().name}'s skill levels will be set again from a new warm-up. Gems and buddies stay.`, yes: 'Redo warm-up', act: 'doRedo' }; renderLayer(); },
  doRedo() { G.UI.modal = null; P().placementDone = false; save(); routeHome(); },
  reset() { G.UI.modal = { type: 'confirm', title: 'Reset all progress?', text: `This clears ${P().name}'s skill levels, patterns and history. Gems and buddies stay. This can't be undone.`, yes: 'Reset', act: 'doReset' }; renderLayer(); },
  doReset() { G.UI.modal = null; const prof = P(), fresh = newProfile(prof.name, prof.avatar); Object.assign(prof, { skills: fresh.skills, focus: null, mis: {}, log: [], sessions: [], days: [], placementDone: false }); save(); routeHome(); },
  switchTo(el) { app().current = el.dataset.d!; save(); routeHome(); },
  addLearner() { G.UI.tmp = { adding: true }; G.UI.screen = 'welcome'; render(); window.scrollTo(0, 0); },
  beginPlace() { beginSession('placement'); },
  skipPlace() { placementApply(P(), { lo: 0, tested: {} }); save(); G.UI.screen = 'home'; render(); },
};

// ---------- input ----------
let holdT: ReturnType<typeof setTimeout> | null = null;
export const holdTimer = () => holdT;
function holdStart(el: El) {
  if (holdT) return; el.classList.add('holding');
  holdT = setTimeout(() => { holdT = null; el.classList.remove('holding'); G.UI.tmp.code = null; G.UI.tmp.gtab = 'progress'; G.UI.screen = 'grown'; render(); window.scrollTo(0, 0); }, HOLD_MS);
}
function holdEnd(el: El | null, hint: boolean) { if (holdT) { clearTimeout(holdT); holdT = null; if (hint) toast('Keep holding to open the grown-up view.'); } if (el) el.classList.remove('holding'); }
const closest = (t: EventTarget | null, sel: string) => (t && (t as Element).closest ? (t as Element).closest(sel) as El | null : null);

export function listen(): void {
  document.addEventListener('click', e => { const el = closest(e.target, '[data-act]') as HTMLButtonElement | null; if (!el || el.disabled) return; const f = ACT[el.dataset.act!]; if (f) { e.preventDefault(); f(el, e); } });
  // The badges on the welcome form show her initial, so they update as she types.
  document.addEventListener('input', e => { const t = e.target as HTMLInputElement; if (t.id === 'pname') { const was = (G.UI.tmp.name || '').trim()[0]; G.UI.tmp.name = t.value; if (t.value.trim()[0] !== was) render(); } });
  document.addEventListener('change', e => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'wbPhoto' && t.files && t.files[0]) { const f = t.files[0]; t.value = ''; void readPhoto(f); }
  });
  document.addEventListener('submit', e => {
    e.preventDefault(); const t = e.target as HTMLFormElement;
    if (t.id === 'newp') {
      const inp = document.getElementById('pname') as HTMLInputElement, name = (inp.value || '').trim(); if (!name) { inp.focus(); return; }
      const p = newProfile(name.slice(0, 20), G.UI.tmp.av || DEFAULT_AVATAR); app().profiles[p.id] = p; app().current = p.id; G.UI.tmp = {}; save(); routeHome();
    }
    if (t.id === 'restoreForm') {
      const txt = ((document.getElementById('restoreText') as HTMLTextAreaElement).value || '').trim(), np = parseBackup(txt);
      if (!np) { toast("That code doesn't look right. Paste the whole backup code."); return; }
      G.UI.tmp.restore = np; G.UI.modal = { type: 'confirm', title: `Restore ${np.name || 'this learner'}?`, text: 'This replaces the saved progress for that learner on this page.', yes: 'Restore', act: 'doRestore' }; renderLayer();
    }
  });
  document.addEventListener('keydown', e => {
    const UI = G.UI, Cur = G.Cur;
    if (UI.modal && e.key === 'Escape') { e.preventDefault(); if (UI.modal.type === 'event') ACT.eventOk(document.body); else ACT.closeModal(document.body); return; }
    if (UI.screen === 'practice' && Cur && Cur.phase === 'answer' && Cur.q.kind === 'pad' && !UI.modal) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); padKey(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); padKey('del'); } else if (e.key === 'Enter') { e.preventDefault(); padKey('ok'); }
    }
    const hEl = closest(e.target, '[data-hold]'); if (hEl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (!e.repeat) holdStart(hEl); }
  });
  document.addEventListener('keyup', e => { const hEl = closest(e.target, '[data-hold]'); if (hEl && (e.key === 'Enter' || e.key === ' ')) holdEnd(hEl, true); });
  document.addEventListener('pointerdown', e => { const el = closest(e.target, '[data-hold]'); if (el) holdStart(el); });
  document.addEventListener('pointerup', e => { const el = closest(e.target, '[data-hold]'); holdEnd(el || document.querySelector('[data-hold]'), !!el); });
  document.addEventListener('pointercancel', () => holdEnd(document.querySelector('[data-hold]'), false));
  document.addEventListener('pointerleave', e => { const el = closest(e.target, '[data-hold]'); if (el) holdEnd(el, false); }, true);
  document.addEventListener('contextmenu', e => { if (closest(e.target, '[data-hold]')) e.preventDefault(); });
}

