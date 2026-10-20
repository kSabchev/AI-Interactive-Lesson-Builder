"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { checkSorting, type SortPlacements } from "@/lib/activities/checking";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { SectionOfType } from "@/lib/lesson/schema";
import { SectionHeading } from "./SectionHeading";

export type SortingState = { placements: SortPlacements; checked: boolean };

export const initialSortingState: SortingState = { placements: {}, checked: false };

export function SortingSection({
  section,
  state,
  onChange,
}: {
  section: SectionOfType<"sorting">;
  state: SortingState;
  onChange: (state: SortingState) => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const t = useT().sections.sorting;

  const { placements, checked } = state;
  const itemsById = new Map(section.items.map((i) => [i.id, i]));
  const categoriesById = new Map(section.categories.map((c) => [c.id, c]));
  const unplaced = section.items.filter((i) => !placements[i.id]);
  const result = checkSorting(section, placements);
  const allPlaced = unplaced.length === 0;

  function selectItem(itemId: string) {
    const next = selectedItemId === itemId ? null : itemId;
    setSelectedItemId(next);
    setAnnouncement(next ? t.selected(itemsById.get(next)?.text ?? "") : "");
  }

  function place(categoryId: string) {
    if (!selectedItemId) return;
    setAnnouncement(t.put(itemsById.get(selectedItemId)?.text ?? "", categoriesById.get(categoryId)?.label ?? ""));
    onChange({ placements: { ...placements, [selectedItemId]: categoryId }, checked: false });
    setSelectedItemId(null);
  }

  function retryWrong() {
    const next = { ...placements };
    result.incorrectIds.forEach((itemId) => delete next[itemId]);
    setAnnouncement(t.backToTry(result.incorrectIds.length));
    onChange({ placements: next, checked: false });
  }

  function reset() {
    setSelectedItemId(null);
    setAnnouncement(t.resetDone);
    onChange({ placements: {}, checked: false });
  }

  const itemButton = (itemId: string) => {
    const item = itemsById.get(itemId)!;
    const isWrong = checked && result.incorrectIds.includes(itemId);
    const isRight = checked && result.correctIds.includes(itemId);
    return (
      <button
        type="button"
        aria-pressed={selectedItemId === itemId}
        onClick={() => selectItem(itemId)}
        className={cn(
          "min-h-12 w-full rounded-2xl border-2 px-4 py-2 text-left text-lg font-semibold transition-colors",
          selectedItemId === itemId
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-line bg-surface hover:border-brand-200",
          isRight && "border-good-500 bg-good-50",
          isWrong && "border-miss-500 bg-miss-50",
        )}
      >
        {isRight && <span className="sr-only">{t.correctPrefix}</span>}
        {isWrong && <span className="sr-only">{t.notQuitePrefix}</span>}
        {item.text}
      </button>
    );
  };

  return (
    <div>
      <SectionHeading kicker={t.kicker} title={section.title} />
      <p className="mb-5 text-xl md:text-2xl">{section.instructions}</p>

      {unplaced.length > 0 && (
        <ul className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label={t.examplesToSort}>
          {unplaced.map((item) => (
            <li key={item.id}>{itemButton(item.id)}</li>
          ))}
        </ul>
      )}

      <div className={cn("grid gap-4", section.categories.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {section.categories.map((category) => {
          const items = section.items.filter((i) => placements[i.id] === category.id);
          return (
            <section
              key={category.id}
              aria-label={category.label}
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-3xl border-2 border-dashed p-3 transition-colors",
                selectedItemId ? "border-brand-500 bg-brand-50" : "border-line bg-surface/60",
              )}
            >
              <h3 className="px-2 pt-1 text-xl font-extrabold">{category.label}</h3>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.id}>{itemButton(item.id)}</li>
                ))}
              </ul>
              <Button
                variant="secondary"
                className="mt-auto"
                disabled={!selectedItemId}
                onClick={() => place(category.id)}
              >
                {t.putIn(category.label)}
              </Button>
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => onChange({ ...state, checked: true })} disabled={!allPlaced}>
          {t.check}
        </Button>
        <Button variant="secondary" onClick={reset} disabled={Object.keys(placements).length === 0}>
          {t.reset}
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {checked && (
        <div role="status" className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-line">
          <p className="text-xl font-extrabold">
            {result.allCorrect ? t.allRight : t.someRight(result.correctIds.length, section.items.length)}
          </p>
          {result.incorrectIds.length > 0 && (
            <>
              <ul className="mt-3 space-y-3 text-lg">
                {result.incorrectIds.map((itemId) => {
                  const item = itemsById.get(itemId)!;
                  return (
                    <li key={itemId}>
                      <strong>{item.text}</strong> {t.belongsIn}{" "}
                      <strong>{categoriesById.get(item.categoryId)?.label}</strong>. {item.explanation}
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
