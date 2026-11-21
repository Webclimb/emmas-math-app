# Handoff prompts

Paste-ready starting prompts for each agent. Attach or point each one at this folder.

## Order of work

1. **Owner:** read `RESEARCH_REVIEW.md` (verdict and decisions), answer the open questions in `SPEC.md` section 9, approve or amend the spec.
2. **Claude Code, M0:** can start now. It ports v1 with no behaviour change and needs no design input.
3. **Claude Design:** runs in parallel with M0. Ideally the learner looks at two or three directions before one is chosen.
4. **Claude Code, M1 onward:** starts once the spec is approved. It uses `design/tokens.v1.json` until `design/tokens.json` and the graphics kit arrive, then swaps them in.

The contract between the two agents is the token file shape (`design/tokens.v1.json`), the graphic names in `DESIGN_BRIEF.md` section 5, and the component list in section 4.

## Prompt for Claude Design

> I'm handing you a maths practice app for a 12-year-old with dyscalculia, called Number Sky. Read `DESIGN_BRIEF.md` first, then look at `assets/contact-sheet-screens.png`, `assets/contact-sheet-svg.png` and `assets/contact-sheet-components.png`, and open `design/tokens.v1.json`. `SPEC.md` defines behaviour; don't change it, and tell me if the brief conflicts with it.
>
> Create a design system for this app: tokens for light and dark, component specs with states, and a maths graphics kit. Start by showing me two or three directions for the overall look that would suit a 12-year-old (not a young child), each applied to the same three screens: the home star map, a hands-on practice question (sharing onto plates), and the "not yet" feedback card. I'll choose one with my daughter before you go further.
>
> Then deliver everything in section 5 of the brief. Return tokens as `design/tokens.json` in the same shape as `tokens.v1.json`. Name graphics `kit-<graphic>-<variant>.svg`. Follow the requirements in section 6: no countdowns or clocks, no red for wrong answers, nothing carried by colour alone, all text live, SVG only.

## Prompt for Claude Code

> This folder is the handoff for Number Sky, a maths practice app for a child with dyscalculia. Read `CLAUDE.md`, then `SPEC.md` in full, and tell me the spec version and which milestone you are starting. `source/index.html` is the working v1 prototype and `source/tests/` has its tests.
>
> Start milestone M0 only: set up the repo described in `SPEC.md` section 7 (TypeScript, Vite, Preact, Vitest, Playwright, single-file build), port the v1 engine and UI with no behaviour change, put storage behind the interface in F-20.AC-2, route all randomness through one seedable generator, and port the v1 tests so that `npm run accept` passes the criteria listed for M0 in section 13. Use `design/tokens.v1.json` for every colour, size and font.
>
> Do not build anything marked NEW or CHANGE yet. When M0 passes, write `DRIFT_REPORT.md` and stop. List anything in the v1 code that you could not map to a feature in the spec.

## Prompt for later milestones (Claude Code)

> `SPEC.md` is now approved at version v2.0. Start milestone M<n> from section 13. Write the acceptance tests for its criteria first, show me the list, then implement. Follow the change control in `CLAUDE.md`.
