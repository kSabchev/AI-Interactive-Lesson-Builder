/**
 * A complete electric circuit on a desk (800×500): a cell (battery) at the bottom, a closed switch on the
 * left, a lit bulb at the top and wires joining them in one loop.
 */
export function SimpleCircuitArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#f6efe2" />
      <rect x="40" y="30" width="720" height="440" rx="24" fill="#efe3cc" />

      {/* Wires: one loop through the bulb, the cell and the switch */}
      <g stroke="#d6552f" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M378 150 L 200 150 L 200 225" />
        <path d="M200 305 L 200 400 L 328 400" />
        <path d="M472 400 L 620 400 L 620 150 L 422 150" />
      </g>

      {/* Bulb, shining */}
      {[-60, -30, 0, 30, 60].map((a) => (
        <line
          key={a}
          x1="400"
          y1="22"
          x2="400"
          y2="4"
          stroke="#ffc93c"
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${a} 400 92)`}
        />
      ))}
      <circle cx="400" cy="92" r="46" fill="#fff3b0" stroke="#e0a800" strokeWidth="4" />
      <path
        d="M384 108 L 390 82 L 400 102 L 410 82 L 416 108"
        stroke="#e0a800"
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
      />
      <rect x="378" y="134" width="44" height="30" rx="5" fill="#9aa5b1" />
      <path d="M378 142 L 422 142 M 378 151 L 422 151" stroke="#7a8590" strokeWidth="3" />

      {/* Cell (battery): + on the right, − on the left */}
      <rect x="328" y="372" width="144" height="56" rx="10" fill="#3a4a5c" />
      <rect x="430" y="372" width="42" height="56" rx="8" fill="#e0a800" />
      <rect x="472" y="388" width="10" height="24" rx="3" fill="#9aa5b1" />
      <path d="M445 400 L 461 400 M 453 392 L 453 408" stroke="#3a4a5c" strokeWidth="4" strokeLinecap="round" />
      <path d="M342 400 L 356 400" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />

      {/* Switch, closed */}
      <rect x="160" y="215" width="80" height="100" rx="12" fill="#ffffff" stroke="#b8c4d0" strokeWidth="3" />
      <circle cx="200" cy="228" r="9" fill="#9aa5b1" />
      <circle cx="200" cy="302" r="9" fill="#9aa5b1" />
      <line x1="200" y1="302" x2="203" y2="232" stroke="#3a4a5c" strokeWidth="8" strokeLinecap="round" />
      <circle cx="200" cy="302" r="6" fill="#3a4a5c" />
    </svg>
  );
}
