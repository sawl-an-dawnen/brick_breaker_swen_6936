# Brick Breaker — Independent Node.js Test Harness

This project is a **separate evaluator**, not either AI-generated game implementation. It uses only built-in Node modules (`node:test`, `node:assert/strict`, `child_process`, `fs`, `path`, `url`) and has no npm dependencies. The test file contains exactly the 28 top-level tests **BRICK-T01 through BRICK-T28** specified by `Brick_Breaker_SRS_v1.0.md`.

## Directory structure

```text
Brick_Breaker_Independent_Harness/
├── package.json
├── README.md
├── runner.mjs
├── browser-acceptance-checklist.md
├── tests/
│   └── brick.test.mjs
├── validation-only/
│   ├── validate.mjs
│   ├── reference/
│   │   ├── gameLogic.js
│   │   └── package.json
│   └── broken/
│       ├── gameLogic.js
│       └── package.json
└── results/
    └── (TAP reports appear here on execution)
```

**Confidentiality:** `validation-only/reference/` is a calibration fixture, not an Assignment 4 or 5 implementation. **Do not share either fixture or the independent test source with the development AI before its CP-02 baseline is saved.** The experimental harness, including all fixtures and `results/`, must remain outside the game implementation directories.

## Requirements

- Node.js **20 or later** (validated with Node.js 22.16.0 on the authoring system).
- Windows PowerShell (commands below), or any environment capable of running Node.js.
- No `npm install` is needed; nothing is fetched from the network.
- An implementation directory with `gameLogic.js` exporting `createInitialState`, `updateGame`, and `resetGame` and a `package.json` declaring `"type":"module"`.

## Exact Windows PowerShell setup commands

The following assumes the ZIP was extracted into `C:\BrickBreakerExperiment\Brick_Breaker_Independent_Harness`, and the two independently generated game projects are sibling directories. Change only these path values if needed.

```powershell
$Root = 'C:\BrickBreakerExperiment'
$Harness = Join-Path $Root 'Brick_Breaker_Independent_Harness'
$ChatGPT = Join-Path $Root 'Assignment_4_ChatGPT\implementation'
$Grok = Join-Path $Root 'Assignment_5_Grok_Cursor\implementation'
Set-Location $Harness
node --version
npm --version
```

If Node.js is not installed, install Node.js 20+ separately before executing the commands. The harness itself requires no install step.

### Self-calibrate reference and broken fixtures

```powershell
Set-Location $Harness
npm run validate
```

Expected calibration criteria: reference fixture reports `28` passing and `0` failing; deliberately broken fixture reports at least one failed test and exits nonzero. **`npm run validate` itself exits zero only if both expectations hold.** This does not validate an AI-generated implementation.

To run either fixture independently:

```powershell
node .\runner.mjs --impl .\validation-only\reference --label reference
node .\runner.mjs --impl .\validation-only\broken --label broken
```

The second command is **expected to exit nonzero**. To inspect and retain its status without stopping a script:

```powershell
node .\runner.mjs --impl .\validation-only\broken --label broken
$BrokenExitCode = $LASTEXITCODE
Write-Host "Broken fixture exit code: $BrokenExitCode"
```

### Evaluate Assignment 4 and Assignment 5

Complete each AI's CP-02 baseline and preserve the unmodified snapshot **before exposing independent test results**.

```powershell
Set-Location $Harness
node .\runner.mjs --impl $ChatGPT --label assignment4-baseline
$ChatGPTExitCode = $LASTEXITCODE
Write-Host "Assignment 4 exit code: $ChatGPTExitCode"

node .\runner.mjs --impl $Grok --label assignment5-baseline
$GrokExitCode = $LASTEXITCODE
Write-Host "Assignment 5 exit code: $GrokExitCode"
```

For retests, change only the label, not the test file:

```powershell
node .\runner.mjs --impl $ChatGPT --label assignment4-repair1
node .\runner.mjs --impl $Grok --label assignment5-repair1
```

The `--impl` argument accepts either an **implementation directory** or the absolute/relative path to its `gameLogic.js`. It resolves relative paths against the current working directory. `--label` is a safe report filename component (letters, numbers, underscore, hyphen, dot; maximum 80 characters).

Each invocation prints the complete Node TAP output, writes `results/<label>_<UTC timestamp>.tap`, and exits **0** only if all tests pass. Test failures result in a **nonzero exit code**. Missing files, bad command arguments, and import/runtime errors also produce nonzero outcomes. The emitted TAP file includes a header recording the implementation and label.

