# Number Sky

Read `SPEC.md` before any change and state its current version at the start of each session. Build nothing that is not traceable to a feature (F-#) or a constraint in it.

- **Within spec** (implements or fixes an F-#): proceed and name the F-# in the commit message.
- **Spec change** (new feature, changed behaviour, new integration, changed acceptance criterion, weakened constraint): stop, propose the amendment as a diff to `SPEC.md` with a version bump and a decision-log entry, and wait for approval.
- **Unclear:** ask first.

Every acceptance criterion becomes a test named after its ID (for example `test_F7_AC2`). Never edit an acceptance test to make it pass. `npm run accept` runs them all. Write `DRIFT_REPORT.md` at the end of each milestone.

Features marked NEW or CHANGE in `SPEC.md` are not approved until the spec header says so. Milestone M0 (port with no behaviour change) is approved.

Reference material:
- `source/index.html`: the v1 prototype. `<script id="engine">` is the content and learner model; port it first.
- `source/tests/`: v1 generator validation, learner simulations and UI smoke test.
- `RESEARCH_REVIEW.md`: why each change exists (E# evidence, D-# decisions).
- `DESIGN_BRIEF.md`, `design/tokens.v1.json`, `assets/`: current visuals. Read colours, type and sizes only from the token file.

This app holds a child's learning data. No analytics, no third-party scripts, no network calls beyond fonts, nickname only.
