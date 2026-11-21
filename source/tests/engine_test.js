// Validates every question generator and simulates learners through the adaptive model.
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
if (!m) throw new Error('engine script not found');
const ctx = { console, Math, Date, JSON, Object, Array, String, Number, Set, Map };
vm.createContext(ctx);
vm.runInContext(m[1] + '\n;this.API={GEN,SKILLS,SK,LADDER,MIS,makeQuestion,newProfile,record,nextItem,pickFocus,frontier,guessFor,placementInit,placementNext,placementRecord,placementApply,initBuildCheck:null};', ctx);
const A = ctx.API;
let errors = [];
const N = 400;

function stripTags(s) { return String(s).replace(/<[^>]+>/g, ''); }
function checkText(where, s) {
  if (s == null) return;
  const t = String(s);
  if (/undefined|NaN|\[object|null/.test(stripTags(t))) errors.push(`${where}: bad text "${stripTags(t).slice(0, 120)}"`);
}
function checkMC(where, opts, ans) {
  if (!Array.isArray(opts) || opts.length < 2) { errors.push(`${where}: <2 options`); return; }
  const vals = opts.map(o => String(o.value));
  if (new Set(vals).size !== vals.length) errors.push(`${where}: duplicate option values ${vals}`);
  const hits = vals.filter(v => v === String(ans)).length;
  if (hits !== 1) errors.push(`${where}: answer ${ans} appears ${hits}x in ${vals}`);
  const labels = opts.map(o => stripTags(o.label).trim());
  if (new Set(labels).size !== labels.length) errors.push(`${where}: duplicate labels ${labels}`);
  opts.forEach(o => { checkText(where + ' label', o.label); if (o.mis && !A.MIS[o.mis]) errors.push(`${where}: unknown mis ${o.mis}`); });
  opts.forEach(o => { if (typeof o.value === 'number' && (o.value < 0 || !Number.isInteger(o.value))) errors.push(`${where}: bad numeric option ${o.value}`); });
}
function checkBuild(where, bd) {
  switch (bd.type) {
    case 'tenframe': if (!(bd.target >= 1 && bd.target <= bd.frames * 10 && bd.preset < bd.target)) errors.push(`${where}: tenframe infeasible ${JSON.stringify(bd)}`); break;
    case 'blocks': { const h = Math.floor(bd.target / 100); if (h > 3 || (h > 0 && !bd.hundreds)) errors.push(`${where}: blocks infeasible ${bd.target}`); break; }
    case 'nlplace': if (!(bd.target > bd.min && bd.target < bd.max)) errors.push(`${where}: nlplace`); break;
    case 'jumps': { const lo = Math.floor(bd.start / 10) * 10, hi = Math.max(lo + 20, Math.ceil((bd.target + 1) / 10) * 10); if (bd.target > hi || bd.target < bd.start) errors.push(`${where}: jumps out of range`); if (hi - lo > 60) errors.push(`${where}: jumps range too wide ${lo}-${hi}`); break; }
    case 'crossout': if (!(bd.k >= 1 && bd.k < bd.n)) errors.push(`${where}: crossout`); break;
    case 'groups': if (!(bd.a >= 1 && bd.a <= 6 && bd.b >= 1 && bd.b <= 6)) errors.push(`${where}: groups out of stepper range`); break;
    case 'rows': if (!(bd.target >= 1 && bd.target <= 10)) errors.push(`${where}: rows`); break;
    case 'share': if (bd.n % bd.k !== 0) errors.push(`${where}: share not divisible`); break;
    case 'makegroups': if (bd.n % bd.k !== 0) errors.push(`${where}: makegroups not divisible`); break;
    case 'shade': if (!(bd.k >= 1 && bd.k < bd.n)) errors.push(`${where}: shade`); break;
    default: errors.push(`${where}: unknown build ${bd.type}`);
  }
}
let count = 0;
for (const s of A.SKILLS) {
  for (let st = 0; st < 3; st++) {
    for (const easy of [true, false]) {
      for (let i = 0; i < N; i++) {
        const where = `${s.id}[${st}]${easy ? 'e' : ''}`;
        let q;
        try { q = A.makeQuestion(s.id, st, easy); } catch (e) { errors.push(`${where}: threw ${e.message}`); continue; }
        count++;
        checkText(where + ' prompt', q.prompt);
        checkText(where + ' explain', q.explain && q.explain.text);
        if (q.hint) checkText(where + ' hint', q.hint.text);
        if (!q.explain || !q.explain.text) errors.push(`${where}: no explain`);
        if (q.kind === 'mc') checkMC(where, q.options, q.answer);
        else if (q.kind === 'pad') {
          if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 9999) errors.push(`${where}: bad pad answer ${q.answer}`);
          if (q.padMis) for (const [k, v] of Object.entries(q.padMis)) { if (+k === q.answer) errors.push(`${where}: padMis includes answer`); if (!A.MIS[v]) errors.push(`${where}: unknown mis ${v}`); }
        } else if (q.kind === 'build') {
          checkBuild(where, q.build);
          if (q.followup) checkMC(where + ' followup', q.followup.options, q.followup.answer);
        } else errors.push(`${where}: unknown kind ${q.kind}`);
      }
    }
  }
}
// learner simulations
function simulate(name, pCorrect, steps = 1500) {
  const p = A.newProfile('Test', '🦊');
  // placement with a learner who knows the first `known` ladder skills
  const P = A.placementInit();
  let guard = 0;
  while (true) { const it = A.placementNext(P); if (!it || guard++ > 20) break; A.placementRecord(P, Math.random() < pCorrect(it.skill, 2, p)); }
  A.placementApply(p, P);
  const startAt = A.LADDER[P.lo];
  const sess = { i: 0 };
  const events = {};
  let firstMasterAll = null;
  for (let t = 0; t < steps; t++) {
    const it = A.nextItem(p, sess);
    if (!it) { if (!firstMasterAll) firstMasterAll = t; break; }
    const q = A.makeQuestion(it.skill, it.stage, false);
    const ok = Math.random() < pCorrect(it.skill, it.stage, p);
    const ev = A.record(p, it.skill, it.stage, ok, { G: A.guessFor(q), review: it.review });
    ev.forEach(e => events[e.type] = (events[e.type] || 0) + 1);
    sess.i++;
  }
  const mastered = A.SKILLS.filter(s => p.skills[s.id].mastered).map(s => s.id);
  return { name, startAt, mastered: mastered.length, focus: p.focus, stages: A.SKILLS.map(s => s.id + ':' + (p.skills[s.id].mastered ? 'M' : p.skills[s.id].stage)).join(' '), events };
}
const idx = id => A.LADDER.indexOf(id);
// 1) strong learner
console.log(JSON.stringify(simulate('strong', () => 0.95, 800)));
// 2) learner like the user's daughter: fine to addition, weak on division meaning until practised hands-on/pictures
console.log(JSON.stringify(simulate('dyscalculia-like', (sk, st, p) => {
  const base = idx(sk) <= idx('subtraction') ? 0.85 : 0.5;
  const stageBoost = [0.25, 0.1, 0][st];
  const practice = Math.min(0.3, (p.skills[sk].att.reduce((a, b) => a + b, 0)) * 0.01);
  return Math.min(0.97, base + stageBoost + practice);
}, 1500)));
// 3) struggling learner who stays weak
console.log(JSON.stringify(simulate('struggling', (sk, st) => [0.55, 0.4, 0.3][st], 600)));
console.log(`generated ${count} questions`);
const uniq = [...new Set(errors)];
console.log(uniq.length ? `ERRORS (${uniq.length} unique):\n` + uniq.slice(0, 60).join('\n') : 'NO ERRORS');
