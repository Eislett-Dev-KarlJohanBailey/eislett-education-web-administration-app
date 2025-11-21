import { NextApiRequest, NextApiResponse } from "next";

// Get All Feature Flags
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/feature-flags');

  const query = req.query;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  if (!query?.page_number) {
    return res.status(400).json({ error: 'Page Number is required' });
  }
  else if (!query.page_size) {
    return res.status(400).json({ error: 'Page Size is required' });
  }

  try {
    const route = 'feature-flags';
    const nodeServer = process.env.SERVER_BASE_URL;

    const queryString = new URLSearchParams({
      page_number: query.page_number as string,
      page_size: query.page_size as string,
    }).toString();

    const rawResponse = await fetch(
      `${nodeServer}${route}?${queryString}`,
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
      throw new Error('Failed to fetch feature flags');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Feature Flags GET: ' + error.message });
  }
}

// Create Feature Flag
async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log('POST /api/feature-flags');

  const token = req.headers.authorization;
  const requestBody = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const route = 'feature-flags';
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization": token
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create feature flag');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Feature Flags POST: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') 
    return await GET(req, res)
  else if (req.method === 'POST')
    return await POST(req, res)
  else 
    return res.status(405).json({ error: 'Method not allowed'});
}

export default handler;

