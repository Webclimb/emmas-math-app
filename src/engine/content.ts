// Story content: names and countable items, in Québec French (D-21). Items are the design kit's
// (design/kit-item-*.svg, F-19.AC-5), one hue for all. Which story themes ship is her choice (Q3).
import { kit } from '../design/kit';

/** Names with the pronoun used in questions ("Combien de jetons Maya a-t-elle?"). */
export const NAMES: { n: string; p: 'il' | 'elle' }[] = [
  { n: 'Maya', p: 'elle' }, { n: 'Léo', p: 'il' }, { n: 'Ava', p: 'elle' }, { n: 'Samuel', p: 'il' }, { n: 'Noor', p: 'elle' }, { n: 'Éli', p: 'il' },
  { n: 'Zoé', p: 'elle' }, { n: 'Kaï', p: 'il' }, { n: 'Priya', p: 'elle' }, { n: 'Olivier', p: 'il' }, { n: 'Lucia', p: 'elle' }, { n: 'Benoît', p: 'il' },
];
const KIT_ITEMS: [string, string, string, string][] = [
  ['ticket', 'un', 'coupon', 'coupons'], ['token', 'un', 'jeton', 'jetons'], ['card', 'une', 'carte', 'cartes'],
  ['coin', 'une', 'pièce', 'pièces'], ['bill', 'un', 'billet', 'billets'],
  ['puck', 'une', 'rondelle', 'rondelles'], ['ball', 'un', 'ballon', 'ballons'], ['cone', 'un', 'cône', 'cônes'],
  ['bead', 'une', 'perle', 'perles'], ['tile', 'une', 'tuile', 'tuiles'],
];
/** e: the item's inline SVG; un: its article. */
export const ITEMS: { one: string; many: string; un: string; e: string; k: string }[] = KIT_ITEMS.map(([k, un, one, many]) => ({ one, many, un, k, e: kit(`item-${k}`) }));
