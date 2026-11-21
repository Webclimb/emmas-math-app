// Side effects with no game logic: accent colours, sound, read-aloud, confetti.
// Each degrades to nothing when the browser or runtime lacks the feature.
import { THEMES, DEFAULT_THEME } from '../design/tokens';
import { G } from './state';

declare global { interface Window { claude?: { use(cap: string): Promise<unknown>; hot?: { snapshot?(f: () => unknown): void; ready?(f: () => void): void } }; webkitAudioContext?: typeof AudioContext } }

// ---------- theme ----------
export function isDark(): boolean {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true; if (t === 'light') return false;
  try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}
export function applyAccent(): void {
  const th = THEMES[(G.prof && G.prof.theme) || DEFAULT_THEME] || THEMES[DEFAULT_THEME];
  const c = isDark() ? th.dark : th.light, st = document.documentElement.style;
  for (const k of ['accent', 'accent-ink', 'accent-soft', 'accent-text', 'focus'] as const) st.setProperty('--' + k, c[k]);
}
export function watchTheme(): void {
  new MutationObserver(applyAccent).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAccent); } catch { /* old browser */ }
}

// ---------- sound ----------
let AC: AudioContext | null = null;
export const SND: Record<'ok' | 'soft' | 'up', [number, number, number][]> = { ok: [[660, .16, 0], [880, .24, .11]], soft: [[392, .22, 0]], up: [[523, .14, 0], [659, .14, .1], [784, .14, .2], [1047, .32, .3]] };
export function tone(seq: [number, number, number][]): void {
  if (!G.prof || !G.prof.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext!)(); const t0 = AC.currentTime + .01;
    seq.forEach(([f, d, at]) => {
      const o = AC!.createOscillator(), g = AC!.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.16, t0 + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + d);
      o.connect(g); g.connect(AC!.destination); o.start(t0 + at); o.stop(t0 + at + d + 0.05);
    });
  } catch { /* no audio */ }
}

// ---------- read-aloud ----------
let TTS: { speak(t: string, o: { rate: number }): Promise<void> } | null = null;
export async function initTTS(onReady: () => void): Promise<void> {
  try { if (window.claude && window.claude.use) { TTS = await window.claude.use('tts') as typeof TTS; onReady(); } } catch { TTS = null; }
}
export function canSpeak(): boolean { return !!TTS || ('speechSynthesis' in window); }
/** Plain text for speech: fractions as "k out of n", symbols as words. */
export function strip(h: string): string {
  return String(h).replace(/<span class="frac"[^>]*><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '$1 out of $2').replace(/<[^>]+>/g, ' ')
    .replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/=\s*\?/g, ' equals what?').replace(/\s+/g, ' ').trim();
}
export async function speak(text: string): Promise<void> {
  text = String(text).slice(0, 1900);
  if (TTS) { try { await TTS.speak(text, { rate: 0.9 }); return; } catch (e) { if ((e as { code?: string })?.code === 'not_granted') { TTS = null; } else return; } }
  try { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; speechSynthesis.speak(u); } } catch { /* none */ }
}

// ---------- motion ----------
export function reduced(): boolean { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } }
// Confetti is removed in the Star Lines design: the star-lit dialog replaces it (design/MOTION.md).
