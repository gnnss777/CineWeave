const NVIDIA_PROXY_URL = '/api/nvidia';

const DEFAULT_MODEL = 'meta/llama-3.1-70b-instruct';

const STORY_PARSE_PROMPT = `Você é um servidor de API de dados automatizado e rigoroso. Sua função é receber textos narrativos em português, analisá-los e retornar elementos de roteiro e mapa mental formatados.

Sua resposta deve conter UNICAMENTE o objeto JSON correspondente. 

REGRAS DE RESPOSTA CRÍTICAS:
1. NÃO adicione nenhum texto introdutório (ex: "Aqui está a análise...", "Com base no texto...").
2. NÃO adicione nenhum texto de conclusão ou observações finais.
3. NÃO use formatação Markdown de texto (como listas com *, +, - para descrever os personagens). Toda a resposta deve ser apenas o JSON estruturado bruto.
4. Comece sua resposta EXATAMENTE com o caractere "{" e termine EXATAMENTE com o caractere "}".
5. Siga exatamente o formato JSON fornecido abaixo.

Extraia:
- characters: lista de personagens (nome, papel: Protagonista/Antagonista/Aliado/Coadjuvante, descrição, traços como array, backstory)
- locations: lista de cenários (nome, tipo "INT." ou "EXT.", descrição, período "DIA" ou "NOITE", mood)
- objects: lista de objetos (nome, descrição, significado)
- scenes: lista de cenas (título, descrição, act como número romano ou nome do ato, elements como array contendo o roteiro formatado de ações e diálogos reais).

IMPORTANTE SOBRE OS DIÁLOGOS DE CADA CENA:
- Cada cena DEVE conter diálogos reais completos condizentes com a história no campo "elements" no formato de objetos:
  { "type": "scene-heading" | "action" | "character" | "dialogue" | "parenthetical", "text": "..." }
  - Escreva cabeçalho, ações detalhadas de cena, personagens e falas completas! Nada de placeholders.

Esquema do JSON esperado:
{
  "characters": [
    { "name": "...", "role": "...", "description": "...", "traits": ["...", "..."], "backstory": "..." }
  ],
  "locations": [
    { "name": "...", "type": "INT. ou EXT.", "description": "...", "timeOfDay": "DIA ou NOITE", "mood": "..." }
  ],
  "objects": [
    { "name": "...", "description": "...", "significance": "..." }
  ],
  "scenes": [
    {
      "title": "...",
      "description": "...",
      "act": "Nome do Ato (ex: I, II, Ato Final, Epílogo)",
      "elements": [
        { "type": "scene-heading", "text": "..." },
        { "type": "action", "text": "..." },
        { "type": "character", "text": "..." },
        { "type": "parenthetical", "text": "..." },
        { "type": "dialogue", "text": "..." }
      ]
    }
  ]
}`;

const EXTRACTION_PROMPT = `Você é um analisador de documentos de roteiro e reuniões criativas.
Sua tarefa é ler MÚLTIPLOS documentos (transcrições de áudio, PDFs, notas, roteiros parciais) e extrair APENAS o que está EXPLICITAMENTE contido neles.

REGRAS ABSOLUTAS:
1. NÃO INVENTE, NÃO CRIE, NÃO PREENCHA LACUNAS. Se não está no texto, não extraia.
2. NÃO adicione interpretações criativas. Seja fiel ao material fonte.
3. Se a mesma entidade aparece em múltiplos documentos, combine as informações.
4. Retorne APENAS JSON válido, sem markdown, sem texto introdutório.

CATEGORIAS PARA EXTRAÇÃO (6 categorias do Brainstorm):
- characters: { name, role, description, traits[], backstory, sourceDoc }
- plot_points: { title, description, act, order, sourceDoc }
- scenes: { title, description, act, elements:[{type, text}], sourceDoc }
- dialogues: { character, text, context, sceneRef, sourceDoc }
- world_elements: { name, type, description, significance, sourceDoc }
- themes: { statement, evidence, relevance, sourceDoc }

TIPOS DE ELEMENTOS DE CENA (para scenes.elements):
- "scene-heading": "INT. LOCAL - DIA/NOITE"
- "action": "Descrição de ação narrativa"
- "character": "NOME DO PERSONAGEM"
- "parenthetical": "(instrução de atuação)"
- "dialogue": "Fala do personagem"

Esquema do JSON esperado:
{
  "characters": [],
  "plot_points": [],
  "scenes": [],
  "dialogues": [],
  "world_elements": [],
  "themes": []
}`;

