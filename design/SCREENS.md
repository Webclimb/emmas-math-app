# Number Sky screens: Star Lines

Layouts for every key screen in brief §5, at desktop (design target 1280 × 800, primary) and phone (390 wide, must work).

All screens are fluid. They use one set of components, which rearrange at the breakpoints in `tokens.json` → `size.breakpoints`:

- **Compact**, under 720 px: one column. The help row sits at the bottom of the question card.
- **Regular**, 720–1023 px: one column, with wider cards.
- **Wide**, 1024 px and up: two columns where shown below. Help moves to an aside.

Every screen fits in 1280 × 800 without scrolling. On a phone, long screens scroll vertically and never sideways (brief §6).

**Reference pages** live in `reference/screens/`. Open them in a browser and resize the window to see both layouts.

| Screen | Reference |
|---|---|
| 1 Home | `home.html` |
| 3 Practice, hands-on sharing (interactive) | `practice-share.html` |
| 4 Feedback, not yet and correct | `feedback.html` |
| 2 Lesson player | `lesson.html` |

The other screens are specified below and built from `COMPONENTS.md`. The Claude Design canvas also has the Star Lines phone and desktop boards from the direction review.

---

## 1. Home (star map)

**Wide.** Header row, then two columns.

- **Header:**
  - Left: avatar, nickname, "7 of 14 stars lit".
  - Right: gems, Customize, Grown-ups (hold).
- **Left column**, 300–360 px:
  1. Next stop card: eyebrow "Next stop", the focus skill (h1), level indicator, one-line meaning, primary "Start today's practice".
  2. This week card.
  3. Key card.
- **Right column:** "Your star lines" card. One line per skill group, with the line badge and a "Starts after …" note on the left and the stations on the track to the right.

**Compact.**
- Header: avatar, name, gems.
- Next stop card, then the week card.
- The map without its card frame. The line badge and note sit on one row, with the track under it at 91 px spacing.
- Customize and Grown-ups (hold) at the bottom.
- The key is hidden, but each station's state is in its accessible name and its tooltip.

**Behaviour**
- Clicking a station opens the star info dialog.
- She may choose any open skill (F-15.AC-3). Choosing one makes it the Next stop.
- Grown-ups needs press-and-hold for 2 s. A ring fills around the button while she holds; with reduced motion, the label changes to "Keep holding". It is a speed bump, not security (F-2 roles).
- Home always fits 1280 × 800. More than 4 skills in a line wraps that line's track onto a second row.

## 2. Lesson player (F-4)

**Wide.**
- Header: Leave the lesson, skill chip, level, eyebrow "Lesson".
- One card containing:
  - phase bar (Watch / Together / Your turn), step dots, read-aloud;
  - the prompt;
  - the number-sentence strip;
  - the same work area the practice screen uses (tray and plates in this example);
  - navigation: Back, Watch again, Next.
- No help aside: the lesson is the help.

**Compact.** Same order, one column. The tray goes full width above the plates.

**Phases**
- **Watch:** each step animates its action (an item deals onto a plate, a jump draws). The caption is shown and read. Next becomes available when the step finishes, or straight away with reduced motion.
- **Together:** the same kind of problem with one step left for her. Next is disabled until she does it.
- **Your turn:** the last step is a single line, "Your turn. Start practising", which leads into practice.

Lessons are at most 6 steps and under 90 seconds when tapping through (F-4.AC-2).

## 3. Practice screens

**Shared frame (wide)**
- Top bar: Stop for now, skill chip, level, session parts, gems.
- Question card with two zones:
  - **Main**, flexible: prompt and read-aloud; number-sentence strip (hands-on and pictures levels); work area; status and Undo.
  - **Aside**, 220 px or more, behind a 1.5 px `line` divider: "Need a hand?" with Hint, Show me how and I'm not sure; a one-line keyboard tip for the widget.

**Shared frame (compact)**
- The top bar wraps to two rows: row 1 is Stop (icon), session parts (current label only) and gems; row 2 is the skill chip and level.
- The aside becomes a 3-up row of stacked help buttons at the bottom of the card. The keyboard tip is hidden.

