# Number Sky: build spec

**Spec version: v2.0-draft (awaiting approval).** v1.0 is the as-built prototype in `source/index.html`, written before this spec existed and described here after the fact. Nothing marked NEW or CHANGE is approved to build until the owner signs off and the blocking open questions in section 9 are answered. Milestone M0 (port, no behaviour change) may start immediately.

Status tags on features: **BUILT** (in v1, keep), **CHANGE** (in v1, behaviour changes), **NEW** (not in v1). Evidence references (E#) and decisions (D-#) point to `RESEARCH_REVIEW.md`.

---

## 1. Outcome

Number Sky is a maths practice app for one 12-year-old with severe dyscalculia. It finds her level on each concept, teaches and practises at that level, moves her up or down as she answers, and keeps her wanting to come back. "Done" for v2 means: she can complete a 15-minute session on her own; every skill is taught before it is practised; the grown-up view shows, with fortnightly check-ups, whether she is improving; and all acceptance tests in this spec pass with one command.

It supplements teaching by a parent, teacher or specialist. It does not replace it and does not diagnose.

## 2. Users and roles

| Role | Who | May do |
|---|---|---|
| Learner | The child (age 12). Possibly a sibling later. | Run sessions, choose among open skills, ask for hints or read-aloud, replay lessons, skip timed rounds, spend gems on cosmetics. |
| Grown-up | Parent. Reached by press-and-hold on the home screen (a speed bump, not security). | See progress, patterns and check-up results; change settings; share or print a report; back up, restore, reset; add or switch learners. |
| Reader of the report | Teacher, tutor, specialist. No account. | Read the shared or printed report. |

## 3. Features

Acceptance criteria are checkable statements. Each becomes an automated test named after its ID (for example `test_F7_AC2`), or a manual checklist item with the same ID where automation is impractical.

### F-1 Learner profile and first run — BUILT, small CHANGE
A learner has a nickname, an avatar, and settings. First run creates one.
- F-1.AC-1: Given no saved data, the app opens on the welcome screen and a learner can be created with a nickname of 1 to 20 characters and one free avatar.
- F-1.AC-2: The welcome form asks for a nickname, not a full name, and stores no birth date, school or diagnosis. (CHANGE: label and help text.)
- F-1.AC-3: Given two or more learners, the grown-up view can switch between them and each learner's progress is separate.

### F-2 Skill map — BUILT, CHANGE
Skills form a directed graph with prerequisites. v1 has 14 skills in 5 groups (table in section 12). A skill is *open* when all prerequisites are mastered, otherwise *locked*.
- F-2.AC-1: The 14 v1 skills, their groups and prerequisites match section 12.
- F-2.AC-2: A skill with any unmastered prerequisite is never selected for new practice.
- F-2.AC-3 (CHANGE): Skills and prerequisites are defined in one data file, and adding a skill requires no change to the adaptive engine.
- F-2.AC-4 (NEW): The map gains the skills listed in F-11, F-12 and F-21 with the prerequisites given there.

### F-3 Three representation levels, linked to notation — BUILT, CHANGE
Each skill has three levels: **hands-on** (she builds it with a virtual manipulative), **pictures** (she reads a diagram), **numbers** (symbols only).
- F-3.AC-1: Every skill offers all three levels, and each level produces only questions of that representation. (v1 defect to fix: "Which operation?" at hands-on level is multiple choice with icons; replace with a sort-the-story or act-it-out interaction.)
- F-3.AC-2 (NEW, D-2): At hands-on and pictures levels, a number-sentence strip is visible on every question. At hands-on level it fills in as she acts (dealing 12 onto 3 plates shows `12 ÷ 3 = ?`, then `= 4`). At pictures level she selects or completes the sentence in at least one question in three.
- F-3.AC-3: A manipulative always means the same thing wherever it appears: a rod is ten, a small cube is one, a flat is one hundred, a full ten-frame is ten.

### F-4 Lesson step: watch, together, your turn — NEW (D-1)
Before practice at a skill level, a short worked example teaches it.
- F-4.AC-1: On first entry to any (skill, level), a lesson plays before the first question. It has three parts: *Watch* (a worked example steps through with on-screen text and optional read-aloud), *Together* (the same kind of problem with one step left for her), *Your turn* (practice begins).
- F-4.AC-2: A lesson is at most 6 steps and can be completed in under 90 seconds by tapping through.
- F-4.AC-3: The lesson replays automatically after a step down to that level, and a "Show me how" button on every practice question replays it. Replaying counts as a hint for that question.
- F-4.AC-4: Lessons are data (steps referencing the same visual components as questions), one per (skill, level). A missing lesson fails the build.
- F-4.AC-5: Lesson text uses the vocabulary list from F-13 and never introduces a keyword trick ("altogether means add").

### F-5 Questions and answer modes — BUILT, CHANGE
Questions are generated, not stored. Modes: *build* (interactive manipulative, optionally with a follow-up question), *choice* (2 to 4 options), *keypad* (typed whole number).
- F-5.AC-1: For every (skill, level, easy/hard), 400 generated questions each have exactly one correct answer, no duplicate options, no negative or non-integer numeric options, and no "undefined" or "NaN" in any text. (This is the v1 test in `source/tests/engine_test.js`; keep it green.)
- F-5.AC-2: Every build task is solvable within the widget's limits, and solving it correctly through the UI is marked correct (v1 `smoke.py` check).
- F-5.AC-3 (CHANGE, D-8): At numbers level, questions whose answer is a number use the keypad, not choice. Choice remains only where the answer is not a number (which sentence matches, which is bigger).
- F-5.AC-4: A build task allows one retry after a wrong check with a nudge; a second wrong check is recorded as incorrect and the worked answer is shown.
- F-5.AC-5 (NEW): The app records the time from question shown to answer submitted for every question, never displays it to the learner, and excludes any interval in which the page was hidden.

### F-6 Feedback and error patterns — BUILT, CHANGE
- F-6.AC-1: After a wrong answer the learner sees, in this order: a plain statement that it was not right, a pattern-specific sentence if the answer matches a known error pattern, a worked explanation with a visual, and the correct answer. No red, no buzzer, no lost gems.
- F-6.AC-2: The 21 v1 error patterns (section 12) are detected from chosen options and typed answers. The subtract-on-division pattern is detected whenever the answer equals dividend minus divisor.
- F-6.AC-3: Each pattern has a child-facing sentence, a grown-up description and an at-home activity, and the grown-up view lists observed patterns by count.
- F-6.AC-4 (NEW): When the same pattern is seen 3 times within 10 answers, the next 3 questions come from that pattern's remediation set (for operation mix-ups: side-by-side "same numbers, different operation" questions at pictures level).

### F-7 Learner model and adaptation — BUILT, CHANGE (D-8)
- F-7.AC-1: Mastery is estimated per (skill, level) with Bayesian Knowledge Tracing: learn rate 0.12, slip 0.10, guess by mode (choice = 1/options, keypad = 0.03, build = 0.05). Starting estimates 0.30 / 0.20 / 0.10 for the three levels.
- F-7.AC-2: Move up a level when the estimate is at least 0.90 and the last 3 answers at that level were correct without a hint.
- F-7.AC-3: Move down a level when at least 3 answers have been given since arriving, at least 2 of the last 3 were not clean, and the estimate is below 0.40. From hands-on level, reopen the weakest prerequisite at pictures level instead.
- F-7.AC-4: A correct answer given after a hint raises the estimate by half the normal learning step and never counts toward moving up.
- F-7.AC-5 (NEW): A correct clean answer at numbers level nudges each prerequisite's numbers-level estimate up (p ← p + 0.05·(1 − p)); a step down from hands-on nudges them down (p ← 0.9·p). No other cross-skill inference in v2.
- F-7.AC-6 (NEW): Meeting F-7.AC-2 at numbers level puts the skill in a *pending* state. Its star lights only after a retention check on a later calendar day: 3 numbers-level questions, at least 2 correct without hints. Failing returns the skill to numbers level. Prerequisite unlocking uses *pending or lit*.
- F-7.AC-7: Simulated learners (strong; uneven with weak division; persistently struggling) reach the outcomes asserted in the simulation test: the strong learner masters all skills, the struggling learner is never promoted past a level she answers below 60%, and no learner oscillates up and down more than 3 times on one skill within 30 answers.

### F-8 Placement — BUILT, CHANGE (D-8)
- F-8.AC-1: A first-run warm-up with no timer, no score and an "I'm not sure" button on every question sets starting levels. It can be skipped (start from the beginning) and redone from the grown-up view.
- F-8.AC-2 (CHANGE): Placement probes each strand (number sense, add and subtract, multiply, divide, problem solving) separately, at most 4 questions per strand and 16 in total, so a strength in one strand cannot mark another as mastered. (v1 uses one binary search over a single 14-step ladder.)
- F-8.AC-3 (CHANGE): Skills placed as known start in the *pending* state, not lit, so each is confirmed by a retention check.

### F-9 Review scheduler and mixed practice — BUILT, CHANGE (D-6)
- F-9.AC-1 (CHANGE): Each lit skill has a review interval from the ladder 1, 3, 7, 14, 30 days. A clean correct review moves to the next interval; a miss resets to 1 day.
- F-9.AC-2: Two missed reviews with the estimate below 0.40 reopen the skill at the reviewed level and tell the learner it is a quick refresh.
- F-9.AC-3 (CHANGE): 25% to 30% of questions in a session are reviews when any are due. When none are due, the least recently seen lit skill is used for at least 1 question in 6.
- F-9.AC-4 (NEW): Once two or more of the four operations are at pictures level or beyond, the review segment is mixed: no more than two consecutive questions use the same operation, and every session includes at least one "which operation?" question.

### F-10 Facts track — NEW (D-3)
Tracks each multiplication fact (unordered pairs 2..10, 45 facts) and its linked division facts. Addition/subtraction bonds within 20 use the same machinery.
- F-10.AC-1: Each fact is in one state: *new*, *strategy* (answers with the strategy tip visible), *accurate* (untimed keypad recall), *fluent*.
- F-10.AC-2: A fact moves from strategy to accurate after 3 clean correct answers; from accurate to fluent after correct recall on 2 different days with median hidden response time of 3 seconds or less over the last 5 correct answers. A miss in accurate or fluent returns it to strategy.
- F-10.AC-3: New facts arrive at most 4 at a time, in the order ×2, ×5, ×10, then ×3, ×4, then ×6 to ×9, and each practice set mixes roughly 1 new fact with 3 known ones.
- F-10.AC-4: Facts introduced together do not share a product or both factors' final digits with another new fact in the set where the set allows it (low-similarity grouping).
- F-10.AC-5: A *quick round* (60 seconds, keypad) is offered only for sets in which every fact is accurate or fluent. It is always skippable, shows no countdown digits, shows only her own previous best afterwards, and awards the same gems whether or not she beats it.
- F-10.AC-6: Quick rounds obey the grown-up setting (Off / Offer). After 3 consecutive skips, or accuracy below 80% in a round, the app stops offering them for 7 days.
- F-10.AC-7: The times chart remains available outside quick rounds when the grown-up allows it, and using it counts as a hint.

### F-11 Word problems by problem type — CHANGE and NEW (D-4)
Replaces v1's "Which operation?" content. Types: *Total* (parts and whole), *Change* (start, change, end), *Difference* (compare two amounts), *Equal groups* (groups, size, product: includes sharing and grouping), *Times as many* (comparison). Ratio problems come with F-21.
- F-11.AC-1: Types are introduced one at a time in the order above. Each is a skill; Total, Change and Difference require addition and subtraction; Equal groups requires "Sharing equally"; Times as many requires Equal groups.
- F-11.AC-2: Each type progresses: (a) a complete story with no unknown, she fills the type's diagram; (b) the same story with one quantity missing; (c) she builds the number sentence with a blank; (d) she solves it. Steps (a) and (b) are the hands-on and pictures levels.
- F-11.AC-3: Across 100 generated problems of a type, the unknown appears in every position that type allows (for Change: start, change and end).
- F-11.AC-4: After two types are lit, mixed sets require her to name the type before solving, and a wrong type choice is logged as the story-operation pattern.
- F-11.AC-5: Stories use the learner's chosen context theme (F-15) and age-appropriate situations (money, time, sport, cooking, games). No story depends on a keyword that reliably signals the operation.

### F-12 Number line strand — CHANGE and NEW (D-5)
- F-12.AC-1: v1 number-line questions (placing, reading, 1 and 10 more or less, jumps) are kept.
- F-12.AC-2 (NEW): Estimation: place a number on a line labelled only at its ends (0 to 100, then 0 to 1000). Correct means within 10% of the line length at pictures level and 5% at numbers level. After answering, the true position is shown with the nearest benchmark.
- F-12.AC-3 (NEW): Fractions (halves to tenths) and decimals (tenths, hundredths) are placed and compared on 0 to 1 and 0 to 2 lines; the Fractions skill uses both bar models and the number line.
- F-12.AC-4: Number lines always run left to right with smaller on the left, and tick spacing is exactly proportional.

### F-13 Maths language and "say it" — NEW (D-9)
- F-13.AC-1: A single vocabulary list defines the terms and sentence frames used everywhere (for example "12 shared into 3 equal groups is 4 in each group"). No screen uses a different wording for the same idea.
- F-13.AC-2: After about 1 correct answer in 4 at hands-on and pictures levels, a "say it" prompt asks her to pick the sentence that describes what she just did. It is never scored against her and takes one tap to skip.
- F-13.AC-3: Tapping any underlined term shows its definition with a picture and an example and a non-example.
- F-13.AC-4: The grown-up view suggests one "ask her to explain" prompt per session, since explaining aloud to a person is the stronger form.

### F-14 Sessions and weekly rhythm — CHANGE (D-7)
- F-14.AC-1: A session is time-based: 15 minutes by default, 10 or 20 selectable by the grown-up. It ends at the first question boundary after time is up and never interrupts a question.
- F-14.AC-2: A session runs in this order: review warm-up (about 20% of the time), focus skill with its lesson if needed (about 55%), facts (about 15%), wrap-up. Segments with nothing to do give their time to the focus skill.
- F-14.AC-3: She may stop at any time; progress so far is saved and nothing is lost.
- F-14.AC-4: The home screen shows a weekly goal of 4 practice days as 4 markers. Missing days never removes anything and no message mentions a broken streak.
- F-14.AC-5: The wrap-up shows what changed (levels gained, facts learned) and a one-tap "How did that feel?" with three choices.

### F-15 Motivation — BUILT, CHANGE (D-10)
- F-15.AC-1: A star chart shows every skill as locked, open, in progress, pending or lit. (Pending is NEW.)
- F-15.AC-2: Gems are earned for answering (1), answering correctly without a hint (+1), levelling up (+5), lighting a star (+15) and finishing a session (+5). Gems are never deducted and buy only cosmetics.
- F-15.AC-3 (CHANGE): She chooses which open skill to practise next, a context theme for stories, and her avatar and accent colour. Avatars, story items and reward language are redesigned for age 12 per the design system.
- F-15.AC-4: Praise text refers to strategy or effort ("You built it from 5 × 6") and never to being smart or fast.
- F-15.AC-5: There are no leaderboards, no comparison with other people and no social features.

### F-16 Anxiety-aware safeguards — NEW
- F-16.AC-1: "I'm not sure" and "Hint" are on every practice question and cost no gems.
- F-16.AC-2: No screen shows a countdown number or a clock. The quick round shows only a slim progress bar.
- F-16.AC-3: After 3 not-clean answers in a row, the next question is one she is likely to get right (a lit skill at pictures level), then the app returns to the focus skill at the easier setting.
- F-16.AC-4: If she picks the lowest "How did that feel?" choice in 2 consecutive sessions, the next session is 5 minutes shorter, offers no quick rounds, and the grown-up view flags it.

### F-17 Grown-up view and report — BUILT, CHANGE (D-12)
- F-17.AC-1: Shows skills mastered, questions and accuracy over 7 days, days practised, current focus and level, per-skill estimate, observed error patterns with at-home activities, recent sessions, and a plain-language account of how the app decides what comes next.
- F-17.AC-2: Settings: session length, sounds, auto read-aloud, times chart, quick rounds, story theme.
- F-17.AC-3 (NEW): A one-page report (current levels, check-up trend, top 3 error patterns, facts known) can be printed or copied as text for a teacher or tutor. It contains the nickname only.
- F-17.AC-4 (NEW): The view states that the app supplements teaching, and when F-18 shows no gain it recommends talking to the teacher or a specialist.

### F-18 Check-ups — NEW (D-11)
- F-18.AC-1: Every 14 days (or 8 sessions, whichever is later) the app offers a 5-minute check-up: a fixed blueprint of 20 numbers-level questions across strands, generated from a stored seed so that forms are comparable, with no hints and no feedback until the end.
- F-18.AC-2: Check-ups earn the session gems, do not change levels, and show the learner only "Done, thanks" plus what she got better at, never a score that went down.
- F-18.AC-3: The grown-up view charts check-up results by strand over time. After 3 check-ups with no increase in total correct, it shows the message in F-17.AC-4.

### F-19 Read-aloud and accessibility — BUILT, CHANGE
- F-19.AC-1: Every question, hint, lesson step and feedback text can be read aloud on request; auto read-aloud is a setting. Symbols are spoken as words ("divided by").
- F-19.AC-2: All controls are reachable by keyboard with a visible focus state; touch targets are at least 48 px; text contrast meets WCAG 2.2 AA in light and dark themes.
- F-19.AC-3: With reduced motion set, no animation plays and nothing depends on animation to be understood.
- F-19.AC-4: No information is carried by colour alone.
- F-19.AC-5 (CHANGE): Countable objects and avatars are drawn assets from the design system, not platform emoji, so they look the same on every device.

### F-20 Storage, backup, privacy — BUILT, CHANGE
- F-20.AC-1: Progress persists across reloads and survives a version update through schema migrations (a v1 save loads in v2).
- F-20.AC-2 (CHANGE): Storage sits behind one interface with two adapters: on-device (default) and Claude-artifact account storage (when published as an artifact). The newest save wins on load; a save is never silently discarded during a session.
- F-20.AC-3: A backup code can be copied and restored from the grown-up view; a malformed code is rejected with a message and changes nothing.
- F-20.AC-4: The app makes no network requests other than loading fonts, and includes no analytics or third-party scripts.

### F-21 Content toward grade level — NEW, last milestone (D-13)
New skills, each with three levels, lessons and error patterns: multi-digit multiplication and division; decimals (place value, compare, add and subtract); percent of a quantity and fraction/decimal/percent conversion with benchmarks; integers on the number line and integer addition and subtraction; ratio and rate (with ratio word problems); money (making change) and time (elapsed time).
- F-21.AC-1: Each new skill satisfies F-3, F-4, F-5 and F-6 before it is switched on.
- F-21.AC-2: Each is mapped to an Ontario 2020 Number-strand expectation in the skill data file.

## 4. Non-goals (v2)

- Diagnosing dyscalculia or replacing specialist teaching.
- Dot-comparison "number sense" games, working-memory or attention training (E1, E15).
- Leaderboards, multiplayer, social features, streak-loss mechanics.
- Visible countdowns or high-stakes timed tests.
- Speech recognition of spoken explanations.
- Geometry, measurement beyond money and time, algebra, data strands.
- Teacher or class dashboards, accounts, sign-in of its own.
- A full dynamic Bayesian network learner model (the F-7.AC-5 nudges are the v2 approximation).
- Native mobile apps.

## 5. Data

- **Inputs:** learner taps and typed answers; settings; an optional pasted backup code.
- **Stored per learner:** nickname, avatar, theme, settings; per-skill state (level, estimates, attempts, corrects, recent results, last seen, review interval, pending/lit); per-fact state; error-pattern counts; a capped answer log (last 400: time, skill, level, correct, hinted, pattern, response time); sessions (last 100); practice days (last 180); check-up results; gems and owned cosmetics; schema version.
- **Outputs:** on-screen views; backup code (JSON text); printable report.
- **Where:** on-device storage by default. When published as a Claude artifact, also that viewer's private account storage at `data/users/<id>/numbersky`.
- **Retention:** until the grown-up resets or deletes the learner. No server-side copy outside the artifact adapter.
- **Sensitivity:** a child's learning data that implies a disability. Treat as sensitive: nickname only, no free-text fields, no telemetry.

## 6. Integrations

- Google Fonts stylesheet (fonts only).
- Optional, only when published as a Claude artifact: the artifact runtime's `db`, `user` and `tts` capabilities. Each must degrade to nothing when absent (on-device storage; browser speech synthesis or no read-aloud).
- None else. No analytics, no APIs.

## 7. Constraints

- **Stack:** TypeScript, Vite, Preact, Vitest (engine and acceptance tests), Playwright (UI checks). The engine (skills, generators, learner model, scheduler) is pure TypeScript with no DOM access and is tested without a browser.
- **Build output:** one self-contained `index.html` (inline script and styles) no larger than 1.5 MB, so it can be hosted as a static file or published as a Claude artifact. Works offline after first load apart from fonts.
- **Artifact compatibility:** no remote images, no network calls, no `alert`/`confirm`, no downloads started by script; storage calls wrapped so absence never breaks rendering.
- **Devices:** phones from 360 px wide, tablets, laptops; touch first; current Safari, Chrome, Edge, Firefox.
- **Design system:** consumes `design/tokens.json` and the graphics kit from Claude Design (`DESIGN_BRIEF.md`). Until delivered, use `design/tokens.v1.json`, which reproduces v1. No colour, size or font literal outside the token file.
- **Language:** Canadian English spelling. Reading level about grade 4 for learner-facing text.
- **Performance:** any tap produces its visual response within 100 ms on a mid-range tablet.
- **Determinism:** all random choices go through one seedable generator so tests and check-ups are reproducible.
- **Security review:** if the app is ever hosted for more than this family or gains accounts, write `SECURITY_SPEC.md` first using the spec-first-secure-code process.

## 8. Assumptions

- One primary learner; multiple learners stay supported but are not a design driver.
- She can read short sentences with read-aloud support.
- An adult is nearby for the first few sessions and looks at the grown-up view weekly.
- A tablet or laptop is the main device; a phone must work.
- The build stays a personal project: static hosting or a private Claude artifact, no backend.
- Default session length 15 minutes; quick rounds set to "Offer".
- English only.

## 9. Open questions

Blocking items stop the named features only.

| # | Question | Blocks |
|---|---|---|
| Q1 | Where will it be hosted: private Claude artifact (account-synced), a static site, or both? | F-20 adapter priority |
| Q2 | Are short optional timed rounds acceptable for her, given how she reacts to time pressure? Default is "Offer". | F-10.AC-5/6 default |
| Q3 | Which story themes and avatar styles would she choose? Her input should drive the redesign. | F-15.AC-3, design brief |
| Q4 | Does she also have reading or attention difficulties? This changes the read-aloud default and lesson length, and such learners gained less in trials. | F-19 defaults, F-4.AC-2 |
| Q5 | Is a teacher, tutor or specialist involved who should receive the report, and has her school set IEP goals the skill order should follow? | F-17.AC-3, F-21 order |
| Q6 | Is 4 days a week at 15 minutes realistic for the family? | F-14 defaults |

## 10. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-11-20 | v1 prototype built as a single-file Claude artifact before a spec existed. | Speed; now documented here as v1.0. |
| 2026-11-20 | Keep three-level structure, prerequisite map, error-pattern library, strategy-based facts. | Supported by E1, E3, E10, E12, E14. |
| 2026-11-20 | Add lessons before practice (D-1) and notation linking (D-2). | Explicit, systematic instruction has the strongest evidence (E3, E12). |
| 2026-11-20 | Replace "no timers, ever" with optional timed rounds after accuracy (D-3). | E4, E7 support it; E8, E18 require it to be low-stakes and optional. |
| 2026-11-20 | Rebuild word problems by type (D-4); extend number line to fractions and decimals (D-5). | E5, E6. |
| 2026-11-20 | Expanding-interval review and mixed operations (D-6). | E16; targets the operation mix-up directly. |
| 2026-11-20 | Time-based 15-minute sessions, 4 days a week goal (D-7). | E9, E13. |
| 2026-11-20 | Typed answers at numbers level, next-day retention check, strand placement, light prerequisite inference (D-8). | Guessing inflated estimates; mastery should survive a delay; uneven profiles (E2). |
| 2026-11-20 | Fortnightly check-ups (D-11). | Evidence for age 12 is thin; measure instead of assuming. |
| 2026-11-20 | Move from one HTML file to a TypeScript repo that still builds to one file. | Lessons, facts and scheduler need tested modules; single-file output keeps artifact publishing possible. |
| 2026-11-20 | No dot-comparison or memory-training games. | E1, E15. |

## 11. Change log

- **v1.0** (2026-11-20): as-built prototype: 14 skills, three levels, BKT per skill and level, single-ladder placement, 21 error patterns, star chart, gems and shop, grown-up view, read-aloud, artifact account storage.
- **v2.0-draft** (2026-11-20): research review applied. Adds F-4, F-10, F-13, F-16, F-18, F-21; changes F-2, F-3, F-5 to F-9, F-11, F-12, F-14, F-15, F-17, F-19, F-20. Awaiting approval.

---

## 12. Reference: v1 as built

The authoritative source is `source/index.html`. The block `<script id="engine">` holds content, generators and the learner model with no DOM access; the second script holds storage, screens and interaction. `source/tests/engine_test.js` validates generators and simulates learners; `source/tests/smoke.py` drives the UI.

**Skills (id: name, group, prerequisites)**

| id | Name | Group | Prerequisites |
|---|---|---|---|
| quantity | Seeing amounts | Number sense | none |
| numberline | Number line | Number sense | quantity |
| placevalue | Tens and ones | Number sense | quantity |
| makes10 | Making 10 | Number sense | quantity |
| addition | Adding | Add & subtract | numberline, placevalue, makes10 |
| subtraction | Taking away | Add & subtract | addition |
| multmeaning | Equal groups | Multiply | addition |
| multeasy | × 2, 5, 10 | Multiply | multmeaning |
| multmid | × 3 and 4 | Multiply | multeasy |
| multhard | × 6 to 9 | Multiply | multmid |
| divmeaning | Sharing equally | Divide | multmeaning, subtraction |
| divfacts | Division facts | Divide | divmeaning, multeasy |
| whichop | Which operation? | Problem solving | divmeaning, subtraction |
| fractions | Fractions | Problem solving | divmeaning |

v1 teaching order (also the placement ladder): quantity, numberline, placevalue, makes10, addition, subtraction, multmeaning, multeasy, divmeaning, multmid, whichop, divfacts, fractions, multhard.

**Hands-on widgets (build types):** tenframe, blocks, nlplace, jumps, crossout, groups, rows, share, makegroups, shade. Screens of each are in `assets/screens/practice-01..11`.

**Error patterns (21):** op-sub-for-div, op-add-for-div, op-mult-for-div, op-add-for-mult, op-add-for-sub, op-sub-for-add, sub-smaller-from-larger, regroup, place-swap, place-face, tens-ones-mix, off-by-one, fact-neighbor, skip-count, make10-same, numberline-scale, frac-denominator, frac-flip, frac-part-part, frac-unshaded, story-op.

**Known v1 defects and limits** (each is addressed by the feature named):
- "Which operation?" hands-on level is not hands-on, and its option buttons crowd on narrow screens (F-3.AC-1, F-11).
- Numbers level uses multiple choice for five skills (quantity, numberline, placevalue, divmeaning, whichop) and for some questions in two more (multmeaning, fractions) (F-5.AC-3).
- Placement marks every skill below the entry point as mastered without testing it (F-8).
- Times tables are tracked per table group, not per fact (F-10).
- Review has no spacing schedule (F-9).
- No lesson before practice (F-4); no notation at hands-on level for most widgets (F-3.AC-2).
- Response time is not recorded (F-5.AC-5).
- Platform emoji render differently per device (F-19.AC-5).
- Session length is a question count (F-14).

## 13. Milestones

| Milestone | Contents | Exit check |
|---|---|---|
| M0 Port | v1 moved into the repo structure in section 7 with no behaviour change; storage interface; seeded randomness; v1 tests ported. Needs no design input. | F-1, F-2.AC-1/2, F-5.AC-1/2, F-6.AC-1..3, F-7.AC-1..4, F-20.AC-1/3 pass; build is one file. |
| M1 Teach and retain | F-4 lessons for the 14 skills, F-3 notation strip, F-5.AC-3/5, F-7.AC-5/6, F-9, F-14. | Those criteria pass; simulation test F-7.AC-7 passes. |
| M2 Facts, stories, number line, language | F-10, F-11, F-12, F-13. | Those criteria pass. |
| M3 Safeguards and measurement | F-8, F-16, F-17, F-18, F-19.AC-5 with the design system's assets. | Those criteria pass; drift check clean. |
| M4 Toward grade level | F-21, one skill at a time. | Each skill passes F-21.AC-1. |

Acceptance tests run with one command: `npm run accept`. A drift check (inventory of what the code does, mapped to F-# items) is written to `DRIFT_REPORT.md` at the end of each milestone.
