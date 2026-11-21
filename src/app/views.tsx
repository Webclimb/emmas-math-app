// Screens, direction B "Star Lines" (design/SCREENS.md, design/COMPONENTS.md), in Québec French (D-21).
// Interaction is by data-act attributes handled in one delegated listener (flow.ts), so engine-made SVG
// (ten-frame cells, number lines, fraction bars) stays interactive.
import type { ComponentChildren } from 'preact';
import { THEMES } from '../design/tokens';
import { kit } from '../design/kit';
import { fmtM, parseM } from '../engine/decimal';
import { frontier, pickFocus } from '../engine/model';
import { MIS } from '../engine/misconceptions';
import { pick } from '../engine/rng';
import { GROUPS, SK, SKILLS, STAGES, STAGE_WITH } from '../engine/skills';
import type { Build as BuildT, Option, Skill } from '../engine/types';
import { PV_COLS, plural, tensLabels, vBlocks, vFracBar, vLine, vPV, vPlates, vTF } from '../engine/visuals';
import { CHECK_MAX, goalPath, workbookReady } from '../engine/workbook';
import { AVATARS, OK_LINES, STATE_LABEL } from './data';
import { canSpeak, isDark } from './effects';
import { commaAllowed, currentStep } from './flow';
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
/** A canonical answer ("1057,34") as she reads it ("1057,34", "48 297"). */
export const showAnswer = (s: string) => { const m = parseM(s); return m === null ? s : fmtM(m); };
const hasDigit = (s: string) => /\d/.test(s);

const initial = (name: string) => (name.trim()[0] || '').toUpperCase();
/** Badge (design/COMPONENTS.md §2): a frame holding her initial, or an emblem. */
export function Avatar({ a, name, sm }: { a: string; name: string; sm?: boolean }) {
  const [kind, style] = a.split(':');
  const art = kind === 'emblem' ? kit(`avatar-emblem-${style}`) : kit(`avatar-frame-${style || 'square'}`);
  return <span class={`avatar${style === 'roundel' ? ' roundel' : ''}${sm ? ' sm' : ''}`} aria-hidden="true"><span class="raw" {...inner(art)} />{kind === 'emblem' ? null : <span>{initial(name)}</span>}</span>;
}

const GemPill = () => <span class="gems" aria-label={`${P().gems} ${plural(P().gems, 'gemme')}`}><Gem /><b>{String(P().gems)}</b></span>;
const Level = ({ st, word = STAGES[st] }: { st: number; word?: string }) => <span class="level" aria-label={`Niveau : ${STAGES[st]}`}>{[0, 1, 2].map(i => <i class={i <= st ? 'on' : ''} />)}<span>{word}</span></span>;
const Brand = () => <div class="brand"><K n="badge-star-lit" /><h1>Number Sky</h1></div>;
const SpeakBtn = ({ act = 'speak' }: { act?: string }) => canSpeak() ? <button class="btn icon" data-act={act} aria-label="Lis-le-moi"><K n="icon-read-aloud" /></button> : null;

function WeekCard() {
  const out: ComponentChildren[] = []; const t = new Date(); let n = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i), k = dayKey(d), on = P().days.includes(k); if (on) n++;
    out.push(<span class={`wd${on ? ' on' : ''}${i === 0 ? ' today' : ''}`}><i>{on ? <K n="icon-check" /> : null}</i>{'DLMMJVS'[d.getDay()]}</span>);
  }
  return <section class="card quiet stack" aria-label="Cette semaine">
    <div class="maphead"><h2>Cette semaine</h2><b>{`${n} ${plural(n, 'jour')} sur 7`}</b></div>
    <div class="week" role="img" aria-label={`Pratique ${n} ${plural(n, 'jour')} sur les 7 derniers`}>{out}</div>
  </section>;
}

function optClass(o: Option): string { const t = String(o.label).replace(/<[^>]+>/g, '').trim(); return /[a-zà-ÿ]{3,}/i.test(t) ? ' txt' : t.length > 7 ? ' mid' : ''; }
function OptBtn({ o, i, act, chosen, answer }: { o: Option; i: number; act: string; chosen: number | null; answer: string | number | undefined }) {
  const fbk = G.Cur!.phase === 'feedback'; let cls = 'opt' + optClass(o), mark = '', label = '';
  if (fbk) {
    const right = String(o.value) === String(answer);
    if (G.S!.mode === 'practice') {
      if (right) { cls += ' right'; mark = kit('icon-check', 'st'); label = ', bonne réponse'; }
      else if (i === chosen) { cls += ' wrong'; mark = kit('icon-not-yet', 'st'); label = ', ta réponse, pas encore'; }
      else cls += ' dim';
    } else if (i === chosen) cls += ' sel'; else cls += ' dim';
  }
  const text = String(o.label).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
  return <button class={cls} data-act={act} data-i={i} disabled={fbk} aria-label={label ? text + label : undefined} {...inner(o.label + mark)} />;
}

// ---------- screens ----------
export const Boot = () => <div class="boot"><K n="badge-star-lit" /><p class="muted">On prépare tes étoiles…</p></div>;

export function Welcome() {
  const UI = G.UI, av = UI.tmp.av || AVATARS[0].id;
  return <section class="card">
    <Brand />
    <p>Allume une étoile pour chaque habileté en maths que tu maîtrises.</p>
    <p class="muted">De courtes pratiques, sans chronomètre. L’appli trouve ton niveau et s’ajuste pendant que tu apprends.</p>
    <form id="newp" class="form" autocomplete="off">
      {/* F-1.AC-2: ask for a nickname, not a name (design/SCREENS.md §11, in French). */}
      <label for="pname">Comment veut-on t’appeler?<span class="help muted small">Un surnom, c’est parfait. On n’a pas besoin de ton vrai nom.</span></label>
      <input id="pname" name="pname" maxLength={20} required value={UI.tmp.name || ''} />
      <fieldset><legend>Choisis un badge</legend>
        <div class="tiles sm">{AVATARS.filter(a => a.price === 0).map(a => <button type="button" class={`tile av${a.id === av ? ' on' : ''}`} data-act="pickAv" data-d={a.id} aria-pressed={pressed(a.id === av)} aria-label={`Badge : ${a.name}`}><span class="tile__art"><Avatar a={a.id} name={UI.tmp.name || ''} /></span><span class="tile__name">{a.name}</span></button>)}</div>
        <p class="small">Tu pourras obtenir d’autres badges avec des gemmes.</p>
      </fieldset>
      <button class="btn primary big" type="submit">Commencer</button>
      {UI.tmp.adding ? <button type="button" class="btn" data-act="back">Annuler</button> : null}
    </form>
  </section>;
}

export const Profiles = () => <section class="card"><Brand /><h2>Qui pratique?</h2>
  <ul class="learners">{Object.values(app().profiles).map(p => <li><Avatar a={p.avatar} name={p.name} sm /><span class="lname">{p.name}</span><button class="btn" data-act="switchTo" data-d={p.id}>Commencer</button></li>)}</ul>
  <button class="btn ghost" data-act="addLearner">Ajouter un élève</button></section>;