**Work area for each hands-on widget**

All of these keep the strip filled in as she acts (F-3.AC-2).

| Widget | Wide layout | Compact | Keyboard |
|---|---|---|---|
| tenframe | Ten-frame(s) at 1.4× scale, centred; Check below | Ten-frame at 1×; two frames stack | Cells are toggle buttons in a 5 × 2 grid; arrows move, Space toggles |
| blocks | Block area (flats, rods, cubes laid out by place) on the left; three steppers stacked on the right | Blocks above, steppers below | Steppers |
| nlplace | Number line 640 px wide; marker draggable or set with ← → buttons; Check | Line at full width, labels every 5 | ← → move by 1, Shift+arrow by 10, Enter checks |
| jumps | Number line plus jump buttons (+10, +1, −1, −10) under it; "You're on 63" status | Same, buttons 2 × 2 | Buttons |
| crossout | Items in rows of 10 (so tens are visible) as toggle buttons; "Taken away: 4" | Rows of 5 | Arrows move, Space toggles |
| groups | Boxes row on the left, steppers on the right | Boxes wrap, steppers below | Steppers |
| rows | Skip-count rows, running totals right-aligned; Add row / Remove row | Same | Buttons |
| share | Tray → arrow → plates (`practice-share.html`) | Tray full width, plates in a row of 3 (up to 4, then 2 rows) | Tab to a plate, Space deals one |
| makegroups | Tray above; "Make a group of 5" primary; boxes fill in below | Same | Button |
| shade | Fraction bar 480 px; parts are toggle buttons | Bar at full width | Arrows move, Space toggles |
| sort the story (replaces "Which operation?" hands-on, F-3.AC-1) | Story text above; four operation-meaning cards (`kit-op-*`) as large radio cards in a 2 × 2 grid; she drags or clicks the story onto one | 1 column of cards | Radio group |

**Pictures level.** The work area shows a read-only diagram from the kit, with the strip (sometimes with an operator to choose) and answer options in a 2 × 2 grid.

**Numbers level.** No diagram. The strip is replaced by the equation in the same style, then the answer display and keypad, which sits centred at 300 px wide on wide screens.

## 4. Feedback

**Wide.**
- Question card (prompt, strip, the options as answered) on the left.
- Feedback card on the right, at the same top.
- Nothing scrolls at 1280 × 800.

**Compact.** The question card collapses: the prompt plus the answered options, then the feedback card below. The screen scrolls to the feedback card, which takes focus.

**Variants** (`COMPONENTS.md` §12): not yet, correct, I'm not sure.

**Build questions.** For a wrong first check, show only the nudge in place, not a card. A second wrong check shows the not-yet card with the worked answer (F-5.AC-4).

## 5. Facts set and quick round (F-10)

**Facts set (wide)**
- Card with the set's facts as fact cards (4 per row) and the strategy tip for the new fact.
- Then the practice frame for the facts themselves: keypad answers, with the strategy array (`kit-array-*`) visible while the fact is at "Building".

**Quick round**
- Offered only when every fact in the set is "Got it" or "Solid", and only if the grown-up setting is Offer.
- Screen layout:
  - top: the slim progress bar and Skip;
  - centre: the fact (44 px) and the answer display;
  - keypad on the right (wide) or below (compact).
- No session parts, no gems counter, no digits about time.
- **End:** "You got 14 right. Your best was 12." plus the same gems either way.

Owner decision: timed rounds are left out for now, so the quick-round setting ships defaulting to **Off**. `SPEC.md` §8 assumes "Offer" and needs updating to match.

## 6. Word-problem diagram (F-11)

**Wide**, inside the practice frame:
- Story text (prompt size) with vocabulary terms underlined.
- The type's diagram (`kit-wp-*`) at 1.25× with numbers in the slots.
- Then, depending on the step (F-11.AC-2): (a) fill the diagram's slots from the story (click a slot, type the number); (b) one slot is unknown; (c) build the sentence in the strip; (d) solve with the keypad.

