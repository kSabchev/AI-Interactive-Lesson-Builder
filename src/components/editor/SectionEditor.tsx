"use client";

import { DIAGRAMS, isDiagramId } from "@/lib/assets/diagrams";
import { VISUALS, type VisualId } from "@/lib/assets/visuals";
import { newId, optionalText, removeAt, replaceAt } from "@/lib/lesson/edit";
import { SourceList } from "@/components/lesson/SourceList";
import { type Lesson, type LessonSection, SHORT_TEXT_MAX, type SectionOfType, TEXT_MAX } from "@/lib/lesson/schema";
import { AddButton, EditorGroup, ListItemCard, SelectField, TextArea, TextField } from "./fields";

type EditorProps<T extends LessonSection["type"]> = {
  section: SectionOfType<T>;
  onChange: (section: SectionOfType<T>) => void;
};

const NO_VISUAL = "none";
const visualOptions = [
  { value: NO_VISUAL, label: "No picture" },
  ...Object.entries(VISUALS).map(([value, label]) => ({ value, label })),
];

function VisualSelect({
  value,
  onChange,
}: {
  value: VisualId | undefined;
  onChange: (value: VisualId | undefined) => void;
}) {
  return (
    <SelectField
      label="Picture"
      hint="Pictures come from an approved set so they always match the content."
      value={value ?? NO_VISUAL}
      options={visualOptions}
      onChange={(v) => onChange(v === NO_VISUAL ? undefined : (v as VisualId))}
    />
  );
}

export function SectionEditor({
  lesson,
  section,
  onChange,
}: {
  lesson: Lesson;
  section: LessonSection;
  onChange: (section: LessonSection) => void;
}) {
  return (
    <div className="space-y-8">
      <EditorGroup title="Basics">
        <TextField
          label="Section title"
          value={section.title}
          maxLength={SHORT_TEXT_MAX}
          onChange={(title) => onChange({ ...section, title })}
        />
      </EditorGroup>

      <TypeEditor section={section} onChange={onChange} />

      {section.sourceIds.length > 0 && (
        <EditorGroup
          title="Sources"
          description="The evidence this section was written from. If you change what it says, check it still matches."
        >
          <SourceList lesson={lesson} ids={section.sourceIds} />
        </EditorGroup>
      )}

      <EditorGroup title="For the adult" description="Shown in the player only when facilitator notes are switched on.">
        <TextArea
          label="Facilitator note"
          value={section.facilitatorNote ?? ""}
          maxLength={TEXT_MAX}
          placeholder="Optional guidance, questions to ask, or demonstrations to try."
          onChange={(v) => onChange({ ...section, facilitatorNote: optionalText(v) })}
        />
      </EditorGroup>
    </div>
  );
}

function TypeEditor({ section, onChange }: { section: LessonSection; onChange: (section: LessonSection) => void }) {
  switch (section.type) {
    case "hook":
      return <HookEditor section={section} onChange={onChange} />;
    case "explanation":
      return <ExplanationEditor section={section} onChange={onChange} />;
    case "prediction":
      return <PredictionEditor section={section} onChange={onChange} />;
    case "diagram-labeling":
      return <DiagramEditor section={section} onChange={onChange} />;
    case "sorting":
      return <SortingEditor section={section} onChange={onChange} />;
    case "recap":
      return <RecapEditor section={section} onChange={onChange} />;
  }
}

function HookEditor({ section, onChange }: EditorProps<"hook">) {
  return (
    <EditorGroup title="Hook">
      <TextField
        label="Big question"
        value={section.question}
        maxLength={SHORT_TEXT_MAX}
        onChange={(question) => onChange({ ...section, question })}
      />
      <TextArea
        label="Story"
        value={section.body}
        maxLength={TEXT_MAX}
        onChange={(body) => onChange({ ...section, body })}
      />
      <VisualSelect value={section.visualId} onChange={(visualId) => onChange({ ...section, visualId })} />
    </EditorGroup>
  );
}

