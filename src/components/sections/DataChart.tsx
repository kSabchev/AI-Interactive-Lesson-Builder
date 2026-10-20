import { niceScale } from "@/lib/activities/chart";
import type { SectionOfType } from "@/lib/lesson/schema";

/** A bar or line chart of a data section's rows (640×400), with axes, gridlines and values on the points. */
export function DataChart({
  section,
  format,
  label,
}: {
  section: Pick<SectionOfType<"data">, "chart" | "rows" | "xLabel" | "yLabel">;
  format: (value: number) => string;
  /** Accessible name; the numbers are also offered as a table next to the chart. */
  label: string;
}) {
  // Drawn small and scaled up, so the text stays readable on a phone too.
  const width = 640;
  const height = 400;
  const left = 84;
  const right = 20;
  // Room above the highest point for its value label.
  const top = 44;
  const bottom = 84;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const scale = niceScale(section.rows.map((row) => row.value));
  const y = (v: number) => top + plotHeight - ((v - scale.min) / (scale.max - scale.min)) * plotHeight;
  const band = plotWidth / section.rows.length;
  const x = (i: number) => left + band * i + band / 2;
  const barWidth = Math.min(80, band * 0.6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
      <rect width={width} height={height} rx="16" fill="#ffffff" />
      {scale.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={width - right}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? "#7a8a99" : "#e3e8ee"}
            strokeWidth={tick === 0 ? 2 : 1}
          />
          <text x={left - 10} y={y(tick) + 5} textAnchor="end" fontSize="19" fill="#5b6676">
            {format(tick)}
          </text>
        </g>
      ))}

      {section.chart === "bar" ? (
        section.rows.map((row, i) => {
          const top0 = Math.min(y(row.value), y(0));
          const h = Math.abs(y(row.value) - y(0));
          return (
            <g key={row.label}>
              <rect x={x(i) - barWidth / 2} y={top0} width={barWidth} height={h} rx="6" fill="#2f7de1" />
              <text
                x={x(i)}
                y={(row.value >= 0 ? top0 : top0 + h) + (row.value >= 0 ? -8 : 22)}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="#1f2a37"
              >
                {format(row.value)}
              </text>
            </g>
          );
        })
      ) : (
        <g>
          <polyline
            points={section.rows.map((row, i) => `${x(i)},${y(row.value)}`).join(" ")}
            fill="none"
            stroke="#2f7de1"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {section.rows.map((row, i) => (
            <g key={row.label}>
              <circle cx={x(i)} cy={y(row.value)} r="8" fill="#ffffff" stroke="#2f7de1" strokeWidth="4" />
              <text x={x(i)} y={y(row.value) - 16} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1f2a37">
                {format(row.value)}
              </text>
            </g>
          ))}
        </g>
      )}

      {section.rows.map((row, i) => (
        <text key={row.label} x={x(i)} y={top + plotHeight + 28} textAnchor="middle" fontSize="19" fill="#1f2a37">
          {row.label.length > 12 ? `${row.label.slice(0, 11)}…` : row.label}
        </text>
      ))}
      <text x={left + plotWidth / 2} y={height - 14} textAnchor="middle" fontSize="20" fontWeight="700" fill="#5b6676">
        {section.xLabel}
      </text>
      <text
        x={22}
        y={top + plotHeight / 2}
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#5b6676"
        transform={`rotate(-90 22 ${top + plotHeight / 2})`}
      >
        {section.yLabel}
      </text>
    </svg>
  );
}