export const PlaceIntro = () => <section class="card">
  <header class="head"><Avatar a={P().avatar} name={P().name} /><div class="who"><div class="name hi">{`Bonjour, ${P().name}`}</div></div></header>
  <h1>D’abord, un petit échauffement</h1>
  <p>Quelques questions de ton niveau de 6e année, sans chronomètre et sans pointage. Si une question est difficile, on revient à ce qui vient avant, une étape à la fois.</p>
  <p>Si tu ne sais pas, clique sur <b>Je ne sais pas</b>. Ça nous aide aussi.</p>
  <button class="btn primary big" data-act="beginPlace">Commencer l’échauffement</button>
  <button class="btn" data-act="skipPlace">Passer et commencer au tout début</button>
</section>;

export function Placed() {
  const p = P(), f = p.focus, lit = SKILLS.filter(s => p.skills[s.id].mastered);
  return <section class="card">
    <p class="eyebrow">Échauffement terminé</p><h1>{f ? `Tu commences avec ${SK[f].name}` : 'Toutes les étoiles sont déjà allumées'}</h1>
    {lit.length
      ? <p>{`${lit.length} ${plural(lit.length, 'étoile est déjà allumée', 'étoiles sont déjà allumées')}, parce que tu as montré que tu sais. Elles reviendront de temps en temps pour rester brillantes.`}</p>
      : <p>On commence au début et on avance vite dans ce qui est facile.</p>}
    <p class="muted">Chaque habileté a trois niveaux : avec le matériel, avec des images, puis seulement avec des nombres.</p>
    <button class="btn primary big" data-act="home">Voir mes lignes d’étoiles</button></section>;
}

export function starState(id: string): 'lit' | 'now' | 'open' | 'locked' {
  const p = P(), st = p.skills[id];
  if (st.mastered) return 'lit'; if (id === p.focus) return 'now';
  return frontier(p).some(s => s.id === id) ? 'open' : 'locked';
}
/** "Départ ici" / "Après …" for a line: the first station's prerequisites outside the line. */
function lineFrom(g: string): string {
  const first = SKILLS.find(s => s.group === g)!, ext = first.pre.filter(id => SK[id].group !== g);
  if (!ext.length) return 'Départ ici';
  const groups = [...new Set(ext.map(id => SK[id].group))];
  const names = ext.length >= 3 && groups.length === 1 ? groups : ext.map(id => SK[id].name);
  return 'Après ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' et ' + names.at(-1) : names[0]);
}
function StarLines() {
  return <>{GROUPS.map(g => {
    const list = SKILLS.filter(s => s.group === g), states = list.map(s => starState(s.id));
    return <div class="line">
      <div class="line__head"><span class="badge">{g}</span><span class="line__from">{lineFrom(g)}</span></div>
      <div class="line__track" style={`width:calc(${list.length - 1} * var(--size-starMapTrack) + var(--sw))`}>
        {list.slice(0, -1).map((_, i) => <span class={`seg${states[i] === 'lit' && states[i + 1] === 'lit' ? '' : ' off'}`} style={`--i:${i}`} />)}
        {list.map((s, i) => <button class={`station ${states[i]}`} style={`--i:${i}`} data-act="star" data-d={s.id} aria-label={`${s.name}, ${STATE_LABEL[states[i]]}`} title={`${s.name} : ${STATE_LABEL[states[i]]}`}>
          <span class="dot"><K n={`station-${states[i]}`} cls="raw" />{states[i] === 'now' ? <span class="tag">Maintenant</span> : null}</span>
          <span class={`station__label${hasDigit(s.name) ? ' nums' : ''}`}>{s.name}</span>
        </button>)}
      </div>
    </div>;
  })}</>;
}

export function Home() {
  const p = P(), f = pickFocus(p), st = f ? p.skills[f].stage : 0, lit = SKILLS.filter(s => p.skills[s.id].mastered).length;
  return <>
    <header class="head">
      <button class="avatar-btn" data-act="shop" aria-label="Ton badge et tes couleurs"><Avatar a={p.avatar} name={p.name} /></button>
      <div class="who"><div class="name hi">{p.name}</div><div class="small">{`${lit} ${plural(lit, 'étoile allumée', 'étoiles allumées')} sur ${SKILLS.length}`}</div></div>
      <GemPill />
      <div class="homeacts"><button class="btn" data-act="shop">Personnaliser</button><button class="btn ghost hold" data-hold="1" aria-label="Espace parent. Garder appuyé pour ouvrir."><span class="holdlabel">Espace parent (garder appuyé)</span><svg class="holdring" aria-hidden="true"><rect x="0" y="0" width="100%" height="100%" rx="12" pathLength={100} /></svg></button></div>
    </header>
    <div class="homebody">
      <div class="side">
        {p.workbook && !p.workbook.checkedAt ? <section class="card next" aria-label="Vérification du cahier">
          <span class="eyebrow">Vérification du cahier</span>
          <h1>Vérifions les habiletés de ton cahier</h1>
          <p class="kid">{`Quelques questions sur ${p.workbook.skills.length === 1 ? 'une habileté' : `${p.workbook.skills.length} habiletés`}, sans chronomètre ni pointage, pour savoir par où commencer.`}</p>
          <button class="btn primary big" data-act="beginCheck">Commencer la vérification <K n="icon-arrow-right" /></button>
        </section> : null}
        <section class="card next">
          <span class="eyebrow">{p.workbook && p.workbook.checkedAt ? (workbookReady(p) ? 'Habiletés du cahier prêtes' : 'Prochain arrêt pour ton cahier') : 'Prochain arrêt'}</span>
          <h1 class={f && hasDigit(SK[f].name) ? 'nums' : ''}>{f ? SK[f].name : 'Garde tes étoiles brillantes'}</h1>
          {f ? <Level st={st} word={`Niveau ${STAGES[st]}`} /> : null}
          <p class="kid">{f ? SK[f].kid : 'Tu as allumé toutes les étoiles. La pratique les révise pour qu’elles restent fortes.'}</p>
          <button class="btn primary big" data-act="start">Commencer la pratique <K n="icon-arrow-right" /></button>
          <p class="small">{`${p.settings.sessionLen} questions`}</p>
        </section>
        <WeekCard />
        <section class="card quiet keycard" aria-label="Légende">
          <div class="keyc">
            <span><K n="station-lit" />Allumée</span><span><K n="station-now" />Maintenant</span>
            <span><K n="station-open" />Ouverte</span><span><K n="station-locked" />Pas encore ouverte</span>
          </div>
        </section>
      </div>
      <section class="card mapcard" aria-labelledby="chartH">
        <div class="maphead"><h2 id="chartH">Tes lignes d’étoiles</h2><span class="small">Clique sur un arrêt pour voir ce que c’est.</span></div>
        <StarLines />
      </section>
    </div>
  </>;
}

