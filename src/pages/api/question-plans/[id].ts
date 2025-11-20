import { HTTP_REQUEST_INTERVAL, HTTP_REQUEST_LIMIT } from "@/constants/rateLimitParams";
import rateLimit from "@/services/rateLimit";
import { formatGetReqJson } from "@/services/utils";
import { NextApiRequest, NextApiResponse } from "next";

interface Error {
  error?: string 
}

// Get Question Plan by ID
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/question-plans/[id] (App Router)');

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Question Plan ID is required' });
  }

  try {
    const route = `question-plans/${id}`;
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
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
      throw new Error('Failed to fetch question plan');
    }

    const response = await rawResponse.json()

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans GET: ' + error.message });
  }
}

// Update Question Plan
async function PUT(req: NextApiRequest, res: NextApiResponse) {
  console.log('PUT /api/question-plans/[id] (App Router)');

  const { id } = req.query;
  const requestBody = await req.body;

  if (!id) {
    return res.status(400).json({ error: 'Question Plan ID is required' });
  }

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
    const route = `question-plans/${id}`;
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization" : token
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!rawResponse.ok) {
      throw new Error('Failed to update question plan');
    }

    const response = await rawResponse.json()

    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans PUT: ' + error.message });
  }
}

// Delete Question Plan
async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  console.log('DELETE /api/question-plans/[id] (App Router)');

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Question Plan ID is required' });
  }

  try {
    const route = `question-plans/${id}`;
    const token = req.headers.authorization;
    const apiKey = process.env.API_KEY;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization" : token
        },
      }
    );

    if (!rawResponse.ok) {
      throw new Error('Failed to delete question plan');
    }

    return res.status(200).end("");
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plans DELETE: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method === 'GET') 
    return await GET(req, res)
  else if (req.method === 'PUT')
    return await PUT(req, res)
  else if (req.method === 'DELETE')
    return await DELETE(req, res)
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

