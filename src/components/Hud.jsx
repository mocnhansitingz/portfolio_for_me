import { useProgress } from "@react-three/drei";
import GithubSvg from "./SVG/GithubSvg";

const GITHUB_URL = "https://github.com/mocnhansitingz";
const OWNER_NAME = "Kim Hung";

// Links shown in the top right corner. Add your own: { label, href, Icon }.
const SOCIALS = [{ label: "GitHub", href: GITHUB_URL, Icon: GithubSvg }];

// `toast` is a short notice to show under the header.
function Hud({ focused, toast }) {
  const { active } = useProgress();
  const year = new Date().getFullYear();

  return (
    <div className="vignette pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
      <header className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto sticker flex items-center gap-3 px-3 py-2">
          <img
            src="/favicon.png"
            alt="BMO Portfolio logo"
            className="h-10 w-10 rounded-xl border-2 border-ink object-cover bg-white"
          />
          <div className="leading-none">
            <div className="font-display text-xl text-ink">BMO</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">
              Portfolio
            </div>
          </div>
        </div>

        <ul className="pointer-events-auto flex gap-2">
          {SOCIALS.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="sticker block p-2 text-ink transition-transform hover:-translate-y-0.5"
              >
                <Icon />
              </a>
            </li>
          ))}
        </ul>
      </header>

      {toast && (
        <p
          role="status"
          className="panel-pop sticker absolute left-1/2 top-24 w-max max-w-[90vw] -translate-x-1/2 px-4 py-2 text-center font-semibold text-ink"
        >
          {toast}
        </p>
      )}

      <footer className="flex flex-col items-center gap-2 text-center">
        {!focused && (
          <p className="sticker px-4 py-2 font-semibold text-ink">
            {active ? "Waking BMO up..." : "Pick a cassette to play a project"}
          </p>
        )}
        <p className="text-xs text-ink/60">&#169; {year} {OWNER_NAME}.</p>
      </footer>
    </div>
  );
}

export default Hud;
