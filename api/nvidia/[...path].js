const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function readBody(request) {
  const text = await request.text();
  return JSON.parse(text);
}

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Allow': 'POST, OPTIONS', 'Content-Type': 'application/json' },
      });
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) {
      return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not configured on server.' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { model, messages, temperature, max_tokens, top_p } = await readBody(request);

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

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
