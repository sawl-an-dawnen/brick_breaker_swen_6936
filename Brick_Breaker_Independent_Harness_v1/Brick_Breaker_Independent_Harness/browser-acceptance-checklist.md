# Brick Breaker Browser Acceptance Checklist (BRICK-B01–B10)

**Basis:** `Brick_Breaker_SRS_v1.0.md`, Section 11. This is a human/browser procedure, **not** an automated Node test. Complete separately for each implementation. Do not check PASS based on source inspection.

| Run field | Value |
|---|---|
| Assignment / AI | |
| Implementation snapshot / checksum | |
| Browser / version | |
| Operating system | |
| Local server command | |
| Execution date / time | |
| Evaluator | |
| DevTools errors | |

Use statuses **PASS**, **FAIL**, **NOT RUN**, and **BLOCKED**. Record actual evidence and any failures. The game project must contain exactly `index.html`, `game.js`, `gameLogic.js`, and `package.json`; host it through HTTP for ES-module support.

| Check | Manual procedure | Expected result (SRS) | Status | Observed result / screenshot or console evidence |
|---|---|---|---|---|
| BRICK-B01 | Serve the game directory over HTTP, open `index.html`, inspect DevTools console. | Page loads; module imports resolve; Canvas renders; no uncaught JS errors. | NOT RUN | |
| BRICK-B02 | Freshly start the app; inspect and, if possible, measure geometry. | Logical Canvas 800×500; paddle `(350,460)` sized 100×12; ball center `(400,440)` radius 8; all 24 bricks correctly placed in three rows. | NOT RUN | |
| BRICK-B03 | Hold Left Arrow; restart; hold A; move until left boundary. | Both keys move paddle left at 400 px/s; x never below 0. | NOT RUN | |
| BRICK-B04 | Hold Right Arrow; restart; hold D; move until right boundary. | Both keys move right at 400 px/s; x never exceeds 700. | NOT RUN | |
| BRICK-B05 | Hold A and D simultaneously, then release D while A remains down. Repeat with arrow keys; verify mixed aliases if possible. | Opposing directions cancel; remaining held alias restores the appropriate direction; releasing one alias does not drop another held alias. | NOT RUN | |
| BRICK-B06 | Press Space, hold through key-repeat interval; release and press again. Test during paddle input. | One pause toggle per physical key press; no repeated toggling; paused movement and scoring freeze; next press resumes without advancing on toggle. | NOT RUN | |
| BRICK-B07 | Watch walls, paddle returns, brick hits; inspect score and rendered bricks. | Proper reflection at left/right/top, paddle, and active bricks; hit bricks vanish and add exactly 10 points once; no bottom bounce. | NOT RUN | |
| BRICK-B08 | Allow ball to exit below playfield repeatedly. | Exactly one life lost per bottom exit; ball restores when lives remain; at zero lives show lost and freeze. | NOT RUN | |
| BRICK-B09 | Clear 24 bricks through controlled play or documented browser-level fixture. | Score becomes 240; status won; gameplay freezes immediately. | NOT RUN | |
| BRICK-B10 | Press R during playing, paused, won, lost. Verify Arrow, Space, and control-letter scrolling behavior. | Every restart restores complete initial state; gameplay keys do not cause unwanted page scrolling. | NOT RUN | |

## Evidence rules

1. Record **who** actually operated the browser (AI or human), and when.
2. Record version, local URL, exact actions, screenshots, and relevant console output.
3. For BRICK-B09, record how the win condition was reached; do not claim natural play if a fixture was used.
4. Do not infer unobserved functionality from a successful launch.
5. Failed checks remain failed in the first-run record even after repairs; record retests separately.
6. Save this completed checklist outside the four-file implementation directory.

**Totals:** PASS ___ / FAIL ___ / NOT RUN ___ / BLOCKED ___ (sum must equal 10).

**Browser pass rate:** PASS / 10 × 100 = ___ %.

**Evaluator signature/initials:** __________   **Completed:** __________
