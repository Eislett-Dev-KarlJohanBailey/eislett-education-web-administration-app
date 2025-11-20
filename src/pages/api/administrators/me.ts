import { NextApiRequest, NextApiResponse } from "next";

async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log("GET /api/administrators/me (App Router)");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const route = "administrators/me";
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
      const errorData = await rawResponse.json().catch(() => ({}));
      return res.status(rawResponse.status).json({ error: errorData.error || "Failed to fetch user details" });
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch user details: " + error.message });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

export default GET;

