# Number Sky: design brief

For Claude Design. Goal: turn the v1 look into a design framework (tokens, components, a graphics kit and key screens) that Claude Code builds against. Behaviour is defined in `SPEC.md`; this brief covers how it looks and feels. Where they disagree, `SPEC.md` wins and the conflict should be reported.

## 1. Who it is for

- **Learner:** a 12-year-old with severe dyscalculia. She is in Grade 7 but works on much earlier maths. She will notice, and resent, anything that looks made for a six-year-old.
- **Grown-up:** a parent who checks progress weekly and may print a report for a teacher.

## 2. What the design has to do

1. **Respect her age.** The v1 buddies, cookie and shell emoji, and "buddy" language read as primary-school. The content is early maths; the look must not be.
2. **Make the maths the picture.** Manipulatives and diagrams are the teaching. They need more care than any decoration.
3. **Stay calm.** No alarm colours, no clocks, no clutter. One task per screen.
4. **Show growth, not rank.** Progress is her own map filling in.

## 3. What exists (v1)

Concept: a star chart. Each skill is a star; mastering it lights the star. Night-sky palette (indigo and slate neutrals), one warm accent she can swap.

- **Tokens:** `design/tokens.v1.json` (light, dark, six accent themes, type, radii, spacing, graphic construction sizes).
- **Fonts:** Bricolage Grotesque (headings), Atkinson Hyperlegible (everything else, including all numerals).
- **Screens:** `assets/screens/` (50 captures; overview in `assets/contact-sheet-screens.png`).
- **Vector assets:** `assets/svg/` (33 standalone SVGs; overview in `assets/contact-sheet-svg.png`).
- **Components and composite graphics:** `assets/components/` (22 PNG captures of HTML/CSS components; overview in `assets/contact-sheet-components.png`).
- **Source of truth for construction:** `source/index.html`. Visual functions are named `vTF`, `vBlocks`, `vPlates`, `vItems`, `vArray`, `vLine`, `vFracBar`, `vFracCircle`, `vBarModel`, `vTri`, `vPlace`; icons are in `ICON`, `OPICON`, `GEM`, `starSVG`.

Captures use the real fonts. Emoji in captures are the Linux system set and will look different on her device, which is one of the problems to fix.

## 4. Graphics inventory

Status: **Keep** (refine only), **Redraw** (same job, new drawing), **New** (does not exist yet).

### Maths graphics (the kit)

| Graphic | File(s) | Used for | Status |
|---|---|---|---|
| Ten-frame, 5 × 2, counters in two colours (given, added) | `svg/ten-frame-7.svg`, `svg/ten-frame-given-4-added-3.svg`, `components/ten-frames-14.png` | Seeing amounts, making 10 and 20 | Keep |
| Base-ten blocks: hundred flat, ten rod, one cube | `svg/block-hundred.svg`, `block-ten.svg`, `block-one.svg`, `components/blocks-247.png`, `blocks-sum-27-and-15.png` | Place value, adding | Keep. Decide a place-value colour rule (section 6). |
| Dot array with strategy split and crossed-out row | `svg/array-*.svg` | Times-table strategies (double-double, 5 + 2 groups, 10 − 1 group) | Keep |
| Skip-count rows with running total | `screens/practice-08-hands-on-rows.png` | Building a times fact | Keep |
| Number line: ticks, labels, marker dot, pointer arrow, jump arcs | `svg/number-line-*.svg` | Placing, reading, adding by jumps | Keep. Extend: bare line with end labels only, fraction and decimal ticks, negative side. |
| Fraction bar and fraction circle | `svg/fraction-bar-3-of-4.svg`, `fraction-circle-3-of-8.svg`, `components/fraction-compare-quarter-eighth.png` | Fractions | Keep |
| Bar model: whole over parts, unknown part dashed | `components/bar-model-*.png` | Subtraction as missing part | Keep. Becomes the base for word-problem diagrams. |
| Fact triangle | `svg/fact-triangle-*.svg` | Multiplication/division fact families | Keep |
| Place-value table | `components/place-value-table-347.png` | Value of a digit | Keep |
| Plates (round) and boxes (square) holding countable items | `components/plates-*.png`, `boxes-4-groups-of-3.png` | Equal groups, sharing, grouping | Redraw. Containers stay; contents change (next row). |
| Countable items: cookie, apple, star, shell, strawberry, marble, heart, leaf (platform emoji) | `components/story-item-emoji.png`, `items-12-take-away-5.png` | Everything counted | **Redraw as a drawn set.** Simple, flat, one colour family each, readable at 22 px, age-neutral (coins, tokens, cards, beads, tickets, tiles). Two or three context themes she can choose. |
| Operation meaning icons: put together, take away, equal groups, share | `svg/op-*.svg` | Word problems | Redraw. Too small and crowded at phone width (`screens/practice-12`). |
| Number-sentence strip (live equation beside a manipulative) | none | F-3.AC-2 | **New** |
| Word-problem type diagrams: Total, Change, Difference, Equal groups, Times as many | none | F-11 | **New.** One diagram per type, each with fillable slots and an unknown state. |
| Number-line estimation feedback (her mark, true position, benchmark) | none | F-12.AC-2 | **New** |
| Decimal grid (10 × 10) and percent bar | none | F-21 | New, later |

