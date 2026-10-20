/** A flowering plant above and below the ground (800×500). Interactive targets are layered on top. */
export function PlantPartsArt() {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe9ff" />
          <stop offset="1" stopColor="#f2faff" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#pp-sky)" />
      <rect y="365" width="800" height="135" fill="#a9784f" />
      <rect y="365" width="800" height="10" fill="#7cb87a" />
      {/* Small stones in the soil */}
      {[
        [120, 420, 14],
        [640, 460, 18],
        [690, 405, 10],
        [210, 470, 12],
      ].map(([x, y, r]) => (
        <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#8c6440" />
      ))}

      {/* Roots */}
      <g stroke="#e8d3b0" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M400 370 C 395 410, 360 430, 320 470" />
        <path d="M400 370 C 402 420, 398 455, 402 492" />
        <path d="M400 370 C 410 410, 450 430, 490 468" />
        <path d="M362 428 C 345 432, 330 445, 318 448" strokeWidth="4" />
        <path d="M440 425 C 458 428, 472 440, 482 446" strokeWidth="4" />
        <path d="M400 440 C 388 452, 382 462, 376 478" strokeWidth="4" />
      </g>

      {/* Stem */}
      <path
        d="M400 372 C 396 300, 404 220, 400 150"
        stroke="#3f8f3c"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />

      {/* Leaves, with veins */}
      <ellipse cx="318" cy="285" rx="88" ry="34" fill="#4caf50" transform="rotate(-20 318 285)" />
      <path d="M238 313 L 396 262" stroke="#2e7d32" strokeWidth="3" />
      <ellipse cx="488" cy="238" rx="92" ry="36" fill="#5cbf60" transform="rotate(18 488 238)" />
      <path d="M404 210 L 574 266" stroke="#2e7d32" strokeWidth="3" />

      {/* Flower */}
      {petals.map((angle) => (
        <ellipse key={angle} cx="400" cy="82" rx="20" ry="38" fill="#ff7aa8" transform={`rotate(${angle} 400 120)`} />
      ))}
      <circle cx="400" cy="120" r="24" fill="#ffc93c" />
      <circle cx="392" cy="114" r="4" fill="#e0a800" />
      <circle cx="408" cy="124" r="4" fill="#e0a800" />
      <circle cx="404" cy="110" r="3" fill="#e0a800" />
    </svg>
  );
}
