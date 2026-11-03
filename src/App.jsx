import { useCallback, useEffect, useMemo, useState } from "react";
import GamePanel from "./components/GamePanel";
import Hud from "./components/Hud";
import ProjectPanel from "./components/ProjectPanel";
import Scene from "./components/scene/Scene";
import projects from "./data/projects";
import { createSnakeGame } from "./game/snake";

const GAME_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const TOAST_SECONDS = 4;

function App() {
  const [selectedId, setSelectedId] = useState(null);
  // The id of the cassette that has finished sliding into BMO.
  const [loadedId, setLoadedId] = useState(null);
  const [toast, setToast] = useState(null);

  const game = useMemo(() => createSnakeGame(), []);
  const select = useCallback((id) => {
    setSelectedId(id);
    setLoadedId(null);
  }, []);

  const foundSnail = useCallback(
    () =>
      setToast("You found the snail! It hides somewhere new on every visit."),
    [],
  );

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [selectedId],
  );
  const loaded = selectedId !== null && loadedId === selectedId;
  const playing = loaded && selected?.kind === "game";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  // The game starts fresh every time its cassette goes in, and listens to the keyboard.
  useEffect(() => {
    if (!playing) return;
    game.reset();
    const onKey = (e) => {
      const direction = GAME_KEYS[e.key] ?? GAME_KEYS[e.key.toLowerCase()];
      if (!direction) return;
      e.preventDefault();
      game.turn(direction);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, game]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_SECONDS * 1000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <Scene
        projects={projects}
        selectedId={selectedId}
        loaded={loaded}
        game={game}
        onSelect={select}
        onLoaded={setLoadedId}
        onSnailFound={foundSnail}
      />
      <Hud focused={selectedId !== null} toast={toast} />
      {loaded &&
        (playing ? (
          <GamePanel
            project={selected}
            game={game}
            onEject={() => select(null)}
          />
        ) : (
          <ProjectPanel project={selected} onEject={() => select(null)} />
        ))}

      {/* Keyboard / screen reader access to the cassettes. */}
      <nav
        aria-label="Projects"
        className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:bottom-24 focus-within:left-5"
      >
        <ul className="sticker flex flex-wrap gap-2 p-2">
          {projects.map((p) => (
            <li key={p.id}>
              <button className="btn bg-at-yellow" onClick={() => select(p.id)}>
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

export default App;
