// A small snake game that runs on BMO's screen.
// It only knows about a 2D canvas; the scene feeds it time, the UI feeds it input.

const COLS = 20;
const ROWS = 12;
const CELL = 38;
const BAR = 38; // score bar above the playfield

export const SNAKE_CANVAS = { width: COLS * CELL, height: ROWS * CELL + BAR };

const PIXEL_FONT = '"Press Start 2P", monospace';
const BG = "#C9F2DE";
const INK = "#1C3B33";
const FOOD = "#EB3D4B";

const START_INTERVAL = 0.17; // seconds per step
const MIN_INTERVAL = 0.075;
const SPEED_UP = 0.004; // per point

const BEST_KEY = "bmo-snake-best";

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(best) {
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Storage can be unavailable (private mode); the best score just won't persist.
  }
}

export function createSnakeGame() {
  const listeners = new Set();
  let snapshot = { phase: "ready", score: 0, best: readBest() };

  let snake = [];
  let direction = DIRECTIONS.right;
  let turns = []; // buffered inputs, so two quick presses both register
  let food = { x: 0, y: 0 };
  let clock = 0;
  let blink = 0;
  let dirty = true;

  const publish = (next) => {
    snapshot = { ...snapshot, ...next };
    dirty = true;
    listeners.forEach((listener) => listener());
  };

  const placeFood = () => {
    do {
      food = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  };

  const reset = () => {
    const y = Math.floor(ROWS / 2);
    snake = [4, 3, 2].map((x) => ({ x, y }));
    direction = DIRECTIONS.right;
    turns = [];
    clock = 0;
    placeFood();
    publish({ phase: "ready", score: 0 });
  };

  const start = () => {
    if (snapshot.phase === "over") reset();
    publish({ phase: "playing" });
  };

  const advance = () => {
    direction = turns.shift() ?? direction;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const crashed =
      head.x < 0 ||
      head.y < 0 ||
      head.x >= COLS ||
      head.y >= ROWS ||
      // The tail cell is about to move away, so stepping onto it is fine.
      snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y);

    if (crashed) {
      const best = Math.max(snapshot.best, snapshot.score);
      if (best !== snapshot.best) writeBest(best);
      publish({ phase: "over", best });
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      placeFood();
      publish({ score: snapshot.score + 1 });
    } else {
      snake.pop();
      dirty = true;
    }
  };

  reset();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    reset,

    // Steers the snake; any direction also starts (or restarts) the game.
    turn(name) {
      const next = DIRECTIONS[name];
      if (!next) return;
      if (snapshot.phase !== "playing") {
        start();
        // Never start by running straight back into the body.
        if (next.x !== -direction.x || next.y !== -direction.y) turns = [next];
        return;
      }
      const last = turns[turns.length - 1] ?? direction;
      const reversing = next.x === -last.x && next.y === -last.y;
      const same = next.x === last.x && next.y === last.y;
      if (!reversing && !same && turns.length < 3) turns.push(next);
    },

    // The "any other button" action: start or restart.
    press() {
      if (snapshot.phase !== "playing") start();
    },

    // Advances time. Returns true when the screen needs to be redrawn.
    update(dt) {
      const step = Math.min(dt, 0.1);
      if (snapshot.phase === "playing") {
        clock += step;
        const interval = Math.max(
          MIN_INTERVAL,
          START_INTERVAL - snapshot.score * SPEED_UP,
        );
        while (clock >= interval && snapshot.phase === "playing") {
          clock -= interval;
          advance();
        }
      } else {
        // Blink the prompt while waiting for input.
        const before = Math.floor(blink * 2);
        blink += step;
        if (Math.floor(blink * 2) !== before) dirty = true;
      }
      const redraw = dirty;
      dirty = false;
      return redraw;
    },

    draw(ctx) {
      const { width, height } = SNAKE_CANVAS;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      // Score bar
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, width, BAR);
      ctx.fillStyle = BG;
      ctx.textBaseline = "middle";
      ctx.font = `18px ${PIXEL_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${snapshot.score}`, 16, BAR / 2 + 2);
      ctx.textAlign = "right";
      ctx.fillText(`BEST ${snapshot.best}`, width - 16, BAR / 2 + 2);

      ctx.save();
      ctx.translate(0, BAR);

      // Food
      ctx.fillStyle = FOOD;
      ctx.beginPath();
      ctx.arc(
        food.x * CELL + CELL / 2,
        food.y * CELL + CELL / 2,
        CELL * 0.34,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Snake
      ctx.fillStyle = INK;
      snake.forEach((s, i) => {
        const pad = i === 0 ? 2 : 4;
        ctx.beginPath();
        ctx.roundRect(
          s.x * CELL + pad,
          s.y * CELL + pad,
          CELL - pad * 2,
          CELL - pad * 2,
          8,
        );
        ctx.fill();
      });

      // Eyes on the head, looking where it is going
      const head = snake[0];
      const cx = head.x * CELL + CELL / 2 + direction.x * 6;
      const cy = head.y * CELL + CELL / 2 + direction.y * 6;
      ctx.fillStyle = BG;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
          cx + side * direction.y * 8,
          cy + side * direction.x * 8,
          4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();

      // Prompts
      if (snapshot.phase !== "playing") {
        const playHeight = height - BAR;
        ctx.fillStyle = "rgba(201, 242, 222, 0.82)";
        ctx.fillRect(0, BAR, width, playHeight);
        ctx.fillStyle = INK;
        ctx.textAlign = "center";
        const middle = BAR + playHeight / 2;
        ctx.font = `44px ${PIXEL_FONT}`;
        ctx.fillText(
          snapshot.phase === "over" ? "GAME OVER" : "SNAKE",
          width / 2,
          middle - 50,
        );
        if (Math.floor(blink * 2) % 2 === 0) {
          ctx.font = `18px ${PIXEL_FONT}`;
          ctx.fillText(
            snapshot.phase === "over" ? "PRESS TO RETRY" : "PRESS AN ARROW",
            width / 2,
            middle + 30,
          );
        }
      }

      // Faint scanlines, like the project screen
      ctx.fillStyle = "rgba(28, 59, 51, 0.07)";
      for (let y = 0; y < height; y += 6) ctx.fillRect(0, y, width, 2);
    },
  };
}
