import type { DiagramId } from "@/lib/assets/diagrams";
import { ButterflyLifeCycleArt } from "./ButterflyLifeCycleArt";
import { FoodChainArt } from "./FoodChainArt";
import { MoonPhasesArt } from "./MoonPhasesArt";
import { PhotosynthesisArt } from "./PhotosynthesisArt";
import { PlantPartsArt } from "./PlantPartsArt";
import { SimpleCircuitArt } from "./SimpleCircuitArt";
import { SolarSystemArt } from "./SolarSystemArt";
import { StatesOfMatterArt } from "./StatesOfMatterArt";
import { WaterCycleArt } from "./WaterCycleArt";

export const DIAGRAM_ART: Record<DiagramId, () => React.ReactNode> = {
  "water-cycle": WaterCycleArt,
  "solar-system": SolarSystemArt,
  photosynthesis: PhotosynthesisArt,
  "plant-parts": PlantPartsArt,
  "butterfly-life-cycle": ButterflyLifeCycleArt,
  "states-of-matter": StatesOfMatterArt,
  "moon-phases": MoonPhasesArt,
  "food-chain": FoodChainArt,
  "simple-circuit": SimpleCircuitArt,
};
