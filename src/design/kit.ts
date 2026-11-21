// The graphics kit (design/kit-*.svg), inlined so theme variables apply (design/GRAPHICS.md).
// Every kit file is decorative: it is returned with aria-hidden and focusable="false", and the
// component supplies the accessible name. Pure strings, no DOM: the engine can use it too.
const files = import.meta.glob('../../design/kit-*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const KIT: Record<string, string> = {};
for (const [path, svg] of Object.entries(files)) KIT[path.replace(/^.*\/kit-|\.svg$/g, '')] = svg.trim();

export const KIT_NAMES = Object.keys(KIT).sort();

/** Inline SVG for kit-<name>.svg, with an optional class. Throws for an unknown name so typos fail tests. */
export function kit(name: string, cls = ''): string {
  const svg = KIT[name];
  if (!svg) throw new Error(`no kit graphic "${name}"`);
  return svg.replace(/^<svg /, `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true" focusable="false" `)
    .replace(/ width="[\d.]+" height="[\d.]+"/, '');
}
