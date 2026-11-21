// Visual builders. Each returns an HTML/SVG string; no DOM access.
// Geometry comes from design tokens (graphics section); colours come from CSS classes.
import { G, RADIUS_TENFRAME_CELL, viewBox } from '../design/tokens';
import { kit } from '../design/kit';
import { fmtM, nf } from './decimal';

export const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** French plural: singular for 0 and 1. */
export function plural(n: number, one: string, many?: string): string { return Math.abs(n) < 2 ? one : (many || one + 's'); }
export function fr(k: number, n: number): string { return `<span class="frac" aria-label="${k} sur ${n}"><span>${k}</span><span>${n}</span></span>`; }
export function eq(left: string, right?: string | number): string { return `<span class="eq">${left} = ${right === undefined ? '<span class="blank">?</span>' : right}</span>`; }
export function skip(step: number, count: number): string { const a: number[] = []; for (let i = 1; i <= count; i++) a.push(step * i); return a.join(', '); }
export function tensLabels(lo: number, hi: number): number[] { const l: number[] = []; for (let v = lo; v <= hi; v += 10) l.push(v); return l; }
export function rangeFor(a: number, b: number): [number, number] { const lo = Math.floor(Math.min(a, b) / 10) * 10; let hi = Math.ceil(Math.max(a, b) / 10) * 10; if (hi === lo) hi += 10; return [lo, hi]; }

const cellRadius = RADIUS_TENFRAME_CELL;
/** Counters (design/GRAPHICS.md rule 3): given = filled disc; added = ring with a centre dot. */
const given = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="c-given"/>`;
const added = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r - 2}" class="c-added"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.3).toFixed(1)}" class="c-added-dot"/>`;

