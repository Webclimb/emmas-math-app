// Screens, direction B "Star Lines" (design/SCREENS.md, design/COMPONENTS.md). Milestone MD restyles
// and re-lays out the v1 screens; behaviour is v1's except where the approved design changes it.
// Interaction is by data-act attributes handled in one delegated listener (flow.ts), so engine-made SVG
// (ten-frame cells, number lines, fraction bars) stays interactive.
import type { ComponentChildren } from 'preact';
import { THEMES } from '../design/tokens';
import { kit } from '../design/kit';
import { frontier, pickFocus } from '../engine/model';
import { MIS } from '../engine/misconceptions';
import { pick } from '../engine/rng';
import { GROUPS, SK, SKILLS, STAGES, STAGE_WITH } from '../engine/skills';
import type { Option, Skill } from '../engine/types';
import { plural, tensLabels, vBlocks, vFracBar, vLine, vPlates, vTF } from '../engine/visuals';
import { CHECK_MAX, goalPath, workbookReady } from '../engine/workbook';
import { AVATARS, OK_LINES, STATE_LABEL } from './data';
import { canSpeak, isDark } from './effects';
import { G, P, app, type BuildState } from './state';
import { dayKey, rel } from './util';

// ---------- small pieces ----------
/** Engine-made HTML without an extra layout box (.raw is display:contents). */
const Raw = ({ html }: { html: string }) => <div class="raw" dangerouslySetInnerHTML={{ __html: html }} />;
const inner = (html: string) => ({ dangerouslySetInnerHTML: { __html: html } });
/** aria-pressed as strings. */
const pressed = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');
/** A kit graphic, decorative. */
export const K = ({ n, cls = 'ki' }: { n: string; cls?: string }) => <span class={cls} aria-hidden="true" {...inner(kit(n))} />;
export const Gem = () => <K n="gem" />;

const initial = (name: string) => (name.trim()[0] || '').toUpperCase();
/** Badge (design/COMPONENTS.md §2): a frame holding her initial, or an emblem. */
export function Avatar({ a, name, sm }: { a: string; name: string; sm?: boolean }) {
  const [kind, style] = a.split(':');
  const art = kind === 'emblem' ? kit(`avatar-emblem-${style}`) : kit(`avatar-frame-${style || 'square'}`);
  return <span class={`avatar${style === 'roundel' ? ' roundel' : ''}${sm ? ' sm' : ''}`} aria-hidden="true"><span class="raw" {...inner(art)} />{kind === 'emblem' ? null : <span>{initial(name)}</span>}</span>;
}

const GemPill = () => <span class="gems" aria-label={`${P().gems} gems`}><Gem /><b>{String(P().gems)}</b></span>;
const Level = ({ st, word = STAGES[st] }: { st: number; word?: string }) => <span class="level" aria-label={`Level: ${STAGES[st]}`}>{[0, 1, 2].map(i => <i class={i <= st ? 'on' : ''} />)}<span>{word}</span></span>;
const Brand = () => <div class="brand"><K n="badge-star-lit" /><h1>Number Sky</h1></div>;
const SpeakBtn = ({ act = 'speak' }: { act?: string }) => canSpeak() ? <button class="btn icon" data-act={act} aria-label="Read it to me"><K n="icon-read-aloud" /></button> : null;

function WeekCard() {
  const out: ComponentChildren[] = []; const t = new Date(); let n = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i), k = dayKey(d), on = P().days.includes(k); if (on) n++;
    out.push(<span class={`wd${on ? ' on' : ''}${i === 0 ? ' today' : ''}`}><i>{on ? <K n="icon-check" /> : null}</i>{'SMTWTFS'[d.getDay()]}</span>);
  }
  return <section class="card quiet stack" aria-label="This week">
    <div class="maphead"><h2>This week</h2><b>{`${n} of 7 days`}</b></div>
    <div class="week" role="img" aria-label={`Practised ${n} of the last 7 days`}>{out}</div>
  </section>;
}

function optClass(o: Option): string { const t = String(o.label).replace(/<[^>]+>/g, '').trim(); return /[a-z]{3,}/i.test(t) ? ' txt' : t.length > 6 ? ' mid' : ''; }
function OptBtn({ o, i, act, chosen, answer }: { o: Option; i: number; act: string; chosen: number | null; answer: string | number | undefined }) {
  const fbk = G.Cur!.phase === 'feedback'; let cls = 'opt' + optClass(o), mark = '', label = '';
  if (fbk) {
    const right = String(o.value) === String(answer);
    if (G.S!.mode === 'practice') {
      if (right) { cls += ' right'; mark = kit('icon-check', 'st'); label = ', correct answer'; }
      else if (i === chosen) { cls += ' wrong'; mark = kit('icon-not-yet', 'st'); label = ', your answer, not yet'; }
      else cls += ' dim';
    } else if (i === chosen) cls += ' sel'; else cls += ' dim';
  }
  const text = String(o.label).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
  return <button class={cls} data-act={act} data-i={i} disabled={fbk} aria-label={label ? text + label : undefined} {...inner(o.label + mark)} />;
}

// ---------- screens ----------
export const Boot = () => <div class="boot"><K n="badge-star-lit" /><p class="muted">Loading your stars…</p></div>;

export function Welcome() {
  const UI = G.UI, av = UI.tmp.av || AVATARS[0].id;
  return <section class="card">
    <Brand />
    <p>Light up a star for every maths skill you master.</p>
    <p class="muted">Short practice with no timers. The app finds the right level and changes as you learn.</p>
    <form id="newp" class="form" autocomplete="off">
      {/* F-1.AC-2: ask for a nickname, not a name (wording from design/SCREENS.md §11). */}
      <label for="pname">What should we call you?<span class="help muted small">A nickname is fine. We don't need your real name.</span></label>
      <input id="pname" name="pname" maxLength={20} required value={UI.tmp.name || ''} />
      <fieldset><legend>Pick a badge</legend>
        <div class="tiles sm">{AVATARS.filter(a => a.price === 0).map(a => <button type="button" class={`tile av${a.id === av ? ' on' : ''}`} data-act="pickAv" data-d={a.id} aria-pressed={pressed(a.id === av)} aria-label={`Badge: ${a.name}`}><span class="tile__art"><Avatar a={a.id} name={UI.tmp.name || ''} /></span><span class="tile__name">{a.name}</span></button>)}</div>
        <p class="small">You can get more badges with gems.</p>
      </fieldset>
      <button class="btn primary big" type="submit">Start</button>
      {UI.tmp.adding ? <button type="button" class="btn" data-act="back">Cancel</button> : null}
    </form>
  </section>;
}

