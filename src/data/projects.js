// Placeholder projects. Each entry becomes one cassette on the table.
// Replace these with real projects; `color` tints the cassette label and BMO's screen.
// `links.live` and `links.source` are optional.
// An entry with `kind: "game"` is the golden cassette that runs a mini game on BMO instead.
const GITHUB_PROFILE = "https://github.com/mocnhansitingz";

const projects = [
  {
    id: "project-one",
    title: "Project One",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["Unity", "C#"],
    color: "#EB3D4B",
    links: {
      live: "https://example.com",
      source: GITHUB_PROFILE,
    },
  },
  {
    id: "project-two",
    title: "Project Two",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["React", "Tailwind"],
    color: "#F7D038",
    links: {
      live: "https://example.com",
      source: GITHUB_PROFILE,
    },
  },
  {
    id: "snake",
    kind: "game",
    title: "Snake",
    tagline: "A tiny game that runs on BMO",
    description:
      "Eat the apples and don't bite yourself. Steer with the arrow keys, WASD, the pad below or BMO's own D-pad.",
    tags: ["Mini game"],
    color: "#35CFBD",
  },
  {
    id: "project-three",
    title: "Project Three",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["Three.js", "Blender"],
    color: "#5CC8F0",
    links: { source: GITHUB_PROFILE },
  },
  {
    id: "project-four",
    title: "Project Four",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["Game Jam", "2D"],
    color: "#6BD44A",
    links: { live: "https://example.com" },
  },
  {
    id: "project-five",
    title: "Project Five",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["Node.js", "API"],
    color: "#F29BC1",
    links: { source: GITHUB_PROFILE },
  },
  {
    id: "project-six",
    title: "Project Six",
    tagline: "A short one-line pitch",
    description:
      "Describe what this project is, what problem it solves and what your role was. Two or three sentences is plenty.",
    tags: ["Shader", "VFX"],
    color: "#B48CF2",
    links: {
      live: "https://example.com",
      source: GITHUB_PROFILE,
    },
  },
];

export default projects;
