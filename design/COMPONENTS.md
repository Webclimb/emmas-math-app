# Number Sky components: Star Lines

Every component in `DESIGN_BRIEF.md` section 4, with its states. To see them all rendered in light and dark, open `reference/components.html`. Token names (`ink`, `accent-soft`...) refer to `tokens.json`. Sizes are given as compact (under 720 px wide) / regular-and-wide (720 px and up).

## Rules that apply to every component

- **States:** default, hover (pointer devices only), pressed (`translateY(1px)`, 80 ms), focus (3 px `focus` ring, 3 px offset, keyboard only via `:focus-visible`) and disabled. Some components add correct, not yet or selected states.
- **Disabled:** `surface-2` fill, `line` border and `ink-soft` text. Never use opacity alone.
- **Meaning is never carried by colour alone:**
  - correct = solid border plus a check icon;
  - not yet = dashed border plus a turn-around arrow;
  - selected = a thicker border plus a tint;
  - lit or locked = a fill difference plus a solid or dashed ring.
- **Text is always live HTML.** SVGs come from the kit and are `aria-hidden`. The component supplies the accessible name.
- **Touch targets are at least 48 × 48 px** on every device, including desktop.
- **Numerals and maths** are always set in the body face with tabular figures. The display face is for words only.
- **No shadows.** Borders separate things: 2 px `ink` for hero cards, 1.5 px for secondary cards and controls.
- **Motion:** see `MOTION.md`. Everything is understandable with motion turned off.

---

## 1. Buttons

