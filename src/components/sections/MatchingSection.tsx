"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { assignMatch, checkMatching, type MatchPlacements, shuffledRightSides } from "@/lib/activities/checking";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type MatchingState = { matches: MatchPlacements; checked: boolean };

export const initialMatchingState: MatchingState = { matches: {}, checked: false };

export function MatchingSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"matching">;
  state: MatchingState;
  onChange: (state: MatchingState) => void;
}) {
  const t = useT().sections.matching;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { matches, checked } = state;
  const pairsById = new Map(section.pairs.map((pair) => [pair.id, pair]));
  const rightOrder = shuffledRightSides(section);
  const result = checkMatching(section, matches);
  const allMatched = section.pairs.every((pair) => matches[pair.id]);
  const leftFor = (rightId: string) => Object.keys(matches).find((leftId) => matches[leftId] === rightId);

  function select(leftId: string) {
    const next = selectedId === leftId ? null : leftId;
    setSelectedId(next);
    setAnnouncement(next ? t.selected(pairsById.get(next)!.left) : "");
  }

  function match(rightId: string) {
    if (!selectedId) {
      setAnnouncement(t.pickFirst);
      return;
    }
    setAnnouncement(t.matched(pairsById.get(selectedId)!.left, pairsById.get(rightId)!.right));
    onChange({ matches: assignMatch(matches, selectedId, rightId), checked: false });
    setSelectedId(null);
  }

  function retryWrong() {
    const next = { ...matches };
    result.incorrectIds.forEach((leftId) => delete next[leftId]);
    setAnnouncement(t.backToTry(result.incorrectIds.length));
    onChange({ matches: next, checked: false });
  }

  function reset() {
    setSelectedId(null);
    setAnnouncement(t.resetDone);
    onChange(initialMatchingState);
  }

  const itemClass = "min-h-12 w-full rounded-2xl border-2 px-4 py-2 text-left text-lg font-semibold transition-colors";

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <ul aria-label={t.leftList} className="space-y-2">
          {section.pairs.map((pair) => {
            const chosen = matches[pair.id];
            const isRight = checked && result.correctIds.includes(pair.id);
            const isWrong = checked && result.incorrectIds.includes(pair.id);
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  aria-pressed={selectedId === pair.id}
                  aria-label={t.choose(pair.left)}
                  onClick={() => select(pair.id)}
                  className={cn(
                    itemClass,
                    selectedId === pair.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-surface hover:border-brand-200",
                    isRight && "border-good-500 bg-good-50",
                    isWrong && "border-miss-500 bg-miss-50",
                  )}
                >
                  {isRight && <span className="sr-only">{t.correctPrefix}</span>}
                  {isWrong && <span className="sr-only">{t.notQuitePrefix}</span>}
                  {pair.left}
                  {chosen && (
                    <span
                      className={cn(
                        "block text-base font-normal",
                        selectedId === pair.id ? "text-white" : "text-muted",
                      )}
                    >
                      {t.matchedWith(pairsById.get(chosen)!.right)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <ul aria-label={t.rightList} className="space-y-2">
          {rightOrder.map((rightId) => {
            const taken = leftFor(rightId);
            return (
              <li key={rightId}>
                <button
                  type="button"
                  aria-label={t.matchWith(pairsById.get(rightId)!.right)}
                  onClick={() => match(rightId)}
                  className={cn(
                    itemClass,
                    "border-dashed",
                    selectedId ? "border-brand-500 bg-brand-50" : "border-line bg-surface/60",
                    taken && !selectedId && "border-solid opacity-70",
                  )}
                >
                  {pairsById.get(rightId)!.right}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => onChange({ ...state, checked: true })} disabled={!allMatched}>
          {t.check}
        </Button>
        <Button variant="secondary" onClick={reset} disabled={Object.keys(matches).length === 0}>
          {t.reset}
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {checked && (
        <div role="status" className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-xl font-extrabold">
            {result.allCorrect ? t.allRight : t.someRight(result.correctIds.length, section.pairs.length)}
          </p>
          {result.incorrectIds.length > 0 && (
            <>
              <ul className="mt-3 space-y-3 text-lg">
                {result.incorrectIds.map((leftId) => {
                  const pair = pairsById.get(leftId)!;
                  return (
                    <li key={leftId}>
                      <strong>{pair.left}</strong> {t.goesWith} <strong>{pair.right}</strong>. {pair.explanation}
                    </li>
                  );
                })}
              </ul>
              <Button variant="secondary" className="mt-4" onClick={retryWrong}>
                {t.tryAgain}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
