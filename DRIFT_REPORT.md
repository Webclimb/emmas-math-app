# Drift report: milestone M0 (port)

- **Spec:** `SPEC.md` v2.0-draft (awaiting approval). M0 is the only approved milestone.
- **Date:** 2026-11-21
- **Scope:** Move v1 (`source/index.html`) into the repository structure from SPEC section 7 with no behaviour change. Put storage behind an interface, route all randomness through one seedable generator, and port the v1 tests.
- **Result:** `npm run accept` passes. 15 of the 16 M0 exit criteria have passing tests. F-1.AC-2 is parked: see "Needs a decision" below. The build is one file, `dist/index.html`, at 145 KB (limit 1.5 MB).

## M0 exit check

| Criterion | Status | Test |
|---|---|---|
| F-1.AC-1 welcome, nickname of 1 to 20 characters, one free avatar | pass | `tests/ui/app.spec.ts` |
| F-1.AC-2 asks for a nickname; stores no sensitive fields | **parked (CHANGE not approved)** | `tests/ui/app.spec.ts` (`test.fixme`) |
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

## Commands

```
npm install
npm run dev        # local dev server
npm run build      # dist/index.html, one file
npm run accept     # typecheck, Vitest, build, Playwright, criteria coverage
```
