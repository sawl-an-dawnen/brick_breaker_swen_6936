/** Deterministic Brick Breaker game rules. No browser APIs are used here. */

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 500;
const SIMULTANEOUS_TIME_EPSILON = 1e-9;
// Used only for round-off around geometric boundaries, never for the strict exit test.
const GEOMETRY_EPSILON = 1e-9;

/** Return a complete, independently allocated game state. */
export function createInitialState() {
  const bricks = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      bricks.push({
        id: `r${row}c${column}`,
        x: 45 + 90 * column,
        y: 60 + 30 * row,
        width: 80,
        height: 20,
        active: true,
      });
    }
  }

  return {
    status: 'playing',
    paddle: { x: 350, y: 460, width: 100, height: 12, speed: 400 },
    ball: { x: 400, y: 440, radius: 8, vx: 160, vy: -200 },
    bricks,
    score: 0,
    lives: 3,
  };
}

/** Reset is independent of any existing state. */
export function resetGame() {
  return createInitialState();
}

function independentState(state) {
  return {
    ...state,
    paddle: { ...state.paddle },
    ball: { ...state.ball },
    bricks: state.bricks.map((brick) => ({ ...brick })),
  };
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function isApproaching(vx, vy, nx, ny) {
  return vx * nx + vy * ny < 0;
}

function appendWallEvents(events, ball, maximumTime) {
  const walls = [
    { position: ball.radius, coordinate: ball.x, velocity: ball.vx, nx: 1, ny: 0 },
    { position: FIELD_WIDTH - ball.radius, coordinate: ball.x, velocity: ball.vx, nx: -1, ny: 0 },
    { position: ball.radius, coordinate: ball.y, velocity: ball.vy, nx: 0, ny: 1 },
  ];

  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    if (!isApproaching(ball.vx, ball.vy, wall.nx, wall.ny)) continue;
    const rawTime = (wall.position - wall.coordinate) / wall.velocity;
    if (rawTime < -GEOMETRY_EPSILON || rawTime > maximumTime) continue;
    events.push({
      time: Math.max(0, rawTime),
      kind: 'wall',
      order: index,
      nx: wall.nx,
      ny: wall.ny,
    });
  }
}

/**
 * Produce true swept circle/axis-aligned-rectangle face and rounded-corner
 * contacts. Expanded AABB square corners are not used as collision geometry.
 */
function appendRectangleEvents(events, ball, rectangle, maximumTime, kind, order) {
  const minX = rectangle.x;
  const maxX = rectangle.x + rectangle.width;
  const minY = rectangle.y;
  const maxY = rectangle.y + rectangle.height;
  const { x, y, vx, vy, radius } = ball;

  function addFace(time, nx, ny, centerOther, otherLow, otherHigh) {
    if (time < -GEOMETRY_EPSILON || time > maximumTime) return;
    if (centerOther < otherLow - GEOMETRY_EPSILON ||
        centerOther > otherHigh + GEOMETRY_EPSILON) return;
    if (!isApproaching(vx, vy, nx, ny)) return;
    events.push({ time: Math.max(0, time), kind, order, nx, ny });
  }

  if (vx > 0) {
    const time = (minX - radius - x) / vx;
    addFace(time, -1, 0, y + vy * time, minY, maxY);
  } else if (vx < 0) {
    const time = (maxX + radius - x) / vx;
    addFace(time, 1, 0, y + vy * time, minY, maxY);
  }

  if (vy > 0) {
    const time = (minY - radius - y) / vy;
    addFace(time, 0, -1, x + vx * time, minX, maxX);
  } else if (vy < 0) {
    const time = (maxY + radius - y) / vy;
    addFace(time, 0, 1, x + vx * time, minX, maxX);
  }

  const speedSquared = vx * vx + vy * vy;
  if (speedSquared === 0) return;

  const corners = [
    { x: minX, y: minY, sideX: -1, sideY: -1 },
    { x: maxX, y: minY, sideX: 1, sideY: -1 },
    { x: minX, y: maxY, sideX: -1, sideY: 1 },
    { x: maxX, y: maxY, sideX: 1, sideY: 1 },
  ];

  for (const corner of corners) {
    const dx = x - corner.x;
    const dy = y - corner.y;
    const halfB = dx * vx + dy * vy;
    const c = dx * dx + dy * dy - radius * radius;
    const discriminant = halfB * halfB - speedSquared * c;
    if (discriminant < 0) continue;

    const root = Math.sqrt(discriminant);
    const times = [(-halfB - root) / speedSquared, (-halfB + root) / speedSquared];

    // The first qualifying, approaching root is the relevant contact.
    for (const time of times) {
      if (time < -GEOMETRY_EPSILON || time > maximumTime) continue;
      const impactX = x + vx * time;
      const impactY = y + vy * time;
      if ((impactX - corner.x) * corner.sideX < -GEOMETRY_EPSILON ||
          (impactY - corner.y) * corner.sideY < -GEOMETRY_EPSILON) continue;

      const distance = Math.hypot(impactX - corner.x, impactY - corner.y);
      if (distance === 0) continue;
      const nx = (impactX - corner.x) / distance;
      const ny = (impactY - corner.y) / distance;
      if (!isApproaching(vx, vy, nx, ny)) continue;
      events.push({ time: Math.max(0, time), kind, order, nx, ny });
      break;
    }
  }
}

