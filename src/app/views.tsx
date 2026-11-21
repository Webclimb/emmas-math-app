// Screens. Ported from v1's HTML templates with the same markup and classes. Interaction is by
// data-act attributes handled in one delegated listener (flow.ts), as in v1, so engine-made SVG
// (ten-frame cells, number lines, fraction bars) stays interactive.
import type { ComponentChildren } from 'preact';
import { G as TG, THEMES } from '../design/tokens';
import { frontier, pickFocus } from '../engine/model';
import { MIS } from '../engine/misconceptions';
import { pick } from '../engine/rng';
import { GROUPS, SK, SKILLS, STAGES, STAGE_WITH } from '../engine/skills';
import type { Option, Skill } from '../engine/types';
import { plural, tensLabels, vBlocks, vFracBar, vLine, vPlates, vTF } from '../engine/visuals';
import { AVATARS, DEFAULT_AVATAR, OK_LINES, STATE_LABEL } from './data';
import { canSpeak, isDark } from './effects';
import { G, P, app, type BuildState } from './state';
import { dayKey, rel } from './util';

// ---------- small pieces ----------
/** Engine-made HTML without an extra layout box (.raw is display:contents). */
const Raw = ({ html }: { html: string }) => <div class="raw" dangerouslySetInnerHTML={{ __html: html }} />;
/** aria-pressed as the strings v1 wrote. */
const pressed = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');
const inner = (html: string) => ({ dangerouslySetInnerHTML: { __html: html } });

export const Gem = () => <svg class="gem" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z" class="g1" /><path d="M2 9h20M9 3l3 6 3-6M12 9v12" class="g2" /></svg>;

function starPath(cx: number, cy: number, R: number, r: number, points: number): string {
  let d = '';
  for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / points, rad = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1); }
  return d + 'Z';
}
const STAR_D = starPath(24, 25, TG.star.outerRadius, TG.star.innerRadius, TG.star.points);
export const Star = ({ state, cls = 'st' }: { state: string; cls?: string }) =>
  <svg class={cls} viewBox="0 0 48 48" aria-hidden="true">{state === 'lit' ? <circle cx="24" cy="25" r="22" class="glow" /> : null}<path d={STAR_D} class="sp" /></svg>;

const Ic = ({ d }: { d: string[] }) => <svg viewBox="0 0 24 24" aria-hidden="true">{d.map(x => <path class="ic" d={x} />)}</svg>;
const ICON = {
  close: () => <Ic d={['M6 6l12 12M18 6L6 18']} />,
  speak: () => <Ic d={['M4 9v6h4l5 4V5L8 9H4z', 'M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12']} />,
  bulb: () => <Ic d={['M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z']} />,
  back: () => <Ic d={['M9 6h11v12H9l-6-6z', 'M12 10l4 4M16 10l-4 4']} />,
  left: () => <Ic d={['M15 5l-7 7 7 7']} />,
  right: () => <Ic d={['M9 5l7 7-7 7']} />,
  up: ({ cls }: { cls?: string }) => <svg class={cls} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" style="fill:var(--accent-soft)" /><path d="M24 34V14M15 23l9-9 9 9" style="fill:none;stroke:var(--accent);stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round" /></svg>,
  shift: ({ cls }: { cls?: string }) => <svg class={cls} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" style="fill:var(--surface-2)" /><path d="M14 20h18l-5-5M34 28H16l5 5" style="fill:none;stroke:var(--sky);stroke-width:4;stroke-linecap:round;stroke-linejoin:round" /></svg>,
};

const GemPill = () => <span class="gems" aria-label={`${P().gems} gems`}><Gem /><b>{P().gems}</b></span>;
const StageChip = ({ st }: { st: number }) => <span class="stage" aria-label={`Level: ${STAGES[st]}`}>{[0, 1, 2].map(i => <i class={i <= st ? 'on' : ''} />)}{STAGES[st]}</span>;
const Avatar = ({ a, hidden }: { a: string; hidden?: boolean }) => <span class="avatar" aria-hidden={hidden ? 'true' : undefined}>{a}</span>;
const Brand = () => <div class="brand"><Star state="lit" /><span>Number Sky</span></div>;

function WeekDots() {
  const out: ComponentChildren[] = []; const t = new Date(); let n = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i), k = dayKey(d), on = P().days.includes(k); if (on) n++;
    out.push(<span class={`wd${on ? ' on' : ''}${i === 0 ? ' today' : ''}`}><i />{'SMTWTFS'[d.getDay()]}</span>);
  }
  return <div class="week" aria-label={`Practised ${n} of the last 7 days`}><span class="wl">This week</span>{out}</div>;
}
const SpeakBtn = ({ act = 'speak' }: { act?: string }) => canSpeak() ? <button class="iconbtn" data-act={act} aria-label="Read it to me"><ICON.speak /></button> : null;

