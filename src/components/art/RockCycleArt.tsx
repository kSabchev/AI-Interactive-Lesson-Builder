/**
 * The rock cycle as a cut-away landscape (800×500): a volcano on the left fed by magma deep below, cooled lava
 * on its slope, a mountain being worn away by rain and frost, a river carrying the bits to the sea, layers
 * settling on the sea floor, and squeezed, folded bands deep underground. Arrows show where rock goes next.
 */
export function RockCycleArt() {
  const arrow = (x: number, y: number, angle: number) => (
    <path d="M-12 -10 L 10 0 L -12 10 Z" fill="#ffffff" transform={`translate(${x} ${y}) rotate(${angle})`} />
  );
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="rc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#eef8ff" />
        </linearGradient>
        <radialGradient id="rc-magma" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#ffdd55" />
          <stop offset="0.5" stopColor="#ff8a1f" />
          <stop offset="1" stopColor="#d6361c" />
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#rc-sky)" />

      {/* Underground */}
      <rect y="250" width="800" height="250" fill="#a58466" />

      {/* Deep bands, squeezed and folded by heat and pressure */}
      <g fill="none" strokeWidth="9" strokeLinecap="round">
        <path d="M410 410 C 450 380, 480 450, 520 410 S 590 380, 630 420 S 700 450, 740 410" stroke="#6e5a8a" />
        <path d="M410 436 C 450 406, 480 476, 520 436 S 590 406, 630 446 S 700 476, 740 436" stroke="#9a86b6" />
        <path d="M410 462 C 450 432, 480 502, 520 462 S 590 432, 630 472 S 700 502, 740 462" stroke="#6e5a8a" />
      </g>

      {/* Magma chamber and the pipe up to the crater */}
      <path d="M176 120 C 170 200, 168 300, 180 380" stroke="#ff8a1f" strokeWidth="18" fill="none" />
      <ellipse cx="190" cy="420" rx="120" ry="58" fill="url(#rc-magma)" />

      {/* Sea with layered sediment on its floor */}
      <path d="M560 210 L 800 210 L 800 330 L 540 330 Z" fill="#4aa3df" />
      <path d="M548 290 L 800 290 L 800 300 L 548 300 Z" fill="#e8d39a" />
      <path d="M552 300 L 800 300 L 800 312 L 552 312 Z" fill="#cdb478" />
      <path d="M548 312 L 800 312 L 800 322 L 548 322 Z" fill="#e8d39a" />
      <path d="M544 322 L 800 322 L 800 332 L 544 332 Z" fill="#b89c63" />
      <path d="M560 210 L 800 210" stroke="#ffffff" strokeWidth="3" opacity="0.7" />

      {/* Mountain worn by rain and frost */}
      <path d="M300 250 L 430 90 L 470 120 L 560 250 Z" fill="#8c8f99" />
      <path d="M430 90 L 410 115 L 428 112 L 444 124 L 470 120 Z" fill="#ffffff" />
      <path
        d="M410 160 L 424 180 L 418 200 M 470 170 L 460 196 M 440 210 L 452 228"
        stroke="#5f626b"
        strokeWidth="3"
        fill="none"
      />
      {[440, 465, 490].map((x) => (
        <line key={x} x1={x} y1="20" x2={x - 10} y2="50" stroke="#4a90d9" strokeWidth="4" strokeLinecap="round" />
      ))}
      <ellipse cx="465" cy="22" rx="46" ry="18" fill="#9fb3c8" />
      {/* Broken bits tumbling down */}
      {[
        [500, 236, 6],
        [520, 244, 4],
        [486, 244, 5],
      ].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#6f727c" />
      ))}

      {/* River carrying the bits to the sea */}
      <path
        d="M478 250 C 500 244, 530 254, 556 246"
        stroke="#4aa3df"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      {/* Volcano, with dark cooled lava on its slope */}
      <path d="M40 250 L 150 100 L 200 100 L 320 250 Z" fill="#7a5a48" />
      <path
        d="M200 100 C 222 140, 210 170, 236 200 C 256 226, 270 240, 280 250 L 248 250 C 230 220, 214 200, 206 168 Z"
        fill="#3c3a40"
      />
      <path d="M150 100 L 200 100 L 192 110 L 158 110 Z" fill="#ff8a1f" />
      <path
        d="M160 96 C 150 70, 170 50, 160 30 M 186 96 C 196 70, 180 52, 192 32"
        stroke="#b9b4b0"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Where rock goes next */}
      {arrow(660, 370, 90)}
      {arrow(370, 440, 180)}
      <path d="M660 340 L 660 380 M 400 440 L 330 440" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