let apiKey = null;

const DEFAULT_API_KEY = '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';

export function setLLMApiKey(key) {
  apiKey = key;
  if (key) {
    localStorage.setItem('nvidia_llm_key', key);
  } else {
    localStorage.removeItem('nvidia_llm_key');
  }
}

export function getLLMApiKey() {
  if (!apiKey) {
    apiKey = localStorage.getItem('nvidia_llm_key');
  }
  if (!apiKey) {
    apiKey = DEFAULT_API_KEY;
  }
  return apiKey;
}

export function hasLLMKey() {
  return true;
}

export async function parseStoryWithLLM(storyText, onProgress) {
  if (!storyText || storyText.trim().length < 10) {
    throw new Error('Texto da história muito curto. Escreva pelo menos 10 caracteres.');
  }

  const key = getLLMApiKey();
  if (!key) {
    throw new Error('Configure a chave da API NVIDIA primeiro.');
  }

  onProgress?.('Enviando história para análise...');

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: STORY_PARSE_PROMPT },
      { role: 'user', content: `Texto da história:\n\n${storyText}` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    top_p: 0.95,
    response_format: { type: "json_object" }
  };

  const response = await fetch(`${NVIDIA_PROXY_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errMsg = `Erro na API NVIDIA (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.error?.message) {
        errMsg += `: ${errBody.error.message}`;
      } else if (errBody.message) {
        errMsg += `: ${errBody.message}`;
      }
    } catch {}
    throw new Error(errMsg);
  }

  onProgress?.('Processando resposta...');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  console.log('[LLM] Raw response content:', content);

  if (!content) {
    throw new Error('Resposta vazia da API. Tente novamente.');
  }

  onProgress?.('Extraindo dados estruturados...');

  const json = extractJSON(content);

  console.log('[LLM] Parsed JSON:', json);

  if (!json) {
    throw new Error('Não foi possível extrair um JSON válido da resposta. Tente novamente.');
  }

  return json;
}

