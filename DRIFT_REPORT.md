# Drift report: milestone M0 (port)

- **Spec:** `SPEC.md` v2.0-draft (awaiting approval). M0 is the only approved milestone.
- **Date:** 2026-11-21
- **Scope:** Move v1 (`source/index.html`) into the repository structure from SPEC section 7 with no behaviour change. Put storage behind an interface, route all randomness through one seedable generator, and port the v1 tests.
- **Result:** `npm run accept` passes. All 16 M0 exit criteria have passing tests. F-1.AC-2 was parked until the owner approved it on 2026-11-21 (see "Update, 2026-11-21" at the end). The build is one file, `dist/index.html`, at 145 KB (limit 1.5 MB).

## M0 exit check

| Criterion | Status | Test |
|---|---|---|
| F-1.AC-1 welcome, nickname of 1 to 20 characters, one free avatar | pass | `tests/ui/app.spec.ts` |
| F-1.AC-2 asks for a nickname; stores no sensitive fields | pass (approved 2026-11-21) | `tests/ui/app.spec.ts` |
| F-1.AC-3 two learners, switching, separate progress | pass | `tests/ui/app.spec.ts` |
| F-2.AC-1 skills, groups and prerequisites match section 12 | pass (parsed from `SPEC.md` itself) | `tests/acceptance/m0-engine.test.ts` |
| F-2.AC-2 skill with an unmastered prerequisite never picked for new practice | pass (300 random profiles) | same |
| F-5.AC-1 400 questions per (skill, level, easy/hard) are valid | pass (33,600 questions) | same |
| F-5.AC-2 every build task solvable; correct solve marked correct | pass (v1 smoke sweep, plus real taps on all 10 widgets) | `tests/ui/smoke.spec.ts` |
| F-6.AC-1 wrong-answer feedback order; no red, no buzzer, no lost gems | pass | `tests/ui/app.spec.ts` |
| F-6.AC-2 21 patterns detected; subtract-on-division always caught | pass | `tests/acceptance/m0-engine.test.ts` |
| F-6.AC-3 sentence, description, activity; grown-up list by count | pass | both files |
| F-7.AC-1 BKT parameters, guess by mode, starting estimates | pass | `tests/acceptance/m0-engine.test.ts` |
| F-7.AC-2 move up | pass | same |
| F-7.AC-3 move down; from hands-on, weakest prerequisite reopens at pictures level | pass | same |
| F-7.AC-4 hinted correct answer is half a step and never counts toward moving up | pass | same |
| F-20.AC-1 persists across reloads; a v1 save loads | pass (fixture recorded from the real v1 file) | both files |
| F-20.AC-3 backup copy and restore; malformed code rejected, nothing changes | pass | both files |
| Build is one file | pass | `tests/ui/build.spec.ts` |

Also tested now, because the M0 brief asked for them or they cost nothing:
- F-20.AC-2: the storage interface, in `tests/unit/store.test.ts`.
- F-20.AC-4: no network requests except fonts, in `tests/ui/app.spec.ts`.

## How "no behaviour change" was checked

1. **Engine parity** (`tests/unit/parity.test.ts`). v1's `<script id="engine">` runs in a sandbox with `Math.random` replaced by the port's generator. With the same seed, all 5,040 sampled questions match v1 exactly, field for field: 60 for each skill, level and easy/hard setting. The learner model matches over a 1,500-answer stream, and placement matches over 50 answer patterns.
2. **Screen parity** (`tests/ui/parity.spec.ts`). v1 and the port are put in the same state with the same seed, then 87 screens are screenshotted in light and dark: home, shop, grown-up view, and every skill and level before and after feedback. All 174 pairs match within anti-aliasing tolerance (24/255 per channel). At zero tolerance, the only differences are 84 edge pixels of the progress bar, at most 16/255, on 8 of the 174 pairs.
   - This check found two port bugs, both now fixed. The star-chart cards had lost their rounded corners because a CSS variable was renamed. Some text had sub-pixel shifts because JSX split strings into several text nodes.
