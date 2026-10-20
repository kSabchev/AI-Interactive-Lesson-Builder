/**
 * The double circulation as a simple loop diagram (800×500): the lungs at the top, the heart in the middle and
 * the rest of the body at the bottom. Red vessels carry blood rich in oxygen, blue ones blood that has given it up;
 * arrows show which way it flows. Arteries leave the heart on the right; veins return on the left.
 */
export function HeartCirculationArt() {
  const arrow = (x: number, y: number, angle: number, color: string) => (
    <path d="M-14 -12 L 10 0 L -14 12 Z" fill={color} transform={`translate(${x} ${y}) rotate(${angle})`} />
  );
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#fdf3f1" />

      {/* Vessels between the heart and the lungs */}
      <g strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M372 236 L 300 236 L 300 110" stroke="#4d7fd6" />
        <path d="M500 110 L 500 236 L 428 236" stroke="#d93a3a" />
      </g>
      {arrow(300, 160, -90, "#2f5fb3")}
      {arrow(500, 180, 90, "#a92424")}

      {/* Vessels between the heart and the body: arteries out on the right, veins back on the left */}
      <g strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M428 282 L 620 282 L 620 420 L 560 420" stroke="#d93a3a" />
        <path d="M240 420 L 180 420 L 180 282 L 372 282" stroke="#4d7fd6" />
      </g>
      {arrow(620, 360, 90, "#a92424")}
      {arrow(180, 340, -90, "#2f5fb3")}

      {/* Lungs */}
      <g fill="#f4a3b4" stroke="#d27389" strokeWidth="4">
        <path d="M392 50 C 330 30, 250 60, 250 110 C 250 150, 300 160, 392 140 Z" />
        <path d="M408 50 C 470 30, 550 60, 550 110 C 550 150, 500 160, 408 140 Z" />
      </g>
      <path d="M392 30 L 408 30 L 408 140 L 392 140 Z" fill="#e9c3cb" stroke="#d27389" strokeWidth="3" />
      <g stroke="#d27389" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M380 80 C 350 82, 320 92, 300 110 M 340 86 C 330 100, 330 115, 340 128" />
        <path d="M420 80 C 450 82, 480 92, 500 110 M 460 86 C 470 100, 470 115, 460 128" />
      </g>

      {/* Heart: blue right side (viewer's left), red left side (viewer's right) */}
      <path
        d="M400 320 C 360 296, 336 270, 336 244 C 336 218, 356 204, 378 206 C 390 207, 398 214, 400 222 C 402 214, 410 207, 422 206 C 444 204, 464 218, 464 244 C 464 270, 440 296, 400 320 Z"
        fill="#d93a3a"
        stroke="#9c2222"
        strokeWidth="4"
      />
      <path
        d="M400 222 C 398 214, 390 207, 378 206 C 356 204, 336 218, 336 244 C 336 270, 360 296, 400 320 Z"
        fill="#5b86d9"
        stroke="#2f5fb3"
        strokeWidth="4"
      />
      <path d="M400 224 L 400 316" stroke="#7a1d1d" strokeWidth="3" />

      {/* The rest of the body: tissues made of cells */}
      <rect x="240" y="384" width="320" height="76" rx="28" fill="#f7d9c4" stroke="#d9a989" strokeWidth="4" />
      {[270, 320, 370, 420, 470, 520].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i % 2 ? 408 : 436} r="14" fill="#f1c3a5" stroke="#d9a989" strokeWidth="3" />
          <circle cx={x} cy={i % 2 ? 408 : 436} r="4" fill="#b98466" />
        </g>
      ))}
    </svg>
  );
}