| Variant | Use | Size | Fill / border / text |
|---|---|---|---|
| Primary | One per screen: Start, Got it next, Keep going, Check | h 52 / 56–58, radius 10–12, 17–19 px bold | `accent` / `accent` / `accent-ink` |
| Secondary | Undo, Show me how, Back, settings actions | h 48, radius 10 | `surface` / 1.5 `ink` / `ink` |
| Ghost | Low-emphasis actions: Grown-ups (hold), Skip | h 48 | transparent / 1.5 `line-strong` / `ink` |
| Icon only | Read aloud, close | 48 / 52 square | as secondary; needs `aria-label` |
| Help, stacked | Compact help row (Hint, Show me how, I'm not sure) | h 60, icon over label, 14 px | as secondary |
| Help, aside | Wide help column | full width, h 56, icon left, 17 px | as secondary |
| Warm outline | Show me how inside a not-yet card | h 56 | `surface` / 1.5 `warm` / `ink` |

States:
- **Hover:** primary gets a 14% black overlay; the others get `hover` fill.
- **Pressed:** 1 px down.
- **Focus:** ring.
- **Disabled:** see the rules above.

The label always includes a word. An icon is optional except on icon-only buttons.

**Keyboard:** Enter and Space activate. On desktop, Escape triggers "Stop for now" only after a confirmation.

## 2. Chips, level indicator, gems, avatar

- **Skill chip:** display face, 16 px bold, 2 px `ink` border, radius 8, `surface`. Not interactive during practice.
- **Level indicator:** three 9 px squares plus the level word (Hands-on, Pictures, Numbers) on `surface-2`, radius 8. Squares are filled `ink` up to and including the current level. The word is required.
- **Gems:** gem icon plus the number, h 44, 1.5 px `ink` border, radius 10. Accessible name: "46 gems". A gain is shown as "+1" next to a small gem. Gems are never shown going down.
- **Avatar:** 48 / 56 square, radius 14.
  - Monogram (default): her initial in the display face, 50% of the frame, `accent-ink` on `accent`.
  - Emblem: a `kit-avatar-emblem-*` file.
  - The avatar opens Customize. Accessible name: "Your badge and style".
- **Tag:** "Now" and similar. 13 px bold, `ink` fill, `bg` text, radius 6.

## 3. Session parts indicator (NEW, replaces question-count dots)

Four stops on a short line: Warm-up, Focus, Facts, Wrap-up (F-14.AC-2). It is shown in the practice top bar.

| Part state | Dot | Line to the next stop | Label |
|---|---|---|---|
| Done | 12 px filled `ink` | 4 px `ink` | check icon + word, `ink-soft` |
| Now | 18 px `accent`, 3 px `surface` gap, 2 px `accent` ring | 4 px `line-strong` | bold word, `ink` |
| Next | 12 px `surface`, 2 px `line-strong` | 4 px `line-strong` | word, `ink-soft` |

- `role="img"`, `aria-label="Part 2 of 4: focus"`.
- Never shows time remaining or a count of questions (F-16.AC-2).
- Parts with nothing to do are hidden, so the line can have 2–4 stops.
- Minimum width 300 px. In compact layout it shortens to dots plus the current label only.

## 4. Top bar (practice)

Contents, left to right: Stop for now (secondary button, or icon-only in compact), skill chip, level indicator, session parts (flexible width), gems. The bar wraps onto two lines when narrow. Its height is 48 px plus 24 px space below.

Home uses a different header: avatar, nickname, "7 of 14 stars lit", gems, Customize, Grown-ups (hold).

## 5. Question card

- 2 px `ink` border, radius 18 / 14, padding 28 / 14, `surface`.
- Order inside: prompt and read-aloud button, number-sentence strip, then the work area (manipulative, diagram, options or keypad), then status and Undo.
- **Prompt:** 19–24 px. Every number in the prompt is bold. Underlined vocabulary terms open the vocabulary pop-up.
- **Read aloud:** icon button, top right, always present (F-19.AC-1).

## 6. Number-sentence strip (NEW, F-3.AC-2)

- Height 60 / 84, radius 12, `accent-soft` fill.
- Tokens are 32 / 44 px bold, with 16–24 px gaps between them.

| State | Look |
|---|---|
| Unknown | Slot with 3 px dashed `accent-text` border, `surface` fill, "?" in `accent-text` |
| Building | Shows the numbers she has acted on so far, e.g. `12 ÷ 3 = ?` as soon as dealing starts |
| Solved | Slot with 3 px solid `good` border, `good-soft` fill, number in `ink`, check icon. The answer fades in over 160 ms |
| Choose an operator (pictures level) | The operator slot is a button with a 3 px solid `ink` border showing "?". Activating it opens a 4-option menu (+ − × ÷) |
| Compact | Height 48, 26 px. Used inside feedback and lessons |

- Accessible name: the sentence in words, e.g. "15 divided by 3 equals unknown".
- Operators are spoken as words (F-19.AC-1).

## 7. Answer options

- Two-column grid, gap 8 / 12.
- Height 54 / 72–76, radius 10 / 12.
- Numeric options are 26 / 32 px bold. Text options are 18 px, left-aligned.

| State | Border | Fill | Extra |
|---|---|---|---|
| Default | 1.5 `ink` | `surface` | |
| Hover | 1.5 `ink` | `hover` | |
| Focus | ring | | |
| Selected (multi-step questions only) | 3 `accent-text` | `accent-soft` | |
| Correct | 3 solid `good` | `good-soft` | check icon |
| Not yet (her answer) | 3 dashed `warm` | `warm-soft` | turn-around icon |
| Unchosen after answering | 1.5 `line` | transparent | `ink-soft` text, disabled |

- Choice answers are checked as soon as she picks one (as in v1).
- After answering, her pick and the correct option stay marked. The other options dim.
- **Keyboard:** Tab or arrow keys move between options; Enter or Space picks. Do not add number-key shortcuts to numeric options: a key label beside the answer puts extra digits in front of a learner with dyscalculia.

## 8. Keypad and answer display (numbers level, F-5.AC-3)

**Answer display**
- Height 72, 2 px `ink` border, radius 12, 40 px bold, with a caret in `accent-text`.
- Empty state: dashed `line-strong` border and the placeholder "Type your answer" in `ink-soft`.

**Keypad**
- 3 × 4 grid: 1–9, then delete, 0, Check.
- Keys are at least 64 px tall, 28 px bold, radius 10.
- Check uses the primary style and is disabled while the display is empty.
- Maximum 4 digits.

**Desktop**
- The physical keyboard types into the display: digits, Backspace, and Enter for Check. The on-screen keypad stays visible.
- Focus starts in the display.

## 9. Stepper

- `surface-2` group, radius 12. Label (16 px bold), minus button, value (28 px bold, live text), plus button.
- Buttons are 48 × 48.
- Minus is disabled at the minimum and plus at the maximum.
- Accessible names: "Groups: fewer" and "Groups: more". Value changes are announced politely.

## 10. Manipulative parts

**Tray**
- 2 px dashed `line-strong`, radius 12.
- Holds "Left to share: N" (a polite live region) and the items still to share: 26 px items, wrapping, 10 px gap.
- When empty, it reads "All shared".

**Plate (button)**
- Round, 100 / 132, 2 px `ink` border, `surface-2` fill, holding items at 17 / 22 px.
- Box variant (radius 16) is used for grouping.
- Label under it: "Plate 1", 15–16 px bold, `ink-soft`.
- Hover: border turns dashed `accent-text`. Focus: ring. Disabled once everything is shared.
- Accessible name: "Plate 1, has 2".
- Click, tap, or Enter/Space deals one item.

**Undo:** secondary button. It is disabled when there is nothing to undo.

**Items** come from the story theme she chose (`kit-item-*`). They are always one hue (`item`).

**Hands-on widgets.** The same parts combine into each widget:

| Widget | Parts used |
|---|---|
| tenframe | ten-frame |
| blocks | blocks + steppers |
| nlplace and jumps | number line + marker or jump buttons |
| crossout | tappable items, taken-away state uses the crossed counter |
| groups | boxes + steppers |
| rows | skip-count rows + add/remove row buttons |
| share | tray + plates |
| makegroups | tray + "Make a group of N" + boxes |
| shade | tappable fraction-bar parts |

See `SCREENS.md` §3 for the layout these share.

## 11. Hint panel, nudge, status

- **Hint panel:** `accent-soft` fill, 1.5 `accent-text` border, radius 12, bulb icon, 17 px text. It opens in place under the work area and does not cover the question.
- **Nudge** (first wrong check on a build, F-5.AC-4): 2 px dashed `warm` border, `warm-soft` fill, radius 10, `role="status"`.
- **Built correctly:** 2 px solid `good` border, `good-soft` fill, check icon. It uses the vocabulary sentence frame, e.g. "15 shared into 3 equal groups is 5 in each group."

## 12. Feedback cards

**Shared anatomy**
- Radius 18, padding 24.
- Head: 48 px icon tile, title (display face, 21–26 px), and the gem gain on the right.
- Then body and actions.
- `role="status"`. Focus moves to the title when the card appears.

| Variant | Border / fill | Icon | Title | Actions |
|---|---|---|---|---|
| Correct | 2 `good` / `good-soft` | check | Names the strategy: "Yes. You shared them one at a time." (F-15.AC-4) | Next |
| Not yet | 2 `warm` / `warm-soft` | turn-around | "Not yet. Let's look at it another way." | Show me how (warm outline), Got it, next (primary) |
| I'm not sure | 2 `ink` / `surface` | info | "Good call asking. Here's how to see it." | Got it, next |

The not-yet body follows the order in F-6.AC-1:
1. Pattern sentence, if one matches (bold, 19 px).
2. Worked visual in a `surface` figure with a 1.5 `ink` border.
3. Compact strip with the answer.
4. The vocabulary sentence plus "The answer is **5**."

- No red, no buzzer, gems never go down.
- On wide screens the feedback card sits beside the question card (`SCREENS.md` §4).

## 13. Dialogs (level up, star lit, switch level, prerequisite refresh)

- `surface`, 2 px `ink` border, radius 18, max width 420, centred over `scrim`.
- Contents: a 72 px badge from the kit, the title (display face), one or two sentences, and one primary button.
- Focus is trapped; Escape and the button both close it; focus returns to where it was.
- **Star lit** uses `kit-badge-star-lit` and lists what it opens. It replaces confetti (`MOTION.md`).
- **Switch level** is neutral (ink ring, swap arrows) and never warm.

**Star info** (clicking a star on the map) uses the same dialog:
- name, state in words, the three level squares, what it needs and what it opens;
- the primary button is "Practise this" when the star is open.

## 14. Toast

- 1.5 `ink` border, `surface`, radius 10, icon plus 16 px bold text.
- Bottom centre, 4 s, `role="status"`, not focusable. One at a time.
- Used for "Progress saved", "Quick refresh: Taking away" (F-9.AC-2) and "Backup code copied".

## 15. Star map (home)

**Line**
- One per skill group. Line badge (display face, 2 px `ink` border, radius 8) with a "Starts after …" note under it.
- Stations sit 91 / 140 px apart on the track.

**Track**
- Between two lit or almost-lit stations: 6 px solid `ink`.
- Otherwise: 3 px dashed `line-strong`.
- The track fills in when a star lights (`MOTION.md`).

**Station (button)**, 40 / 48 px, `kit-station-*`:

| State | Ring | Star | Extra |
|---|---|---|---|
| Lit | solid `ink`, filled | filled `star`, `star-ink` outline | |
| Almost lit (pending, F-7.AC-6) | dashed `ink`, `surface` fill | filled `star` | label tooltip: "Earned. We'll check it on another day." |
| Now | filled `accent` | outline in `accent-ink` | "Now" tag |
| Open | solid `ink`, `surface` fill | outline in `ink` | |
| Locked | dashed `line-strong`, `surface-2` fill | outline in `line-strong` | label in `ink-soft` |

- **Label:** 13 / 15 px bold, centred under the station, on a `surface` backing so the track runs behind it.
- **Accessible name:** "× 2, 5, 10, almost lit, check next time".
- **Keyboard:** Tab follows reading order, line by line.
- **Key:** a small legend card names every state; it is always visible on wide screens.
- **Scaling:** new skills (F-11, F-12, F-21) add stations to their line. A line with more than 4 stations wraps onto a second track row, continued with a short bent connector.

## 16. Week goal (F-14.AC-4)

- Four 40 × 32 markers, radius 6. Done: `ink` fill with a check in `bg`. Not done: 2 px `line-strong` outline.
- The text "2 of 4 days" is always present.
- At 4 of 4: "Week done".
- No streaks, no day names, no message about missed days.

## 17. Lesson player (NEW, F-4)

**Header**
- Phase bar: three joined segments, Watch / Together / Your turn. Done = `ink` fill; Now = `accent` fill; next = `surface-2` with `ink-soft` text.
- Step dots (up to 6). Done = filled `ink`; Now = 14 px `accent`.
- Read-aloud button.
- `role="img"` label: "Lesson: together, step 4 of 6".

**Body**
- The same visual components as practice, with a prompt and the strip.
- In Watch, the step's action plays itself and the caption reads it. With reduced motion, the end state shows with the caption.

**Footer**
- Back (secondary), Watch again (ghost, replays the current step), Next (primary).
- Next is disabled on a Together step until she has done the step.

"Show me how" during practice opens the same player and counts as a hint (F-4.AC-3).

## 18. "Say it" sentence picker (NEW, F-13.AC-2)

- Prompt: "Which sentence says what you just did?"
- 2–3 radio cards: h 56, radius 12, 1.5 `ink`.
- Checked: 3 `accent-text` border, `accent-soft` fill, filled radio dot.
- "That's it" (primary) and "Skip" (ghost).
- Never scored and no feedback colour. The confirmation is "Nice way to say it."

## 19. Vocabulary term and pop-up (NEW, F-13.AC-3)

**Term**
- Bold, with a 2 px dotted underline. A button with `aria-haspopup="dialog"`.

**Pop-up**
- Max width 380, 2 px `ink`, radius 16. Contents: the term, a close button, the definition (one sentence), and a two-column example / non-example, each with a small kit picture and a caption.
- On wide screens it is anchored to the term. In compact layout it becomes a bottom sheet.
- Wording comes from the single vocabulary list (F-13.AC-1).

## 20. Facts set view and quick round (NEW, F-10)

**Fact card**
- 1.5 `ink`, radius 12. The fact in 24 px bold, then the state with an icon:

| State (grown-up name) | Child label | Look |
|---|---|---|
| new | New | dashed `line-strong` border, plus icon |
| strategy | Building | bulb icon |
| accurate | Got it | check icon |
| fluent | Solid | `ink` fill, `bg` text, star icon |

**Quick round**
- Slim progress bar: 8 px, `surface-2` track, `accent` fill, no digits, no clock (F-16.AC-2).
- Skip (ghost) is always visible.
- Afterwards it shows only her own count against her own best, e.g. "You got 14 right. Your best was 12."
- The grown-up setting controls whether it is offered (F-10.AC-6).

## 21. "How did that feel?" (NEW, F-14.AC-5)

- Three toggle buttons: Hard, OK, Good. Each has a simple line drawing (wavy, flat, rising) and no faces.
- h 88, radius 12. Pressed: 3 `accent-text` border, `accent-soft` fill.
- One tap saves and moves on.

## 22. Check-up (NEW, F-18)

- **Header:** "Check-up · question 7 of 20" plus 20 ticks (done = `ink`). This counts questions; it is not a countdown.
- **During:** no hints, no read-aloud of answers, no per-question feedback. Read-aloud of the question stays available.
- **End card:** "Done, thanks." plus only what got better (F-18.AC-2). Never a score that went down.

## 23. Maths displays (live text over kit SVGs)

- **Place-value table:** columns headed with the block shape and the word (Hundreds, Tens, Ones). Digits 40 px bold in bordered cells. The digit being asked about has a dashed `accent-text` inner outline. There is no colour per column; see `GRAPHICS.md` for the place-value colour rule.
- **Skip-count rows:** a row of `sky` dots on `surface-2` with the running total beside it (22 px bold). Buttons below: "+ Add a row of 6" and "Remove a row".
- **Number line:** `kit-numberline-*` with labels as HTML, 15 px bold, centred under major ticks (positions in `GRAPHICS.md`).
- **Word-problem diagrams:** `kit-wp-*` with numbers placed in the slots. The unknown slot shows "?" in `accent-text`.

## 24. Customize tiles (shop) and settings

**Tile (button)**, min-height 150, radius 14:
- art (56 px), name, meta line;
- **current:** 3 `accent-text` border, `accent-soft`, "Using" with a check;
- **owned:** "Yours";
- **for sale:** gem plus price;
- **can't afford:** dashed `line-strong`, "60 · 14 more to go".

Never the word "locked".

**Segmented control**
- `surface-2` group, radius 12. Options h 44 (the group gives 48+ px).
- Pressed: `surface` fill and 1.5 `ink` border. Uses `aria-pressed`.
- Used for session length, theme (Light / Dark / Match device), read-aloud, quick rounds (Off / Offer) and times chart.

## 25. Grown-up components

- **Skill row:** name, level indicator, estimate bar, percentage.
  - Bar: 12 px, `surface-2` track, `sky` fill.
  - Dashed markers at 40% (move-down threshold) and 90% (move-up threshold), named in the accessible label.
- **Error-pattern card:** grown-up description, "Seen N times", "What she sees" (the child sentence), "Try at home" (the activity), as a `dl`. Cards are sorted by count (F-6.AC-3).
- **Times chart:** table with sticky headers. The asked row and column are tinted `accent-soft`; the product cell gets a 3 px `accent-text` inner outline. Using it counts as a hint (F-10.AC-7).
- **Check-up trend:** one row per strand. Each row has a sparkline (`sky`, last point dotted), the latest "3 of 4" and the change since the previous check-up. A table version sits behind a "Show as table" toggle for screen readers.
- **Report (print):** see `SCREENS.md` §10.

## Coverage against the brief

Every component in brief §4 is covered above.

These are new and marked NEW: session parts, number-sentence strip, lesson player, say it, vocabulary pop-up, facts set view, quick round, how did that feel, check-up, check-up trend, pending star.

These are not drawn yet and are defined only in this file and `SCREENS.md`: the printable report page and the welcome form.
