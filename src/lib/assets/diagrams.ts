/**
 * Approved diagrams. Lessons reference a diagram by id; the AI may only pick from this list,
 * so topics without a matching diagram fall back to prediction and sorting activities.
 * Target positions are percentages of the diagram's width/height.
 */
export type DiagramTarget = { id: string; name: string; x: number; y: number };

export type DiagramMeta = {
  id: string;
  title: string;
  description: string;
  topics: string[];
  aspectRatio: number;
  targets: DiagramTarget[];
};

export const DIAGRAMS = {
  "water-cycle": {
    id: "water-cycle",
    title: "The water cycle",
    description: "Sun, ocean, cloud, rain over mountains and a river flowing back to the sea.",
    topics: ["water cycle", "evaporation", "condensation", "precipitation", "weather"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "evaporation", name: "Water rising from the ocean", x: 24, y: 52 },
      { id: "condensation", name: "Cloud forming in the sky", x: 52, y: 12 },
      { id: "precipitation", name: "Rain falling on the mountains", x: 76, y: 42 },
      { id: "collection", name: "River flowing back to the ocean", x: 52, y: 84 },
    ],
  },
} as const satisfies Record<string, DiagramMeta>;

export type DiagramId = keyof typeof DIAGRAMS;

export const DIAGRAM_IDS = Object.keys(DIAGRAMS) as DiagramId[];

export function isDiagramId(value: string): value is DiagramId {
  return Object.hasOwn(DIAGRAMS, value);
}
