/**
 * The breathing system in a chest outline (800×500): the trachea coming down from the throat, splitting into
 * two bronchi, the two lungs, the dome of the diaphragm beneath them, and a magnified circle of alveoli.
 */
export function LungsArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#eef4fb" />

      {/* Chest outline */}
      <path
        d="M330 20 L 330 60 C 260 70, 200 100, 190 170 L 180 500 L 620 500 L 610 170 C 600 100, 540 70, 470 60 L 470 20 Z"
        fill="#fbe8da"
        stroke="#e2bea3"
        strokeWidth="4"
      />

      {/* Lungs */}
      <g fill="#f5a9b8" stroke="#d27389" strokeWidth="4">
        <path d="M376 196 C 340 160, 290 140, 256 170 C 222 200, 214 300, 222 380 C 228 410, 280 414, 330 400 C 372 388, 384 340, 384 300 Z" />
        <path d="M424 196 C 460 160, 510 140, 544 170 C 578 200, 586 300, 578 380 C 572 410, 520 414, 470 400 C 428 388, 416 340, 416 300 Z" />
      </g>
      {/* Small airways spreading through the lungs */}
      <g stroke="#e58aa0" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M352 228 C 320 250, 300 280, 280 320 M 320 262 C 300 262, 280 270, 262 280 M 330 290 C 330 320, 320 350, 300 370" />
        <path d="M448 228 C 480 250, 500 280, 520 320 M 480 262 C 500 262, 520 270, 538 280 M 470 290 C 470 320, 480 350, 500 370" />
      </g>

      {/* Trachea, with rings, splitting into two bronchi */}
      <path
        d="M400 30 L 400 180 M 400 180 C 390 196, 370 210, 350 230 M 400 180 C 410 196, 430 210, 450 230"
        stroke="#e9c7cf"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {[50, 72, 94, 116, 138, 160].map((y) => (
        <line key={y} x1="388" y1={y} x2="412" y2={y} stroke="#c49aa5" strokeWidth="4" strokeLinecap="round" />
      ))}

      {/* Diaphragm: a dome of muscle below the lungs */}
      <path
        d="M196 470 C 240 400, 340 404, 400 418 C 460 404, 560 400, 604 470"
        stroke="#c0504d"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Magnified alveoli, linked to the right lung */}
      <path d="M548 240 L 628 196" stroke="#8aa0b8" strokeWidth="3" strokeDasharray="6 6" />
      <circle cx="680" cy="150" r="82" fill="#ffffff" stroke="#8aa0b8" strokeWidth="5" />
      <path
        d="M680 236 L 680 196 C 680 180, 670 170, 660 162 M 680 196 C 690 180, 700 170, 708 162"
        stroke="#e58aa0"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {[
        [642, 132],
        [664, 112],
        [690, 108],
        [716, 126],
        [652, 156],
        [712, 152],
        [678, 134],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="17" fill="#f7b7c4" stroke="#d27389" strokeWidth="3" />
      ))}
      <path d="M640 120 C 660 96, 700 92, 724 118" stroke="#d93a3a" strokeWidth="4" fill="none" />
      <path d="M636 166 C 660 186, 702 186, 724 164" stroke="#4d7fd6" strokeWidth="4" fill="none" />
    </svg>
  );
}
