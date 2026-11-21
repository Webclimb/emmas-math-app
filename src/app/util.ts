// Date helpers (local calendar days).
import type { Profile } from '../engine/types';

export function dayKey(d: Date): string { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${dd}`; }
export const DAYS_CAP = 180;
export function markDay(p: Profile): void { const k = dayKey(new Date()); if (!p.days.includes(k)) { p.days.push(k); if (p.days.length > DAYS_CAP) p.days.shift(); } }
export function rel(ts: number): string {
  if (!ts) return 'never';
  const d = Math.floor((new Date(dayKey(new Date())).getTime() - new Date(dayKey(new Date(ts))).getTime()) / 864e5);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
