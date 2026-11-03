import { useCallback, useEffect, useMemo, useState } from "react";
import portrait from "./assets/portrait.png";
import GamePanel from "./components/GamePanel";
import Hud from "./components/Hud";
import ProjectPanel from "./components/ProjectPanel";
import Scene from "./components/scene/Scene";
import projects from "./data/projects";
import { createSnakeGame } from "./game/snake";
import {
  playUiSound,
  setSoundEnabled,
  startBackgroundMusic,
  stopBackgroundMusic,
  unlockAudio,
} from "./sound";

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

function DetailPage({ project, onBack }) {
  const sections = project?.detailSections ?? [];
  const details = project?.details ?? [];

  return (
    <div className="cv-detail-page">
      <div className="cv-shell">
        <div className="cv-page sticker">
          <header className="cv-header">
            <div>
              <p className="cv-kicker">CV Section</p>
              <h1>{project?.title ?? "Profile"}</h1>
            </div>
            <button className="btn btn-primary" onClick={onBack}>
              Back to BMO
            </button>
          </header>

          <div className="cv-layout">
            <aside className="cv-profile-card sticker">
              {project?.id === "personal-information" && (
                <div className="cv-portrait-frame">
                  <img src={portrait} alt="Portrait" className="cv-portrait" />
                </div>
              )}

              <div className="cv-mini-badge">Profile</div>
              <h2>{project?.title ?? "Profile"}</h2>
              <p className="cv-profile-tagline">{project?.tagline ?? "Career overview"}</p>

              <div className="cv-meta-list">
                {details.map((item) => (
                  <div key={`${project.id}-meta-${item.label}`} className="cv-meta-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </aside>

            <main className="cv-main">
              <section className="cv-hero sticker">
                <div>
                  <p className="cv-label">Overview</p>
                  <h2>{project?.tagline ?? "Career overview"}</h2>
                </div>
                <p>{project?.description ?? ""}</p>
              </section>

              {sections.map((section, index) => {
                if (section.type === "header") {
                  return (
                    <section key={`${project.id}-header-${index}`} className="sticker cv-box">
                      <p className="cv-label">{section.title}</p>
                      <p className="cv-large-text">{section.content}</p>
                    </section>
                  );
                }

                if (section.type === "cards") {
                  return (
                    <section key={`${project.id}-cards-${index}`} className="cv-box sticker">
                      <p className="cv-label">{section.title}</p>
                      <div className="cv-grid">
                        {section.items.map((item) => (
                          <article key={`${project.id}-${section.title}-${item.label}`} className="cv-card">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === "list") {
                  return (
                    <section key={`${project.id}-list-${index}`} className="cv-box sticker">
                      <p className="cv-label">{section.title}</p>
                      <ul className="cv-list">
                        {section.items.map((item) => (
                          <li key={`${project.id}-${section.title}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  );
                }

                if (section.type === "group") {
                  return (
                    <section key={`${project.id}-group-${index}`} className="cv-box sticker">
                      <p className="cv-label">{section.title}</p>
                      <div className="tag-row">
                        {section.items.map((item) => (
                          <span key={`${project.id}-${section.title}-${item}`} className="tag-pill">{item}</span>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === "timeline") {
                  return (
                    <section key={`${project.id}-timeline-${index}`} className="cv-box sticker">
                      <p className="cv-label">{section.title}</p>
                      <div className="timeline-list">
                        {section.items.map((item) => (
                          <div key={`${project.id}-${section.title}-${item.label}`} className="timeline-item">
                            <span>{item.label}</span>
                            <p>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === "project") {
                  return (
                    <section key={`${project.id}-project-${index}`} className="cv-box sticker">
                      <p className="cv-label">{section.title}</p>
                      <ul className="cv-list compact">
                        {section.items.map((item) => (
                          <li key={`${project.id}-${section.title}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  );
                }

                return null;
              })}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [selectedId, setSelectedId] = useState(null);
  // The id of the cassette that has finished sliding into BMO.
  const [loadedId, setLoadedId] = useState(null);
  const [detailMode, setDetailMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const game = useMemo(() => createSnakeGame(), []);

  const getRouteSlug = useCallback(() => {
    const hashSlug = window.location.hash.replace(/^#\/?/, "").trim();
    if (hashSlug) return hashSlug;

    const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, "").trim();
    if (!pathSlug || pathSlug === "") return "";

    return projects.some((project) => project.id === pathSlug) ? pathSlug : "";
  }, []);

  const syncHash = useCallback((nextHash) => {
    const url = new URL(window.location.href);
    url.hash = nextHash ? `/${nextHash}` : "";
    window.history.pushState({}, "", url);
  }, []);

  const returnToBmo = useCallback(() => {
    playUiSound("back");
    setDetailMode(false);
    syncHash("");
  }, [syncHash]);

  const select = useCallback((id) => {
    playUiSound("select");
    setSelectedId(id);
    setLoadedId(null);
    setDetailMode(false);
    syncHash("");
  }, [syncHash]);

  const openDetail = useCallback((id) => {
    const project = projects.find((entry) => entry.id === id);
    if (!project) return;
    playUiSound("open");
    setSelectedId(project.id);
    setDetailMode(true);
    syncHash(project.id);
  }, [projects, syncHash]);

  const ejectCassette = useCallback(() => {
    playUiSound("close");
    setSelectedId(null);
    setLoadedId(null);
    setDetailMode(false);
    syncHash("");
  }, [syncHash]);

  const handleCassetteLoaded = useCallback((id) => {
    setLoadedId(id);
    playUiSound("cassette");
  }, []);

  const foundSnail = useCallback(() => {
    playUiSound("success");
    setToast("You found the snail! It hides somewhere new on every visit.");
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        unlockAudio();
        startBackgroundMusic();
      } else {
        stopBackgroundMusic();
      }
      return next;
    });
  }, []);

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [selectedId],
  );
  const loaded = selectedId !== null && loadedId === selectedId;
  const playing = loaded && selected?.kind === "game";

  useEffect(() => {
    const onUnlock = () => {
      unlockAudio();
      if (soundEnabled) startBackgroundMusic();
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (detailMode) {
        returnToBmo();
        return;
      }
      ejectCassette();
    };
    window.addEventListener("pointerdown", onUnlock, { passive: true });
    window.addEventListener("keydown", onUnlock, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onUnlock);
      window.removeEventListener("keydown", onUnlock);
      window.removeEventListener("keydown", onKey);
    };
  }, [detailMode, returnToBmo, ejectCassette]);

  useEffect(() => {
    const syncFromRoute = () => {
      const slug = getRouteSlug();
      if (!slug) {
        if (detailMode) {
          setDetailMode(false);
        }
        return;
      }

      const project = projects.find((entry) => entry.id === slug);
      if (!project) return;

      setSelectedId(project.id);
      setDetailMode(true);
    };

    syncFromRoute();
    window.addEventListener("hashchange", syncFromRoute);
    window.addEventListener("popstate", syncFromRoute);
    return () => {
      window.removeEventListener("hashchange", syncFromRoute);
      window.removeEventListener("popstate", syncFromRoute);
    };
  }, [detailMode, getRouteSlug, projects]);

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
        onLoaded={handleCassetteLoaded}
        onSnailFound={foundSnail}
      />

      {detailMode && selected ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="pointer-events-auto">
            <DetailPage project={selected} onBack={returnToBmo} />
          </div>
        </div>
      ) : null}

      <Hud
        focused={selectedId !== null}
        toast={toast}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
      {!detailMode && loaded &&
        (playing ? (
          <GamePanel
            project={selected}
            game={game}
            onEject={ejectCassette}
          />
        ) : (
          <ProjectPanel
            project={selected}
            onEject={ejectCassette}
            onPlay={() => openDetail(selected.id)}
            onSource={() => {
              if (selected?.sourceUrl) {
                window.open(selected.sourceUrl, "_blank", "noopener,noreferrer");
              }
            }}
          />
        ))}

      {/* Keyboard / screen reader access to the cassettes. */}
      {!detailMode && (
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
      )}
    </main>
  );
}

export default App;
