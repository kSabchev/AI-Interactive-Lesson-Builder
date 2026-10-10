import type { DiagramId } from "@/lib/assets/diagrams";
import { PhotosynthesisArt } from "./PhotosynthesisArt";
import { SolarSystemArt } from "./SolarSystemArt";
import { WaterCycleArt } from "./WaterCycleArt";

export const DIAGRAM_ART: Record<DiagramId, () => React.ReactNode> = {
  "water-cycle": WaterCycleArt,
  "solar-system": SolarSystemArt,
  photosynthesis: PhotosynthesisArt,
};
