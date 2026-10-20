"use client";

import type { LessonSection } from "@/lib/lesson/schema";
import { DiagramLabelingSection, initialLabelingState, type LabelingState } from "./DiagramLabelingSection";
import { DiscussionSection, type DiscussionState, initialDiscussionState } from "./DiscussionSection";
import { ExperimentSection, type ExperimentState, initialExperimentState } from "./ExperimentSection";
import { ExplanationSection } from "./ExplanationSection";
import { HookSection } from "./HookSection";
import { initialMatchingState, MatchingSection, type MatchingState } from "./MatchingSection";
import { initialMythOrFactState, MythOrFactSection, type MythOrFactState } from "./MythOrFactSection";
import { initialPredictionState, PredictionSection, type PredictionState } from "./PredictionSection";
import { RecapSection } from "./RecapSection";
import { initialSequenceState, SequenceSection, type SequenceState } from "./SequenceSection";
import { initialSortingState, SortingSection, type SortingState } from "./SortingSection";

/** Per-section activity progress, kept by the player so it survives moving between sections. */
export type ActivityStates = Record<
  string,
  | PredictionState
  | LabelingState
  | SortingState
  | SequenceState
  | MatchingState
  | ExperimentState
  | MythOrFactState
  | DiscussionState
>;

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
    case "sequence":
      return (
        <SequenceSection
          section={section}
          state={(activityStates[section.id] as SequenceState) ?? initialSequenceState}
          onChange={update}
        />
      );
    case "matching":
      return (
        <MatchingSection
          section={section}
          state={(activityStates[section.id] as MatchingState) ?? initialMatchingState}
          onChange={update}
        />
      );
    case "myth-or-fact":
      return (
        <MythOrFactSection
          section={section}
          state={(activityStates[section.id] as MythOrFactState) ?? initialMythOrFactState}
          onChange={update}
        />
      );
    case "discussion":
      return (
        <DiscussionSection
          section={section}
          state={(activityStates[section.id] as DiscussionState) ?? initialDiscussionState}
          onChange={update}
        />
      );
    case "experiment":
      return (
        <ExperimentSection
          section={section}
          state={(activityStates[section.id] as ExperimentState) ?? initialExperimentState}
          onChange={update}
        />
      );
  }
}
