/**
 * EntitiesSchema.js — Schema canônico de entidades narrativas
 * FASE 0.1: Estrutura de dados centralizada para CineWeave
 * 
 * Todas as entidades narrativas (personagens, locações, cenas, etc.)
 * vivem em project.entities. O schema abaixo define a forma canônica
 * de cada tipo, usada tanto para validação quanto para criação.
 */

// Valores padrão por tipo de entidade
export const ENTITY_DEFAULTS = {
  characters: {
    id: '',
    name: '',
    role: 'Coadjuvante',       // Protagonista, Antagonista, Aliado, Mentor, Coadjuvante, Figurante
    description: '',
    traits: [],                 // array de strings
    backstory: '',
    avatar: 'amber',            // amber, green, blue, purple, red, pink
    notes: '',
    relationships: [],          // [{ targetId, type: 'aliado'|'rival'|'mentor'|'familia', intensity: 1-5 }]
    createdAt: 0,
    updatedAt: 0,
  },
  locations: {
    id: '',
    name: '',
    type: 'INT.',               // INT., EXT., INT./EXT.
    description: '',
    timeOfDay: 'DIA',           // DIA, NOITE, TARDE, ENTARDECER, MADRUGADA
    mood: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  objects: {
    id: '',
    name: '',
    description: '',
    significance: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  scenes: {
    id: '',
    title: '',
    synopsis: '',
    actId: null,                // ref para entities.acts[].id
    characterIds: [],           // refs para entities.characters[].id
    order: 0,                   // posição na timeline
    status: 'draft',            // draft, written, revised, final
    createdAt: 0,
    updatedAt: 0,
  },
  plot_points: {
    id: '',
    title: '',
    description: '',
    actId: null,
    tags: [],
    createdAt: 0,
    updatedAt: 0,
  },
  themes: {
    id: '',
    statement: '',
    evidence: '',
    relevance: 'Central',       // Central, Secundário, Menor
    createdAt: 0,
    updatedAt: 0,
  },
  acts: {
    id: '',
    name: '',
    order: 0,
    description: '',
    color: '#ccee00',
    createdAt: 0,
    updatedAt: 0,
  },
  dialogues: {
    id: '',
    speaker: '',
    line: '',
    context: '',
    tags: [],
    sceneId: null,
    createdAt: 0,
    updatedAt: 0,
  },
  world_elements: {
    id: '',
    name: '',
    type: 'setting',
    description: '',
    tags: [],
    createdAt: 0,
    updatedAt: 0,
  },
};

// Tipos válidos de entidades
export const ENTITY_TYPES = Object.keys(ENTITY_DEFAULTS);

// Roles válidos para personagens
export const VALID_ROLES = [
  'Protagonista', 'Antagonista', 'Aliado', 'Aliada',
  'Mentor', 'Mentora', 'Coadjuvante', 'Figurante',
  'Interest', 'Antagonista Secundário',
];

// Cores de avatar válidas
export const AVATAR_COLORS = ['amber', 'green', 'blue', 'purple', 'red', 'pink'];

// Status de cena
export const SCENE_STATUS = ['draft', 'written', 'revised', 'final'];

/**
 * Cria uma entidade com valores padrão mesclados
 */
export function createEntity(type, overrides = {}) {
  const defaults = ENTITY_DEFAULTS[type];
  if (!defaults) throw new Error(`Tipo de entidade inválido: ${type}`);
  
  const now = Date.now();
  return {
    ...defaults,
    ...overrides,
    id: overrides.id || `${type.slice(0, -1)}-${now}`,
    createdAt: overrides.createdAt || now,
    updatedAt: now,
  };
}

/**
 * Valida uma entidade contra seu schema
 */
export function validateEntity(entity, type) {
  const defaults = ENTITY_DEFAULTS[type];
  if (!defaults) return ['Tipo inválido'];

  const errors = [];
  
  if (!entity.id) errors.push('ID é obrigatório');
  if (type === 'characters' && !entity.name?.trim()) errors.push('Nome é obrigatório');
  if (type === 'locations' && !entity.name?.trim()) errors.push('Nome é obrigatório');
  if (type === 'scenes' && !entity.title?.trim()) errors.push('Título é obrigatório');
  if (type === 'acts' && !entity.name?.trim()) errors.push('Nome do ato é obrigatório');
  if (type === 'plot_points' && !entity.title?.trim()) errors.push('Título é obrigatório');
  if (type === 'themes' && !entity.statement?.trim()) errors.push('Frase-tema é obrigatória');
  if (type === 'dialogues' && !entity.speaker?.trim()) errors.push('Speaker é obrigatório');
  if (type === 'world_elements' && !entity.name?.trim()) errors.push('Nome é obrigatório');
  
  if (type === 'characters' && entity.role && !VALID_ROLES.includes(entity.role)) {
    errors.push(`Role inválida: ${entity.role}. Válidas: ${VALID_ROLES.join(', ')}`);
  }

  return errors;
}

// Alias para compatibilidade
export const ALL_ENTITY_TYPES = ENTITY_TYPES;

/**
 * Busca uma entidade por ID em todas as listas do projeto
 */
export function findEntityInProject(project, entityId) {
  if (!project || !entityId) return null;

  const entities = project.entities || {};
  for (const type of ENTITY_TYPES) {
    const list = entities[type];
    if (Array.isArray(list)) {
      const found = list.find(e => e.id === entityId);
      if (found) return { type, data: found };
    }
  }

  return null;
}

/**
 * Retorna o tipo plural de entidade a partir de um identificador
 */
export function getEntityType(type) {
  if (!type) return null;
  const singular = type.endsWith('s') ? type : `${type}s`;
  return ENTITY_TYPES.includes(singular) ? singular : null;
}