export const Profiles = () => <section class="card"><Brand /><h2>Who's practising?</h2>
  <ul class="learners">{Object.values(app().profiles).map(p => <li><Avatar a={p.avatar} name={p.name} sm /><span class="lname">{p.name}</span><button class="btn" data-act="switchTo" data-d={p.id}>Start</button></li>)}</ul>
  <button class="btn ghost" data-act="addLearner">Add a learner</button></section>;

export const PlaceIntro = () => <section class="card">
  <header class="head"><Avatar a={P().avatar} name={P().name} /><div class="who"><div class="name hi">{`Hi, ${P().name}`}</div></div></header>
  <h1>First, a quick warm-up</h1>
  <p>About 8 questions to find your starting point. There's no timer and no score.</p>
  <p>If you don't know one, tap <b>I'm not sure</b>. That helps too.</p>
  <button class="btn primary big" data-act="beginPlace">Start the warm-up</button>
  <button class="btn" data-act="skipPlace">Skip and start from the very beginning</button>
</section>;

export function Placed() {
  const p = P(), f = p.focus, lit = SKILLS.filter(s => p.skills[s.id].mastered);
  return <section class="card">
    <p class="eyebrow">Warm-up done</p><h1>{f ? `You're starting with ${SK[f].name}` : 'Every star is already lit'}</h1>
    {lit.length
      ? <p>{`${lit.length} ${plural(lit.length, 'star is', 'stars are')} already lit because you showed you know ${lit.length === 1 ? 'it' : 'them'}. They'll come back now and then to keep them bright.`}</p>
      : <p>We'll start at the beginning and move quickly through anything that feels easy.</p>}
    <p class="muted">Each skill has three levels: hands-on, pictures, then just numbers.</p>
    <button class="btn primary big" data-act="home">See my star lines</button></section>;
}

export function starState(id: string): 'lit' | 'now' | 'open' | 'locked' {
  const p = P(), st = p.skills[id];
  if (st.mastered) return 'lit'; if (id === p.focus) return 'now';
  return frontier(p).some(s => s.id === id) ? 'open' : 'locked';
}
/** "Start here" / "After …" for a line: the first station's prerequisites outside the line. */
function lineFrom(g: string): string {
  const first = SKILLS.find(s => s.group === g)!, ext = first.pre.filter(id => SK[id].group !== g);
  if (!ext.length) return 'Start here';
  const groups = [...new Set(ext.map(id => SK[id].group))];
  const names = ext.length >= 3 && groups.length === 1 ? groups : ext.map(id => SK[id].name);
  return 'After ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names.at(-1) : names[0]);
}
function StarLines() {
  return <>{GROUPS.map(g => {
    const list = SKILLS.filter(s => s.group === g), states = list.map(s => starState(s.id));
    return <div class="line">
      <div class="line__head"><span class="badge">{g}</span><span class="line__from">{lineFrom(g)}</span></div>
      <div class="line__track" style={`width:calc(${list.length - 1} * var(--size-starMapTrack) + var(--sw))`}>
        {list.slice(0, -1).map((_, i) => <span class={`seg${states[i] === 'lit' && states[i + 1] === 'lit' ? '' : ' off'}`} style={`--i:${i}`} />)}
        {list.map((s, i) => <button class={`station ${states[i]}`} style={`--i:${i}`} data-act="star" data-d={s.id} aria-label={`${s.name}, ${STATE_LABEL[states[i]]}`} title={`${s.name}: ${STATE_LABEL[states[i]]}`}>
          <span class="dot"><K n={`station-${states[i]}`} cls="raw" />{states[i] === 'now' ? <span class="tag">Now</span> : null}</span>
          <span class={`station__label${/\d/.test(s.name) ? ' nums' : ''}`}>{s.name}</span>
        </button>)}
      </div>
    </div>;
  })}</>;
}

export function Home() {
  const p = P(), f = pickFocus(p), st = f ? p.skills[f].stage : 0, lit = SKILLS.filter(s => p.skills[s.id].mastered).length;
  return <>
    <header class="head">
      <button class="avatar-btn" data-act="shop" aria-label="Your badge and style"><Avatar a={p.avatar} name={p.name} /></button>
      <div class="who"><div class="name hi">{p.name}</div><div class="small">{`${lit} of ${SKILLS.length} stars lit`}</div></div>
      <GemPill />
      <div class="homeacts"><button class="btn" data-act="shop">Customize</button><button class="btn ghost hold" data-hold="1" aria-label="Grown-ups. Press and hold to open."><span class="holdlabel">Grown-ups (hold)</span><svg class="holdring" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="12" pathLength={100} /></svg></button></div>
    </header>
    <div class="homebody">
      <div class="side">
        {p.workbook && !p.workbook.checkedAt ? <section class="card next" aria-label="Workbook check">
          <span class="eyebrow">Workbook check</span>
          <h1>Check the skills for your workbook</h1>
          <p class="kid">{`A few questions on ${p.workbook.skills.length === 1 ? 'one skill' : `${p.workbook.skills.length} skills`}, with no timer and no score, so we know where to start.`}</p>
          <button class="btn primary big" data-act="beginCheck">Start the check <K n="icon-arrow-right" /></button>
        </section> : null}
        <section class="card next">
          <span class="eyebrow">{p.workbook && p.workbook.checkedAt ? (workbookReady(p) ? 'Workbook skills ready' : 'Next stop for your workbook') : 'Next stop'}</span>
          <h1 class={f && /\d/.test(SK[f].name) ? 'nums' : ''}>{f ? SK[f].name : 'Keep your stars bright'}</h1>
          {f ? <Level st={st} word={`${STAGES[st]} level`} /> : null}
          <p class="kid">{f ? SK[f].kid : 'You have lit every star. Practice now reviews them so they stay strong.'}</p>
          <button class="btn primary big" data-act="start">Start today's practice <K n="icon-arrow-right" /></button>
          <p class="small">{`${p.settings.sessionLen} questions`}</p>
        </section>
        <WeekCard />
        <section class="card quiet keycard" aria-label="Key">
          <div class="keyc">
            <span><K n="station-lit" />Lit</span><span><K n="station-now" />Now</span>
            <span><K n="station-open" />Open</span><span><K n="station-locked" />Not yet open</span>
          </div>
        </section>
      </div>
      <section class="card mapcard" aria-labelledby="chartH">
        <div class="maphead"><h2 id="chartH">Your star lines</h2><span class="small">Click a stop to see what it is.</span></div>
        <StarLines />
      </section>
    </div>
  </>;
}

// ---------- practice ----------
function TopBar() {
  const Cur = G.Cur!, S = G.S!, q = Cur.q, fbk = Cur.phase === 'feedback', pl = S.mode !== 'practice', probeName = S.mode === 'check' ? 'Workbook check' : 'Warm-up';
  return <header class="bar">
    <button class="btn" data-act="quit" aria-label="Stop for now"><K n="icon-close" /><span class="stoplabel">Stop for now</span></button>
    {pl ? <span class="chip">{probeName}</span> : <><span class={`chip${/\d/.test(SK[q.skill].name) ? ' nums' : ''}`}>{SK[q.skill].name}</span><Level st={q.stage} />{q.review ? <span class="chip quiet">Review</span> : null}</>}
    <div class="grow">{pl
      ? <div class="prog-text">{S.mode === 'check' ? `Workbook check · question ${Math.min(S.C!.asked + (fbk ? 0 : 1), CHECK_MAX)}` : `Warm-up · question ${Math.min(S.P!.asked + (fbk ? 0 : 1), 12)}`}</div>
      : <div class="qdots" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={S.n} aria-valuenow={S.i}>{Array.from({ length: S.n }, (_, i) => <i class={i < S.i ? 'done' : (i === S.i && !fbk ? 'cur' : '')} />)}</div>}
    </div>
    <GemPill />
  </header>;
}

function QuestionMain() {
  const Cur = G.Cur!, q = Cur.q;
  const input = q.kind === 'mc' ? <div class="opts">{q.options!.map((o, i) => <OptBtn o={o} i={i} act="opt" chosen={Cur.chosen} answer={q.answer} />)}</div> : q.kind === 'pad' ? <Pad /> : <Build />;
  const hint = Cur.hintShown && q.hint ? <div class="hint" role="note"><K n="icon-hint" /><div><b>Hint</b><p {...inner(q.hint.text)} />{q.hint.visual ? <div class="visual" {...inner(q.hint.visual)} /> : null}</div></div> : null;
  return <>
    <div class="qhead"><div class="prompt">{q.lead ? <p class="lead">{q.lead}</p> : null}<Raw html={q.prompt} /></div><SpeakBtn /></div>
    {q.visual ? <div class="visual" {...inner(q.visual)} /> : null}
    {input}{hint}
  </>;
}

function HelpAside() {
  const Cur = G.Cur!, q = Cur.q, pl = G.S!.mode !== 'practice', p = P();
  const tip = q.kind === 'pad' ? 'On a keyboard: type the digits, Backspace deletes, and Enter checks.' : 'On a keyboard: Tab moves between buttons, and Enter or Space presses one.';
  return <aside class="helpaside" aria-label="Help">
    <h2>Need a hand?</h2>
    {!pl && q.hint && !Cur.hintShown ? <button class="btn aside" data-act="hint"><K n="icon-hint" /> Hint</button> : null}
    {!pl && q.chart && p.settings.chart ? <button class="btn aside" data-act="chart"><K n="icon-report" /> Times chart</button> : null}
    <button class="btn aside" data-act="unsure"><K n="icon-not-sure" /> I'm not sure</button>
    <p class="small">{tip}</p>
  </aside>;
}

export function Practice() {
  const fbk = G.Cur!.phase === 'feedback';
  return <>
    <TopBar />
    {fbk
      ? <div class="cols"><section class="card" aria-label="Question"><QuestionMain /></section><Feedback /></div>
      : <section class="card q" aria-label="Question"><div class="main"><QuestionMain /></div><HelpAside /></section>}
  </>;
}

function Pad() {
  const Cur = G.Cur!, fbk = Cur.phase === 'feedback', keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  const state = fbk && G.S!.mode === 'practice' ? (Cur.ok ? 'right' : 'wrong') : '';
  return <div class="padwrap">
    <div class={`padshow${Cur.entry ? '' : ' empty'}${state ? ' ' + state : ''}`} aria-live="polite" aria-label="Your answer">
      {Cur.entry ? <>{Cur.entry}{state ? <K n={state === 'right' ? 'icon-check' : 'icon-not-yet'} /> : fbk ? null : <span class="caret" />}</> : <span class="ph">Type your answer</span>}
    </div>
    <div class="pad">{keys.map(k => <button class={`key${k === 'ok' ? ' ok' : ''}`} data-act="key" data-d={k} disabled={fbk || (k === 'ok' && !Cur.entry)} aria-label={k === 'del' ? 'Delete' : k === 'ok' ? 'Check' : k}>{k === 'del' ? <K n="icon-backspace" /> : k === 'ok' ? 'Check' : k}</button>)}</div>
  </div>;
}

const NEEDS_CHECK = ['tenframe', 'blocks', 'nlplace', 'crossout', 'groups', 'rows', 'shade'];
const Minus = () => <K n="icon-minus" />, Plus = () => <K n="icon-plus" />;

function Build() {
  const Cur = G.Cur!, q = Cur.q, bd = q.build!, b = Cur.b as BuildState, done = !!b.done || Cur.phase !== 'answer';
  let h: ComponentChildren = null;
  switch (bd.type) {
    case 'tenframe': { let s = ''; for (let f = 0; f < bd.frames; f++) s += vTF(b.cells!.slice(f * 10, f * 10 + 10), done ? null : f * 10); h = <div class="tfwrap" {...inner(s)} />; break; }
    case 'blocks': {
      const places: [string, string, string, number][] = [...(bd.hundreds ? [['h', 'Hundreds', 'hundred', 3] as [string, string, string, number]] : []), ['t', 'Tens', 'ten', 9], ['o', 'Ones', 'one', 9]];
      h = <><Raw html={vBlocks(b.h!, b.t!, b.o!)} /><div class="steppers">{places.map(([k, l, one, mx]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="blk" data-d={`${k}-`} aria-label={`Take away one ${one}`} disabled={done || v <= 0}><Minus /></button><span class="sv" aria-label={`${v} ${plural(v, one)}`} aria-live="polite">{v}</span><button class="sbtn" data-act="blk" data-d={`${k}+`} aria-label={`Add one ${one}`} disabled={done || v >= mx}><Plus /></button></div>;
      })}</div></>;
      break;
    }
    case 'nlplace':
      h = <><div class="visual" {...inner(vLine({ min: bd.min, max: bd.max, labels: bd.labels, marker: b.m ?? null, tap: !done }))} /><div class="brow"><button class="btn icon" data-act="nlnudge" data-d="-1" aria-label="Move the dot left" disabled={done}><K n="icon-left" /></button><span class="muted">{b.m === null ? 'Click the line' : 'Arrows move the dot'}</span><button class="btn icon" data-act="nlnudge" data-d="1" aria-label="Move the dot right" disabled={done}><K n="icon-right" /></button></div></>;
      break;
    case 'jumps': {
      const lo = b.lo!, hi = b.hi!, pos = b.pos!, hist = b.hist as [number, number][];
      const lab = bd.tens ? tensLabels(lo, hi) : [0, 5, 10, 15, 20].filter(v => v >= lo && v <= hi);
      h = <><div class="pospill" role="status">You're on <b>{pos}</b></div><div class="visual" {...inner(vLine({ min: lo, max: hi, labels: lab, marker: pos, jumps: hist.map(([f, t]) => ({ from: f, to: t, label: '+' + (t - f) })) }))} />
        <div class="jlog" aria-label="Jumps so far">{hist.length ? hist.map(([f, t]) => <span class="chip quiet">{`+${t - f}`}</span>) : <span class="muted">No jumps yet</span>}</div>
        <div class="brow">{bd.tens ? <button class="btn" data-act="jump" data-d="10" disabled={done || pos + 10 > hi}>+10</button> : null}<button class="btn" data-act="jump" data-d="1" disabled={done || pos + 1 > hi}>+1</button><button class="btn ghost" data-act="jundo" disabled={done || !hist.length}><K n="icon-undo" /> Undo</button></div>
        {done ? null : <button class="btn primary big" data-act="jdone">I'm there</button>}</>;
      break;
    }
    case 'crossout': {
      const x = b.x!;
      h = <><div class="items tap">{x.map((v, i) => <button class={`it-c${v ? ' x' : ''}`} data-act="cross" data-i={i} aria-pressed={pressed(v)} aria-label={`${i + 1}${v ? ', taken away' : ''}`} disabled={done} {...inner(bd.e)} />)}</div><p class="muted center">{`Taken away: ${x.filter(Boolean).length}`}</p></>;
      break;
    }
    case 'groups':
      h = <><Raw html={vPlates(b.a!, b.b!, bd.e, { box: true })} /><div class="steppers">{([['a', 'Groups'], ['b', 'In each group']] as const).map(([k, l]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="grp" data-d={`${k}-`} aria-label={`${l}: fewer`} disabled={done || v <= 1}><Minus /></button><span class="sv" aria-live="polite">{v}</span><button class="sbtn" data-act="grp" data-d={`${k}+`} aria-label={`${l}: more`} disabled={done || v >= 6}><Plus /></button></div>;
      })}</div></>;
      break;
    case 'rows': {
      const r = b.r!;
      h = <><div class="rows" role="img" aria-label={`${r} rows of ${bd.each}`}>{r ? Array.from({ length: r }, (_, i) => <div class="row"><span class="dots">{Array.from({ length: bd.each }, () => <i />)}</span><span class="sk">{(i + 1) * bd.each}</span></div>) : <p class="muted">No rows yet</p>}</div>
        <div class="brow"><button class="btn" data-act="row" data-d="+" disabled={done || r >= 10}><K n="icon-plus" />{` Add a row of ${bd.each}`}</button><button class="btn ghost" data-act="row" data-d="-" disabled={done || r <= 0}><K n="icon-minus" /> Remove a row</button></div></>;
      break;
    }
    case 'share': {
      const plates = b.plates!, left = bd.n - plates.reduce((a, c) => a + c, 0);
      h = <><div class={`sharework${plates.length > 3 ? ' many' : ''}`}>
        <div class="pool"><div role="status" aria-live="polite">{left ? <>Left to share: <b>{left}</b></> : 'All shared'}</div><div class="items">{Array.from({ length: left }, () => <span class="it-c" {...inner(bd.e)} />)}</div></div>
        <span class="arrow" aria-hidden="true"><K n="icon-arrow-right" /></span>
        <div class="plates">{plates.map((c, i) => <div class="pgrp"><button class="plate tap" data-act="plate" data-i={i} aria-label={`Plate ${i + 1}, has ${c}`} disabled={done || left === 0}>{Array.from({ length: c }, () => <span class="it" {...inner(bd.e)} />)}</button><div class="plabel">{`Plate ${i + 1}`}</div></div>)}</div>
      </div>
        <div class="brow"><button class="btn" data-act="sundo" disabled={done || !(b.hist as number[]).length}><K n="icon-undo" /> Undo</button></div></>;
      break;
    }
    case 'makegroups': {
      const g = b.g!, left = bd.n - g * bd.k;
      h = <><div class="pool"><div role="status" aria-live="polite">{left ? <>Left: <b>{left}</b></> : 'None left'}</div><div class="items">{Array.from({ length: left }, () => <span class="it-c" {...inner(bd.e)} />)}</div></div>
        <button class="btn primary big" data-act="mkgrp" disabled={done || left < bd.k}>{`Make a group of ${bd.k}`}</button>{g ? <Raw html={vPlates(g, bd.k, bd.e, { box: true, label: 'Group' })} /> : null}</>;
      break;
    }
    case 'shade':
      h = <><div class="visual" {...inner(vFracBar(bd.n, 0, { shaded: b.s!, tap: !done }))} /><p class="muted center">{`Shaded: ${b.s!.filter(Boolean).length}`}</p></>;
      break;
  }
  return <div class={`build b-${bd.type}`}>
    {h}
    {b.msg && !done ? <p class="nudge" role="status">{b.msg}</p> : null}
    {!done && NEEDS_CHECK.includes(bd.type) ? <button class="btn primary big" data-act="bcheck">Check</button> : null}
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

const FbGain = ({ n, trying }: { n: number; trying?: boolean }) => <span class="fb-gain" aria-label={`plus ${n} ${plural(n, 'gem')}${trying ? ' for trying' : ''}`}>{`+${n}`}<Gem /></span>;

/** Feedback card (design/COMPONENTS.md §12). Order in the not-yet card follows F-6.AC-1. */
function Feedback() {
  const Cur = G.Cur!, q = Cur.q;
  if (G.S!.mode !== 'practice') return <section class={`fb${Cur.ok ? ' good' : ' unsure'}`} id="fb">
    <div class="fb-head"><span class="fb-icon"><K n={Cur.ok ? 'icon-check' : 'icon-info'} /></span><h2 class="fb-title" role="status">{Cur.ok ? "That's right." : G.S!.mode === 'check' ? 'Thanks. That helps us know where to start.' : 'Thanks. That helps find your starting point.'}</h2></div>
    <button class="btn primary" data-act="next">Next <K n="icon-arrow-right" /></button></section>;
  if (Cur.ok) return <section class="fb good" id="fb">
    <div class="fb-head"><span class="fb-icon"><K n="icon-check" /></span><h2 class="fb-title" role="status">{pick(OK_LINES) + (Cur.hinted ? ' (with a hint)' : '')}</h2><FbGain n={Cur.gain!} /></div>
    <button class="btn primary" data-act="next">Next <K n="icon-arrow-right" /></button></section>;
  const mt = Cur.mis && MIS[Cur.mis] ? MIS[Cur.mis].kid : null, at = answerText(), unsure = !!Cur.unsure;
  return <section class={`fb ${unsure ? 'unsure' : 'warm'}`} id="fb">
    <div class="fb-head"><span class="fb-icon"><K n={unsure ? 'icon-info' : 'icon-not-yet'} /></span><h2 class="fb-title" role="status">{unsure ? "Good call asking. Here's how to see it." : "Not yet. Let's look at it another way."}</h2><FbGain n={Cur.gain!} trying /></div>
    {mt ? <p class="fb-pattern">{mt}</p> : null}
    <p class="fb-text" {...inner(q.explain.text)} />
    {q.explain.visual ? <figure class="fb-figure"><div class="visual" {...inner(q.explain.visual)} /></figure> : null}
    {at ? <p class="fb-text ans">The answer is <b {...inner(at)} />.</p> : null}
    <button class="btn primary" data-act="next">Got it, next <K n="icon-arrow-right" /></button></section>;
}

/** After the workbook check (F-22.AC-5): what is solid, what to build, where she starts. */
export function Checked() {
  const p = P(), r = p.workbook ? p.workbook.results : {}, f = pickFocus(p);
  const solid = Object.keys(r).filter(id => r[id] === 'pass'), build = Object.keys(r).filter(id => r[id] === 'fail');
  const names = (ids: string[]) => ids.map(id => <li><K n={r[id] === 'pass' ? 'station-lit' : 'station-open'} /><span class={/\d/.test(SK[id].name) ? 'nums' : ''}>{SK[id].name}</span></li>);
  return <section class="card"><p class="eyebrow">Workbook check done</p><h1>{`Thanks, ${p.name}.`}</h1>
    {solid.length ? <><h2>Already solid</h2><ul class="wins">{names(solid)}</ul></> : null}
    {build.length ? <><h2>Let's build these up</h2><ul class="wins">{names(build)}</ul></> : null}
    <p>{f ? <>You're starting with <b>{SK[f].name}</b>. Each step makes your workbook page easier.</> : 'Every skill for your workbook is lit. Practice keeps them strong.'}</p>
    <button class="btn primary big" data-act="home">See my star lines</button></section>;
}

/** Grown-up view, Workbook tab (F-22.AC-1, AC-2, AC-6). */
function WorkbookTab() {
  const p = P(), wb = G.UI.tmp.wb, goal = p.workbook;
  if (wb && wb.step === 'reading') return <section class="card"><h2>Reading the page…</h2><p class="muted">This can take up to a minute. Claude is only working out which skills the page needs.</p></section>;
  if (wb && wb.step === 'confirm') {
    const path = goalPath(wb.picks);
    return <section class="card"><h2>Which skills does the page need?</h2>
      {wb.topic ? <p>{'This page looks like: '}<b>{wb.topic}</b></p> : null}
      <p class="muted">{wb.topic ? 'Check the list. Add or remove skills, then confirm. Nothing changes until you do.' : 'Pick the skills the workbook page uses. The check adds what they depend on.'}</p>
      {GROUPS.map(g => <fieldset><legend>{g}</legend><div class="row">{SKILLS.filter(s => s.group === g).map(s => <button class={`btn${wb.picks.includes(s.id) ? ' picked' : ''}`} data-act="wbToggle" data-d={s.id} aria-pressed={pressed(wb.picks.includes(s.id))}>{wb.picks.includes(s.id) ? <K n="icon-check" /> : null}<span class={/\d/.test(s.name) ? 'nums' : ''}>{s.name}</span></button>)}</div></fieldset>)}
      {wb.picks.length ? <p class="small">{`The check covers these and steps back through what they depend on if needed: ${path.size} ${plural(path.size, 'skill')} in all.`}</p> : null}
      {wb.beyond && wb.beyond.length ? <div class="hint" role="note"><K n="icon-info" /><div><b>Also needed, not in the app yet</b><ul class="how">{wb.beyond.map(t => <li>{t}</li>)}</ul></div></div> : null}
      <div class="row"><button class="btn primary" data-act="wbConfirm" disabled={!wb.picks.length}>Confirm and set up the check</button><button class="btn" data-act="wbCancel">Cancel</button></div>
    </section>;
  }
  return <>
    {goal ? <section class="card"><h2>Current workbook goal</h2>
      <p class="muted">{`Set ${rel(goal.at)}. ${goal.checkedAt ? `Check done ${rel(goal.checkedAt)}.` : 'Check not done yet: she starts it from the home screen.'}`}</p>
      <ul class="learners">{goal.skills.map(id => <li><K n={`station-${starState(id)}`} /><span class="lname">{SK[id].name}</span>{goal.results[id] ? <span class="chip quiet">{goal.results[id] === 'pass' ? 'Passed the check' : 'Building up'}</span> : null}</li>)}</ul>
      <div class="row"><button class="btn" data-act="beginCheck">{goal.checkedAt ? 'Run the check again' : 'Start the check now'}</button><button class="btn ghost" data-act="wbClear">Clear this goal</button></div>
    </section> : null}
    <section class="card"><h2>{goal ? 'Check a new workbook page' : 'Check a workbook page'}</h2>
      <p>Take a photo of the page she's working on. Claude reads which skills it needs, you confirm, then she does a short check. Practice steps back to anything she's missing, then climbs toward the page.</p>
      <p class="small">The photo is read once and not kept. Only the skills you confirm are saved. Claude doesn't write questions or answers.</p>
      {wb && wb.err ? <p class="nudge" role="status">{wb.err}</p> : null}
      <div class="row">
        {G.photos ? <label class="btn primary" for="wbPhoto"><K n="icon-plus" /> Take or choose a photo<input id="wbPhoto" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" class="vh" /></label> : null}
        <button class={`btn${G.photos ? '' : ' primary'}`} data-act="wbManual">Choose the skills myself</button>
      </div>
      {G.photos === false ? <p class="small">Reading photos works when the app is opened in Claude.</p> : null}
    </section>
  </>;
}

export function Summary() {
  const S = G.S!, p = P(), ev = S.events, wins: ComponentChildren[] = [];
  ev.forEach(e => {
    if (e.type === 'mastered') wins.push(<li><K n="station-lit" />{`Lit a star: ${SK[e.skill].name}`}</li>);
    else if (e.type === 'up') wins.push(<li><K n="badge-level-up" />{`${SK[e.skill].name}: up to ${STAGE_WITH[e.stage]}`}</li>);
  });
  const ups = ev.filter(e => e.type === 'up' || e.type === 'mastered').length;
  return <section class="card"><p class="eyebrow">{S.early ? 'Stopped for now' : 'Practice done'}</p><h1>{`Nice work, ${p.name}.`}</h1>
    <div class="stats"><div><b>{S.answered}</b><span>{plural(S.answered, 'question')}</span></div><div><b>{`+${S.gems}`}</b><span>gems</span></div><div><b>{ups}</b><span>{plural(ups, 'level-up')}</span></div></div>
    {wins.length ? <ul class="wins">{wins}</ul> : <p class="muted">Every answer moves you closer to the next level.</p>}
    <WeekCard />
    <div class="row"><button class="btn primary big" data-act="more">5 more questions</button><button class="btn" data-act="home">Back to my star lines</button></div></section>;
}

/** Customize (design/SCREENS.md §11): Badge and Colour tabs. Story themes come with F-11. */
export function Shop() {
  const p = P(), tab = G.UI.tmp.stab || 'badge';
  const meta = (use: boolean, own: boolean, price: number) => use ? <><K n="icon-check" />Using</> : own ? 'Yours' : p.gems >= price ? <><Gem />{String(price)}</> : <><Gem />{`${price} · ${price - p.gems} more to go`}</>;
  return <>
    <header class="head"><button class="btn icon" data-act="home" aria-label="Back"><K n="icon-left" /></button><div class="who"><div class="name">Customize</div><div class="small">Spend gems on badges and colours</div></div><GemPill /></header>
    <div class="segc" role="group" aria-label="Customize">{[['badge', 'Badge'], ['colour', 'Colour']].map(([k, l]) => <button data-act="stab" data-d={k} aria-pressed={pressed(tab === k)}>{l}</button>)}</div>
    {tab === 'badge'
      ? <section class="card"><h2>Badges</h2><div class="tiles">{AVATARS.map(a => {
        const own = p.owned.avatars.includes(a.id) || a.price === 0, use = p.avatar === a.id;
        return <button class={`tile${use ? ' on' : ''}${!own && p.gems < a.price ? ' short' : ''}`} data-act="buyAv" data-d={a.id} aria-label={`Badge ${a.name}${use ? ', in use' : own ? ', yours' : `, costs ${a.price} gems`}`}><span class="tile__art"><Avatar a={a.id} name={p.name} /></span><span class="tile__name">{a.name}</span><span class="tile__meta">{meta(use, own, a.price)}</span></button>;
      })}</div></section>
      : <section class="card"><h2>Colours</h2><div class="tiles">{Object.entries(THEMES).map(([k, t]) => {
        const own = p.owned.themes.includes(k) || t.priceGems === 0, use = p.theme === k, c = isDark() ? t.dark.accent : t.light.accent;
        return <button class={`tile${use ? ' on' : ''}${!own && p.gems < t.priceGems ? ' short' : ''}`} data-act="buyTheme" data-d={k} aria-label={`${t.name}${use ? ', in use' : own ? ', yours' : `, costs ${t.priceGems} gems`}`}><span class="tile__art"><span class="swatch" style={`background:${c}`} /></span><span class="tile__name">{t.name}</span><span class="tile__meta">{meta(use, own, t.priceGems)}</span></button>;
      })}</div></section>}
    <p class="small center">You earn gems for every answer, level-up and finished practice.</p>
  </>;
}

// ---------- grown-ups ----------
function SkillRow({ s }: { s: Skill }) {
  const p = P(), st = p.skills[s.id], isF = frontier(p).some(x => x.id === s.id); let chip, pct: number, lab: string;
  if (st.mastered) { chip = <span class="chip good">Mastered</span>; pct = Math.round(st.pL[2] * 100); lab = `Confidence ${pct}%`; }
  else if (isF) { chip = <Level st={st.stage} />; pct = Math.round(st.pL[st.stage] * 100); lab = `${pct}% estimated at this level`; }
  else { chip = <span class="chip quiet">Locked</span>; pct = 0; lab = `Unlocks after ${s.pre.map(id => SK[id].name).join(' and ')}`; }
  const att = st.att.reduce((a, b) => a + b, 0), cor = st.cor.reduce((a, b) => a + b, 0);
  return <li class="sr"><b>{s.name}</b>{chip}<span class="est" role="img" aria-label={`Estimate ${pct}%. Moves down below 40%, up from 90%.`}><i style={`width:${pct}%`} /><b style="left:40%" /><b style="left:90%" /></span><span class="pct">{`${pct}%`}</span>
    <span class="sr-meta">{lab + (att ? ` · ${att} ${plural(att, 'answer')}, ${Math.round(cor / att * 100)}% right · last ${rel(st.lastSeen)}` : '')}. {s.about}</span></li>;
}
function Seg({ k, label, opts }: { k: string; label: string; opts: [string | number | boolean, string][] }) {
  return <div class="set"><span class="set-l" id={`set-${k}`}>{label}</span><div class="segc" role="group" aria-labelledby={`set-${k}`}>{opts.map(([v, t]) => <button data-act="set" data-k={k} data-v={String(v)} aria-pressed={pressed(String(P().settings[k]) === String(v))}>{t}</button>)}</div></div>;
}
const GTABS: [string, string][] = [['progress', 'Progress'], ['workbook', 'Workbook'], ['patterns', 'Patterns'], ['sessions', 'Sessions'], ['settings', 'Settings'], ['data', 'Data']];

export function Grown() {
  const p = P(), UI = G.UI, tab = UI.tmp.gtab || 'progress', wk = Date.now() - 7 * 864e5, rec = p.log.filter(l => l.t >= wk && !l.p), acc = rec.length ? Math.round(rec.filter(l => l.ok).length / rec.length * 100) : null;
  const wkKey = dayKey(new Date(wk)), days = p.days.filter(d => d > wkKey).length, lit = SKILLS.filter(s => p.skills[s.id].mastered).length, f = pickFocus(p);
  const misList = Object.entries(p.mis).filter(([k]) => MIS[k]).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  const sess = p.sessions.slice(-8).reverse();
  let body: ComponentChildren;
  if (tab === 'progress') body = <>
    <section class="card"><h2>At a glance</h2>
      <div class="glance"><div><b>{`${lit}/${SKILLS.length}`}</b><span>skills mastered</span></div><div><b>{rec.length}</b><span>questions in 7 days</span></div><div><b>{acc === null ? '–' : acc + '%'}</b><span>right in 7 days</span></div><div><b>{days}</b><span>days practised in 7</span></div></div>
      <p>{f ? <>Working on <b>{SK[f].name}</b> at the <b>{STAGES[p.skills[f].stage].toLowerCase()}</b> level.</> : 'All skills mastered. Practice is review only.'}</p></section>
    <section class="card"><h2>Skills</h2>{GROUPS.map(g => <><h3>{g}</h3><ul class="skl">{SKILLS.filter(s => s.group === g).map(s => <SkillRow s={s} />)}</ul></>)}</section>
    <section class="card quiet"><h2>How it decides what comes next</h2><ul class="how">
      <li>Each skill has three levels: <b>hands-on</b> (she builds it), <b>pictures</b> (she reads a picture), and <b>numbers</b> (symbols only).</li>
      <li>After every answer the app updates its estimate of how likely she is to know that skill at that level (Bayesian Knowledge Tracing). Past 90%, with her last three answers right and no hints, she moves up a level.</li>
      <li>If 2 of her last 3 answers are wrong and the estimate drops below 40%, she moves down a level. If she's struggling even hands-on, it goes back to the earlier skill this one depends on.</li>
      <li>Every fourth question reviews a skill she has already mastered. Two misses in review reopen that skill.</li>
      <li>No timers. Hints and "I'm not sure" are always there; they slow progress a little but never cost gems.</li>
    </ul></section></>;
  else if (tab === 'workbook') body = <WorkbookTab />;
  else if (tab === 'patterns') body = <section class="card"><h2>Patterns noticed</h2>
    {misList.length
      ? <><ul class="mis">{misList.map(([k, v]) => <li data-pattern={k}><div class="mis-top"><b>{MIS[k].parent}</b><span class="chip quiet">{`Seen ${v.count} ${plural(v.count, 'time')}`}</span></div><p class="small">{`Last seen ${rel(v.last)}`}</p><dl><dt>What she sees</dt><dd>{MIS[k].kid}</dd><dt>Try at home</dt><dd>{MIS[k].act}</dd></dl></li>)}</ul><p class="small">Worth sharing with her teacher or tutor.</p></>
      : <p class="muted">Nothing yet. When a wrong answer matches a common pattern, such as subtracting on a division question, it shows up here with an activity to try at home.</p>}</section>;
  else if (tab === 'sessions') body = <section class="card"><h2>Recent sessions</h2>{sess.length ? <ul class="sess">{sess.map(s => <li><span>{new Date(s.d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + (s.m === 'placement' ? ' · warm-up' : s.m === 'check' ? ' · workbook check' : '')}</span><span class="muted">{`${s.n} ${plural(s.n, 'question')}, ${s.c} right, ${s.min} min`}</span></li>)}</ul> : <p class="muted">No sessions yet.</p>}</section>;
  else if (tab === 'settings') body = <section class="card"><h2>Settings</h2>
    <Seg k="sessionLen" label="Questions per session" opts={[[5, '5'], [10, '10'], [15, '15']]} />
    <Seg k="sound" label="Sounds" opts={[[true, 'On'], [false, 'Off']]} />
    <Seg k="autoRead" label="Read each question aloud" opts={[[false, 'Off'], [true, 'On']]} />
    <Seg k="chart" label="Times-table chart on facts" opts={[[true, 'Allowed'], [false, 'Hidden']]} />
    {canSpeak() ? null : <p class="small">Read-aloud isn't available in this browser.</p>}</section>;
  else body = <section class="card"><h2>Learners and data</h2>
    <p>{G.store.mode === 'account' ? 'Progress is saved to the Claude account that opened this page, and in this browser.' : 'Progress is saved in this browser only. Copy a backup code to move it to another device.'}</p>
    <div class="row"><button class="btn" data-act="copyBackup"><K n="icon-copy" /> Copy backup code</button></div>
    {UI.tmp.code ? <><label for="codeOut" class="small">Backup code (select all and copy)</label><textarea readOnly class="code" id="codeOut" value={UI.tmp.code} /></> : null}
    <form id="restoreForm" class="form"><label for="restoreText">Restore from a backup code</label><textarea id="restoreText" class="code" rows={3} /><button class="btn" type="submit">Restore</button></form>
    <h3>Learners</h3><ul class="learners">{Object.values(app().profiles).map(x => <li><Avatar a={x.avatar} name={x.name} sm /><span class="lname">{x.name}</span>{x.id === p.id ? <span class="chip quiet">Current</span> : <button class="btn" data-act="switchTo" data-d={x.id}>Switch</button>}</li>)}</ul>
    <button class="btn" data-act="addLearner"><K n="icon-plus" /> Add a learner</button>
    <div class="row"><button class="btn ghost" data-act="redo">Redo the warm-up</button><button class="btn ghost" data-act="reset">{`Reset ${p.name}'s progress`}</button></div>
  </section>;
  return <>
    <header class="head"><button class="btn icon" data-act="back" aria-label="Back to the star lines"><K n="icon-left" /></button><div class="who"><div class="name">{`Grown-up view · ${p.name}`}</div></div></header>
    <div class="segc" role="group" aria-label="Grown-up view sections">{GTABS.map(([k, l]) => <button data-act="gtab" data-d={k} aria-pressed={pressed(tab === k)}>{l}</button>)}</div>
    {body}
  </>;
}

// ---------- dialogs ----------
export function Modal() {
  const m = G.UI.modal; if (!m) return null; let body: ComponentChildren = null;
  const dialog = (children: ComponentChildren, cls = '') => <section class={`modal${cls}`} role="dialog" aria-modal="true" aria-labelledby="mt">{children}</section>;
  if (m.type === 'event') {
    const e = m.ev, s = SK[e.skill]; let badge: string, title: string, text: string;
    if (e.type === 'mastered') { badge = 'badge-star-lit'; title = 'A new star is lit!'; text = `You've mastered ${s.name}.`; }
    else if (e.type === 'up') { badge = 'badge-level-up'; title = 'Level up!'; text = `You're ready for ${s.name} with ${STAGE_WITH[e.stage]}.`; }
    else if (e.type === 'down') { badge = 'badge-switch-level'; title = "Let's switch it up"; text = `Let's try ${s.name} with ${STAGE_WITH[e.stage]} for a bit. It makes it easier to see what's going on. You'll move back up soon.`; }
    else if (e.type === 'prereq') { badge = 'badge-switch-level'; title = 'Quick warm-up'; text = `Let's practise ${SK[e.to].name} for a bit. It will make ${s.name} easier.`; }
    else { badge = 'badge-switch-level'; title = 'Quick refresh'; text = `Let's brush up on ${s.name} for a few questions.`; }
    body = dialog(<><K n={badge} cls="badgeart" /><h2 id="mt">{title}</h2><p class="mbody">{text}</p><button class="btn primary" data-act="eventOk" data-focus="1">Keep going</button></>);
  } else if (m.type === 'confirm') {
    body = dialog(<><h2 id="mt">{m.title}</h2><p class="mbody">{m.text}</p><div class="row"><button class="btn" data-act="closeModal" data-focus="1">Cancel</button><button class="btn primary" data-act={m.act}>{m.yes}</button></div></>);
  } else if (m.type === 'star') {
    const s = SK[m.id], st = P().skills[m.id], state = starState(m.id);
    const status = state === 'lit' ? 'Lit. It comes back in review now and then.' : state === 'now' ? `Practising now at the ${STAGES[st.stage].toLowerCase()} level.` : state === 'open' ? 'Open. Ready to start.' : `Opens after ${s.pre.map(id => SK[id].name).join(' and ')}.`;
    body = dialog(<><K n={`station-${state}`} cls="badgeart" /><h2 id="mt" class={/\d/.test(s.name) ? 'nums' : ''}>{s.name}</h2>{state === 'locked' ? null : <Level st={st.mastered ? 2 : st.stage} />}<p class="mbody">{s.kid}</p><p class="mbody muted">{status}</p>{state === 'open' ? <button class="btn primary" data-act="focusSkill" data-d={m.id}>Practise this</button> : null}<button class="btn" data-act="closeModal" data-focus="1">Close</button></>);
  } else if (m.type === 'chart') {
    const hi = m.hi || [0, 0], rows: ComponentChildren[] = [];
    for (let r = 1; r <= 10; r++) {
      const cells: ComponentChildren[] = [];
      for (let c = 1; c <= 10; c++) { const cls = (r === hi[0] && c === hi[1]) ? 'hx' : (r === hi[0] || c === hi[1]) ? 'hl' : ''; cells.push(<td class={cls} data-act="chartcell" data-i={r} data-d={c}>{r * c}</td>); }
      rows.push(<tr><th scope="row">{r}</th>{cells}</tr>);
    }
    body = dialog(<><h2 id="mt">Times chart</h2><p class="mbody small">Click a number to light up its row and column. Using the chart counts like a hint.</p><div class="chartwrap"><table class="chartgrid"><thead><tr><th scope="col">×</th>{Array.from({ length: 10 }, (_, i) => <th scope="col">{i + 1}</th>)}</tr></thead><tbody>{rows}</tbody></table></div><button class="btn primary" data-act="closeModal" data-focus="1">Back to the question</button></>, ' wide');
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
    case 'checked': return <Checked />;
    case 'summary': return <Summary />;
    case 'shop': return <Shop />;
    case 'grown': return <Grown />;
    default: return <Home />;
  }
}
