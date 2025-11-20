import { HTTP_REQUEST_INTERVAL, HTTP_REQUEST_LIMIT } from "@/constants/rateLimitParams";
import rateLimit from "@/services/rateLimit";
import { formatGetReqJson } from "@/services/utils";
import { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error?: string 
}

// Generate Questions for Question Plan
async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log('POST /api/question-plans/[id]/generate (App Router)');

  const { id } = req.query;
  const requestBody = await req.body;

  if (!id) {
    return res.status(400).json({ error: 'Question Plan ID is required' });
  }

  if (!requestBody.limit) {
    return res.status(400).json({ error: 'Limit is required' });
  }

  try {
    const route = `question-plans/${id}/generate`;
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization" : token
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!rawResponse.ok) {
      throw new Error('Failed to generate questions');
    }

    const response = await rawResponse.json()

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans Generate POST: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method === 'POST') 
    return await POST(req, res)
  else 
    return res.status(405).json({ error: 'Method not allowed'});
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
}

export default handler;