View reports:

```powershell
Get-ChildItem (Join-Path $Harness 'results') -Filter '*.tap' |
  Sort-Object LastWriteTime -Descending |
  Select-Object Name, LastWriteTime, Length

Get-Content (Get-ChildItem (Join-Path $Harness 'results') -Filter '*.tap' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1).FullName
```

### Validation with npm scripts

```powershell
Set-Location $Harness
npm test
npm run validate
npm run test:broken
```

`npm test` runs the calibration reference, `npm run validate` checks both fixtures, and `npm run test:broken` intentionally exits nonzero.

## Test design and assertions

- Uses native ESM dynamic import from a selected absolute path, **without editing the test file**.
- Uses public required state fields, while permitting additional private serializable fields.
- Asserts fresh object graphs, including nested paddle, ball, brick array, and individual bricks.
- Validates numeric values with absolute tolerance `1e-6` unless strict comparisons are specified.
- Validates exact statuses, brick IDs, scores, lives, and boolean activity.
- Synthesizes otherwise-valid states for collision and life-loss tests; unrelated bricks can be inactive.
- Confirms source states are not mutated even when deeply frozen.
- Enforces `dt` `RangeError` on negative, over-limit, nonnumeric, missing, and nonfinite values.
- Exercises corner and simultaneous contacts without modifying brick geometry.
- Requires pure logic to be testable in Node without a DOM.

The complete harness is **not** a substitute for static compliance checks or the 10 human browser checks. Use `browser-acceptance-checklist.md` separately.

## Recorded SRS interpretation issues

These issues were documented **before freezing this harness** and must be handled consistently for both assignments. The source SRS remains unchanged.

1. **BRICK-T09 arithmetic inconsistency:** The matrix says initial ball y=10, vy=-200, dt=0.05, top reflection at t=0.01, final y=14. By the SRS's simultaneous requirement to process all remaining time, the correct calculation is y=8 + 200×0.04 = **16**, not 14. This harness asserts **16**. This is an explicitly disclosed interpretation of a contradictory test expectation, **not an adjustment to accommodate any candidate implementation**. If the course evaluator instead elects to assert 14 literally, that would conflict with the remaining-time physics and must be treated as a pre-experiment, version-controlled test-policy choice, applied to both candidates.
2. **BRICK-T28 impossible wall/brick tie under fixed geometry:** The rightmost brick ends at x=755 and the right-wall ball-center plane is x=792; likewise top bricks begin at y=60 and the top-wall ball-center plane is y=8. A ball of radius 8 cannot contact a wall and one of these fixed bricks at precisely the same time. The matrix's suggested *wall/brick* simultaneous fixture therefore conflicts with fixed geometry. T28 tests **simultaneous top/left walls** (two axis reflections) and **two adjacent active bricks** (two same-time corner contacts, scored exactly once each); it does not move bricks into invalid positions.
3. **BRICK-T16 strict exit position:** At zero lives the ball must be preserved at its first strictly-outside position. This harness checks a position strictly greater than 508 and no more than 1e-6 above it for the specified continuous crossing; a full extra integration step is not allowed. It does not require bit-exact next-representable value.
4. **BRICK-T17 last-brick reflection:** The final brick contact still requires the collision response, followed immediately by frozen `won` status. The test checks the contact position and reflected vy without processing the rest of dt.
5. **BRICK-T28 combined oblique normals:** The SRS describes multiple non-axis-aligned reflections in deterministic tie order but does not establish a unique normal-aggregation model independent of numeric collision-time sorting. The harness asserts scoring, deactivation, determinism, and speed preservation without over-specifying final oblique velocity components.
6. **Synthetic test states:** The SRS explicitly authorizes altered positions/velocities/brick activity. These synthetic fixtures keep 24 brick objects and their required geometry even where activity and score do not represent a normal game history.

Potential ambiguity around zero-time collision loops and micro-separation is not resolved by adding new tolerances: the harness compares only the externally specified outcomes and uses `1e-6` for ordinary numeric results.

## Calibration versus product correctness

The standalone reference fixture is intended for verifying harness mechanics. Passing all 28 checks does not prove that fixture implements every possible corner case or all 12 nonfunctional requirements. The deliberately broken fixture serves as a negative control. Neither fixture is the game implementation to be submitted in Assignment 4 or Assignment 5.

**Experiment discipline:** preserve CP-02 source snapshots, never change frozen test assertions to benefit an implementation, keep original TAP reports, and record all human interventions separately from AI actions.
