# Number Sky: build spec

**Spec version: v2.4-draft (awaiting approval).** v1.0 is the as-built prototype in `source/index.html`, written before this spec existed and described here after the fact. Nothing marked NEW or CHANGE is approved to build until the owner signs off and the blocking open questions in section 9 are answered. Milestone M0 (port, no behaviour change) may start immediately.

**Approved so far (owner, 2026-11-21):** milestone M0; F-1.AC-2; the F-6.AC-2 wording; the design-system amendments in v2.1 (D-14 to D-17 below: desktop first with keyboard paths, quick rounds default Off, the four accent themes with a v1 theme migration, adoption of `design/` as the design system); milestone MD, bringing the design forward (D-18, 2026-11-21); F-22 workbook check and milestone MW (D-19); storage stays on-device plus Claude account, no external backend (D-20); Québec French throughout (D-21); Québec curriculum, 6e année (D-22); milestone MG, grade-level decimals with a warm-up that starts at her level (D-23). Everything else marked NEW or CHANGE still awaits sign-off.

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
- F-1.AC-2: The welcome form asks for a nickname, not a full name, and stores no birth date, school or diagnosis. (CHANGE: label and help text. Approved 2026-11-21; wording from `design/SCREENS.md` §11.)
- F-1.AC-3: Given two or more learners, the grown-up view can switch between them and each learner's progress is separate.

### F-2 Skill map — BUILT, CHANGE
Skills form a directed graph with prerequisites. v1 has 14 skills in 5 groups (table in section 12). A skill is *open* when all prerequisites are mastered, otherwise *locked*.
- F-2.AC-1: The 14 v1 skills, their groups and prerequisites match section 12 (ids and prerequisites unchanged; names and groups are the French ones in the table).
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
- F-5.AC-1: For every (skill, level, easy/hard), 400 generated questions each have exactly one correct answer, no duplicate options, no negative numeric options, no non-integer numeric options except in decimal skills (F-23), where decimals are written with a comma, and no "undefined" or "NaN" in any text. (This is the v1 test in `source/tests/engine_test.js`; keep it green.)
- F-5.AC-2: Every build task is solvable within the widget's limits, and solving it correctly through the UI is marked correct (v1 `smoke.py` check).
- F-5.AC-3 (CHANGE, D-8): At numbers level, questions whose answer is a number use the keypad, not choice. Choice remains only where the answer is not a number (which sentence matches, which is bigger).
- F-5.AC-4: A build task allows one retry after a wrong check with a nudge; a second wrong check is recorded as incorrect and the worked answer is shown.
- F-5.AC-5 (NEW): The app records the time from question shown to answer submitted for every question, never displays it to the learner, and excludes any interval in which the page was hidden.
- F-5.AC-6 (NEW, D-14): At numbers level a physical keyboard enters typed answers (digits, Backspace, Enter); the on-screen keypad stays.

### F-6 Feedback and error patterns — BUILT, CHANGE
- F-6.AC-1: After a wrong answer the learner sees, in this order: a plain statement that it was not right, a pattern-specific sentence if the answer matches a known error pattern, a worked explanation with a visual, and the correct answer. No red, no buzzer, no lost gems.
- F-6.AC-2: The 21 v1 error patterns (section 12) are detected from chosen options and typed answers. The subtract-on-division pattern is detected whenever the answer equals dividend minus divisor, unless that is the correct answer (4 ÷ 2).
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
- F-8.AC-4 (CHANGE, D-23): The first-run warm-up starts at her grade level: it is the F-22 check aimed at the grade-level skills (F-23), stepping back through prerequisites when she misses one. Skills she passes, and the prerequisites under them that were not checked, are taken as known. The results become her workbook goal, so practice climbs back toward grade level. This replaces v1's single-ladder search for new learners.

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
- F-10.AC-6: Quick rounds obey the grown-up setting (Off / Offer), default Off (D-15). After 3 consecutive skips, or accuracy below 80% in a round, the app stops offering them for 7 days.
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
- F-15.AC-6 (CHANGE, D-16): The accent themes are those in `design/tokens.json`: Cobalt (default), Ocean, Berry, Graphite. A saved theme that is not in that set (v1 Marigold, Lime, Coral, Lavender) loads as Cobalt and stays owned; Ocean and Berry keep their names.

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
- F-19.AC-6 (NEW, D-14): Every build widget can be completed with the keyboard alone, using the keyboard path for that widget in `design/SCREENS.md` §3.

