import { useSyncExternalStore } from "react";

// On-screen d-pad: [direction, arrow, grid cell].
const PAD = [
  ["up", "▲", "col-start-2 row-start-1"],
  ["left", "◀", "col-start-1 row-start-2"],
  ["right", "▶", "col-start-3 row-start-2"],
  ["down", "▼", "col-start-2 row-start-3"],
];

// Side panel shown while the game cassette is in BMO: score, controls and an on-screen pad.
function GamePanel({ project, game, onEject }) {
  const { phase, score, best } = useSyncExternalStore(
    game.subscribe,
    game.getSnapshot,
  );

  return (
    <aside className="panel-in sticker absolute inset-x-3 bottom-3 max-h-[48dvh] overflow-y-auto landscape:inset-x-auto landscape:bottom-auto landscape:right-[5vw] landscape:top-1/2 landscape:max-h-[80dvh] landscape:w-[min(26rem,40vw)]">
      <div className="h-3" style={{ backgroundColor: project.color }} />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl leading-none text-ink">
              {project.title}
            </h3>
            <p className="mt-1 font-semibold text-ink/70">{project.tagline}</p>
          </div>
          <dl
            className="grid shrink-0 grid-cols-2 gap-x-3 text-center font-bold text-ink"
            aria-live="polite"
          >
            <dt className="text-xs uppercase text-ink/60">Score</dt>
            <dt className="text-xs uppercase text-ink/60">Best</dt>
            <dd className="text-2xl leading-none">{score}</dd>
            <dd className="text-2xl leading-none">{best}</dd>
          </dl>
        </div>

        <p className="portrait:hidden text-ink/90">{project.description}</p>

        <div className="flex items-end justify-between gap-4">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            {PAD.map(([direction, arrow, cell]) => (
              <button
                key={direction}
                aria-label={`Move ${direction}`}
                className={`btn h-11 w-11 touch-none bg-at-yellow px-0 py-0 ${cell}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  game.turn(direction);
                }}
                // Keyboard activation; pointer presses are already handled above.
                onClick={(e) => e.detail === 0 && game.turn(direction)}
              >
                {arrow}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-right text-sm font-semibold text-ink/70">
              {phase === "over"
                ? "Game over! Press an arrow to retry."
                : phase === "ready"
                  ? "Press an arrow to start."
                  : "Go go go!"}
            </p>
            <button onClick={onEject} className="btn bg-at-red">
              Eject
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default GamePanel;
