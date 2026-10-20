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
    description:
      "The Sun, grass and clover, a rabbit and a fox in a meadow, with arrows showing which way energy passes.",
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
  "digestive-system": {
    id: "digestive-system",
    title: "The human digestive system",
    description:
      "A body seen from the front with the mouth, the tube down the neck, the liver, the stomach and the small and large intestines.",
    topics: ["digestion", "digestive system", "stomach", "intestines", "food", "human body", "teeth"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "mouth", name: "Opening in the face at the top", x: 50, y: 17 },
      { id: "oesophagus", name: "Tube running down the neck", x: 50, y: 31 },
      { id: "liver", name: "Large dark-red organ on the left of the upper belly", x: 41, y: 47 },
      { id: "stomach", name: "Pink pouch on the right of the upper belly", x: 58, y: 51 },
      { id: "small-intestine", name: "Long, tightly coiled tube in the middle", x: 50, y: 76 },
      { id: "large-intestine", name: "Wider brown tube around the coils, on the right", x: 61.5, y: 76 },
    ],
  },
  "heart-circulation": {
    id: "heart-circulation",
    title: "The heart and blood circulation",
    description:
      "A loop diagram: the lungs at the top, the heart in the middle and the rest of the body at the bottom, joined by red and blue blood vessels with arrows.",
    topics: ["heart", "circulation", "circulatory system", "blood", "blood vessels", "arteries", "veins", "pulse"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "lungs", name: "Two pink lobes at the top", x: 50, y: 18 },
      { id: "heart", name: "Organ in the middle, half red and half blue", x: 50, y: 52 },
      { id: "artery", name: "Red tube on the right carrying blood down, away from the middle", x: 77.5, y: 70 },
      { id: "vein", name: "Blue tube on the left carrying blood up, back to the middle", x: 22.5, y: 70 },
      { id: "body", name: "Rounded block of cells at the bottom", x: 50, y: 88 },
    ],
  },
  skeleton: {
    id: "skeleton",
    title: "The human skeleton",
    description: "A human skeleton standing, seen from the front.",
    topics: ["skeleton", "bones", "human body", "muscles", "movement", "joints", "skull"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "skull", name: "Rounded bone case at the top", x: 50, y: 10 },
      { id: "ribcage", name: "Curved bones forming a cage across the chest", x: 50, y: 33 },
      { id: "spine", name: "Column of small bones in the lower back", x: 50, y: 48 },
      { id: "pelvis", name: "Wide, bowl-shaped bones at the hips", x: 43.75, y: 56 },
      { id: "femur", name: "Longest bone, in the upper leg on the right", x: 55, y: 69 },
    ],
  },
  cells: {
    id: "cells",
    title: "Plant and animal cells",
    description:
      "An animal cell on the left and a plant cell on the right, as seen under a microscope, each with its main parts.",
    topics: ["cells", "plant cells", "animal cells", "microscope", "living things", "organisms", "chloroplasts"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "nucleus", name: "Purple round part in the middle of the left-hand cell", x: 25, y: 50 },
      { id: "cell-membrane", name: "Thin outer edge of the left-hand cell", x: 5.75, y: 53 },
      { id: "cytoplasm", name: "Jelly-like filling of the left-hand cell", x: 34.5, y: 69 },
      { id: "cell-wall", name: "Thick, stiff outer layer of the right-hand cell", x: 96.5, y: 40 },
      { id: "vacuole", name: "Large pale-blue sac in the right-hand cell", x: 77.5, y: 50 },
      { id: "chloroplast", name: "Small green ovals near the bottom of the right-hand cell", x: 63, y: 76 },
    ],
  },
  lungs: {
    id: "lungs",
    title: "The lungs and breathing",
    description:
      "A chest seen from the front with the windpipe, its two branches, both lungs, the muscle below them and a magnified circle showing tiny air sacs.",
    topics: ["lungs", "breathing", "respiratory system", "gas exchange", "oxygen", "human body", "exercise"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "trachea", name: "Ringed tube coming down from the throat", x: 50, y: 20 },
      { id: "bronchus", name: "Branch where the tube splits, on the right", x: 56.5, y: 41 },
      { id: "lung", name: "Large spongy pink organ on the left", x: 37.5, y: 60 },
      { id: "diaphragm", name: "Dome-shaped red sheet below the chest", x: 50, y: 84 },
      { id: "alveoli", name: "Bunch of tiny bubbles, magnified in the circle", x: 85, y: 27 },
    ],
  },
  "light-shadows": {
    id: "light-shadows",
    title: "Light, reflection and shadows",
    description:
      "A torch shining on a block that casts a shadow on a wall, and a ray from the torch bouncing off a mirror into an eye.",
    topics: ["light", "shadows", "reflection", "mirrors", "how we see", "opaque", "light sources"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "light-source", name: "Torch on the left", x: 11.5, y: 60 },
      { id: "ray", name: "Straight line with an arrow going up from the torch", x: 33.5, y: 36 },
      { id: "mirror", name: "Tilted shiny strip at the top", x: 50, y: 16 },
      { id: "opaque-object", name: "Orange block in the beam", x: 51.25, y: 60 },
      { id: "shadow", name: "Dark patch on the wall on the right", x: 95, y: 60 },
      { id: "eye", name: "Where the bounced ray ends, on the right", x: 79, y: 27 },
    ],
  },
  "rock-cycle": {
    id: "rock-cycle",
    title: "The rock cycle",
    description:
      "A cut-away landscape: a volcano fed by molten rock deep below, a mountain worn away by rain, a river carrying bits to the sea, layers on the sea floor and folded bands deep underground.",
    topics: ["rocks", "rock cycle", "volcanoes", "erosion", "fossils", "soils", "earth science"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "magma", name: "Glowing orange pool deep under the volcano", x: 23.75, y: 84 },
      { id: "igneous", name: "Dark rock on the volcano's slope", x: 30, y: 40 },
      { id: "weathering", name: "Rain and cracks wearing away the mountain", x: 55, y: 32 },
      { id: "sedimentary", name: "Flat striped layers on the sea floor", x: 86, y: 62 },
      { id: "metamorphic", name: "Squeezed, wavy bands deep underground on the right", x: 72, y: 88 },
    ],
  },
  "flower-parts": {
    id: "flower-parts",
    title: "Parts of a flower",
    description: "A flower cut in half to show the parts inside, with a bee flying nearby.",
    topics: ["flowers", "pollination", "plant reproduction", "seeds", "life cycle of plants", "bees"],
    aspectRatio: 8 / 5,
    targets: [
      { id: "petal", name: "Large pink part on the left", x: 27.5, y: 40 },
      { id: "stigma", name: "Sticky tip at the top of the middle stalk", x: 47.5, y: 33 },
      { id: "stamen", name: "Thin stalk with a dusty yellow tip, on the right", x: 58, y: 38 },
      { id: "ovary", name: "Rounded chamber at the base, with tiny beads inside", x: 47.5, y: 64 },
      { id: "sepal", name: "Small green leaf-like part at the base, on the right", x: 55, y: 71 },
      { id: "pollen", name: "Yellow dust on the bee's legs", x: 83, y: 29 },
    ],
  },
} as const satisfies Record<string, DiagramMeta>;

export type DiagramId = keyof typeof DIAGRAMS;

export const DIAGRAM_IDS = Object.keys(DIAGRAMS) as DiagramId[];

export function isDiagramId(value: string): value is DiagramId {
  return Object.hasOwn(DIAGRAMS, value);
}
