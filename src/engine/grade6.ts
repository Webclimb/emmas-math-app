// F-23 grade-level skills, 6e année (D-23): big numbers, × and ÷ by powers of ten, decimals to
// thousandths, rounding and estimating, column addition, column multiplication, multiplying decimals
// and decimal story problems. Every decimal is a whole number of thousandths (./decimal.ts), so each
// question has exactly one right answer. Hands-on levels use a place-value chart, a sliding chart or
// guided column steps; a rod still always means ten (F-3.AC-3).
import { canon, dpOf, fmtM, nf } from './decimal';
import { NAMES } from './content';
import { Q, type Gen } from './qkit';
import { pick, ri, shuffle, random } from './rng';
import type { Option, Step } from './types';
import { PV_COLS, digitAt, eq, fr, plural, vColumns, vDecGrid, vLine, vPV, vRateBars, vTimesBars } from './visuals';

const M = 1000; // thousandths per unit
const P10 = [1, 10, 100, 1000];

// ---------- option and pattern helpers (values in thousandths) ----------
/** Options for a decimal or whole answer; values are canonical strings, labels Québec text. */
function decOpts(correct: number, ds: { v: number | null; mis?: string | null }[], n = 4): { options: Option[]; answer: string } {
  const out: Option[] = [{ value: canon(correct), label: fmtM(correct), mis: null }], seen = new Set([canon(correct)]);
  for (const d of ds) {
    if (d.v === null || !Number.isInteger(d.v) || d.v <= 0) continue;
    const c = canon(d.v); if (seen.has(c)) continue;
    seen.add(c); out.push({ value: c, label: fmtM(d.v), mis: d.mis || null }); if (out.length >= n) break;
  }
  const unit = 10 ** (3 - Math.max(dpOf(correct), 0));
  for (let k = 1; out.length < 3 && k < 50; k++) for (const v of [correct + k * unit, correct - k * unit]) {
    if (out.length >= 3 || v <= 0) continue; const c = canon(v); if (seen.has(c)) continue;
    seen.add(c); out.push({ value: c, label: fmtM(v), mis: null });
  }
  return { options: shuffle(out), answer: canon(correct) };
}
/** Whole-number options with Québec labels. */
function intOpts(correct: number, ds: { v: number | null; mis?: string | null }[]): { options: Option[]; answer: string } {
  return decOpts(correct * M, ds.map(d => ({ v: d.v === null ? null : d.v * M, mis: d.mis })));
}
/** Typed-answer patterns keyed by canonical text. */
function dpm(pairs: [number | null, string][], ans: number): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [v, mis] of pairs) { if (v === null || !Number.isInteger(v) || v <= 0 || v === ans) continue; const c = canon(v); if (!(c in m)) m[c] = mis; }
  return m;
}
const ipm = (pairs: [number | null, string][], ans: number) => dpm(pairs.map(([v, m]) => [v === null ? null : v * M, m]), ans * M);
/** Value in thousandths for a whole number of units in a column. */
const colVal = (col: string, digit: number) => Math.round(digit * M * 10 ** PV_COLS[col].pow);
/** A column's name agreeing with its count: "1 centaine", "3 centaines", "1 unité de mille". */
function colName(c: string, d: number): string { return d < 2 ? PV_COLS[c].name.replace(/^(\w+)s\b/, '$1') : PV_COLS[c].name; }
/** "4 dizaines de mille, 7 unités de mille et 5 unités" (non-zero columns only). */
function words(milli: number, cols: string[]): string {
  const parts = cols.map(c => [c, digitAt(milli, c)] as const).filter(([, d]) => d).map(([c, d]) => `${d} ${colName(c, d)}`);
  return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' et ' + parts.at(-1) : parts[0] || '0';
}
/** The digits written without their empty places (the pv-skip error): 4 070 -> 47. */
function skipZeros(n: number): number | null { const s = String(n).replace(/0/g, ''); return s && s !== String(n) ? Number(s) : null; }
/** A whole number with a 0 inside it at least half the time. */
function bigNumber(lo: number, hi: number, zero: boolean): number {
  for (;;) {
    const n = ri(lo, hi), s = String(n);
    if (zero && !/0/.test(s.slice(1, -1))) continue;
    if (!zero && /0/.test(s)) continue;
    return n;
  }
}
const COLS6 = ['cm', 'dm', 'um', 'c', 'd', 'u'];
function intCols(n: number): string[] { const len = String(n).length; return COLS6.slice(6 - Math.max(len, 4)); }
const SUP: Record<number, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³' };
const sayNum = (milli: number) => fmtM(milli);

// ---------- column helpers ----------
const COLNAME = ['Unités', 'Dizaines', 'Centaines', 'Unités de mille', 'Dizaines de mille', 'Centaines de mille'];
/** Column addition without carrying (the carry-forgot error). */
function addNoCarry(a: number, b: number): number { let r = 0, p = 1; while (a || b) { r += ((a % 10 + b % 10) % 10) * p; a = Math.floor(a / 10); b = Math.floor(b / 10); p *= 10; } return r; }
/** Column multiplication by one digit without carrying. */
function mulNoCarry(a: number, d: number): number { let r = 0, p = 1; while (a) { r += ((a % 10) * d % 10) * p; a = Math.floor(a / 10); p *= 10; } return r; }
function hasCarry(a: number, b: number): boolean { while (a || b) { if (a % 10 + b % 10 >= 10) return true; a = Math.floor(a / 10); b = Math.floor(b / 10); } return false; }

