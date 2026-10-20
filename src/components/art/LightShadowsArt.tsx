/**
 * How light travels (800×500): a torch on the left shines a beam at a block, which casts a shadow on the wall
 * behind it; a single ray from the torch bounces off a tilted mirror at the top and into an eye.
 * The angles follow the law of reflection.
 */
export function LightShadowsArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#2f3550" />
      <rect y="440" width="800" height="60" fill="#3d4463" />

      {/* Wall on the right */}
      <rect x="720" y="0" width="80" height="440" fill="#e9e3d3" />

      {/* Beam from the torch: lit wall around the shadow, then the shadow itself */}
      <path d="M140 286 L 720 160 L 720 440 L 140 314 Z" fill="#ffe680" opacity="0.28" />
      <rect x="720" y="160" width="80" height="280" fill="#fff2b3" />
      <path d="M720 182 L 800 172 L 800 428 L 720 418 Z" fill="#4a4a5a" />

      {/* Rays to the block: straight lines with arrows */}
      <g stroke="#ffd23f" strokeWidth="5" strokeLinecap="round">
        <line x1="140" y1="292" x2="380" y2="250" />
        <line x1="140" y1="308" x2="380" y2="350" />
        <line x1="140" y1="300" x2="380" y2="300" />
      </g>
      <path d="M262 288 L 286 300 L 262 312 Z" fill="#ffd23f" />

      {/* The block (opaque) */}
      <rect x="380" y="250" width="60" height="100" rx="4" fill="#c46a3a" stroke="#8f4724" strokeWidth="4" />
      <path d="M380 250 L 396 236 L 456 236 L 440 250 Z" fill="#dd8a58" stroke="#8f4724" strokeWidth="3" />
      <path d="M440 250 L 456 236 L 456 336 L 440 350 Z" fill="#a85a30" stroke="#8f4724" strokeWidth="3" />

      {/* Ray to the mirror and its reflection into the eye */}
      <g stroke="#ffd23f" strokeWidth="5" strokeLinecap="round">
        <line x1="140" y1="280" x2="400" y2="80" />
        <line x1="400" y1="80" x2="616" y2="131" />
      </g>
      <path d="M-12 -11 L 10 0 L -12 11 Z" fill="#ffd23f" transform="translate(276 175) rotate(-37.6)" />
      <path d="M-12 -11 L 10 0 L -12 11 Z" fill="#ffd23f" transform="translate(520 108) rotate(13.3)" />

      {/* Mirror, tilted so its shiny face points down */}
      <g transform="rotate(-12.4 400 80)">
        <rect x="336" y="62" width="128" height="14" rx="3" fill="#8b93a6" />
        <rect x="336" y="76" width="128" height="6" fill="#d8f1ff" />
      </g>

      {/* Torch */}
      <g transform="rotate(-6 100 300)">
        <rect x="34" y="282" width="84" height="36" rx="8" fill="#5c6bc0" stroke="#3949ab" strokeWidth="3" />
        <path d="M118 278 L 142 270 L 142 330 L 118 322 Z" fill="#9fa8da" stroke="#3949ab" strokeWidth="3" />
        <rect x="64" y="276" width="18" height="8" rx="3" fill="#ff7043" />
      </g>

      {/* An eye looking back along the bounced ray */}
      <g transform="rotate(13 655 140)">
        <path
          d="M612 140 C 630 112, 680 112, 698 140 C 680 168, 630 168, 612 140 Z"
          fill="#ffffff"
          stroke="#c9d3e6"
          strokeWidth="4"
        />
        <circle cx="636" cy="140" r="17" fill="#4f9fd8" />
        <circle cx="632" cy="140" r="8" fill="#1d2433" />
        <circle cx="637" cy="135" r="3" fill="#ffffff" />
        <path
          d="M610 130 C 630 100, 682 100, 700 132"
          stroke="#c9d3e6"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