3. **v1 tests ported.**
   - `engine_test.js` became F-5.AC-1 plus `tests/unit/simulation.test.ts`. v1 only printed the simulation outcomes; they are now asserted.
   - `smoke.py` became `tests/ui/smoke.spec.ts`.
   - `capture.py` and `contact_sheets.py` produce design assets, not tests. They stay in `source/tests/` for reference.

## Where things live

| Code | Spec items |
|---|---|
| `src/engine/skills.ts` | F-2 skill map, ladder, level names |
| `src/engine/generators.ts`, `visuals.ts`, `content.ts` | F-3 levels, F-5 questions, F-6 option-to-pattern tags, F-12.AC-1 number line |
| `src/engine/misconceptions.ts` | F-6 the 21 patterns |
| `src/engine/model.ts` | F-7 BKT and level moves, F-9 v1 review choice, F-15.AC-2 gems (amounts in `src/app/data.ts`) |
| `src/engine/placement.ts` | F-8 v1 placement |
| `src/engine/rng.ts` | Section 7 determinism: the only random source |
| `src/storage/schema.ts` | F-20.AC-1 schema version and migrations, F-20.AC-3 backup code |
| `src/storage/store.ts` | F-20.AC-2 `StorageAdapter` interface, `DeviceAdapter`, `AccountAdapter`, `Store` |
| `src/design/tokens.ts` | Section 7 design system: every colour, font and token size becomes a CSS variable |
| `src/app/views.tsx` | Preact screens for F-1, F-14, F-15, F-17, F-19 |
| `src/app/flow.ts` | Session flow, actions, keyboard, press-and-hold gate |
| `src/app/effects.ts` | Read-aloud (F-19.AC-1), sound setting (F-17.AC-2), reduced motion (F-19.AC-3) |

## Deliberate differences from v1

None of these is visible to the learner.

- **Randomness:** every `Math.random` call, including confetti and the profile id suffix, now goes through `src/engine/rng.ts`. It is seeded from the clock and `crypto` at start-up.
- **Division questions** carry a `meta` field (`÷`, dividend, divisor) so F-6.AC-2 can be tested exactly. The UI ignores it.
- **Saves:** a stored value that is not a valid save now loads as "no data". In v1, a parseable but wrong-shaped value crashed on start-up.
- **Restore box:** the "Restore from a backup code" box keeps its text when other grown-up settings are tapped. v1 cleared it on every re-render.
- **Test hooks:** these are installed only when the URL contains `?nstest`. The UI checks use them the same way v1's `smoke.py` used page globals.
- **Token file:** `design/tokens.v1.json` gained the v1 values its first export missed, each marked "added in M0 port":
  - `color.*.on-sky` (`#FFFFFF`)
  - `color.*.scrim`
  - `elevation.cardDark`
  - `elevation.button`, `elevation.buttonPressed`
  - `font.mono`

  No existing value changed. Claude Design should include these keys in `design/tokens.json`.

## v1 behaviour not mapped to a spec feature

Each of these is kept as built. The spec should either adopt it or say it should go.

1. **Return-to-level bonus.** Climbing back to a level after being moved down gives +2 gems and a toast instead of the level-up modal. F-15.AC-2 lists no "+2" amount.
2. **Second step down in a session** on the same skill shows a toast instead of the modal.
3. **"5 more questions"** button on the summary screen. F-14 does not mention it.
4. **Easy or hard variant.** A non-review question uses the easier variant when the estimate at that level is below 0.5. F-5.AC-1 names easy and hard but no rule picks between them.
5. **Review level.** A review question is at numbers level 70% of the time and at pictures level 30% of the time. F-9 does not say.
6. **Review reopening.** A skill reopens when one review answer leaves its estimate below 0.40. From a typical lit estimate (about 0.9) that takes two misses, which matches the grown-up text. A lower estimate could reopen after one miss. F-9.AC-2 says two misses with the estimate below 0.40.
7. **Starting gems.** A new learner starts with 10 gems.
8. **"Who's practising?"** screen, shown when learners exist but none is current.
9. **Fallback question.** If a generator throws, the app shows an easy "Seeing amounts" pictures question instead. Defensive only; the test suite never triggers it.
10. **Artifact hot-reload hooks** (`window.claude.hot.snapshot` and `ready`). Section 6 lists only `db`, `user` and `tts`.
11. **Confetti** when a star is lit and at the end of a session. It is listed under `motion` in the tokens but not in any feature. Reduced motion turns it off.
12. **Warm-up wording.** The warm-up intro says "About 8 questions"; the code allows up to 12. This becomes F-8 placement (CHANGE) in M3.
13. **Praise lines** such as "Great job." are generic. They neither refer to strategy as F-15.AC-4 asks nor break its rule against "smart" or "fast". This is CHANGE territory for M1 and later.