### F-20 Storage, backup, privacy — BUILT, CHANGE
- F-20.AC-1: Progress persists across reloads and survives a version update through schema migrations (a v1 save loads in v2, including a v1 accent theme per F-15.AC-6).
- F-20.AC-2 (CHANGE): Storage sits behind one interface with two adapters: on-device (default) and Claude-artifact account storage (when published as an artifact). The newest save wins on load; a save is never silently discarded during a session.
- F-20.AC-3: A backup code can be copied and restored from the grown-up view; a malformed code is rejected with a message and changes nothing.
- F-20.AC-4: The app makes no network requests other than loading fonts, and includes no analytics or third-party scripts.

### F-21 Content toward grade level — NEW, last milestone (D-13)
New skills, each with three levels, lessons and error patterns: multi-digit multiplication and division; decimals (place value, compare, add and subtract); percent of a quantity and fraction/decimal/percent conversion with benchmarks; integers on the number line and integer addition and subtraction; ratio and rate (with ratio word problems); money (making change) and time (elapsed time).
- F-21.AC-1: Each new skill satisfies F-3, F-4, F-5 and F-6 before it is switched on. (D-23: the F-23 skills are switched on before F-4 lessons exist; their lessons come with M1.)
- F-21.AC-2: Each is mapped to a Québec Progression des apprentissages (6e année) item in the skill data file (D-22).

### F-23 Grade-level decimals, 6e année — NEW (D-23)
The first F-21 skills, brought forward because her workbook (ERPI, Thème 2 and Thème 4) works on decimal place value to thousandths and multiplying decimals. Eight skills in two new lines, each with three levels:

| id | Nom | Line | Prerequisites | Covers |
|---|---|---|---|---|
| grandsnombres | Grands nombres | Grands nombres et décimaux | placevalue | Whole numbers to 999 999: value of a digit, units (dizaines de mille…), composing and comparing |
| puissances | × et ÷ par 10, 100, 1000 | Grands nombres et décimaux | grandsnombres, multeasy | Multiplying and dividing by 10, 100, 1000; powers of ten 10⁰ to 10³ |
| decimaux | Dixièmes, centièmes, millièmes | Grands nombres et décimaux | puissances, fractions | Decimal place value to thousandths, 1/10 ↔ 0,1, decomposing two ways, regrouping (825 dixièmes), comparing |
| arrondir | Arrondir et estimer | Grands nombres et décimaux | decimaux | Rounding whole numbers and decimals; estimating a product |
| addcol | Additionner en colonnes | Calcul écrit | addition, grandsnombres | Column addition with carrying, up to 6 digits |
| multcol | Multiplier en colonnes | Calcul écrit | multhard, addcol | Column multiplication: 2–3 digits × 1 digit, then × 2 digits with the 0 placeholder |
| multdec | Multiplier des décimaux | Calcul écrit | multcol, decimaux, arrondir | Decimal × whole and decimal × decimal: multiply as whole numbers, count decimal places, check with an estimate |
| probdec | Problèmes avec décimaux | Calcul écrit | multdec, whichop | Story problems with decimals: "fois plus", "fois moins", money, lengths, hours as decimals, two steps |

- F-23.AC-1: The eight skills, lines and prerequisites match the table above, and each lists its Québec PDA item (F-21.AC-2).
- F-23.AC-2: Each skill has hands-on, pictures and numbers levels (F-3.AC-1). Hands-on uses a place-value chart with counters (tableau de numération) or a step-by-step column layout she fills in; a rod still always means ten (F-3.AC-3), so decimals never reuse base-ten blocks with a new meaning.
- F-23.AC-3: The F-5.AC-1 generator check covers every new skill. Decimal answers are exact: they are generated in whole thousandths and written with a comma, and a typed answer counts as right whatever trailing zeros she adds (3,5 = 3,50).
- F-23.AC-4: The keypad has a comma key on decimal questions, and a physical keyboard's "," or "." types it.
- F-23.AC-5: New error patterns, each with a learner sentence, grown-up description and at-home activity (F-6.AC-3): misplaced decimal comma; dixièmes taken for dizaines (and centièmes for centaines); "more digits means bigger" when comparing decimals; missing 0 placeholder in the second partial product; forgotten carry; empty place left out (4 unités de mille + 7 centaines written as 47); "fois moins" read the wrong way.

