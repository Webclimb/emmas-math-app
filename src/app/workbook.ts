// F-22 workbook check: read a photographed workbook page with Claude (the artifact runtime's `sample`
// capability, images declared in the manifest). Claude only names skills from the skill map
// (F-22.AC-7). The photo is passed straight to the call and never stored (F-22.AC-3); the request
// carries the photo and the skill map only, never learner data.
import { SKILLS } from '../engine/skills';
import { cleanSkillIds } from '../engine/workbook';

interface SampleFn {
  json<T = unknown>(input: string, opts?: { images?: Blob | Blob[]; modelTier?: string; cache?: boolean; signal?: AbortSignal }): Promise<T>;
  limits(): Promise<{ images?: { maxCount: number; mediaTypes: string[] } }>;
}

let sampleP: Promise<SampleFn | null> | null = null;
function getSample(): Promise<SampleFn | null> {
  if (!sampleP) {
    sampleP = (async () => {
      try {
        if (!window.claude || !window.claude.use) return null;
        const s = await window.claude.use('sample') as SampleFn | null;
        if (!s) return null;
        const lim = await s.limits().catch(() => null);
        return lim && lim.images ? s : null;
      } catch { return null; }
    })();
  }
  return sampleP;
}

/** True when this view can read a photo; false where only hand-picking is possible. */
export async function canReadPhotos(): Promise<boolean> { return !!(await getSample()); }

export interface WorkbookReading { topic: string; skills: string[]; beyond: string[] }

/** The prompt: instructions and the skill map. No learner data goes in it. */
export function workbookPrompt(): string {
  const map = SKILLS.map(s => ({ id: s.id, name: s.name, covers: s.about, needs: s.pre }));
  return [
    'The image is a photo of one page from a French-language maths workbook used in a Québec school (6e année primaire, Progression des apprentissages).',
    'A parent wants to know which basic skills a learner needs before she can do the exercises on this page.',
    'Here is the skill map of a practice app, as JSON. Each skill lists the skills it needs:',
    JSON.stringify(map),
    'Reply with only a JSON object with three fields:',
    '- "topic": what the page practises, in at most 12 plain words, in Québec French. Maths only: do not copy any names, school, teacher, dates or handwriting.',
    '- "skills": the ids of the skills in the map that the exercises use directly. Include the most advanced skills the page needs; the app adds their prerequisites itself. Use only ids from the map.',
    '- "beyond": up to 5 short phrases for skills the page needs that are not in the map in Québec French (for example "diviser par un nombre à 2 chiffres" or "fractions équivalentes"). Use [] if none.',
    'Do not solve the exercises and do not include any answers.',
  ].join('\n');
}

/** Clean whatever came back: known skill ids only, short plain strings only. */
export function cleanReading(raw: unknown): WorkbookReading {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const text = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
  const beyond = Array.isArray(r.beyond) ? r.beyond.map(x => text(x, 60)).filter(Boolean).slice(0, 5) : [];
  return { topic: text(r.topic, 100), skills: cleanSkillIds(r.skills), beyond };
}

export type ReadError = 'unavailable' | 'not_granted' | 'image_rejected' | 'busy' | 'failed';

/** Read one photo. The blob is used for this call only. */
export async function readWorkbookPhoto(photo: Blob): Promise<WorkbookReading> {
  const s = await getSample();
  if (!s) throw { code: 'unavailable' as ReadError };
  try {
    return cleanReading(await s.json(workbookPrompt(), { images: [photo], cache: false }));
  } catch (e) {
    const c = (e as { code?: string } | null)?.code;
    throw { code: (c === 'not_granted' ? 'not_granted' : c === 'image_rejected' ? 'image_rejected' : c === 'rate_limited' ? 'busy' : c === 'images_unavailable' ? 'unavailable' : 'failed') as ReadError };
  }
}

export const READ_ERROR_TEXT: Record<ReadError, string> = {
  unavailable: 'La lecture de photos fonctionne quand l’appli est ouverte dans Claude. Vous pouvez choisir les habiletés vous-même.',
  not_granted: 'La lecture de la photo n’a pas été permise. Vous pouvez choisir les habiletés vous-même.',
  image_rejected: 'Cette photo n’a pas pu être lue. Essayez une photo nette d’une seule page, ou choisissez les habiletés vous-même.',
  busy: 'Claude est occupé en ce moment. Réessayez dans une minute, ou choisissez les habiletés vous-même.',
  failed: 'La page n’a pas pu être lue cette fois. Réessayez, ou choisissez les habiletés vous-même.',
};