## Gaps against section 7 constraints

- **Size literals.** No colour or font literal appears in `src/` outside `src/design/tokens.ts`, and a test enforces that. Sizes the token file defines are used through variables: 285 `var()` uses. The token file does not define most of v1's paddings, gaps and smaller font sizes, so 342 px/rem/em literals remain in `src/app/styles.css`. Removing them needs a fuller token set; that is a design-system deliverable.
- **Font link.** The Google Fonts link in `index.html` names the families directly.
- **Fixed geometry.** Number-line tick lengths, label offsets and fact-triangle node positions are fixed numbers in `src/engine/visuals.ts`. Only the token-defined geometry is read from tokens.
- **Preact is used for the screens.** Engine visuals stay HTML/SVG strings, inserted with `dangerouslySetInnerHTML`, and taps still go through v1's single `data-act` listener. This kept the port exact. Converting widgets to components can happen as M1 to M3 rebuild them.

## Needs a decision

1. **F-1.AC-2 conflicts with the M0 rules.** The M0 exit check says "F-1 passes", but F-1.AC-2 is marked CHANGE (the label and help text should say nickname). v1 asks "What's your name?", and CHANGE items are not approved. The test is written exactly as the criterion says and parked with `test.fixme`. The no-sensitive-fields half already holds: the form has one text field, and the saved profile has no birth date, school or diagnosis. If you approve the CHANGE, it is a one-line label change and the test can be un-parked.
2. **F-6.AC-2 wording.** "Detected whenever the answer equals dividend minus divisor" cannot apply when the correct answer itself equals dividend minus divisor (only 4 ÷ 2). That answer is marked right, and the test excludes the case. Suggest adding "when that is not the correct answer".
3. **Open questions Q1 to Q6** in `SPEC.md` section 9 are unchanged. Q1 (hosting) decides which storage adapter is primary. Both work today.

## Update, 2026-11-21: approvals applied

The owner approved the open items above and the design system's amendments. `SPEC.md` is now **v2.1-draft**.

- **F-1.AC-2:** built. The welcome label reads "What should we call you?" with the help line "A nickname is fine. We don't need your real name." (`design/SCREENS.md` §11). The help line sits inside the label element, so screen readers hear it with the field. The test that was parked now runs unchanged and passes.
- **F-6.AC-2:** wording now excludes the case where dividend minus divisor is the correct answer. The test already did.
- **Design amendments (D-14 to D-17)** are in the spec as criteria and milestones, not built yet:
  - F-5.AC-6 keyboard entry at numbers level (M1). v1 already accepts digits, Backspace and Enter on the keypad.
  - F-19.AC-6 keyboard path for every build widget (M3).
  - F-15.AC-6 the four accent themes, with v1 themes loading as Cobalt (M3).
  - Quick rounds default Off (F-10, M2).
  - Desktop first (section 7) and the 1280 × 800 key-screen size (`DESIGN_BRIEF.md` §5).
