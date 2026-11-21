// Visual builders. Each returns an HTML/SVG string; no DOM access.
// Geometry comes from design tokens (graphics section); colours come from CSS classes.
import { G, RADIUS_TENFRAME_CELL, viewBox } from '../design/tokens';
import { kit } from '../design/kit';

export const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function plural(n: number, one: string, many?: string): string { return n === 1 ? one : (many || one + 's'); }
export function fr(k: number, n: number): string { return `<span class="frac" aria-label="${k} out of ${n}"><span>${k}</span><span>${n}</span></span>`; }
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
  let out = `<div class="tfwrap" role="img" aria-label="${n} dots in ten-frames">`;
  for (let f = 0; f < frames; f++) { const cells: number[] = []; for (let i = 0; i < 10; i++) { const idx = f * 10 + i; cells.push(idx < preset ? 2 : (idx < n ? (preset ? 1 : 2) : 0)); } out += vTF(cells); }
  return out + '</div>';
}
const FLAT = kit('block-hundred', 'flat'), ROD = kit('block-ten', 'rod'), CUBE = kit('block-one', 'cube');
export function vBlocks(h: number, t: number, o: number): string {
  const parts: string[] = []; if (h) parts.push(`${h} ${plural(h, 'hundred')}`); parts.push(`${t} ${plural(t, 'ten')}`); parts.push(`${o} ${plural(o, 'one')}`);
  let s = `<div class="blocks" role="img" aria-label="${parts.join(', ')}">`;
  if (h) s += `<div class="bg">${FLAT.repeat(h)}</div>`;
  if (t) s += `<div class="bg">${ROD.repeat(t)}</div>`;
  if (o) s += `<div class="bg ones">${CUBE.repeat(o)}</div>`;
  if (!h && !t && !o) s += `<p class="muted">No blocks yet</p>`;
  return s + '</div>';
}
export function vSum(a: number, b: number): string { return `<div class="sum">${vBlocks(Math.floor(a / 100), Math.floor(a / 10) % 10, a % 10)}<span class="and">and</span>${vBlocks(Math.floor(b / 100), Math.floor(b / 10) % 10, b % 10)}</div>`; }
export function vPlates(groups: number, each: number, e: string, { label = null, box = false }: { label?: string | null; box?: boolean } = {}): string {
  let s = `<div class="plates" role="img" aria-label="${groups} groups with ${each} in each">`;
  for (let g = 0; g < groups; g++) s += `<div class="pgrp"><div class="plate${box ? ' box' : ''}">${`<span class="it">${e}</span>`.repeat(each)}</div>${label ? `<div class="plabel">${label} ${g + 1}</div>` : ''}</div>`;
  return s + '</div>';
}
export function vItems(n: number, e: string, crossed = 0, cls = ''): string {
  let s = `<div class="items ${cls}" role="img" aria-label="${n} items${crossed ? `, ${crossed} taken away` : ''}">`;
  for (let i = 0; i < n; i++) s += `<span class="it-c${i >= n - crossed ? ' x' : ''}">${e}</span>`;
  return s + '</div>';
}
export function vArray(rows: number, cols: number, { parts = null, removed = 0 }: { parts?: number[] | null; removed?: number } = {}): string {
  // Strategy groups are split by a 6px gap; the second group uses added-counter rings; crossed-out rows are hollow with a stroke.
  const sp = G.array.pitch, r = G.array.dotRadius, pad = 6, split = 6; const rc: number[] = [];
  if (parts) { let i = 0; parts.forEach((c, pi) => { for (let k = 0; k < c; k++) rc[i++] = pi; }); }
  const gaps = (y: number) => { let g = 0; for (let k = 1; k <= y && k < rows; k++) if ((rc[k] || 0) !== (rc[k - 1] || 0)) g++; return g; };
  const w = cols * sp + pad * 2, h = rows * sp + pad * 2 + gaps(rows - 1) * split;
  let s = `<svg class="arr" viewBox="0 0 ${w} ${h}" style="width:${Math.min(Math.round(w * 1.25), 340)}px" role="img" aria-label="${rows} rows of ${cols}${removed ? `, last ${removed} row crossed out` : ''}">`;
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
export function vLine({ min, max, tick = 1, labels = null, arrow = null, marker = null, jumps = [], tap = false }:
  { min: number; max: number; tick?: number; labels?: number[] | null; arrow?: number | null; marker?: number | null; jumps?: Jump[]; tap?: boolean }): string {
  const { W, L, R } = NL, H = NLH, y = G.numberLine.axisY, X = (v: number) => L + (v - min) / (max - min) * (R - L);
  let s = `<svg class="nl${tap ? ' nl-tap' : ''}"${tap ? ' data-act="nltap"' : ''} viewBox="0 0 ${W} ${H}" role="img" aria-label="number line from ${min} to ${max}${marker !== null ? `, dot at ${marker}` : ''}">`;
  s += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" class="nl-axis"/>`;
  const n = Math.round((max - min) / tick);
  for (let i = 0; i <= n; i++) {
    const v = min + i * tick, lab = labels ? labels.includes(v) : true, x = X(v).toFixed(1);
    const t = (lab ? G.numberLine.majorTick : G.numberLine.minorTick) / 2;
    s += `<line x1="${x}" y1="${y - t}" x2="${x}" y2="${y + t}" class="nl-tick${lab ? ' big' : ''}"/>`;
    if (lab) s += `<text x="${x}" y="${y + 34}" class="nl-lab">${v}</text>`;
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
  let s = `<svg class="fbsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="bar in ${n} equal parts">`;
  for (let i = 0; i < n; i++) { const on = shaded ? shaded[i] : i < k; s += `<rect${tap ? ` data-act="part" data-i="${i}"` : ''} x="${(p + i * w).toFixed(1)}" y="${p}" width="${w.toFixed(1)}" height="${H - p * 2}" class="fb-part${on ? ' on' : ''}${tap ? ' tap' : ''}"/>`; }
  return s + '</svg>';
}
const [FCW] = viewBox(G.fractionCircle.viewBox);
export function vFracCircle(n: number, k: number): string {
  const c = FCW / 2, r = G.fractionCircle.radius; let s = `<svg class="fcsvg" viewBox="0 0 ${FCW} ${FCW}" role="img" aria-label="circle in ${n} equal parts, ${k} shaded">`;
  for (let i = 0; i < n; i++) {
    const a0 = (-90 + i * 360 / n) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
    s += `<path d="M${c} ${c} L${(c + r * Math.cos(a0)).toFixed(2)} ${(c + r * Math.sin(a0)).toFixed(2)} A${r} ${r} 0 ${360 / n > 180 ? 1 : 0} 1 ${(c + r * Math.cos(a1)).toFixed(2)} ${(c + r * Math.sin(a1)).toFixed(2)} Z" class="fb-part${i < k ? ' on' : ''}"/>`;
  }
  return s + '</svg>';
}
export function vBarModel(whole: number, part: number, other: number | '?' = '?'): string { return `<div class="bm" role="img" aria-label="bar model: whole ${whole}, one part ${part}, other part ${other === '?' ? 'unknown' : other}"><div class="bm-whole">${whole}</div><div class="bm-parts"><div class="bm-part" style="flex:${part}">${part}</div><div class="bm-part${other === '?' ? ' unk' : ''}" style="flex:${whole - part}">${other}</div></div></div>`; }
const [TRW, TRH] = viewBox(G.factTriangle.viewBox), NR = G.factTriangle.nodeRadius;
export function vTri(top: number, l: number, r: number, hide: 'top' | 'l' | 'r' | null): string {
  const v = (x: number, h: boolean) => h ? '?' : x;
  return `<svg class="tri" viewBox="0 0 ${TRW} ${TRH}" role="img" aria-label="fact triangle: ${top} at the top, ${l} and ${hide === 'r' ? 'a missing number' : r} at the bottom"><path d="M120 40 L44 160 L196 160 Z" class="tri-edge"/><circle cx="120" cy="40" r="${NR}" class="tri-node top${hide === 'top' ? ' unk' : ''}"/><text x="120" y="49" class="tri-t">${v(top, hide === 'top')}</text><circle cx="44" cy="160" r="${NR}" class="tri-node${hide === 'l' ? ' unk' : ''}"/><text x="44" y="169" class="tri-t">${v(l, hide === 'l')}</text><circle cx="196" cy="160" r="${NR}" class="tri-node${hide === 'r' ? ' unk' : ''}"/><text x="196" y="169" class="tri-t">${v(r, hide === 'r')}</text><text x="120" y="132" class="tri-op">× ÷</text></svg>`;
}
/** Place-value table: columns headed by block shape and word, never colour (design/GRAPHICS.md rule 2). */
const PV_HEAD: Record<string, string> = { Hundreds: kit('block-hundred'), Tens: kit('block-ten'), Ones: kit('block-one') };
export function vPlace(digits: number[], hi = -1): string { const names = digits.length === 3 ? ['Hundreds', 'Tens', 'Ones'] : ['Tens', 'Ones']; return `<table class="pv"><thead><tr>${names.map(n => `<th scope="col"><span>${PV_HEAD[n]}${n}</span></th>`).join('')}</tr></thead><tbody><tr>${digits.map((d, i) => `<td class="${i === hi ? 'hi' : ''}">${d}</td>`).join('')}</tr></tbody></table>`; }
/** Operation-meaning cards from the kit. */
export const OPICON: Record<string, string> = { '+': kit('op-put-together', 'opi'), '−': kit('op-take-away', 'opi'), '×': kit('op-equal-groups', 'opi'), '÷': kit('op-share', 'opi') };
export const OPWORD: Record<string, string> = { '+': 'Putting together', '−': 'Taking away', '×': 'Equal groups', '÷': 'Sharing or splitting into equal groups' };
export const OPDO: Record<string, string> = { '+': 'putting together, so add', '−': 'taking away, so subtract', '×': 'equal groups, so multiply', '÷': 'sharing into equal groups, so divide' };
