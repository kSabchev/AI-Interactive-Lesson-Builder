/** Decorative photosynthesis scene (800×500). Interactive targets are layered on top. */
export function PhotosynthesisArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe9ff" />
          <stop offset="1" stopColor="#f2faff" />
        </linearGradient>
        {[
          ["ps-arrow-sun", "#e0a800"],
          ["ps-arrow-gas", "#5b6676"],
          ["ps-arrow-o2", "#2f7de1"],
          ["ps-arrow-water", "#1f66c4"],
          ["ps-arrow-food", "#d9822b"],
        ].map(([id, color]) => (
          <marker key={id} id={id} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={color} />
          </marker>
        ))}
      </defs>

      <rect width="800" height="500" fill="url(#ps-sky)" />
      <rect y="380" width="800" height="120" fill="#a9784f" />
      <rect y="380" width="800" height="10" fill="#7cb87a" />

      {/* Sun and light rays towards the leaves */}
      <circle cx="70" cy="70" r="40" fill="#ffc93c" />
      {[
        [115, 95, 250, 190],
        [120, 70, 330, 140],
        [100, 115, 210, 220],
      ].map(([x1, y1, x2, y2]) => (
        <line
          key={x1 + y1}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#e0a800"
          strokeWidth="5"
          strokeDasharray="12 8"
          markerEnd="url(#ps-arrow-sun)"
        />
      ))}

      {/* Roots */}
      <g stroke="#6b4a2b" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M400 385 C 390 420, 350 440, 320 475" />
        <path d="M400 385 C 402 430, 398 460, 400 492" />
        <path d="M400 385 C 420 420, 460 440, 490 470" />
        <path d="M400 400 C 430 410, 470 420, 540 432" />
      </g>

      {/* Water rising from the roots */}
      {[
        [560, 470, 470, 412],
        [600, 440, 500, 400],
      ].map(([x1, y1, x2, y2]) => (
        <line
          key={x1}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#1f66c4"
          strokeWidth="5"
          strokeDasharray="8 7"
          markerEnd="url(#ps-arrow-water)"
        />
      ))}
      {[
        [580, 480],
        [625, 455],
        [545, 455],
      ].map(([x, y]) => (
        <path key={x} d={`M${x} ${y - 10} q -7 10 0 14 q 7 -4 0 -14`} fill="#2f7de1" />
      ))}

      {/* Stem and leaves */}
      <path
        d="M400 388 C 396 320, 404 230, 400 130"
        stroke="#3f8f3c"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="300" cy="235" rx="95" ry="38" fill="#4caf50" transform="rotate(-18 300 235)" />
      <path d="M215 262 L 392 215" stroke="#2e7d32" strokeWidth="3" />
      <ellipse cx="505" cy="200" rx="100" ry="40" fill="#5cbf60" transform="rotate(16 505 200)" />
      <path d="M408 175 L 598 228" stroke="#2e7d32" strokeWidth="3" />
      <ellipse cx="375" cy="120" rx="34" ry="16" fill="#66bb6a" transform="rotate(-35 375 120)" />
      <ellipse cx="425" cy="118" rx="34" ry="16" fill="#66bb6a" transform="rotate(35 425 118)" />

      {/* Carbon dioxide going into the leaf */}
      <path
        d="M770 120 C 720 140, 670 170, 610 195"
        stroke="#5b6676"
        strokeWidth="5"
        strokeDasharray="10 8"
        fill="none"
        markerEnd="url(#ps-arrow-gas)"
      />
      {[
        [745, 100],
        [775, 150],
        [720, 160],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="7" fill="none" stroke="#5b6676" strokeWidth="3" />
      ))}

      {/* Oxygen leaving the leaf */}
      <path
        d="M215 262 C 170 280, 110 300, 45 320"
        stroke="#2f7de1"
        strokeWidth="5"
        strokeDasharray="10 8"
        fill="none"
        markerEnd="url(#ps-arrow-o2)"
      />
      {[
        [40, 290],
        [70, 345],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="7" fill="none" stroke="#2f7de1" strokeWidth="3" />
      ))}

      {/* Food (glucose) carried from the leaf down the stem */}
      <path
        d="M500 225 C 470 260, 440 300, 414 360"
        stroke="#d9822b"
        strokeWidth="5"
        strokeDasharray="10 8"
        fill="none"
        markerEnd="url(#ps-arrow-food)"
      />
    </svg>
  );
}