### Interface graphics

| Graphic | File(s) | Status |
|---|---|---|
| Star in four states: lit, in progress, open, locked | `svg/star-*.svg`, `components/star-tiles-four-states.png` | Keep. **Add a fifth: pending** (earned today, confirmed on a later day; F-7.AC-6). |
| Gem (currency) | `svg/gem.svg` | Keep or redraw to match |
| Level-up and switch-level badges | `svg/badge-*.svg` | Keep |
| Line icons: close, read aloud, hint, backspace, left, right | `svg/icon-*.svg` | Keep; extend set (replay lesson, skip, report, settings) |
| Avatars: 12 animal and object emoji | `components/avatars-all.png` | **Redraw or replace.** Options to propose: abstract constellation emblems, monogram badges, or a small set of non-childish characters. Ask her (open question Q3). |
| Level indicator (three dots plus label) and chips | `components/stage-chips.png` | Keep |
| Week markers | `components/week-dots.png` | Keep; becomes "4 days this week" goal (F-14.AC-4) |
| Hero star-field background | CSS gradients in `.hero-sky` | Keep or refine |
| Confetti | canvas, runtime | Review: is it right for age 12? Propose a quieter star-lighting moment. |

### Components

Buttons (primary, secondary, ghost), answer options with correct and not-yet states, number keypad with answer display, steppers, question card, hint panel, feedback cards, modal, toast, top bar with avatar and gems, progress bar, star tile, shop tile, settings segmented control, skill row with estimate bar, error-pattern card, times chart. Captures: `components/buttons.png`, `answer-options-states.png`, `number-pad.png`, `stepper.png`, `gem-pill-and-avatar.png`, and the `screens/state-*` files.

New components for v2: lesson player (watch / together / your turn, with step dots and replay), number-sentence strip, "say it" sentence picker, vocabulary pop-up, facts set view and quick-round screen (progress bar only, no digits), session segment indicator, "How did that feel?" three-choice control, check-up screen, check-up trend chart, printable one-page report, pending-star treatment.

## 5. What to deliver

1. **Design system** (as a Design System artifact): colour tokens for light and dark, accent themes, type scale, spacing, radii, elevation, motion. Return them as `design/tokens.json` in the same shape as `tokens.v1.json`.
2. **Component specs** for every component in section 4, with all states (default, pressed, focus, disabled, correct, not yet).
3. **Maths graphics kit:** construction rules and SVGs for each graphic, named `kit-<graphic>-<variant>.svg`, drawn with `currentColor` or token names, no embedded text that must be translated or read aloud.
4. **Item and avatar sets** as SVG, with her input.
5. **Key screens** at 390 px and 820 px, light and dark: home (star map), lesson player, one practice screen per hands-on widget, feedback (correct and not yet), facts set and quick round, word-problem diagram, check-up, session wrap-up, grown-up view, printed report.
6. **Motion notes:** what moves, for how long, and the reduced-motion alternative. Dealing an item onto a plate and a jump along the number line are worth animating because the movement is the concept.

## 6. Requirements and constraints

From the spec and the platform:
- Touch targets at least 48 px. Text contrast WCAG 2.2 AA in both themes. Visible keyboard focus.
- Nothing carried by colour alone: correct and not-yet states also differ by icon or border style; given and added counters differ by more than hue.
- No countdown digits or clock imagery anywhere (F-16.AC-2).
- Not-yet feedback is warm clay, never red; correct is a calm green.
- All text is live text. SVG inline, no raster images, no remote images. Fonts from Google Fonts only.
- Styling through CSS variables from the token file; light and dark both designed, not inverted.
- Phone layout from 360 px; the page body never scrolls sideways.
- Reduced motion: everything understandable with no animation.

Design judgment to apply (my recommendations, not research findings):
- Keep each manipulative's appearance fixed everywhere so a rod always reads as ten.
- Choose one rule for place-value colour (all one hue, or a fixed hue each for hundreds, tens, ones) and never reuse those hues for feedback.
- Keep numerals highly distinguishable (1, 7; 6, 9; 0, O) with tabular figures. Atkinson Hyperlegible was chosen for this; replace it only with something that does it as well.
- Give digits and operators generous spacing in number sentences.
- Keep the home screen short on a phone. v1's star chart is a long scroll (`screens/flow-04`); consider one map that fits a screen.

## 7. Known v1 visual problems

- "Which operation?" options overflow and wrap badly at 390 px (`screens/practice-12-hands-on-story-situation.png`).
- Platform emoji vary by device and skew young.
- The star chart needs five group cards and a long scroll on a phone.
- The grown-up view is one very long page (`screens/flow-07`); it needs sections or tabs and a print layout.
- The jump labels on the number line get cramped past six jumps (`svg/number-line-jumps-34-plus-23.svg`).
- Gems, shop and confetti were designed for a younger child; confirm the tone with her.

## 8. Open questions for the owner

- What would she pick for avatars and story themes? (Q3 in the spec.)
- Should the star-chart metaphor stay? It is neutral in age, but her opinion decides.