/** One ten-frame. cells: 0 empty, 1 added, 2 given. tapBase: index of first cell when tappable. */
export function vTF(cells: number[], tapBase: number | null = null): string {
  const cs = G.tenFrame.cell, g = G.tenFrame.gap, w = 5 * cs + 6 * g, h = 2 * cs + 3 * g;
  let s = `<svg class="tf" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="10" class="tf-frame"/>`;
  for (let i = 0; i < 10; i++) {
    const r = Math.floor(i / 5), c = i % 5, x = g + c * (cs + g), y = g + r * (cs + g), st = cells[i]; const tap = tapBase !== null && st !== 2;
    s += `<g${tap ? ` data-act="cell" data-i="${tapBase! + i}" class="tf-tap"` : ''}><rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="${cellRadius}" class="tf-cell"/>`;
    if (st) s += (st === 2 ? given : added)(x + cs / 2, y + cs / 2, G.tenFrame.counterRadius);
    s += '</g>';
  }
  return s + '</svg>';
}
export function vFrames(n: number, frames: number | null = null, preset = 0): string {
  frames = frames || Math.max(1, Math.ceil(n / 10));
  let out = `<div class="tfwrap" role="img" aria-label="${n} jetons dans des cadres de dix">`;
  for (let f = 0; f < frames; f++) { const cells: number[] = []; for (let i = 0; i < 10; i++) { const idx = f * 10 + i; cells.push(idx < preset ? 2 : (idx < n ? (preset ? 1 : 2) : 0)); } out += vTF(cells); }
  return out + '</div>';
}
const FLAT = kit('block-hundred', 'flat'), ROD = kit('block-ten', 'rod'), CUBE = kit('block-one', 'cube');
export function vBlocks(h: number, t: number, o: number): string {
  const parts: string[] = []; if (h) parts.push(`${h} ${plural(h, 'centaine')}`); parts.push(`${t} ${plural(t, 'dizaine')}`); parts.push(`${o} ${plural(o, 'unité')}`);
  let s = `<div class="blocks" role="img" aria-label="${parts.join(', ')}">`;
  if (h) s += `<div class="bg">${FLAT.repeat(h)}</div>`;
  if (t) s += `<div class="bg">${ROD.repeat(t)}</div>`;
  if (o) s += `<div class="bg ones">${CUBE.repeat(o)}</div>`;
  if (!h && !t && !o) s += `<p class="muted">Pas encore de blocs</p>`;
  return s + '</div>';
}
export function vSum(a: number, b: number): string { return `<div class="sum">${vBlocks(Math.floor(a / 100), Math.floor(a / 10) % 10, a % 10)}<span class="and">et</span>${vBlocks(Math.floor(b / 100), Math.floor(b / 10) % 10, b % 10)}</div>`; }
export function vPlates(groups: number, each: number, e: string, { label = null, box = false }: { label?: string | null; box?: boolean } = {}): string {
  let s = `<div class="plates" role="img" aria-label="${groups} groupes de ${each}">`;
  for (let g = 0; g < groups; g++) s += `<div class="pgrp"><div class="plate${box ? ' box' : ''}">${`<span class="it">${e}</span>`.repeat(each)}</div>${label ? `<div class="plabel">${label} ${g + 1}</div>` : ''}</div>`;
  return s + '</div>';
}
export function vItems(n: number, e: string, crossed = 0, cls = ''): string {
  let s = `<div class="items ${cls}" role="img" aria-label="${n} objets${crossed ? `, ${crossed} enlevés` : ''}">`;
  for (let i = 0; i < n; i++) s += `<span class="it-c${i >= n - crossed ? ' x' : ''}">${e}</span>`;
  return s + '</div>';
}
export function vArray(rows: number, cols: number, { parts = null, removed = 0 }: { parts?: number[] | null; removed?: number } = {}): string {
  // Strategy groups are split by a 6px gap; the second group uses added-counter rings; crossed-out rows are hollow with a stroke.
  const sp = G.array.pitch, r = G.array.dotRadius, pad = 6, split = 6; const rc: number[] = [];
  if (parts) { let i = 0; parts.forEach((c, pi) => { for (let k = 0; k < c; k++) rc[i++] = pi; }); }
  const gaps = (y: number) => { let g = 0; for (let k = 1; k <= y && k < rows; k++) if ((rc[k] || 0) !== (rc[k - 1] || 0)) g++; return g; };
  const w = cols * sp + pad * 2, h = rows * sp + pad * 2 + gaps(rows - 1) * split;
  let s = `<svg class="arr" viewBox="0 0 ${w} ${h}" style="width:${Math.min(Math.round(w * 1.25), 340)}px" role="img" aria-label="${rows} rangées de ${cols}${removed ? `, dernière rangée barrée` : ''}">`;
  for (let y = 0; y < rows; y++) {
    const off = y >= rows - removed, grp = (rc[y] || 0) % 2, cy = pad + sp / 2 + y * sp + gaps(y) * split;
    for (let x = 0; x < cols; x++) {
      const cx = pad + sp / 2 + x * sp;
      s += off ? `<circle cx="${cx}" cy="${cy}" r="${r - 1}" class="d-off"/><path d="M${cx - r + 2} ${cy + r - 2}L${cx + r - 2} ${cy - r + 2}" class="d-off-x"/>` : grp ? added(cx, cy, r) : given(cx, cy, r);
    }
  }
  return s + '</svg>';
}
const [NLW, NLH] = viewBox(G.numberLine.viewBox);
export const NL = { W: NLW, L: G.numberLine.left, R: G.numberLine.right };
export interface Jump { from: number; to: number; label?: string }
/** scale: values are drawn as v/scale (scale 10 for tenths, 1000 for thousandths); labels use Québec notation. */
export function vLine({ min, max, tick = 1, labels = null, arrow = null, marker = null, jumps = [], tap = false, scale = 1 }:
  { min: number; max: number; tick?: number; labels?: number[] | null; arrow?: number | null; marker?: number | null; jumps?: Jump[]; tap?: boolean; scale?: number }): string {
  const lab = (v: number) => scale === 1 ? nf(v) : fmtM(v * 1000 / scale);
  const { W, L, R } = NL, H = NLH, y = G.numberLine.axisY, X = (v: number) => L + (v - min) / (max - min) * (R - L);
  let s = `<svg class="nl${tap ? ' nl-tap' : ''}"${tap ? ' data-act="nltap"' : ''} viewBox="0 0 ${W} ${H}" role="img" aria-label="droite numérique de ${lab(min)} à ${lab(max)}${marker !== null ? `, point à ${lab(marker)}` : ''}">`;
  s += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="nl-axis"/>`;
  const n = Math.round((max - min) / tick);
  for (let i = 0; i <= n; i++) {
    const v = min + i * tick, isLab = labels ? labels.includes(v) : true, x = X(v).toFixed(1);
    const t = (isLab ? G.numberLine.majorTick : G.numberLine.minorTick) / 2;
    s += `<line x1="${x}" y1="${y - t}" x2="${x}" y2="${y + t}" class="nl-tick${isLab ? ' big' : ''}"/>`;
    if (isLab) s += `<text x="${x}" y="${y + 34}" class="nl-lab">${lab(v)}</text>`;
  }
  const showAll = jumps.length <= 6;
  jumps.forEach(j => {
    const x1 = X(j.from), x2 = X(j.to), mid = (x1 + x2) / 2, hg = Math.abs(j.to - j.from) >= 10 ? 28 : 16;
    s += `<path d="M${x1.toFixed(1)} ${y - 3} Q${mid.toFixed(1)} ${(y - 3 - hg * 2).toFixed(1)} ${x2.toFixed(1)} ${y - 3}" class="nl-jump"/>`;
    if (j.label && (showAll || Math.abs(j.to - j.from) >= 10)) s += `<text x="${mid.toFixed(1)}" y="${(y - 9 - hg).toFixed(1)}" class="nl-jlab">${j.label}</text>`;
  });
  if (arrow !== null) s += `<path d="M${X(arrow).toFixed(1)} ${y - 5} l-10 -20 h20 z" class="nl-arrow"/>`;
  if (marker !== null) s += `<circle cx="${X(marker).toFixed(1)}" cy="${y}" r="${G.numberLine.markerRadius}" class="nl-marker"/>`;
  return s + '</svg>';
}
const [FBW, FBH] = viewBox(G.fractionBar.viewBox);
export function vFracBar(n: number, k: number, { shaded = null, tap = false }: { shaded?: boolean[] | null; tap?: boolean } = {}): string {
  const W = FBW, H = FBH, p = 3, w = (W - p * 2) / n;
  let s = `<svg class="fbsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="bande en ${n} parties égales">`;
  for (let i = 0; i < n; i++) { const on = shaded ? shaded[i] : i < k; s += `<rect${tap ? ` data-act="part" data-i="${i}"` : ''} x="${(p + i * w).toFixed(1)}" y="${p}" width="${w.toFixed(1)}" height="${H - p * 2}" class="fb-part${on ? ' on' : ''}${tap ? ' tap' : ''}"/>`; }
  return s + '</svg>';
}
const [FCW] = viewBox(G.fractionCircle.viewBox);
export function vFracCircle(n: number, k: number): string {
  const c = FCW / 2, r = G.fractionCircle.radius; let s = `<svg class="fcsvg" viewBox="0 0 ${FCW} ${FCW}" role="img" aria-label="cercle en ${n} parties égales, ${k} coloriées">`;
  for (let i = 0; i < n; i++) {
    const a0 = (-90 + i * 360 / n) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
    s += `<path d="M${c} ${c} L${(c + r * Math.cos(a0)).toFixed(2)} ${(c + r * Math.sin(a0)).toFixed(2)} A${r} ${r} 0 ${360 / n > 180 ? 1 : 0} 1 ${(c + r * Math.cos(a1)).toFixed(2)} ${(c + r * Math.sin(a1)).toFixed(2)} Z" class="fb-part${i < k ? ' on' : ''}"/>`;
  }
  return s + '</svg>';
}
export function vBarModel(whole: number, part: number, other: number | '?' = '?'): string { return `<div class="bm" role="img" aria-label="modèle en barres : le tout ${whole}, une partie ${part}, l’autre partie ${other === '?' ? 'inconnue' : other}"><div class="bm-whole">${whole}</div><div class="bm-parts"><div class="bm-part" style="flex:${part}">${part}</div><div class="bm-part${other === '?' ? ' unk' : ''}" style="flex:${whole - part}">${other}</div></div></div>`; }
const [TRW, TRH] = viewBox(G.factTriangle.viewBox), NR = G.factTriangle.nodeRadius;
export function vTri(top: number, l: number, r: number, hide: 'top' | 'l' | 'r' | null): string {
  const v = (x: number, h: boolean) => h ? '?' : x;
  return `<svg class="tri" viewBox="0 0 ${TRW} ${TRH}" role="img" aria-label="triangle de faits : ${top} en haut, ${l} et ${hide === 'r' ? 'un nombre manquant' : r} en bas"><path d="M120 40 L44 160 L196 160 Z" class="tri-edge"/><circle cx="120" cy="40" r="${NR}" class="tri-node top${hide === 'top' ? ' unk' : ''}"/><text x="120" y="49" class="tri-t">${v(top, hide === 'top')}</text><circle cx="44" cy="160" r="${NR}" class="tri-node${hide === 'l' ? ' unk' : ''}"/><text x="44" y="169" class="tri-t">${v(l, hide === 'l')}</text><circle cx="196" cy="160" r="${NR}" class="tri-node${hide === 'r' ? ' unk' : ''}"/><text x="196" y="169" class="tri-t">${v(r, hide === 'r')}</text><text x="120" y="132" class="tri-op">× ÷</text></svg>`;
}
/** Place-value table: columns headed by block shape and word, never colour (design/GRAPHICS.md rule 2). */
const PV_HEAD: Record<string, string> = { Centaines: kit('block-hundred'), Dizaines: kit('block-ten'), Unités: kit('block-one') };
export function vPlace(digits: number[], hi = -1): string { const names = digits.length === 3 ? ['Centaines', 'Dizaines', 'Unités'] : ['Dizaines', 'Unités']; return `<table class="pv"><thead><tr>${names.map(n => `<th scope="col"><span>${PV_HEAD[n]}${n}</span></th>`).join('')}</tr></thead><tbody><tr>${digits.map((d, i) => `<td class="${i === hi ? 'hi' : ''}">${d}</td>`).join('')}</tr></tbody></table>`; }
/** Operation-meaning cards from the kit. */
export const OPICON: Record<string, string> = { '+': kit('op-put-together', 'opi'), '−': kit('op-take-away', 'opi'), '×': kit('op-equal-groups', 'opi'), '÷': kit('op-share', 'opi') };
export const OPWORD: Record<string, string> = { '+': 'Mettre ensemble', '−': 'Enlever', '×': 'Des groupes égaux', '÷': 'Partager ou séparer en groupes égaux' };
export const OPDO: Record<string, string> = { '+': 'réunir, donc on additionne', '−': 'enlever, donc on soustrait', '×': 'des groupes égaux, donc on multiplie', '÷': 'partager en groupes égaux, donc on divise' };

