/** Approved illustrations a hook or explanation section may display. */
export const VISUALS = {
  "puddle-sun": "A puddle drying in the sunshine",
  "rising-vapor": "Warm water vapour rising from a lake",
  "cold-glass": "Droplets forming on a cold glass",
  "rain-cloud": "A heavy cloud releasing rain",
} as const;

export type VisualId = keyof typeof VISUALS;

export const VISUAL_IDS = Object.keys(VISUALS) as [VisualId, ...VisualId[]];