**Naming the type** (mixed sets, F-11.AC-4): five radio cards (Total, Change, Difference, Equal groups, Times as many), each with its small diagram.

**Compact:** the diagram at full width, slots at least 48 px.

## 7. Check-up (F-18)

**Offer screen:** a single card. "Time for a check-up. It's 20 questions with no help, so we can see what's grown." Buttons: Start, Not today.

**During**
- Header: "Check-up · question 7 of 20" and ticks, read-aloud only.
- Numbers-level question card, no aside.
- Next appears after answering; there is no feedback.

**End:** "Done, thanks." plus "You got better at …" as up to 3 skill names (F-18.AC-2), then "Back to my star lines".

## 8. Session wrap-up (F-14.AC-5)

**Wide**, one centred card (max 720):
- eyebrow "Practice done";
- h1 "Nice work, Sam.";
- "What changed": up to 3 rows, each with a station icon and text, e.g. "Lit a star: Equal groups" (lit station), "Up to pictures: Sharing equally" (level squares), "New fact: 6 × 7 is building";
- the week goal;
- "How did that feel?" (three buttons);
- "Back to my star lines" (primary).

Gems earned show as one line: "+12 gems".

**Star-lighting moment:** if a star was lit this session, the wrap-up opens with the star-lit dialog, then the home map plays the track-fill animation once (`MOTION.md`).

**Compact:** same order, one column.

## 9. Grown-up view (F-17)

Reached by holding Grown-ups for 2 s.

**Wide**, max 1040:
- Header: "Grown-up view · Sam", learner switcher, Close.
- Tabs (a segmented control at the top):
  1. **Progress:**
     - summary readouts: skills mastered, questions and accuracy over 7 days, days practised;
     - current focus and level;
     - the skill rows (estimate bars) grouped by line;
     - the check-up trend.
  2. **Patterns:** error-pattern cards sorted by count, plus "Ask her to explain" (F-13.AC-4).
  3. **Sessions:** recent sessions table (date, length, questions, how it felt).
  4. **Settings:** session length, theme, sounds, auto read-aloud, times chart, quick rounds (Off / Offer), story theme, avatar style.
  5. **Data:** backup code (copy and restore), redo the warm-up, reset, learners.
- The supplement statement (F-17.AC-4) sits in the footer of every tab. When check-ups show no gain, a calm `accent-soft` panel recommends talking to the teacher (F-18.AC-3).

**Compact:** tabs become a select menu, and the cards stack.

## 10. Printed report (F-17.AC-3)

One US Letter or A4 page, portrait, black on white, opened from Grown-up view → Progress → "Print report". The same content can also be copied as text.

**Print rules**
- Body 11 pt Atkinson Hyperlegible, headings 14 pt Space Grotesk.
- Margins 18 mm. No dot grid, no background fills: borders only.
- Nickname only.

**Sections, in order**
1. Name, date range, and "Number Sky supplements teaching. It does not diagnose."
2. **Current levels:** table of skill, level (word) and status (word).
3. **Check-up trend:** a simple line chart of the total, plus a strand table.
4. **Top 3 error patterns:** description and the at-home activity.
5. **Facts known:** a 9 × 9 grid marking Solid and Got it with symbols (● Solid, ○ Got it); the grid has a legend.

Use `@media print` so the Print button produces this page from the same route.

## 11. Other screens

- **Welcome / first run (F-1):**
  - one card with "Number Sky" (h1) and the line "Light up a star for every maths skill you master.";
  - nickname field (label "What should we call you?", help text "A nickname is fine. We don't need your real name.");
  - the avatar picker (tiles), then Start.
- **Warm-up placement (F-8):**
  - an intro card, then the practice frame with "I'm not sure" as a full button in the aside, and no session parts;
  - result card: "You're starting with …" plus the map preview.
- **Customize (shop):**
  - three tabs: Badge, Colour (accent themes), Story theme;
  - tiles as in `COMPONENTS.md` §24, with the gem balance in the header;
  - story theme tiles show 3 of the theme's items.
- **Star info dialog:** see `COMPONENTS.md` §13.
