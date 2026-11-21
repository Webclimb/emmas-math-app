# Number Sky handoff package

Prepared 2026-11-20. Everything another agent needs to continue the Number Sky build: the research behind the changes, the build spec, the design brief, the current graphics, and the working v1 source.

## Start here

| If you are | Read | Then |
|---|---|---|
| The owner | `RESEARCH_REVIEW.md` (verdict and decisions) | Answer `SPEC.md` section 9, approve the spec |
| Claude Code | `CLAUDE.md`, then `SPEC.md` | Use the prompt in `HANDOFF_PROMPTS.md` |
| Claude Design | `DESIGN_BRIEF.md` | Use the prompt in `HANDOFF_PROMPTS.md` |

## Contents

```
README.md               this file
RESEARCH_REVIEW.md      evidence (E1-E19), comparison with v1, decisions (D-1 to D-13), sources
SPEC.md                 build spec v2.0-draft: 21 features with acceptance criteria, milestones
DESIGN_BRIEF.md         brief for the design framework, with the graphics inventory
HANDOFF_PROMPTS.md      order of work and paste-ready prompts for each agent
CLAUDE.md               standing instructions for Claude Code (spec-first change control)
design/tokens.v1.json   current colours, type, spacing and graphic construction sizes
assets/
  contact-sheet-*.png   three overview sheets (screens, vector assets, components)
  svg/                  33 standalone SVGs: stars, icons, manipulatives, diagrams
  components/           22 PNG captures of components and composite graphics
  screens/              50 screen captures: flows, every practice widget, states, dark, tablet
source/
  index.html            the working v1 app (single file)
  tests/                engine validation and simulations, UI smoke test, capture scripts
```

## Status

- v1 is live as a private Claude artifact and is unchanged by this package.
- The spec is a draft. Milestone M0 (port, no behaviour change) can start now; everything else waits for approval.
- Captures were generated from the v1 source with the real fonts. Emoji in them come from the capture machine and differ by device.

## Development (from milestone M0)

The app now lives in a TypeScript repo that still builds to one self-contained `index.html`. `source/` stays as the v1 reference.

```
src/engine/    skills, generators, learner model, placement, seeded random (pure TypeScript, no DOM)
src/storage/   storage interface, device and artifact-account adapters, schema migrations
src/design/    design tokens -> CSS variables (reads design/tokens.json) and the kit SVG loader
src/app/       Preact screens, session flow, effects
tests/         acceptance (Vitest), unit, ui (Playwright, against dist/index.html), fixtures
```

- `npm install`
- `npm run dev`: development server
- `npm run build`: builds `dist/index.html`
- `npm run accept`: typecheck, Vitest, build, Playwright and a criteria-coverage list

`DRIFT_REPORT.md` records what each milestone changed and what still needs a decision.
