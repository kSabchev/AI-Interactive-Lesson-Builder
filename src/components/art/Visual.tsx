"use client";

import type { VisualId } from "@/lib/assets/visuals";
import { useT } from "@/lib/i18n/client";

/** Small predefined illustrations referenced by hook and explanation sections. */
export function Visual({ id, className }: { id: VisualId; className?: string }) {
  const t = useT();
  return (
    <figure className={className}>
      <svg viewBox="0 0 240 180" role="img" aria-label={t.visuals[id]} className="h-full w-full overflow-hidden rounded-[2rem]">
        <rect width="240" height="180" rx="24" fill="#eef6ff" />
        {ART[id]}
      </svg>
    </figure>
  );
}

const sun = (cx: number, cy: number) => (
  <g>
    <circle cx={cx} cy={cy} r="22" fill="#ffc93c" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * 28}
          y1={cy + Math.sin(a) * 28}
          x2={cx + Math.cos(a) * 38}
          y2={cy + Math.sin(a) * 38}
          stroke="#ffc93c"
          strokeWidth="5"
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

const vapour = (xs: number[], y: number) =>
  xs.map((x) => (
    <path
      key={x}
      d={`M${x} ${y} q 8 -14 0 -28 t 0 -28`}
      stroke="#7fb6ef"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="2 8"
      fill="none"
    />
  ));

const ART: Record<VisualId, React.ReactNode> = {
  "puddle-sun": (
    <>
      {sun(185, 50)}
      <rect x="0" y="130" width="240" height="50" fill="#c9b79c" />
      <ellipse cx="100" cy="140" rx="60" ry="12" fill="#4fa3f0" />
      {vapour([80, 100, 120], 125)}
    </>
  ),
  "rising-vapor": (
    <>
      {sun(50, 45)}
      <rect x="0" y="125" width="240" height="55" fill="#4fa3f0" />
      {vapour([90, 120, 150, 180], 118)}
    </>
  ),
  "cold-glass": (
    <>
      <path d="M85 40 L155 40 L145 160 L95 160 Z" fill="#d9ebff" stroke="#7fb6ef" strokeWidth="4" />
      <path d="M90 75 L150 75 L144 155 L96 155 Z" fill="#ffb347" />
      <rect x="100" y="62" width="16" height="16" rx="3" fill="#ffffff" opacity="0.9" />
      <rect x="122" y="58" width="16" height="16" rx="3" fill="#ffffff" opacity="0.9" />
      {[
        [92, 95],
        [150, 110],
        [97, 130],
        [146, 140],
        [152, 80],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} q -5 8 0 12 q 5 -4 0 -12`} fill="#2f7de1" />
      ))}
    </>
  ),
  "rain-cloud": (
    <>
      <g fill="#9fb3c8">
        <circle cx="95" cy="65" r="28" />
        <circle cx="130" cy="52" r="34" />
        <circle cx="165" cy="68" r="26" />
        <rect x="75" y="62" width="110" height="30" rx="15" />
      </g>
      {[90, 112, 134, 156, 175].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={105 + (i % 2) * 8}
          x2={x - 8}
          y2={130 + (i % 2) * 8}
          stroke="#2f7de1"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      <rect x="0" y="155" width="240" height="25" fill="#5fa05c" />
    </>
  ),  "sunrise-horizon": (
    <>
      <rect width="240" height="180" fill="#ffe2b8" />
      {sun(120, 120)}
      <path d="M0 130 C 50 105, 90 120, 130 128 S 200 110, 240 125 L240 180 L0 180 Z" fill="#5fa05c" />
      <path d="M150 60 q 15 -12 30 0" stroke="#e0a800" strokeWidth="4" fill="none" strokeDasharray="4 6" />
      <path d="M60 60 q 15 -12 30 0" stroke="#e0a800" strokeWidth="4" fill="none" strokeDasharray="4 6" />
    </>
  ),
  "earth-day-night": (
    <>
      <rect width="240" height="180" fill="#14213d" />
      {sun(45, 90)}
      <circle cx="150" cy="90" r="55" fill="#3b8fe0" />
      <path d="M120 70 q 15 -15 30 -5 q 5 20 -15 25 z M150 110 q 20 -5 25 10 q -10 15 -25 5 z" fill="#4caf50" />
      <path d="M150 35 A 55 55 0 0 1 150 145 Z" fill="#000000" opacity="0.55" />
      <path d="M150 20 A 70 70 0 0 1 205 50" stroke="#ffffff" strokeWidth="3" fill="none" strokeDasharray="5 5" />
    </>
  ),
  "seed-to-tree": (
    <>
      <rect x="0" y="140" width="240" height="40" fill="#a9784f" />
      <ellipse cx="35" cy="138" rx="9" ry="6" fill="#8d5a2b" />
      <path d="M95 140 v -35" stroke="#3f8f3c" strokeWidth="4" />
      <ellipse cx="88" cy="105" rx="10" ry="5" fill="#66bb6a" transform="rotate(-30 88 105)" />
      <ellipse cx="102" cy="100" rx="10" ry="5" fill="#66bb6a" transform="rotate(30 102 100)" />
      <rect x="172" y="85" width="12" height="55" fill="#7a4f2a" />
      <circle cx="178" cy="62" r="40" fill="#4caf50" />
      <path d="M50 120 l 20 0 M120 120 l 20 0" stroke="#5b6676" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  "leaf-closeup": (
    <>
      <path d="M30 150 C 40 60, 140 20, 215 30 C 205 110, 130 165, 30 150 Z" fill="#4caf50" />
      <path d="M30 150 C 90 110, 150 70, 215 30" stroke="#2e7d32" strokeWidth="4" fill="none" />
      {[
        [80, 115, 75, 85],
        [120, 90, 120, 55],
        [100, 105, 130, 120],
        [150, 70, 175, 90],
      ].map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2e7d32" strokeWidth="2.5" />
      ))}
      {[
        [95, 80],
        [150, 105],
        [165, 55],
        [70, 130],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="6" ry="3.5" fill="#1b5e20" stroke="#a5d6a7" strokeWidth="1.5" />
      ))}
    </>
  ),
};
