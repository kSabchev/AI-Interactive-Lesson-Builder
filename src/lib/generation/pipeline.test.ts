import { describe, expect, it } from "vitest";
import { lessonSchema } from "@/lib/lesson/schema";
import { GenerationError, type GenerationEvent, type Stage } from "./events";
import type { GenerationInput } from "./input";
import { type ConversationTurn, generateLesson, type ModelClient, type ModelReply } from "./pipeline";
import type { Content, Outline, Quiz } from "./stages";

const input: GenerationInput = {
  topic: "How magnets work",
  ageGroup: "8-10",
  durationMinutes: 10,
  quality: "standard",
  research: false,
};

const planned = (title: string, objectives: ("1" | "2" | "3")[]) => ({ title, focus: `About ${title}`, objectives });

function outline(diagramId: Outline["diagramId"] = "none"): Outline {
  return {
    title: "The Invisible Pull: Magnets",
    objectives: ["Describe what magnets attract.", "Explain north and south poles.", "Identify everyday uses of magnets."],
    diagramId,
    sections: {
      hook: planned("A fridge mystery", []),
      prediction: planned("Make a guess", ["1"]),
      explain1: planned("What magnets pull", ["1", "2"]),
      activity: planned("Try it out", ["2"]),
      explain2: planned("Magnets around us", ["3"]),
      sorting: planned("Sticks or not?", ["1"]),
      recap: planned("Three big ideas", ["1", "2", "3"]),
    },
  };
}

const prediction = {
  question: "Will a magnet pick up a paperclip?",
  options: ["Yes", "No", "Only if it is wet"],
  answerIndex: 0,
  reveal: "Yes — paperclips are made of steel, which magnets attract.",
  facilitatorNote: "Ask why they think so.",
};

const explanation = {
  paragraphs: ["Magnets pull on some metals like iron and steel."],
  keyTerms: [{ term: "Magnet", definition: "An object that pulls on iron and steel." }],
  example: "Fridge magnets hold up drawings.",
  visualId: "none",
  facilitatorNote: "Show a fridge magnet if you have one.",
};

function content(activity: Content["activity"] = prediction): Content {
  return {
    hook: { question: "Why do some things stick to the fridge?", body: "Some notes stay up all by themselves.", visualId: "none", facilitatorNote: "Let them guess." },
    prediction,
    explain1: explanation,
    activity,
    explain2: explanation,
    sorting: {
      instructions: "Sort each object.",
      categories: ["Attracted", "Not attracted"],
      items: [
        { text: "Paperclip", categoryIndex: 0, explanation: "Steel is attracted." },
        { text: "Wooden spoon", categoryIndex: 1, explanation: "Wood is not magnetic." },
        { text: "Iron nail", categoryIndex: 0, explanation: "Iron is attracted." },
      ],
      facilitatorNote: "Test real objects if possible.",
    },
    recap: { keyPoints: ["Magnets attract iron and steel.", "Like poles push apart.", "Magnets are useful."], facilitatorNote: "Ask for a favourite fact." },
  } as Content;
}

function quiz(): Quiz {
  const q = (objective: "1" | "2" | "3", sectionId: string, correctIndex: number) => ({
    prompt: "Which of these is attracted to a magnet?",
    options: ["Iron nail", "Plastic cup", "Glass marble", "Wool sock"],
    correctIndex,
    explanation: "Iron is attracted to magnets.",
    objective,
    sectionId,
  });
  return {
    questions: [
      q("1", "sec-explain-1", 0),
      q("2", "sec-explain-1", 1),
      q("3", "sec-explain-2", 2),
      q("1", "sec-sorting", 3),
      q("2", "sec-activity", 0),
    ],
  };
}

type Scripted = Partial<ModelReply> & { json?: unknown };

/** Replies from a per-stage script and records every request so tests can inspect retries. */
function fakeClient(script: Partial<Record<Stage, Scripted[]>>) {
  const calls: { stage: Stage; turns: ConversationTurn[] }[] = [];
  const client: ModelClient = {
    async send({ stage, turns }) {
      calls.push({ stage, turns: structuredClone(turns) });
      const next = script[stage]?.shift();
      if (!next) throw new Error(`No scripted reply for ${stage}`);
      const text = next.text ?? JSON.stringify(next.json);
      return { text, replay: [{ type: "text", text }], stopReason: next.stopReason ?? "complete" };
    },
  };
  return { client, calls };
}

