const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end(undefined, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' }, { headers: CORS_HEADERS });
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!nvidiaKey) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured on server.' }, { headers: CORS_HEADERS });
  }

  try {
    const { model, messages, temperature, max_tokens, top_p } = req.body;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nvidiaKey}`,
      },
      body: JSON.stringify({
        model: model || 'meta/llama-3.1-70b-instruct',
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: max_tokens ?? 4096,
        top_p: top_p ?? 0.95,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data, { headers: CORS_HEADERS });
    }

    return res.status(200).json(data, { headers: CORS_HEADERS });
  } catch (err) {
    return res.status(500).json({ error: err.message }, { headers: CORS_HEADERS });
  }
}
