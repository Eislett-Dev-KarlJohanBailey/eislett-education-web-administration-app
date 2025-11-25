import { NextApiRequest, NextApiResponse } from "next";

// Get Sponsor by ID
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/sponsors/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;

  if (!id) {
    return res.status(400).json({ error: 'Sponsor ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `sponsors/${id}`;
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
      throw new Error('Failed to fetch sponsor');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Sponsors GET: ' + error.message });
  }
}

// Update Sponsor
async function PUT(req: NextApiRequest, res: NextApiResponse) {
  console.log('PUT /api/sponsors/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;
  const requestBody = await req.body;

  if (!id) {
    return res.status(400).json({ error: 'Sponsor ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `sponsors/${id}`;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'PUT',
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
      throw new Error(errorData.error || 'Failed to update sponsor');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Sponsors PUT: ' + error.message });
  }
}

// Delete Sponsor
async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  console.log('DELETE /api/sponsors/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;

  if (!id) {
    return res.status(400).json({ error: 'Sponsor ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `sponsors/${id}`;
    const nodeServer = process.env.SERVER_BASE_URL;

    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          "Authorization": token
        },
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete sponsor');
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Sponsors DELETE: ' + error.message });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