async function run(script: Partial<Record<Stage, Scripted[]>>, overrides: Partial<GenerationInput> = {}) {
  const events: GenerationEvent[] = [];
  const { client, calls } = fakeClient(script);
  const lesson = await generateLesson({
    input: { ...input, ...overrides },
    client,
    emit: (e) => events.push(e),
    id: "lesson-test",
    now: () => "2026-10-11T10:00:00.000Z",
  });
  return { lesson, events, calls };
}

const happy = () => ({ outline: [{ json: outline() }], content: [{ json: content() }], quiz: [{ json: quiz() }] });

describe("generateLesson", () => {
  it("builds a valid AI-draft lesson and reports each stage", async () => {
    const { lesson, events } = await run(happy());

    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    expect(lesson).toMatchObject({ id: "lesson-test", contentOrigin: "ai-draft", sources: [], topic: "How magnets work" });
    expect(lesson.sections.map((s) => s.type)).toEqual([
      "hook",
      "prediction",
      "explanation",
      "prediction",
      "explanation",
      "sorting",
      "recap",
    ]);
    expect(events.filter((e) => e.type === "stage" && e.status === "done").map((e) => e.type === "stage" && e.stage)).toEqual([
      "outline",
      "content",
      "quiz",
      "check",
    ]);
  });

  it("uses a diagram-labeling activity when the outline picks an approved diagram", async () => {
    const activity = {
      instructions: "Label the water cycle.",
      labels: [
        { text: "Evaporation", targetId: "evaporation", explanation: "Water rises as vapour." },
        { text: "Condensation", targetId: "condensation", explanation: "Vapour forms clouds." },
      ],
      facilitatorNote: "Let them try first.",
    };
    const { lesson } = await run({
      outline: [{ json: outline("water-cycle") }],
      content: [{ json: content(activity as Content["activity"]) }],
      quiz: [{ json: quiz() }],
    });
    const diagram = lesson.sections[3];
    expect(diagram).toMatchObject({ type: "diagram-labeling", diagramId: "water-cycle" });
  });

  it("cites reference excerpts and lists only the excerpts the lesson uses", async () => {
    const reference = ["Magnets attract iron, nickel and cobalt.", "Every magnet has a north and a south pole. ".repeat(20)].join(
      "\n\n",
    );
    const cites = (ids: string[]) => ({ sourceIds: ids });
    const cited = content();
    cited.explain1 = { ...cited.explain1, ...cites(["ref-1"]) };
    cited.explain2 = { ...cited.explain2, ...cites(["ref-1"]) };
    const citedQuiz = { questions: quiz().questions.map((q) => ({ ...q, ...cites(["ref-1"]) })) };

    const { lesson, calls } = await run(
      { outline: [{ json: outline() }], content: [{ json: cited }], quiz: [{ json: citedQuiz }] },
      { referenceText: reference },
    );

    expect(lesson.contentOrigin).toBe("reference");
    expect(lesson.sources).toEqual([
      expect.objectContaining({ id: "ref-1", title: "Your reference material, part 1", excerpt: expect.stringContaining("nickel") }),
    ]);
    expect(lesson.sources[0].url).toBeUndefined();
    expect(lesson.sections[2].sourceIds).toEqual(["ref-1"]);
    expect(lesson.quiz.every((q) => q.sourceIds.includes("ref-1"))).toBe(true);
    // The model sees the excerpts tagged with ids.
    const firstPrompt = calls[0].turns[0];
    expect(firstPrompt.role === "user" && firstPrompt.text).toContain('<excerpt id="ref-1"');
  });

  it("asks for a repair when evidence-based content doesn't cite anything", async () => {
    const cited = content();
    cited.explain1 = { ...cited.explain1, sourceIds: ["ref-1"] } as Content["explain1"];
    const uncited = content(); // no sourceIds on the explanations
    cited.explain2 = { ...cited.explain2, sourceIds: ["ref-1"] } as Content["explain2"];
    const citedQuiz = { questions: quiz().questions.map((q) => ({ ...q, sourceIds: ["ref-1"] })) };

    const { events } = await run(
      { outline: [{ json: outline() }], content: [{ json: uncited }, { json: cited }], quiz: [{ json: citedQuiz }] },
      { referenceText: "Magnets attract iron." },
    );
    expect(events).toContainEqual(expect.objectContaining({ type: "retry", stage: "content", reason: expect.stringContaining("sourceIds") }));
  });

  it("builds web-researched lessons from the search tool's citations only", async () => {
    const citations = [
      { url: "https://example.org/magnets", title: "Magnets for kids", citedText: "Magnets attract iron and steel." },
      { url: "https://example.edu/poles", title: "Magnetic poles", citedText: "Opposite poles attract; like poles repel." },
    ];
    const cited = content();
    cited.explain1 = { ...cited.explain1, sourceIds: ["web-1"] } as Content["explain1"];
    cited.explain2 = { ...cited.explain2, sourceIds: ["web-2"] } as Content["explain2"];
    const citedQuiz = { questions: quiz().questions.map((q, i) => ({ ...q, sourceIds: [i % 2 ? "web-2" : "web-1"] })) };

    const { client } = fakeClient({ outline: [{ json: outline() }], content: [{ json: cited }], quiz: [{ json: citedQuiz }] });
    const events: GenerationEvent[] = [];
    const lesson = await generateLesson({
      input: { ...input, research: true },
      client: { ...client, research: async () => ({ citations }) },
      emit: (e) => events.push(e),
      id: "lesson-web",
    });

    expect(lesson.contentOrigin).toBe("web-research");
    expect(lesson.sources.map((s) => [s.id, s.url, s.title])).toEqual([
      ["web-1", "https://example.org/magnets", "Magnets for kids"],
      ["web-2", "https://example.edu/poles", "Magnetic poles"],
    ]);
    expect(events).toContainEqual({ type: "stage", stage: "research", status: "done" });
  });

  it("stops before writing when web research finds too little", async () => {
    const { client } = fakeClient({});
    const promise = generateLesson({
      input: { ...input, research: true },
      client: { ...client, research: async () => ({ citations: [{ url: "https://example.org", title: null, citedText: "One fact." }] }) },
      emit: () => {},
      id: "lesson-none",
    });
    await expect(promise).rejects.toMatchObject({ code: "no_sources" });
  });

  it("feeds problems back to the model once and succeeds on the repaired reply", async () => {
    const { lesson, events, calls } = await run({
      ...happy(),
      content: [{ text: "{ not json" }, { json: content() }],
    });

    expect(lesson.sections).toHaveLength(7);
    expect(events).toContainEqual({ type: "retry", stage: "content", reason: "The response was not valid JSON." });
    const retry = calls.filter((c) => c.stage === "content")[1];
    expect(retry.turns.map((t) => t.role)).toEqual(["user", "assistant", "user"]);
    expect(retry.turns[2]).toMatchObject({ role: "user", text: expect.stringContaining("not valid JSON") });
  });

  it("catches cross-reference problems the JSON schema can't express", async () => {
    const broken = content();
    broken.sorting.items[0].categoryIndex = 2; // only two categories exist
    const { events } = await run({ ...happy(), content: [{ json: broken }, { json: content() }] });
    const retry = events.find((e) => e.type === "retry");
    expect(retry).toMatchObject({ stage: "content", reason: expect.stringContaining('Unknown category "cat-3"') });
  });

  it("asks for a shorter reply when the output was cut off", async () => {
    const { events } = await run({ ...happy(), quiz: [{ stopReason: "max_tokens", text: "{" }, { json: quiz() }] });
    expect(events).toContainEqual(expect.objectContaining({ type: "retry", stage: "quiz", reason: expect.stringContaining("cut off") }));
  });

  it("gives up after a failed repair", async () => {
    const tooFew = { ...quiz(), questions: quiz().questions.slice(0, 4) };
    await expect(run({ ...happy(), quiz: [{ json: tooFew }, { json: tooFew }] })).rejects.toMatchObject({
      code: "invalid_output",
    });
  });

  it("stops immediately on a refusal", async () => {
    const promise = run({ outline: [{ stopReason: "refusal", text: "" }] });
    await expect(promise).rejects.toBeInstanceOf(GenerationError);
    await expect(promise).rejects.toMatchObject({ code: "refused" });
  });
});
