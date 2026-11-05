# Brick_Breaker_SRS_v1.0.md

Software Requirements Specification (SRS)

| Document attribute   | Value                                                               |
| -------------------- | ------------------------------------------------------------------- |
| Project              | Brick Breaker                                                       |
| Document version     | 1.0                                                                 |
| Date                 | 2026-11-04                                                          |
| Document status      | Baseline specification — implementation pending                     |
| Application type     | Single-player browser game                                          |
| Technology           | HTML5 Canvas, JavaScript ES modules                                 |
| Runtime dependencies | None                                                                |
| Assignment 4         | Implementation using ChatGPT                                        |
| Assignment 5         | Implementation using Grok within Cursor                             |
| Verification status  | Not executed                                                        |
| Intended audience    | Students, instructors, implementers, reviewers, and test evaluators |

## 1. Purpose and Scope

### 1.1 Purpose

This Software Requirements Specification defines the functional behavior, data structures, interfaces, collision semantics, technical constraints, verification criteria, and experiment-recording requirements for a deterministic, single-player Brick Breaker browser game.

The document serves as a common implementation contract for two independent AI-assisted software-development assignments:

- Assignment 4: Implement Brick Breaker using ChatGPT.
- Assignment 5: Implement the same Brick Breaker using Grok within Cursor.

Both implementations shall use this same specification without changing required constants, public APIs, game behavior, or acceptance criteria.

### 1.2 Scope

The application shall present a playable Brick Breaker game in which the player moves a horizontal paddle to reflect a moving ball and destroy a fixed arrangement of bricks.

The game shall support paddle movement, ball motion, collision handling, brick destruction, scoring, lives, pausing, restarting, winning, and losing.

The implementation shall separate deterministic game logic from browser-specific rendering and keyboard event handling.

### 1.3 Out of Scope

The following features are excluded from version 1.0:

- Multiplayer gameplay
- Audio and sound effects
- Power-ups, levels, or difficulty progression
- Randomized brick arrangements or ball trajectories
- Ball acceleration or progressive speed changes
- Touch, mouse, or gamepad controls
- Persistent scores, leaderboards, or accounts
- External runtime frameworks or libraries
- Network communication or backend services

### 1.4 Requirement Language

The terms SHALL, SHALL NOT, SHOULD, and MAY have the following meanings:

- SHALL: Mandatory for conformance.
- SHALL NOT: Explicitly prohibited.
- SHOULD: Recommended but not mandatory.
- MAY: Optional, provided mandatory behavior is preserved.

All identifiers beginning with `BRICK-` are traceable requirement or test identifiers.

## 2. Technology and Deliverables

### 2.1 Required Technology

The implementation SHALL use:

- HTML5 Canvas for graphical rendering.
- JavaScript using native ECMAScript modules.
- Browser-native keyboard event handling.
- Browser-native animation scheduling, such as `requestAnimationFrame`.
- Plain JavaScript for pure game logic.

No external runtime libraries, game engines, physics engines, UI frameworks, or package dependencies SHALL be used.

### 2.2 Exact Deliverable Files

The submission SHALL contain exactly these four files at the project root:

| File           | Responsibility                                                              |
| -------------- | --------------------------------------------------------------------------- |
| `index.html`   | HTML document, Canvas element, and ES-module entry point                    |
| `game.js`      | Browser integration, keyboard handling, rendering, and animation scheduling |
| `gameLogic.js` | Pure state initialization, game updates, collision handling, and game rules |
| `package.json` | Project metadata and ES-module configuration                                |

No additional submitted source, configuration, test, asset, or documentation files are required or permitted as part of the four-file implementation deliverable.

This SRS is a separate assignment specification, not a fifth game deliverable.

### 2.3 Module Configuration

`package.json` SHALL be valid JSON and SHALL contain:

```
{
  "type": "module"
}
```

Additional metadata MAY be included if it does not introduce runtime dependencies or change the four-file deliverable requirement.

`game.js` SHALL import the required public functions from `gameLogic.js` using native ES-module syntax.

`index.html` SHALL load `game.js` as a module.

### 2.4 Separation of Responsibilities

`gameLogic.js` SHALL NOT access:

- `window`
- `document`
- HTML Canvas or rendering contexts
- DOM events
- Browser storage
- Browser animation APIs
- Browser timing APIs
- Network APIs

The pure game-logic module SHALL NOT depend on the existence of a browser environment.

`game.js` SHALL handle browser input, scheduling, and rendering without duplicating or independently modifying game rules.

## 3. Coordinate System and Constants

### 3.1 Coordinate System

The playfield SHALL use a two-dimensional Cartesian screen coordinate system with:

- Origin `(0,0)` at the top-left.
- Positive x increasing to the right.
- Positive y increasing downward.
- Positions expressed in pixels.
- Velocities expressed in pixels per second.
- `dt` expressed in seconds.

Normative geometry visualization of the initial playfield. Colors and graphical styling are illustrative only; coordinates and dimensions are mandatory.

### 3.2 Playfield Constants

| Constant             | Required value |
| -------------------- | -------------- |
| Playfield width      | 800 px         |
| Playfield height     | 500 px         |
| Left boundary        | x = 0          |
| Right boundary       | x = 800        |
| Top boundary         | y = 0          |
| Bottom loss boundary | y = 500        |

### 3.3 Paddle Constants

| Property         | Required value |
| ---------------- | -------------- |
| Initial x        | 350            |
| Initial y        | 460            |
| Width            | 100            |
| Height           | 12             |
| Horizontal speed | 400 px/s       |
| Minimum x        | 0              |
| Maximum x        | 700            |

The paddle's x and y coordinates SHALL represent its top-left corner.

The paddle SHALL move horizontally only.

### 3.4 Ball Constants

| Property         | Required value |
| ---------------- | -------------- |
| Initial center x | 400            |
| Initial center y | 440            |
| Radius           | 8              |
| Initial vx       | +160 px/s      |
| Initial vy       | -200 px/s      |

The ball's x and y coordinates SHALL represent its center.

The ball SHALL have constant velocity components except for sign changes caused by collision reflections or restoration of its initial velocity after a lost life.

### 3.5 Brick Constants

| Property             | Required value |
| -------------------- | -------------- |
| Rows                 | 3              |
| Columns              | 8              |
| Total bricks         | 24             |
| Brick width          | 80             |
| Brick height         | 20             |
| First brick x        | 45             |
| First brick y        | 60             |
| Horizontal pitch     | 90             |
| Vertical pitch       | 30             |
| Initial active state | `true`         |

