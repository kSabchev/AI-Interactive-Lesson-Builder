"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { replaceAt } from "@/lib/lesson/edit";
import { originLabel } from "@/lib/lesson/labels";
import { type Lesson, type QuizQuestion, SHORT_TEXT_MAX, TEXT_MAX } from "@/lib/lesson/schema";
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
  const t = useT();
  const d = t.editor.details;
  return (
    <EditorGroup title={d.title}>
      <TextField
        label={d.lessonTitle}
        value={lesson.title}
        maxLength={SHORT_TEXT_MAX}
        onChange={(title) => onChange({ ...lesson, title })}
      />
      <TextField
        label={d.topic}
        value={lesson.topic}
        maxLength={SHORT_TEXT_MAX}
        onChange={(topic) => onChange({ ...lesson, topic })}
      />
      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-paper/60 p-4 text-sm sm:grid-cols-3">
        {[
          [d.ageGroup, t.common.ageGroups[lesson.ageGroup]],
          [d.duration, t.common.minutesLong(lesson.durationMinutes)],
          [d.language, t.language.names[lesson.language]],
          [d.template, d.templateName],
          [d.origin, originLabel(lesson, isSample, t)],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="font-bold text-muted">{term}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted">{d.fixedNote}</p>
    </EditorGroup>
  );
}

export function ObjectivesEditor({ lesson, onChange }: { lesson: Lesson; onChange: (lesson: Lesson) => void }) {
  const o = useT().editor.objectives;
  return (
    <EditorGroup title={o.title} description={o.description}>
      {lesson.objectives.map((objective, i) => {
        const questionCount = lesson.quiz.filter((q) => q.objectiveId === objective.id).length;
        return (
          <TextArea
            key={objective.id}
            label={o.label(i + 1)}
            hint={o.checkedBy(questionCount)}
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
  const q = useT().editor.question;
  return (
    <div className="space-y-8">
      <EditorGroup title={q.title(index + 1)} description={q.description}>
        <TextArea
          label={q.question}
          rows={2}
          value={question.prompt}
          maxLength={TEXT_MAX}
          onChange={(prompt) => onChange({ ...question, prompt })}
        />
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">{q.options}</legend>
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
                  <span className={isCorrect ? "text-good-700" : "text-muted"}>{q.correct}</span>
                </label>
                <TextField
                  className="flex-1"
                  label={q.option(String.fromCharCode(65 + i))}
                  value={option.text}
                  maxLength={SHORT_TEXT_MAX}
                  onChange={(text) =>
                    onChange({ ...question, options: replaceAt(question.options, i, { ...option, text }) })
                  }
                />
              </div>
            );
          })}
        </fieldset>
        <TextArea
          label={q.explanation}
          hint={q.explanationHint}
          value={question.explanation}
          maxLength={TEXT_MAX}
          onChange={(explanation) => onChange({ ...question, explanation })}
        />
      </EditorGroup>

      <EditorGroup title={q.checksTitle} description={q.checksDescription}>
        <SelectField
          label={q.objective}
          value={question.objectiveId}
          options={lesson.objectives.map((o, i) => ({ value: o.id, label: `${i + 1}. ${o.description}` }))}
          onChange={(objectiveId) => onChange({ ...question, objectiveId })}
        />
        <SelectField
          label={q.section}
          value={question.sectionId}
          options={lesson.sections.map((s, i) => ({ value: s.id, label: `${i + 1}. ${s.title}` }))}
          onChange={(sectionId) => onChange({ ...question, sectionId })}
        />
        {lesson.sources.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-bold">{q.sources}</legend>
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
  const t = useT();
  const s = t.editor.sources;
  return (
    <EditorGroup title={s.title} description={s.description}>
      <p className="rounded-2xl bg-brand-50 p-4 text-sm">
        <strong>{originLabel(lesson, isSample, t)}.</strong> {lesson.contentOrigin === "ai-draft" ? s.aiDraft : s.general}
      </p>
      {lesson.sources.length === 0 ? (
        <p className="text-muted">{s.none}</p>
      ) : (
        <ul className="space-y-3">
          {lesson.sources.map((source, i) => {
            const citedBy = lesson.quiz.filter((q) => q.sourceIds.includes(source.id)).length;
            return (
              <li key={source.id}>
                <ListItemCard title={s.source(i + 1)}>
                  <p className="font-bold">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 underline underline-offset-2"
                      >
                        {source.title}
                        <span className="sr-only">{t.common.opensInNewTab}</span>
                      </a>
                    ) : (
                      source.title
                    )}
                  </p>
                  {source.excerpt && (
                    <blockquote className="border-l-4 border-line pl-3 text-muted">“{source.excerpt}”</blockquote>
                  )}
                  <p className="text-sm text-muted">{s.supports(citedBy)}</p>
                </ListItemCard>
              </li>
            );
          })}
        </ul>
      )}
    </EditorGroup>
  );
}
