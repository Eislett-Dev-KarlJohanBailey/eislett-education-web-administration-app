import { DEFAULT_PAGE_SIZE } from "@/constants/tablePageSizes";
import { QuestionFormData, QuestionType } from "@/lib/types";
import { QuestionDetails } from "@/models/questions/questionDetails";
import { QuestionOptionDetails } from "@/models/questions/questionOptionDetails";
import { QuestionTypes } from "@/models/questions/questionTypes";
import { SubTopicDetails } from "@/models/subTopic/subTopicDetails";
import { RootState } from "@/store/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type direction = "asc" | "desc";
type array_operation = "ADD" | "REMOVE";
interface QuestionReqParams {
  page_number: number;
  page_size: number;
  sub_topic_id: string | undefined;
  name: string | undefined;
  type: string | undefined;
}

interface FilterTypes {
  sortColumn: string | undefined;
  sortDirection: direction;
  subtopicFilter: string | undefined;
  typeFilter: string | undefined;
  hiddenFilter: string | undefined; // "true" | "false" | undefined
}

interface QuestionPageSliceState {
  questions: QuestionDetails[];
  filteredQuestions: QuestionDetails[];
  subtopics: SubTopicDetails[];
  questionParams: QuestionReqParams;
  totalQuestion: number;
  filters: FilterTypes;
  delete: {
    questionId: string | undefined;
    isDeleting: boolean;
    showDeleteDialog: boolean;
  };
  isLoading: boolean; // for questions grid
  isLoadingFormData: boolean; // for question form
  questionFormData: QuestionFormData;
  subtopicsToLink: string[];
}

const initialState = {
  questions: [] as QuestionDetails[],
  filteredQuestions: [] as QuestionDetails[],
  subtopics: [] as SubTopicDetails[],
  questionParams: {
    page_number: 1,
    page_size: DEFAULT_PAGE_SIZE,
    sub_topic_id: undefined as string | undefined, // selected subtopic
    name: undefined,
    type: undefined as string | undefined,
  },
  totalQuestion: 0,
  filters: {
    sortColumn: undefined as string | undefined,
    sortDirection: "asc" as direction,
    subtopicFilter: undefined as string | undefined,
    typeFilter: undefined as string | undefined,
    hiddenFilter: undefined as string | undefined,
  },
  delete: {
    questionId: undefined as string | undefined,
    isDeleting: false,
    showDeleteDialog: false,
  },
  isLoading: false,
  isLoadingFormData: false,

  // For create form
  questionFormData: {
    title: "",
    description: "",
    content: "",
    tags: [],
    type: QuestionType.MULTIPLE_CHOICE,
    totalPotentialMarks: 1,
    difficultyLevel: 0.1,
    multipleChoiceOptions: [
      { id: 1, content: "", isCorrect: false },
      { id: 2, content: "", isCorrect: false },
      { id: 3, content: "", isCorrect: false },
      { id: 4, content: "", isCorrect: false },
    ],
    shortAnswers: [],
    explanation: "",
    hidden: false,
  },
  subtopicsToLink: [] as string[],
};

