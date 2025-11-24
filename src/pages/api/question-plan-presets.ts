import { NextApiRequest, NextApiResponse } from "next";

// Get Question Plan Presets
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/question-plan-presets (App Router)');

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = 'question-plan-presets';
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization": token
        },
      }
    );

    if (!rawResponse.ok) {
      throw new Error('Failed to fetch question plan presets');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Question Plan Presets GET: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') 
    return await GET(req, res)
  else 
    return res.status(405).json({ error: 'Method not allowed'});
}

export default handler;

