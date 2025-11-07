import { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error?: string;
}

// Get Single Roadmap
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log("GET /api/roadmaps/[roadmapId]");

  const { roadmapId } = req.query;

  if (!roadmapId) {
    return res.status(400).json({ error: "Roadmap ID is required" });
  }

  try {
    const route = `roadmaps/${roadmapId}`;
    const token = req.headers.authorization;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(`${nodeServer}${route}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!rawResponse.ok) {
      throw new Error("Failed to fetch roadmap");
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Roadmap GET: " + error.message });
  }
}

// Update Roadmap
async function PUT(req: NextApiRequest, res: NextApiResponse) {
  console.log("PUT /api/roadmaps/[roadmapId]");

  const { roadmapId } = req.query;
  const roadmapDetails = await req.body;

  if (!roadmapId) {
    return res.status(400).json({ error: "Roadmap ID is required" });
  }

  if (!roadmapDetails?.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const route = `roadmaps/${roadmapId}`;
    const token = req.headers.authorization;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(`${nodeServer}${route}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(roadmapDetails),
    });

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update roadmap");
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Roadmap PUT: " + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return await GET(req, res);
  else if (req.method === "PUT") return await PUT(req, res);
  else return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

export default handler;