export const QuestionPageSlice = createSlice({
  name: "QuestionPageSlice",
  initialState,
  reducers: {
    resetQuestionPageSlice: (state: QuestionPageSliceState) => initialState,

    setQuestions: (
      state: QuestionPageSliceState,
      action: PayloadAction<QuestionDetails[]>
    ) => {
      state.questions = action.payload ?? [];
      state.filteredQuestions = [];
    },

    setFilteredQuestions: (
      state: QuestionPageSliceState,
      action: PayloadAction<QuestionDetails[]>
    ) => {
      state.filteredQuestions = action.payload ?? [];
    },

    setQuestionSubtopics: (
      state: QuestionPageSliceState,
      action: PayloadAction<SubTopicDetails[]>
    ) => {
      state.subtopics = action.payload ?? [];
    },

    setQuestionReqParams: (
      state: QuestionPageSliceState,
      action: PayloadAction<Partial<QuestionReqParams>>
    ) => {
      state.questionParams = { ...state.questionParams, ...action.payload };
    },

    setQuestionAmount: (
      state: QuestionPageSliceState,
      action: PayloadAction<number>
    ) => {
      state.totalQuestion = action.payload;
    },

    setQuestionTableFilters: (
      state: QuestionPageSliceState,
      action: PayloadAction<Partial<FilterTypes>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setQuestionTableDeleteData: (
      state: QuestionPageSliceState,
      action: PayloadAction<{
        questionId: string | undefined;
        isDeleting: boolean;
        showDeleteDialog: boolean;
      }>
    ) => {
      state.delete = action.payload;
    },

    setQuestionsIsLoading: (
      state: QuestionPageSliceState,
      action: PayloadAction<boolean>
    ) => {
      state.isLoading = action.payload;
    },

    setQuestionFormIsLoading: (
      state: QuestionPageSliceState,
      action: PayloadAction<boolean>
    ) => {
      state.isLoadingFormData = action.payload;
    },

    // for create form
    setQuestionFormData: (
      state: QuestionPageSliceState,
      action: PayloadAction<{ field: keyof QuestionFormData; value: any }>
    ) => {
      console.log('Redux reducer - setQuestionFormData called:', { 
        field: action.payload.field, 
        value: action.payload.value,
        valueType: typeof action.payload.value,
        currentHidden: state.questionFormData.hidden
      });
      state.questionFormData = {
        ...state.questionFormData,
        [action.payload.field]: action.payload.value,
      };
      console.log('Redux reducer - after update, hidden is:', state.questionFormData.hidden);
    },

    // for create form
    setAllQuestionFormData: (
      state: QuestionPageSliceState,
      action: PayloadAction<QuestionFormData>
    ) => {
      state.questionFormData = { ...action.payload };
    },

    setQuestionFormSubtopics: (
      state: QuestionPageSliceState,
      action: PayloadAction<{ operation_type: array_operation; value: string }>
    ) => {
      if (action.payload.operation_type === "ADD")
        state.subtopicsToLink = [
          ...state.subtopicsToLink,
          action.payload.value,
        ];
      if (action.payload.operation_type === "REMOVE")
        state.subtopicsToLink = state.subtopicsToLink.filter(
          (id) => id != action.payload.value
        );
    },

    setAllQuestionFormSubtopics: (
      state: QuestionPageSliceState,
      action: PayloadAction<string[]>
    ) => {
      state.subtopicsToLink = action.payload ?? [];
    },
  },
});

// export reducer to be added in src/store/store.ts
export default QuestionPageSlice.reducer;

// export actions to be called in components
export const {
  resetQuestionPageSlice,
  setQuestionReqParams,
  setQuestions,
  setFilteredQuestions,
  setQuestionSubtopics,
  setQuestionAmount,
  setQuestionTableFilters,
  setQuestionTableDeleteData,
  setQuestionsIsLoading,
  setQuestionFormIsLoading,
  setAllQuestionFormData,
  setQuestionFormData,
  setQuestionFormSubtopics,
  setAllQuestionFormSubtopics,
} = QuestionPageSlice.actions;

export const getQuestionReqParams = (state: RootState) =>
  state.QuestionPageSlice.questionParams;
export const getQuestions = (state: RootState) =>
  state.QuestionPageSlice.questions;
export const getFilteredQuestions = (state: RootState) =>
  state.QuestionPageSlice.filteredQuestions;
export const getQuestionSubtopics = (state: RootState) =>
  state.QuestionPageSlice.subtopics;
export const getQuestionAmt = (state: RootState) =>
  state.QuestionPageSlice.totalQuestion;
export const getQuestionTableFilters = (state: RootState) =>
  state.QuestionPageSlice.filters;
export const getQuestionTableDeleteData = (state: RootState) =>
  state.QuestionPageSlice.delete;
export const getQuestionsIsLoading = (state: RootState) =>
  state.QuestionPageSlice.isLoading;
export const getQuestionFormIsLoading = (state: RootState) =>
  state.QuestionPageSlice.isLoadingFormData;

export const getQuestionFormData = (state: RootState) =>
  state.QuestionPageSlice.questionFormData as QuestionDetails;
export const getQuestionFormSubtopics = (state: RootState) =>
  state.QuestionPageSlice.subtopicsToLink;
