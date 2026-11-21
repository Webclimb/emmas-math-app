// App content that is not design tokens.

/** Badges (design kit avatars, F-19.AC-5). Frames hold her initial; emblems stand alone.
 *  Which style is the free default is her choice (SPEC.md Q3); until then three frames are free,
 *  as three buddies were in v1, and the rest cost what v1's buddies cost. */
export const AVATARS: { id: string; name: string; price: number }[] = [
  { id: 'frame:square', name: 'Carré', price: 0 },
  { id: 'frame:circle', name: 'Cercle', price: 0 },
  { id: 'frame:roundel', name: 'Cocarde', price: 0 },
  { id: 'frame:ticket', name: 'Billet', price: 20 },
  { id: 'emblem:orbit', name: 'Orbite', price: 25 },
  { id: 'emblem:comet', name: 'Comète', price: 25 },
  { id: 'emblem:mountain', name: 'Montagne', price: 30 },
  { id: 'emblem:wave', name: 'Vague', price: 35 },
  { id: 'emblem:compass', name: 'Boussole', price: 40 },
  { id: 'emblem:constellation', name: 'Constellation', price: 50 },
];
export const DEFAULT_AVATAR = 'frame:square';
export const isAvatarId = (a: string) => AVATARS.some(x => x.id === a);
export const OK_LINES = ['C’est ça!', 'Bien pensé.', 'Oui, tout juste.', 'Tu l’as trouvé.', 'Exactement.', 'Beau travail.'];
/** Station states in words (design/COMPONENTS.md §15). */
export const STATE_LABEL: Record<string, string> = { lit: 'allumée', now: 'en pratique maintenant', open: 'ouverte', locked: 'pas encore ouverte' };
/** Gems (spec F-15.AC-2, v1 values). */
export const GEMS = { answer: 1, clean: 1, up: 5, back: 2, mastered: 15, session: 5 };
/** Grown-ups press-and-hold (design/SCREENS.md §1). */
export const HOLD_MS = 2000;
export const TOAST_MS = 4000;
export const BOOT_MS = 1600;
