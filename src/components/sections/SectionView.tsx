"use client";

import type { LessonSection } from "@/lib/lesson/schema";
import { DiagramLabelingSection, initialLabelingState, type LabelingState } from "./DiagramLabelingSection";
import { ExplanationSection } from "./ExplanationSection";
import { HookSection } from "./HookSection";
import { initialPredictionState, PredictionSection, type PredictionState } from "./PredictionSection";
import { RecapSection } from "./RecapSection";
import { initialSortingState, SortingSection, type SortingState } from "./SortingSection";

/** Per-section activity progress, kept by the player so it survives moving between sections. */
export type ActivityStates = Record<string, PredictionState | LabelingState | SortingState>;

export const SECTION_TYPE_LABELS: Record<LessonSection["type"], string> = {
  hook: "Hook",
  explanation: "Explanation",
  prediction: "Prediction",
  "diagram-labeling": "Diagram",
  sorting: "Sorting",
  recap: "Recap",
};

export function SectionView({
  section,
  activityStates,
  onActivityChange,
}: {
  section: LessonSection;
  activityStates: ActivityStates;
  onActivityChange: (sectionId: string, state: ActivityStates[string]) => void;
}) {
  const update = (state: ActivityStates[string]) => onActivityChange(section.id, state);

  switch (section.type) {
    case "hook":
      return <HookSection section={section} />;
    case "explanation":
      return <ExplanationSection section={section} />;
    case "recap":
      return <RecapSection section={section} />;
    case "prediction":
      return (
        <PredictionSection
          section={section}
          state={(activityStates[section.id] as PredictionState) ?? initialPredictionState}
          onChange={update}
        />
      );
    case "diagram-labeling":
      return (
        <DiagramLabelingSection
          section={section}
          state={(activityStates[section.id] as LabelingState) ?? initialLabelingState}
          onChange={update}
        />
      );
    case "sorting":
      return (
        <SortingSection
          section={section}
          state={(activityStates[section.id] as SortingState) ?? initialSortingState}
          onChange={update}
        />
      );
  }
}