- **Design swap:** the app still builds from `design/tokens.v1.json`. Moving onto `design/tokens.json` and the kit changes how every screen looks: new fonts, no shadows, removal of the confetti and the "Now" pulse, items and avatars as SVG instead of emoji. The spec places that work with F-19.AC-5 in M3, so it waits until the rest of the spec is approved, or until the owner asks for it sooner. Keys the port uses that `tokens.json` drops are: `on-sky`, `font.mono`, `type.heroH1`, `size.starTile`, `elevation.*` and `motion.currentStarPulse`. Each needs a mapping at the swap.
- **Still open:** Q1 and Q3 to Q6 in `SPEC.md` section 9, and the design's choices waiting on her (avatar style, story themes, starting colour).

## Milestone MD: design brought forward (2026-11-21)

- **Spec:** v2.2-draft. D-18 adds milestone MD before M1: restyle and re-lay out every existing screen to `design/` ("Star Lines"). F-19.AC-5 and F-15.AC-6 moved from M3 to MD.
- **Result:** `npm run accept` passes. All 16 M0 criteria still pass, plus F-15.AC-6 and F-19.AC-5. The build is 246 KB.

### What changed

- **Tokens:**
  - `src/design/tokens.ts` now reads `design/tokens.json`.
  - Compact values switch in below 720 px through CSS variables.
  - `tokens.v1.json` stays in the repo for reference.
- **Kit:**
  - `src/design/kit.ts` inlines `design/kit-*.svg`, so theme colours apply. Items, badges, stations, icons, blocks, dialog badges and operation cards all come from the kit.
  - Story items are the 10 kit items (tickets, coins, pucks...) in place of v1's emoji foods and shapes. Which themes ship is her choice (Q3).
- **Layouts (desktop first, phone still works):**
  - Home has a header, a side column (Next stop, This week, key) and the star-lines map. It fits 1280 × 800.
  - Practice has the question card and a "Need a hand?" aside on wide screens. On phones the aside becomes a three-button row.
  - Feedback sits beside the question on wide screens and below it on phones.
  - Grown-up view has five tabs.
  - The shop becomes Customize, with Badge and Colour tabs.
- **Look:**
  - Borders instead of shadows, and a dot-grid page.
  - Space Grotesk for words, Atkinson Hyperlegible for all text and numerals.
  - Given counters are discs; added counters are rings with a centre dot.
  - Correct = solid border plus a check; not yet = dashed border plus a turn-around arrow.
  - "I'm not sure" gets a neutral card, not the warm one.

### Behaviour the design changed (all from `design/`, approved with D-18)

- **Confetti and the pulsing "Now" star are removed.** The star-lit dialog replaces confetti.
- **Grown-ups hold:** 2 s instead of 1.2 s, with a ring that fills while she holds.
- **Toasts** stay up 4 s instead of 2.4 s.
- **Sounds** default off for new learners. There is no sound for a wrong answer at all; v1 played a soft tone.
- **Themes:** Cobalt (default), Ocean, Berry and Graphite. A saved theme outside that set loads as Cobalt and stays owned (F-15.AC-6).
- **Badges** replace emoji buddies (F-19.AC-5):
  - Square, Circle and Roundel are free.
  - Ticket and the six emblems cost what v1's buddies cost (20 to 50 gems). That's a placeholder until she chooses (Q3).
  - A saved emoji buddy loads as the Square badge.
- **Copy** follows the design:
  - "Next stop", "Start today's practice", "Your star lines", "Customize".
  - "Light up a star for every maths skill you master."

### Kept as v1 because the design part needs an unbuilt feature

- **Question dots** stay in the top bar. The session-parts indicator waits for F-14.
- **"This week"** shows the last 7 days as in v1. The 4-day goal is F-14.AC-4.
- **No number-sentence strip** (F-3.AC-2), "Show me how" (F-4) or lesson player (F-4).
- **Wrap-up** keeps v1's stats. "What changed" and "How did that feel?" are F-14.AC-5.
- **Customize has no Story theme tab** (F-11).
- **Grown-up view** has no theme setting, check-up trend, report or supplement statement (F-17, F-18).

### Tests changed for MD

