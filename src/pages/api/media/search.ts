import { formatGetReqJson } from "@/services/utils";
import { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error?: string;
}

// Search Media
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log("GET /api/media/search");

  const query = req.query; // { q, maxResults }

  if (!query?.q) {
    return res.status(400).json({ error: "Search query (q) is required" });
  }

  try {
    const route = "media/search";
    const token = req.headers.authorization;
    const nodeServer = process.env.SERVER_BASE_URL;

    const queryString = formatGetReqJson(query);
    const url = `${nodeServer}${route}?${queryString}`;

    const rawResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!rawResponse.ok) {
      throw new Error("Failed to search media");
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Media Search GET: " + error.message });
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

