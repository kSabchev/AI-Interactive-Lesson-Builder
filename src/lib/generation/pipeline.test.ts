import { describe, expect, it } from "vitest";
import { lessonSchema } from "@/lib/lesson/schema";
import { GenerationError, type GenerationEvent, type Stage } from "./events";
import type { GenerationInput } from "./input";
import { type ConversationTurn, generateLesson, type ModelClient, type ModelReply } from "./pipeline";
import type { Content, Outline, Quiz } from "./stages";

// The fixtures below describe a 15-minute lesson (seven sections, five questions).
const input: GenerationInput = {
  topic: "How magnets work",
  ageGroup: "8-10",
  durationMinutes: 15,
  quality: "standard",
  research: false,
  experiment: false,
};

const planned = (title: string, objectives: ("1" | "2" | "3")[]) => ({ title, focus: `About ${title}`, objectives });

function outline(
  diagramId: Outline["diagramId"] = "none",
  activityType: Outline["activityType"] = "prediction",
  practiceType: Outline["practiceType"] = "sorting",
  warmupType: Outline["warmupType"] = "prediction",
): Outline {
  return {
    title: "The Invisible Pull: Magnets",
    objectives: ["Describe what magnets attract.", "Explain north and south poles.", "Identify everyday uses of magnets."],
    diagramId,
    warmupType,
    activityType,
    practiceType,
    sections: {
      hook: planned("A fridge mystery", []),
      warmup: planned("Make a guess", ["1"]),
      explain1: planned("What magnets pull", ["1", "2"]),
      activity: planned("Try it out", ["2"]),
      explain2: planned("Magnets around us", ["3"]),
      practice: planned("Sticks or not?", ["1"]),
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

const sorting = {
  instructions: "Sort each object.",
  categories: ["Attracted", "Not attracted"],
  items: [
    { text: "Paperclip", categoryIndex: 0, explanation: "Steel is attracted." },
    { text: "Wooden spoon", categoryIndex: 1, explanation: "Wood is not magnetic." },
    { text: "Iron nail", categoryIndex: 0, explanation: "Iron is attracted." },
  ],
  facilitatorNote: "Test real objects if possible.",
};

const matchingPairs = {
  instructions: "Match each magnet word with what it means.",
  pairs: [
    { left: "North pole", right: "One end of a magnet", explanation: "Every magnet has a north end." },
    { left: "Attract", right: "Pull towards", explanation: "Opposite poles pull together." },
    { left: "Repel", right: "Push away", explanation: "Like poles push apart." },
  ],
  facilitatorNote: "Say each pair aloud.",
};

function content(
  activity: Content["activity"] = prediction,
  practice: Content["practice"] = sorting,
  warmup: Content["warmup"] = prediction,
): Content {
  return {
    hook: { question: "Why do some things stick to the fridge?", body: "Some notes stay up all by themselves.", visualId: "none", facilitatorNote: "Let them guess." },
    warmup: structuredClone(warmup),
    explain1: explanation,
    activity: structuredClone(activity),
    explain2: explanation,
    practice: structuredClone(practice),
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
      q("1", "sec-practice", 3),
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

  it("writes the lesson in the topic's language", async () => {
    const english = await run(happy());
    expect(english.lesson.language).toBe("en");

    const { lesson, calls } = await run(happy(), { topic: "Как действат магнитите" });
    expect(lesson.language).toBe("bg");
    const prompt = calls[0].turns[0];
    expect(prompt.role === "user" && prompt.text).toContain("in Bulgarian");
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

  it("puts steps in order when the outline picks a sequence and no diagram fits", async () => {
    const activity = {
      instructions: "Put the steps in order.",
      steps: [
        { text: "Rub a needle on a magnet", explanation: "First the needle has to become a magnet." },
        { text: "Float the needle on a leaf in water", explanation: "Floating lets it turn freely." },
        { text: "Watch it point north", explanation: "It lines up with Earth's magnetism last." },
      ],
      facilitatorNote: "Do it for real if you can.",
    };
    const { lesson, calls } = await run({
      outline: [{ json: outline("none", "sequence") }],
      content: [{ json: content(activity as Content["activity"]) }],
      quiz: [{ json: quiz() }],
    });
    expect(lesson.sections[3]).toMatchObject({
      type: "sequence",
      steps: [{ id: "step-1", text: "Rub a needle on a magnet" }, { id: "step-2" }, { id: "step-3" }],
    });
    const contentPrompt = JSON.stringify(calls.find((c) => c.stage === "content"));
    expect(contentPrompt).toContain("put 3-6 steps of a process");
  });

  it("uses match pairs for the activity, the practice, or both slots, but never twice in one lesson", async () => {
    const activityMatching = await run({
      outline: [{ json: outline("none", "matching", "sorting") }],
      content: [{ json: content(matchingPairs as Content["activity"]) }],
      quiz: [{ json: quiz() }],
    });
    expect(activityMatching.lesson.sections.map((s) => s.type)).toEqual([
      "hook", "prediction", "explanation", "matching", "explanation", "sorting", "recap",
    ]);
    expect(activityMatching.lesson.sections[3]).toMatchObject({ pairs: [{ id: "activity-pair-1", left: "North pole" }, {}, {}] });

    const practiceMatching = await run({
      outline: [{ json: outline("none", "sequence", "matching") }],
      content: [
        {
          json: content(
            {
              instructions: "Put the steps in order.",
              steps: [
                { text: "Rub a needle on a magnet", explanation: "First." },
                { text: "Float it on water", explanation: "Second." },
                { text: "Watch it point north", explanation: "Last." },
              ],
              facilitatorNote: "Try it.",
            } as Content["activity"],
            matchingPairs as Content["practice"],
          ),
        },
      ],
      quiz: [{ json: quiz() }],
    });
    expect(practiceMatching.lesson.sections.map((s) => s.type)).toEqual([
      "hook", "prediction", "explanation", "sequence", "explanation", "matching", "recap",
    ]);
    expect(JSON.stringify(practiceMatching.calls.find((c) => c.stage === "content"))).toContain(
      "The practice section asks learners to match 3-5 pairs",
    );

    // Both slots asked for matching: the practice slot falls back to sorting, and the prompt asks for sorting.
    const both = await run({
      outline: [{ json: outline("none", "matching", "matching") }],
      content: [{ json: content(matchingPairs as Content["activity"], sorting as Content["practice"]) }],
      quiz: [{ json: quiz() }],
    });
    expect(both.lesson.sections[3].type).toBe("matching");
    expect(both.lesson.sections[5].type).toBe("sorting");
    expect(JSON.stringify(both.calls.find((c) => c.stage === "content"))).toContain("sort 4-8 examples into 2-3 groups");
  });

  it("makes the activity a safe experiment when the adult asks for one, even if a diagram fits", async () => {
    const experiment = {
      question: "Will the paperclip float on the water?",
      materials: ["A bowl of water", "A paperclip", "A small piece of tissue paper"],
      steps: ["Lay the tissue on the water.", "Put the paperclip on the tissue.", "Wait for the tissue to sink."],
      observe: "The paperclip stays on top of the water.",
      explanation: "The water's surface acts like a thin skin that holds the paperclip up.",
      safety: "Wipe up spills so nobody slips.",
      facilitatorNote: "Let learners guess before you start.",
    };
    const { lesson, calls } = await run(
      {
        outline: [{ json: outline("water-cycle", "sequence") }],
        content: [{ json: content(experiment as Content["activity"]) }],
        quiz: [{ json: quiz() }],
      },
      { experiment: true },
    );
    expect(lesson.sections[3]).toMatchObject({
      type: "experiment",
      question: "Will the paperclip float on the water?",
      materials: ["A bowl of water", "A paperclip", "A small piece of tissue paper"],
      safety: "Wipe up spills so nobody slips.",
    });
    const outlinePrompt = JSON.stringify(calls.find((c) => c.stage === "outline"));
    expect(outlinePrompt).toContain("The adult asked for a hands-on experiment");
    const contentPrompt = JSON.stringify(calls.find((c) => c.stage === "content"));
    expect(contentPrompt).toContain("Never use fire, candles or matches");
    expect(contentPrompt).toContain("use different examples from the activity section");
  });

  it("sends an experiment that uses something unsafe back for repair", async () => {
    const unsafe = {
      question: "What happens to the wax?",
      materials: ["A candle", "Matches"],
      steps: ["Light the candle.", "Watch the wax."],
      observe: "The wax melts.",
      explanation: "Heat melts wax.",
      safety: "Be careful.",
      facilitatorNote: "Adults only.",
    };
    const safe = { ...unsafe, question: "What happens to the ice?", materials: ["An ice cube", "A plate"], steps: ["Put the ice on the plate.", "Wait ten minutes."], observe: "It melts.", explanation: "The room is warmer than ice." };
    const { lesson, events } = await run(
      {
        outline: [{ json: outline() }],
        content: [{ json: content(unsafe as Content["activity"]) }, { json: content(safe as Content["activity"]) }],
        quiz: [{ json: quiz() }],
      },
      { experiment: true },
    );
    expect(events).toContainEqual(
      expect.objectContaining({ type: "retry", stage: "content", reason: expect.stringContaining("unsafe for children (candle, matches)") }),
    );
    expect(lesson.sections[3]).toMatchObject({ type: "experiment", materials: ["An ice cube", "A plate"] });
  });

  it("opens with myth or fact when the outline finds common misconceptions, and needs both myths and facts", async () => {
    const myths = {
      instructions: "Is it a myth or a fact?",
      statements: [
        { text: "All metals stick to magnets.", isFact: false, explanation: "Only some, like iron and steel." },
        { text: "A magnet has two poles.", isFact: true, explanation: "Every magnet has a north and a south pole." },
        { text: "Bigger magnets are always stronger.", isFact: false, explanation: "Strength depends on the material too." },
      ],
      facilitatorNote: "Let the class vote first.",
    };
    const { lesson, calls } = await run({
      outline: [{ json: outline("none", "prediction", "sorting", "myth-or-fact") }],
      content: [{ json: content(prediction as Content["activity"], sorting as Content["practice"], myths as Content["warmup"]) }],
      quiz: [{ json: quiz() }],
    });
    expect(lesson.sections[1]).toMatchObject({
      id: "sec-warmup",
      type: "myth-or-fact",
      statements: [{ id: "statement-1", isFact: false }, { id: "statement-2", isFact: true }, { id: "statement-3" }],
    });
    expect(JSON.stringify(calls.find((c) => c.stage === "content"))).toContain('\\"myth or fact?\\"');
    expect(JSON.stringify(calls.find((c) => c.stage === "content"))).toContain("don't start the explanation by saying which it is");

    // Only myths: sent back to be fixed, since learners could answer "myth" every time.
    const onlyMyths = { ...myths, statements: myths.statements.map((st) => ({ ...st, isFact: false })) };
    const { events } = await run({
      outline: [{ json: outline("none", "prediction", "sorting", "myth-or-fact") }],
      content: [
        { json: content(prediction as Content["activity"], sorting as Content["practice"], onlyMyths as Content["warmup"]) },
        { json: content(prediction as Content["activity"], sorting as Content["practice"], myths as Content["warmup"]) },
      ],
      quiz: [{ json: quiz() }],
    });
    expect(events).toContainEqual(
      expect.objectContaining({ type: "retry", stage: "content", reason: expect.stringContaining("at least one myth and one fact") }),
    );
  });

  it("gives a 10-minute lesson five sections and three questions", async () => {
    const short = { questions: quiz().questions.slice(0, 3).map((q) => ({ ...q, sectionId: "sec-explain-1" })) };
    const { lesson, calls } = await run(
      { outline: [{ json: outline() }], content: [{ json: content() }], quiz: [{ json: short }] },
      { durationMinutes: 10 },
    );
    expect(lesson.sections.map((s) => s.type)).toEqual(["hook", "prediction", "explanation", "prediction", "recap"]);
    expect(lesson.quiz).toHaveLength(3);
    expect(JSON.stringify(calls.find((c) => c.stage === "quiz"))).toContain("exactly 3 single-answer");
  });

  it("gives a 25-minute lesson a third explanation, \"talk about it\" and six questions", async () => {
    const longOutline = {
      ...outline(),
      sections: { ...outline().sections, explain3: planned("Magnets at work", ["3"]), discussion: planned("Let's talk", ["3"]) },
    };
    const talk = {
      question: "Where would life be harder without magnets?",
      prompts: ["What at home uses a magnet?", "What would happen to the fridge door?"],
      listenFor: ["Fridge doors stay shut because of magnets.", "Speakers and motors use magnets."],
      facilitatorNote: "Let several learners answer.",
    };
    const longContent = { ...content(), explain3: explanation, discussion: talk };
    const six = { questions: [...quiz().questions, { ...quiz().questions[0], sectionId: "sec-explain-3" }] };
    const { lesson, calls } = await run(
      { outline: [{ json: longOutline }], content: [{ json: longContent }], quiz: [{ json: six }] },
      { durationMinutes: 25 },
    );
    expect(lesson.sections.map((s) => s.type)).toEqual([
      "hook", "prediction", "explanation", "prediction", "explanation", "sorting", "explanation", "discussion", "recap",
    ]);
    expect(lesson.sections[7]).toMatchObject({ id: "sec-discussion", question: "Where would life be harder without magnets?" });
    expect(lesson.quiz).toHaveLength(6);
    expect(JSON.stringify(calls.find((c) => c.stage === "outline"))).toContain("discussion -");
    expect(JSON.stringify(calls.find((c) => c.stage === "content"))).toContain("The discussion section asks a question");
  });

  it("prefers labelling a diagram over a sequence when a diagram fits", async () => {
    const activity = {
      instructions: "Label the water cycle.",
      labels: [
        { text: "Evaporation", targetId: "evaporation", explanation: "Water rises as vapour." },
        { text: "Condensation", targetId: "condensation", explanation: "Vapour forms clouds." },
      ],
      facilitatorNote: "Let them try first.",
    };
    const { lesson } = await run({
      outline: [{ json: outline("water-cycle", "sequence") }],
      content: [{ json: content(activity as Content["activity"]) }],
      quiz: [{ json: quiz() }],
    });
    expect(lesson.sections[3]).toMatchObject({ type: "diagram-labeling" });
  });

  it("cites reference excerpts and lists only the excerpts the lesson uses", async () => {
    const reference = ["Magnets attract iron, nickel and cobalt.", "Every magnet has a north and a south pole. ".repeat(20)].join(
      "\n\n",
    );
    const cites = (ids: string[]) => ({ sourceIds: ids });
    const cited = content();
    cited.explain1 = { ...cited.explain1, ...cites(["ref-1"]) };
    cited.explain2 = { ...cited.explain2!, ...cites(["ref-1"]) };
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

  it("writes an unsourced draft, and says so, when web research finds too little", async () => {
    const { client } = fakeClient(happy());
    const events: GenerationEvent[] = [];
    const lesson = await generateLesson({
      input: { ...input, research: true },
      client: { ...client, research: async () => ({ citations: [{ url: "https://example.org", title: null, citedText: "One fact." }] }) },
      emit: (e) => events.push(e),
      id: "lesson-none",
    });

    expect(lesson.contentOrigin).toBe("ai-draft");
    expect(lesson.sources).toEqual([]);
    expect(events).toContainEqual({ type: "research_fallback" });
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
    (broken.practice as typeof sorting).items[0].categoryIndex = 2; // only two categories exist
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
