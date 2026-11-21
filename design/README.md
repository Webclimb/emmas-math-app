# Number Sky design: direction B, "Star Lines"

Chosen on 2026-11-20 for desktop (primary) and phone. Skills are stops on transit-style lines: one line per skill group, and the track turns solid as stars light. The look is flat, crisp and light-first, with ink borders instead of shadows, a dot-grid page, cobalt for action, yellow for lit stars and violet for counted items.

This folder answers `DESIGN_BRIEF.md` §5. `SPEC.md` defines behaviour and wins any conflict. The conflicts found are listed at the end.

## What's here

| File | Brief §5 item | What it is |
|---|---|---|
| `tokens.json` | 1 | Design tokens in the same shape as `tokens.v1.json`. Replaces it |
| `COMPONENTS.md` | 2 | Every component with its states, sizes, tokens, keyboard and accessibility rules |
| `reference/components.html` | 2 | All components rendered in every state, light and dark |
| `kit-*.svg` (98 files), `kit-index.html` | 3, 4 | Maths graphics, word-problem diagrams, items, avatars, stations, badges, icons. Contact sheet in light and dark |
| `GRAPHICS.md` | 3 | Construction rules, place-value colour rule, live-text positions, inventory |
| `SCREENS.md` | 5 | Layout of every key screen at desktop and phone |
| `reference/screens/*.html` | 5 | Responsive reference pages: home, practice (sharing, clickable), feedback (not yet and correct), lesson player |
| `MOTION.md` | 6 | What moves, how long it takes, and the reduced-motion version of each |
| `previews/*.png` | | Screenshots of the reference pages and kit, for quick review only (the app uses no raster images). They were rendered offline, so they show fallback fonts; open the HTML to see Space Grotesk and Atkinson Hyperlegible |
| `tools/` | | Scripts that regenerate the kit, the reference pages and the contrast check from `tokens.json` |

Open the `.html` files straight from disk in a browser. They load fonts from Google Fonts and nothing else.

## For Claude Code

Use this prompt in place of the "when design arrives" prompt in `HANDOFF_PROMPTS.md`:

> The design system is in `design/`: read `design/README.md` first. Replace `tokens.v1.json` with `design/tokens.json` and map renamed tokens as listed in the README. Replace platform emoji with the kit's item and avatar SVGs (F-19.AC-5), inlined so theme variables apply. Restyle existing components to `design/COMPONENTS.md`, using `design/reference/components.html` as the visual reference. Change no behaviour, with one exception: the top bar's question dots become the session-parts indicator only when F-14 is built. Report any component in `SPEC.md` that the design does not cover, and anything in the design that conflicts with `SPEC.md`.

### Token changes from v1

- **Kept, same meaning:** `bg`, `surface`, `surface-2`, `ink`, `ink-soft`, `line`, `accent`, `accent-ink`, `accent-soft`, `good`, `good-soft`, `warm`, `warm-soft`, `blk`, `blk-line`.
- **Changed role:**
  - `sky` no longer colours the focus ring; that is now `focus`.
  - `warm` (light) is darker, `#A2461F`, so it passes as text.
- **New:** `grid`, `hover`, `line-strong`, `counter-2`, `accent-text`, `focus`, `star`, `star-ink`, `item`, `item-detail`, `scrim`. Each new key's `role` in `tokens.json` starts with "NEW".
- **Fonts:** the display face changes from Bricolage Grotesque to Space Grotesk, and is used for words only. Atkinson Hyperlegible stays for all text and every numeral.
- **Accent themes:** Cobalt (default), Ocean, Berry, Graphite. v1's Lime, Coral and Lavender clashed with correct, not-yet and items. A saved v1 theme maps to Cobalt.
- **Shape:** no shadows (`elevation`), and a new `border` group.
- **Sizes:** plate 100 / 132, station 40 / 48, breakpoint 720 px.

## Decisions made in the design (and why)

1. **One hue for base-ten blocks.** Shape and size carry place value, so colour is free for feedback (brief §6 asked for a rule).
2. **Blocks redrawn on one unit.** v1's cube was bigger than a tenth of its rod, which works against F-3.AC-3.
3. **Added counters are rings, not just another colour.**
4. **Not yet = dashed border plus a turn-around arrow. Correct = solid border plus a check.** This holds on options, slots and cards.
5. **No number-key shortcuts on numeric answer options.** Key labels would put extra digits next to answers. The physical keyboard still types answers at numbers level.
6. **Confetti replaced** by a star-lit dialog and a track-fill on the map. **The pulsing "Now" star is removed.**
7. **Question-count dots replaced** by a four-part session indicator (Warm-up, Focus, Facts, Wrap-up). It never shows time.
8. **Fact states have child-facing names** (New, Building, Got it, Solid), so nothing says "fast" (F-15.AC-4).
9. **"I'm not sure" gets a neutral card, not the warm not-yet card.** Asking isn't a mistake.
10. **A tile she can't afford** says "14 more to go", never "locked".
11. **Quick rounds default to Off**, following the owner's decision to leave timed rounds out for now.

## Waiting on her (Q3)

These are drawn and ready, but her choice decides them:

- [ ] **Avatar style:** monogram badge in square (default), circle, roundel or ticket frame; or one of six emblems (orbit, comet, mountain, wave, compass, constellation). Pick one style as the free default; the rest become Customize items.
- [ ] **Story themes:** Games (ticket, token, card), Money (coin, bill), Sport (puck, ball, cone), plus Neutral (bead, tile). Pick which ship and which one is the default.
- [ ] **Accent colour:** Cobalt, Ocean, Berry or Graphite as her starting colour.

## Changes needed in `SPEC.md` (for the planning chat)

1. **§7 Devices and §8 Assumptions:** change "touch first" and "a tablet or laptop is the main device" to: desktop browser first, mouse and keyboard; tablets and phones from 360 px must still work.
   - This adds physical-keyboard entry at numbers level (digits, Backspace, Enter), with the on-screen keypad kept (F-5.AC-3).
   - It adds a keyboard path for every build widget (`SCREENS.md` §3).
2. **§8 Assumptions:** quick rounds default to Off, not Offer (F-10.AC-6 default).
3. **Brief §5:** key-screen sizes are now 390 px and 1280 × 800 (was 390 and 820).
4. **F-15.AC-2 / shop:** v1's accent themes are replaced by the four above. Add a migration so a saved v1 theme maps to Cobalt, keeping F-20.AC-1 (a v1 save loads in v2).
5. **The design prompt said "no timers" while F-10.AC-5 allows a 60-second quick round.** The design follows the spec (slim bar, no digits, no clock), and the quick round ships Off.

## Checks run

- **Contrast:** every text pair in both themes and all accent themes passes WCAG 2.2 AA (4.5:1). Every graphic or control boundary that carries meaning passes 3:1. Lowest text pair: `good` on `good-soft` in light, 4.62. Full output in `tools/contrast-check.txt`; rerun with `python3 tools/contrast.py tokens.json`.
- **Text in SVGs:** no kit SVG contains a `<text>` element.
- **Rendering:** the reference pages were rendered at 1280 × 800 and 390 × 844, light and dark. Screenshots are in `previews/`.
- **Interaction:** the sharing page was clicked through: dealing 12 round-robin completes `15 ÷ 3 = 5`, and Undo reopens it.

## Not drawn yet

These are specified in text only: the printed report (`SCREENS.md` §10), the grown-up view (§9), welcome and warm-up (§11), the check-up and wrap-up screens (§7–8), and practice screens for widgets other than sharing (§3). All of them are built from the components above.

The brief's "Design System artifact" was not created. Everything it would hold is in this folder.
