export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_or_false",
  SHORT_ANSWER = "short_answer",
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  createdAt: string;
  type: QuestionType;
  totalPotentialMarks: number;
  difficultyLevel: number;
  subtopicId: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface SimpleShortAnswersOption {
  content: string;
  marks: number;
  explanation?: string;
}

export interface QuestionFormData {
  id?: number;
  title: string;
  description: string;
  content: string;
  tags: string[];
  type: QuestionType;
  totalPotentialMarks: number;
  difficultyLevel: number;
  // subtopicId: string
  multipleChoiceOptions: QuestionOption[];
  shortAnswers?: SimpleShortAnswersOption[];
  explanation: string;
  hidden: boolean;
}