function earliestContacts(ball, paddle, bricks, remaining) {
  const candidates = [];
  appendWallEvents(candidates, ball, remaining);
  // The descending-paddle-specific rule is applied when resolving the event.
  if (ball.vy > 0) {
    appendRectangleEvents(candidates, ball, paddle, remaining, 'paddle', 0);
  }
  for (let index = 0; index < bricks.length; index += 1) {
    if (bricks[index].active) {
      appendRectangleEvents(candidates, ball, bricks[index], remaining, 'brick', index);
    }
  }

  // Bottom exit is strict and is never a reflective collision.
  if (ball.y - ball.radius > FIELD_HEIGHT) {
    candidates.push({ time: 0, kind: 'exit', order: 0 });
  } else if (ball.vy > 0) {
    const timeToEquality = (FIELD_HEIGHT + ball.radius - ball.y) / ball.vy;
    if (timeToEquality >= 0 && timeToEquality < remaining) {
      candidates.push({ time: timeToEquality, kind: 'exit', order: 0 });
    }
  }

  if (candidates.length === 0) return null;
  let earliest = Infinity;
  for (const event of candidates) earliest = Math.min(earliest, event.time);
  const simultaneous = candidates.filter(
    (event) => Math.abs(event.time - earliest) <= SIMULTANEOUS_TIME_EPSILON,
  );
  const category = { wall: 0, paddle: 1, brick: 2, exit: 3 };
  simultaneous.sort((a, b) => category[a.kind] - category[b.kind] || a.order - b.order);
  return { time: earliest, events: simultaneous };
}

// Find the next representable number strictly greater than the given finite y.
// This is used only for the bottom-exit position, not to widen its threshold.
function nextRepresentableUp(value) {
  if (value === 0) return Number.MIN_VALUE;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  view.setBigUint64(0, value > 0 ? bits + 1n : bits - 1n, false);
  return view.getFloat64(0, false);
}

function resolveContacts(state, events) {
  const ball = state.ball;
  let hasPaddle = false;
  let hasHorizontal = false;
  let hasVertical = false;
  const nonAxis = [];
  const bricksHit = new Set();

  for (const event of events) {
    if (event.kind === 'exit') continue;
    if (event.kind === 'paddle') hasPaddle = true;
    if (event.kind === 'brick') bricksHit.add(event.order);

    if (Math.abs(event.ny) <= GEOMETRY_EPSILON) {
      hasHorizontal = true;
    } else if (Math.abs(event.nx) <= GEOMETRY_EPSILON) {
      hasVertical = true;
    } else {
      nonAxis.push(event);
    }
  }

  for (const index of bricksHit) {
    if (!state.bricks[index].active) continue;
    state.bricks[index].active = false;
    state.score += 10;
  }

  if (hasPaddle && ball.vy > 0) {
    ball.vy = -ball.vy;
  } else {
    if (hasHorizontal) ball.vx = -ball.vx;
    if (hasVertical) ball.vy = -ball.vy;
    for (const event of nonAxis) {
      const projection = ball.vx * event.nx + ball.vy * event.ny;
      ball.vx -= 2 * projection * event.nx;
      ball.vy -= 2 * projection * event.ny;
    }
  }
}

function loseLife(state) {
  state.lives -= 1;
  if (state.lives === 0) {
    state.status = 'lost';
  } else {
    state.ball.x = 400;
    state.ball.y = 440;
    state.ball.vx = 160;
    state.ball.vy = -200;
  }
}

/**
 * Immutable, deterministic state transition.
 * @param {object} state Valid public game state.
 * @param {object} [input] Optional boolean controls.
 * @param {number} dt Required elapsed time in seconds, from 0 to 0.1.
 */
export function updateGame(state, input = {}, dt) {
  if (typeof dt !== 'number' || !Number.isFinite(dt) || dt < 0 || dt > 0.1) {
    throw new RangeError('dt must be a finite number in [0, 0.1] seconds');
  }

  const next = independentState(state);
  if (next.status === 'won' || next.status === 'lost') return next;

  if (input.togglePause) {
    next.status = next.status === 'playing' ? 'paused' : 'playing';
    return next;
  }
  if (next.status === 'paused' || dt === 0) return next;

  const left = input.left === true;
  const right = input.right === true;
  const direction = left === right ? 0 : left ? -1 : 1;
  next.paddle.x = clamp(next.paddle.x + direction * next.paddle.speed * dt, 0, 700);

  let remaining = dt;
  while (remaining > 0 && next.status === 'playing') {
    const result = earliestContacts(next.ball, next.paddle, next.bricks, remaining);
    if (!result) {
      next.ball.x += next.ball.vx * remaining;
      next.ball.y += next.ball.vy * remaining;
      break;
    }

    const advance = result.time;
    next.ball.x += next.ball.vx * advance;
    next.ball.y += next.ball.vy * advance;
    remaining = Math.max(0, remaining - advance);

    const collisionEvents = result.events.filter((event) => event.kind !== 'exit');
    if (collisionEvents.length > 0) {
      resolveContacts(next, collisionEvents);
      if (next.bricks.every((brick) => !brick.active)) {
        next.status = 'won';
        break;
      }
    }

    if (result.events.some((event) => event.kind === 'exit')) {
      // Brick-clear victory, checked above, takes priority at a simultaneous exit.
      if (next.ball.y - next.ball.radius <= FIELD_HEIGHT) {
        next.ball.y = nextRepresentableUp(FIELD_HEIGHT + next.ball.radius);
      }
      loseLife(next);
      break;
    }

    // If an impact consumes no time, the reflected ball should now be separating;
    // only further valid approaching contacts can be processed at zero time.
  }

  return next;
}
