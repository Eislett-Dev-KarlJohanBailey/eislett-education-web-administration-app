import { toast } from "@/hooks/use-toast";
import { formatGetReqJson, removeNulls } from "@/services/utils";

export interface QuestionPlanCreatedQuestion {
  question: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    totalPotentialMarks: number;
    difficultyLevel: number;
    type: string;
    options?: Array<{
      content: string;
      isCorrect: boolean;
    }>;
    shortAnswers?: Array<{
      content: string;
      marks: number;
    }>;
    isTrue?: boolean;
    explanation: string;
    subTopics: Array<Record<string, any>>;
    createdAt: string;
    hidden: boolean;
  };
}

export interface QuestionPlan {
  id: string;
  subTopicId: string;
  prompt: string;
  bannedList: string[];
  creativityLevel: number;
  difficultyLevel: number;
  tags: string[];
  quota: number;
  created: QuestionPlanCreatedQuestion[];
  locked: boolean;
  active: boolean;
  createdAt: string;
  vectorStores?: VectorStore[];
}

interface QuestionPlansResponse {
  data?: QuestionPlan[];
  amount?: number;
  pagination?: {
    page_size: number;
    page_number: number;
    total_pages: number;
  };
  error?: string;
}

export interface VectorStore {
  vectorStoreId: string;
  vectorStoreProvider: string;
  name: string;
  usage: string;
}

export interface QuestionPlanPreset {
  id: string;
  name: string;
  vectorStores: VectorStore[];
  prompt?: string;
  createdAt: string;
}

export interface QuestionPlanPresetsResponse {
  amount: number;
  data: QuestionPlanPreset[];
  pagination: {
    page_size: number;
    page_number: number;
    total_pages: number;
  };
}

export interface CreateQuestionPlanRequest {
  id?: string;
  subTopicId: string;
  prompt: string;
  bannedList?: string[];
  creativityLevel: number;
  difficultyLevel: number;
  tags?: string[];
  quota: number;
  active?: boolean;
  created?: Array<{ question: string }>;
  locked?: boolean;
  vectorStores?: VectorStore[];
}

export async function handleFetchQuestionPlans(
  token: string,
  page_number: number,
  page_size: number
): Promise<QuestionPlansResponse> {
  try {
    const params = {
      page_number,
      page_size,
    };

    removeNulls(params);

    const rawResponse = await fetch(
      `/api/question-plans?${formatGetReqJson(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const response = (await rawResponse.json()) as QuestionPlansResponse;
    return response;
  } catch (e) {
    toast({
      title: "Error fetching question plans",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { error: "Failed to fetch question plans" };
  }
}

export async function handleFetchQuestionPlanById(
  token: string,
  planId: string
): Promise<{ data?: QuestionPlan; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/question-plans/${planId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch question plan");
    }

    // The API returns the question plan directly, not wrapped in { data: ... }
    const questionPlan = (await rawResponse.json()) as QuestionPlan;
    return { data: questionPlan };
  } catch (e: any) {
    toast({
      title: e.message || "Error fetching question plan",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { error: e.message || "Failed to fetch question plan" };
  }
}

export async function handleCreateQuestionPlan(
  token: string,
  planData: CreateQuestionPlanRequest
): Promise<{ data?: QuestionPlan; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/question-plans`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create question plan");
    }

    const response = (await rawResponse.json()) as { data: QuestionPlan };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error creating question plan",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { error: e.message || "Failed to create question plan" };
  }
}

export async function handleUpdateQuestionPlan(
  token: string,
  planId: string,
  planData: CreateQuestionPlanRequest
): Promise<{ data?: QuestionPlan; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/question-plans/${planId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update question plan");
    }

    const response = (await rawResponse.json()) as { data: QuestionPlan };
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error updating question plan",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { error: e.message || "Failed to update question plan" };
  }
}

export interface GenerateQuestionsResponse {
  success: boolean;
  data: QuestionPlanCreatedQuestion[];
  total: number;
  hidden: number;
  visible: number;
  error?: string;
}

export async function handleDeleteQuestionPlan(
  token: string,
  planId: string
): Promise<{ deleted: boolean; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/question-plans/${planId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (rawResponse.ok) {
      return { deleted: true };
    }

    const errorData = await rawResponse.json().catch(() => ({}));
    return { deleted: false, error: errorData.error || "Failed to delete question plan" };
  } catch (e: any) {
    toast({
      title: e.message || "Error deleting question plan",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { deleted: false, error: e.message || "Failed to delete question plan" };
  }
}

export async function handleGenerateQuestions(
  token: string,
  planId: string,
  limit: number = 100
): Promise<GenerateQuestionsResponse> {
  try {
    const rawResponse = await fetch(
      `/api/question-plans/${planId}/generate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ limit: limit.toString() }),
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate questions");
    }

    const response = (await rawResponse.json()) as GenerateQuestionsResponse;
    return response;
  } catch (e: any) {
    toast({
      title: e.message || "Error generating questions",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plans error", e);
    return { 
      success: false,
      data: [],
      total: 0,
      hidden: 0,
      visible: 0,
      error: e.message || "Failed to generate questions" 
    };
  }
}

export async function handleFetchQuestionPlanPresets(
  token: string
): Promise<{ data?: QuestionPlanPreset[]; error?: string }> {
  try {
    const rawResponse = await fetch(
      `/api/question-plan-presets`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch question plan presets");
    }

    const response = (await rawResponse.json()) as QuestionPlanPresetsResponse;
    return { data: response.data || [] };
  } catch (e: any) {
    toast({
      title: e.message || "Error fetching question plan presets",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Question plan presets error", e);
    return { error: e.message || "Failed to fetch question plan presets" };
  }
}