These acceptance tests had selectors or values pinned to v1's look. Each now checks the same criterion against the approved design:
- **F-1.AC-1:** free badges instead of emoji buddies.
- **F-1.AC-3, F-20.AC-1, F-20.AC-3:** the grown-up tabs and the name header.
- **F-6.AC-1:** the new card structure, in the same order the criterion requires. "No buzzer" is now checked with sounds switched on, and expects no sound at all.
- **F-6.AC-3:** "Seen N times" and the definition list.
- **F-20.AC-1 (unit):** v1 avatar and theme migration.

Other test changes:
- **New:** `test_F15_AC6` and `test_F19_AC5`.
- **Retired:** the v1 pixel-parity check (`tests/ui/parity.spec.ts`), which proved M0 changed nothing visible.
- **Engine parity kept:** it now injects the kit items into v1 and compares question text and maths, so the questions are still proven identical to v1's.
- **Simulations:** now run on a simulated clock. They had a timing dependence (reviews pick the least recently seen skill), which made one run fail once.

### Gaps

- **Literal sizes:** many component sizes in `src/app/styles.css` are still written in px. That's where the design specifies them only in `COMPONENTS.md` and not in `tokens.json`. Colours, fonts, radius, borders, spacing and token sizes all come from variables.
- **Breakpoints:** 720 px and 1024 px appear in media queries, because media queries cannot read CSS variables.
- **Keyboard paths:** the per-widget keyboard paths in `SCREENS.md` §3 (arrows on ten-frames and fraction bars, Shift+arrow on number lines) are F-19.AC-6, which is M3. Every control is already a button reachable with Tab.

## Milestone MW: workbook check (2026-11-21)

- **Spec:** v2.3-draft.
  - D-19 adds F-22 (workbook check) and milestone MW.
  - D-20 records no external backend (no Supabase) and resolves Q1: private Claude artifact with on-device fallback.
  - Section 6 adds the runtime's `sample` capability with images.
- **Result:** `npm run accept` passes. All 7 F-22 criteria are tested, and M0 and MD criteria still pass. The build is 257 KB.

### How it works

1. **Grown-up view → Workbook:** take or choose a photo of the page. `src/app/workbook.ts` sends it to Claude with the skill map. The reply is cleaned to known skill ids, a short topic and up to 5 "not in the app yet" phrases (`cleanReading`).
2. **Confirm:** the grown-up adds or removes skills, then confirms. Only `{at, skills, checkedAt, results}` is saved on the learner. The topic text, the "not in the app yet" list and the photo live in memory only.
3. **Check:** the learner starts it from the home card. Up to 2 numbers-level questions per skill, no hints, "I'm not sure" always there. A miss queues that skill's prerequisites next, so it steps back one skill at a time, at most 16 questions (`src/engine/workbook.ts`).
4. **Results:** passed skills light. Missed skills reopen at pictures level. Focus becomes the earliest open skill on the path to the page, and the normal F-7 moves take her back up. Once every goal skill is lit, reviews favour them. The grown-up can clear the goal.
5. **Without photo reading** (a browser copy, or permission declined), the grown-up picks skills by hand. Everything else is the same.

### Notes and limits

- **Content gap:** the app's 14 skills run to about grade 3. A mid-year grade 6 or 7 page will mostly map to prerequisites; the "not in the app yet" list shows what M4 (F-21) needs to add. Q5 (her school's order) decides which F-21 skill to build first.
- **Usage and consent:** reading a photo uses the viewer's own Claude usage, and the first use asks them to allow images to be sent to Claude.
- **Checked offline only:** the photo path is tested against a stand-in for the runtime. The real call can only be exercised in the published artifact.
- **Pending stars:** passed skills light at once. They become "pending" when F-7.AC-6 (next-day retention check) is built in M1.
- **No external backend.** Progress stays on the device and in her Claude account (D-20).

## Commands

```
npm install
npm run dev        # local dev server
npm run build      # dist/index.html, one file
npm run accept     # typecheck, Vitest, build, Playwright, criteria coverage
```
