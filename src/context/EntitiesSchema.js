// Estrutura canônica de cada tipo de entidade

export const ENTITY_TYPES = {
  characters: {
    id: 'char-{id}',
    name: '',
    role: 'Coadjuvante',       // Protagonista, Antagonista, Aliado, Mentor, Coadjuvante
    description: '',
    traits: [],                 // array de strings
    backstory: '',
    avatar: 'amber',            // cor do avatar
    notes: '',
    relationships: [],          // [{ targetId: 'char-2', type: 'aliado', intensity: 5 }]
    createdAt: 0,
    updatedAt: 0,
  },
  locations: {
    id: 'loc-{id}',
    name: '',
    type: 'INT.',               // INT., EXT., INT./EXT.
    description: '',
    timeOfDay: 'DIA',
    mood: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  objects: {
    id: 'obj-{id}',
    name: '',
    description: '',
    significance: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  scenes: {
    id: 'scene-{id}',
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
    id: 'plot-{id}',
    title: '',
    description: '',
    actId: null,
    tags: [],
    createdAt: 0,
    updatedAt: 0,
  },
  themes: {
    id: 'theme-{id}',
    statement: '',
    evidence: '',
    relevance: 'Central',       // Central, Secundário, Menor
    createdAt: 0,
    updatedAt: 0,
  },
  acts: {
    id: 'act-{id}',
    name: '',
    order: 0,
    description: '',
    color: '#ccee00',
    createdAt: 0,
    updatedAt: 0,
  },
  storyboards: {
    id: 'storyboard-{id}',
    name: '',
    description: '',
    project_id: null,
    created_at: 0,
    updated_at: 0,
  },
  storyboard_frames: {
    id: 'frame-{id}',
    storyboard_id: 'storyboard-{storyboard_id}',
    scene_id: null, // ref para entities.scenes[].id
    order: 0,
    width: 1920,
    height: 1080,
    preview_url: null,
    exported_at: 0,
    created_at: 0,
    updated_at: 0,
  },
  storyboard_layers: {
    id: 'layer-{id}',
    storyboard_id: 'storyboard-{storyboard_id}',
    frame_id: 'frame-{frame_id}',
    name: '',
    type: 'drawing', // drawing, text, image, background
    opacity: 100,
    visible: true,
    locked: false,
    blend_mode: 'source-over',
    data: {},
    created_at: 0,
    updated_at: 0,
  },
  drawing_elements: {
    id: 'drawing-{id}',
    layer_id: 'layer-{layer_id}',
    type: 'path', // path, rect, circle, text, image
    data: {},
    width: 1920,
    height: 1080,
    exported_at: 0,
    created_at: 0,
    updated_at: 0,
  },
};

// Funções utilitárias
export function createEntity(type, overrides = {}) {
  const schema = ENTITY_TYPES[type];
  if (!schema) {
    console.error(`Unknown entity type: ${type}`);
    return null;
  }

  const now = Date.now();
  return {
    ...schema,
    ...overrides,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}

export function isValidEntityType(type) {
  return type in ENTITY_TYPES;
}

export function getEntityId(type, id) {
  const schema = ENTITY_TYPES[type];
  return schema ? schema.id.replace('{id}', id) : id;
}

export function createEntityId(type) {
  const schema = ENTITY_TYPES[type];
  return schema ? schema.id.replace('{id}', `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`) : null;
}

export function getBaseEntityId(entityId) {
  return entityId?.replace(/storyboard-|frame-|layer-|drawing-/g, '') || null;
}
