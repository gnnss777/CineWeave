import { getLLMApiKey } from './llm';

const NVIDIA_PROXY_URL = '/api/nvidia';

export async function analyzeScreenplay(screenplayElements) {
  const key = getLLMApiKey();
  if (!key) throw new Error('Configure a chave NVIDIA AI.');

  const text = screenplayElements.map(e => `[${e.type}] ${e.text}`).join('\n');
  const prompt = `Analise o roteiro em JSON seguindo padrões Hollywood:
{
  "pacing": "Rápido|Moderado|Lento",
  "dialogueQuality": "Natural|Expositivo|Robótico|Dramático",
  "tone": "string",
  "issues": [{"type":"pacing|dialogue|plotHole|character","line":0,"description":"string"}],
  "suggestions": ["string"],
  "score": 0-10
}
ROTEIRO:\n${text.substring(0, 8000)}`;

  const resp = await fetch(NVIDIA_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    return { error: 'Formato inválido', raw: content };
  }
}

export async function rewriteDialogue(text, tone = 'dramatico') {
  const key = getLLMApiKey();

  const toneMap = {
    dramatico: 'mais dramático',
    comico: 'mais cômico',
    terso: 'mais curto e direto',
    poetico: 'mais poético',
  };

  const prompt = `Reescreva o diálogo para ser ${toneMap[tone] || toneMap.dramatico}. Mantenha formato de roteiro. APENAS texto reescrito.\n\n${text}`;

  const resp = await fetch(NVIDIA_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || text;
}
