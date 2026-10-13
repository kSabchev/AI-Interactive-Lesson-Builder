"use client";

import { useState } from "react";
import { DIAGRAM_ART } from "@/components/art/diagrams";
import { Button } from "@/components/ui/Button";
import { checkLabels, type LabelPlacements } from "@/lib/activities/checking";
import { DIAGRAMS, isDiagramId } from "@/lib/assets/diagrams";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type LabelingState = { placements: LabelPlacements; checked: boolean };

export const initialLabelingState: LabelingState = { placements: {}, checked: false };

export function DiagramLabelingSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"diagram-labeling">;
  state: LabelingState;
  onChange: (state: LabelingState) => void;
}) {
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const t = useT();
  const d = t.sections.diagram;

  if (!isDiagramId(section.diagramId)) return null;
  const diagram = DIAGRAMS[section.diagramId];
  const targetName = (id: string, fallback: string) =>
    isDiagramId(section.diagramId) ? (t.diagrams[section.diagramId].targets[id] ?? fallback) : fallback;
  const Art = DIAGRAM_ART[section.diagramId];

  const { placements, checked } = state;
  const labelsById = new Map(section.labels.map((l) => [l.id, l]));
  const placedLabelIds = new Set(Object.values(placements));
  const bank = section.labels.filter((l) => !placedLabelIds.has(l.id));
  const result = checkLabels(section, placements);
  const allPlaced = placedLabelIds.size === section.labels.length;

  function selectLabel(labelId: string) {
    const next = selectedLabelId === labelId ? null : labelId;
    setSelectedLabelId(next);
    setAnnouncement(next ? d.selected(labelsById.get(next)?.text ?? "") : "");
  }

  function pressTarget(targetId: string, targetName: string) {
    const current = placements[targetId];
    const next = { ...placements };

    if (selectedLabelId) {
      // Move the selected label here; a label already on this spot returns to the bank.
      for (const [t, l] of Object.entries(next)) if (l === selectedLabelId) delete next[t];
      next[targetId] = selectedLabelId;
      setAnnouncement(d.placed(labelsById.get(selectedLabelId)?.text ?? "", targetName));
      setSelectedLabelId(null);
    } else if (current) {
      delete next[targetId];
      setAnnouncement(d.removed(labelsById.get(current)?.text ?? ""));
    } else {
      setAnnouncement(d.pickFirst);
      return;
    }
    onChange({ placements: next, checked: false });
  }

  function reset() {
    setSelectedLabelId(null);
    setAnnouncement(d.resetDone);
    onChange({ placements: {}, checked: false });
  }

  return (
    <div>
      <SectionHeading kicker={d.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div
          className="relative w-full overflow-hidden rounded-3xl shadow-sm ring-1 ring-line"
          style={{ aspectRatio: diagram.aspectRatio }}
        >
          <Art />
          {diagram.targets.map((target) => {
            const label = placements[target.id] ? labelsById.get(placements[target.id]) : undefined;
            const isCorrect = checked && result.correctIds.includes(target.id);
            const isWrong = checked && result.incorrectIds.includes(target.id);
            const name = targetName(target.id, target.name);
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => pressTarget(target.id, name)}
                aria-label={`${name}: ${label ? label.text : d.empty}${isCorrect ? d.correct : ""}${isWrong ? d.notQuite : ""}`}
                className={cn(
                  "absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] px-3 py-1.5 text-sm font-extrabold shadow-md transition-colors sm:text-base",
                  label ? "bg-surface" : "border-dashed bg-surface/80",
                  selectedLabelId && !label && "animate-pulse border-brand-500",
                  !checked && (label ? "border-brand-500 text-brand-700" : "border-brand-500/60 text-muted"),
                  isCorrect && "border-good-500 bg-good-50 text-good-700",
                  isWrong && "border-miss-500 bg-miss-50 text-miss-700",
                )}
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
              >
                {label ? label.text : "?"}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 font-extrabold text-muted" id={`${section.id}-bank`}>
              {d.labels}
            </p>
            <ul className="flex flex-wrap gap-2 lg:flex-col" aria-labelledby={`${section.id}-bank`}>
              {bank.map((label) => (
                <li key={label.id}>
                  <button
                    type="button"
                    aria-pressed={selectedLabelId === label.id}
                    onClick={() => selectLabel(label.id)}
                    className={cn(
                      "min-h-12 w-full rounded-2xl border-2 px-4 text-lg font-bold transition-colors",
                      selectedLabelId === label.id
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-surface hover:border-brand-200",
                    )}
                  >
                    {label.text}
                  </button>
                </li>
              ))}
              {bank.length === 0 && <li className="text-muted">{d.allPlaced}</li>}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onChange({ ...state, checked: true })} disabled={!allPlaced}>
              {d.check}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={placedLabelIds.size === 0}>
              {d.reset}
            </Button>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {checked && (
        <div role="status" className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-xl font-extrabold">
            {result.allCorrect ? d.allRight : d.someRight(result.correctIds.length, section.labels.length)}
          </p>
          <ul className="mt-3 space-y-2 text-lg">
            {section.labels.map((label) => {
              const ok = placements[label.targetId] === label.id;
              return (
                <li key={label.id} className="flex gap-2">
                  <span aria-hidden="true" className={ok ? "text-good-500" : "text-miss-500"}>
                    {ok ? "✔" : "✘"}
                  </span>
                  <span>
                    <strong>{label.text}:</strong> {ok ? label.explanation : d.notYet}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