function optClass(o: Option): string { const t = String(o.label).replace(/<[^>]+>/g, '').trim(); return /[a-z]{3,}/i.test(t) ? ' txt' : t.length > 6 ? ' mid' : ''; }
function OptBtn({ o, i, act, chosen, answer }: { o: Option; i: number; act: string; chosen: number | null; answer: string | number | undefined }) {
  const fbk = G.Cur!.phase === 'feedback'; let cls = 'opt' + optClass(o);
  if (fbk) { if (G.S!.mode !== 'placement') { if (String(o.value) === String(answer)) cls += ' right'; else if (i === chosen) cls += ' wrong'; } else if (i === chosen) cls += ' sel'; }
  return <button class={cls} data-act={act} data-i={i} disabled={fbk} {...inner(o.label)} />;
}

// ---------- screens ----------
export const Boot = () => <div class="boot"><Star state="lit" /><p class="muted">Loading your stars…</p></div>;

export function Welcome() {
  const UI = G.UI, av = UI.tmp.av || DEFAULT_AVATAR;
  return <section class="card">
    <Brand />
    <h1>Light up a star for every math skill you master.</h1>
    <p class="muted">Short practice with no timers. The app finds the right level and changes as you learn.</p>
    <form id="newp" class="form" autocomplete="off">
      {/* F-1.AC-2: ask for a nickname, not a name (wording from design/SCREENS.md §11). */}
      <label for="pname">What should we call you?<span class="help muted small">A nickname is fine. We don't need your real name.</span></label>
      <input id="pname" name="pname" maxLength={20} required value={UI.tmp.name || ''} />
      <fieldset><legend>Pick a buddy</legend>
        <div class="avs">{AVATARS.filter(a => a[1] === 0).map(([a]) => <button type="button" class={`av${a === av ? ' on' : ''}`} data-act="pickAv" data-d={a} aria-pressed={pressed(a === av)} aria-label={`Buddy ${a}`}>{a}</button>)}</div>
        <p class="muted small">You can unlock more buddies with gems.</p>
      </fieldset>
      <button class="btn big" type="submit">Let's go</button>
      {UI.tmp.adding ? <button type="button" class="btn secondary" data-act="back">Cancel</button> : null}
    </form>
  </section>;
}

export const Profiles = () => <section class="card"><Brand /><h1>Who's practising?</h1>
  <ul class="learners">{Object.values(app().profiles).map(p => <li><span class="avatar">{p.avatar}</span><span class="lname">{p.name}</span><button class="btn secondary" data-act="switchTo" data-d={p.id}>Start</button></li>)}</ul>
  <button class="btn ghost" data-act="addLearner">Add a learner</button></section>;

export const PlaceIntro = () => <section class="card">
  <header class="top"><Avatar a={P().avatar} /><div class="hello"><div class="hi">{`Hi, ${P().name}`}</div></div></header>
  <h1>First, a quick warm-up</h1>
  <p>About 8 questions to find your starting point. There's no timer and no score.</p>
  <p>If you don't know one, tap <b>I'm not sure</b>. That helps too.</p>
  <button class="btn big" data-act="beginPlace">Start the warm-up</button>
  <button class="btn secondary" data-act="skipPlace">Skip and start from the very beginning</button>
</section>;