export async function extractStructureFromDocuments(documents, onProgress, existingProject = {}) {
  if (!documents || documents.length === 0) {
    throw new Error('Nenhum documento para processar.');
  }

  const key = getLLMApiKey();
  if (!key) {
    throw new Error('Configure a chave da API NVIDIA primeiro.');
  }

  onProgress?.('Preparando documentos para análise...');

  const docsText = documents.map((doc, i) => {
    const header = `=== DOCUMENTO ${i + 1}: ${doc.name} (${doc.type}) ===`;
    return `${header}\n${doc.content}\n`;
  }).join('\n\n');

  const existingSummary = summarizeExistingProject(existingProject);

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `DOCUMENTOS PARA ANÁLISE:\n\n${docsText}\n\n--- PROJETO ATUAL (para evitar duplicatas) ---\n${existingSummary}\n\nExtraia e retorne JSON com as 6 categorias.` }
    ],
    temperature: 0.1,
    max_tokens: 8192,
    top_p: 0.95,
    response_format: { type: "json_object" }
  };

  onProgress?.('Enviando para IA extrair estrutura...');

  const response = await fetch(`${NVIDIA_PROXY_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Erro na API (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  console.log('[LLM] Extraction raw response:', content);

  if (!content) {
    throw new Error('Resposta vazia da API.');
  }

  onProgress?.('Processando extração...');

  const json = extractJSON(content);

  if (!json) {
    throw new Error('Não foi possível extrair JSON válido da resposta.');
  }

  return {
    characters: json.characters || [],
    plot_points: json.plot_points || [],
    scenes: json.scenes || [],
    dialogues: json.dialogues || [],
    world_elements: json.world_elements || [],
    themes: json.themes || []
  };
}

const SCREENPLAY_ENRICH_PROMPT = `Você é um analisador de roteiro especializado em extrair objetos, eventos da trama e temas de roteiros no formato Fountain.

Analise o roteiro abaixo e extraia:

1. world_elements (OBJETOS): Itens físicos, objetos de cena, tecnologia, documentos, armas, veículos, etc. que aparecem nas ações ou diálogos. Ex: "celular", "chave do carro", "facas", "gol branco", "foto de família", "caderno A3", "lápis 6B", "incenso". INCLUA APENAS itens relevantes para a história (não inclua itens genéricos como "mesa", "cadeira" a menos que tenham significado especial).

2. plot_points: Eventos-chave da história em ordem cronológica. Cada plot point deve ter um título curto, descrição, e o ato (ACT I, ACT II ou ACT III) em que ocorre. Ex: "Duda descobre o dinheiro no balcão", "Maria mostra o desenho para Duda", "As irmãs decidem ir à festa juntas".

3. themes: Temas centrais do roteiro. Ex: "Relações familiares", "Diferenças de geração", "Amadurecimento", "Perdão", "Tradição vs modernidade". Cada tema deve ter uma frase-tema (statement), evidência extraída do texto (evidence), e relevância (Central, Secundário ou Menor).

REGRAS:
- Extraia APENAS o que está EXPLICITAMENTE no texto. NÃO invente.
- Para objetos, inclua o nome, tipo ("object"), descrição curta e significado (opcional).
- Para plot points, estime o ato baseado na posição no roteiro.
- Retorne APENAS JSON válido, sem markdown.

Esquema do JSON:
{
  "world_elements": [
    { "name": "nome do objeto", "type": "object", "description": "descrição", "significance": "importância na história" }
  ],
  "plot_points": [
    { "title": "Título do evento", "description": "Descrição", "act": "I", "order": 0 }
  ],
  "themes": [
    { "statement": "Frase-tema", "evidence": "Evidência do texto", "relevance": "Central" }
  ]
}`;

export async function extractEnrichmentFromScreenplay(screenplayText, onProgress) {
  if (!screenplayText || screenplayText.trim().length < 50) {
    throw new Error('Texto do roteiro muito curto para extração.');
  }

  const key = getLLMApiKey();
  if (!key) {
    throw new Error('Configure a chave da API NVIDIA primeiro.');
  }

  onProgress?.('Enviando roteiro para extrair objetos, plot points e temas...');

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: SCREENPLAY_ENRICH_PROMPT },
      { role: 'user', content: `ROTEIRO:\n\n${screenplayText}` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    top_p: 0.95,
    response_format: { type: "json_object" }
  };

  const response = await fetch(`${NVIDIA_PROXY_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Erro na API (${response.status})`);
  }

  onProgress?.('Processando resposta da IA...');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  if (!content) {
    throw new Error('Resposta vazia da API.');
  }

  const json = extractJSON(content);

  if (!json) {
    throw new Error('Não foi possível extrair JSON válido da resposta.');
  }

  const worldElements = json.world_elements || [];
  const plotPoints = json.plot_points || [];
  const themes = json.themes || [];

  onProgress?.(`Extraídos ${worldElements.length} objetos, ${plotPoints.length} plot points, ${themes.length} temas`);

  return { world_elements: worldElements, plot_points: plotPoints, themes };
}

function summarizeExistingProject(project) {
  if (!project) return 'Projeto vazio.';
  
  const parts = [];
  if (project.entities?.characters?.length) {
    parts.push(`Personagens existentes: ${project.entities.characters.map(c => c.name).join(', ')}`);
  }
  if (project.entities?.locations?.length) {
    parts.push(`Locais existentes: ${project.entities.locations.map(l => l.name).join(', ')}`);
  }
  if (project.entities?.objects?.length) {
    parts.push(`Objetos existentes: ${project.entities.objects.map(o => o.name).join(', ')}`);
  }
  if (project.screenplay?.length) {
    const sceneHeadings = project.screenplay
      .filter(s => s.type === 'scene-heading')
      .map(s => s.text)
      .slice(0, 10);
    parts.push(`Cenas no roteiro: ${sceneHeadings.join('; ')}`);
  }
  if (project.mindMapNodes?.length) {
    parts.push(`Nós no mapa: ${project.mindMapNodes.map(n => n.label).slice(0, 10).join(', ')}`);
  }
  
  return parts.join('\n') || 'Projeto vazio.';
}

function extractJSON(text) {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (jsonBlock) {
    try { return JSON.parse(jsonBlock[1]); } catch {}
  }
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch {}
  }
  return null;
}