For row index \\(r\\) and column index \\(c\\):

\\[ x(r,c)=45+90c \\]

\\[ y(r,c)=60+30r \\]

where \\(0\le r<3\\) and \\(0\le c<8\\).

Brick identifiers SHALL use the format `r{row}c{column}`.

Examples:

- First brick: `r0c0`, at `(45,60)`.
- Last brick of the first row: `r0c7`, at `(675,60)`.
- First brick of the last row: `r2c0`, at `(45,120)`.
- Last brick: `r2c7`, at `(675,120)`.

Bricks SHALL be stored in row-major order, beginning with `r0c0` and ending with `r2c7`.

### 3.6 Scoring, Lives, and Status

| Property                   | Required initial value |
| -------------------------- | ---------------------- |
| Score                      | 0                      |
| Points per destroyed brick | 10                     |
| Lives                      | 3                      |
| Status                     | `"playing"`            |

The only permitted status values SHALL be:

`"playing"`, `"paused"`, `"won"`, `"lost"`.

## 4. Full Public Initial-State Schema

### 4.1 Required State Structure

The public state SHALL be a plain, serializable JavaScript object with the following minimum structure:

```
{
  "status": "playing",
  "paddle": {
    "x": 350,
    "y": 460,
    "width": 100,
    "height": 12,
    "speed": 400
  },
  "ball": {
    "x": 400,
    "y": 440,
    "radius": 8,
    "vx": 160,
    "vy": -200
  },
  "bricks": [],
  "score": 0,
  "lives": 3
}
```

The `bricks` array shown above is abbreviated for readability. In an actual initial state, it SHALL contain exactly 24 objects matching the schema in Section 4.2.

### 4.2 Brick Object Schema

Each brick SHALL contain:

```
{
  "id": "r0c0",
  "x": 45,
  "y": 60,
  "width": 80,
  "height": 20,
  "active": true
}
```

All 24 initial brick records are defined by the following table. Every brick SHALL have `width: 80`, `height: 20`, and `active: true`.

| Row | Brick IDs             | x positions                           | y   |
| --- | --------------------- | ------------------------------------- | --- |
| 0   | `r0c0` through `r0c7` | 45, 135, 225, 315, 405, 495, 585, 675 | 60  |
| 1   | `r1c0` through `r1c7` | 45, 135, 225, 315, 405, 495, 585, 675 | 90  |
| 2   | `r2c0` through `r2c7` | 45, 135, 225, 315, 405, 495, 585, 675 | 120 |

### 4.3 Field Types and Invariants

| Field          | Type    | Invariant                                       |
| -------------- | ------- | ----------------------------------------------- |
| `status`       | string  | One of four allowed statuses                    |
| `paddle`       | object  | Required numeric fields as defined              |
| `ball`         | object  | Required numeric fields as defined              |
| `bricks`       | array   | Exactly 24 uniquely identified bricks           |
| `score`        | number  | Nonnegative integer, multiple of 10             |
| `lives`        | number  | Integer from 0 through 3                        |
| `brick.active` | boolean | Changes only from true to false during gameplay |

The public state SHALL be JSON-serializable. No required state field SHALL contain functions, DOM objects, `undefined`, `NaN`, `Infinity`, or cyclic references.

### 4.4 Additional State Fields

Implementations MAY add private bookkeeping fields provided they are serializable and do not alter the public contract.

Additional fields SHALL NOT be required by external callers to construct a valid initial state.

Implementations SHALL NOT use hidden mutable module-level game state to determine the outcome of `updateGame`.

## 5. Public API Contracts

`gameLogic.js` SHALL export exactly the following required named functions. Additional exports are not required and SHOULD be avoided for experiment comparability.

### 5.1 `createInitialState()`

Signature:

```
createInitialState()
```

Preconditions: None.

Postconditions:

- Returns a newly allocated state object.
- Initializes every field to the values in Sections 3 and 4.
- Creates exactly 24 active brick objects in row-major order.
- Returns a state independent of previous or subsequent calls.
- Does not access browser APIs.
- Does not mutate external state.

Every invocation SHALL return a fresh object graph, including newly allocated nested paddle, ball, brick array, and brick objects.

### 5.2 `resetGame()`

Signature:

```
resetGame()
```

Preconditions: None.

Postconditions:

- Returns a fresh, fully initialized state.
- Restores all initial values, including paddle, ball, bricks, score, lives, and status.
- Does not depend on or mutate any previous state.
- Produces the same required values as `createInitialState()`.

Resetting SHALL be available independently of the current game status.

### 5.3 `updateGame(state, input, dt)`

Signature:

```
updateGame(state, input, dt)
```

Parameters:

| Parameter | Contract                                        |
| --------- | ----------------------------------------------- |
| `state`   | Current valid game-state object                 |
| `input`   | Optional input object with boolean fields       |
| `dt`      | Required finite numeric elapsed time in seconds |

Input object:

```
{
  "left": false,
  "right": false,
  "togglePause": false
}
```

Each input field MAY be omitted, in which case it SHALL be interpreted as `false`. The entire `input` argument MAY be omitted or supplied as `undefined`, equivalent to an empty input object.

Time-step validation:

\\[ 0\le dt\le0.1 \\]

`dt` SHALL be a JavaScript number and SHALL be finite.

The function SHALL throw `RangeError` if `dt` is missing, nonnumeric, `NaN`, infinite, negative, or greater than `0.1`.

Validation SHALL occur before gameplay processing.

Postconditions:

- Returns a fresh state object.
- Does not mutate the input state or any nested object reachable from it.
- Applies pause semantics before movement.
- Applies paddle movement before resolving ball collisions.
- Applies deterministic collision and scoring rules.
- Preserves all state invariants.
- Returns the same logical result for identical state, input, and `dt`.

For valid calls, the returned state SHALL be a new object graph independent of the input graph, including all required nested objects and brick records, even if gameplay is frozen or `dt` is zero.

### 5.4 Input and State Validation

Only `dt` has a mandatory exception contract.

The caller is responsible for providing a structurally valid game state and boolean input values. Behavior for malformed states or nonboolean input fields is outside the required conformance surface.

## 6. Functional Requirements

### BRICK-FR-01 — Initialization

The system SHALL initialize an 800×500 playfield with the exact paddle, ball, brick, score, lives, and status values specified in Sections 3 and 4.

### BRICK-FR-02 — Paddle Movement

The system SHALL move the paddle horizontally at 400 px/s according to input.

