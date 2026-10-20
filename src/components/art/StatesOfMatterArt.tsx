/**
 * Solid, liquid and gas side by side (800×500): an ice cube, a glass of water and rising steam, each above
 * a box showing how its particles are arranged, with warming arrows from solid to liquid to gas.
 */
export function StatesOfMatterArt() {
  // Particle arrangements inside each box (box top-left at x, 300; 160 wide, 110 tall).
  const solid = Array.from({ length: 20 }, (_, i) => [112 + (i % 5) * 24, 319 + Math.floor(i / 5) * 24]);
  const liquid = [
    [346, 386],
    [370, 390],
    [394, 384],
    [418, 389],
    [442, 385],
    [462, 382],
    [356, 364],
    [380, 366],
    [404, 362],
    [428, 367],
    [452, 360],
    [366, 342],
    [392, 340],
    [418, 344],
    [444, 338],
  ];
  const gas = [
    [614, 322],
    [676, 316],
    [716, 354],
    [632, 372],
    [694, 394],
    [610, 396],
  ];
  const box = (x: number) => (
    <rect x={x} y="300" width="160" height="110" rx="14" fill="#ffffff" stroke="#b8c4d0" strokeWidth="3" />
  );

  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <marker id="sm-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#e0592a" />
        </marker>
      </defs>
      <rect width="800" height="500" fill="#f4f8fc" />

      {/* Ice cube */}
      <path d="M100 160 L 200 160 L 200 260 L 100 260 Z" fill="#cdeffd" stroke="#7fc3e6" strokeWidth="4" />
      <path d="M100 160 L 125 140 L 225 140 L 200 160 Z" fill="#e6f7ff" stroke="#7fc3e6" strokeWidth="4" />
      <path d="M200 160 L 225 140 L 225 240 L 200 260 Z" fill="#b5e2f7" stroke="#7fc3e6" strokeWidth="4" />
      <path d="M115 180 L 140 180 M 115 192 L 128 192" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />

      {/* Glass of water */}
      <path d="M345 140 L 355 260 L 445 260 L 455 140" fill="none" stroke="#7a8a99" strokeWidth="4" />
      <path d="M350 185 L 356 258 L 444 258 L 450 185 Z" fill="#7fc3f5" />
      <path d="M350 185 Q 375 177 400 185 T 450 185" fill="none" stroke="#4fa3e0" strokeWidth="3" />

      {/* Steam rising from a bowl */}
      <path d="M590 235 Q 650 275 710 235 Z" fill="#cfd8e3" stroke="#7a8a99" strokeWidth="4" />
      {[615, 650, 685].map((x) => (
        <path
          key={x}
          d={`M${x} 225 C ${x - 15} 205, ${x + 15} 190, ${x} 170 C ${x - 15} 150, ${x + 12} 140, ${x} 125`}
          stroke="#aeb9c6"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {/* Particle boxes */}
      {box(80)}
      {solid.map(([x, y]) => (
        <circle key={`s${x}-${y}`} cx={x} cy={y} r="11" fill="#5aa9e6" />
      ))}
      {box(330)}
      {liquid.map(([x, y]) => (
        <circle key={`l${x}-${y}`} cx={x} cy={y} r="11" fill="#2f7de1" />
      ))}
      {box(580)}
      {gas.map(([x, y]) => (
        <g key={`g${x}-${y}`}>
          <circle cx={x} cy={y} r="11" fill="#7a8a99" />
          <path d={`M${x - 26} ${y + 4} L ${x - 15} ${y + 2}`} stroke="#b8c4d0" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      {/* Warming arrows between the states */}
      {[
        [248, 305],
        [498, 555],
      ].map(([x1, x2]) => (
        <g key={x1}>
          <line x1={x1} y1="250" x2={x2} y2="250" stroke="#e0592a" strokeWidth="7" markerEnd="url(#sm-arrow)" />
          <path
            d={`M${x1 + 12} 232 q 5 -8 0 -16 q -5 -8 0 -16 M ${x1 + 28} 232 q 5 -8 0 -16 q -5 -8 0 -16`}
            stroke="#f2994a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}
