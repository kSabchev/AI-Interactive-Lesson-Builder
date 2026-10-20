/**
 * An animal cell (left) and a plant cell (right) as seen under a microscope (800×500). Both have a nucleus,
 * cytoplasm and a membrane; the plant cell also has a thick wall, a large vacuole and green chloroplasts.
 */
export function CellsArt() {
  const chloroplasts: [number, number, number][] = [
    [505, 380, 20],
    [520, 140, 0],
    [700, 130, -25],
    [720, 380, 30],
    [500, 260, 80],
    [610, 410, -10],
  ];
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#f4f1fa" />

      {/* Animal cell: irregular round shape */}
      <path
        d="M200 108 C 280 104, 352 160, 356 240 C 360 330, 300 404, 210 410 C 120 414, 50 350, 46 266 C 42 180, 110 112, 200 108 Z"
        fill="#fde7d6"
        stroke="#d88c5a"
        strokeWidth="5"
      />
      {/* Small parts floating in the cytoplasm */}
      {[
        [120, 190],
        [285, 200],
        [130, 340],
        [300, 300],
        [220, 370],
        [100, 260],
      ].map(([x, y]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx="12"
          ry="7"
          fill="#f2b98f"
          transform={`rotate(${x % 60} ${x} ${y})`}
        />
      ))}
      <circle cx="200" cy="250" r="44" fill="#a98ad6" stroke="#7a5bb0" strokeWidth="4" />
      <circle cx="212" cy="240" r="12" fill="#7a5bb0" />

      {/* Plant cell: thick wall, then the membrane pressed against it */}
      <rect x="452" y="96" width="320" height="336" rx="14" fill="#cfe6a8" stroke="#6f9a2e" strokeWidth="14" />
      <rect x="466" y="110" width="292" height="308" rx="8" fill="#eaf6d6" stroke="#9cc25c" strokeWidth="3" />
      {/* Large vacuole filling the middle */}
      <path
        d="M560 150 C 640 140, 712 160, 716 220 C 722 300, 690 350, 620 352 C 560 354, 540 320, 542 260 C 544 200, 520 156, 560 150 Z"
        fill="#cbe8f6"
        stroke="#6bb0d4"
        strokeWidth="4"
      />
      {/* Chloroplasts */}
      {chloroplasts.map(([x, y, a]) => (
        <g key={`${x}-${y}`} transform={`rotate(${a} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="22" ry="12" fill="#3f9b3a" stroke="#2c6e28" strokeWidth="2" />
          <path
            d={`M${x - 12} ${y} L ${x + 12} ${y} M ${x - 8} ${y - 5} L ${x + 8} ${y - 5} M ${x - 8} ${y + 5} L ${x + 8} ${y + 5}`}
            stroke="#8fd16f"
            strokeWidth="2"
          />
        </g>
      ))}
      {/* Nucleus pushed to the side */}
      <circle cx="510" cy="200" r="26" fill="#a98ad6" stroke="#7a5bb0" strokeWidth="4" />
      <circle cx="516" cy="194" r="7" fill="#7a5bb0" />
    </svg>
  );
}
