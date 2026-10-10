import type { VisualId } from "@/lib/assets/visuals";
import { VISUALS } from "@/lib/assets/visuals";

/** Small predefined illustrations referenced by hook and explanation sections. */
export function Visual({ id, className }: { id: VisualId; className?: string }) {
  return (
    <figure className={className}>
      <svg viewBox="0 0 240 180" role="img" aria-label={VISUALS[id]} className="h-full w-full overflow-hidden rounded-[2rem]">
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
  ),
};
