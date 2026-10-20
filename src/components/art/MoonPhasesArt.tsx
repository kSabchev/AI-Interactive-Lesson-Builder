/**
 * Four phases of the Moon across a night sky, in the order they happen (800×500), as seen from the Northern
 * Hemisphere: new moon, first quarter (lit on the right), full moon, last quarter (lit on the left).
 */
export function MoonPhasesArt() {
  const y = 250;
  const r = 64;
  const xs = [130, 310, 490, 670];
  const lit = "#f4f1de";
  const dark = "#2e3b5c";
  const craters = (cx: number, side: "left" | "right" | "both") =>
    [
      [-24, -18, 10],
      [18, 22, 13],
      [28, -26, 8],
      [-14, 30, 7],
    ]
      .filter(([dx]) => side === "both" || (side === "right" ? dx > 0 : dx < 0))
      .map(([dx, dy, cr]) => <circle key={`${cx}${dx}${dy}`} cx={cx + dx} cy={y + dy} r={cr} fill="#ded9c0" />);

  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <marker id="mp-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#8fa3c7" />
        </marker>
      </defs>
      <rect width="800" height="500" fill="#1b2a4a" />
      {[
        [40, 40],
        [210, 70],
        [395, 35],
        [560, 90],
        [760, 50],
        [90, 430],
        [300, 455],
        [520, 420],
        [720, 460],
        [650, 140],
        [160, 150],
        [460, 130],
      ].map(([sx, sy]) => (
        <circle key={`${sx}-${sy}`} cx={sx} cy={sy} r="2.5" fill="#ffffff" opacity="0.8" />
      ))}

      {/* New moon: almost invisible */}
      <circle cx={xs[0]} cy={y} r={r} fill={dark} stroke="#4a5a80" strokeWidth="3" />

      {/* First quarter: right half lit */}
      <circle cx={xs[1]} cy={y} r={r} fill={dark} stroke="#4a5a80" strokeWidth="3" />
      <path d={`M${xs[1]} ${y - r} A ${r} ${r} 0 0 1 ${xs[1]} ${y + r} Z`} fill={lit} />
      {craters(xs[1], "right")}

      {/* Full moon */}
      <circle cx={xs[2]} cy={y} r={r} fill={lit} />
      {craters(xs[2], "both")}

      {/* Last quarter: left half lit */}
      <circle cx={xs[3]} cy={y} r={r} fill={dark} stroke="#4a5a80" strokeWidth="3" />
      <path d={`M${xs[3]} ${y - r} A ${r} ${r} 0 0 0 ${xs[3]} ${y + r} Z`} fill={lit} />
      {craters(xs[3], "left")}

      {/* Order: about a week between each */}
      {xs.slice(0, 3).map((x) => (
        <path
          key={x}
          d={`M${x + 40} ${y + 95} Q ${x + 90} ${y + 125} ${x + 140} ${y + 95}`}
          stroke="#8fa3c7"
          strokeWidth="5"
          strokeDasharray="10 7"
          fill="none"
          markerEnd="url(#mp-arrow)"
        />
      ))}
    </svg>
  );
}