// ---------- practice ----------
function TopBar() {
  const Cur = G.Cur!, S = G.S!, q = Cur.q, fbk = Cur.phase === 'feedback', pl = S.mode !== 'practice', probeName = S.mode === 'check' && !S.warm ? 'Vérification du cahier' : 'Échauffement';
  return <header class="bar">
    <button class="btn" data-act="quit" aria-label="Arrêter pour l’instant"><K n="icon-close" /><span class="stoplabel">Arrêter pour l’instant</span></button>
    {pl ? <span class="chip">{probeName}</span> : <><span class={`chip${hasDigit(SK[q.skill].name) ? ' nums' : ''}`}>{SK[q.skill].name}</span><Level st={q.stage} />{q.review ? <span class="chip quiet">Révision</span> : null}</>}
    <div class="grow">{pl
      ? <div class="prog-text">{S.mode === 'check' ? `${probeName} · question ${Math.min(S.C!.asked + (fbk ? 0 : 1), CHECK_MAX)}` : `Échauffement · question ${Math.min(S.P!.asked + (fbk ? 0 : 1), 12)}`}</div>
      : <div class="qdots" role="progressbar" aria-label="Progression" aria-valuemin={0} aria-valuemax={S.n} aria-valuenow={S.i}>{Array.from({ length: S.n }, (_, i) => <i class={i < S.i ? 'done' : (i === S.i && !fbk ? 'cur' : '')} />)}</div>}
    </div>
    <GemPill />
  </header>;
}

function QuestionMain() {
  const Cur = G.Cur!, q = Cur.q;
  const input = q.kind === 'mc' ? <div class="opts">{q.options!.map((o, i) => <OptBtn o={o} i={i} act="opt" chosen={Cur.chosen} answer={q.answer} />)}</div> : q.kind === 'pad' ? <Pad /> : <Build />;
  const hint = Cur.hintShown && q.hint ? <div class="hint" role="note"><K n="icon-hint" /><div><b>Indice</b><p {...inner(q.hint.text)} />{q.hint.visual ? <div class="visual" {...inner(q.hint.visual)} /> : null}</div></div> : null;
  return <>
    <div class="qhead"><div class="prompt">{q.lead ? <p class="lead">{q.lead}</p> : null}<Raw html={q.prompt} /></div><SpeakBtn /></div>
    {q.visual ? <div class="visual" {...inner(q.visual)} /> : null}
    {input}{hint}
  </>;
}