- Left only: decrease paddle x by `400 × dt`.
- Right only: increase paddle x by `400 × dt`.
- Both or neither: no horizontal movement.
- Clamp the final x to `[0,700]`.
- Preserve paddle y, width, height, and speed.

Paddle movement SHALL be applied before ball collision processing in the same update.

### BRICK-FR-03 — Ball Movement

While status is `"playing"`, the system SHALL move the ball using its velocity and elapsed time, subject to collision events.

The implementation SHALL use continuous collision-time processing rather than relying solely on end-position overlap checks.

No gravity, friction, acceleration, or randomness SHALL be applied.

### BRICK-FR-04 — Playfield Wall Collisions

The ball SHALL reflect from the left, right, and top boundaries.

- Left contact: reverse negative vx.
- Right contact: reverse positive vx.
- Top contact: reverse negative vy.
- Resolve overshoot without losing the remaining elapsed simulation time.
- Keep the ball's circle within the corresponding wall after collision resolution.

The bottom boundary SHALL NOT reflect the ball.

### BRICK-FR-05 — Paddle Collisions

A descending ball contacting the paddle SHALL reflect its vertical velocity upward.

- Reverse vy.
- Preserve vx.
- Preserve the absolute magnitude of each velocity component.
- Detect face and corner contacts using swept collision detection.
- Ignore separating contacts so they do not repeatedly trigger.
- Do not introduce angle-based paddle steering.

Paddle collisions SHALL use the paddle's position after the current update's paddle movement.

### BRICK-FR-06 — Brick Collisions and Scoring

The first valid contact with an active brick SHALL:

- Set that brick's `active` field to `false`.
- Increase score by exactly 10.
- Reflect the appropriate ball velocity component according to the collision normal.
- Preserve the brick's ID, position, width, height, and array order.

Inactive bricks SHALL not participate in collision detection and SHALL never award points again.

### BRICK-FR-07 — Continuous Collision Detection

The system SHALL use swept circle-versus-axis-aligned-rectangle collision detection for the paddle and active bricks, including corner contacts.

The system SHALL process collisions chronologically within each update and SHALL not allow tunneling through active collision geometry.

### BRICK-FR-08 — Life Loss

A life SHALL be lost when:

\\[ ball.y-ball.radius>500 \\]

On the first transition satisfying this condition:

- Decrement lives by exactly one.
- If lives remain, restore ball center to `(400,440)` and velocity to `(160,-200)`.
- Preserve the current paddle, bricks, and score.
- Terminate the current update without consuming additional simulation time.

At zero lives, set status to `"lost"` and preserve the ball's exit position instead of resetting it.

### BRICK-FR-09 — Winning and Losing

The system SHALL set status to `"won"` immediately upon destruction of the final active brick.

The system SHALL set status to `"lost"` when life loss reduces lives to zero.

Terminal states SHALL not advance gameplay on subsequent updates.

### BRICK-FR-10 — Pause and Resume

While playing, a true `togglePause` input SHALL change status to `"paused"`.

While paused, a true `togglePause` input SHALL change status to `"playing"`.

The update in which either toggle occurs SHALL not advance paddle motion, ball motion, collisions, score, or lives.

While paused, gameplay SHALL remain frozen.

Pause input SHALL NOT change a terminal `"won"` or `"lost"` state.

### BRICK-FR-11 — Keyboard Controls and Restart

The browser interface SHALL support:

| Key         | Action              |
| ----------- | ------------------- |
| Left Arrow  | Move paddle left    |
| A           | Move paddle left    |
| Right Arrow | Move paddle right   |
| D           | Move paddle right   |
| Space       | Toggle pause/resume |
| R           | Restart entire game |

Space toggling SHALL suppress key-repeat events so one physical key press causes at most one pause toggle.

The browser interface SHALL prevent default scrolling behavior for gameplay control keys.

Restart SHALL invoke `resetGame()` and replace the active game state regardless of whether the current status is playing, paused, won, or lost.

### BRICK-FR-12 — Rendering and User Feedback

The browser interface SHALL render the current game state to HTML5 Canvas, including:

- Paddle
- Ball
- Active bricks
- Current score
- Remaining lives
- Playing, paused, won, or lost status feedback

Inactive bricks SHALL not be rendered as active obstacles.

Rendering SHALL not modify the game state.

The Canvas playfield SHALL use the logical coordinate dimensions 800×500.

## 7. Determinism and Collision Semantics

### 7.1 Deterministic State Transition

For identical valid inputs:

