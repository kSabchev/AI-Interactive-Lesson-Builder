import type { LearningObjective, Lesson, LessonSection, QuizQuestion } from "@/lib/lesson/schema";

/** Selected option id per question id. */
export type QuizAnswers = Record<string, string>;

export type QuestionResult = {
  question: QuizQuestion;
  selectedOptionId: string | undefined;
  correct: boolean;
  section: LessonSection | undefined;
};

export type ConceptToRevisit = {
  objective: LearningObjective;
  missedQuestionIds: string[];
  sections: LessonSection[];
};

export type QuizResult = {
  score: number;
  total: number;
  questions: QuestionResult[];
  conceptsToRevisit: ConceptToRevisit[];
};

export function isCorrect(question: QuizQuestion, selectedOptionId: string | undefined): boolean {
  return selectedOptionId === question.correctOptionId;
}

export function scoreQuiz(lesson: Lesson, answers: QuizAnswers): QuizResult {
  const sectionsById = new Map(lesson.sections.map((s) => [s.id, s]));

  const questions = lesson.quiz.map((question) => ({
    question,
    selectedOptionId: answers[question.id],
    correct: isCorrect(question, answers[question.id]),
    section: sectionsById.get(question.sectionId),
  }));

  const missed = questions.filter((q) => !q.correct);

  // Keep objective order from the lesson so results read the same way the lesson was taught.
  const conceptsToRevisit = lesson.objectives.flatMap((objective) => {
    const missedForObjective = missed.filter((q) => q.question.objectiveId === objective.id);
    if (missedForObjective.length === 0) return [];
    const sectionIds = new Set(missedForObjective.map((q) => q.question.sectionId));
    return [
      {
        objective,
        missedQuestionIds: missedForObjective.map((q) => q.question.id),
        sections: lesson.sections.filter((s) => sectionIds.has(s.id)),
      },
    ];
  });

  return {
    score: questions.length - missed.length,
    total: questions.length,
    questions,
    conceptsToRevisit,
  };
}
