/**
 * A flower cut in half to show its parts (800×500): petals, stamens with pollen-covered tips, the sticky stigma
 * on its stalk, the ovary at the base with tiny ovules inside, green sepals beneath, and a bee carrying pollen.
 */
export function FlowerPartsArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#effaf0" />

      {/* Stem */}
      <path
        d="M380 500 C 376 450, 384 410, 380 372"
        stroke="#3f8f3c"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="320" cy="450" rx="56" ry="18" fill="#4caf50" transform="rotate(-24 320 450)" />

      {/* Petals, cut away: one large on each side */}
      <path
        d="M372 334 C 320 330, 210 280, 180 200 C 164 150, 210 120, 250 150 C 300 190, 350 270, 372 334 Z"
        fill="#ff7aa8"
        stroke="#d9507f"
        strokeWidth="4"
      />
      <path
        d="M388 334 C 440 330, 550 280, 580 200 C 596 150, 550 120, 510 150 C 460 190, 410 270, 388 334 Z"
        fill="#ff8fb6"
        stroke="#d9507f"
        strokeWidth="4"
      />
      <path
        d="M250 170 C 280 210, 320 270, 360 320 M 510 170 C 480 210, 440 270, 400 320"
        stroke="#e36592"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Sepals under the petals */}
      <path
        d="M380 360 C 360 362, 330 360, 312 340 C 340 336, 366 340, 380 350 Z"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="3"
      />
      <path
        d="M380 360 C 400 362, 430 362, 452 344 C 422 336, 394 340, 380 350 Z"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="3"
      />

      {/* Ovary with ovules, the style and the stigma */}
      <path
        d="M380 352 C 346 350, 344 296, 366 286 L 394 286 C 416 296, 414 350, 380 352 Z"
        fill="#a5d66f"
        stroke="#5e9a2e"
        strokeWidth="4"
      />
      {[
        [372, 310],
        [388, 310],
        [372, 330],
        [388, 330],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#f3f7c8" stroke="#5e9a2e" strokeWidth="2" />
      ))}
      <path d="M380 288 L 380 182" stroke="#a5d66f" strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="380" cy="168" rx="20" ry="13" fill="#c6e86b" stroke="#5e9a2e" strokeWidth="3" />
      {[370, 380, 390].map((x) => (
        <circle key={x} cx={x} cy="160" r="2.5" fill="#f5e27a" />
      ))}

      {/* Stamens: thin stalks with pollen-covered tips */}
      <g stroke="#f0d070" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M368 300 C 340 260, 314 230, 300 200" />
        <path d="M392 300 C 420 260, 446 230, 460 200" />
      </g>
      <ellipse
        cx="296"
        cy="192"
        rx="12"
        ry="18"
        fill="#ffb300"
        stroke="#c88a00"
        strokeWidth="3"
        transform="rotate(-30 296 192)"
      />
      <ellipse
        cx="464"
        cy="192"
        rx="12"
        ry="18"
        fill="#ffb300"
        stroke="#c88a00"
        strokeWidth="3"
        transform="rotate(30 464 192)"
      />

      {/* Bee carrying pollen */}
      <g transform="translate(660 120)">
        <path d="M-60 40 C -30 50, 0 70, 30 70" stroke="#9aa5b1" strokeWidth="3" strokeDasharray="6 8" fill="none" />
        <ellipse
          cx="-6"
          cy="-26"
          rx="22"
          ry="14"
          fill="#e6f4ff"
          stroke="#9cc4e0"
          strokeWidth="2"
          opacity="0.9"
          transform="rotate(-20 -6 -26)"
        />
        <ellipse
          cx="14"
          cy="-24"
          rx="20"
          ry="12"
          fill="#e6f4ff"
          stroke="#9cc4e0"
          strokeWidth="2"
          opacity="0.9"
          transform="rotate(20 14 -24)"
        />
        <ellipse cx="0" cy="0" rx="36" ry="24" fill="#ffc93c" stroke="#3a2a10" strokeWidth="3" />
        <path d="M-12 -22 L -12 22 M 6 -24 L 6 24 M 22 -18 L 22 18" stroke="#3a2a10" strokeWidth="7" />
        <circle cx="-38" cy="-4" r="13" fill="#3a2a10" />
        <circle cx="-42" cy="-8" r="3" fill="#ffffff" />
        <circle cx="-8" cy="26" r="8" fill="#ffb300" stroke="#c88a00" strokeWidth="2" />
        <circle cx="14" cy="26" r="8" fill="#ffb300" stroke="#c88a00" strokeWidth="2" />
      </g>
    </svg>
  );
}