### F-22 Workbook check — NEW (D-19)
She is starting mid-year, so a grown-up can aim practice at what her class is doing now. A photo of a workbook page tells the app which skills the page depends on; a short check finds which of those she has; practice then steps back to the weakest one and climbs toward the page.
- F-22.AC-1: From the grown-up view, a grown-up can take or choose a photo of a workbook page. Claude (the artifact runtime's `sample` capability with images) names the skills in the skill map the page depends on, and lists in words any needed skills the app does not have yet. Where reading photos is unavailable, the grown-up picks the skills from the skill map by hand.
- F-22.AC-2: Nothing about the learner changes until the grown-up confirms the list; they can add or remove skills first, or cancel.
- F-22.AC-3: The photo is sent only to the runtime's `sample` call, is never stored, and is dropped after reading. Only the confirmed skill ids and dates are saved; no text from the page is kept. The request to Claude contains the photo and the skill map only, never the learner's nickname or any learner data.
- F-22.AC-4: The check is taken by the learner from the home screen. It asks up to 2 numbers-level questions per skill (two right passes it; a wrong answer or "I'm not sure" ends that skill's probe and does not pass it), starting with the confirmed skills in teaching order, with no timer, no score, no hints and "I'm not sure" on every question. A skill she does not pass adds its prerequisites to the check, so it steps back toward fundamentals one skill at a time. At most 16 questions.
- F-22.AC-5: After the check, skills she passed are lit (pending once F-7.AC-6 is built), as are the prerequisites under a passed skill that were not checked; skills she did not pass reopen at pictures level. Her focus becomes the earliest unlit skill on the path to the confirmed skills, and normal level moves (F-7) take her back up toward the page.
- F-22.AC-6: While a workbook goal is active, new practice is chosen from the confirmed skills and their prerequisites, unless she picks another open skill herself (F-15.AC-3). Once every confirmed skill is lit, reviews favour the confirmed skills. The grown-up can clear the goal at any time.
- F-22.AC-7: Practice questions always come from the app's tested generators (F-5.AC-1). Claude only names skills; it never writes questions, answers or explanations, and the app never solves the workbook page itself.

## 4. Non-goals (v2)

- Diagnosing dyscalculia or replacing specialist teaching.
- Dot-comparison "number sense" games, working-memory or attention training (E1, E15).
- Leaderboards, multiplayer, social features, streak-loss mechanics.
- Visible countdowns or high-stakes timed tests.
- Speech recognition of spoken explanations.
- Geometry, measurement beyond money and time, algebra, data strands.
- Teacher or class dashboards, accounts, sign-in of its own.
- An external backend or database such as Supabase (D-20).
- Solving or marking her actual workbook pages (F-22.AC-7).
- A full dynamic Bayesian network learner model (the F-7.AC-5 nudges are the v2 approximation).
- Native mobile apps.

## 5. Data

- **Inputs:** learner taps and typed answers; settings; an optional pasted backup code; an optional workbook photo, read once and not kept (F-22).
- **Stored per learner:** nickname, avatar, theme, settings; the workbook goal (confirmed skill ids, dates, check results; never the photo or any text from it, F-22.AC-3); per-skill state (level, estimates, attempts, corrects, recent results, last seen, review interval, pending/lit); per-fact state; error-pattern counts; a capped answer log (last 400: time, skill, level, correct, hinted, pattern, response time); sessions (last 100); practice days (last 180); check-up results; gems and owned cosmetics; schema version.
- **Outputs:** on-screen views; backup code (JSON text); printable report.
- **Where:** on-device storage by default. When published as a Claude artifact, also that viewer's private account storage at `data/users/<id>/numbersky`.
- **Retention:** until the grown-up resets or deletes the learner. No server-side copy outside the artifact adapter.
- **Sensitivity:** a child's learning data that implies a disability. Treat as sensitive: nickname only, no free-text fields, no telemetry.

## 6. Integrations

- Google Fonts stylesheet (fonts only).
- Optional, only when published as a Claude artifact: the artifact runtime's `db`, `user`, `tts` and `sample` (with images, F-22) capabilities. Each must degrade to nothing when absent (on-device storage; browser speech synthesis or no read-aloud; picking workbook skills by hand). `sample` is called only when a grown-up chooses a photo, and uses that viewer's own Claude usage.
- None else. No analytics, no APIs.

## 7. Constraints

- **Stack:** TypeScript, Vite, Preact, Vitest (engine and acceptance tests), Playwright (UI checks). The engine (skills, generators, learner model, scheduler) is pure TypeScript with no DOM access and is tested without a browser.
- **Build output:** one self-contained `index.html` (inline script and styles) no larger than 1.5 MB, so it can be hosted as a static file or published as a Claude artifact. Works offline after first load apart from fonts.
- **Artifact compatibility:** no remote images, no network calls, no `alert`/`confirm`, no downloads started by script; storage calls wrapped so absence never breaks rendering.
- **Devices:** desktop browser first, with mouse and keyboard (D-14); tablets and phones from 360 px wide must still work; current Safari, Chrome, Edge, Firefox.
- **Design system:** consumes `design/tokens.json`, the graphics kit and the specs in `design/` (direction B, "Star Lines", delivered 2026-11-21; D-17). Until the app is moved onto it, the build uses `design/tokens.v1.json`, which reproduces v1. No colour, size or font literal outside the token file.
- **Language:** Québec French throughout, the vocabulary of her class (dizaines, dixièmes, unités de mille…), decimal comma, a space between thousands from 10 000 (D-21). Reading level about 4e année for learner-facing text. Read-aloud speaks French.
- **Performance:** any tap produces its visual response within 100 ms on a mid-range tablet.
- **Determinism:** all random choices go through one seedable generator so tests and check-ups are reproducible.
- **Security review:** if the app is ever hosted for more than this family or gains accounts, write `SECURITY_SPEC.md` first using the spec-first-secure-code process.

## 8. Assumptions

- One primary learner; multiple learners stay supported but are not a design driver.
- She can read short sentences with read-aloud support.
- An adult is nearby for the first few sessions and looks at the grown-up view weekly.
- A desktop or laptop browser with mouse and keyboard is the main device; tablets and phones from 360 px must work.
- The build stays a personal project: static hosting or a private Claude artifact, no backend.
- Default session length 15 minutes; quick rounds set to "Off".
- French (Québec) only (D-21). Curriculum: Québec PFEQ, 6e année primaire (D-22).

## 9. Open questions

Blocking items stop the named features only.

| # | Question | Blocks |
|---|---|---|
| Q1 | ~~Where will it be hosted?~~ Resolved 2026-11-21: private Claude artifact, account-synced, with on-device storage as fallback; no external backend (D-20). | — |
| Q2 | ~~Are short optional timed rounds acceptable for her?~~ Resolved 2026-11-21: default Off (D-15); the grown-up can turn them on. | — |
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
| 2026-11-21 | M0 port done; F-1.AC-2 approved with the design's welcome wording; F-6.AC-2 excludes the case where dividend minus divisor is the correct answer. | Owner approval; `DRIFT_REPORT.md` M0. |
| 2026-11-21 | D-14: desktop browser first, mouse and keyboard; keyboard entry at numbers level (F-5.AC-6) and a keyboard path for every build widget (F-19.AC-6). | How she will use it; `design/README.md`. |
| 2026-11-21 | D-15: quick rounds default Off (F-10.AC-6, section 8). | Owner's decision to leave timed rounds out for now (Q2). The quick round keeps F-10.AC-5 and F-16.AC-2: slim bar, no digits, no clock. |
| 2026-11-21 | D-16: accent themes become Cobalt, Ocean, Berry, Graphite; v1 themes outside the set load as Cobalt (F-15.AC-6, F-20.AC-1). | v1's Lime, Coral and Lavender clashed with correct, not-yet and item colours. |
| 2026-11-21 | D-21: the whole app in Québec French, decimal comma. | Her class is in French; for a learner with dyscalculia, vocabulary that differs between class and app is an obstacle (F-13). |
| 2026-11-21 | D-22: curriculum is Québec, 6e année primaire, not Ontario. | Her workbook (ERPI) follows the Québec program. |
| 2026-11-21 | D-23: milestone MG brings eight F-21 skills forward (F-23) before lessons exist, and the first-run warm-up starts at grade level and steps back (F-8.AC-4). | Owner: start at her workbook's level and move forward or back by her answers. |
| 2026-11-21 | D-19: add F-22 workbook check and milestone MW before M1. Claude only maps a photographed page to skills; the app's tested generators provide every question. | She starts mid-year; practice should aim at what her class is doing now, stepping back to fundamentals first. |
| 2026-11-21 | D-20: no Supabase or other external backend. Storage stays on-device plus the Claude artifact account adapter (F-20.AC-2). | Owner decision. Avoids a second processor for a child's disability-related data and keeps artifact hosting. |
| 2026-11-21 | D-18: bring the design forward as milestone MD: restyle and re-lay out every existing screen to `design/` (desktop two-column layouts, kit graphics instead of emoji, F-15.AC-6 themes, F-19.AC-5), before M1. Design parts that belong to unbuilt features (session parts, strip, lessons, week goal, say it, how did that feel) wait for their milestones. | Owner wants to review the desktop design on the real app. |
| 2026-11-21 | D-17: adopt `design/` (direction B, "Star Lines") as the design system; key-screen sizes 390 px and 1280 × 800. | Delivered against `DESIGN_BRIEF.md` §5. |

## 11. Change log

- **v1.0** (2026-11-20): as-built prototype: 14 skills, three levels, BKT per skill and level, single-ladder placement, 21 error patterns, star chart, gems and shop, grown-up view, read-aloud, artifact account storage.
- **v2.0-draft** (2026-11-20): research review applied. Adds F-4, F-10, F-13, F-16, F-18, F-21; changes F-2, F-3, F-5 to F-9, F-11, F-12, F-14, F-15, F-17, F-19, F-20. Awaiting approval.
- **v2.4-draft** (2026-11-21): French (Québec) app (D-21); Québec curriculum (D-22); F-23 eight grade-level decimal skills and milestone MG; F-8.AC-4 warm-up starts at grade level (D-23); F-5.AC-1 allows decimal options in F-23; F-22.AC-5 takes unchecked prerequisites of passed skills as known; F-2.AC-1 names in French.
- **v2.3-draft** (2026-11-21): adds F-22 workbook check and milestone MW (D-19); records no external backend (D-20); resolves Q1; adds `sample` to section 6.
- **v2.2-draft** (2026-11-21): milestone MD added (D-18); F-19.AC-5 and F-15.AC-6 move from M3 to MD.
- **v2.1-draft** (2026-11-21): design system delivered and approved amendments applied (D-14 to D-17). Adds F-5.AC-6, F-15.AC-6, F-19.AC-6; changes F-6.AC-2 wording, F-10.AC-6 default, F-20.AC-1, section 7 Devices and Design system, section 8; resolves Q2; approves F-1.AC-2.

---

## 12. Reference: v1 as built

The authoritative source is `source/index.html`. The block `<script id="engine">` holds content, generators and the learner model with no DOM access; the second script holds storage, screens and interaction. `source/tests/engine_test.js` validates generators and simulates learners; `source/tests/smoke.py` drives the UI.

**Skills (id: name, group, prerequisites)**

| id | Name (v1) | Group (v1) | Prerequisites | Nom | Ligne |
|---|---|---|---|---|---|
| quantity | Seeing amounts | Number sense | none | Voir les quantités | Sens du nombre |
| numberline | Number line | Number sense | quantity | La droite numérique | Sens du nombre |
| placevalue | Tens and ones | Number sense | quantity | Dizaines et unités | Sens du nombre |
| makes10 | Making 10 | Number sense | quantity | Faire 10 | Sens du nombre |
| addition | Adding | Add & subtract | numberline, placevalue, makes10 | Additionner | Additionner et soustraire |
| subtraction | Taking away | Add & subtract | addition | Soustraire | Additionner et soustraire |
| multmeaning | Equal groups | Multiply | addition | Groupes égaux | Multiplier |
| multeasy | × 2, 5, 10 | Multiply | multmeaning | × 2, 5, 10 | Multiplier |
| multmid | × 3 and 4 | Multiply | multeasy | × 3 et 4 | Multiplier |
| multhard | × 6 to 9 | Multiply | multmid | × 6 à 9 | Multiplier |
| divmeaning | Sharing equally | Divide | multmeaning, subtraction | Partager également | Diviser |
| divfacts | Division facts | Divide | divmeaning, multeasy | Faits de division | Diviser |
| whichop | Which operation? | Problem solving | divmeaning, subtraction | Quelle opération? | Résoudre des problèmes |
| fractions | Fractions | Problem solving | divmeaning | Fractions | Résoudre des problèmes |

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
| MD Design (D-18) | Every existing screen restyled and re-laid out to `design/` (tokens, components, desktop and phone layouts, motion rules), F-19.AC-5, F-15.AC-6. No new behaviour beyond what the design itself changes. | M0 criteria still pass; F-19.AC-5 and F-15.AC-6 pass; owner review. |
| MG Grade-level decimals (D-23) | F-21 French content (D-21), F-23, F-8.AC-4. | F-23 criteria pass; earlier criteria still pass. |
| MW Workbook check (D-19) | F-22. | F-22 criteria pass; M0 and MD criteria still pass. |
| M1 Teach and retain | F-4 lessons for the 14 skills, F-3 notation strip, F-5.AC-3/5/6, F-7.AC-5/6, F-9, F-14. | Those criteria pass; simulation test F-7.AC-7 passes. |
| M2 Facts, stories, number line, language | F-10, F-11, F-12, F-13. | Those criteria pass. |
| M3 Safeguards and measurement | F-8, F-16, F-17, F-18, F-19.AC-6 with the design system's components. | Those criteria pass; drift check clean. |
| M4 Toward grade level | F-21, one skill at a time. | Each skill passes F-21.AC-1. |

Acceptance tests run with one command: `npm run accept`. A drift check (inventory of what the code does, mapped to F-# items) is written to `DRIFT_REPORT.md` at the end of each milestone.
