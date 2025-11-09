import { QuestionOptionDetails } from "./questionOptionDetails";
import { QuestionSubTopicDetails } from "./QuestionSubTopicDetails";
import { QuestionTypes } from "./questionTypes";
import { SimpleShortAnswersOption } from "@/lib/types";

export interface QuestionDetails {
  id?: string;
  title: string;
  description: string;
  content: string; // the actual question
  isTrue?: boolean; // only present
  type: QuestionTypes;
  createdAt?: string;
  tags?: string[];
  totalPotentialMarks: number;
  difficultyLevel: number;
  subTopics?: QuestionSubTopicDetails[];
  multipleChoiceOptions?: QuestionOptionDetails[];
  shortAnswers?: SimpleShortAnswersOption[];
  explanation: string;
  hidden: boolean;
}
