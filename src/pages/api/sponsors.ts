import { NextApiRequest, NextApiResponse } from "next";

// Get All Sponsors
async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('GET /api/sponsors (App Router)');

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
    const route = 'sponsors';
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
      throw new Error('Failed to fetch sponsors');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Sponsors GET: ' + error.message });
  }
}

// Create Sponsor
async function POST(req: NextApiRequest, res: NextApiResponse) {
  console.log('POST /api/sponsors (App Router)');

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const route = 'sponsors';
    const nodeServer = process.env.SERVER_BASE_URL;

    // Collect the raw request body chunks to preserve FormData
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Preserve the original Content-Type header which includes the multipart boundary
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Content-Type must be multipart/form-data" });
    }

    // Forward the request with the raw body and proper headers
    const rawResponse = await fetch(
      `${nodeServer}${route}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          "Authorization": token,
          "Content-Type": contentType, // Preserve the boundary from original request
        },
        body: buffer, // Send the raw buffer
      }
    );

    if (!rawResponse.ok) {
      const errorData = await rawResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create sponsor');
    }

    const response = await rawResponse.json();
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({ error: 'Sponsors POST: ' + error.message });
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

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false, // Disable bodyParser for FormData
  },
}

export default handler;

