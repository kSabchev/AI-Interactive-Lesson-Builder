/**
 * A human skeleton standing, seen from the front (800×500): skull, ribcage, the lower spine below the ribs,
 * pelvis, arm and leg bones.
 */
export function SkeletonArt() {
  const bone = "#fbf6ea";
  const edge = "#b9ad93";
  /** A long bone with knobbly ends, from (x1, y1) to (x2, y2). */
  const longBone = (x1: number, y1: number, x2: number, y2: number, width: number) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge} strokeWidth={width + 6} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={bone} strokeWidth={width} strokeLinecap="round" />
      <circle cx={x1} cy={y1} r={width * 0.85} fill={bone} stroke={edge} strokeWidth="3" />
      <circle cx={x2} cy={y2} r={width * 0.85} fill={bone} stroke={edge} strokeWidth="3" />
    </g>
  );
  const ribs = [0, 1, 2, 3, 4, 5];
  const vertebrae = [222, 236, 250];

  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#e8eef6" />
      <ellipse cx="400" cy="486" rx="150" ry="10" fill="#cdd6e2" />

      {/* Arms */}
      {longBone(338, 128, 316, 214, 14)}
      {longBone(316, 214, 304, 290, 10)}
      {longBone(462, 128, 484, 214, 14)}
      {longBone(484, 214, 496, 290, 10)}
      <ellipse cx="300" cy="312" rx="12" ry="18" fill={bone} stroke={edge} strokeWidth="3" />
      <ellipse cx="500" cy="312" rx="12" ry="18" fill={bone} stroke={edge} strokeWidth="3" />

      {/* Legs */}
      {longBone(374, 300, 368, 390, 18)}
      {longBone(368, 392, 366, 466, 12)}
      {longBone(426, 300, 432, 390, 18)}
      {longBone(432, 392, 434, 466, 12)}
      <path d="M352 470 L 340 486 L 378 486 L 376 470 Z" fill={bone} stroke={edge} strokeWidth="3" />
      <path d="M448 470 L 460 486 L 422 486 L 424 470 Z" fill={bone} stroke={edge} strokeWidth="3" />

      {/* Lower spine: a column of small bones between the ribs and the hips */}
      {vertebrae.map((y) => (
        <rect key={y} x="388" y={y} width="24" height="12" rx="4" fill={bone} stroke={edge} strokeWidth="3" />
      ))}

      {/* Pelvis */}
      <path
        d="M400 262 C 380 262, 352 258, 340 266 C 328 276, 336 298, 356 304 L 384 300 C 392 296, 396 290, 400 290 C 404 290, 408 296, 416 300 L 444 304 C 464 298, 472 276, 460 266 C 448 258, 420 262, 400 262 Z"
        fill={bone}
        stroke={edge}
        strokeWidth="3"
      />
      <circle cx="372" cy="284" r="7" fill="#e8eef6" stroke={edge} strokeWidth="2" />
      <circle cx="428" cy="284" r="7" fill="#e8eef6" stroke={edge} strokeWidth="2" />

      {/* Collarbones and shoulders */}
      <path d="M400 120 L 340 126 M 400 120 L 460 126" stroke={edge} strokeWidth="12" strokeLinecap="round" />
      <path d="M400 120 L 340 126 M 400 120 L 460 126" stroke={bone} strokeWidth="7" strokeLinecap="round" />

      {/* Ribcage: curved ribs around the breastbone */}
      {ribs.map((i) => {
        const y = 134 + i * 14;
        const w = 50 + Math.min(i, 3) * 4 - Math.max(0, i - 3) * 6;
        return (
          <path
            key={i}
            d={`M400 ${y} C ${400 - w} ${y - 4}, ${400 - w - 12} ${y + 22}, ${400 - w + 8} ${y + 30} M 400 ${y} C ${400 + w} ${y - 4}, ${400 + w + 12} ${y + 22}, ${400 + w - 8} ${y + 30}`}
            stroke={edge}
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      {ribs.map((i) => {
        const y = 134 + i * 14;
        const w = 50 + Math.min(i, 3) * 4 - Math.max(0, i - 3) * 6;
        return (
          <path
            key={i}
            d={`M400 ${y} C ${400 - w} ${y - 4}, ${400 - w - 12} ${y + 22}, ${400 - w + 8} ${y + 30} M 400 ${y} C ${400 + w} ${y - 4}, ${400 + w + 12} ${y + 22}, ${400 + w - 8} ${y + 30}`}
            stroke={bone}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      <rect x="392" y="126" width="16" height="84" rx="6" fill={bone} stroke={edge} strokeWidth="3" />

      {/* Neck */}
      <rect x="390" y="96" width="20" height="10" rx="3" fill={bone} stroke={edge} strokeWidth="3" />
      <rect x="390" y="108" width="20" height="10" rx="3" fill={bone} stroke={edge} strokeWidth="3" />

      {/* Skull */}
      <path
        d="M400 8 C 362 8, 350 34, 352 56 C 354 72, 362 80, 370 84 L 372 98 L 428 98 L 430 84 C 438 80, 446 72, 448 56 C 450 34, 438 8, 400 8 Z"
        fill={bone}
        stroke={edge}
        strokeWidth="3"
      />
      <ellipse cx="383" cy="56" rx="10" ry="11" fill="#4a4a56" />
      <ellipse cx="417" cy="56" rx="10" ry="11" fill="#4a4a56" />
      <path d="M400 66 L 394 78 L 406 78 Z" fill="#4a4a56" />
      <path
        d="M380 90 L 420 90 M 388 86 L 388 96 M 396 86 L 396 96 M 404 86 L 404 96 M 412 86 L 412 96"
        stroke={edge}
        strokeWidth="2"
      />
    </svg>
  );
}
