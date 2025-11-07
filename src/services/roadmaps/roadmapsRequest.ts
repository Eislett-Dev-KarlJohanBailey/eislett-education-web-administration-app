import { toast } from "@/hooks/use-toast";
import { formatGetReqJson, removeNulls } from "@/services/utils";

interface Roadmap {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  subject: string | { id: string; name: string; description?: string; createdAt?: string };
  strands?: Strand[];
}

interface Strand {
  id?: string;
  topic: string | { id: string; name: string; description?: string; createdAt?: string; subTopics?: any[] };
  sections: Section[];
  grade: number;
  gradeName: string;
}

interface Section {
  id?: string;
  title: string;
  description: string;
  quizzes: Quiz[];
}

interface Quiz {
  id?: string;
  difficultyLevel: number;
  difficultyRange: number;
  numberOfQuestions: number;
  subTopics: string[] | Array<{ id: string; name: string; description?: string; topicId?: string; createdAt?: string; hints?: any[] }>;
  stage: string;
}

interface RoadmapsReturnType {
  data?: Roadmap[];
  amount?: number;
  error?: string;
}

interface RoadmapReturnType {
  data?: Roadmap;
  error?: string;
}

async function handleFetchRoadmapById(
  token: string,
  roadmap_id?: string
): Promise<Roadmap | { error?: string }> {
  try {
    const rawResponse = await fetch(`/api/roadmaps/${roadmap_id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch roadmap");
    }

    return (await rawResponse.json()) as Roadmap;
  } catch (e) {
    toast({
      title: "Error fetching roadmap",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Roadmaps error", e);
    return { error: "Failed to fetch roadmap by id" };
  }
}

async function handleFetchRoadmaps(
  token: string,
  page_number?: number,
  page_size?: number
): Promise<RoadmapsReturnType> {
  try {
    const params: any = {
      page_number,
      page_size,
    };

    removeNulls(params);

    const queryString = Object.keys(params).length > 0 
      ? `?${formatGetReqJson(params)}` 
      : "";

    const rawResponse = await fetch(`/api/roadmaps${queryString}`, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch roadmaps");
    }

    return (await rawResponse.json()) as {
      data: Roadmap[];
      amount: number;
    };
  } catch (e) {
    toast({
      title: "Error fetching list of roadmaps",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Roadmaps error", e);
    return { error: "Failed to fetch roadmaps" };
  }
}

async function handleUpdateRoadmap(
  token: string,
  roadmap_id: string,
  roadmapData: Omit<Roadmap, 'subject'> & { subject: string }
): Promise<RoadmapReturnType> {
  try {
    const rawResponse = await fetch(`/api/roadmaps/${roadmap_id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(roadmapData),
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "Failed to update roadmap");
    }

    return (await rawResponse.json()) as RoadmapReturnType;
  } catch (e) {
    toast({
      title: "Error updating roadmap",
      style: { background: "red", color: "white" },
      duration: 3500,
    });
    console.log("Roadmaps error", e);
    return { error: "Failed to update roadmap" };
  }
}

export { handleFetchRoadmapById, handleFetchRoadmaps, handleUpdateRoadmap };
export type { Roadmap, Strand, Section, Quiz };

