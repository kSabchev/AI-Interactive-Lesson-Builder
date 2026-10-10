import type { DiagramId } from "@/lib/assets/diagrams";
import { WaterCycleArt } from "./WaterCycleArt";

export const DIAGRAM_ART: Record<DiagramId, () => React.ReactNode> = {
  "water-cycle": WaterCycleArt,
};
