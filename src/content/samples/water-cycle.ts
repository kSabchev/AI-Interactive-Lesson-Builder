import type { LessonInput } from "@/lib/lesson/schema";

export const waterCycleLesson: LessonInput = {
  id: "sample-water-cycle",
  title: "Where Does the Puddle Go? The Water Cycle",
  topic: "How the water cycle works",
  ageGroup: "8-10",
  durationMinutes: 15,
  templateId: "explore-concept",
  contentOrigin: "curated",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  objectives: [
    {
      id: "obj-evaporation",
      description: "Describe how the Sun's heat turns liquid water into water vapour (evaporation).",
    },
    {
      id: "obj-clouds-rain",
      description:
        "Explain how cooling vapour forms clouds (condensation) and falls as rain or snow (precipitation).",
    },
    {
      id: "obj-cycle",
      description: "Put the four stages of the water cycle in order and explain why the cycle keeps repeating.",
    },
  ],
  sources: [
    {
      id: "src-usgs",
      title: "USGS — The Water Cycle for Schools",
      url: "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle-schools",
      excerpt: "The water cycle describes where water is found on Earth and how it moves.",
    },
    {
      id: "src-nasa",
      title: "NASA Climate Kids — The Water Cycle",
      url: "https://climatekids.nasa.gov/water-cycle/",
    },
  ],
  sections: [
    {
      id: "sec-hook",
      type: "hook",
      title: "The disappearing puddle",
      question: "Where does a puddle go after a sunny day?",
      body: "After a rainy morning, the playground is full of puddles. By the afternoon, the Sun has been shining and the puddles are gone. Nobody mopped them up. So where did all that water go?",
      visualId: "puddle-sun",
      facilitatorNote:
        "Let the learner share ideas before moving on. There are no wrong answers yet — curiosity is the goal. Ask: 'Have you ever seen this happen?'",
    },
    {
      id: "sec-prediction",
      type: "prediction",
      title: "Make a prediction",
      question: "What do you think happened to the water in the puddle?",
      options: [
        { id: "a", text: "It soaked into the ground and stayed there" },
        { id: "b", text: "It turned into an invisible gas and rose into the air" },
        { id: "c", text: "It was drunk by birds and animals" },
        { id: "d", text: "It disappeared forever" },
      ],
      answerOptionId: "b",
      reveal:
        "Some water does soak into the ground, but most of a sunny-day puddle turns into an invisible gas called water vapour and floats up into the air. Water never disappears forever — it just changes form and moves somewhere else.",
      facilitatorNote: "Predictions are not scored. Praise the reasoning, whatever the choice.",
      objectiveIds: ["obj-evaporation"],
    },
    {
      id: "sec-evaporation",
      type: "explanation",
      title: "Up and away: evaporation and condensation",
      paragraphs: [
        "When the Sun warms water, tiny bits of water get enough energy to escape into the air as a gas. This is called evaporation. You can't see water vapour, but it is all around you.",
        "Warm air carries the water vapour high into the sky, where the air is much colder. Cold makes the vapour turn back into tiny droplets of liquid water. This is called condensation.",
        "Billions of these tiny droplets crowd together, and that's what a cloud is!",
      ],
      keyTerms: [
        { term: "Evaporation", definition: "When liquid water warms up and turns into a gas called water vapour." },
        { term: "Water vapour", definition: "Water in the form of an invisible gas." },
        {
          term: "Condensation",
          definition: "When water vapour cools down and turns back into tiny drops of liquid.",
        },
      ],
      example:
        "Ever noticed droplets on the outside of a cold glass of juice? That's condensation — water vapour from the air cooled down when it touched the cold glass.",
      visualId: "cold-glass",
      facilitatorNote:
        "If you have a cold drink handy, show the droplets forming on the glass. Pause after each key term and ask the learner to explain it in their own words.",
      objectiveIds: ["obj-evaporation", "obj-clouds-rain"],
    },
    {
      id: "sec-diagram",
      type: "diagram-labeling",
      title: "Label the water cycle",
      diagramId: "water-cycle",
      instructions: "Pick a label, then tap the spot on the picture where it belongs.",
      labels: [
        {
          id: "lbl-evaporation",
          text: "Evaporation",
          targetId: "evaporation",
          explanation: "The Sun heats the ocean and water rises as vapour.",
        },
        {
          id: "lbl-condensation",
          text: "Condensation",
          targetId: "condensation",
          explanation: "High in the cold sky, vapour turns into droplets that form clouds.",
        },
        {
          id: "lbl-precipitation",
          text: "Precipitation",
          targetId: "precipitation",
          explanation: "When droplets get too heavy, they fall as rain, snow or hail.",
        },
        {
          id: "lbl-collection",
          text: "Collection",
          targetId: "collection",
          explanation: "Water gathers in rivers, lakes and oceans — and the cycle starts again.",
        },
      ],
      facilitatorNote:
        "Let the learner try first, then use 'Check' together. Mistakes are a great moment to look back at the explanation.",
      objectiveIds: ["obj-cycle"],
    },
    {
      id: "sec-rain",
      type: "explanation",
      title: "Back down again: precipitation and collection",
      paragraphs: [
        "Inside a cloud, tiny droplets bump into each other and join together. When they become too heavy for the air to hold up, they fall. Water falling from clouds is called precipitation — it can be rain, snow, sleet or hail.",
        "When precipitation lands, it collects in oceans, lakes and rivers, or soaks into the ground. Rivers carry water back to the sea. This is called collection.",
        "Then the Sun warms the water again, and the whole cycle repeats — again and again!",
      ],
      keyTerms: [
        { term: "Precipitation", definition: "Water falling from clouds as rain, snow, sleet or hail." },
        { term: "Collection", definition: "When water gathers in oceans, lakes, rivers and the ground." },
      ],
      example:
        "The water in your glass today might once have fallen as snow on a mountain, or even been splashed around by a dinosaur! The same water has been going around the cycle for millions of years.",
      visualId: "rain-cloud",
      facilitatorNote:
        "Trace the full loop with your finger on the diagram from the previous section: ocean → vapour → cloud → rain → river → ocean.",
      objectiveIds: ["obj-clouds-rain", "obj-cycle"],
    },
    {
      id: "sec-sorting",
      type: "sorting",
      title: "Sort it out",
      instructions: "Which part of the water cycle does each example show? Pick an example, then choose its group.",
      categories: [
        { id: "cat-evaporation", label: "Evaporation" },
        { id: "cat-condensation", label: "Condensation" },
        { id: "cat-precipitation", label: "Precipitation" },
      ],
      items: [
        {
          id: "item-laundry",
          text: "Wet laundry drying on a sunny washing line",
          categoryId: "cat-evaporation",
          explanation: "The Sun's heat turns the water in the clothes into vapour.",
        },
        {
          id: "item-mirror",
          text: "A bathroom mirror fogging up after a hot shower",
          categoryId: "cat-condensation",
          explanation: "Warm vapour from the shower cools on the mirror and turns into droplets.",
        },
        {
          id: "item-snow",
          text: "Snowflakes falling on a winter day",
          categoryId: "cat-precipitation",
          explanation: "Snow is water falling from clouds — a type of precipitation.",
        },
        {
          id: "item-dew",
          text: "Dew drops on the grass on a cool morning",
          categoryId: "cat-condensation",
          explanation: "Water vapour in the air cools overnight and forms droplets on the grass.",
        },
        {
          id: "item-puddle",
          text: "A puddle shrinking in the afternoon sun",
          categoryId: "cat-evaporation",
          explanation: "Just like our hook — the Sun evaporates the puddle.",
        },
        {
          id: "item-storm",
          text: "Rain pouring down during a thunderstorm",
          categoryId: "cat-precipitation",
          explanation: "Rain is the most common form of precipitation.",
        },
      ],
      facilitatorNote:
        "Ask the learner to say why before they place each example. For a class, read each example aloud and vote.",
      objectiveIds: ["obj-evaporation", "obj-clouds-rain"],
    },
    {
      id: "sec-recap",
      type: "recap",
      title: "Three big ideas",
      keyPoints: [
        "The Sun heats water, and it evaporates into invisible water vapour.",
        "High in the cold sky, vapour condenses into droplets that make clouds, which fall as precipitation.",
        "Water collects in oceans, lakes and rivers, and the cycle repeats again and again.",
      ],
      facilitatorNote:
        "Ask the learner to explain where the puddle went now. Compare with their prediction from the start.",
      objectiveIds: ["obj-evaporation", "obj-clouds-rain", "obj-cycle"],
    },
  ],
  quiz: [
    {
      id: "q1",
      prompt: "What makes water evaporate from a puddle?",
      options: [
        { id: "a", text: "The wind blowing it away" },
        { id: "b", text: "Heat from the Sun" },
        { id: "c", text: "Cold air at night" },
        { id: "d", text: "The ground pulling it down" },
      ],
      correctOptionId: "b",
      explanation: "The Sun's heat gives water enough energy to turn into water vapour and rise into the air.",
      objectiveId: "obj-evaporation",
      sectionId: "sec-evaporation",
      sourceIds: ["src-usgs"],
    },
    {
      id: "q2",
      prompt: "What is a cloud made of?",
      options: [
        { id: "a", text: "Smoke from chimneys" },
        { id: "b", text: "Cotton-like fluff" },
        { id: "c", text: "Billions of tiny water droplets" },
        { id: "d", text: "Invisible water vapour only" },
      ],
      correctOptionId: "c",
      explanation:
        "When water vapour cools high in the sky it condenses into tiny droplets. Billions of them together make a cloud.",
      objectiveId: "obj-clouds-rain",
      sectionId: "sec-evaporation",
      sourceIds: ["src-nasa"],
    },
    {
      id: "q3",
      prompt: "Why does rain fall from a cloud?",
      options: [
        { id: "a", text: "The droplets join together and become too heavy" },
        { id: "b", text: "The Sun pushes the water down" },
        { id: "c", text: "The cloud gets too hot" },
        { id: "d", text: "The wind squeezes the cloud like a sponge" },
      ],
      correctOptionId: "a",
      explanation:
        "Droplets bump into each other and join. When they're too heavy for the air to hold up, they fall as precipitation.",
      objectiveId: "obj-clouds-rain",
      sectionId: "sec-rain",
      sourceIds: ["src-usgs"],
    },
    {
      id: "q4",
      prompt: "Which list shows the water cycle in the right order?",
      options: [
        { id: "a", text: "Precipitation → evaporation → collection → condensation" },
        { id: "b", text: "Evaporation → condensation → precipitation → collection" },
        { id: "c", text: "Condensation → collection → evaporation → precipitation" },
        { id: "d", text: "Collection → precipitation → condensation → evaporation" },
      ],
      correctOptionId: "b",
      explanation:
        "Water evaporates, condenses into clouds, falls as precipitation and collects in oceans and rivers — then it starts again.",
      objectiveId: "obj-cycle",
      sectionId: "sec-diagram",
      sourceIds: ["src-usgs"],
    },
    {
      id: "q5",
      prompt: "A mirror fogs up after a hot shower. Which part of the water cycle is this like?",
      options: [
        { id: "a", text: "Evaporation" },
        { id: "b", text: "Precipitation" },
        { id: "c", text: "Collection" },
        { id: "d", text: "Condensation" },
      ],
      correctOptionId: "d",
      explanation:
        "Warm water vapour cools when it touches the mirror and turns back into droplets — that's condensation.",
      objectiveId: "obj-clouds-rain",
      sectionId: "sec-sorting",
      sourceIds: [],
    },
  ],
};
