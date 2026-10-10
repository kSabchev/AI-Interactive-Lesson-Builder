"use client";

import { replaceAt } from "@/lib/lesson/edit";
import { originLabel } from "@/lib/lesson/labels";
import { type Lesson, type QuizQuestion, SHORT_TEXT_MAX, TEXT_MAX } from "@/lib/lesson/schema";
import { cn } from "@/lib/cn";
import { EditorGroup, ListItemCard, SelectField, TextArea, TextField } from "./fields";

export function DetailsEditor({
  lesson,
  isSample,
  onChange,
}: {
  lesson: Lesson;
  isSample: boolean;
  onChange: (lesson: Lesson) => void;
}) {
  return (
    <EditorGroup title="Lesson details">
      <TextField
        label="Lesson title"
        value={lesson.title}
        maxLength={SHORT_TEXT_MAX}
        onChange={(title) => onChange({ ...lesson, title })}
      />
      <TextField
        label="Topic"
        value={lesson.topic}
        maxLength={SHORT_TEXT_MAX}
        onChange={(topic) => onChange({ ...lesson, topic })}
      />
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-paper/60 p-4 text-sm sm:grid-cols-4">
        {[
          ["Age group", `Ages ${lesson.ageGroup.replace("-", "–")}`],
          ["Duration", `${lesson.durationMinutes} minutes`],
          ["Template", "Explore a concept"],
          ["Content origin", originLabel(lesson, isSample)],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="font-bold text-muted">{term}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">
        Age group and duration shape how the lesson was written, so they are fixed once the lesson exists.
      </p>
    </EditorGroup>
  );
}

export function ObjectivesEditor({ lesson, onChange }: { lesson: Lesson; onChange: (lesson: Lesson) => void }) {
  return (
    <EditorGroup
      title="Learning objectives"
      description="Every lesson has exactly three. Each quiz question checks one of them."
    >
      {lesson.objectives.map((objective, i) => {
        const questionCount = lesson.quiz.filter((q) => q.objectiveId === objective.id).length;
        return (
          <TextArea
            key={objective.id}
            label={`Objective ${i + 1}`}
            hint={`Checked by ${questionCount} quiz question${questionCount === 1 ? "" : "s"}.`}
            rows={2}
            value={objective.description}
            maxLength={TEXT_MAX}
            onChange={(description) =>
              onChange({ ...lesson, objectives: replaceAt(lesson.objectives, i, { ...objective, description }) })
            }
          />
        );
      })}
    </EditorGroup>
  );
}

export function QuizQuestionEditor({
  lesson,
  question,
  index,
  onChange,
}: {
  lesson: Lesson;
  question: QuizQuestion;
  index: number;
  onChange: (question: QuizQuestion) => void;
}) {
  return (
    <div className="space-y-8">
      <EditorGroup title={`Quiz question ${index + 1}`} description="Single answer, four options. Only test what the lesson teaches.">
        <TextArea
          label="Question"
          rows={2}
          value={question.prompt}
          maxLength={TEXT_MAX}
          onChange={(prompt) => onChange({ ...question, prompt })}
        />
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">Answer options</legend>
          {question.options.map((option, i) => {
            const isCorrect = option.id === question.correctOptionId;
            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 p-3",
                  isCorrect ? "border-good-500 bg-good-50" : "border-line bg-paper/60",
                )}
              >
                <label className="mt-9 flex shrink-0 items-center gap-2 text-sm font-bold">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={isCorrect}
                    onChange={() => onChange({ ...question, correctOptionId: option.id })}
                    className="size-5 accent-good-500"
                  />
                  <span className={isCorrect ? "text-good-700" : "text-muted"}>Correct</span>
                </label>
                <TextField
                  className="flex-1"
                  label={`Option ${String.fromCharCode(65 + i)}`}
                  value={option.text}
                  maxLength={SHORT_TEXT_MAX}
                  onChange={(text) => onChange({ ...question, options: replaceAt(question.options, i, { ...option, text }) })}
                />
              </div>
            );
          })}
        </fieldset>
        <TextArea
          label="Explanation"
          hint="Shown after the learner answers, and on the results screen."
          value={question.explanation}
          maxLength={TEXT_MAX}
          onChange={(explanation) => onChange({ ...question, explanation })}
        />
      </EditorGroup>

      <EditorGroup title="What it checks" description="Used to suggest concepts to revisit when this question is missed.">
        <SelectField
          label="Learning objective"
          value={question.objectiveId}
          options={lesson.objectives.map((o, i) => ({ value: o.id, label: `${i + 1}. ${o.description}` }))}
          onChange={(objectiveId) => onChange({ ...question, objectiveId })}
        />
        <SelectField
          label="Lesson section that teaches it"
          value={question.sectionId}
          options={lesson.sections.map((s, i) => ({ value: s.id, label: `${i + 1}. ${s.title}` }))}
          onChange={(sectionId) => onChange({ ...question, sectionId })}
        />
        {lesson.sources.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-bold">Supporting sources</legend>
            <div className="space-y-2">
              {lesson.sources.map((source) => (
                <label key={source.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-5 accent-brand-600"
                    checked={question.sourceIds.includes(source.id)}
                    onChange={(e) =>
                      onChange({
                        ...question,
                        sourceIds: e.target.checked
                          ? [...question.sourceIds, source.id]
                          : question.sourceIds.filter((id) => id !== source.id),
                      })
                    }
                  />
                  {source.title}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </EditorGroup>
    </div>
  );
}

export function SourcesPanel({ lesson, isSample }: { lesson: Lesson; isSample: boolean }) {
  return (
    <EditorGroup
      title="Sources"
      description="Where the lesson content came from. Sources can't be edited here, so citations always match the material that was actually used."
    >
      <p className="rounded-2xl bg-brand-50 p-4 text-sm">
        <strong>{originLabel(lesson, isSample)}.</strong>{" "}
        {lesson.contentOrigin === "ai-draft"
          ? "This lesson was generated without supplied evidence. Check the facts carefully before presenting it."
          : "Checking the content still matters: a valid structure doesn't prove every fact is right."}
      </p>
      {lesson.sources.length === 0 ? (
        <p className="text-muted">No sources are attached to this lesson.</p>
      ) : (
        <ul className="space-y-3">
          {lesson.sources.map((source, i) => {
            const citedBy = lesson.quiz.filter((q) => q.sourceIds.includes(source.id)).length;
            return (
              <li key={source.id}>
                <ListItemCard title={`Source ${i + 1}`}>
                  <p className="font-bold">
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer" className="text-brand-700 underline underline-offset-2">
                        {source.title}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      source.title
                    )}
                  </p>
                  {source.excerpt && <blockquote className="border-l-4 border-line pl-3 text-muted">“{source.excerpt}”</blockquote>}
                  <p className="text-sm text-muted">
                    Supports {citedBy} quiz question{citedBy === 1 ? "" : "s"}.
                  </p>
                </ListItemCard>
              </li>
            );
          })}
        </ul>
      )}
    </EditorGroup>
  );
}
