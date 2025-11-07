import { NextApiRequest, NextApiResponse } from "next";
import { formatGetReqJson } from "@/services/utils";

interface Error {
  error?: string;
}

// Get All Roadmaps
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log("GET /api/roadmaps");

  const query = req.query;

  try {
    const route = "roadmaps";
    const token = req.headers.authorization;
    const nodeServer = process.env.SERVER_BASE_URL;

    const queryString = Object.keys(query).length > 0 
      ? `?${formatGetReqJson(query)}` 
      : "";

    const rawResponse = await fetch(`${nodeServer}${route}${queryString}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!rawResponse.ok) {
      throw new Error("Failed to fetch roadmaps");
    }

    const response = await rawResponse.json();
    console.log("GET /api/roadmaps (Response):", response);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Roadmaps GET: " + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return await GET(req, res);
  else return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

export default handler;

