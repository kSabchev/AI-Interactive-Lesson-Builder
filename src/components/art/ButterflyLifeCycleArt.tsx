/**
 * The four stages of a butterfly's life on a loop of arrows (800×500): eggs on a leaf (top), caterpillar
 * (right), chrysalis (bottom), butterfly (left). Interactive targets are layered on top.
 */
export function ButterflyLifeCycleArt() {
  // Arcs of an ellipse around the centre, clockwise between the stages, leaving gaps for the drawings.
  const cx = 400;
  const cy = 252;
  const rx = 250;
  const ry = 170;
  const at = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return [Math.round(cx + rx * Math.cos(r)), Math.round(cy + ry * Math.sin(r))];
  };
  const arcs = [
    [-68, -22],
    [22, 68],
    [112, 158],
    [202, 248],
  ].map(([from, to]) => {
    const [x1, y1] = at(from);
    const [x2, y2] = at(to);
    return `M${x1} ${y1} A ${rx} ${ry} 0 0 1 ${x2} ${y2}`;
  });

  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <marker id="bf-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#7a8a99" />
        </marker>
      </defs>
      <rect width="800" height="500" fill="#eef8e6" />

      {arcs.map((d) => (
        <path
          key={d}
          d={d}
          stroke="#7a8a99"
          strokeWidth="6"
          strokeDasharray="14 9"
          fill="none"
          markerEnd="url(#bf-arrow)"
        />
      ))}

      {/* Eggs on a leaf (top) */}
      <ellipse cx="400" cy="85" rx="78" ry="30" fill="#5cbf60" transform="rotate(-8 400 85)" />
      <path d="M326 95 L 474 74" stroke="#2e7d32" strokeWidth="3" />
      {[
        [370, 78],
        [392, 74],
        [414, 71],
        [436, 69],
      ].map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx="8" ry="10" fill="#fff6c8" stroke="#d9c76a" strokeWidth="2" />
      ))}

      {/* Caterpillar on a twig (right) */}
      <path d="M570 292 L 735 292" stroke="#8a5a32" strokeWidth="8" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <circle cx={590 + i * 22} cy={270} r="15" fill={i % 2 === 0 ? "#7cc242" : "#f2d43a"} />
          <rect x={584 + i * 22} y={256} width="12" height="5" rx="2" fill="#2b2b2b" />
        </g>
      ))}
      <circle cx="722" cy="262" r="17" fill="#3c7a1e" />
      <circle cx="728" cy="257" r="3.5" fill="#ffffff" />
      <path d="M716 247 L 708 230 M 728 246 L 734 229" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />

      {/* Chrysalis hanging from a twig (bottom) */}
      <path d="M320 378 L 480 378" stroke="#8a5a32" strokeWidth="8" strokeLinecap="round" />
      <path d="M400 380 L 400 392" stroke="#5f7d2e" strokeWidth="4" />
      <path
        d="M400 390 C 432 402, 432 456, 400 476 C 368 456, 368 402, 400 390 Z"
        fill="#9ccc65"
        stroke="#5f7d2e"
        strokeWidth="3"
      />
      <path d="M386 418 Q 400 426 414 418 M 384 440 Q 400 448 416 440" stroke="#5f7d2e" strokeWidth="2" fill="none" />
      <circle cx="400" cy="402" r="3" fill="#e0b400" />

      {/* Butterfly (left) */}
      <g transform="translate(150 252)">
        <path
          d="M-4 -6 C -60 -70, -95 -30, -70 0 C -50 18, -20 8, -4 0 Z"
          fill="#ff9f1c"
          stroke="#2b2b2b"
          strokeWidth="4"
        />
        <path d="M4 -6 C 60 -70, 95 -30, 70 0 C 50 18, 20 8, 4 0 Z" fill="#ff9f1c" stroke="#2b2b2b" strokeWidth="4" />
        <path
          d="M-4 4 C -48 20, -58 58, -28 60 C -12 58, -6 34, -4 10 Z"
          fill="#ffb84d"
          stroke="#2b2b2b"
          strokeWidth="4"
        />
        <path d="M4 4 C 48 20, 58 58, 28 60 C 12 58, 6 34, 4 10 Z" fill="#ffb84d" stroke="#2b2b2b" strokeWidth="4" />
        {[
          [-62, -20],
          [62, -20],
          [-34, 44],
          [34, 44],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#ffffff" />
        ))}
        <ellipse cx="0" cy="6" rx="7" ry="40" fill="#2b2b2b" />
        <path d="M-3 -32 L -16 -58 M 3 -32 L 16 -58" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
