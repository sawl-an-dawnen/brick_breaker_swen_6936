SRS: 
We are preparing a controlled software-development experiment for a university course. We will build the same small browser game using ChatGPT in Assignment 4 and Grok within Cursor in Assignment 5.

Create a complete Software Requirements Specification titled Brick_Breaker_SRS_v1.0.md.

Project: single-player Brick Breaker using HTML5 Canvas and JavaScript ES modules. No external runtime libraries. Deliver exactly index.html, game.js, gameLogic.js, and package.json with "type":"module". gameLogic.js must export createInitialState(), updateGame(state,input,dt), and resetGame(). Pure game logic must not depend on browser APIs.

Define these exact constants:
- Playfield 800x500, origin top-left.
- Paddle: x=350, y=460, width=100, height=12, speed=400 px/s, horizontal limits 0 to 700.
- Ball: center (400,440), radius 8, velocity (160,-200) px/s.
- Bricks: 3 rows, 8 columns, width 80, height 20, origin (45,60), horizontal pitch 90, vertical pitch 30, IDs r0c0 through r2c7, row-major order, initially active.
- Score starts at 0, 10 points per brick, lives start at 3.
- Status starts playing; allowed values playing, paused, won, lost.

API requirements:
- createInitialState and resetGame return fresh initialized states.
- State fields: status, paddle, ball, bricks, score, lives. Additional private serializable fields allowed if contract preserved.
- updateGame returns a fresh non-mutating state.
- Input optional booleans: left, right, togglePause. Opposite directions cancel.
- dt numeric and finite in [0,0.1], otherwise RangeError.
- Paddle updates before ball collisions.
- Pause toggling does not advance gameplay; paused and terminal states freeze.
- dt=0 causes no motion, collision, scoring, or life loss.
- Left/right/top wall reflections resolve overshoot; no bottom-wall bounce.
- Use swept circle-versus-rectangle collision detection for paddle and bricks, including corners, chronological collision ordering, and no tunneling.
- Descending paddle contact reverses vy and preserves vx and speed components; separating contacts do not retrigger.
- First contact with an active brick deactivates it, adds exactly 10 points, and reflects the appropriate component. Inactive bricks are noncollidable.
- When ball.y-ball.radius > 500, lose one life. With lives remaining, reset ball to its original location and velocity, preserve paddle/bricks/score, and terminate update. At zero lives set lost and preserve exit position.
- Clearing final active brick sets won immediately.
- Simultaneous earliest contacts within 1e-9 apply combined reflections and destroy all contacted active bricks once each. Tie order wall, paddle, bricks row-major. Floating comparisons use 1e-6 unless noted.
- No randomness or acceleration.
- Keyboard: left/right arrows or A/D, Space pause (suppress repeat), R restart. Prevent control-key scrolling.

Include:
1. Purpose and scope
2. Technology and deliverables
3. Coordinate system/constants
4. Full public initial-state schema
5. API contracts
6. Functional requirements BRICK-FR-01 through BRICK-FR-12
7. Determinism and collision semantics
8. Nonfunctional requirements
9. Verification plan
10. Explicit test matrix BRICK-T01 through BRICK-T28 covering initial state, movement, walls, paddle, bricks, tunneling, lives, win/loss, pause, reset, determinism, immutability, invalid dt, opposing input, zero dt, exact bottom threshold, and simultaneous contacts
11. Browser acceptance checks BRICK-B01 through BRICK-B10
12. Experiment logging
13. Open interpretation rules

Do not generate game code yet. Output the complete SRS as Markdown. Do not assume any implementation has been executed.


PromptProtocol:
Using the completed Brick_Breaker_SRS_v1.0.md, create a standardized AI Development Prompt Protocol titled Brick_Breaker_AI_Development_Prompt_Protocol_v1.md.

This protocol will be used unchanged, as far as practical, to develop Brick Breaker with ChatGPT and Grok within Cursor.

Create exact, copy-paste-ready prompts for these checkpoints:
- CP-00: Read and summarize the SRS without writing code.
- CP-01: Propose an implementation plan without writing code.
- CP-02: Generate the complete baseline implementation and preserve it before any repairs.
- CP-03: Conduct a read-only requirements compliance review.
- CP-04: Launch the application and report actual runtime behavior.
- CP-05: Run the independent unit-test harness and report exact first-run results.
- CP-06: Diagnose and repair observed defects, then retest.
- CP-07: Perform the ten manual browser acceptance checks.
- CP-08: Produce an evidence-based final engineering report.
- CP-09: Optional recovery procedure for a blocked checkpoint.

Include these experiment rules:
1. Use the same SRS, prompts, test suite, and test environment for both tools.
2. Keep implementation directories separate.
3. Save the initial generated implementation before repairs.
4. Do not expose the independent unit-test source or validation reference implementation before the initial code generation.
5. Report actual results, never assumed results.
6. Allow a maximum of two AI repair attempts per failed checkpoint.
7. Do not modify the SRS or frozen test assertions to make an implementation pass.
8. Record elapsed time, code snapshots, test results, repairs, and human interventions.
9. Clearly distinguish actions performed by the AI from actions performed by the human.
10. Include a human intervention log and checkpoint results template.

For every checkpoint, include the exact prompt, expected evidence, and a completion gate.

Do not implement Brick Breaker yet. Produce only the complete Markdown prompting protocol.
