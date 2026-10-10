/** Approved illustrations a hook or explanation section may display. */
export const VISUALS = {
  "puddle-sun": "A puddle drying in the sunshine",
  "rising-vapor": "Warm water vapour rising from a lake",
  "cold-glass": "Droplets forming on a cold glass",
  "rain-cloud": "A heavy cloud releasing rain",
  "sunrise-horizon": "The Sun rising over hills in the morning",
  "earth-day-night": "Earth with a sunlit day side and a dark night side",
  "seed-to-tree": "A seed, a sapling and a tall tree side by side",
  "leaf-closeup": "A green leaf with tiny pores and veins",
} as const;

export type VisualId = keyof typeof VISUALS;

export const VISUAL_IDS = Object.keys(VISUALS) as [VisualId, ...VisualId[]];