/** Guided steps for column addition, right to left. */
function addSteps(a: number, b: number): Step[] {
  const steps: Step[] = []; let carry = 0, i = 0, x = a, y = b;
  while (x || y || carry) {
    const da = x % 10, db = y % 10, sum = da + db + carry;
    if (!(x || y) && carry) break;
    steps.push({ prompt: `${COLNAME[i]} : ${da} + ${db}${carry ? ` + ${carry} (retenue)` : ''} = ?`, answer: String(sum), done: `${COLNAME[i]} : ${da} + ${db}${carry ? ` + ${carry}` : ''} = ${sum}${sum >= 10 ? ` → j’écris ${sum % 10}, je retiens 1.` : ` → j’écris ${sum}.`}` });
    carry = sum >= 10 ? 1 : 0; x = Math.floor(x / 10); y = Math.floor(y / 10); i++;
  }
  steps.push({ prompt: `Le total est…`, answer: String(a + b), done: `${nf(a)} + ${nf(b)} = ${nf(a + b)}` });
  return steps;
}
/** Guided steps for a number × one digit, right to left. */
function mulSteps1(a: number, d: number): Step[] {
  const steps: Step[] = []; let carry = 0, i = 0, x = a;
  while (x) {
    const da = x % 10, prod = da * d + carry;
    steps.push({ prompt: `${COLNAME[i]} : ${d} × ${da}${carry ? ` + ${carry} (retenue)` : ''} = ?`, answer: String(prod), done: `${COLNAME[i]} : ${d} × ${da}${carry ? ` + ${carry}` : ''} = ${prod}${prod >= 10 && Math.floor(x / 10) ? ` → j’écris ${prod % 10}, je retiens ${Math.floor(prod / 10)}.` : ` → j’écris ${prod}.`}` });
    carry = Math.floor(x / 10) ? Math.floor(prod / 10) : 0; x = Math.floor(x / 10); i++;
  }
  steps.push({ prompt: `Le produit est…`, answer: String(a * d), done: `${nf(a)} × ${d} = ${nf(a * d)}` });
  return steps;
}
/** Guided steps for a number × a 2-digit number: two partial products, then add. */
function mulSteps2(a: number, b: number): Step[] {
  const bu = b % 10, bt = Math.floor(b / 10), p1 = a * bu, p2 = a * bt * 10;
  return [
    { prompt: `Premier produit : ${nf(a)} × ${bu} = ?`, answer: String(p1), done: `${nf(a)} × ${bu} = ${nf(p1)}` },
    { prompt: `Deuxième produit : ${nf(a)} × ${bt * 10} = ? <span class="small">(écris d’abord un 0 dans les unités)</span>`, answer: String(p2), done: `${nf(a)} × ${bt * 10} = ${nf(p2)} (un 0 dans les unités, puis ${nf(a)} × ${bt})` },
    { prompt: `Additionne les deux produits : ${nf(p1)} + ${nf(p2)} = ?`, answer: String(p1 + p2), done: `${nf(p1)} + ${nf(p2)} = ${nf(p1 + p2)}` },
  ];
}

