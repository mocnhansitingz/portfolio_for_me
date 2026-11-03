function ProjectPanel({ project, onEject }) {
  const { title, tagline, description, tags = [], color, links = {} } = project;

  return (
    <aside
      aria-live="polite"
      className="panel-in sticker absolute inset-x-3 bottom-3 max-h-[48dvh] overflow-y-auto landscape:inset-x-auto landscape:bottom-auto landscape:right-[5vw] landscape:top-1/2 landscape:max-h-[80dvh] landscape:w-[min(26rem,40vw)]"
    >
      <div className="h-3" style={{ backgroundColor: color }} />
      <div className="space-y-3 p-5">
        <div>
          <h3 className="font-display text-3xl leading-none text-ink">
            {title}
          </h3>
          {tagline && (
            <p className="mt-1 font-semibold text-ink/70">{tagline}</p>
          )}
        </div>

        <p className="text-ink/90">{description}</p>

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

        <div className="flex flex-wrap gap-2 pt-1">
          {links.live && (
            <a href={links.live} target="_blank" className="btn bg-at-green">
              Play
            </a>
          )}
          {links.source && (
            <a href={links.source} target="_blank" className="btn bg-at-blue">
              Source
            </a>
          )}
          <button onClick={onEject} className="btn ml-auto bg-at-red">
            Eject
          </button>
        </div>
      </div>
    </aside>
  );
}

export default ProjectPanel;
