function ProjectPanel({ project, onEject, onPlay, onSource }) {
  const {
    title,
    tagline,
    description,
    summary = [],
    tags = [],
    color,
    sourceLabel,
    sourceUrl,
  } = project;

  const hasSource = project?.id === "projects-experience" && Boolean(sourceUrl || onSource);

  return (
    <aside
      aria-live="polite"
      className="panel-in sticker absolute inset-x-3 bottom-3 max-h-[52dvh] overflow-y-auto landscape:inset-x-auto landscape:bottom-auto landscape:right-[5vw] landscape:top-1/2 landscape:max-h-[80dvh] landscape:w-[min(28rem,42vw)]"
    >
      <div className="h-3" style={{ backgroundColor: color }} />
      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-display text-3xl leading-none text-ink">
            {title}
          </h3>
          {tagline && (
            <p className="mt-1 font-semibold text-ink/70">{tagline}</p>
          )}
        </div>

        <p className="text-ink/90">{description}</p>

        {summary.length > 0 && (
          <div className="space-y-2">
            {summary.map((item) => (
              <div
                key={`${title}-summary-${item}`}
                className="rounded-lg border-2 border-ink bg-[#fffaf0] px-3 py-2 text-sm font-semibold text-ink"
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold text-ink"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-stretch gap-2 pt-1">
          <div className="flex flex-1 gap-2">
            <button onClick={onPlay} className="btn bg-at-green">
              Play
            </button>
            {hasSource && (
              <button
                onClick={() => {
                  if (onSource) onSource();
                  else if (sourceUrl) window.open(sourceUrl, "_blank", "noopener,noreferrer");
                }}
                className="btn bg-at-blue"
              >
                {sourceLabel ?? "Source"}
              </button>
            )}
          </div>
          <button onClick={onEject} className="btn bg-at-red">
            Close
          </button>
        </div>
      </div>
    </aside>
  );
}

export default ProjectPanel;
