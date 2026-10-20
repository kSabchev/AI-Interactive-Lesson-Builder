/** Decorative solar system scene (800×500), not to scale. Interactive targets are layered on top. */
const SUN = { cx: -60, cy: 250 };

const PLANETS = [
  { name: "mercury", x: 150, r: 6, fill: "#b8b1a8" },
  { name: "venus", x: 190, r: 10, fill: "#e8c27a" },
  { name: "earth", x: 240, r: 11, fill: "#3b8fe0" },
  { name: "mars", x: 290, r: 8, fill: "#d2573a" },
  { name: "jupiter", x: 400, r: 42, fill: "#d9a877" },
  { name: "saturn", x: 545, r: 30, fill: "#e6cf8f" },
  { name: "uranus", x: 665, r: 20, fill: "#9fe0e6" },
  { name: "neptune", x: 745, r: 19, fill: "#4a6fe0" },
];

const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 137) % 800,
  y: (i * 89 + 31) % 500,
  r: i % 5 === 0 ? 1.8 : 1,
}));

// Dashed pointer from each labelled planet towards its target spot.
const POINTERS = [
  [240, 238, 262, 140],
  [290, 259, 326, 368],
  [400, 207, 438, 118],
  [545, 281, 558, 382],
];

export function SolarSystemArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="ss-sun">
          <stop offset="0.6" stopColor="#ffd34d" />
          <stop offset="1" stopColor="#ff9d2e" />
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="#14213d" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity="0.7" />
      ))}

      {PLANETS.map((p) => (
        <circle
          key={`orbit-${p.name}`}
          cx={SUN.cx}
          cy={SUN.cy}
          r={p.x - SUN.cx}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
      ))}

      <circle cx={SUN.cx} cy={SUN.cy} r="150" fill="url(#ss-sun)" />

      {POINTERS.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      ))}

      {PLANETS.map((p) => (
        <g key={p.name}>
          {p.name === "saturn" && (
            <ellipse
              cx={p.x}
              cy="250"
              rx="56"
              ry="13"
              fill="none"
              stroke="#c9b27a"
              strokeWidth="6"
              transform={`rotate(-15 ${p.x} 250)`}
            />
          )}
          <circle cx={p.x} cy="250" r={p.r} fill={p.fill} />
          {p.name === "earth" && (
            <>
              <path d="M233 245 q 5 -6 10 -2 q 2 6 -4 8 z M240 254 q 6 -2 8 3 q -4 4 -8 0 z" fill="#4caf50" />
              <circle cx="259" cy="233" r="3.5" fill="#d9d9d9" />
            </>
          )}
          {p.name === "jupiter" && (
            <>
              <path d="M360 236 h80 M358 252 h84 M362 268 h76" stroke="#b07a4f" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="415" cy="262" rx="9" ry="5" fill="#c0392b" />
            </>
          )}
          {p.name === "saturn" && (
            // Front half of the ring, drawn over the planet.
            <path
              d={`M${p.x - 56} 250 A 56 13 0 0 0 ${p.x + 56} 250`}
              fill="none"
              stroke="#c9b27a"
              strokeWidth="6"
              transform={`rotate(-15 ${p.x} 250)`}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
