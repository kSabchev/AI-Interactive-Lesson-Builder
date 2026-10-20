import type { DiagramId } from "@/lib/assets/diagrams";
import { ButterflyLifeCycleArt } from "./ButterflyLifeCycleArt";
import { CellsArt } from "./CellsArt";
import { DigestiveSystemArt } from "./DigestiveSystemArt";
import { FlowerPartsArt } from "./FlowerPartsArt";
import { FoodChainArt } from "./FoodChainArt";
import { HeartCirculationArt } from "./HeartCirculationArt";
import { LightShadowsArt } from "./LightShadowsArt";
import { LungsArt } from "./LungsArt";
import { MoonPhasesArt } from "./MoonPhasesArt";
import { PhotosynthesisArt } from "./PhotosynthesisArt";
import { PlantPartsArt } from "./PlantPartsArt";
import { RockCycleArt } from "./RockCycleArt";
import { SimpleCircuitArt } from "./SimpleCircuitArt";
import { SkeletonArt } from "./SkeletonArt";
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
  "digestive-system": DigestiveSystemArt,
  "heart-circulation": HeartCirculationArt,
  skeleton: SkeletonArt,
  cells: CellsArt,
  lungs: LungsArt,
  "light-shadows": LightShadowsArt,
  "rock-cycle": RockCycleArt,
  "flower-parts": FlowerPartsArt,
};
