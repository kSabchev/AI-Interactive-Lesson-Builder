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
  "solar-system": {
    id: "solar-system",
    title: "The solar system",
    description: "The Sun on the left with the eight planets in order along their orbits.",
    topics: ["solar system", "planets", "sun", "orbit", "space"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "sun", name: "Huge glowing ball on the far left", x: 8, y: 50 },
      { id: "earth", name: "Small blue planet with a moon", x: 33, y: 24 },
      { id: "mars", name: "Small red planet", x: 41, y: 76 },
      { id: "jupiter", name: "Biggest planet, with stripes and a red spot", x: 55, y: 20 },
      { id: "saturn", name: "Planet with wide rings", x: 70, y: 80 },
    ],
  },
  photosynthesis: {
    id: "photosynthesis",
    title: "Photosynthesis in a plant",
    description: "A plant in soil under the Sun, with arrows showing what goes in and comes out of the leaves.",
    topics: ["photosynthesis", "plants", "leaves", "oxygen", "carbon dioxide"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "sunlight", name: "Rays shining down onto the leaves", x: 24, y: 24 },
      { id: "carbon-dioxide", name: "Gas arrow going into the right-hand leaf", x: 84, y: 34 },
      { id: "oxygen", name: "Gas arrow coming out of the left-hand leaf", x: 15, y: 58 },
      { id: "water", name: "Arrows rising up from the roots", x: 66, y: 86 },
      { id: "glucose", name: "Arrow carrying food down the stem", x: 60, y: 56 },
    ],
  },
} as const satisfies Record<string, DiagramMeta>;

export type DiagramId = keyof typeof DIAGRAMS;

export const DIAGRAM_IDS = Object.keys(DIAGRAMS) as DiagramId[];

export function isDiagramId(value: string): value is DiagramId {
  return Object.hasOwn(DIAGRAMS, value);
}
