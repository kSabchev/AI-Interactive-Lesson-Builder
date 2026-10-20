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
  "plant-parts": {
    id: "plant-parts",
    title: "Parts of a flowering plant",
    description: "A flowering plant growing in soil, shown above and below the ground.",
    topics: ["parts of a plant", "plants", "roots", "stem", "leaves", "flowers"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "flower", name: "Pink petals around a yellow centre at the top", x: 50, y: 24 },
      { id: "leaf", name: "Flat green shape on the right of the stalk", x: 61, y: 48 },
      { id: "stem", name: "Green stalk below the leaves", x: 50, y: 68 },
      { id: "roots", name: "Pale threads spreading through the soil", x: 50, y: 88 },
    ],
  },
  "butterfly-life-cycle": {
    id: "butterfly-life-cycle",
    title: "The life cycle of a butterfly",
    description: "Eggs on a leaf, a caterpillar, a chrysalis and a butterfly, joined in a loop of arrows.",
    topics: ["butterfly", "life cycle", "metamorphosis", "caterpillar", "insects"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "egg", name: "Tiny pale dots on a leaf at the top", x: 50, y: 16 },
      { id: "caterpillar", name: "Striped crawling creature on a twig on the right", x: 81, y: 54 },
      { id: "chrysalis", name: "Green case hanging from a twig at the bottom", x: 50, y: 86 },
      { id: "butterfly", name: "Insect with orange wings on the left", x: 19, y: 50 },
    ],
  },
  "states-of-matter": {
    id: "states-of-matter",
    title: "Solids, liquids and gases",
    description:
      "An ice cube, a glass of water and rising steam, each above a box showing its particles, with warming arrows from solid to liquid to gas.",
    topics: ["states of matter", "solid", "liquid", "gas", "melting", "evaporation", "particles"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "solid", name: "Ice cube on the left, with tightly packed particles below", x: 20, y: 41 },
      { id: "liquid", name: "Glass of water in the middle, with close but jumbled particles below", x: 50, y: 43 },
      { id: "gas", name: "Steam rising on the right, with spread-out particles below", x: 81, y: 33 },
      { id: "melting", name: "Warming arrow from the ice to the water", x: 34.5, y: 50 },
      { id: "evaporation", name: "Warming arrow from the water to the steam", x: 66, y: 50 },
    ],
  },
  "moon-phases": {
    id: "moon-phases",
    title: "Phases of the Moon",
    description:
      "Four moons across a night sky in the order they happen, as seen from the Northern Hemisphere: dark, lit on the right half, fully lit, lit on the left half.",
    topics: ["moon", "phases of the moon", "lunar cycle", "night sky", "space"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "new-moon", name: "Dark circle you can hardly see, on the far left", x: 16.25, y: 50 },
      { id: "first-quarter", name: "Circle with its right half lit", x: 38.75, y: 50 },
      { id: "full-moon", name: "Circle that is fully lit", x: 61.25, y: 50 },
      { id: "last-quarter", name: "Circle with its left half lit, on the far right", x: 83.75, y: 50 },
    ],
  },
  "food-chain": {
    id: "food-chain",
    title: "A food chain",
    description: "The Sun, grass and clover, a rabbit and a fox in a meadow, with arrows showing which way energy passes.",
    topics: ["food chain", "food web", "producers", "consumers", "predators", "habitats", "energy"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "sun", name: "Bright circle at the top left", x: 11, y: 16 },
      { id: "producer", name: "Grass and clover on the left", x: 25, y: 70 },
      { id: "herbivore", name: "Animal with long ears in the middle", x: 55, y: 69 },
      { id: "carnivore", name: "Orange animal with a bushy tail on the right", x: 82.5, y: 69 },
    ],
  },
  "simple-circuit": {
    id: "simple-circuit",
    title: "A simple electric circuit",
    description: "A cell, a closed switch and a lit bulb joined by wires in one loop.",
    topics: ["electricity", "circuits", "battery", "bulb", "switch", "conductors"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "bulb", name: "Glass globe shining at the top", x: 50, y: 18 },
      { id: "cell", name: "Cylinder at the bottom with a + end and a − end", x: 50, y: 80 },
      { id: "switch", name: "Lever on the left that closes the gap", x: 25, y: 53 },
      { id: "wire", name: "Line on the right joining the parts", x: 77.5, y: 55 },
    ],
  },
} as const satisfies Record<string, DiagramMeta>;

export type DiagramId = keyof typeof DIAGRAMS;

export const DIAGRAM_IDS = Object.keys(DIAGRAMS) as DiagramId[];

export function isDiagramId(value: string): value is DiagramId {
  return Object.hasOwn(DIAGRAMS, value);
}
