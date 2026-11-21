// Story content: names and countable items. Items are the design kit's (design/kit-item-*.svg,
// F-19.AC-5), one hue for all. Which story themes ship is her choice (SPEC.md Q3); until then every
// kit item is in use.
import { kit } from '../design/kit';

export const NAMES = ['Maya','Leo','Ava','Sam','Noor','Eli','Zoe','Kai','Priya','Owen','Lucia','Ben'];
const KIT_ITEMS: [string, string, string][] = [
  ['ticket', 'ticket', 'tickets'], ['token', 'token', 'tokens'], ['card', 'card', 'cards'],
  ['coin', 'coin', 'coins'], ['bill', 'bill', 'bills'],
  ['puck', 'puck', 'pucks'], ['ball', 'ball', 'balls'], ['cone', 'cone', 'cones'],
  ['bead', 'bead', 'beads'], ['tile', 'tile', 'tiles'],
];
/** e: the item's inline SVG. */
export const ITEMS: { one: string; many: string; e: string; k: string }[] = KIT_ITEMS.map(([k, one, many]) => ({ one, many, k, e: kit(`item-${k}`) }));
