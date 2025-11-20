import {
  HTTP_REQUEST_INTERVAL,
  HTTP_REQUEST_LIMIT,
} from "@/constants/rateLimitParams";
import rateLimit from "@/services/rateLimit";
import { NextApiRequest, NextApiResponse } from "next";

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const isRateLimit = rateLimit(HTTP_REQUEST_LIMIT, HTTP_REQUEST_INTERVAL);
  if (!(await isRateLimit(req, res))) {
    return res
      .status(429)
      .json({ error: "Too many requests, please try again later." });
  }

  console.log("POST /api/administrators/login (App Router)");

  const email = await req.body?.email;
  const password = await req.body?.password;

  // console.log('body', req.body)

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  } else if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    // --- Handle Other Methods ---
    console.log(`Method ${req.method} Not Allowed for /api/administrators/login`);
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const route = "administrators/login";
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const params = { email: email, password: password };
    const rawResponse = await fetch(`${nodeServer}${route}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const response = await rawResponse.json();

    if (!rawResponse.ok) {
      if (response.error) {
        return res.status(400).json({ error: response.error });
      } else {
        throw new Error("Failed to login");
      }
    }
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: "Login Error: " + error.message });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

export default POST;

