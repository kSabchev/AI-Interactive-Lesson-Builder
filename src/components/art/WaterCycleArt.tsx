/** Decorative water cycle scene (800×500). Interactive targets are layered on top by DiagramLabeling. */
export function WaterCycleArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="wc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe3ff" />
          <stop offset="1" stopColor="#eef8ff" />
        </linearGradient>
        <linearGradient id="wc-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fa3f0" />
          <stop offset="1" stopColor="#1f66c4" />
        </linearGradient>
        <marker id="wc-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#1a529c" />
        </marker>
      </defs>

      <rect width="800" height="500" fill="url(#wc-sky)" />

      {/* Sun */}
      <g>
        <circle cx="90" cy="80" r="44" fill="#ffc93c" />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={90 + Math.cos(a) * 54}
              y1={80 + Math.sin(a) * 54}
              x2={90 + Math.cos(a) * 70}
              y2={80 + Math.sin(a) * 70}
              stroke="#ffc93c"
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Mountains and ground */}
      <path d="M300 420 L470 300 L560 360 L660 190 L800 330 L800 500 L300 500 Z" fill="#7cb87a" />
      <path d="M620 250 L660 190 L700 245 L680 240 L660 255 L640 240 Z" fill="#ffffff" />
      <path d="M300 430 C 420 400, 560 410, 800 420 L800 500 L300 500 Z" fill="#5fa05c" />

      {/* Ocean */}
      <path d="M0 360 C 60 350, 120 370, 180 360 S 300 352, 340 368 L 360 500 L 0 500 Z" fill="url(#wc-sea)" />
      <path d="M20 390 q 20 -10 40 0 t 40 0" stroke="#d9ebff" strokeWidth="3" fill="none" />
      <path d="M150 420 q 20 -10 40 0 t 40 0" stroke="#d9ebff" strokeWidth="3" fill="none" />

      {/* River back to the ocean */}
      <path
        d="M690 330 C 650 380, 600 380, 560 420 S 420 470, 330 455"
        stroke="#4fa3f0"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M600 440 C 540 470, 460 480, 380 475"
        stroke="#1a529c"
        strokeWidth="4"
        strokeDasharray="10 8"
        fill="none"
        markerEnd="url(#wc-arrow)"
      />

      {/* Evaporation: wavy vapour rising */}
      {[150, 200, 250].map((x, i) => (
        <path
          key={x}
          d={`M${x} 345 q 14 -25 0 -50 t 0 -50 t 0 -50`}
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="2 12"
          fill="none"
          opacity={0.95 - i * 0.1}
        />
      ))}
      <path d="M260 210 C 300 150, 340 110, 360 100" stroke="#1a529c" strokeWidth="4" strokeDasharray="10 8" fill="none" markerEnd="url(#wc-arrow)" />

      {/* Cloud forming */}
      <g fill="#ffffff">
        <circle cx="400" cy="85" r="34" />
        <circle cx="440" cy="70" r="40" />
        <circle cx="482" cy="88" r="32" />
        <rect x="380" y="85" width="120" height="34" rx="17" />
      </g>
      <path d="M520 95 C 560 95, 580 105, 595 125" stroke="#1a529c" strokeWidth="4" strokeDasharray="10 8" fill="none" markerEnd="url(#wc-arrow)" />

      {/* Rain cloud over mountains */}
      <g fill="#9fb3c8">
        <circle cx="620" cy="140" r="30" />
        <circle cx="658" cy="128" r="36" />
        <circle cx="694" cy="146" r="28" />
        <rect x="600" y="140" width="110" height="30" rx="15" />
      </g>
      {[612, 636, 660, 684, 702].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={182 + (i % 2) * 10}
          x2={x - 10}
          y2={212 + (i % 2) * 10}
          stroke="#2f7de1"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
