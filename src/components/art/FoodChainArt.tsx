/**
 * A simple food chain in a meadow (800×500): the Sun, grass and clover, a rabbit and a fox, with arrows
 * showing the energy passing from what is eaten to what eats it.
 */
export function FoodChainArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="fc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe9ff" />
          <stop offset="1" stopColor="#f2faff" />
        </linearGradient>
        {[
          ["fc-arrow-sun", "#e0a800"],
          ["fc-arrow", "#5b6676"],
        ].map(([id, color]) => (
          <marker key={id} id={id} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={color} />
          </marker>
        ))}
      </defs>
      <rect width="800" height="500" fill="url(#fc-sky)" />
      <rect y="390" width="800" height="110" fill="#8bc34a" />
      <rect y="390" width="800" height="8" fill="#7cb342" />

      {/* Sun */}
      <circle cx="90" cy="80" r="44" fill="#ffc93c" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="90"
          y1="18"
          x2="90"
          y2="2"
          stroke="#ffc93c"
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${a} 90 80)`}
        />
      ))}

      {/* Grass and clover */}
      <g fill="#4caf50">
        {[150, 175, 200, 225, 250].map((x) => (
          <path key={x} d={`M${x} 392 Q ${x - 8} 345 ${x - 4} 320 Q ${x + 6} 350 ${x + 8} 392 Z`} />
        ))}
      </g>
      {[
        [178, 330],
        [222, 342],
      ].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y + 10} L ${x} 392`} stroke="#2e7d32" strokeWidth="4" />
          <circle cx={x - 9} cy={y} r="10" fill="#66bb6a" />
          <circle cx={x + 9} cy={y} r="10" fill="#66bb6a" />
          <circle cx={x} cy={y - 12} r="10" fill="#66bb6a" />
        </g>
      ))}

      {/* Rabbit, sitting */}
      <ellipse cx="425" cy="352" rx="58" ry="40" fill="#b9a28a" />
      <circle cx="367" cy="342" r="14" fill="#ffffff" />
      <ellipse cx="452" cy="388" rx="26" ry="9" fill="#a38c74" />
      <circle cx="476" cy="306" r="30" fill="#b9a28a" />
      <ellipse cx="464" cy="252" rx="10" ry="32" fill="#b9a28a" transform="rotate(-10 464 252)" />
      <ellipse cx="488" cy="254" rx="10" ry="32" fill="#b9a28a" transform="rotate(12 488 254)" />
      <ellipse cx="464" cy="254" rx="5" ry="22" fill="#f4b6c2" transform="rotate(-10 464 254)" />
      <ellipse cx="488" cy="256" rx="5" ry="22" fill="#f4b6c2" transform="rotate(12 488 256)" />
      <circle cx="488" cy="300" r="4" fill="#2b2b2b" />
      <circle cx="504" cy="314" r="4" fill="#f48fb1" />

      {/* Fox */}
      <path d="M598 330 C 560 300, 535 340, 548 370 C 560 392, 590 372, 604 352 Z" fill="#e8742a" />
      <path d="M548 370 C 552 382, 566 386, 578 380 C 566 376, 556 372, 548 370 Z" fill="#ffffff" />
      <ellipse cx="660" cy="345" rx="72" ry="32" fill="#e8742a" />
      {[612, 640, 680, 708].map((x) => (
        <rect key={x} x={x} y="362" width="12" height="30" rx="4" fill="#5a2d0c" />
      ))}
      <circle cx="735" cy="312" r="28" fill="#e8742a" />
      <path d="M752 300 L 790 320 L 752 330 Z" fill="#e8742a" />
      <path d="M760 318 L 790 320 L 760 330 Z" fill="#ffffff" />
      <circle cx="790" cy="320" r="4" fill="#2b2b2b" />
      <path d="M715 292 L 712 258 L 735 285 Z" fill="#e8742a" />
      <path d="M738 288 L 748 254 L 758 290 Z" fill="#e8742a" />
      <circle cx="745" cy="306" r="4" fill="#2b2b2b" />
      <path d="M708 330 C 716 350, 740 352, 752 336" fill="#ffffff" />

      {/* Energy passes along the chain */}
      <path
        d="M111 131 C 140 180, 168 245, 190 300"
        stroke="#e0a800"
        strokeWidth="5"
        strokeDasharray="12 8"
        fill="none"
        markerEnd="url(#fc-arrow-sun)"
      />
      <path
        d="M255 300 C 300 250, 350 245, 395 280"
        stroke="#5b6676"
        strokeWidth="6"
        fill="none"
        markerEnd="url(#fc-arrow)"
      />
      <path
        d="M515 280 C 560 230, 610 230, 650 290"
        stroke="#5b6676"
        strokeWidth="6"
        fill="none"
        markerEnd="url(#fc-arrow)"
      />
    </svg>
  );
}