function HelpAside() {
  const Cur = G.Cur!, q = Cur.q, pl = G.S!.mode !== 'practice', p = P(), typing = q.kind === 'pad' || (q.build && q.build.type === 'steps');
  const tip = typing ? `Au clavier : tape les chiffres${commaAllowed() ? ', la virgule avec « , » ou « . »' : ''}; Retour arrière efface et Entrée vérifie.` : 'Au clavier : Tab passe d’un bouton à l’autre, et Entrée ou Espace appuie dessus.';
  return <aside class="helpaside" aria-label="Aide">
    <h2>Besoin d’un coup de main?</h2>
    {!pl && q.hint && !Cur.hintShown ? <button class="btn aside" data-act="hint"><K n="icon-hint" /> Indice</button> : null}
    {!pl && q.chart && p.settings.chart ? <button class="btn aside" data-act="chart"><K n="icon-report" /> Table de multiplication</button> : null}
    <button class="btn aside" data-act="unsure"><K n="icon-not-sure" /> Je ne sais pas</button>
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

/** Answer display and keypad. A comma key appears on decimal questions (F-23.AC-4). */
function Pad() {
  const Cur = G.Cur!, fbk = Cur.phase === 'feedback', comma = commaAllowed();
  const keys = comma ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del', 'ok'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  const state = fbk && G.S!.mode === 'practice' && Cur.q.kind === 'pad' ? (Cur.ok ? 'right' : 'wrong') : '';
  const label = (k: string) => k === 'del' ? 'Effacer' : k === 'ok' ? 'Vérifier' : k === ',' ? 'Virgule' : k;
  return <div class="padwrap">
    <div class={`padshow${Cur.entry ? '' : ' empty'}${state ? ' ' + state : ''}`} aria-live="polite" aria-label="Ta réponse">
      {Cur.entry ? <>{Cur.entry}{state ? <K n={state === 'right' ? 'icon-check' : 'icon-not-yet'} /> : fbk ? null : <span class="caret" />}</> : <span class="ph">Tape ta réponse</span>}
    </div>
    <div class="pad">{keys.map(k => <button class={`key${k === 'ok' ? ' ok' : ''}${k === 'ok' && comma ? ' wide' : ''}`} data-act="key" data-d={k} disabled={fbk || (k === 'ok' && !Cur.entry)} aria-label={label(k)}>{k === 'del' ? <K n="icon-backspace" /> : k === 'ok' ? 'Vérifier' : k}</button>)}</div>
  </div>;
}

const NEEDS_CHECK = ['tenframe', 'blocks', 'nlplace', 'crossout', 'groups', 'rows', 'shade', 'pvchart', 'shift'];
const Minus = () => <K n="icon-minus" />, Plus = () => <K n="icon-plus" />;
/** "une dizaine de mille" for button labels. */
const oneOf = (c: string) => { const n = PV_COLS[c].name.replace(/^(\w+)s\b/, '$1'); return (/^(dizaine|centaine|unité)/.test(n) ? 'une ' : 'un ') + n; };

function Build() {
  const Cur = G.Cur!, q = Cur.q, bd = q.build!, b = Cur.b as BuildState, done = !!b.done || Cur.phase !== 'answer';
  let h: ComponentChildren = null;
  switch (bd.type) {
    case 'tenframe': { let s = ''; for (let f = 0; f < bd.frames; f++) s += vTF(b.cells!.slice(f * 10, f * 10 + 10), done ? null : f * 10); h = <div class="tfwrap" {...inner(s)} />; break; }
    case 'blocks': {
      const places: [string, string, string, number][] = [...(bd.hundreds ? [['h', 'Centaines', 'centaine', 3] as [string, string, string, number]] : []), ['t', 'Dizaines', 'dizaine', 9], ['o', 'Unités', 'unité', 9]];
      h = <><Raw html={vBlocks(b.h!, b.t!, b.o!)} /><div class="steppers">{places.map(([k, l, one, mx]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="blk" data-d={`${k}-`} aria-label={`Enlever une ${one}`} disabled={done || v <= 0}><Minus /></button><span class="sv" aria-label={`${v} ${plural(v, one)}`} aria-live="polite">{v}</span><button class="sbtn" data-act="blk" data-d={`${k}+`} aria-label={`Ajouter une ${one}`} disabled={done || v >= mx}><Plus /></button></div>;
      })}</div></>;
      break;
    }
    case 'nlplace':
      h = <><div class="visual" {...inner(vLine({ min: bd.min, max: bd.max, labels: bd.labels, marker: b.m ?? null, tap: !done, scale: bd.scale || 1 }))} /><div class="brow"><button class="btn icon" data-act="nlnudge" data-d="-1" aria-label="Déplacer le point vers la gauche" disabled={done}><K n="icon-left" /></button><span class="muted">{b.m === null ? 'Clique sur la droite' : 'Les flèches déplacent le point'}</span><button class="btn icon" data-act="nlnudge" data-d="1" aria-label="Déplacer le point vers la droite" disabled={done}><K n="icon-right" /></button></div></>;
      break;
    case 'jumps': {
      const lo = b.lo!, hi = b.hi!, pos = b.pos!, hist = b.hist as [number, number][];
      const lab = bd.tens ? tensLabels(lo, hi) : [0, 5, 10, 15, 20].filter(v => v >= lo && v <= hi);
      h = <><div class="pospill" role="status">Tu es sur <b>{pos}</b></div><div class="visual" {...inner(vLine({ min: lo, max: hi, labels: lab, marker: pos, jumps: hist.map(([f, t]) => ({ from: f, to: t, label: '+' + (t - f) })) }))} />
        <div class="jlog" aria-label="Bonds jusqu’ici">{hist.length ? hist.map(([f, t]) => <span class="chip quiet">{`+${t - f}`}</span>) : <span class="muted">Pas encore de bonds</span>}</div>
        <div class="brow">{bd.tens ? <button class="btn" data-act="jump" data-d="10" disabled={done || pos + 10 > hi}>+10</button> : null}<button class="btn" data-act="jump" data-d="1" disabled={done || pos + 1 > hi}>+1</button><button class="btn ghost" data-act="jundo" disabled={done || !hist.length}><K n="icon-undo" /> Annuler</button></div>
        {done ? null : <button class="btn primary big" data-act="jdone">J’y suis</button>}</>;
      break;
    }
    case 'crossout': {
      const x = b.x!;
      h = <><div class="items tap">{x.map((v, i) => <button class={`it-c${v ? ' x' : ''}`} data-act="cross" data-i={i} aria-pressed={pressed(v)} aria-label={`${i + 1}${v ? ', enlevé' : ''}`} disabled={done} {...inner(bd.e)} />)}</div><p class="muted center">{`Enlevés : ${x.filter(Boolean).length}`}</p></>;
      break;
    }
    case 'groups':
      h = <><Raw html={vPlates(b.a!, b.b!, bd.e, { box: true })} /><div class="steppers">{([['a', 'Groupes'], ['b', 'Dans chaque groupe']] as const).map(([k, l]) => {
        const v = b[k] as number;
        return <div class="stepper"><span class="sl">{l}</span><button class="sbtn" data-act="grp" data-d={`${k}-`} aria-label={`${l} : moins`} disabled={done || v <= 1}><Minus /></button><span class="sv" aria-live="polite">{v}</span><button class="sbtn" data-act="grp" data-d={`${k}+`} aria-label={`${l} : plus`} disabled={done || v >= 6}><Plus /></button></div>;
      })}</div></>;
      break;
    case 'rows': {
      const r = b.r!;
      h = <><div class="rows" role="img" aria-label={`${r} ${plural(r, 'rangée')} de ${bd.each}`}>{r ? Array.from({ length: r }, (_, i) => <div class="row"><span class="dots">{Array.from({ length: bd.each }, () => <i />)}</span><span class="sk">{(i + 1) * bd.each}</span></div>) : <p class="muted">Pas encore de rangées</p>}</div>
        <div class="brow"><button class="btn" data-act="row" data-d="+" disabled={done || r >= 10}><K n="icon-plus" />{` Ajouter une rangée de ${bd.each}`}</button><button class="btn ghost" data-act="row" data-d="-" disabled={done || r <= 0}><K n="icon-minus" /> Enlever une rangée</button></div></>;
      break;
    }
    case 'share': {
      const plates = b.plates!, left = bd.n - plates.reduce((a, c) => a + c, 0);
      h = <><div class={`sharework${plates.length > 3 ? ' many' : ''}`}>
        <div class="pool"><div role="status" aria-live="polite">{left ? <>Reste à partager : <b>{left}</b></> : 'Tout est partagé'}</div><div class="items">{Array.from({ length: left }, () => <span class="it-c" {...inner(bd.e)} />)}</div></div>
        <span class="arrow" aria-hidden="true"><K n="icon-arrow-right" /></span>
        <div class="plates">{plates.map((c, i) => <div class="pgrp"><button class="plate tap" data-act="plate" data-i={i} aria-label={`Assiette ${i + 1}, en a ${c}`} disabled={done || left === 0}>{Array.from({ length: c }, () => <span class="it" {...inner(bd.e)} />)}</button><div class="plabel">{`Assiette ${i + 1}`}</div></div>)}</div>
      </div>
        <div class="brow"><button class="btn" data-act="sundo" disabled={done || !(b.hist as number[]).length}><K n="icon-undo" /> Annuler</button></div></>;
      break;
    }
    case 'makegroups': {
      const g = b.g!, left = bd.n - g * bd.k;
      h = <><div class="pool"><div role="status" aria-live="polite">{left ? <>Reste : <b>{left}</b></> : 'Il n’en reste plus'}</div><div class="items">{Array.from({ length: left }, () => <span class="it-c" {...inner(bd.e)} />)}</div></div>
        <button class="btn primary big" data-act="mkgrp" disabled={done || left < bd.k}>{`Faire un groupe de ${bd.k}`}</button>{g ? <Raw html={vPlates(g, bd.k, bd.e, { box: true, label: 'Groupe' })} /> : null}</>;
      break;
    }
    case 'shade':
      h = <><div class="visual" {...inner(vFracBar(bd.n, 0, { shaded: b.s!, tap: !done }))} /><p class="muted center">{`Coloriées : ${b.s!.filter(Boolean).length}`}</p></>;
      break;
    case 'pvchart': {
      const counts = b.counts as number[];
      h = <><Raw html={vPV(bd.cols, null, { counts, dots: true })} />
        <div class="pvsteppers" style={`--n:${bd.cols.length}`}>{bd.cols.map((c, i) => <div class={`pvst${PV_COLS[c].pow < 0 ? ' dec' : ''}`}>
          <button class="sbtn" data-act="pvc" data-d={`${i}+`} aria-label={`Ajouter ${oneOf(c)}`} disabled={done || counts[i] >= 9}><Plus /></button>
          <span class="sv" aria-label={`${counts[i]} ${PV_COLS[c].name}`} aria-live="polite">{counts[i]}</span>
          <button class="sbtn" data-act="pvc" data-d={`${i}-`} aria-label={`Enlever ${oneOf(c)}`} disabled={done || counts[i] <= 0}><Minus /></button>
        </div>)}</div>
        <p class="muted center">{`Ton nombre : ${fmtM(bd.cols.reduce((t, c, i) => t + Math.round(counts[i] * 1000 * 10 ** PV_COLS[c].pow), 0))}`}</p></>;
      break;
    }
    case 'shift': {
      const j = b.j as number, v = j >= 0 ? bd.start * 10 ** j : bd.start / 10 ** -j;
      h = <><Raw html={vPV(bd.cols, v)} />
        <div class="pospill" role="status">Tu es à <b>{fmtM(v)}</b>{j ? ` (${j > 0 ? '×' : '÷'} ${10 ** Math.abs(j)})` : ''}</div>
        <div class="brow"><button class="btn" data-act="shift" data-d="m" disabled={done}>× 10</button><button class="btn" data-act="shift" data-d="d" disabled={done}>÷ 10</button><button class="btn ghost" data-act="shundo" disabled={done || !(b.hist as number[]).length}><K n="icon-undo" /> Annuler</button></div></>;
      break;
    }
    case 'steps': {
      const log = b.log as string[], st = currentStep();
      h = <>{log.length ? <ol class="steplog">{log.map(t => <li><K n="icon-check" /><span {...inner(t)} /></li>)}</ol> : null}
        {st && !done ? <div class="stepnow"><p class="prompt sm" {...inner(`Étape ${log.length + 1} sur ${(bd as Extract<BuildT, { type: 'steps' }>).steps.length} : ${st.prompt}`)} />
          {st.choices ? <div class="opts">{st.choices.map(c => <button class={`opt${hasDigit(c) || c.length < 3 ? '' : ' txt'}`} data-act="stepChoice" data-d={c}>{c}</button>)}</div> : <Pad />}
        </div> : null}</>;
      break;
    }
  }
  return <div class={`build b-${bd.type}`}>
    {h}
    {b.msg && !done ? <p class="nudge" role="status">{b.msg}</p> : null}
    {!done && NEEDS_CHECK.includes(bd.type) ? <button class="btn primary big" data-act="bcheck">Vérifier</button> : null}
    {b.done && q.followup ? <div class="follow"><div class="qhead"><p class="prompt sm" {...inner(q.followup.prompt)} /><SpeakBtn act="fspeak" /></div><div class="opts">{q.followup.options.map((o, i) => <OptBtn o={o} i={i} act="fopt" chosen={Cur.fchosen} answer={q.followup!.answer} />)}</div></div> : null}
  </div>;
}

export function answerText(): string {
  const Cur = G.Cur!, q = Cur.q;
  const find = (opts: Option[], ans: string | number | undefined) => { const o = opts.find(o => String(o.value) === String(ans)); return o ? o.label.replace(/<svg[\s\S]*?<\/svg>/g, '') : ''; };
  if (q.kind === 'mc') return find(q.options!, q.answer); if (q.kind === 'pad') return showAnswer(String(q.answer));
  if (q.followup && Cur.b && Cur.b.done) return find(q.followup.options, q.followup.answer);
  if (q.build && q.build.type === 'steps') return showAnswer(q.build.steps[q.build.steps.length - 1].answer);
  return '';
}

const FbGain = ({ n, trying }: { n: number; trying?: boolean }) => <span class="fb-gain" aria-label={`plus ${n} ${plural(n, 'gemme')}${trying ? ' pour l’effort' : ''}`}>{`+${n}`}<Gem /></span>;

/** Feedback card (design/COMPONENTS.md §12). Order in the not-yet card follows F-6.AC-1. */
function Feedback() {
  const Cur = G.Cur!, q = Cur.q;
  if (G.S!.mode !== 'practice') return <section class={`fb${Cur.ok ? ' good' : ' unsure'}`} id="fb">
    <div class="fb-head"><span class="fb-icon"><K n={Cur.ok ? 'icon-check' : 'icon-info'} /></span><h2 class="fb-title" role="status">{Cur.ok ? 'C’est ça.' : 'Merci. Ça nous aide à savoir par où commencer.'}</h2></div>
    <button class="btn primary" data-act="next">Suivant <K n="icon-arrow-right" /></button></section>;
  if (Cur.ok) return <section class="fb good" id="fb">
    <div class="fb-head"><span class="fb-icon"><K n="icon-check" /></span><h2 class="fb-title" role="status">{pick(OK_LINES) + (Cur.hinted ? ' (avec un indice)' : '')}</h2><FbGain n={Cur.gain!} /></div>
    <button class="btn primary" data-act="next">Suivant <K n="icon-arrow-right" /></button></section>;
  const mt = Cur.mis && MIS[Cur.mis] ? MIS[Cur.mis].kid : null, at = answerText(), unsure = !!Cur.unsure;
  return <section class={`fb ${unsure ? 'unsure' : 'warm'}`} id="fb">
    <div class="fb-head"><span class="fb-icon"><K n={unsure ? 'icon-info' : 'icon-not-yet'} /></span><h2 class="fb-title" role="status">{unsure ? 'Bonne idée de demander. Voici comment le voir.' : 'Pas encore. Regardons-le autrement.'}</h2><FbGain n={Cur.gain!} trying /></div>
    {mt ? <p class="fb-pattern">{mt}</p> : null}
    <p class="fb-text" {...inner(q.explain.text)} />
    {q.explain.visual ? <figure class="fb-figure"><div class="visual" {...inner(q.explain.visual)} /></figure> : null}
    {at ? <p class="fb-text ans">La réponse est <b {...inner(at)} />.</p> : null}
    <button class="btn primary" data-act="next">Compris, suivant <K n="icon-arrow-right" /></button></section>;
}

/** After the workbook check or the first-run warm-up (F-22.AC-5, F-8.AC-4): what is solid, what to build, where she starts. */
export function Checked() {
  const p = P(), r = p.workbook ? p.workbook.results : {}, f = pickFocus(p), warm = !!(G.S && G.S.warm);
  const solid = Object.keys(r).filter(id => r[id] === 'pass'), build = Object.keys(r).filter(id => r[id] === 'fail');
  const names = (ids: string[]) => ids.map(id => <li><K n={r[id] === 'pass' ? 'station-lit' : 'station-open'} /><span class={hasDigit(SK[id].name) ? 'nums' : ''}>{SK[id].name}</span></li>);
  return <section class="card"><p class="eyebrow">{warm ? 'Échauffement terminé' : 'Vérification terminée'}</p><h1>{`Merci, ${p.name}.`}</h1>
    {solid.length ? <><h2>Déjà solide</h2><ul class="wins">{names(solid)}</ul></> : null}
    {build.length ? <><h2>On va construire ces habiletés</h2><ul class="wins">{names(build)}</ul></> : null}
    <p>{f ? <>Tu commences avec <b>{SK[f].name}</b>. Chaque étape te rapproche {warm ? 'de ton niveau de 6e année' : 'de ta page de cahier'}.</> : 'Toutes les habiletés visées sont allumées. La pratique les garde fortes.'}</p>
    <button class="btn primary big" data-act="home">Voir mes lignes d’étoiles</button></section>;
}

/** Grown-up view, Workbook tab (F-22.AC-1, AC-2, AC-6). */
function WorkbookTab() {
  const p = P(), wb = G.UI.tmp.wb, goal = p.workbook;
  if (wb && wb.step === 'reading') return <section class="card"><h2>Lecture de la page…</h2><p class="muted">Ça peut prendre jusqu’à une minute. Claude cherche seulement quelles habiletés la page demande.</p></section>;
  if (wb && wb.step === 'confirm') {
    const path = goalPath(wb.picks);
    return <section class="card"><h2>Quelles habiletés la page demande-t-elle?</h2>
      {wb.topic ? <p>{'La page porte sur : '}<b>{wb.topic}</b></p> : null}
      <p class="muted">{wb.topic ? 'Vérifiez la liste. Ajoutez ou retirez des habiletés, puis confirmez. Rien ne change avant.' : 'Choisissez les habiletés que la page utilise. La vérification ajoute celles dont elles dépendent.'}</p>
      {GROUPS.map(g => <fieldset><legend>{g}</legend><div class="row">{SKILLS.filter(s => s.group === g).map(s => <button class={`btn${wb.picks.includes(s.id) ? ' picked' : ''}`} data-act="wbToggle" data-d={s.id} aria-pressed={pressed(wb.picks.includes(s.id))}>{wb.picks.includes(s.id) ? <K n="icon-check" /> : null}<span class={hasDigit(s.name) ? 'nums' : ''}>{s.name}</span></button>)}</div></fieldset>)}
      {wb.picks.length ? <p class="small">{`La vérification couvre ces habiletés et revient à celles dont elles dépendent au besoin : ${path.size} ${plural(path.size, 'habileté')} en tout.`}</p> : null}
      {wb.beyond && wb.beyond.length ? <div class="hint" role="note"><K n="icon-info" /><div><b>Aussi nécessaire, pas encore dans l’appli</b><ul class="how">{wb.beyond.map(t => <li>{t}</li>)}</ul></div></div> : null}
      <div class="row"><button class="btn primary" data-act="wbConfirm" disabled={!wb.picks.length}>Confirmer et préparer la vérification</button><button class="btn" data-act="wbCancel">Annuler</button></div>
    </section>;
  }
  return <>
    {goal ? <section class="card"><h2>Objectif actuel du cahier</h2>
      <p class="muted">{`Fixé ${rel(goal.at)}. ${goal.checkedAt ? `Vérification faite ${rel(goal.checkedAt)}.` : 'Vérification pas encore faite : elle la lance depuis l’accueil.'}`}</p>
      <ul class="learners">{goal.skills.map(id => <li><K n={`station-${starState(id)}`} /><span class="lname">{SK[id].name}</span>{goal.results[id] ? <span class="chip quiet">{goal.results[id] === 'pass' ? 'Réussie' : 'En construction'}</span> : null}</li>)}</ul>
      <div class="row"><button class="btn" data-act="beginCheck">{goal.checkedAt ? 'Refaire la vérification' : 'Lancer la vérification maintenant'}</button><button class="btn ghost" data-act="wbClear">Effacer cet objectif</button></div>
    </section> : null}
    <section class="card"><h2>{goal ? 'Vérifier une nouvelle page du cahier' : 'Vérifier une page du cahier'}</h2>
      <p>Prenez en photo la page sur laquelle elle travaille. Claude lit quelles habiletés elle demande, vous confirmez, puis elle fait une courte vérification. La pratique revient à ce qui lui manque, puis remonte vers la page.</p>
      <p class="small">La photo est lue une fois et n’est pas gardée. Seules les habiletés confirmées sont enregistrées. Claude n’écrit ni questions ni réponses.</p>
      {wb && wb.err ? <p class="nudge" role="status">{wb.err}</p> : null}
      <div class="row">
        {G.photos ? <label class="btn primary" for="wbPhoto"><K n="icon-plus" /> Prendre ou choisir une photo<input id="wbPhoto" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" class="vh" /></label> : null}
        <button class={`btn${G.photos ? '' : ' primary'}`} data-act="wbManual">Choisir les habiletés moi-même</button>
      </div>
      {G.photos === false ? <p class="small">La lecture de photos fonctionne quand l’appli est ouverte dans Claude.</p> : null}
    </section>
  </>;
}

export function Summary() {
  const S = G.S!, p = P(), ev = S.events, wins: ComponentChildren[] = [];
  ev.forEach(e => {
    if (e.type === 'mastered') wins.push(<li><K n="station-lit" />{`Étoile allumée : ${SK[e.skill].name}`}</li>);
    else if (e.type === 'up') wins.push(<li><K n="badge-level-up" />{`${SK[e.skill].name} : niveau ${STAGES[e.stage].toLowerCase()}`}</li>);
  });
  const ups = ev.filter(e => e.type === 'up' || e.type === 'mastered').length;
  return <section class="card"><p class="eyebrow">{S.early ? 'Arrêt pour l’instant' : 'Pratique terminée'}</p><h1>{`Beau travail, ${p.name}.`}</h1>
    <div class="stats"><div><b>{S.answered}</b><span>{plural(S.answered, 'question')}</span></div><div><b>{`+${S.gems}`}</b><span>{plural(S.gems, 'gemme')}</span></div><div><b>{ups}</b><span>{plural(ups, 'niveau gagné', 'niveaux gagnés')}</span></div></div>
    {wins.length ? <ul class="wins">{wins}</ul> : <p class="muted">Chaque réponse te rapproche du prochain niveau.</p>}
    <WeekCard />
    <div class="row"><button class="btn primary big" data-act="more">5 questions de plus</button><button class="btn" data-act="home">Retour à mes lignes d’étoiles</button></div></section>;
}

/** Customize (design/SCREENS.md §11): Badge and Colour tabs. Story themes come with F-11. */
export function Shop() {
  const p = P(), tab = G.UI.tmp.stab || 'badge';
  const meta = (use: boolean, own: boolean, price: number) => use ? <><K n="icon-check" />Utilisé</> : own ? 'À toi' : p.gems >= price ? <><Gem />{String(price)}</> : <><Gem />{`${price} · encore ${price - p.gems}`}</>;
  return <>
    <header class="head"><button class="btn icon" data-act="home" aria-label="Retour"><K n="icon-left" /></button><div class="who"><div class="name">Personnaliser</div><div class="small">Utilise tes gemmes pour des badges et des couleurs</div></div><GemPill /></header>
    <div class="segc" role="group" aria-label="Personnaliser">{[['badge', 'Badge'], ['colour', 'Couleur']].map(([k, l]) => <button data-act="stab" data-d={k} aria-pressed={pressed(tab === k)}>{l}</button>)}</div>
    {tab === 'badge'
      ? <section class="card"><h2>Badges</h2><div class="tiles">{AVATARS.map(a => {
        const own = p.owned.avatars.includes(a.id) || a.price === 0, use = p.avatar === a.id;
        return <button class={`tile${use ? ' on' : ''}${!own && p.gems < a.price ? ' short' : ''}`} data-act="buyAv" data-d={a.id} aria-label={`Badge ${a.name}${use ? ', utilisé' : own ? ', à toi' : `, coûte ${a.price} gemmes`}`}><span class="tile__art"><Avatar a={a.id} name={p.name} /></span><span class="tile__name">{a.name}</span><span class="tile__meta">{meta(use, own, a.price)}</span></button>;
      })}</div></section>
      : <section class="card"><h2>Couleurs</h2><div class="tiles">{Object.entries(THEMES).map(([k, t]) => {
        const own = p.owned.themes.includes(k) || t.priceGems === 0, use = p.theme === k, c = isDark() ? t.dark.accent : t.light.accent;
        const name = ({ cobalt: 'Cobalt', ocean: 'Océan', berry: 'Petits fruits', graphite: 'Graphite' } as Record<string, string>)[k] || t.name;
        return <button class={`tile${use ? ' on' : ''}${!own && p.gems < t.priceGems ? ' short' : ''}`} data-act="buyTheme" data-d={k} aria-label={`${name}${use ? ', utilisée' : own ? ', à toi' : `, coûte ${t.priceGems} gemmes`}`}><span class="tile__art"><span class="swatch" style={`background:${c}`} /></span><span class="tile__name">{name}</span><span class="tile__meta">{meta(use, own, t.priceGems)}</span></button>;
      })}</div></section>}
    <p class="small center">Tu gagnes des gemmes à chaque réponse, à chaque niveau gagné et à chaque pratique terminée.</p>
  </>;
}

// ---------- grown-ups ----------
function SkillRow({ s }: { s: Skill }) {
  const p = P(), st = p.skills[s.id], isF = frontier(p).some(x => x.id === s.id); let chip, pct: number, lab: string;
  if (st.mastered) { chip = <span class="chip good">Maîtrisée</span>; pct = Math.round(st.pL[2] * 100); lab = `Confiance ${pct} %`; }
  else if (isF) { chip = <Level st={st.stage} />; pct = Math.round(st.pL[st.stage] * 100); lab = `${pct} % estimé à ce niveau`; }
  else { chip = <span class="chip quiet">Verrouillée</span>; pct = 0; lab = `S’ouvre après ${s.pre.map(id => SK[id].name).join(' et ')}`; }
  const att = st.att.reduce((a, b) => a + b, 0), cor = st.cor.reduce((a, b) => a + b, 0);
  return <li class="sr"><b class={hasDigit(s.name) ? 'nums' : ''}>{s.name}</b>{chip}<span class="est" role="img" aria-label={`Estimation ${pct} %. Descend sous 40 %, monte à partir de 90 %.`}><i style={`width:${pct}%`} /><b style="left:40%" /><b style="left:90%" /></span><span class="pct">{`${pct} %`}</span>
    <span class="sr-meta">{lab + (att ? ` · ${att} ${plural(att, 'réponse')}, ${Math.round(cor / att * 100)} % de bonnes · ${rel(st.lastSeen)}` : '')}. {s.about}{s.pda ? ` PDA : ${s.pda}` : ''}</span></li>;
}
function Seg({ k, label, opts }: { k: string; label: string; opts: [string | number | boolean, string][] }) {
  return <div class="set"><span class="set-l" id={`set-${k}`}>{label}</span><div class="segc" role="group" aria-labelledby={`set-${k}`}>{opts.map(([v, t]) => <button data-act="set" data-k={k} data-v={String(v)} aria-pressed={pressed(String(P().settings[k]) === String(v))}>{t}</button>)}</div></div>;
}
const GTABS: [string, string][] = [['progress', 'Progrès'], ['workbook', 'Cahier'], ['patterns', 'Erreurs fréquentes'], ['sessions', 'Séances'], ['settings', 'Réglages'], ['data', 'Données']];

export function Grown() {
  const p = P(), UI = G.UI, tab = UI.tmp.gtab || 'progress', wk = Date.now() - 7 * 864e5, rec = p.log.filter(l => l.t >= wk && !l.p), acc = rec.length ? Math.round(rec.filter(l => l.ok).length / rec.length * 100) : null;
  const wkKey = dayKey(new Date(wk)), days = p.days.filter(d => d > wkKey).length, lit = SKILLS.filter(s => p.skills[s.id].mastered).length, f = pickFocus(p);
  const misList = Object.entries(p.mis).filter(([k]) => MIS[k]).sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  const sess = p.sessions.slice(-8).reverse();
  let body: ComponentChildren;
  if (tab === 'progress') body = <>
    <section class="card"><h2>En un coup d’œil</h2>
      <div class="glance"><div><b>{`${lit}/${SKILLS.length}`}</b><span>habiletés maîtrisées</span></div><div><b>{rec.length}</b><span>questions en 7 jours</span></div><div><b>{acc === null ? '–' : acc + ' %'}</b><span>de bonnes réponses en 7 jours</span></div><div><b>{days}</b><span>jours de pratique sur 7</span></div></div>
      <p>{f ? <>Travaille <b>{SK[f].name}</b> au niveau <b>{STAGES[p.skills[f].stage].toLowerCase()}</b>.</> : 'Toutes les habiletés sont maîtrisées. La pratique sert de révision.'}</p></section>
    <section class="card"><h2>Habiletés</h2>{GROUPS.map(g => <><h3>{g}</h3><ul class="skl">{SKILLS.filter(s => s.group === g).map(s => <SkillRow s={s} />)}</ul></>)}</section>
    <section class="card quiet"><h2>Comment l’appli choisit la suite</h2><ul class="how">
      <li>Chaque habileté a trois niveaux : <b>matériel</b> (elle construit), <b>images</b> (elle lit une image) et <b>nombres</b> (seulement les symboles).</li>
      <li>Après chaque réponse, l’appli met à jour son estimation de la probabilité qu’elle maîtrise l’habileté à ce niveau (traçage bayésien des connaissances). Au-delà de 90 %, avec ses trois dernières réponses justes et sans indice, elle monte d’un niveau.</li>
      <li>Si 2 de ses 3 dernières réponses sont fausses et que l’estimation tombe sous 40 %, elle descend d’un niveau. Si c’est difficile même avec le matériel, on revient à l’habileté d’avant dont celle-ci dépend.</li>
      <li>Une question sur quatre révise une habileté déjà maîtrisée. Deux erreurs en révision rouvrent l’habileté.</li>
      <li>L’échauffement commence au niveau de 6e année (son cahier) et redescend vers les bases seulement si elle en a besoin.</li>
      <li>Pas de chronomètre. « Indice » et « Je ne sais pas » sont toujours là; ils ralentissent un peu la progression mais ne coûtent jamais de gemmes.</li>
    </ul></section></>;
  else if (tab === 'workbook') body = <WorkbookTab />;
  else if (tab === 'patterns') body = <section class="card"><h2>Erreurs fréquentes observées</h2>
    {misList.length
      ? <><ul class="mis">{misList.map(([k, v]) => <li data-pattern={k}><div class="mis-top"><b>{MIS[k].parent}</b><span class="chip quiet">{`Vue ${v.count} ${plural(v.count, 'fois', 'fois')}`}</span></div><p class="small">{`Dernière fois : ${rel(v.last)}`}</p><dl><dt>Ce qu’elle voit</dt><dd>{MIS[k].kid}</dd><dt>À essayer à la maison</dt><dd>{MIS[k].act}</dd></dl></li>)}</ul><p class="small">À partager avec son enseignante ou son tuteur.</p></>
      : <p class="muted">Rien pour l’instant. Quand une réponse correspond à une erreur fréquente, par exemple soustraire dans une division, elle apparaît ici avec une activité à faire à la maison.</p>}</section>;
  else if (tab === 'sessions') body = <section class="card"><h2>Séances récentes</h2>{sess.length ? <ul class="sess">{sess.map(s => <li><span>{new Date(s.d).toLocaleDateString('fr-CA', { weekday: 'short', month: 'short', day: 'numeric' }) + (s.m === 'placement' ? ' · échauffement' : s.m === 'check' ? ' · vérification du cahier' : '')}</span><span class="muted">{`${s.n} ${plural(s.n, 'question')}, ${s.c} ${plural(s.c, 'bonne', 'bonnes')}, ${s.min} min`}</span></li>)}</ul> : <p class="muted">Pas encore de séances.</p>}</section>;
  else if (tab === 'settings') body = <section class="card"><h2>Réglages</h2>
    <Seg k="sessionLen" label="Questions par séance" opts={[[5, '5'], [10, '10'], [15, '15']]} />
    <Seg k="sound" label="Sons" opts={[[true, 'Oui'], [false, 'Non']]} />
    <Seg k="autoRead" label="Lire chaque question à voix haute" opts={[[false, 'Non'], [true, 'Oui']]} />
    <Seg k="chart" label="Table de multiplication permise" opts={[[true, 'Permise'], [false, 'Cachée']]} />
    {canSpeak() ? null : <p class="small">La lecture à voix haute n’est pas offerte dans ce navigateur.</p>}</section>;
  else body = <section class="card"><h2>Élèves et données</h2>
    <p>{G.store.mode === 'account' ? 'Les progrès sont enregistrés dans le compte Claude qui a ouvert cette page, et dans ce navigateur.' : 'Les progrès sont enregistrés dans ce navigateur seulement. Copiez un code de sauvegarde pour les transférer sur un autre appareil.'}</p>
    <div class="row"><button class="btn" data-act="copyBackup"><K n="icon-copy" /> Copier le code de sauvegarde</button></div>
    {UI.tmp.code ? <><label for="codeOut" class="small">Code de sauvegarde (tout sélectionner et copier)</label><textarea readOnly class="code" id="codeOut" value={UI.tmp.code} /></> : null}
    <form id="restoreForm" class="form"><label for="restoreText">Restaurer à partir d’un code de sauvegarde</label><textarea id="restoreText" class="code" rows={3} /><button class="btn" type="submit">Restaurer</button></form>
    <h3>Élèves</h3><ul class="learners">{Object.values(app().profiles).map(x => <li><Avatar a={x.avatar} name={x.name} sm /><span class="lname">{x.name}</span>{x.id === p.id ? <span class="chip quiet">Actuel</span> : <button class="btn" data-act="switchTo" data-d={x.id}>Changer</button>}</li>)}</ul>
    <button class="btn" data-act="addLearner"><K n="icon-plus" /> Ajouter un élève</button>
    <div class="row"><button class="btn ghost" data-act="redo">Refaire l’échauffement</button><button class="btn ghost" data-act="reset">{`Effacer les progrès de ${p.name}`}</button></div>
  </section>;
  return <>
    <header class="head"><button class="btn icon" data-act="back" aria-label="Retour aux lignes d’étoiles"><K n="icon-left" /></button><div class="who"><div class="name">{`Espace parent · ${p.name}`}</div></div></header>
    <div class="segc" role="group" aria-label="Sections de l’espace parent">{GTABS.map(([k, l]) => <button data-act="gtab" data-d={k} aria-pressed={pressed(tab === k)}>{l}</button>)}</div>
    {body}
  </>;
}

// ---------- dialogs ----------
export function Modal() {
  const m = G.UI.modal; if (!m) return null; let body: ComponentChildren = null;
  const dialog = (children: ComponentChildren, cls = '') => <section class={`modal${cls}`} role="dialog" aria-modal="true" aria-labelledby="mt">{children}</section>;
  if (m.type === 'event') {
    const e = m.ev, s = SK[e.skill]; let badge: string, title: string, text: string;
    if (e.type === 'mastered') { badge = 'badge-star-lit'; title = 'Une nouvelle étoile s’allume!'; text = `Tu maîtrises ${s.name}.`; }
    else if (e.type === 'up') { badge = 'badge-level-up'; title = 'Niveau gagné!'; text = `Tu es prête pour ${s.name} ${STAGE_WITH[e.stage]}.`; }
    else if (e.type === 'down') { badge = 'badge-switch-level'; title = 'On change de façon'; text = `Essayons ${s.name} ${STAGE_WITH[e.stage]} un moment. C’est plus facile de voir ce qui se passe. Tu remonteras bientôt.`; }
    else if (e.type === 'prereq') { badge = 'badge-switch-level'; title = 'Petit retour en arrière'; text = `Pratiquons ${SK[e.to].name} un moment. Ça va rendre ${s.name} plus facile.`; }
    else { badge = 'badge-switch-level'; title = 'Petite révision'; text = `Révisons ${s.name} pendant quelques questions.`; }
    body = dialog(<><K n={badge} cls="badgeart" /><h2 id="mt">{title}</h2><p class="mbody">{text}</p><button class="btn primary" data-act="eventOk" data-focus="1">Continuer</button></>);
  } else if (m.type === 'confirm') {
    body = dialog(<><h2 id="mt">{m.title}</h2><p class="mbody">{m.text}</p><div class="row"><button class="btn" data-act="closeModal" data-focus="1">Annuler</button><button class="btn primary" data-act={m.act}>{m.yes}</button></div></>);
  } else if (m.type === 'star') {
    const s = SK[m.id], st = P().skills[m.id], state = starState(m.id);
    const status = state === 'lit' ? 'Allumée. Elle revient en révision de temps en temps.' : state === 'now' ? `En pratique au niveau ${STAGES[st.stage].toLowerCase()}.` : state === 'open' ? 'Ouverte. Prête à commencer.' : `S’ouvre après ${s.pre.map(id => SK[id].name).join(' et ')}.`;
    body = dialog(<><K n={`station-${state}`} cls="badgeart" /><h2 id="mt" class={hasDigit(s.name) ? 'nums' : ''}>{s.name}</h2>{state === 'locked' ? null : <Level st={st.mastered ? 2 : st.stage} />}<p class="mbody">{s.kid}</p><p class="mbody muted">{status}</p>{state === 'open' ? <button class="btn primary" data-act="focusSkill" data-d={m.id}>Pratiquer celle-ci</button> : null}<button class="btn" data-act="closeModal" data-focus="1">Fermer</button></>);
  } else if (m.type === 'chart') {
    const hi = m.hi || [0, 0], rows: ComponentChildren[] = [];
    for (let r = 1; r <= 10; r++) {
      const cells: ComponentChildren[] = [];
      for (let c = 1; c <= 10; c++) { const cls = (r === hi[0] && c === hi[1]) ? 'hx' : (r === hi[0] || c === hi[1]) ? 'hl' : ''; cells.push(<td class={cls} data-act="chartcell" data-i={r} data-d={c}>{r * c}</td>); }
      rows.push(<tr><th scope="row">{r}</th>{cells}</tr>);
    }
    body = dialog(<><h2 id="mt">Table de multiplication</h2><p class="mbody small">Clique sur un nombre pour allumer sa rangée et sa colonne. Utiliser la table compte comme un indice.</p><div class="chartwrap"><table class="chartgrid"><thead><tr><th scope="col">×</th>{Array.from({ length: 10 }, (_, i) => <th scope="col">{i + 1}</th>)}</tr></thead><tbody>{rows}</tbody></table></div><button class="btn primary" data-act="closeModal" data-focus="1">Retour à la question</button></>, ' wide');
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

