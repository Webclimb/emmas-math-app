# Number Sky graphics kit: Star Lines

There are 98 SVGs, all named `kit-<graphic>-<variant>.svg`. To see them in light and dark, open `kit-index.html`.

## How the files work

- **Colour.** Every colour is a CSS custom property named after a `tokens.json` key, with the light value as a fallback: `style="fill:var(--sky,#3A55C4)"`.
  - Inline the SVG in the page so the app's theme variables apply. In an `<img>` they fall back to light.
  - Single-colour icons use `currentColor`.
- **No text.** No file contains text. Numbers, labels and operators are live HTML placed by the component (brief §5.3). Positions are given below.
- **Accessibility.** All files are decorative. Add `aria-hidden="true" focusable="false"` when inlining, and put the accessible name on the component.
- **Strokes.** Strokes are round-capped and round-joined. Base-ten blocks use `vector-effect: non-scaling-stroke` so edges stay crisp at any size.
- **Regenerating.** `reference/` is built from these files; if a kit file changes, rebuild the reference pages.

## Rules that keep the maths readable

1. **A manipulative looks the same everywhere** (F-3.AC-3).
   - A rod is always ten cubes long and a flat is always ten rods.
   - The kit draws all three on one 10-unit grid. This fixes a v1 problem: v1 drew the cube at 12 px but the rod's cells at 8.4 px, so a cube looked bigger than a tenth of a rod.
   - A full ten-frame always means ten.
2. **Place-value colour rule: one hue for all base-ten blocks (`blk`).** Size and shape carry the value.
   - The place-value table uses block shapes and words in its column headers, not colours.
   - Why one hue: the shape already encodes the value, a colour per column would be a third code to learn, and it would use up hues that feedback and items need.
   - Never reuse `blk` for feedback.
3. **Given vs added counters differ by shape as well as hue.**
   - Given: filled disc in `sky`.
   - Added, or the second group in an array strategy: ring with a centre dot in `counter-2`.
   - Taken away: dashed hollow with a diagonal stroke.
4. **Number lines** run left to right, smaller on the left, with exactly proportional tick spacing (F-12.AC-4). Zero is the heaviest tick on lines with negatives.
5. **The unknown is always marked the same way:** a dashed `accent-text` outline. This applies to the strip slot, bar model part, fact-triangle node and word-problem slot.
6. **Items are one hue (`item`) whatever the story theme.** They are flat, readable at 18 px, and designed at 24 px.
7. **Feedback hues never appear in graphics.** `good` and `warm` are reserved for answer states, except in the estimation-feedback number line, where `good` marks the true position and always carries a diamond shape.

## Inventory

| Group | Files | Notes |
|---|---|---|
| Ten-frame | `tenframe-empty`, `-7`, `-given4-added3`, `-full`; `counter-given`, `counter-added` | Cell 40, gap 5, counter r 13. Counters fill the top row left to right, then the bottom row |
| Base-ten | `block-one`, `block-ten`, `block-hundred` | Unit 10 in the viewBox; scale the whole set together |
| Arrays | `array-3x5`, `-4x6-double-double`, `-7x6-five-plus-two`, `-10x6-ten-minus-one` | Pitch 24, dot r 8.5, 6 px gap between strategy groups |
| Number line | `numberline-0-20`, `-0-20-marker`, `-0-100-pointer`, `-bare`, `-jumps`, `-estimate-feedback` (NEW), `-fractions-0-1`, `-decimals-0-1`, `-negative` (NEW) | See layout below |
| Fractions | `fraction-bar-3of4`, `fraction-circle-3of8` | Shaded = `sky`; parts always equal |
| Bar model | `barmodel-whole-parts`, `barmodel-unknown` | Whole on top in `accent-soft`; part widths proportional |
| Fact triangle | `facttriangle`, `facttriangle-missing` | Product node has an `ink` ring; factor nodes have `sky` rings |
| Containers | `container-plate`, `container-box` | Plate for sharing and equal groups; box for grouping |
| Items | `item-ticket`, `-token`, `-card` (Games); `-coin`, `-bill` (Money); `-puck`, `-ball`, `-cone` (Sport); `-bead`, `-tile` (Neutral, default) | Brief asked for 2–3 themes: there are 3 plus a neutral default. Her pick decides (Q3) |
| Operation meaning | `op-put-together`, `op-take-away`, `op-equal-groups`, `op-share` | Redrawn at 160 × 64 so they work as card art at phone width |
| Word problems (NEW, F-11) | `wp-total`, `wp-change`, `wp-difference`, `wp-equal-groups`, `wp-times-as-many`, each with one `-unknown-*` example | Slots 56 × 44. Any slot can be the unknown (F-11.AC-3): swap that slot's style |
| Decimals and percent (F-21, later) | `decimal-grid-0-37`, `percent-bar-60` | |
| Star map | `station-lit`, `-pending` (NEW), `-now`, `-open`, `-locked`; `star` | Station 48 viewBox; star scaled to 28 inside |
| Interface | `gem`, `badge-level-up`, `badge-switch-level`, `badge-star-lit` | `badge-star-lit` replaces confetti |
| Icons | `icon-close`, `read-aloud`, `hint`, `backspace`, `left`, `right`, `arrow-right`, `check`, `not-yet`, `undo`, `not-sure`, `show-me-how`, `replay`, `skip`, `report`, `settings`, `home`, `print`, `copy`, `info`, `plus`, `minus` | 24 grid, stroke 2.2, `currentColor`. Adds the replay, skip, report and settings icons the brief asked for |
| Avatars | Frames: `avatar-frame-square` (default), `-circle`, `-roundel`, `-ticket`. Emblems: `avatar-emblem-orbit`, `-comet`, `-mountain`, `-wave`, `-compass`, `-constellation` | Frames hold her initial as live text. Emblems stand alone. For her to choose (Q3) |

## Live-text positions

- **Number line** (viewBox 480 × 112):
  - axis y = 64, from x = 24 to x = 456;
  - labels are centred under major ticks, with their top at y = 86 (76% of the height);
  - marker r 10; pointer tip at y = 52;
  - jump labels are centred above each arc's peak, 6 px clear; label no more than 6 jumps, and show the rest as one "+3 ones" label over a brace.
- **Fact triangle** (240 × 196): node centres at (120, 40), (44, 156) and (196, 156), r 32. The operator pair "× ÷" is centred at (120, 116).
- **Bar model** (320 × 116): the whole's label is centred in the top bar; part labels are centred in each part.
- **Word-problem slots:** each slot rect is the text box. Centre the number in it at 22 px bold. Read the slot positions from the file or from the generator.
- **Ten-frame / arrays:** no labels inside. Counts go beside them as text.

## Building new graphics

- Draw on the same grids: 24 for icons and items, unit 10 for blocks, pitch 24 for dots.
- Use only token variables.
- Add no text.
- Add new kit files to `kit-index.html` (regenerate it) and to the table above.
