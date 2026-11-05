import { createInitialState, updateGame, resetGame } from './gameLogic.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let state = createInitialState();
let lastTimestamp = null;
let pendingPauseToggles = 0;
const heldKeys = new Set();

const controls = new Set(['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space', 'KeyR']);

window.addEventListener('keydown', (event) => {
  if (!controls.has(event.code)) return;
  event.preventDefault();
  if (event.code === 'Space') {
    if (!event.repeat && !heldKeys.has('Space')) pendingPauseToggles += 1;
  } else if (event.code === 'KeyR') {
    if (!event.repeat && !heldKeys.has('KeyR')) {
      state = resetGame();
      pendingPauseToggles = 0;
      lastTimestamp = null;
    }
  }
  heldKeys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  if (!controls.has(event.code)) return;
  event.preventDefault();
  heldKeys.delete(event.code);
});

window.addEventListener('blur', () => {
  heldKeys.clear();
  pendingPauseToggles = 0;
  lastTimestamp = null;
});

function currentInput() {
  return {
    left: heldKeys.has('ArrowLeft') || heldKeys.has('KeyA'),
    right: heldKeys.has('ArrowRight') || heldKeys.has('KeyD'),
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#17243a';
  ctx.fillRect(0, 0, 800, 500);

  const colors = ['#f97373', '#fbbf24', '#34d399'];
  for (let index = 0; index < state.bricks.length; index += 1) {
    const brick = state.bricks[index];
    if (!brick.active) continue;
    ctx.fillStyle = colors[Math.floor(index / 8)];
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  }

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 18, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${state.lives}`, 782, 30);

  if (state.status !== 'playing') {
    const messages = { paused: 'PAUSED', won: 'YOU WON', lost: 'GAME OVER' };
    ctx.fillStyle = 'rgba(8, 15, 26, 0.72)';
    ctx.fillRect(0, 190, 800, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(messages[state.status], 400, 248);
  }
}

function animate(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const elapsed = Math.max(0, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;

  let toggled = false;
  while (pendingPauseToggles > 0) {
    state = updateGame(state, { togglePause: true }, 0);
    pendingPauseToggles -= 1;
    toggled = true;
  }

  // The frame containing a pause/resume control event does not advance gameplay.
  if (!toggled) {
    const input = currentInput();
    let remaining = elapsed;
    while (remaining > 0) {
      const step = Math.min(remaining, 0.1);
      state = updateGame(state, input, step);
      remaining -= step;
    }
  }

  draw();
  requestAnimationFrame(animate);
}

// Present an initial frame even if the first animation callback is delayed.
draw();
requestAnimationFrame(animate);