export function Placed() {
  const p = P(), f = p.focus, lit = SKILLS.filter(s => p.skills[s.id].mastered);
  return <section class="card">
    <p class="eyebrow">Warm-up done</p><h1>{f ? `You're starting with ${SK[f].name}` : 'Every star is already lit'}</h1>
    {lit.length
      ? <p>{`${lit.length} ${plural(lit.length, 'star is', 'stars are')} already lit because you showed you know ${lit.length === 1 ? 'it' : 'them'}. They'll come back now and then to keep them bright.`}</p>
      : <p>We'll start at the beginning and move quickly through anything that feels easy.</p>}
    <p class="muted">Each skill has three levels: hands-on, pictures, then just numbers.</p>
    <button class="btn big" data-act="home">See my star chart</button></section>;
}

export function starState(id: string): 'lit' | 'now' | 'open' | 'locked' {
  const p = P(), st = p.skills[id];
  if (st.mastered) return 'lit'; if (id === p.focus) return 'now';
  return frontier(p).some(s => s.id === id) ? 'open' : 'locked';
}
function StarChart() {
  const p = P();
  return <>{GROUPS.map(g => <div class="const"><h3>{g}</h3><div class="stars">{SKILLS.filter(s => s.group === g).map(s => {
    const st = p.skills[s.id], state = starState(s.id), pips = st.mastered ? 3 : (state === 'locked' ? 0 : st.stage);
    return <button class={`star ${state}`} data-act="star" data-d={s.id} aria-label={`${s.name}: ${STATE_LABEL[state]}`}><Star state={state} /><span class="sname">{s.name}</span><span class="pips" aria-hidden="true">{[0, 1, 2].map(i => <i class={i < pips ? 'on' : ''} />)}</span>{state === 'now' ? <span class="nowtag">Now</span> : null}</button>;
  })}</div></div>)}</>;
}

export function Home() {
  const p = P(), f = pickFocus(p), st = f ? p.skills[f].stage : 0, lit = SKILLS.filter(s => p.skills[s.id].mastered).length;
  return <>
    <header class="top"><Avatar a={p.avatar} hidden /><div class="hello"><div class="hi">{`Hi, ${p.name}`}</div><div class="sub">{`${lit} of ${SKILLS.length} stars lit`}</div></div><GemPill /></header>
    <section class="card hero">
      <div class="hero-sky" aria-hidden="true" />
      <p class="eyebrow">Today's practice</p>
      <h1>{f ? SK[f].name : 'Keep your stars bright'}</h1>
      {f ? <StageChip st={st} /> : null}
      <p class="hero-note">{f ? SK[f].kid : 'You have lit every star. Practice now reviews them so they stay strong.'}</p>
      <button class="btn big" data-act="start">{`Start · ${p.settings.sessionLen} questions`}</button>
      <WeekDots />
    </section>
    <section class="chart" aria-labelledby="chartH"><div class="sec-head"><h2 id="chartH">Your star chart</h2><p class="muted small">Tap a star to see what it is. Dots show the levels you've finished.</p></div><StarChart /></section>
    <nav class="home-nav" aria-label="More"><button class="btn secondary" data-act="shop"><Gem /> Shop</button><button class="btn secondary hold" data-hold="1" aria-label="Grown-ups. Press and hold to open.">Grown-ups (hold)<span class="holdbar" /></button></nav>
  </>;
}

export function Practice() {
  const Cur = G.Cur!, S = G.S!, q = Cur.q, sk = SK[q.skill], fbk = Cur.phase === 'feedback', pl = S.mode === 'placement', p = P();
  const prog = pl
    ? <div class="prog-text">{`Warm-up · question ${Math.min(S.P!.asked + (fbk ? 0 : 1), 12)}`}</div>
    : <div class="prog" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={S.n} aria-valuenow={S.i}>{Array.from({ length: S.n }, (_, i) => <i class={i < S.i ? 'done' : (i === S.i && !fbk ? 'cur' : '')} />)}</div>;
  const meta = pl ? <span class="chip">Warm-up</span> : <><span class="chip">{sk.name}</span><StageChip st={q.stage} />{q.review ? <span class="chip rev">Review</span> : null}</>;
  const input = q.kind === 'mc' ? <div class="opts">{q.options!.map((o, i) => <OptBtn o={o} i={i} act="opt" chosen={Cur.chosen} answer={q.answer} />)}</div> : q.kind === 'pad' ? <Pad /> : <Build />;
  const helpers = fbk ? null : <div class="helpers">
    {!pl && q.hint && !Cur.hintShown ? <button class="btn ghost" data-act="hint"><ICON.bulb /> Hint</button> : null}
    {!pl && q.chart && p.settings.chart ? <button class="btn ghost" data-act="chart">Times chart</button> : null}
    <button class="btn ghost" data-act="unsure">I'm not sure</button></div>;
  const hint = Cur.hintShown && q.hint ? <div class="hint" role="note"><b>Hint</b><p {...inner(q.hint.text)} />{q.hint.visual ? <div class="visual" {...inner(q.hint.visual)} /> : null}</div> : null;
  return <>
    <div class="ptop"><button class="iconbtn" data-act="quit" aria-label="Stop practice"><ICON.close /></button>{prog}<GemPill /></div>
    <div class="meta">{meta}</div>
    <section class="card qcard" aria-label="Question">
      <div class="qhead"><div class="prompt">{q.lead ? <p class="muted lead">{q.lead}</p> : null}<Raw html={q.prompt} /></div><SpeakBtn /></div>
      {q.visual ? <div class="visual" {...inner(q.visual)} /> : null}
      {input}{hint}{helpers}
    </section>
    {fbk ? <Feedback /> : null}
  </>;
}

function Pad() {
  const Cur = G.Cur!, fbk = Cur.phase === 'feedback', keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  const cls = fbk && G.S!.mode !== 'placement' ? (Cur.ok ? ' right' : ' wrong') : '';
  return <>
    <div class={`padshow${cls}`} aria-live="polite" aria-label="Your answer">{Cur.entry ? Cur.entry : <span class="ph">Tap the numbers</span>}</div>
    <div class="pad">{keys.map(k => <button class={`key${k === 'ok' ? ' ok' : ''}`} data-act="key" data-d={k} disabled={fbk || (k === 'ok' && !Cur.entry)} aria-label={k === 'del' ? 'Delete' : k === 'ok' ? 'Check' : k}>{k === 'del' ? <ICON.back /> : k === 'ok' ? 'Check' : k}</button>)}</div>
  </>;
}

const NEEDS_CHECK = ['tenframe', 'blocks', 'nlplace', 'crossout', 'groups', 'rows', 'shade'];

function Build() {
  const Cur = G.Cur!, q = Cur.q, bd = q.build!, b = Cur.b as BuildState, done = !!b.done || Cur.phase !== 'answer';
  let h: ComponentChildren = null;
  switch (bd.type) {
    case 'tenframe': { let s = ''; for (let f = 0; f < bd.frames; f++) s += vTF(b.cells!.slice(f * 10, f * 10 + 10), done ? null : f * 10); h = <div class="tfwrap" {...inner(s)} />; break; }
    case 'blocks': {
      const places: [string, string, string, number][] = [...(bd.hundreds ? [['h', 'Hundreds', 'hundred', 3] as [string, string, string, number]] : []), ['t', 'Tens', 'ten', 9], ['o', 'Ones', 'one', 9]];
      h = <><Raw html={vBlocks(b.h!, b.t!, b.o!)} /><div class="steppers">{places.map(([k, l, one, mx]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="blk" data-d={`${k}-`} aria-label={`Take away one ${one}`} disabled={done || v <= 0}>−</button><span class="sv" aria-label={`${v} ${plural(v, one)}`}>{v}</span><button class="sbtn" data-act="blk" data-d={`${k}+`} aria-label={`Add one ${one}`} disabled={done || v >= mx}>+</button></div>;
      })}</div></>;
      break;
    }
    case 'nlplace':
      h = <><div class="visual" {...inner(vLine({ min: bd.min, max: bd.max, labels: bd.labels, marker: b.m ?? null, tap: !done }))} /><div class="brow"><button class="iconbtn" data-act="nlnudge" data-d="-1" aria-label="Move the dot left" disabled={done}><ICON.left /></button><span class="muted">{b.m === null ? 'Tap the line' : 'Arrows move the dot'}</span><button class="iconbtn" data-act="nlnudge" data-d="1" aria-label="Move the dot right" disabled={done}><ICON.right /></button></div></>;
      break;
    case 'jumps': {
      const lo = b.lo!, hi = b.hi!, pos = b.pos!, hist = b.hist as [number, number][];
      const lab = bd.tens ? tensLabels(lo, hi) : [0, 5, 10, 15, 20].filter(v => v >= lo && v <= hi);
      h = <><div class="pospill">You're on <b>{pos}</b></div><div class="visual" {...inner(vLine({ min: lo, max: hi, labels: lab, marker: pos, jumps: hist.map(([f, t]) => ({ from: f, to: t, label: '+' + (t - f) })) }))} />
        <div class="jlog" aria-label="Jumps so far">{hist.length ? hist.map(([f, t]) => <span class="chip">{`+${t - f}`}</span>) : <span class="muted">No jumps yet</span>}</div>
        <div class="brow">{bd.tens ? <button class="btn secondary" data-act="jump" data-d="10" disabled={done || pos + 10 > hi}>+10</button> : null}<button class="btn secondary" data-act="jump" data-d="1" disabled={done || pos + 1 > hi}>+1</button><button class="btn ghost" data-act="jundo" disabled={done || !hist.length}>Undo</button></div>
        {done ? null : <button class="btn big" data-act="jdone">I'm there</button>}</>;
      break;
    }
    case 'crossout': {
      const x = b.x!;
      h = <><div class="items tap">{x.map((v, i) => <button class={`it-c${v ? ' x' : ''}`} data-act="cross" data-i={i} aria-pressed={pressed(v)} aria-label={`${i + 1}${v ? ', taken away' : ''}`} disabled={done}>{bd.e}</button>)}</div><p class="muted center">{`Taken away: ${x.filter(Boolean).length}`}</p></>;
      break;
    }
    case 'groups':
      h = <><Raw html={vPlates(b.a!, b.b!, bd.e)} /><div class="steppers">{([['a', 'Groups'], ['b', 'In each group']] as const).map(([k, l]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="grp" data-d={`${k}-`} aria-label={`${l}: fewer`} disabled={done || v <= 1}>−</button><span class="sv">{v}</span><button class="sbtn" data-act="grp" data-d={`${k}+`} aria-label={`${l}: more`} disabled={done || v >= 6}>+</button></div>;
      })}</div></>;
      break;
    case 'rows': {
      const r = b.r!;
      h = <><div class="rows" role="img" aria-label={`${r} rows of ${bd.each}`}>{r ? Array.from({ length: r }, (_, i) => <div class="row"><span class="dots">{Array.from({ length: bd.each }, () => <i />)}</span><span class="sk">{(i + 1) * bd.each}</span></div>) : <p class="muted">No rows yet</p>}</div>
        <div class="brow"><button class="btn secondary" data-act="row" data-d="+" disabled={done || r >= 10}>{`+ Add a row of ${bd.each}`}</button><button class="btn ghost" data-act="row" data-d="-" disabled={done || r <= 0}>Remove a row</button></div></>;
      break;
    }
    case 'share': {
      const plates = b.plates!, left = bd.n - plates.reduce((a, c) => a + c, 0);
      h = <><div class="pool"><div>Left to share: <b>{left}</b></div><div class="items">{left ? Array.from({ length: left }, () => <span class="it-c">{bd.e}</span>) : <span class="muted">All shared</span>}</div></div>
        <div class="plates">{plates.map((c, i) => <div class="pgrp"><button class="plate tap" data-act="plate" data-i={i} aria-label={`Plate ${i + 1}, has ${c}`} disabled={done || left === 0}>{Array.from({ length: c }, () => <span class="it">{bd.e}</span>)}</button><div class="plabel">{`Plate ${i + 1}`}</div></div>)}</div>
        <div class="brow"><button class="btn ghost" data-act="sundo" disabled={done || !(b.hist as number[]).length}>Undo</button></div></>;
      break;
    }
    case 'makegroups': {
      const g = b.g!, left = bd.n - g * bd.k;
      h = <><div class="pool"><div>Left: <b>{left}</b></div><div class="items">{left ? Array.from({ length: left }, () => <span class="it-c">{bd.e}</span>) : <span class="muted">None left</span>}</div></div>
        <button class="btn big" data-act="mkgrp" disabled={done || left < bd.k}>{`Make a group of ${bd.k}`}</button>{g ? <Raw html={vPlates(g, bd.k, bd.e, { box: true, label: 'Group' })} /> : null}</>;
      break;
    }
    case 'shade':
      h = <><div class="visual" {...inner(vFracBar(bd.n, 0, { shaded: b.s!, tap: !done }))} /><p class="muted center">{`Shaded: ${b.s!.filter(Boolean).length}`}</p></>;
      break;
  }
  return <div class="build">
    {h}
    {!done && NEEDS_CHECK.includes(bd.type) ? <button class="btn big" data-act="bcheck">Check</button> : null}
    {b.msg && !done ? <p class="nudge" role="status">{b.msg}</p> : null}
    {b.done && q.followup ? <div class="follow"><div class="qhead"><p class="prompt sm" {...inner(q.followup.prompt)} /><SpeakBtn act="fspeak" /></div><div class="opts">{q.followup.options.map((o, i) => <OptBtn o={o} i={i} act="fopt" chosen={Cur.fchosen} answer={q.followup!.answer} />)}</div></div> : null}
  </div>;
}

export function answerText(): string {
  const Cur = G.Cur!, q = Cur.q;
  const find = (opts: Option[], ans: string | number | undefined) => { const o = opts.find(o => String(o.value) === String(ans)); return o ? o.label.replace(/<svg[\s\S]*?<\/svg>/g, '') : ''; };
  if (q.kind === 'mc') return find(q.options!, q.answer); if (q.kind === 'pad') return String(q.answer);
  if (q.followup && Cur.b && Cur.b.done) return find(q.followup.options, q.followup.answer);
  return '';
}

function Feedback() {
  const Cur = G.Cur!, q = Cur.q, p = P();
  if (G.S!.mode === 'placement') return <section class={`card fb${Cur.ok ? ' good' : ''}`} id="fb"><div class="buddy"><span class="avatar">{p.avatar}</span><div class="bubble" role="status">{Cur.ok ? "That's right." : 'Thanks. That helps find your starting point.'}</div></div><button class="btn big" data-act="next">Next</button></section>;
  if (Cur.ok) return <section class="card fb good" id="fb"><div class="buddy"><span class="avatar">{p.avatar}</span><div class="bubble" role="status">{pick(OK_LINES) + (Cur.hinted ? ' (with a hint)' : '')}</div></div><div class="fb-gems">{`+${Cur.gain} `}<Gem /></div><button class="btn big" data-act="next">Next</button></section>;
  const mt = Cur.mis && MIS[Cur.mis] ? MIS[Cur.mis].kid : null, at = answerText();
  return <section class="card fb warm" id="fb">
    <h2 role="status">{Cur.unsure ? "Good call asking. Here's how to see it." : "Not quite. Let's look at it another way."}</h2>
    {mt ? <p><b>{mt}</b></p> : null}
    <p {...inner(q.explain.text)} />
    {q.explain.visual ? <div class="visual" {...inner(q.explain.visual)} /> : null}
    {at ? <p class="ans">The answer is <b {...inner(at)} />.</p> : null}
    <div class="fb-gems">{`+${Cur.gain} `}<Gem /> for trying</div>
    <button class="btn big" data-act="next">Got it, next</button></section>;
}

export function Summary() {
  const S = G.S!, p = P(), ev = S.events, wins: ComponentChildren[] = [];
  ev.forEach(e => {
    if (e.type === 'mastered') wins.push(<li><Star state="lit" />{`Lit a star: ${SK[e.skill].name}`}</li>);
    else if (e.type === 'up') wins.push(<li><ICON.up />{`${SK[e.skill].name}: up to ${STAGE_WITH[e.stage]}`}</li>);
  });
  const ups = ev.filter(e => e.type === 'up' || e.type === 'mastered').length;
  return <section class="card"><p class="eyebrow">{S.early ? 'Stopped for now' : 'Practice done'}</p><h1>{`Nice work, ${p.name}.`}</h1>
    <div class="stats"><div><b>{S.answered}</b><span>{plural(S.answered, 'question')}</span></div><div><b>{`+${S.gems}`}</b><span>gems</span></div><div><b>{ups}</b><span>{plural(ups, 'level-up')}</span></div></div>
    {wins.length ? <ul class="wins">{wins}</ul> : <p class="muted">Every answer moves you closer to the next level.</p>}
    <WeekDots />
    <div class="row"><button class="btn big" data-act="more">5 more questions</button><button class="btn secondary" data-act="home">Back to my stars</button></div></section>;
}

export function Shop() {
  const p = P();
  return <>
    <header class="top"><button class="iconbtn" data-act="home" aria-label="Back"><ICON.left /></button><div class="hello"><div class="hi">Shop</div><div class="sub">Spend gems on buddies and colours</div></div><GemPill /></header>
    <section class="card"><h2>Buddies</h2><div class="shopgrid">{AVATARS.map(([a, pr]) => {
      const own = p.owned.avatars.includes(a) || pr === 0, use = p.avatar === a;
      return <button class={`item${use ? ' using' : ''}`} data-act="buyAv" data-d={a} aria-label={`Buddy ${a}${use ? ', in use' : own ? ', owned' : `, costs ${pr} gems`}`}><span class="emo">{a}</span><span class="price">{use ? 'Using' : own ? 'Use' : <><Gem />{String(pr)}</>}</span></button>;
    })}</div></section>
    <section class="card"><h2>Colours</h2><div class="shopgrid">{Object.entries(THEMES).map(([k, t]) => {
      const own = p.owned.themes.includes(k) || t.priceGems === 0, use = p.theme === k, c = isDark() ? t.dark.accent : t.light.accent;
      return <button class={`item${use ? ' using' : ''}`} data-act="buyTheme" data-d={k} aria-label={`${t.name}${use ? ', in use' : own ? ', owned' : `, costs ${t.priceGems} gems`}`}><span class="sw" style={`background:${c}`} />{t.name}<span class="price">{use ? 'Using' : own ? 'Use' : <><Gem />{t.priceGems}</>}</span></button>;
    })}</div></section>
    <p class="muted small center">You earn gems for every answer, level-up and finished practice.</p>
  </>;
}

function SkillRow({ s }: { s: Skill }) {
  const p = P(), st = p.skills[s.id], isF = frontier(p).some(x => x.id === s.id); let chip, pct: number, lab: string;
  if (st.mastered) { chip = <span class="chip good">Mastered</span>; pct = Math.round(st.pL[2] * 100); lab = `Confidence ${pct}%`; }
  else if (isF) { chip = <span class="chip acc">{`${STAGES[st.stage]} level`}</span>; pct = Math.round(st.pL[st.stage] * 100); lab = `${pct}% estimated at this level`; }
  else { chip = <span class="chip">Locked</span>; pct = 0; lab = `Unlocks after ${s.pre.map(id => SK[id].name).join(' and ')}`; }
  const att = st.att.reduce((a, b) => a + b, 0), cor = st.cor.reduce((a, b) => a + b, 0);
  return <li class="sr"><div class="sr-top"><b>{s.name}</b>{chip}</div><div class="bar" aria-hidden="true"><span style={`width:${pct}%`} /></div><div class="sr-meta">{lab + (att ? ` · ${att} ${plural(att, 'answer')}, ${Math.round(cor / att * 100)}% right · last ${rel(st.lastSeen)}` : '')}</div><p class="muted small">{s.about}</p></li>;
}
function Seg({ k, label, opts }: { k: string; label: string; opts: [string | number | boolean, string][] }) {
  return <div class="set"><span class="set-l" id={`set-${k}`}>{label}</span><div class="seg" role="group" aria-labelledby={`set-${k}`}>{opts.map(([v, t]) => <button data-act="set" data-k={k} data-v={String(v)} aria-pressed={pressed(String(P().settings[k]) === String(v))}>{t}</button>)}</div></div>;
}

export function Grown() {
  const p = P(), UI = G.UI, wk = Date.now() - 7 * 864e5, rec = p.log.filter(l => l.t >= wk && !l.p), acc = rec.length ? Math.round(rec.filter(l => l.ok).length / rec.length * 100) : null;
  const wkKey = dayKey(new Date(wk)), days = p.days.filter(d => d > wkKey).length, lit = SKILLS.filter(s => p.skills[s.id].mastered).length, f = pickFocus(p);
  const misList = Object.entries(p.mis).filter(([k]) => MIS[k]).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  const sess = p.sessions.slice(-8).reverse();
  return <>
    <header class="top"><button class="iconbtn" data-act="back" aria-label="Back to the star chart"><ICON.left /></button><div class="hello"><div class="hi">Grown-up view</div><div class="sub">{p.name}</div></div></header>
    <section class="card"><h2>At a glance</h2>
      <div class="glance"><div><b>{`${lit}/${SKILLS.length}`}</b><span>skills mastered</span></div><div><b>{rec.length}</b><span>questions in 7 days</span></div><div><b>{acc === null ? '–' : acc + '%'}</b><span>right in 7 days</span></div><div><b>{days}</b><span>days practised in 7</span></div></div>
      <p>{f ? <>Working on <b>{SK[f].name}</b> at the <b>{STAGES[p.skills[f].stage].toLowerCase()}</b> level.</> : 'All skills mastered. Practice is review only.'}</p></section>
    <section class="card"><h2>Patterns noticed</h2>
      {misList.length
        ? <><ul class="mis">{misList.map(([k, v]) => <li data-pattern={k}><div class="mis-top"><b>{MIS[k].parent}</b><span class="chip">{`${v.count}×`}</span></div><p class="muted small">{`Last seen ${rel(v.last)}`}</p><p><span class="try">Try at home:</span>{' ' + MIS[k].act}</p></li>)}</ul><p class="muted small">Worth sharing with her teacher or tutor.</p></>
        : <p class="muted">Nothing yet. When a wrong answer matches a common pattern, such as subtracting on a division question, it shows up here with an activity to try at home.</p>}</section>
    <section class="card"><h2>Skills</h2><ul class="skl">{SKILLS.map(s => <SkillRow s={s} />)}</ul></section>
    <section class="card"><h2>Recent sessions</h2>{sess.length ? <ul class="sess">{sess.map(s => <li><span>{new Date(s.d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + (s.m === 'placement' ? ' · warm-up' : '')}</span><span class="muted">{`${s.n} ${plural(s.n, 'question')}, ${s.c} right, ${s.min} min`}</span></li>)}</ul> : <p class="muted">No sessions yet.</p>}</section>
    <section class="card"><h2>Settings</h2>
      <Seg k="sessionLen" label="Questions per session" opts={[[5, '5'], [10, '10'], [15, '15']]} />
      <Seg k="sound" label="Sounds" opts={[[true, 'On'], [false, 'Off']]} />
      <Seg k="autoRead" label="Read each question aloud" opts={[[false, 'Off'], [true, 'On']]} />
      <Seg k="chart" label="Times-table chart on facts" opts={[[true, 'Allowed'], [false, 'Hidden']]} />
      {canSpeak() ? null : <p class="muted small">Read-aloud isn't available in this browser.</p>}</section>
    <section class="card"><h2>How it decides what comes next</h2><ul class="how">
      <li>Each skill has three levels: <b>hands-on</b> (she builds it), <b>pictures</b> (she reads a picture), and <b>numbers</b> (symbols only).</li>
      <li>After every answer the app updates its estimate of how likely she is to know that skill at that level (Bayesian Knowledge Tracing). Past 90%, with her last three answers right and no hints, she moves up a level.</li>
      <li>If 2 of her last 3 answers are wrong and the estimate drops below 40%, she moves down a level. If she's struggling even hands-on, it goes back to the earlier skill this one depends on.</li>
      <li>Every fourth question reviews a skill she has already mastered. Two misses in review reopen that skill.</li>
      <li>No timers. Hints and "I'm not sure" are always there; they slow progress a little but never cost gems.</li>
    </ul></section>
    <section class="card"><h2>Learners and data</h2>
      <p>{G.store.mode === 'account' ? 'Progress is saved to the Claude account that opened this page, and in this browser.' : 'Progress is saved in this browser only. Copy a backup code to move it to another device.'}</p>
      <div class="row"><button class="btn secondary" data-act="copyBackup">Copy backup code</button></div>
      {UI.tmp.code ? <><label for="codeOut" class="small muted">Backup code (select all and copy)</label><textarea readOnly class="code" id="codeOut" value={UI.tmp.code} /></> : null}
      <form id="restoreForm" class="form"><label for="restoreText">Restore from a backup code</label><textarea id="restoreText" class="code" rows={3} /><button class="btn secondary" type="submit">Restore</button></form>
      <h3>Learners</h3><ul class="learners">{Object.values(app().profiles).map(x => <li><span class="avatar">{x.avatar}</span><span class="lname">{x.name}</span>{x.id === p.id ? <span class="chip">Current</span> : <button class="btn secondary" data-act="switchTo" data-d={x.id}>Switch</button>}</li>)}</ul>
      <button class="btn secondary" data-act="addLearner">Add a learner</button>
      <div class="row"><button class="btn ghost" data-act="redo">Redo the warm-up</button><button class="btn ghost" data-act="reset">{`Reset ${p.name}'s progress`}</button></div>
    </section>
  </>;
}

export function Modal() {
  const m = G.UI.modal; if (!m) return null; let body: ComponentChildren = null;
  if (m.type === 'event') {
    const e = m.ev, s = SK[e.skill]; let icon, title: string, text: string;
    if (e.type === 'mastered') { icon = <Star state="lit" cls="big-star" />; title = 'A new star is lit!'; text = `You've mastered ${s.name}.`; }
    else if (e.type === 'up') { icon = <ICON.up cls="big-star" />; title = 'Level up!'; text = `You're ready for ${s.name} with ${STAGE_WITH[e.stage]}.`; }
    else if (e.type === 'down') { icon = <ICON.shift cls="big-star" />; title = "Let's switch it up"; text = `Let's try ${s.name} with ${STAGE_WITH[e.stage]} for a bit. It makes it easier to see what's going on. You'll move back up soon.`; }
    else if (e.type === 'prereq') { icon = <ICON.shift cls="big-star" />; title = 'Quick warm-up'; text = `Let's practise ${SK[e.to].name} for a bit. It will make ${s.name} easier.`; }
    else { icon = <ICON.shift cls="big-star" />; title = 'Quick refresh'; text = `Let's brush up on ${s.name} for a few questions.`; }
    body = <section class="card modal" role="dialog" aria-modal="true" aria-labelledby="mt">{icon}<h2 id="mt">{title}</h2><p class="mbody">{text}</p><button class="btn big" data-act="eventOk" data-focus="1">Keep going</button></section>;
  } else if (m.type === 'confirm') {
    body = <section class="card modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h2 id="mt">{m.title}</h2><p class="mbody">{m.text}</p><div class="row"><button class="btn secondary" data-act="closeModal" data-focus="1">Cancel</button><button class="btn" data-act={m.act}>{m.yes}</button></div></section>;
  } else if (m.type === 'star') {
    const s = SK[m.id], st = P().skills[m.id], state = starState(m.id);
    const status = state === 'lit' ? 'Mastered. It comes back in review now and then.' : state === 'now' ? `Practising now at the ${STAGES[st.stage].toLowerCase()} level.` : state === 'open' ? 'Ready to start.' : `Unlocks after ${s.pre.map(id => SK[id].name).join(' and ')}.`;
    body = <section class="card modal" role="dialog" aria-modal="true" aria-labelledby="mt"><Star state={state === 'lit' ? 'lit' : 'now'} cls="big-star" /><h2 id="mt">{s.name}</h2><p class="mbody">{s.kid}</p><p class="mbody muted">{status}</p>{state === 'open' ? <button class="btn big" data-act="focusSkill" data-d={m.id}>Practise this next</button> : null}<button class="btn secondary" data-act="closeModal" data-focus="1">Close</button></section>;
  } else if (m.type === 'chart') {
    const hi = m.hi || [0, 0], rows: ComponentChildren[] = [];
    for (let r = 1; r <= 10; r++) {
      const cells: ComponentChildren[] = [];
      for (let c = 1; c <= 10; c++) { const cls = (r === hi[0] && c === hi[1]) ? 'hx' : (r === hi[0] || c === hi[1]) ? 'hl' : ''; cells.push(<td class={cls} data-act="chartcell" data-i={r} data-d={c}>{r * c}</td>); }
      rows.push(<tr><th scope="row">{r}</th>{cells}</tr>);
    }
    body = <section class="card modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h2 id="mt">Times chart</h2><p class="mbody small muted">Tap a number to light up its row and column. Using the chart counts like a hint.</p><div class="chartwrap"><table class="chartgrid"><thead><tr><th scope="col">×</th>{Array.from({ length: 10 }, (_, i) => <th scope="col">{i + 1}</th>)}</tr></thead><tbody>{rows}</tbody></table></div><button class="btn big" data-act="closeModal" data-focus="1">Back to the question</button></section>;
  }
  return <div class="scrim">{body}</div>;
}

export const Layer = () => <>{G.UI.modal ? <Modal /> : null}{G.UI.toast ? <div class="toast" role="status">{G.UI.toast}</div> : null}</>;

export function Screen() {
  switch (G.UI.screen) {
    case 'boot': return <Boot />;
    case 'welcome': return <Welcome />;
    case 'profiles': return <Profiles />;
    case 'placeIntro': return <PlaceIntro />;
    case 'practice': return <Practice />;
    case 'placed': return <Placed />;
    case 'summary': return <Summary />;
    case 'shop': return <Shop />;
    case 'grown': return <Grown />;
    default: return <Home />;
  }
}