// ---------- story problems ----------
interface DecStory { text: string; say?: string; ans: number; op: '×' | '+'; steps: Step[]; ds: { v: number | null; mis: string | null }[]; explain: string; visual?: string; /** The explanation's picture when it shows more than the question's. */ xvisual?: string; two: boolean }
function decStory(kind: number): DecStory {
  const P = pick(NAMES), N = P.n, il = P.p;
  const a = ri(11, 49) * 100, k = ri(12, 36) * 100; // 1,1..4,9 and 1,2..3,6 (tenths)
  const ak = (a * k) / M; // exact: tenths × tenths = hundredths
  const div = (x: number, y: number) => (x * M) % y === 0 ? (x * M) / y : null;
  const opChoice = (op: string): Step => ({ prompt: 'Quelle opération faut-il faire?', answer: op, choices: ['+', '−', '×', '÷'], done: `On fait ${op === '×' ? 'une multiplication' : op === '+' ? 'une addition' : op === '−' ? 'une soustraction' : 'une division'}.` });
  switch (kind) {
    case 0: return { // fois plus
      text: `Lundi, ${N} parcourt ${fmtM(a)} km à vélo. Mardi, ${il} parcourt ${fmtM(k)} fois plus de kilomètres. Combien de kilomètres ${N} parcourt-${il} mardi?`,
      ans: ak, op: '×', two: false, steps: [opChoice('×'), { prompt: `${fmtM(a)} × ${fmtM(k)} = ?`, answer: canon(ak), decimal: true, done: `${fmtM(a)} × ${fmtM(k)} = ${fmtM(ak)} km` }],
      ds: [{ v: div(a, k), mis: 'fois-moins' }, { v: a + k, mis: 'op-add-for-mult' }, { v: ak * 10, mis: 'dec-point' }, { v: ak % 10 === 0 ? ak / 10 : null, mis: 'dec-point' }],
      explain: `« ${fmtM(k)} fois plus » : mardi, c’est ${fmtM(k)} fois la distance de lundi. ${fmtM(a)} × ${fmtM(k)} = ${fmtM(ak)} km.`, visual: vTimesBars(fmtM(a), '?', fmtM(k), 'lundi', 'mardi') };
    case 1: return { // fois plus, total of two days
      text: `Lundi, ${N} parcourt ${fmtM(a)} km à vélo. Mardi, ${il} parcourt ${fmtM(k)} fois plus de kilomètres. Combien de kilomètres ${N} a-t-${il} parcourus en tout durant les 2 jours?`,
      ans: a + ak, op: '+', two: true,
      steps: [opChoice('×'), { prompt: `Mardi : ${fmtM(a)} × ${fmtM(k)} = ?`, answer: canon(ak), decimal: true, done: `Mardi : ${fmtM(ak)} km` }, { prompt: `En tout : ${fmtM(a)} + ${fmtM(ak)} = ?`, answer: canon(a + ak), decimal: true, done: `En tout : ${fmtM(a + ak)} km` }],
      ds: [{ v: ak, mis: 'story-op' }, { v: a + k, mis: 'op-add-for-mult' }, { v: (a + ak) * 10, mis: 'dec-point' }],
      explain: `Deux étapes : mardi, ${fmtM(a)} × ${fmtM(k)} = ${fmtM(ak)} km. En tout : ${fmtM(a)} + ${fmtM(ak)} = ${fmtM(a + ak)} km.`, visual: vTimesBars(fmtM(a), '?', fmtM(k), 'lundi', 'mardi'), xvisual: vTimesBars(fmtM(a), fmtM(ak), fmtM(k), 'lundi', 'mardi') };
    case 2: { // money
      const p = ri(105, 189) * 10, l = ri(205, 489) * 100, c = (p * l) / M;
      return { text: `Un litre d’essence coûte ${fmtM(p, 2)} $. Un bateau consomme ${fmtM(l)} L pendant une compétition. Combien coûte l’essence?`,
        ans: c, op: '×', two: false, steps: [opChoice('×'), { prompt: `${fmtM(l)} × ${fmtM(p, 2)} = ?`, answer: canon(c), decimal: true, done: `${fmtM(l)} × ${fmtM(p, 2)} = ${fmtM(c)} $` }],
        ds: [{ v: c * 10, mis: 'dec-point' }, { v: c % 10 === 0 ? c / 10 : null, mis: 'dec-point' }, { v: p + l, mis: 'op-add-for-mult' }],
        explain: `Chaque litre coûte ${fmtM(p, 2)} $, et il y a ${fmtM(l)} litres : ${fmtM(l)} × ${fmtM(p, 2)} = ${fmtM(c)} $.`, visual: vRateBars('1 L', fmtM(p, 2), `${fmtM(l)} L`, '$') };
    }
    case 3: { // fois moins
      const x = ri(105, 290) * 100, kk = pick([1500, 2000, 2500, 3000]), last = (x * kk) / M;
      return { text: `Cette année, les participants d’un festival ont bu ${fmtM(x)} L d’eau. C’est ${fmtM(kk)} fois moins que l’an dernier. Combien de litres d’eau ont été bus l’an dernier?`,
        ans: last, op: '×', two: false, steps: [{ prompt: 'Quelle année a la plus grande quantité?', answer: 'L’an dernier', choices: ['Cette année', 'L’an dernier'], done: '« Fois moins » cette année : c’est l’an dernier qui est le plus grand.' }, opChoice('×'), { prompt: `${fmtM(x)} × ${fmtM(kk)} = ?`, answer: canon(last), decimal: true, done: `${fmtM(x)} × ${fmtM(kk)} = ${fmtM(last)} L` }],
        ds: [{ v: div(x, kk), mis: 'fois-moins' }, { v: x + kk, mis: 'op-add-for-mult' }, { v: last * 10, mis: 'dec-point' }],
        explain: `« ${fmtM(kk)} fois moins que l’an dernier » : l’an dernier, c’était ${fmtM(kk)} fois plus. ${fmtM(x)} × ${fmtM(kk)} = ${fmtM(last)} L.`, visual: vTimesBars(fmtM(x), '?', fmtM(kk), 'cette année', 'l’an dernier') };
    }
    case 4: { // time
      const d = ri(25, 120) * 100, m = ri(41, 79) * 100, t = (d * m) / M;
      return { text: `${N} court ${fmtM(d)} km. ${il === 'il' ? 'Il' : 'Elle'} parcourt 1 km en ${fmtM(m)} minutes. Combien de minutes ${il === 'il' ? 'lui' : 'lui'} faut-il pour tout le parcours?`,
        ans: t, op: '×', two: false, steps: [opChoice('×'), { prompt: `${fmtM(d)} × ${fmtM(m)} = ?`, answer: canon(t), decimal: true, done: `${fmtM(d)} × ${fmtM(m)} = ${fmtM(t)} minutes` }],
        ds: [{ v: d + m, mis: 'op-add-for-mult' }, { v: t * 10, mis: 'dec-point' }, { v: t % 10 === 0 ? t / 10 : null, mis: 'dec-point' }],
        explain: `Chaque kilomètre prend ${fmtM(m)} minutes, et il y a ${fmtM(d)} km : ${fmtM(d)} × ${fmtM(m)} = ${fmtM(t)} minutes.`, visual: vRateBars('1 km', fmtM(m), `${fmtM(d)} km`, 'min') };
    }
    case 5: { // hours and minutes as a decimal, two steps
      const h = ri(2, 5), r = ri(4510, 8950) * 10, hrs = h * M + 500, c = (r * hrs) / M;
      return { text: `Un installateur travaille ${h} heures 30 minutes. Son tarif est de ${fmtM(r, 2)} $ l’heure. Combien coûte son travail?`,
        ans: c, op: '×', two: true, steps: [{ prompt: `${h} heures 30 minutes, c’est combien d’heures? (30 minutes = une demi-heure)`, answer: canon(hrs), decimal: true, done: `${h} h 30 min = ${fmtM(hrs)} h` }, { prompt: `${fmtM(hrs)} × ${fmtM(r, 2)} = ?`, answer: canon(c), decimal: true, done: `${fmtM(hrs)} × ${fmtM(r, 2)} = ${fmtM(c)} $` }],
        ds: [{ v: (r * (h * M + 300)) / M, mis: null }, { v: c * 10, mis: 'dec-point' }, { v: r * h, mis: null }],
        explain: `30 minutes, c’est une demi-heure : ${h} h 30 min = ${fmtM(hrs)} h. ${fmtM(hrs)} × ${fmtM(r, 2)} = ${fmtM(c)} $.`, visual: vRateBars('1 h', fmtM(r, 2), `${h} h 30 min`, '$') };
    }
    default: { // mixed number
      const g = ri(105, 189) * 100, c = (g * 1500) / M;
      return { text: `Un verre de jus contient ${fmtM(g)} g de sucre. ${N} boit 1 ${fr(1, 2)} verre. Combien de grammes de sucre ${N} consomme-t-${il}?`, say: `Un verre de jus contient ${fmtM(g)} grammes de sucre. ${N} boit un verre et demi. Combien de grammes de sucre ${N} consomme-t-${il}?`,
        ans: c, op: '×', two: false, steps: [{ prompt: `1 ${fr(1, 2)} en nombre décimal, c’est…`, answer: '1,5', decimal: true, done: `1 ${fr(1, 2)} = 1,5` }, { prompt: `${fmtM(g)} × 1,5 = ?`, answer: canon(c), decimal: true, done: `${fmtM(g)} × 1,5 = ${fmtM(c)} g` }],
        ds: [{ v: (g * 1200) / M, mis: null }, { v: c * 10, mis: 'dec-point' }, { v: g + 1500, mis: 'op-add-for-mult' }],
        explain: `1 ${fr(1, 2)} verre, c’est 1,5 verre. ${fmtM(g)} × 1,5 = ${fmtM(c)} g.`, visual: vRateBars('1 verre', fmtM(g), `1 ${fr(1, 2)} verre`, 'g') };
    }
  }
}

