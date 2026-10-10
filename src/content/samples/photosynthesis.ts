import type { LessonInput } from "@/lib/lesson/schema";

export const photosynthesisLesson: LessonInput = {
  id: "sample-photosynthesis",
  title: "How Plants Make Food: Photosynthesis",
  topic: "How plants use light, water and air to make their own food",
  ageGroup: "11-12",
  durationMinutes: 15,
  templateId: "explore-concept",
  contentOrigin: "curated",
  createdAt: "2026-10-03T09:00:00.000Z",
  updatedAt: "2026-10-03T09:00:00.000Z",
  objectives: [
    {
      id: "obj-inputs",
      description:
        "Identify the three things plants need for photosynthesis — light, water and carbon dioxide — and how each one gets into the plant.",
    },
    {
      id: "obj-outputs",
      description: "Explain that photosynthesis makes glucose (food for the plant) and releases oxygen.",
    },
    {
      id: "obj-importance",
      description: "Explain why photosynthesis matters for food chains and for the oxygen animals breathe.",
    },
  ],
  sources: [
    {
      id: "src-natgeo",
      title: "National Geographic Education — Photosynthesis",
      url: "https://education.nationalgeographic.org/resource/photosynthesis/",
      excerpt:
        "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
    },
  ],
  sections: [
    {
      id: "sec-hook",
      type: "hook",
      title: "The tree that ate nothing",
      question: "How does a tiny seed grow into a tree weighing tonnes — without ever eating a meal?",
      body: "An oak tree starts as an acorn small enough to fit in your hand. Fifty years later it can weigh more than a car. Trees don't have mouths and they never sit down to eat. So where does all that new wood and leaf actually come from?",
      visualId: "seed-to-tree",
      facilitatorNote:
        "Collect ideas without correcting them — many learners (and adults!) believe plants get their mass from the soil. That misconception is exactly what the next section tests.",
    },
    {
      id: "sec-prediction",
      type: "prediction",
      title: "Make a prediction",
      question: "Where does most of a tree's mass come from?",
      options: [
        { id: "a", text: "Soil sucked up by the roots" },
        { id: "b", text: "Water from the rain" },
        { id: "c", text: "Carbon dioxide gas from the air" },
        { id: "d", text: "Sunlight soaked up by the leaves" },
      ],
      answerOptionId: "c",
      reveal:
        "Surprisingly, most of a tree is built from the air! Plants take in carbon dioxide gas and combine its carbon with water to make sugar, which they then use to build wood and leaves. Sunlight provides the energy, but light itself doesn't become part of the tree, and the soil barely shrinks at all.",
      facilitatorNote:
        "In the 1600s, scientist Jan van Helmont grew a willow tree in a pot for five years. The tree gained over 70 kg, but the soil lost only a tiny amount. Share this if the learner chose soil.",
      objectiveIds: ["obj-inputs"],
    },
    {
      id: "sec-inputs",
      type: "explanation",
      title: "What goes in: light, water and carbon dioxide",
      paragraphs: [
        "Photosynthesis is how plants make their own food. The word means “putting together with light”. It happens mostly in the leaves.",
        "Leaves are green because they contain chlorophyll, a green substance that absorbs light energy from the Sun. Water travels up from the roots through tiny tubes in the stem. Carbon dioxide gas from the air enters the leaf through tiny holes called stomata on the underside of the leaf.",
        "Inside the leaf, the plant uses the light energy to join the water and carbon dioxide together, making something completely new.",
      ],
      keyTerms: [
        { term: "Photosynthesis", definition: "The process plants use to make food (glucose) from light, water and carbon dioxide." },
        { term: "Chlorophyll", definition: "The green substance in leaves that absorbs light energy." },
        { term: "Stomata", definition: "Tiny holes, mostly on the underside of leaves, that let gases in and out." },
        { term: "Carbon dioxide", definition: "A gas in the air that we breathe out and plants take in." },
      ],
      example:
        "A plant left in a dark cupboard turns pale and weak after a few days. Without light, it can't photosynthesise, so it can't make the food it needs.",
      visualId: "leaf-closeup",
      facilitatorNote:
        "If you have a leaf to hand, look at both sides. Stomata are too small to see without a microscope, but the paler underside is a good talking point. Check that the learner can name all three inputs before moving on.",
      objectiveIds: ["obj-inputs"],
    },
    {
      id: "sec-diagram",
      type: "diagram-labeling",
      title: "Label the plant",
      diagramId: "photosynthesis",
      instructions: "Choose a label, then tap the arrow or spot on the picture that it describes.",
      labels: [
        {
          id: "lbl-sunlight",
          text: "Light energy",
          targetId: "sunlight",
          explanation: "Light from the Sun is absorbed by chlorophyll in the leaves.",
        },
        {
          id: "lbl-co2",
          text: "Carbon dioxide in",
          targetId: "carbon-dioxide",
          explanation: "Carbon dioxide from the air enters through the stomata.",
        },
        {
          id: "lbl-oxygen",
          text: "Oxygen out",
          targetId: "oxygen",
          explanation: "Oxygen is released from the leaves into the air.",
        },
        {
          id: "lbl-water",
          text: "Water in",
          targetId: "water",
          explanation: "Water is taken up by the roots and carried up the stem.",
        },
        {
          id: "lbl-glucose",
          text: "Glucose (food)",
          targetId: "glucose",
          explanation: "Glucose made in the leaves travels to every part of the plant.",
        },
      ],
      facilitatorNote:
        "Point out that two arrows go in to the leaf (carbon dioxide and light), one comes up from the roots (water), and two things are made (oxygen and glucose).",
      objectiveIds: ["obj-inputs", "obj-outputs"],
    },
    {
      id: "sec-outputs",
      type: "explanation",
      title: "What comes out: food and oxygen",
      paragraphs: [
        "Photosynthesis makes two things. The first is glucose, a type of sugar. The plant uses glucose for energy and to build new leaves, stems and roots. Extra glucose can be stored as starch.",
        "The second is oxygen. The plant doesn't need most of it, so it releases oxygen into the air through its stomata. That's the oxygen that you and other animals breathe!",
        "We can sum it up as a word equation: carbon dioxide + water → glucose + oxygen, using light energy.",
        "Plants are called producers because they make their own food. Animals can't, so every food chain starts with a plant. Even a lion depends on photosynthesis, because the zebra it eats fed on grass.",
      ],
      keyTerms: [
        { term: "Glucose", definition: "A sugar made by photosynthesis. Plants use it for energy and growth." },
        { term: "Oxygen", definition: "A gas released by plants that animals need to breathe." },
        { term: "Producer", definition: "A living thing, like a plant, that makes its own food." },
      ],
      example:
        "A potato is a store of starch, made from glucose that the potato plant's leaves produced over the summer. When you eat chips, you're eating stored sunlight energy!",
      facilitatorNote:
        "Write the word equation down and have the learner point to which parts come in from outside and which are made. For a class, ask learners to trace a food chain from their lunch back to a plant.",
      objectiveIds: ["obj-outputs", "obj-importance"],
    },
    {
      id: "sec-sorting",
      type: "sorting",
      title: "In or out?",
      instructions: "Does each thing go into photosynthesis or come out of it? Pick one, then choose a group.",
      categories: [
        { id: "cat-in", label: "Goes in" },
        { id: "cat-out", label: "Comes out" },
      ],
      items: [
        {
          id: "item-co2",
          text: "Carbon dioxide from the air",
          categoryId: "cat-in",
          explanation: "Carbon dioxide enters the leaf through the stomata and is used to make glucose.",
        },
        {
          id: "item-water",
          text: "Water from the roots",
          categoryId: "cat-in",
          explanation: "Water is one of the two ingredients joined together to make glucose.",
        },
        {
          id: "item-light",
          text: "Light energy from the Sun",
          categoryId: "cat-in",
          explanation: "Light provides the energy that drives photosynthesis.",
        },
        {
          id: "item-oxygen",
          text: "Oxygen released by the leaves",
          categoryId: "cat-out",
          explanation: "Oxygen is made during photosynthesis and released into the air.",
        },
        {
          id: "item-glucose",
          text: "Glucose the plant uses to grow",
          categoryId: "cat-out",
          explanation: "Glucose is the food that photosynthesis produces.",
        },
        {
          id: "item-starch",
          text: "Starch stored in a potato",
          categoryId: "cat-out",
          explanation: "Starch is extra glucose that the plant has stored for later.",
        },
      ],
      facilitatorNote:
        "If a learner places oxygen as an input, remind them that plants also breathe (respire), but in photosynthesis oxygen is a product.",
      objectiveIds: ["obj-inputs", "obj-outputs"],
    },
    {
      id: "sec-recap",
      type: "recap",
      title: "Three big ideas",
      keyPoints: [
        "Plants take in light energy, water and carbon dioxide — mostly through their leaves and roots.",
        "Photosynthesis turns these into glucose for the plant and releases oxygen into the air.",
        "Every food chain starts with plants, and the oxygen we breathe comes from photosynthesis.",
      ],
      facilitatorNote:
        "Return to the opening question: where does a tree's mass come from? A confident answer of “mostly from the air” shows the key idea has landed.",
      objectiveIds: ["obj-inputs", "obj-outputs", "obj-importance"],
    },
  ],
  quiz: [
    {
      id: "q1",
      prompt: "Which gas do plants take in from the air for photosynthesis?",
      options: [
        { id: "a", text: "Oxygen" },
        { id: "b", text: "Nitrogen" },
        { id: "c", text: "Carbon dioxide" },
        { id: "d", text: "Helium" },
      ],
      correctOptionId: "c",
      explanation: "Carbon dioxide enters the leaves through tiny holes called stomata and is used to make glucose.",
      objectiveId: "obj-inputs",
      sectionId: "sec-inputs",
      sourceIds: ["src-natgeo"],
    },
    {
      id: "q2",
      prompt: "What is the job of chlorophyll?",
      options: [
        { id: "a", text: "It absorbs light energy from the Sun" },
        { id: "b", text: "It pulls water up from the roots" },
        { id: "c", text: "It lets gases in and out of the leaf" },
        { id: "d", text: "It stores starch for later" },
      ],
      correctOptionId: "a",
      explanation:
        "Chlorophyll is the green substance in leaves that absorbs light energy. Stomata let gases in and out, and roots take in water.",
      objectiveId: "obj-inputs",
      sectionId: "sec-inputs",
      sourceIds: [],
    },
    {
      id: "q3",
      prompt: "Which word equation describes photosynthesis?",
      options: [
        { id: "a", text: "Oxygen + glucose → carbon dioxide + water" },
        { id: "b", text: "Carbon dioxide + water → glucose + oxygen" },
        { id: "c", text: "Water + soil → glucose + carbon dioxide" },
        { id: "d", text: "Sunlight + oxygen → water + starch" },
      ],
      correctOptionId: "b",
      explanation: "Using light energy, plants join carbon dioxide and water to make glucose, releasing oxygen.",
      objectiveId: "obj-outputs",
      sectionId: "sec-outputs",
      sourceIds: ["src-natgeo"],
    },
    {
      id: "q4",
      prompt: "What does a plant do with the glucose it makes?",
      options: [
        { id: "a", text: "Releases it into the air" },
        { id: "b", text: "Sends it back into the soil" },
        { id: "c", text: "Uses it for energy and growth, and stores extra as starch" },
        { id: "d", text: "Turns it back into sunlight" },
      ],
      correctOptionId: "c",
      explanation: "Glucose is the plant's food: it provides energy, builds new parts, and extra is stored as starch.",
      objectiveId: "obj-outputs",
      sectionId: "sec-outputs",
      sourceIds: [],
    },
    {
      id: "q5",
      prompt: "Why would a lion struggle to survive if there were no plants?",
      options: [
        { id: "a", text: "Lions eat leaves when they can't find meat" },
        { id: "b", text: "Plants are needed to make shade for lions" },
        { id: "c", text: "Lions drink water stored in plants" },
        { id: "d", text: "Its food chain starts with plants, which also make the oxygen it breathes" },
      ],
      correctOptionId: "d",
      explanation:
        "Plants are producers: the zebra a lion eats fed on grass. Plants also release the oxygen that animals breathe.",
      objectiveId: "obj-importance",
      sectionId: "sec-outputs",
      sourceIds: [],
    },
  ],
};
