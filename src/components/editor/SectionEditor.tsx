"use client";

import { SourceList } from "@/components/lesson/SourceList";
import { DIAGRAMS, isDiagramId } from "@/lib/assets/diagrams";
import { VISUAL_IDS, type VisualId } from "@/lib/assets/visuals";
import { useT } from "@/lib/i18n/client";
import { newId, optionalText, removeAt, replaceAt } from "@/lib/lesson/edit";
import { type Lesson, type LessonSection, SHORT_TEXT_MAX, type SectionOfType, TEXT_MAX } from "@/lib/lesson/schema";
import { AddButton, EditorGroup, ListItemCard, SelectField, TextArea, TextField } from "./fields";

type EditorProps<T extends LessonSection["type"]> = {
  section: SectionOfType<T>;
  onChange: (section: SectionOfType<T>) => void;
};

const NO_VISUAL = "none";

function VisualSelect({
  value,
  onChange,
}: {
  value: VisualId | undefined;
  onChange: (value: VisualId | undefined) => void;
}) {
  const t = useT();
  return (
    <SelectField
      label={t.editor.section.picture}
      hint={t.editor.section.pictureHint}
      value={value ?? NO_VISUAL}
      options={[
        { value: NO_VISUAL, label: t.editor.section.noPicture },
        ...VISUAL_IDS.map((id) => ({ value: id, label: t.visuals[id] })),
      ]}
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
  const t = useT();
  const s = t.editor.section;
  return (
    <div className="space-y-8">
      <EditorGroup title={s.basics}>
        <TextField
          label={s.sectionTitle}
          value={section.title}
          maxLength={SHORT_TEXT_MAX}
          onChange={(title) => onChange({ ...section, title })}
        />
      </EditorGroup>

      <TypeEditor section={section} onChange={onChange} />

      {section.sourceIds.length > 0 && (
        <EditorGroup title={s.sources} description={s.sourcesDescription}>
          <SourceList lesson={lesson} ids={section.sourceIds} />
        </EditorGroup>
      )}

      <EditorGroup title={s.forTheAdult} description={s.forTheAdultDescription}>
        <TextArea
          label={s.facilitatorNote}
          value={section.facilitatorNote ?? ""}
          maxLength={TEXT_MAX}
          placeholder={s.facilitatorPlaceholder}
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
  const s = useT().editor.section;
  return (
    <EditorGroup title={s.hook}>
      <TextField
        label={s.bigQuestion}
        value={section.question}
        maxLength={SHORT_TEXT_MAX}
        onChange={(question) => onChange({ ...section, question })}
      />
      <TextArea
        label={s.story}
        value={section.body}
        maxLength={TEXT_MAX}
        onChange={(body) => onChange({ ...section, body })}
      />
      <VisualSelect value={section.visualId} onChange={(visualId) => onChange({ ...section, visualId })} />
    </EditorGroup>
  );
}

function ExplanationEditor({ section, onChange }: EditorProps<"explanation">) {
  const s = useT().editor.section;
  return (
    <>
      <EditorGroup title={s.explanation} description={s.explanationDescription}>
        {section.paragraphs.map((paragraph, i) => (
          <ListItemCard
            key={i}
            title={s.paragraph(i + 1)}
            onRemove={
              section.paragraphs.length > 1
                ? () => onChange({ ...section, paragraphs: removeAt(section.paragraphs, i) })
                : undefined
            }
          >
            <TextArea
              label={s.text}
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
          {s.addParagraph}
        </AddButton>
      </EditorGroup>

      <EditorGroup title={s.keyWords} description={s.keyWordsDescription}>
        {section.keyTerms.map((term, i) => (
          <ListItemCard
            key={i}
            title={s.keyWord(i + 1)}
            onRemove={() => onChange({ ...section, keyTerms: removeAt(section.keyTerms, i) })}
          >
            <TextField
              label={s.word}
              value={term.term}
              maxLength={SHORT_TEXT_MAX}
              onChange={(v) => onChange({ ...section, keyTerms: replaceAt(section.keyTerms, i, { ...term, term: v }) })}
            />
            <TextArea
              label={s.definition}
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
          {s.addKeyWord}
        </AddButton>
      </EditorGroup>

      <EditorGroup title={s.exampleAndPicture}>
        <TextArea
          label={s.realLifeExample}
          value={section.example ?? ""}
          maxLength={TEXT_MAX}
          placeholder={s.examplePlaceholder}
          onChange={(v) => onChange({ ...section, example: optionalText(v) })}
        />
        <VisualSelect value={section.visualId} onChange={(visualId) => onChange({ ...section, visualId })} />
      </EditorGroup>
    </>
  );
}

function PredictionEditor({ section, onChange }: EditorProps<"prediction">) {
  const s = useT().editor.section;
  const NONE = "none";
  return (
    <EditorGroup title={s.prediction} description={s.predictionDescription}>
      <TextField
        label={s.question}
        value={section.question}
        maxLength={SHORT_TEXT_MAX}
        onChange={(question) => onChange({ ...section, question })}
      />
      {section.options.map((option, i) => (
        <ListItemCard
          key={option.id}
          title={s.option(i + 1)}
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
            label={s.text}
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
        {s.addOption}
      </AddButton>
      <SelectField
        label={s.highlight}
        hint={s.highlightHint}
        value={section.answerOptionId ?? NONE}
        options={[
          { value: NONE, label: s.noHighlight },
          ...section.options.map((o, i) => ({ value: o.id, label: s.optionLabel(i + 1, o.text || s.emptyText) })),
        ]}
        onChange={(v) => onChange({ ...section, answerOptionId: v === NONE ? undefined : v })}
      />
      <TextArea
        label={s.reveal}
        value={section.reveal}
        maxLength={TEXT_MAX}
        onChange={(reveal) => onChange({ ...section, reveal })}
      />
    </EditorGroup>
  );
}

function DiagramEditor({ section, onChange }: EditorProps<"diagram-labeling">) {
  const t = useT();
  const s = t.editor.section;
  const diagram = isDiagramId(section.diagramId) ? DIAGRAMS[section.diagramId] : undefined;
  const copy = isDiagramId(section.diagramId) ? t.diagrams[section.diagramId] : undefined;
  return (
    <EditorGroup title={s.diagram} description={copy ? s.diagramDescription(copy.title) : undefined}>
      <TextArea
        label={s.instructions}
        rows={2}
        value={section.instructions}
        maxLength={TEXT_MAX}
        onChange={(instructions) => onChange({ ...section, instructions })}
      />
      {section.labels.map((label, i) => (
        <ListItemCard key={label.id} title={s.label(i + 1)}>
          <TextField
            label={s.labelText}
            value={label.text}
            maxLength={SHORT_TEXT_MAX}
            onChange={(text) => onChange({ ...section, labels: replaceAt(section.labels, i, { ...label, text }) })}
          />
          {diagram && (
            <SelectField
              label={s.correctSpot}
              value={label.targetId}
              options={diagram.targets.map((target) => ({
                value: target.id,
                label: copy?.targets[target.id] ?? target.name,
              }))}
              onChange={(targetId) =>
                onChange({ ...section, labels: replaceAt(section.labels, i, { ...label, targetId }) })
              }
            />
          )}
          <TextArea
            label={s.labelFeedback}
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
  const s = useT().editor.section;
  return (
    <>
      <EditorGroup title={s.sorting}>
        <TextArea
          label={s.instructions}
          rows={2}
          value={section.instructions}
          maxLength={TEXT_MAX}
          onChange={(instructions) => onChange({ ...section, instructions })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {section.categories.map((category, i) => (
            <TextField
              key={category.id}
              label={s.group(i + 1)}
              value={category.label}
              maxLength={SHORT_TEXT_MAX}
              onChange={(label) =>
                onChange({ ...section, categories: replaceAt(section.categories, i, { ...category, label }) })
              }
            />
          ))}
        </div>
      </EditorGroup>

      <EditorGroup title={s.examples} description={s.examplesDescription}>
        {section.items.map((item, i) => (
          <ListItemCard
            key={item.id}
            title={s.example(i + 1)}
            onRemove={
              section.items.length > 3 ? () => onChange({ ...section, items: removeAt(section.items, i) }) : undefined
            }
          >
            <TextField
              label={s.exampleText}
              value={item.text}
              maxLength={SHORT_TEXT_MAX}
              onChange={(text) => onChange({ ...section, items: replaceAt(section.items, i, { ...item, text }) })}
            />
            <SelectField
              label={s.correctGroup}
              value={item.categoryId}
              options={section.categories.map((c) => ({ value: c.id, label: c.label || s.unnamedGroup }))}
              onChange={(categoryId) =>
                onChange({ ...section, items: replaceAt(section.items, i, { ...item, categoryId }) })
              }
            />
            <TextArea
              label={s.wrongExplanation}
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
          {s.addExample}
        </AddButton>
      </EditorGroup>
    </>
  );
}

function RecapEditor({ section, onChange }: EditorProps<"recap">) {
  const s = useT().editor.section;
  return (
    <EditorGroup title={s.recap} description={s.recapDescription}>
      {section.keyPoints.map((point, i) => (
        <TextArea
          key={i}
          label={s.keyIdea(i + 1)}
          rows={2}
          value={point}
          maxLength={TEXT_MAX}
          onChange={(v) => onChange({ ...section, keyPoints: replaceAt(section.keyPoints, i, v) })}
        />
      ))}
    </EditorGroup>
  );
}