export const GEN6: Record<string, Gen[]> = {
  grandsnombres: [
    e => {
      const n = e ? bigNumber(1001, 99999, random() < .5) : bigNumber(100001, 999999, random() < .6), cols = intCols(n);
      const th = Math.floor(n / 1000), rest = n % 1000;
      return Q({ prompt: `Forme <b>${nf(n)}</b> dans le tableau de numération.`, kind: 'build', build: { type: 'pvchart', cols, target: n * M },
        hint: { text: `Lis le nombre par tranches de trois chiffres : ${th} mille ${rest}. Chaque chiffre va dans sa colonne, et 0 dans une colonne vide.` },
        explain: { text: `${nf(n)}, c’est ${words(n * M, cols)}.`, visual: vPV(cols, n * M) } });
    },
    e => {
      if (random() < .5) {
        const n = e ? bigNumber(10001, 99999, true) : bigNumber(100001, 999999, true), cols = intCols(n);
        return Q({ prompt: 'Quel nombre le tableau de numération montre-t-il?', kind: 'mc', visual: vPV(cols, n * M, { dots: true }),
          ...intOpts(n, [{ v: skipZeros(n), mis: 'pv-skip' }, { v: n * 10 <= 9999999 ? n * 10 : null, mis: 'place-face' }, { v: Math.floor(n / 10), mis: 'place-face' }]),
          hint: { text: 'Compte les jetons de chaque colonne. Une colonne vide, c’est un 0.' },
          explain: { text: `${words(n * M, cols)}, ça fait ${nf(n)}.`, visual: vPV(cols, n * M) } });
      }
      const n = e ? bigNumber(10001, 99999, false) : bigNumber(100001, 999999, false), cols = intCols(n), col = pick(cols.slice(0, -2)), d = digitAt(n * M, col), val = d * 10 ** PV_COLS[col].pow;
      return Q({ prompt: `Combien vaut le chiffre <b>${d}</b> dans <b>${nf(n)}</b>?`, kind: 'mc', visual: vPV(cols, n * M, { hi: col }),
        ...intOpts(val, [{ v: d, mis: 'place-face' }, { v: val * 10, mis: 'place-face' }, { v: val / 10, mis: 'place-face' }]),
        hint: { text: 'Regarde dans quelle colonne est le chiffre.' },
        explain: { text: `Le ${d} est dans la colonne des ${PV_COLS[col].name} : il vaut ${nf(val)}.`, visual: vPV(cols, n * M, { hi: col }) } });
    },
    e => {
      const n = e ? bigNumber(10001, 99999, true) : bigNumber(100001, 999999, true), cols = intCols(n);
      const terms = shuffle(cols.filter(c => digitAt(n * M, c)).map(c => `${digitAt(n * M, c)} ${colName(c, digitAt(n * M, c))}`));
      return Q({ prompt: `Écris le nombre : ${terms.join(' + ')}`, say: `Écris le nombre : ${terms.join(' plus ')}`, kind: 'pad', answer: canon(n * M),
        padMis: ipm([[skipZeros(n), 'pv-skip'], [n + 1, 'off-by-one'], [n - 1, 'off-by-one']], n),
        hint: { text: 'Écris un chiffre par colonne, des centaines de mille aux unités. Mets 0 dans les colonnes qui manquent.', visual: vPV(cols, null) },
        explain: { text: `${terms.join(' + ')} = ${nf(n)}. Les colonnes vides reçoivent un 0.`, visual: vPV(cols, n * M) } });
    },
  ],
  puissances: [
    e => {
      // start values whose shifted result stays within unités de mille … millièmes
      let s: number, k: number;
      for (;;) {
        k = e ? pick([1, 2]) : pick([1, 2, 3, -1, -2]);
        s = e ? ri(2, 99) * M : pick([ri(11, 99) * 100, ri(2, 99) * M, ri(101, 999) * 10]);
        const t = k > 0 ? s * P10[k] : s / P10[-k];
        if (Number.isInteger(t) && t >= 1 && t < 10000 * M) break;
      }
      const t = k > 0 ? s * P10[k] : s / P10[-k], op = k > 0 ? `× ${P10[k]}` : `÷ ${P10[-k]}`;
      return Q({ prompt: `Fais <b>${fmtM(s)} ${op}</b> : clique sur × 10 ou ÷ 10 pour faire glisser les chiffres dans le tableau.`, say: `Fais ${sayNum(s)} ${k > 0 ? 'fois' : 'divisé par'} ${P10[Math.abs(k)]}.`,
        kind: 'build', build: { type: 'shift', cols: ['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], start: s, k, op },
        hint: { text: `× 10 fait glisser chaque chiffre d’une colonne vers la gauche; ÷ 10, d’une colonne vers la droite. ${op} : ${Math.abs(k)} ${plural(Math.abs(k), 'colonne')}.` },
        explain: { text: `${fmtM(s)} ${op} = ${fmtM(t)} : chaque chiffre a glissé de ${Math.abs(k)} ${plural(Math.abs(k), 'colonne')} vers la ${k > 0 ? 'gauche' : 'droite'}.`, visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], t) } });
    },
    e => {
      let s: number, k: number, t: number;
      for (;;) {
        k = e ? pick([1, 2]) : pick([1, 2, 3, -1, -2]);
        s = pick([ri(11, 99) * 100, ri(2, 99) * M, ri(101, 999) * 10]);
        t = k > 0 ? s * P10[k] : s / P10[-k];
        if (Number.isInteger(t) && t >= 1 && t < 10000 * M) break;
      }
      const op = k > 0 ? `multiplies par ${P10[k]}` : `divises par ${P10[-k]}`, one = k > 0 ? t / 10 : t * 10, back = k > 0 ? s / P10[k] : s * P10[-k];
      return Q({ prompt: `Le tableau montre <b>${fmtM(s)}</b>. Si tu le ${op}, quel nombre obtiens-tu?`, kind: 'mc', visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], s),
        ...decOpts(t, [{ v: Math.abs(k) > 1 ? one : null, mis: 'dec-point' }, { v: Number.isInteger(back) ? back : null, mis: 'dec-point' }, { v: k > 0 ? t * 10 : t / 10, mis: 'dec-point' }]),
        hint: { text: `${k > 0 ? 'Multiplier' : 'Diviser'} par ${P10[Math.abs(k)]}, c’est faire glisser chaque chiffre de ${Math.abs(k)} ${plural(Math.abs(k), 'colonne')} vers la ${k > 0 ? 'gauche' : 'droite'}.` },
        explain: { text: `${fmtM(s)} ${k > 0 ? '×' : '÷'} ${P10[Math.abs(k)]} = ${fmtM(t)}.`, visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], t) } });
    },
    e => {
      if (random() < .4) {
        const d = ri(2, 9), p = e ? pick([1, 2]) : pick([0, 1, 2, 3]), v = d * P10[p];
        return Q({ prompt: eq(`${d} × 10${SUP[p]}`), say: `Combien font ${d} fois 10 exposant ${p}?`, kind: 'pad', answer: canon(v * M),
          padMis: ipm([[d * 10 * p || null, 'place-face'], [v * 10, 'dec-point'], [p ? v / 10 : null, 'dec-point']], v),
          hint: { text: `10${SUP[p]}, c’est 1 suivi de ${p} ${plural(p, 'zéro')}${p ? ` : ${P10[p]}` : ' : 1'}.` }, explain: { text: `10${SUP[p]} = ${P10[p]}, donc ${d} × 10${SUP[p]} = ${nf(v)}.` } });
      }
      let s: number, k: number, t: number;
      for (;;) {
        k = e ? pick([1, 2, 3]) : pick([1, 2, 3, -1, -2, -3]);
        s = e ? ri(11, 99) * 100 : pick([ri(11, 99) * 100, ri(2, 999) * M, ri(101, 999) * 10]);
        t = k > 0 ? s * P10[k] : s / P10[-k];
        if (Number.isInteger(t) && t >= 1 && t < 100000 * M) break;
      }
      const sym = k > 0 ? '×' : '÷';
      return Q({ prompt: eq(`${fmtM(s)} ${sym} ${P10[Math.abs(k)]}`), say: `Combien font ${sayNum(s)} ${k > 0 ? 'fois' : 'divisé par'} ${P10[Math.abs(k)]}?`, kind: 'pad', decimal: true, answer: canon(t),
        padMis: dpm([[k > 0 ? t / 10 : t * 10, 'dec-point'], [k > 0 ? t * 10 : t / 10, 'dec-point'], [k > 0 ? s / P10[k] : s * P10[-k], 'dec-point']], t),
        hint: { text: `Fais glisser chaque chiffre de ${Math.abs(k)} ${plural(Math.abs(k), 'colonne')} vers la ${k > 0 ? 'gauche' : 'droite'}.`, visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], s) },
        explain: { text: `${fmtM(s)} ${sym} ${P10[Math.abs(k)]} = ${fmtM(t)}.`, visual: vPV(['dm', 'um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], t) } });
    },
  ],
  decimaux: [
    e => {
      const cols = e ? ['u', 'ds', 'cs'] : ['d', 'u', 'ds', 'cs', 'ms'];
      let v: number; do { v = e ? ri(101, 999) * 10 : ri(10001, 99999); } while (!e && v % 10 === 0);
      return Q({ prompt: `Forme <b>${fmtM(v)}</b> dans le tableau de numération.`, kind: 'build', build: { type: 'pvchart', cols, target: v },
        hint: { text: 'Avant la virgule : les unités (et les dizaines). Après la virgule : d’abord les dixièmes, puis les centièmes, puis les millièmes.' },
        explain: { text: `${fmtM(v)}, c’est ${words(v, cols)}.`, visual: vPV(cols, v) } });
    },
    e => {
      if (random() < .55) {
        let k: number; do { k = ri(e ? 11 : 3, 97); } while (k % 10 === 0);
        const swapped = (k % 10) * 10 + Math.floor(k / 10);
        return Q({ prompt: 'La grille entière vaut 1. Quel nombre décimal la partie coloriée montre-t-elle?', kind: 'mc', visual: vDecGrid(k),
          ...decOpts(k * 10, [{ v: k * M, mis: 'dec-point' }, { v: k * 100, mis: 'dec-point' }, { v: swapped !== k && swapped < 100 ? swapped * 10 : null, mis: 'place-swap' }, { v: k, mis: 'dix-diz' }]),
          hint: { text: 'Chaque petit carré, c’est un centième. Chaque rangée de 10, c’est un dixième.' },
          explain: { text: `${k} carrés sur 100, c’est ${k} centièmes : ${fmtM(k * 10)}. (${Math.floor(k / 10)} ${plural(Math.floor(k / 10), 'rangée')}, c’est ${Math.floor(k / 10)} ${plural(Math.floor(k / 10), 'dixième')}.)`, visual: vDecGrid(k) } });
      }
      // compare: the one with more digits is smaller
      const t = ri(e ? 3 : 2, 8), shortV = t * 100, longV = (t - 1) * 100 + ri(e ? 1 : 11, e ? 9 : 99) * (e ? 10 : 1);
      const first = random() < .5;
      return Q({ prompt: `Lequel est le plus grand : <b>${fmtM(first ? shortV : longV)}</b> ou <b>${fmtM(first ? longV : shortV)}</b>?`, kind: 'mc',
        visual: vPV(['u', 'ds', 'cs', 'ms'], first ? shortV : longV) + vPV(['u', 'ds', 'cs', 'ms'], first ? longV : shortV),
        options: [...shuffle([{ value: canon(shortV), label: fmtM(shortV), mis: null }, { value: canon(longV), label: fmtM(longV), mis: 'longer-larger' }]), { value: 'same', label: 'Ils sont égaux', mis: null }], answer: canon(shortV),
        hint: { text: 'Compare d’abord les dixièmes. Tu peux ajouter des zéros pour avoir autant de chiffres après la virgule.' },
        explain: { text: `${fmtM(shortV)} = ${fmtM(shortV, dpOf(longV))}. On compare ${fmtM(shortV, dpOf(longV))} et ${fmtM(longV)} : ${t} dixièmes, c’est plus que ${t - 1} ${plural(t - 1, 'dixième')}. ${fmtM(shortV)} est le plus grand.`, visual: vPV(['u', 'ds', 'cs', 'ms'], shortV) + vPV(['u', 'ds', 'cs', 'ms'], longV) } });
    },
    e => {
      if (random() < .35) {
        // regrouping: 825 dixièmes = 82,5
        const unit = pick(e ? ['ds', 'cs'] : ['ds', 'cs', 'ms']), n = ri(e ? 11 : 101, e ? 99 : 999), v = colVal(unit, n);
        return Q({ prompt: `<b>${n} ${colName(unit, n)}</b>, c’est quel nombre?`, say: `${n} ${colName(unit, n)}, c’est quel nombre?`, kind: 'pad', decimal: true, answer: canon(v),
          padMis: dpm([[n * M, 'dec-point'], [v * 10, 'dec-point'], [v % 10 === 0 ? v / 10 : null, 'dec-point'], [unit === 'ds' ? n * 10 * M : unit === 'cs' ? n * 100 * M : null, 'dix-diz']], v),
          hint: { text: `10 ${PV_COLS[unit].name} font ${unit === 'ds' ? '1 unité' : unit === 'cs' ? '1 dixième' : '1 centième'}.` },
          explain: { text: `${n} ${PV_COLS[unit].name} = ${fmtM(v)}.`, visual: vPV(['c', 'd', 'u', 'ds', 'cs', 'ms'], v) } });
      }
      // decomposition in mixed forms (workbook p. 100, ex. 7)
      const pool = e ? ['d', 'u', 'ds', 'cs'] : ['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'];
      const chosen = shuffle(pool).slice(0, e ? 3 : 4); const digits: Record<string, number> = {};
      for (const c of chosen) digits[c] = ri(1, 9);
      const v = chosen.reduce((s, c) => s + colVal(c, digits[c]), 0);
      const form = (c: string, d: number): string => {
        const pw = PV_COLS[c].pow, f = random();
        if (pw >= 0) return f < .4 && pw > 0 ? `(${d} × 10${SUP[pw]})` : f < .7 ? `${d} ${colName(c, d)}` : `(${d} × ${P10[pw]})`;
        return f < .45 ? `(${d} × ${fr(1, P10[-pw])})` : f < .75 ? `${d} ${colName(c, d)}` : fmtM(colVal(c, d));
      };
      const terms = shuffle(chosen).map(c => form(c, digits[c]));
      const swap = (m: Record<string, string>) => chosen.reduce((s, c) => s + colVal(m[c] || c, digits[c]), 0);
      return Q({ prompt: `Trouve le nombre : ${terms.join(' + ')} = ?`, say: `Trouve le nombre : ${terms.map(t => t.replace(/<[^>]+>/g, ' ')).join(' plus ')}`, kind: 'pad', decimal: true, answer: canon(v),
        padMis: dpm([[swap({ ds: 'd', cs: 'c', d: 'ds', c: 'cs' }), 'dix-diz']], v),
        hint: { text: 'Place chaque morceau dans sa colonne du tableau de numération, puis lis le nombre. Attention : dizaines avant la virgule, dixièmes après.', visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], null) },
        explain: { text: `${terms.join(' + ')} = ${fmtM(v)}.`, visual: vPV(['um', 'c', 'd', 'u', 'ds', 'cs', 'ms'], v) } });
    },
  ],
  arrondir: [
    e => {
      const A = ri(e ? 1 : 10, e ? 9 : 99), d = ri(1, 9), t = A * 10 + d, ans = d >= 5 ? A + 1 : A;
      // F-23.AC-2: hands-on is the place-value chart. She builds the number, then rounds it by its tenths digit.
      return Q({ prompt: `Forme <b>${fmtM(t * 100)}</b> dans le tableau de numération.`, kind: 'build', build: { type: 'pvchart', cols: ['d', 'u', 'ds'], target: t * 100 },
        followup: { prompt: `Regarde les dixièmes. Arrondi à l’unité près, ${fmtM(t * 100)} donne…`, ...intOpts(ans, [{ v: ans === A ? A + 1 : A, mis: null }, { v: A + 2, mis: null }]) },
        hint: { text: `Les dixièmes décident : 5 dixièmes ou plus, on arrondit vers le haut; moins de 5, on garde ${A}.` },
        explain: { text: `${fmtM(t * 100)} est plus près de ${ans} que de ${ans === A ? A + 1 : A}${d === 5 ? ' (au milieu, on arrondit vers le haut)' : ''}. Arrondi à l’unité : ${ans}.`, visual: vLine({ min: A * 10, max: A * 10 + 10, labels: [A * 10, A * 10 + 5, A * 10 + 10], marker: t, scale: 10 }) } });
    },
    e => {
      const unit = e ? 100 : 1000, lo = ri(e ? 1 : 10, e ? 9 : 98) * unit, v = lo + ri(1, 9) * unit / 10 + ri(1, unit / 10 - 1), ans = v - lo >= unit / 2 ? lo + unit : lo;
      return Q({ prompt: `Arrondis <b>${nf(v)}</b> à la ${e ? 'centaine' : 'unité de mille'} près.`, kind: 'mc', visual: vLine({ min: lo, max: lo + unit, tick: unit / 10, labels: [lo, lo + unit / 2, lo + unit], arrow: v }),
        ...intOpts(ans, [{ v: ans === lo ? lo + unit : lo, mis: null }, { v: Math.round(v / (unit / 10)) * (unit / 10), mis: 'place-face' }, { v: lo + 2 * unit, mis: null }]),
        hint: { text: `Regarde si ${nf(v)} est avant ou après le milieu, ${nf(lo + unit / 2)}.` },
        explain: { text: `${nf(v)} est ${ans === lo ? 'avant' : 'après'} le milieu (${nf(lo + unit / 2)}) : on arrondit à ${nf(ans)}.`, visual: vLine({ min: lo, max: lo + unit, tick: unit / 10, labels: [lo, lo + unit / 2, lo + unit], arrow: v }) } });
    },
    e => {
      if (random() < .5) {
        const place = e ? pick(['unité', 'dixième']) : pick(['unité', 'dixième', 'centième']), step = place === 'unité' ? M : place === 'dixième' ? 100 : 10;
        let v: number; do { v = ri(e ? 1001 : 10001, e ? 9999 : 99999); } while (v % step === 0 || v % 10 === 0);
        const ans = Math.round(v / step) * step, down = Math.floor(v / step) * step, other = ans === down ? down + step : down;
        return Q({ prompt: `Arrondis <b>${fmtM(v)}</b> au ${place} près.`, say: `Arrondis ${sayNum(v)} au ${place} près.`, kind: 'pad', decimal: true, answer: canon(ans),
          padMis: dpm([[other, 'off-by-one'], [Math.round(v / (step / 10 || 1)) * (step / 10 || 1), 'place-face']], ans),
          hint: { text: `Regarde le chiffre juste après la position des ${place}s : 5 ou plus, on arrondit vers le haut.` },
          explain: { text: `Le chiffre après les ${place}s est ${Math.floor((v % step) / (step / 10))} : on arrondit ${ans > down ? 'vers le haut' : 'vers le bas'}. ${fmtM(v)} ≈ ${fmtM(ans)}.` } });
      }
      // approximation of a product, each factor to the nearest unit
      const a = ri(e ? 21 : 101, e ? 99 : 999) * 100, b = ri(11, 99) * 100;
      const ra = Math.round(a / M), rb = Math.round(b / M), est = ra * rb;
      return Q({ prompt: `Fais une approximation de <b>${fmtM(a)} × ${fmtM(b)}</b> : arrondis chaque nombre à l’unité près, puis multiplie.`, say: `Fais une approximation de ${sayNum(a)} fois ${sayNum(b)}.`, kind: 'pad', answer: canon(est * M),
        padMis: ipm([[ra + rb, 'op-add-for-mult'], [est * 10, 'dec-point']], est),
        hint: { text: `${fmtM(a)} ≈ ${ra} et ${fmtM(b)} ≈ ${rb}.` }, explain: { text: `${fmtM(a)} ≈ ${ra}, ${fmtM(b)} ≈ ${rb}. ${ra} × ${rb} = ${nf(est)}. Le vrai produit sera proche de ${nf(est)}.` } });
    },
  ],
  addcol: [
    e => {
      let a: number, b: number; do { a = ri(e ? 105 : 10001, e ? 4999 : 499999); b = ri(e ? 105 : 1001, e ? 4999 : 499999); } while (!hasCarry(a, b));
      return Q({ prompt: `Additionne en colonnes : <b>${nf(a)} + ${nf(b)}</b>. Commence par les unités.`, say: `Additionne en colonnes : ${nf(a)} plus ${nf(b)}.`, kind: 'build', build: { type: 'steps', steps: addSteps(a, b) },
        visual: vColumns('+', [String(a), String(b)]),
        hint: { text: 'Une colonne à la fois, de droite à gauche. Si une colonne fait 10 ou plus, écris les unités et retiens 1 dans la colonne suivante.' },
        explain: { text: `${nf(a)} + ${nf(b)} = ${nf(a + b)}.`, visual: vColumns('+', [String(a), String(b)], { result: String(a + b) }) } });
    },
    e => {
      let a: number, b: number; do { a = ri(e ? 105 : 10001, e ? 4999 : 499999); b = ri(e ? 105 : 1001, e ? 4999 : 499999); } while (!hasCarry(a, b));
      const s = a + b;
      return Q({ prompt: 'Quelle est la somme?', kind: 'mc', visual: vColumns('+', [String(a), String(b)]),
        ...intOpts(s, [{ v: addNoCarry(a, b), mis: 'carry-forgot' }, { v: s - 10, mis: 'regroup' }, { v: s + 10, mis: 'regroup' }, { v: s - 100, mis: 'carry-forgot' }]),
        hint: { text: 'Additionne colonne par colonne, de droite à gauche, sans oublier les retenues.' },
        explain: { text: `${nf(a)} + ${nf(b)} = ${nf(s)}.`, visual: vColumns('+', [String(a), String(b)], { result: String(s) }) } });
    },
    e => {
      let a: number, b: number; do { a = ri(e ? 105 : 10001, e ? 9999 : 499999); b = ri(e ? 105 : 1001, e ? 9999 : 499999); } while (!hasCarry(a, b));
      const s = a + b;
      return Q({ prompt: eq(`${nf(a)} + ${nf(b)}`), say: `Combien font ${nf(a)} plus ${nf(b)}?`, kind: 'pad', answer: canon(s * M),
        padMis: ipm([[addNoCarry(a, b), 'carry-forgot'], [s - 10, 'regroup'], [s + 10, 'regroup'], [s - 1, 'off-by-one'], [s + 1, 'off-by-one']], s),
        hint: { text: 'Écris les nombres en colonnes, unités sous unités, puis additionne de droite à gauche.', visual: vColumns('+', [String(a), String(b)]) },
        explain: { text: `${nf(a)} + ${nf(b)} = ${nf(s)}.`, visual: vColumns('+', [String(a), String(b)], { result: String(s) }) } });
    },
  ],
  multcol: [
    e => {
      if (e || random() < .4) {
        const a = ri(e ? 23 : 112, e ? 98 : 989), d = ri(3, 9);
        return Q({ prompt: `Multiplie en colonnes : <b>${nf(a)} × ${d}</b>. Commence par les unités.`, say: `Multiplie en colonnes : ${nf(a)} fois ${d}.`, kind: 'build', build: { type: 'steps', steps: mulSteps1(a, d) },
          visual: vColumns('×', [String(a), String(d)]),
          hint: { text: `Multiplie ${d} par chaque chiffre, de droite à gauche. Ajoute la retenue après avoir multiplié.` },
          explain: { text: `${nf(a)} × ${d} = ${nf(a * d)}.`, visual: vColumns('×', [String(a), String(d)], { result: String(a * d) }) } });
      }
      const a = ri(21, 98), b = ri(21, 98);
      return Q({ prompt: `Multiplie en colonnes : <b>${a} × ${b}</b>.`, say: `Multiplie en colonnes : ${a} fois ${b}.`, kind: 'build', build: { type: 'steps', steps: mulSteps2(a, b) },
        visual: vColumns('×', [String(a), String(b)]),
        hint: { text: `D’abord ${a} × ${b % 10}. Ensuite ${a} × ${Math.floor(b / 10) * 10} : écris un 0 dans les unités. Puis additionne.` },
        explain: { text: `${a} × ${b % 10} = ${a * (b % 10)} et ${a} × ${Math.floor(b / 10) * 10} = ${nf(a * Math.floor(b / 10) * 10)}. Ensemble : ${nf(a * b)}.`, visual: vColumns('×', [String(a), String(b)], { partials: [String(a * (b % 10)), String(a * Math.floor(b / 10) * 10)], result: String(a * b) }) } });
    },
    e => {
      const a = ri(e ? 21 : 112, e ? 98 : 489), b = ri(e ? 3 : 21, e ? 9 : 79), p = a * b;
      const pz = b >= 10 ? a * (b % 10) + a * Math.floor(b / 10) : null;
      return Q({ prompt: `Quel est le produit de <b>${nf(a)} × ${b}</b>?`, kind: 'mc', visual: vColumns('×', [String(a), String(b)]),
        ...intOpts(p, [{ v: pz, mis: 'placeholder-zero' }, { v: b < 10 ? mulNoCarry(a, b) : null, mis: 'carry-forgot' }, { v: a + b, mis: 'op-add-for-mult' }, { v: p + a, mis: 'fact-neighbor' }]),
        hint: { text: b >= 10 ? `Deux produits : ${nf(a)} × ${b % 10} et ${nf(a)} × ${Math.floor(b / 10) * 10}. N’oublie pas le 0 du deuxième.` : 'Multiplie chaque chiffre, de droite à gauche, et ajoute les retenues.' },
        explain: { text: `${nf(a)} × ${b} = ${nf(p)}.`, visual: vColumns('×', [String(a), String(b)], b >= 10 ? { partials: [String(a * (b % 10)), String(a * Math.floor(b / 10) * 10)], result: String(p) } : { result: String(p) }) } });
    },
    e => {
      const a = ri(e ? 112 : 112, e ? 989 : 989), b = e ? ri(3, 9) : ri(21, 79), p = a * b;
      const pz = b >= 10 ? a * (b % 10) + a * Math.floor(b / 10) : null;
      return Q({ prompt: eq(`${nf(a)} × ${b}`), say: `Combien font ${nf(a)} fois ${b}?`, kind: 'pad', answer: canon(p * M),
        padMis: ipm([[pz, 'placeholder-zero'], [b < 10 ? mulNoCarry(a, b) : null, 'carry-forgot'], [a + b, 'op-add-for-mult'], [p + a, 'fact-neighbor'], [p - a, 'fact-neighbor']], p),
        hint: { text: b >= 10 ? `Fais ${nf(a)} × ${b % 10}, puis ${nf(a)} × ${Math.floor(b / 10) * 10} (avec un 0), puis additionne.` : 'Multiplie chaque chiffre, de droite à gauche, et ajoute les retenues.', visual: vColumns('×', [String(a), String(b)]) },
        explain: { text: `${nf(a)} × ${b} = ${nf(p)}.`, visual: vColumns('×', [String(a), String(b)], b >= 10 ? { partials: [String(a * (b % 10)), String(a * Math.floor(b / 10) * 10)], result: String(p) } : { result: String(p) }) } });
    },
  ],
  multdec: [
    e => {
      const { a, b, A, B, p } = decPair(e);
      const ra = Math.max(1, Math.round(a / M)), rb = Math.max(1, Math.round(b / M)), dps = dpOf(a) + dpOf(b);
      const steps: Step[] = [
        { prompt: `Approximation : ${fmtM(a)} ≈ ${ra} et ${fmtM(b)} ≈ ${rb}. Alors ${ra} × ${rb} = ?`, answer: String(ra * rb), done: `Approximation : environ ${nf(ra * rb)}` },
        { prompt: `Multiplie sans les virgules : ${nf(A)} × ${nf(B)} = ?`, answer: String(A * B), done: `${nf(A)} × ${nf(B)} = ${nf(A * B)}` },
        { prompt: `Combien de chiffres y a-t-il après la virgule dans ${fmtM(a)} et ${fmtM(b)}, en tout?`, answer: String(dps), done: `${dpOf(a)} + ${dpOf(b)} = ${dps} ${plural(dps, 'chiffre')} après la virgule` },
        { prompt: `Place la virgule : ${fmtM(a)} × ${fmtM(b)} = ?`, answer: canon(p), decimal: true, done: `${fmtM(a)} × ${fmtM(b)} = ${fmtM(p)} (proche de ${nf(ra * rb)} ✓)` },
      ];
      return Q({ prompt: `Multiplie <b>${fmtM(a)} × ${fmtM(b)}</b>, une étape à la fois.`, say: `Multiplie ${sayNum(a)} fois ${sayNum(b)}, une étape à la fois.`, kind: 'build', build: { type: 'steps', steps },
        visual: vColumns('×', [fmtM(a).replace(/ /g, ''), fmtM(b).replace(/ /g, '')]),
        hint: { text: 'L’approximation te dit à peu près où doit être la virgule.' },
        explain: { text: `${nf(A)} × ${nf(B)} = ${nf(A * B)}. Il y a ${dps} ${plural(dps, 'chiffre')} après la virgule en tout : ${fmtM(a)} × ${fmtM(b)} = ${fmtM(p)}. L’approximation (${nf(ra * rb)}) le confirme.` } });
    },
    e => {
      const { a, b, A, B, p } = decPair(e);
      return Q({ prompt: `${nf(A)} × ${nf(B)} = ${nf(A * B)}. Alors, combien font <b>${fmtM(a)} × ${fmtM(b)}</b>?`, say: `${nf(A)} fois ${nf(B)} égale ${nf(A * B)}. Alors, combien font ${sayNum(a)} fois ${sayNum(b)}?`, kind: 'mc',
        visual: vColumns('×', [fmtM(a).replace(/ /g, ''), fmtM(b).replace(/ /g, '')]),
        ...decOpts(p, [{ v: p * 10, mis: 'dec-point' }, { v: p % 10 === 0 ? p / 10 : null, mis: 'dec-point' }, { v: p * 100, mis: 'dec-point' }, { v: A * B * M, mis: 'dec-point' }]),
        hint: { text: `Fais une approximation : ${fmtM(a)} ≈ ${Math.max(1, Math.round(a / M))} et ${fmtM(b)} ≈ ${Math.max(1, Math.round(b / M))}.` },
        explain: { text: `Il y a ${dpOf(a) + dpOf(b)} ${plural(dpOf(a) + dpOf(b), 'chiffre')} après la virgule en tout, donc ${fmtM(a)} × ${fmtM(b)} = ${fmtM(p)}. L’approximation ${Math.max(1, Math.round(a / M))} × ${Math.max(1, Math.round(b / M))} = ${Math.max(1, Math.round(a / M)) * Math.max(1, Math.round(b / M))} le confirme.` } });
    },
    e => {
      const { a, b, p } = decPair(e);
      return Q({ prompt: eq(`${fmtM(a)} × ${fmtM(b)}`), say: `Combien font ${sayNum(a)} fois ${sayNum(b)}?`, kind: 'pad', decimal: true, answer: canon(p),
        padMis: dpm([[p * 10, 'dec-point'], [p % 10 === 0 ? p / 10 : null, 'dec-point'], [p * 100, 'dec-point'], [p % 100 === 0 ? p / 100 : null, 'dec-point'], [a + b, 'op-add-for-mult']], p),
        hint: { text: 'Multiplie sans les virgules, puis compte les chiffres après la virgule dans les deux nombres.' },
        explain: { text: `Sans les virgules : ${nf(a / 10 ** (3 - dpOf(a)))} × ${nf(b / 10 ** (3 - dpOf(b)))}. Avec ${dpOf(a) + dpOf(b)} ${plural(dpOf(a) + dpOf(b), 'chiffre')} après la virgule : ${fmtM(a)} × ${fmtM(b)} = ${fmtM(p)}.` } });
    },
  ],
  probdec: [
    e => {
      const s = decStory(pick(e ? [0, 2, 4, 6] : [1, 3, 5, 0, 2]));
      return Q({ prompt: s.text, say: s.say, kind: 'build', build: { type: 'steps', steps: s.steps }, visual: s.visual || null,
        hint: { text: 'Imagine la situation. Quelle quantité est la plus grande? Faut-il plusieurs étapes?' },
        explain: { text: s.explain, visual: s.xvisual || s.visual } });
    },
    e => {
      const s = decStory(pick(e ? [0, 2, 4, 6] : [1, 3, 5, 0, 2]));
      return Q({ prompt: s.text, say: s.say, kind: 'mc', visual: s.visual || null, ...decOpts(s.ans, s.ds),
        hint: { text: s.two ? 'Il y a deux étapes. Trouve d’abord la quantité qui manque, puis réponds à la question.' : 'Quelle opération? Fais une approximation pour vérifier.' },
        explain: { text: s.explain, visual: s.xvisual || s.visual } });
    },
    e => {
      const s = decStory(pick(e ? [0, 2, 4, 6] : [1, 3, 5, 0, 2, 6]));
      return Q({ prompt: s.text, say: s.say, kind: 'pad', decimal: true, answer: canon(s.ans), padMis: dpm(s.ds.map(d => [d.v, d.mis || 'story-op'] as [number | null, string]), s.ans),
        hint: { text: s.two ? 'Il y a deux étapes. Trouve d’abord la quantité qui manque.' : 'Quelle opération? Fais une approximation pour vérifier.' },
        explain: { text: s.explain, visual: s.xvisual || s.visual } });
    },
  ],
};

/** Two factors for decimal multiplication with a product of at most 3 decimals. Easy: decimal × whole digit. */
function decPair(e: boolean): { a: number; b: number; A: number; B: number; p: number } {
  for (;;) {
    const a = e ? ri(11, 99) * 100 : pick([ri(101, 999) * 100, ri(101, 999) * 10, ri(11, 99) * 100]);
    const b = e ? ri(2, 9) * M : pick([ri(11, 99) * 100, ri(2, 9) * M]);
    if (dpOf(a) === 0 || dpOf(a) + dpOf(b) > 3) continue; // a always has a comma (ri(11, 99) × 100 can land on a whole number)
    const A = a / 10 ** (3 - dpOf(a)), B = b / 10 ** (3 - dpOf(b)), p = (a * b) / M;
    if (!Number.isInteger(p)) continue;
    return { a, b, A, B, p };
  }
}
