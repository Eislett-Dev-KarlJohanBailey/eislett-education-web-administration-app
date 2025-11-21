import { NextApiRequest, NextApiResponse } from "next";

// Get Advertisement by ID
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/advertisements/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;

  if (!id) {
    return res.status(400).json({ error: 'Advertisement ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `advertisements/${id}`;
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
      throw new Error('Failed to fetch advertisement');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Advertisements GET: ' + error.message });
  }
}

// Update Advertisement
async function PUT(req: NextApiRequest, res: NextApiResponse) {
  console.log('PUT /api/advertisements/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;
  const requestBody = await req.body;

  if (!id) {
    return res.status(400).json({ error: 'Advertisement ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `advertisements/${id}`;
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
      throw new Error(errorData.error || 'Failed to update advertisement');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Advertisements PUT: ' + error.message });
  }
}

// Delete Advertisement
async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  console.log('DELETE /api/advertisements/[id] (App Router)');

  const { id } = req.query;
  const token = req.headers.authorization;

  if (!id) {
    return res.status(400).json({ error: 'Advertisement ID is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const route = `advertisements/${id}`;
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
      throw new Error(errorData.error || 'Failed to delete advertisement');
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Advertisements DELETE: ' + error.message });
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

