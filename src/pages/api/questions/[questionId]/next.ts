import type { NextApiRequest, NextApiResponse } from "next";

interface NextQuestionResponse {
  nextId: string | null;
}

interface Error {
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NextQuestionResponse | Error>
) {
  const { questionId } = req.query;
  const method = req.method;

  console.log(`${method} /api/questions/${questionId}/next (App Router)`);

  if (method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!questionId) {
    return res.status(400).json({ error: "Invalid question id" });
  }

  try {
    const route = "questions";
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    // Build query string with optional params
    const queryParams = new URLSearchParams();
    if (req.query.hidden !== undefined) {
      queryParams.append("hidden", req.query.hidden as string);
    }
    if (req.query.type !== undefined) {
      queryParams.append("type", req.query.type as string);
    }

    const queryString = queryParams.toString();
    const url = `${nodeServer}${route}/${questionId}/next${queryString ? `?${queryString}` : ""}`;

    const rawResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token || "",
      },
    });

    if (!rawResponse.ok) {
      throw new Error("Failed to fetch next question");
    }

    const response = (await rawResponse.json()) as NextQuestionResponse;
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      error: `Failed to get next question for #${questionId}: ${error.message}`,
    });
  }
}