function ExplanationEditor({ section, onChange }: EditorProps<"explanation">) {
  return (
    <>
      <EditorGroup title="Explanation" description="Keep each paragraph to one idea. Up to 4 paragraphs.">
        {section.paragraphs.map((paragraph, i) => (
          <ListItemCard
            key={i}
            title={`Paragraph ${i + 1}`}
            onRemove={
              section.paragraphs.length > 1
                ? () => onChange({ ...section, paragraphs: removeAt(section.paragraphs, i) })
                : undefined
            }
          >
            <TextArea
              label="Text"
              value={paragraph}
              maxLength={TEXT_MAX}
              onChange={(v) => onChange({ ...section, paragraphs: replaceAt(section.paragraphs, i, v) })}
            />
          </ListItemCard>
        ))}
        <AddButton
          disabled={section.paragraphs.length >= 4}
          onClick={() => onChange({ ...section, paragraphs: [...section.paragraphs, ""] })}
        >
          Add paragraph
        </AddButton>
      </EditorGroup>

      <EditorGroup title="Key words" description="Define unfamiliar words. Up to 4.">
        {section.keyTerms.map((term, i) => (
          <ListItemCard
            key={i}
            title={`Key word ${i + 1}`}
            onRemove={() => onChange({ ...section, keyTerms: removeAt(section.keyTerms, i) })}
          >
            <TextField
              label="Word"
              value={term.term}
              maxLength={SHORT_TEXT_MAX}
              onChange={(v) => onChange({ ...section, keyTerms: replaceAt(section.keyTerms, i, { ...term, term: v }) })}
            />
            <TextArea
              label="Definition"
              rows={2}
              value={term.definition}
              maxLength={TEXT_MAX}
              onChange={(v) =>
                onChange({ ...section, keyTerms: replaceAt(section.keyTerms, i, { ...term, definition: v }) })
              }
            />
          </ListItemCard>
        ))}
        <AddButton
          disabled={section.keyTerms.length >= 4}
          onClick={() => onChange({ ...section, keyTerms: [...section.keyTerms, { term: "", definition: "" }] })}
        >
          Add key word
        </AddButton>
      </EditorGroup>

      <EditorGroup title="Example and picture">
        <TextArea
          label="Real-life example"
          value={section.example ?? ""}
          maxLength={TEXT_MAX}
          placeholder="Optional: a concrete, everyday example."
          onChange={(v) => onChange({ ...section, example: optionalText(v) })}
        />
        <VisualSelect value={section.visualId} onChange={(visualId) => onChange({ ...section, visualId })} />
      </EditorGroup>
    </>
  );
}

function PredictionEditor({ section, onChange }: EditorProps<"prediction">) {
  const NONE = "none";
  return (
    <EditorGroup
      title="Prediction"
      description="Predictions are never scored — they get learners thinking before the explanation."
    >
      <TextField
        label="Question"
        value={section.question}
        maxLength={SHORT_TEXT_MAX}
        onChange={(question) => onChange({ ...section, question })}
      />
      {section.options.map((option, i) => (
        <ListItemCard
          key={option.id}
          title={`Option ${i + 1}`}
          onRemove={
            section.options.length > 2
              ? () =>
                  onChange({
                    ...section,
                    options: removeAt(section.options, i),
                    answerOptionId: section.answerOptionId === option.id ? undefined : section.answerOptionId,
                  })
              : undefined
          }
        >
          <TextField
            label="Text"
            value={option.text}
            maxLength={SHORT_TEXT_MAX}
            onChange={(text) => onChange({ ...section, options: replaceAt(section.options, i, { ...option, text }) })}
          />
        </ListItemCard>
      ))}
      <AddButton
        disabled={section.options.length >= 4}
        onClick={() => onChange({ ...section, options: [...section.options, { id: newId("opt"), text: "" }] })}
      >
        Add option
      </AddButton>
      <SelectField
        label="Highlight after the reveal"
        hint="Optional: the option the reveal marks as what really happens."
        value={section.answerOptionId ?? NONE}
        options={[
          { value: NONE, label: "Don't highlight an option" },
          ...section.options.map((o, i) => ({ value: o.id, label: `Option ${i + 1}: ${o.text || "(empty)"}` })),
        ]}
        onChange={(v) => onChange({ ...section, answerOptionId: v === NONE ? undefined : v })}
      />
      <TextArea
        label="Reveal explanation"
        value={section.reveal}
        maxLength={TEXT_MAX}
        onChange={(reveal) => onChange({ ...section, reveal })}
      />
    </EditorGroup>
  );
}

