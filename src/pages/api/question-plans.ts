import { HTTP_REQUEST_INTERVAL, HTTP_REQUEST_LIMIT } from "@/constants/rateLimitParams";
import rateLimit from "@/services/rateLimit";
import { formatGetReqJson } from "@/services/utils";
import { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error?: string 
}

// Get All Question Plans
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/question-plans (App Router)');

  const query = req.query;

  console.log('query', req.query)

  if (!query?.page_number) {
    return res.status(400).json({ error: 'Page Number is required' });
  }
  else if (!query.page_size) {
    return res.status(400).json({ error: 'Page Size is required' });
  }

  try {
    const route = 'question-plans';
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}?${formatGetReqJson(query)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization" : token
        },
      }
    );

    if (!rawResponse.ok) {
      throw new Error('Failed to fetch question plans');
    }

    const response = await rawResponse.json()

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans GET: ' + error.message });
  }
}

// Create Question Plan
async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log('POST /api/question-plans (App Router)');

  const requestBody = await req.body;
  console.log('POST request body:', requestBody);

  if (!requestBody.subTopicId) {
    return res.status(400).json({ error: 'SubTopic ID is required' });
  }
  else if (!requestBody.prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  else if (requestBody.quota === undefined || requestBody.quota === null) {
    return res.status(400).json({ error: 'Quota is required' });
  }

  try {
    const route = 'question-plans';
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
      throw new Error('Failed to create question plan');
    }

    const response = await rawResponse.json()

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans POST: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method === 'GET') 
    return await GET(req, res)
  else if (req.method === 'POST')
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