\\[ F(S,I,\Delta t)=S' \\]

the function `updateGame` SHALL produce the same resulting state values.

Determinism SHALL not depend on:

- Wall-clock time
- Frame rate
- Random numbers
- Browser rendering state
- Previous calls using unrelated states
- External mutable variables

### 7.2 Time and Collision Ordering

An update SHALL follow this logical order:

1. Validate `dt`.
2. Evaluate terminal-state and pause-toggle rules.
3. If paused or terminal, return a fresh frozen state.
4. If `dt = 0`, return a fresh state without gameplay advancement.
5. Compute and clamp paddle movement for the full `dt`.
6. Process ball motion continuously through the interval, resolving the earliest collision events first.
7. Apply collision reflections and brick destruction.
8. Evaluate immediate win and life-loss transitions.
9. Return the resulting fresh state.

If a pause toggle occurs with `dt = 0`, the status toggle SHALL still occur; zero time prohibits gameplay advancement, not control-state transitions.

### 7.3 Swept Circle-versus-Rectangle Semantics

Paddle and brick collisions SHALL use the actual circle geometry against axis-aligned rectangles.

A collision detector SHALL account for:

- Rectangle faces.
- Rectangle corners.
- The ball's radius.
- Relative motion over the remaining time interval.
- Earliest valid time of impact.
- Approaching versus separating motion.

A swept point against a radius-expanded rectangle MAY be used as a broad-phase technique, but a square-corner approximation SHALL NOT replace accurate circle-versus-corner collision determination.

The time of impact SHALL be calculated within the remaining simulation interval.

### 7.4 Reflection Rules

For axis-aligned wall or rectangle-face contact:

- Horizontal normal: reverse vx.
- Vertical normal: reverse vy.

For an isolated corner contact, reflection SHALL use the contact normal:

\\[ \mathbf v'=\mathbf v-2(\mathbf v\cdot\mathbf n)\mathbf n \\]

where \\(\mathbf n\\) is the unit normal from the obstacle toward the ball center.

The paddle-specific descending-contact rule takes precedence over the generic corner-reflection rule: it reverses vy and preserves vx.

A collision SHALL only generate a reflection when the ball is approaching the contact surface, not when separating.

### 7.5 Chronological Event Processing

If multiple collisions are possible in one update, the earliest time of impact SHALL be resolved first.

After an event:

- Advance the ball to the collision position.
- Apply all qualifying simultaneous contact effects.
- Continue using the remaining time unless a win or life-loss event terminates the update.

The implementation SHALL not process later collisions before earlier ones.

### 7.6 Simultaneous Contacts

Two or more contact events SHALL be considered simultaneous when their computed times of impact differ by no more than:

\\[ \epsilon_t=10^{-9}\text{ seconds} \\]

For simultaneous earliest events:

- Apply combined reflections.
- Destroy every distinct active brick contacted at that event.
- Award exactly 10 points for each distinct destroyed brick.
- Never destroy or score the same brick twice.
- Use deterministic tie ordering: wall, paddle, then bricks in row-major order.

Combined axis reflections SHALL reverse each affected velocity component once, not once per contact.

For multiple non-axis-aligned normals, the deterministic resolution rules in Section 13 SHALL apply.

### 7.7 Floating-Point Comparison Tolerance

Unless a stricter tolerance is explicitly specified, floating-point comparisons in verification SHALL use:

\\[ \epsilon=10^{-6} \\]

This tolerance applies to expected numeric positions and velocities, not to discrete status, score, lives, IDs, or brick activity.

The simultaneous contact-time tolerance SHALL remain `1e-9`.

The bottom-loss threshold SHALL use the strict comparison `ball.y - ball.radius > 500`, without widening it by the general floating-point tolerance.

### 7.8 Bottom Exit Semantics

The bottom boundary is a loss detector rather than a collision reflector.

The ball SHALL be allowed to travel below the visible playfield.

A ball whose bottom-exit condition has not been met SHALL not lose a life merely because its center or lower edge crosses y = 500.

The exact condition is based on the ball's uppermost point:

\\[ ball.y-radius>500 \\]

### 7.9 No Acceleration

Except for geometric reflection, the ball SHALL not change speed.

Axis-aligned collisions SHALL preserve the absolute values of vx and vy.

Corner reflection SHALL preserve the Euclidean speed magnitude within floating-point tolerance.

The paddle SHALL not impart additional speed.

## 8. Nonfunctional Requirements

| ID           | Requirement                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| BRICK-NFR-01 | The implementation SHALL use only native browser APIs and JavaScript ES modules at runtime.                        |
| BRICK-NFR-02 | Game logic SHALL be independently importable and testable without a DOM.                                           |
| BRICK-NFR-03 | Every valid `updateGame` call SHALL preserve input-state immutability.                                             |
| BRICK-NFR-04 | Game behavior SHALL be deterministic for identical valid inputs.                                                   |
| BRICK-NFR-05 | The implementation SHALL handle every valid `dt` in `[0,0.1]`, including zero.                                     |
| BRICK-NFR-06 | Collision processing SHALL support multiple impacts within one update without tunneling.                           |
| BRICK-NFR-07 | The browser interface SHOULD target smooth rendering at typical 60 Hz display refresh rates.                       |
| BRICK-NFR-08 | The browser interface SHALL not use rendering frame count as the unit of game movement.                            |
| BRICK-NFR-09 | The project SHALL work in current standards-compliant desktop browsers supporting HTML5 Canvas and ES modules.     |
| BRICK-NFR-10 | Source code SHOULD use clear function names and consistent formatting for review and comparison.                   |
| BRICK-NFR-11 | The application SHALL operate without network services after its four files are served locally.                    |
| BRICK-NFR-12 | The implementation SHALL not introduce additional gameplay features that change the specified experiment behavior. |

Rendering performance SHALL NOT be achieved by skipping required collision detection.

## 9. Verification Plan

### 9.1 Verification Objectives

Verification SHALL establish whether each implementation independently satisfies the same baseline SRS.

The verification process SHALL cover:

- Public API exports and return values.
- Initial-state structure and constants.
- Paddle and ball motion.
- Wall, paddle, and brick collision semantics.
- Scoring, life loss, winning, and losing.
- Pause and restart behavior.
- Determinism and immutability.
- Input validation.
- Browser rendering and keyboard behavior.

### 9.2 Test Levels

Level 1 — Static inspection: Confirm exact file names, module configuration, required exports, prohibited dependencies, and architectural separation.

Level 2 — Pure-logic tests: Import `gameLogic.js` into a JavaScript ES-module-capable test environment and exercise its exported functions without browser APIs.

Level 3 — Browser acceptance: Load the application in a desktop browser and verify Canvas rendering, keyboard input, visual feedback, and restart behavior.

Level 4 — Comparative experiment review: Apply identical test scenarios to both AI-generated implementations and record their outcomes independently.

### 9.3 Test Fixture Policy

Tests MAY create valid synthetic states by cloning an initialized state and changing ball position, velocity, paddle position, brick activity, score, lives, or status.

Synthetic states SHALL preserve the required public structure and geometric constants unless the test explicitly verifies validation behavior.

Tests SHALL not rely on unspecified private state fields.

### 9.4 Pass and Fail Rules

A test SHALL pass only if all its specified assertions hold.

- Numeric comparisons: absolute tolerance `1e-6`, unless explicitly overridden.
- Discrete values: exact equality.
- Brick order and IDs: exact equality.
- Input-state immutability: deep equality before and after invocation.
- Fresh-state requirement: distinct references for all required objects.
- Expected errors: correct exception type.

A failure in one test SHALL not automatically be counted as failure of other tests without separately evaluating their assertions.

### 9.5 Test Execution Status

All tests defined below are planned, not executed.

No implementation, test result, benchmark, or browser observation is claimed by this specification.

## 10. Explicit Test Matrix — BRICK-T01 through BRICK-T28

### 10.1 General Test Conventions

The following conventions SHALL apply to all 28 tests.

- Each test SHALL start with a fresh state unless a different fixture is specified.
- `S` denotes a valid state returned by `createInitialState()` or a valid modified copy.
- `U(S,I,dt)` denotes `updateGame(S,I,dt)`.
- Unspecified input fields SHALL be false.
- Unspecified state fields SHALL retain their initialized values.
- For synthetic collision tests, irrelevant bricks MAY be marked inactive to isolate the intended collision, provided at least one active brick remains unless the test explicitly targets the final brick.
- A fixture with zero active bricks and status `"playing"` SHALL not be used except when explicitly testing a terminal transition.
- Numerical results SHALL be compared within `1e-6`, except where specified.
- Every test SHALL additionally verify required state invariants unless the test expects an exception.

### 10.2 Pure-Logic Test Matrix

| Test ID   | Test and setup                                                                                                              | Expected result                                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BRICK-T01 | Call `createInitialState()` twice.                                                                                          | Both states have status `"playing"`, score 0, lives 3, paddle `(350,460,100,12,400)`, ball `(400,440,8,160,-200)`, and 24 active bricks. All required object references are independent.     |
| BRICK-T02 | Inspect initial bricks and geometry.                                                                                        | IDs exactly `r0c0` through `r2c7` in row-major order; all brick positions follow the specified pitch formulas; widths are 80 and heights are 20.                                             |
| BRICK-T03 | `U(S,{right:true},0.1)` using initial state.                                                                                | Paddle x becomes 390; y remains 460. Ball and other gameplay fields evolve according to normal simulation.                                                                                   |
| BRICK-T04 | `U(S,{left:true},0.1)` using initial state.                                                                                 | Paddle x becomes 310; y remains 460.                                                                                                                                                         |
| BRICK-T05 | Set paddle x to 695; apply right input with `dt=0.1`. Separately set x to 5 and apply left input.                           | Rightward movement clamps at 700; leftward movement clamps at 0.                                                                                                                             |
| BRICK-T06 | Place ball at `(400,300)`, velocity `(160,-200)`, with no reachable obstacles; `dt=0.1`.                                    | Ball center becomes `(416,280)` and velocity remains `(160,-200)`.                                                                                                                           |
| BRICK-T07 | Place ball at `(10,300)`, velocity `(-160,-200)`; `dt=0.05`.                                                                | Left-wall collision at 0.0125 s; final x = 14, vx = +160.                                                                                                                                    |
| BRICK-T08 | Place ball at `(790,300)`, velocity `(+160,-200)`; `dt=0.05`.                                                               | Right-wall collision at 0.0125 s; final x = 786, vx = -160.                                                                                                                                  |
| BRICK-T09 | Place ball at `(400,10)`, velocity `(160,-200)`; `dt=0.05`.                                                                 | Top-wall collision at 0.01 s; final y = 14, vy = +200.                                                                                                                                       |
| BRICK-T10 | Place descending ball at `(400,440)`, velocity `(160,200)`; paddle at initial position; `dt=0.1`.                           | Ball contacts paddle top at 0.06 s; final center approximately `(416,444)`, vx = +160, vy = -200. No life lost.                                                                              |
| BRICK-T11 | Place ball at `(400,452)`, moving upward with velocity `(160,-200)` and touching paddle top; `dt=0.05`.                     | Separating contact does not retrigger; ball moves upward and vy remains -200.                                                                                                                |
| BRICK-T12 | Place ball at `(85,45)`, velocity `(0,200)`; brick `r0c0` active; `dt=0.1`.                                                 | Brick `r0c0` becomes inactive; score increases by 10; ball reflects upward with vy = -200.                                                                                                   |
| BRICK-T13 | Use the T12 trajectory with `r0c0` inactive and another unreachable brick active.                                           | Inactive brick is ignored; score remains unchanged and ball does not reflect from it.                                                                                                        |
| BRICK-T14 | Place ball at `(85,30)`, velocity `(0,2000)`; brick `r0c0` active; `dt=0.1`.                                                | Swept detection registers the brick despite the high-speed crossing; `r0c0` is destroyed, score increases by 10, and the ball reflects.                                                      |
| BRICK-T15 | Set ball `(400,507)`, radius 8, velocity `(0,200)`, lives 3; `dt=0.01`.                                                     | Bottom-exit threshold is crossed; lives become 2; ball resets to `(400,440)` with velocity `(160,-200)`; paddle, bricks, and score are preserved.                                            |
| BRICK-T16 | Repeat T15 with lives 1.                                                                                                    | Lives become 0, status becomes `"lost"`, and ball remains at its exit position rather than resetting.                                                                                        |
| BRICK-T17 | Set only `r0c0` active, score 230, ball positioned to hit that brick.                                                       | Final brick becomes inactive, score becomes 240, and status becomes `"won"` immediately. No further gameplay movement occurs in that update.                                                 |
| BRICK-T18 | Set status `"playing"` and call `U(S,{togglePause:true,right:true},0.1)`.                                                   | Status becomes `"paused"`; paddle, ball, score, lives, and bricks do not advance.                                                                                                            |
| BRICK-T19 | Set status `"paused"` and call `U(S,{togglePause:true,left:true},0.1)`.                                                     | Status becomes `"playing"` without gameplay advancement during the toggle update.                                                                                                            |
| BRICK-T20 | Test `"paused"`, `"won"`, and `"lost"` states with movement input and positive `dt`.                                        | All gameplay fields remain frozen. Terminal states ignore pause toggles.                                                                                                                     |
| BRICK-T21 | Modify a state, then call `resetGame()` twice.                                                                              | Each result equals the complete initial-state values, including all 24 active bricks, and uses fresh independent object references.                                                          |
| BRICK-T22 | Deep-clone one valid state; run identical inputs and `dt` values on independent copies.                                     | Resulting states are deeply equal. Repeating the same input sequence produces identical results.                                                                                             |
| BRICK-T23 | Deep-freeze an initialized state and call `updateGame` with valid input.                                                    | No mutation or exception caused by attempted mutation; returned state is independent, including nested objects and brick records.                                                            |
| BRICK-T24 | Call `updateGame` with `dt` values `-0.001`, `0.100001`, `NaN`, `Infinity`, `-Infinity`, `"0.05"`, `null`, and `undefined`. | Every call throws `RangeError`. Valid endpoints 0 and 0.1 are accepted.                                                                                                                      |
| BRICK-T25 | `U(S,{left:true,right:true},0.1)`.                                                                                          | Opposite directions cancel; paddle x remains unchanged.                                                                                                                                      |
| BRICK-T26 | `U(S,{right:true},0)` and a separate zero-time update with a ball touching an active brick.                                 | No paddle or ball motion, collisions, scoring, or life loss. A pause toggle, if present, may change status only.                                                                             |
| BRICK-T27 | Set ball center y to exactly 508, radius 8, vy = 0, lives 3; `dt=0.1`. Then test y = 508.00001.                             | At y = 508, no life loss because `y-radius = 500`. At y = 508.00001, one life is lost.                                                                                                       |
| BRICK-T28 | Construct simultaneous earliest wall/brick and multi-brick contact fixtures with impact times equal within `1e-9`.          | All qualifying bricks are destroyed exactly once, score increases by 10 per brick, combined reflections are applied deterministically, and tie order is wall, paddle, then bricks row-major. |

### 10.3 Additional Assertions for Collision Tests

For BRICK-T07 through BRICK-T14 and BRICK-T28, the evaluator SHALL additionally verify that:

1. Collision response does not introduce unintended acceleration.
2. The ball does not pass through a valid active obstacle without registering the collision.
3. Separating contact does not cause repeated reflection.
4. Remaining simulation time is processed after nonterminal collisions.
5. No brick is scored more than once.
6. Input-state immutability is maintained.

For BRICK-T28, the evaluator SHOULD include a fixture where two adjacent bricks are contacted at the same earliest time and a separate fixture involving a corner normal.

### 10.4 Test Harness Requirements

The verification harness MAY be maintained outside the four-file implementation deliverable.

It SHALL:

- Import the public functions from `gameLogic.js`.
- Avoid requiring a DOM for pure-logic tests.
- Use explicit, reproducible test fixtures.
- Record actual and expected values.
- Report pass, fail, or not-run for each test.
- Use the same fixtures and assertions for both assignments.

Tests SHALL not be weakened or modified to accommodate a particular AI-generated implementation.

### 10.5 Known Fixture Considerations

High-speed tests MAY use synthetic velocities that differ from the initial velocity, because the public state contains velocity fields and collision correctness must be verified independently of the default starting trajectory.

These synthetic velocities are test conditions, not permission for the application to introduce acceleration or alter the prescribed initial velocity.

For BRICK-T27, the ball's exit condition SHALL be evaluated at the start of the positive-time update when the supplied state is already beyond the threshold. The exact-threshold fixture with zero vertical velocity SHALL remain nonterminal.

## 11. Browser Acceptance Checks — BRICK-B01 through BRICK-B10

Browser acceptance SHALL be performed independently for both implementations using a standards-compliant desktop browser.

| Check ID  | Action                                                                                               | Acceptance criteria                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| BRICK-B01 | Serve the four-file project locally and open `index.html`.                                           | Page loads, ES modules resolve, Canvas renders, and no uncaught JavaScript errors occur.                                              |
| BRICK-B02 | Inspect the initial rendered scene.                                                                  | Canvas uses logical dimensions 800×500; paddle, ball, and all 24 bricks appear at their prescribed coordinates.                       |
| BRICK-B03 | Hold Left Arrow and then A.                                                                          | Both controls move the paddle left at the specified speed; paddle cannot move beyond x = 0.                                           |
| BRICK-B04 | Hold Right Arrow and then D.                                                                         | Both controls move the paddle right at the specified speed; paddle cannot move beyond x = 700.                                        |
| BRICK-B05 | Hold opposite-direction keys simultaneously.                                                         | Paddle remains stationary while opposing directions are active; releasing one direction restores movement in the remaining direction. |
| BRICK-B06 | Press and hold Space, then release and press again.                                                  | First physical press pauses; holding the key does not repeatedly toggle; second physical press resumes.                               |
| BRICK-B07 | Observe ball interaction with walls, paddle, and bricks.                                             | Ball reflects according to the specified rules, active bricks disappear on contact, and score increases by 10 per destroyed brick.    |
| BRICK-B08 | Allow the ball to leave through the bottom.                                                          | Lives decrease once per exit; ball resets if lives remain; game displays lost status at zero lives.                                   |
| BRICK-B09 | Clear all 24 bricks using controlled gameplay or an equivalent browser-level test setup.             | Score reaches 240, status becomes won, and gameplay freezes.                                                                          |
| BRICK-B10 | Press R during playing, paused, won, and lost states; also check scrolling behavior of control keys. | Every restart restores the complete initial game; gameplay control keys do not cause unwanted page scrolling.                         |

### 11.1 Browser Test Environment

Each browser acceptance report SHALL identify:

- Browser name and version.
- Operating system.
- Method used to serve the application locally.
- Date of execution.
- Whether browser developer tools reported errors.
- Any environmental limitations affecting the result.

### 11.2 Browser Timing Requirements

The browser integration SHALL convert elapsed animation time into seconds before calling `updateGame`.

Every invocation SHALL pass a valid `dt` in `[0,0.1]`.

If the elapsed browser-frame interval exceeds 0.1 seconds, the integration SHALL use bounded simulation steps rather than passing an invalid `dt`.

The browser SHALL not alter prescribed paddle or ball speeds to compensate for rendering performance.

### 11.3 Input Handling Requirements

For each direction, the browser interface SHALL maintain the correct effective pressed state across its supported key aliases.

For example, releasing A while Left Arrow remains pressed SHALL not cancel leftward movement.

Space SHALL generate one logical toggle per nonrepeated keydown. The browser integration SHALL not interpret every animation frame during a held Space key as a new toggle.

R SHALL trigger a complete restart through `resetGame()`.

### 11.4 Visual Presentation

Colors, fonts, and decorative styling MAY differ between implementations.

Such differences SHALL not affect:

- Playfield dimensions.
- Collision geometry.
- Input behavior.
- Game state.
- Score or lives.
- Win or loss transitions.

Visual appearance SHALL be evaluated separately from functional correctness.

## 12. Experiment Logging

### 12.1 Experiment Objective

The experiment SHALL compare two AI-assisted implementations of the same prescribed game under a common requirements baseline.

The principal comparison objective is to measure specification compliance and development outcomes, not to evaluate differences in unspecified gameplay design.

### 12.2 Required Experiment Metadata

Each assignment SHALL maintain an experiment record containing:

| Field                   | Required information                                               |
| ----------------------- | ------------------------------------------------------------------ |
| Experiment ID           | Assignment 4 or Assignment 5                                       |
| AI system               | ChatGPT or Grok within Cursor                                      |
| AI model                | Exact displayed model name/version, if available                   |
| Development environment | Editor, operating system, and relevant versions                    |
| SRS baseline            | `Brick_Breaker_SRS_v1.0.md`                                        |
| Start timestamp         | Beginning of implementation activity                               |
| End timestamp           | End of implementation activity                                     |
| Total elapsed time      | Measured development duration                                      |
| Prompt count            | Number of prompts submitted                                        |
| Prompt transcript       | Exact prompts and responses, subject to course data-handling rules |
| Iteration count         | Number of implementation or correction cycles                      |
| Manual interventions    | Human code edits and their purpose                                 |
| Test execution          | Tests run and outcomes                                             |
| Final deliverables      | Exact submitted file names                                         |
| Known defects           | Unresolved deviations from the SRS                                 |

### 12.3 Development Event Log

For each meaningful implementation or debugging event, the experimenter SHALL record:

| Event field            | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| Sequence number        | Monotonic event number                                |
| Timestamp              | Time of event                                         |
| Prompt or action       | Exact request or manual operation                     |
| Target files           | Files affected                                        |
| AI response summary    | What the AI proposed or changed                       |
| Human action           | Acceptance, rejection, modification, or clarification |
| Verification performed | Test IDs or manual checks                             |
| Outcome                | Pass, fail, not run, or unresolved                    |
| Notes                  | Errors, assumptions, or deviations                    |

### 12.4 Test Results Log

Both assignments SHALL use the following result structure for every required test.

| Field            | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Test ID          | `BRICK-T01` through `BRICK-T28` or `BRICK-B01` through `BRICK-B10` |
| Expected result  | Defined by this SRS                                                |
| Actual result    | Recorded during execution                                          |
| Status           | PASS / FAIL / NOT RUN / BLOCKED                                    |
| Evidence         | Assertion output, browser observation, or relevant diagnostic      |
| Defect reference | Optional identifier for a failure                                  |
| Retest result    | Updated result after correction, if applicable                     |

A test SHALL NOT be marked PASS merely because the AI claims the implementation is correct.

### 12.5 Comparison Metrics

The experiment SHOULD calculate the following metrics for each assignment.

Pure-logic test pass rate:

\\[ P_L=\frac{\text{Passed logic tests}}{28}\times100\\% \\]

Browser acceptance pass rate:

\\[ P_B=\frac{\text{Passed browser checks}}{10}\times100\\% \\]

Overall required-check pass rate:

\\[ P_O=\frac{\text{Passed required checks}}{38}\times100\\% \\]

NOT RUN and BLOCKED tests SHALL remain in the denominator for overall completion reporting and SHALL be reported separately from FAIL results.

Additional comparative metrics SHOULD include:

- Total development time.
- Number of AI prompts.
- Number of corrective prompts.
- Number of manual code modifications.
- Number of detected defects.
- Number of unresolved defects.
- Number of specification deviations.
- Final file count.
- Number of prohibited dependencies, if any.

### 12.6 Experimental Controls

To support a fair comparison:

1. Both assignments SHALL use the same SRS version.
2. Both SHALL be evaluated against identical test definitions.
3. Neither SHALL receive additional mandatory requirements unavailable to the other.
4. Changes to the SRS SHALL be versioned and documented.
5. Human interventions SHALL be recorded rather than hidden.
6. Failed tests SHALL remain in the experiment record even if subsequently corrected.
7. Prompt and correction history SHALL be preserved where permitted.
8. Results SHALL distinguish AI-generated code from human-authored modifications.

### 12.7 Reporting Requirements

The final experiment report SHALL present separate results for Assignment 4 and Assignment 5.

The report SHALL distinguish:

- Observed facts.
- Measured metrics.
- Developer interpretations.
- Unverified AI claims.
- Environmental limitations.

No conclusion about relative model quality SHALL be drawn solely from an unverified code-generation response.

## 13. Open Interpretation Rules

This section resolves implementation choices not fully determined by the preceding requirements. Its purpose is to prevent independent implementations from introducing incompatible behavior while allowing reasonable internal algorithm choices.

### 13.1 Precedence of Requirements

When interpreting this SRS, the following precedence SHALL apply:

1. Explicit numeric constants and public API contracts.
2. Explicit functional requirements.
3. Determinism and collision semantics.
4. Explicit verification expectations.
5. Open interpretation rules in this section.
6. Implementation-specific internal choices.

An implementation SHALL NOT use an interpretation rule to override an explicit higher-priority requirement.

### 13.2 Paddle Position During an Update

The paddle SHALL first move and be clamped using the full supplied `dt`.

The ball collision solver SHALL then treat the paddle as stationary at that updated position throughout the ball's current simulation interval.

Continuous paddle movement during the ball sweep is not required and SHALL NOT replace this update order.

### 13.3 Collision-Time and Contact Rules

The collision solver SHALL determine the earliest valid nonnegative contact time within the remaining update interval.

Contact exactly at the end of an interval SHALL count as a collision when the ball is approaching the obstacle.

For a ball initially touching a surface:

- An approaching velocity SHALL allow an immediate collision.
- A separating velocity SHALL not cause another reflection.
- A tangential velocity SHALL not cause a reflection unless another simultaneous contact produces an approaching normal component.

The implementation MAY use small numerical separation corrections to prevent repeated zero-time collisions, but such corrections SHALL NOT cause material displacement, extra scoring, or a change in the specified physical outcome.

### 13.4 Corner Collision Interpretation

For a circle contacting a rectangle corner, the collision normal SHALL point from the corner toward the ball center at contact.

A valid corner contact SHALL be resolved using the vector reflection equation in Section 7.4, except for the paddle-specific rule.

The collision detector SHALL distinguish true rounded-corner contact from contact with the square corner of an expanded rectangle.

For a numerically degenerate contact where a unique normal cannot be determined, the implementation SHALL select a deterministic normal consistent with the approaching geometry, preferring the horizontal axis when horizontal and vertical penetration or approach measures are exactly tied.

### 13.5 Simultaneous Reflection Resolution

All earliest contacts within `1e-9` seconds SHALL be collected before applying event effects.

Brick destruction and scoring SHALL be applied to all qualifying active bricks in the simultaneous event set.

For reflection resolution:

1. Determine the contact normals of all approaching contacts.
2. Apply the paddle-specific rule if a valid descending paddle contact is present.
3. Otherwise, reverse vx once if the event set contains a qualifying horizontal-axis normal.
4. Reverse vy once if the event set contains a qualifying vertical-axis normal.
5. If non-axis-aligned normals remain, apply their vector reflections in the specified deterministic tie order.

A component SHALL not be reversed multiple times merely because multiple simultaneous axis-aligned contacts require the same reversal.

For combined events involving a wall and brick, wall contact SHALL be processed before paddle contact, followed by brick contacts in row-major order.

A simultaneous event set SHALL be processed as one logical event, not as independent sequential advances in time.

### 13.6 Brick Destruction and Win Priority

Brick deactivation and score increments SHALL be applied before checking whether all bricks have been cleared.

If the last active brick is destroyed, status SHALL become `"won"` immediately and remaining simulation time SHALL be discarded.

If a win event and a bottom-exit event are numerically simultaneous, the completed brick-clear event SHALL take precedence, and no life SHALL be deducted.

### 13.7 Bottom Exit Timing

The bottom boundary SHALL not produce a bounce or velocity reflection.

For a ball moving downward, the exit event SHALL be evaluated when its upper edge crosses below y = 500.

Because the condition is strict, exact equality at y = 508 for radius 8 SHALL not count as life loss.

If a positive-time update begins with `ball.y - ball.radius > 500`, the life-loss rule SHALL be processed immediately.

If a positive-time update begins at exact equality with positive downward velocity, any subsequent positive downward movement SHALL trigger the exit event.

The life-loss position SHALL be the first representable simulated position satisfying the strict threshold, subject to normal floating-point precision. Implementations SHALL NOT intentionally advance the ball by an additional full frame after the threshold has been crossed.

For a loss event at zero lives, the exit position SHALL be preserved. The ball SHALL not be moved further after the loss transition.

### 13.8 Multiple Collisions Within One Update

The solver SHALL process as many chronological collision events as required by the supplied `dt`, unless a terminal transition or life-loss event terminates the update.

An arbitrary low collision-count cap that allows tunneling SHALL NOT be used.

An implementation MAY use numerical safeguards against nonprogressing zero-time collision loops, provided these safeguards preserve deterministic outcomes and do not skip valid contacts.

### 13.9 Status and Pause Interpretation

The status field SHALL be the authoritative source of gameplay state.

Pause toggling SHALL be interpreted as a one-update event, not as a held input state.

If `togglePause` is true while playing or paused, the status SHALL toggle exactly once for that call.

If the status is won or lost, `togglePause` SHALL have no effect.

The pure-logic API SHALL not implement restart through an input flag; restart SHALL use `resetGame()`.

### 13.10 Initial Ball and Paddle Relationship

The ball begins at `(400,440)` and the paddle begins at y = 460.

The initial ball is moving upward, away from the paddle.

No initial collision SHALL be generated between the ball and paddle.

After losing a life, the ball SHALL be restored to the same initial position and velocity regardless of the paddle's current x position.

### 13.11 Input Interpretation

Only the explicitly specified optional boolean input fields are required.

For horizontal input:

| left  | right | Result             |
| ----- | ----- | ------------------ |
| false | false | No paddle movement |
| true  | false | Move left          |
| false | true  | Move right         |
| true  | true  | No paddle movement |

Unrecognized input properties MAY be ignored.

The pure-logic function SHALL not inspect physical keyboard events; those SHALL be translated into the specified input object by `game.js`.

### 13.12 Rendering and Animation Interpretation

Rendering MAY use any consistent colors and simple graphical styles.

The visual design SHALL not alter logical collision geometry.

The Canvas SHALL maintain an 800×500 logical coordinate system even if CSS scales its displayed size.

The browser integration MAY render status and score text inside the Canvas. No additional HTML UI elements are required.

Browser animation scheduling MAY use `requestAnimationFrame`, but actual gameplay motion SHALL depend on the supplied time step rather than frame count.

### 13.13 Serialization and Object Identity

State values SHALL be JSON-serializable.

A fresh state SHALL not share mutable required nested objects with an input or previous returned state.

Deep equality of state values SHALL be distinguished from reference identity.

An implementation MAY use local helper objects or internal immutable constants, but returned mutable state records SHALL be independently allocated.

### 13.14 Undefined or Invalid Caller Behavior

Only the required `dt` validation behavior is standardized.

Malformed state objects, missing required state fields, invalid status strings, or nonboolean input fields are outside the mandatory test contract.

Implementations MAY reject malformed caller data, provided valid inputs remain fully compliant.

### 13.15 Prohibited Behavioral Extensions

Implementations SHALL NOT introduce:

- Random ball movement.
- Ball acceleration.
- Paddle-induced directional steering.
- Extra lives.
- Variable brick scores.
- Additional brick rows or columns.
- Power-ups.
- Automatic level transitions.
- Automatic restart after winning or losing.
- Bottom-wall reflection.
- Physics behavior dependent on browser frame rate.

Any such behavior SHALL be considered a deviation from this SRS.

### 13.16 Interpretation Disputes

If an ambiguity remains after applying this section, the experimenter SHALL document:

- The ambiguous requirement.
- The possible interpretations.
- The interpretation selected.
- The reason for selection.
- Any effect on verification or comparison.

A clarification that changes observable behavior SHALL be applied equally to both assignments and recorded as a versioned SRS amendment before comparative testing.

Neither AI implementation SHALL independently redefine a mandatory requirement.

## 14. Requirements Traceability and Completion Criteria

### 14.1 Functional Traceability Matrix

| Functional requirement                       | Primary verification              |
| -------------------------------------------- | --------------------------------- |
| BRICK-FR-01 — Initialization                 | T01, T02, B02                     |
| BRICK-FR-02 — Paddle movement                | T03, T04, T05, T25, B03–B05       |
| BRICK-FR-03 — Ball movement                  | T06, T26, B07                     |
| BRICK-FR-04 — Wall collisions                | T07–T09, T28, B07                 |
| BRICK-FR-05 — Paddle collisions              | T10, T11, B07                     |
| BRICK-FR-06 — Brick collisions and scoring   | T12, T13, T14, T17, T28, B07, B09 |
| BRICK-FR-07 — Continuous collision detection | T07–T14, T28                      |
| BRICK-FR-08 — Life loss                      | T15, T16, T27, B08                |
| BRICK-FR-09 — Win and loss                   | T16, T17, T20, B08, B09           |
| BRICK-FR-10 — Pause and resume               | T18–T20, B06                      |
| BRICK-FR-11 — Keyboard and restart           | T21, B03–B06, B10                 |
| BRICK-FR-12 — Rendering                      | B01, B02, B07–B10                 |

### 14.2 Completion Criteria

An implementation SHALL be considered fully conformant to SRS version 1.0 only when:

- All four required files exist, with no additional implementation deliverables.
- All three required named API functions are exported.
- The public initial state matches the specification.
- All 12 functional requirements are satisfied.
- All 12 nonfunctional requirements are satisfied.
- All 28 pure-logic tests pass.
- All 10 browser acceptance checks pass.
- No prohibited runtime dependencies are present.
- No known unresolved deviation from a mandatory requirement remains.

An implementation that is incomplete or partially conformant MAY still be submitted for experimental analysis, but its failures and omissions SHALL be recorded.

### 14.3 Baseline Status

SRS version 1.0 — specification prepared

Not tested

This document defines the intended behavior and verification criteria for the Brick Breaker experiment. It does not constitute evidence that either Assignment 4 or Assignment 5 has been implemented, executed, tested, or validated.

End of document — Brick_Breaker_SRS_v1.0.md