// ---------- F-23 visuals ----------
/** Place-value columns, highest first. "," marks the decimal comma. */
export const PV_COLS: Record<string, { name: string; short: string; pow: number }> = {
  cm: { name: 'centaines de mille', short: 'CM', pow: 5 }, dm: { name: 'dizaines de mille', short: 'DM', pow: 4 }, um: { name: 'unités de mille', short: 'UM', pow: 3 },
  c: { name: 'centaines', short: 'C', pow: 2 }, d: { name: 'dizaines', short: 'D', pow: 1 }, u: { name: 'unités', short: 'U', pow: 0 },
  ds: { name: 'dixièmes', short: 'd', pow: -1 }, cs: { name: 'centièmes', short: 'c', pow: -2 }, ms: { name: 'millièmes', short: 'm', pow: -3 },
};
/** Digit of a value (in thousandths) in a column. */
export function digitAt(milli: number, col: string): number { return Math.floor(milli / Math.round(1000 * 10 ** PV_COLS[col].pow)) % 10; }
/** Tableau de numération: one column per place, digits (or counters) in the cells, the comma between units and tenths. */
export function vPV(cols: string[], milli: number | null, { counts = null, hi = null, dots = false }: { counts?: number[] | null; hi?: string | null; dots?: boolean } = {}): string {
  const vals = counts ?? cols.map(c => (milli === null ? 0 : digitAt(milli, c)));
  const head = cols.map(c => `<th scope="col" class="${PV_COLS[c].pow < 0 ? 'dec' : ''}"><abbr title="${PV_COLS[c].name}">${PV_COLS[c].short}</abbr><span>${PV_COLS[c].name}</span></th>`).join('');
  // A written number has no zeros before its first digit or after its last decimal: those cells stay empty (the units digit always shows).
  const nz = cols.filter((c, i) => vals[i] !== 0).map(c => PV_COLS[c].pow), top = Math.max(0, ...nz), low = Math.min(0, ...nz);
  const shown = (v: number, c: string) => counts || v !== 0 || (PV_COLS[c].pow <= top && PV_COLS[c].pow >= low) ? String(v) : '';
  const cell = (v: number, c: string) => dots ? `<td class="${c === hi ? 'hi' : ''}${PV_COLS[c].pow < 0 ? ' dec' : ''}"><span class="pvdots" aria-label="${v}">${'<i></i>'.repeat(v)}</span></td>` : `<td class="${c === hi ? 'hi' : ''}${PV_COLS[c].pow < 0 ? ' dec' : ''}">${shown(v, c)}</td>`;
  const label = cols.map((c, i) => `${vals[i]} ${PV_COLS[c].name}`).join(', ');
  return `<table class="pvt${cols.some(c => PV_COLS[c].pow < 0) ? ' hasdec' : ''}" role="img" aria-label="Tableau de numération : ${label}"><thead><tr>${head}</tr></thead><tbody><tr>${cols.map((c, i) => cell(vals[i], c)).join('')}</tr></tbody></table>`;
}
/** 10 × 10 grid with k hundredths shaded (k from 0 to 100), filled row by row. */
export function vDecGrid(k: number): string {
  const c = 22, g = 2, W = 10 * c + 11 * g;
  let s = `<svg class="decgrid" viewBox="0 0 ${W} ${W}" role="img" aria-label="grille de 100 cases, ${k} coloriées">`;
  for (let i = 0; i < 100; i++) { const x = g + (i % 10) * (c + g), y = g + Math.floor(i / 10) * (c + g); s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" class="dg${i < k ? ' on' : ''}"/>`; }
  return s + '</svg>';
}
/** Column layout for + and ×: numbers right-aligned on a grid, optional partial products and result. */
export function vColumns(op: '+' | '×', rows: string[], { partials = [], result = null, carries = '' }: { partials?: string[]; result?: string | null; carries?: string } = {}): string {
  const all = [...rows, ...partials, ...(result !== null ? [result] : [])], width = Math.max(...all.map(r => r.length)) + 1;
  // A column that holds a comma in any row is drawn narrow, so the digits keep their spacing.
  const cm = new Set<number>(); all.forEach(r => [...r].forEach((ch, i) => { if (ch === ',') cm.add(width - r.length + i); }));
  const line = (txt: string, cls = '', sign = '') => { const pad = width - txt.length; return `<tr class="${cls}"><td class="sg">${sign}</td>${Array.from({ length: width }, (_, i) => `<td${cm.has(i) ? ' class="cm"' : ''}>${i < pad ? '' : txt[i - pad] === ' ' ? '' : txt[i - pad]}</td>`).join('')}</tr>`; };
  let s = `<table class="colop" role="img" aria-label="${rows.join(op === '+' ? ' plus ' : ' fois ')} en colonnes">`;
  if (carries) s += line(carries, 'car');
  rows.forEach((r, i) => { s += line(r, i === rows.length - 1 ? 'last' : '', i === rows.length - 1 ? op : ''); });
  partials.forEach((r, i) => { s += line(r, i === partials.length - 1 ? 'last part' : 'part', i === partials.length - 1 && partials.length > 1 ? '+' : ''); });
  if (result !== null) s += line(result, 'res');
  return s + '</table>';
}
/** Two bars for "fois plus": the short one and the long one, k times as long. */
export function vTimesBars(small: string, big: string, k: string, smallName: string, bigName: string): string {
  return `<div class="tbars" role="img" aria-label="${bigName} est ${k} fois ${smallName}"><div class="tb"><span class="tbn">${smallName}</span><span class="tbb s">${small}</span></div><div class="tb"><span class="tbn">${bigName}</span><span class="tbb l">${big}</span><span class="tbk">× ${k}</span></div></div>`;
}
/** "Pour 1 … / pour … en tout": a short bar for one unit and a long bar for the whole amount (rate stories, F-23 probdec). */
export function vRateBars(oneName: string, oneVal: string, manyName: string, unit: string): string {
  return `<div class="tbars" role="img" aria-label="${oneName} : ${oneVal} ${unit}. ${manyName} : combien?"><div class="tb"><span class="tbn">${oneName}</span><span class="tbb s">${oneVal} ${unit}</span></div><div class="tb"><span class="tbn">${manyName}</span><span class="tbb l">? ${unit}</span></div></div>`;
}
export { nf, fmtM };
