/**
 * The human digestive system inside a simple body outline, seen from the front (800×500): mouth, oesophagus,
 * liver (on the viewer's left), stomach (on the viewer's right), coiled small intestine and the large intestine
 * framing it.
 */
export function DigestiveSystemArt() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" aria-hidden="true">
      <rect width="800" height="500" fill="#eef6fb" />

      {/* Body outline */}
      <g fill="#fbe3d2" stroke="#e7b99a" strokeWidth="4">
        <path d="M250 500 L 250 200 C 250 160, 280 140, 330 135 L 370 130 L 370 112 L 430 112 L 430 130 L 470 135 C 520 140, 550 160, 550 200 L 550 500 Z" />
        <circle cx="400" cy="62" r="54" />
      </g>
      <path d="M372 104 L 428 104" stroke="#fbe3d2" strokeWidth="10" />
      {/* Eyes and mouth */}
      <circle cx="380" cy="52" r="5" fill="#5a4636" />
      <circle cx="420" cy="52" r="5" fill="#5a4636" />
      <path d="M382 80 Q 400 94 418 80 Z" fill="#c8455a" stroke="#a5344a" strokeWidth="3" strokeLinejoin="round" />

      {/* Oesophagus: from the mouth down the neck to the stomach */}
      <path
        d="M400 92 C 400 130, 398 160, 402 190 C 406 210, 418 222, 428 230"
        stroke="#e58a8a"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Liver: viewer's left, under the ribs */}
      <path
        d="M272 212 C 300 190, 380 192, 410 210 C 412 236, 390 262, 352 270 C 318 276, 280 262, 272 240 Z"
        fill="#9c3d36"
        stroke="#7a2c27"
        strokeWidth="3"
      />

      {/* Stomach: a J-shaped pouch on the viewer's right */}
      <path
        d="M424 222 C 444 214, 486 212, 500 232 C 514 256, 502 288, 470 296 C 446 302, 416 294, 404 280 C 420 278, 436 270, 440 256 C 442 244, 432 232, 424 222 Z"
        fill="#f29a9a"
        stroke="#c86b6b"
        strokeWidth="3"
      />

      {/* Large intestine: up the viewer's left, across, and down the viewer's right */}
      <path
        d="M330 450 L 316 420 C 300 380, 300 340, 312 316 C 330 300, 470 300, 488 316 C 500 340, 500 400, 488 440 C 478 460, 440 470, 412 466"
        stroke="#c98a4b"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M330 450 L 316 420 C 300 380, 300 340, 312 316 C 330 300, 470 300, 488 316 C 500 340, 500 400, 488 440 C 478 460, 440 470, 412 466"
        stroke="#e0a868"
        strokeWidth="14"
        strokeDasharray="6 10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Small intestine: tightly coiled in the middle */}
      <path
        d="M470 296 C 440 330, 350 326, 352 346 C 354 362, 444 352, 446 370 C 448 388, 352 382, 354 400 C 356 418, 446 410, 444 428 C 442 442, 380 440, 360 446"
        stroke="#f5b3a8"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M470 296 C 440 330, 350 326, 352 346 C 354 362, 444 352, 446 370 C 448 388, 352 382, 354 400 C 356 418, 446 410, 444 428 C 442 442, 380 440, 360 446"
        stroke="#d98c80"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