function DiagramEditor({ section, onChange }: EditorProps<"diagram-labeling">) {
  const diagram = isDiagramId(section.diagramId) ? DIAGRAMS[section.diagramId] : undefined;
  return (
    <EditorGroup
      title="Diagram labeling"
      description={diagram ? `Diagram: ${diagram.title}. Each label must go on a different spot.` : undefined}
    >
      <TextArea
        label="Instructions"
        rows={2}
        value={section.instructions}
        maxLength={TEXT_MAX}
        onChange={(instructions) => onChange({ ...section, instructions })}
      />
      {section.labels.map((label, i) => (
        <ListItemCard key={label.id} title={`Label ${i + 1}`}>
          <TextField
            label="Label text"
            value={label.text}
            maxLength={SHORT_TEXT_MAX}
            onChange={(text) => onChange({ ...section, labels: replaceAt(section.labels, i, { ...label, text }) })}
          />
          {diagram && (
            <SelectField
              label="Correct spot on the diagram"
              value={label.targetId}
              options={diagram.targets.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(targetId) =>
                onChange({ ...section, labels: replaceAt(section.labels, i, { ...label, targetId }) })
              }
            />
          )}
          <TextArea
            label="Feedback when placed correctly"
            rows={2}
            value={label.explanation}
            maxLength={TEXT_MAX}
            onChange={(explanation) =>
              onChange({ ...section, labels: replaceAt(section.labels, i, { ...label, explanation }) })
            }
          />
        </ListItemCard>
      ))}
    </EditorGroup>
  );
}

function SortingEditor({ section, onChange }: EditorProps<"sorting">) {
  return (
    <>
      <EditorGroup title="Sorting">
        <TextArea
          label="Instructions"
          rows={2}
          value={section.instructions}
          maxLength={TEXT_MAX}
          onChange={(instructions) => onChange({ ...section, instructions })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {section.categories.map((category, i) => (
            <TextField
              key={category.id}
              label={`Group ${i + 1}`}
              value={category.label}
              maxLength={SHORT_TEXT_MAX}
              onChange={(label) =>
                onChange({ ...section, categories: replaceAt(section.categories, i, { ...category, label }) })
              }
            />
          ))}
        </div>
      </EditorGroup>

      <EditorGroup title="Examples to sort" description="Between 3 and 8 examples.">
        {section.items.map((item, i) => (
          <ListItemCard
            key={item.id}
            title={`Example ${i + 1}`}
            onRemove={
              section.items.length > 3 ? () => onChange({ ...section, items: removeAt(section.items, i) }) : undefined
            }
          >
            <TextField
              label="Example"
              value={item.text}
              maxLength={SHORT_TEXT_MAX}
              onChange={(text) => onChange({ ...section, items: replaceAt(section.items, i, { ...item, text }) })}
            />
            <SelectField
              label="Correct group"
              value={item.categoryId}
              options={section.categories.map((c) => ({ value: c.id, label: c.label || "(unnamed group)" }))}
              onChange={(categoryId) =>
                onChange({ ...section, items: replaceAt(section.items, i, { ...item, categoryId }) })
              }
            />
            <TextArea
              label="Explanation if placed wrongly"
              rows={2}
              value={item.explanation}
              maxLength={TEXT_MAX}
              onChange={(explanation) =>
                onChange({ ...section, items: replaceAt(section.items, i, { ...item, explanation }) })
              }
            />
          </ListItemCard>
        ))}
        <AddButton
          disabled={section.items.length >= 8}
          onClick={() =>
            onChange({
              ...section,
              items: [
                ...section.items,
                { id: newId("item"), text: "", categoryId: section.categories[0].id, explanation: "" },
              ],
            })
          }
        >
          Add example
        </AddButton>
      </EditorGroup>
    </>
  );
}

function RecapEditor({ section, onChange }: EditorProps<"recap">) {
  return (
    <EditorGroup title="Recap" description="Exactly three key ideas to reinforce.">
      {section.keyPoints.map((point, i) => (
        <TextArea
          key={i}
          label={`Key idea ${i + 1}`}
          rows={2}
          value={point}
          maxLength={TEXT_MAX}
          onChange={(v) => onChange({ ...section, keyPoints: replaceAt(section.keyPoints, i, v) })}
        />
      ))}
    </EditorGroup>
  );
}
