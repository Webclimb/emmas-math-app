# Number Sky motion: Star Lines

Motion is used only where the movement is the concept, or to confirm an action. Durations are in `tokens.json` → `motion`.

**With reduced motion** (the OS setting or the app setting), every duration is 0, end states appear immediately, and nothing is understandable only by watching it move (F-19.AC-3).

| What | When | Motion | Duration and easing | Reduced-motion alternative |
|---|---|---|---|---|
| Button press | Any button | Moves down 1 px | 80 ms ease-out | None needed |
| Deal | An item goes from the tray to a plate | The item flies from its tray slot to its plate slot on a shallow arc (peak 24 px). The tray count and the plate's accessible name update when it lands | 260 ms, cubic-bezier(.2,.7,.2,1). A second deal starts at once and does not queue behind the first | The item disappears from the tray and appears on the plate in the same frame |
| Jump | Number-line jump | The arc draws from start to end, then the marker slides along it; the jump label fades in | 420 ms ease-in-out per jump; multi-jump answers play in sequence | Arc and marker appear at once, with the label |
| Strip fills in | The number sentence completes | The answer replaces "?"; the slot border changes from dashed to solid | 160 ms fade | Instant |
| Feedback card in | After an answer | Fades in and rises 8 px | 160 ms | Instant |
| Hint panel | Hint opens | Height expands, content fades | 160 ms | Instant |
| Star lights (replaces confetti) | A star is confirmed lit | (1) The star-lit dialog appears. (2) Back on the map, the track segment to that station draws left to right. (3) The station fill changes from almost-lit to lit and the star scales 1 → 1.12 → 1 | Dialog 160 ms; track 600 ms ease-out; station 320 ms | Dialog only; the map shows the lit state |
| Level up / switch level | Dialog | Fade only, no scale-in | 160 ms | Instant |
| Lesson Watch steps | Step plays itself | The same deal and jump motions, plus a 600 ms pause before the caption advances | As above | End state plus caption; Next is available immediately |
| Quick round bar | During a quick round | Width grows continuously | Linear over the round | Grows in 10% steps, not continuously (still no digits) |
| Grown-ups hold | Press and hold | A ring fills around the button | 2 s linear | The label changes to "Keep holding" and then opens; no ring animation |
| Toast | Shows or hides | Fade | 160 ms in, 160 ms out, visible 4 s | Instant in and out |

**Never animated**
- The "Now" marker (static; v1's pulsing star is removed).
- Gems counting up (the new total just appears).
- Anything on the check-up screens.
- Page transitions.
- Background.

**Sound** follows the same events: a soft tick on deal, a soft chime on lit star. Sounds are off by default and are a grown-up setting (F-17.AC-2). There is no sound for a wrong answer.
