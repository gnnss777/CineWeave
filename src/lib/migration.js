/**
 * migration.js — Funções de migração e compatibilidade
 * FASE 0.2 + 0.3: Adaptador que unifica dados legados em project.entities
 * 
 * Funções:
 * - ensureEntities(proj) → proj com entities garantido
 * - getEntity(proj, type, id) → entidade individual
 * - updateEntity(proj, type, entity) → atualiza entidade + sincroniza
 * - deleteEntity(proj, type, id) → deleta entidade + sincroniza
 */

/**
 * Converte um projeto do formato legado para o novo formato entities
 * Preserva todos os dados originais, apenas adiciona entities.
 *
 * Ordem de prioridade para cada tipo de entidade:
 *   1. proj.entities (já migrado — retorna cedo)
 *   2. proj.scenes / proj.acts / etc. (vindos de loadProjectsFromSupabase)
 *   3. brainstormData + mindMapNodes (migração legada)
 */
export function ensureEntities(proj) {
  if (!proj) return proj;
  if (proj.entities) return proj; // já migrado

  const bd = proj.brainstormData || {};

  // ── 1. Scenes ──
  // Priority: top-level proj.scenes (from Supabase) > brainstorm > mindmap
  let scenes;
  if (proj.scenes?.length) {
    scenes = proj.scenes;
  } else {
    const brainstormScenes = (bd.scenes || []).map((s, i) => ({
      id: s.id || `scene-${proj.id}-${i}`,
      title: s.title || '',
      synopsis: s.description || '',
      actId: null,
      characterIds: [],
      order: i,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    const mmScenes = (proj.mindMapNodes || [])
      .filter(n => n.type === 'scene')
      .filter(n => !bd.scenes?.some(s => s.title === n.label))
      .map((n, i) => ({
        id: n.id.replace(/^n-/, 'scene-'),
        title: n.label || '',
        synopsis: n.details || '',
        actId: null,
        characterIds: [],
        order: brainstormScenes.length + i,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    scenes = [...brainstormScenes, ...mmScenes];
  }

  // ── 2. Plot points ──
  let plot_points;
  if (proj.plot_points?.length) {
    plot_points = proj.plot_points;
  } else {
    plot_points = (bd.plot_points || []).map((p, i) => ({
      id: p.id || `plot-${proj.id}-${i}`,
      title: p.title || '',
      description: p.description || '',
      actId: p.act ? `act-${proj.id}-${['I','II','III','IV','V'].indexOf(p.act.toUpperCase())}` : null,
      tags: p.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  // ── 3. Themes ──
  let themes;
  if (proj.themes?.length) {
    themes = proj.themes;
  } else {
    themes = (bd.themes || []).map((t, i) => ({
      id: t.id || `theme-${proj.id}-${i}`,
      statement: t.statement || '',
      evidence: t.evidence || '',
      relevance: t.relevance || 'Central',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  // ── 4. Acts ──
  let acts;
  if (proj.acts?.length) {
    acts = proj.acts;
  } else {
    const actNodes = (proj.mindMapNodes || []).filter(n => n.type === 'act');
    acts = actNodes.length > 0
      ? actNodes.map((n, i) => ({
          id: n.id.replace(/^n-/, 'act-'),
          name: n.label || `ATO ${['I','II','III','IV','V'][i] || i + 1}`,
          order: i,
          description: n.details || '',
          color: n.color || '#ccee00',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }))
      : ['I', 'II', 'III', 'IV'].map((roman, i) => ({
          id: `act-${proj.id}-${i}`,
          name: `ATO ${roman}`,
          order: i,
          description: '',
          color: '#ccee00',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
  }

  // ── 5. Linkar scenes e plot_points aos acts (only from brainstorm/mindmap) ──
  if (!proj.acts?.length) {
    const actNodes = (proj.mindMapNodes || []).filter(n => n.type === 'act');
    actNodes.forEach((actNode, actIdx) => {
      const linkedScenes = (proj.mindMapLinks || [])
        .filter(l => l.source === actNode.id)
        .map(l => l.target);

      scenes.forEach(s => {
        const mmNode = (proj.mindMapNodes || []).find(n =>
          n.type === 'scene' && n.label === s.title
        );
        if (mmNode && linkedScenes.includes(mmNode.id)) {
          s.actId = acts[actIdx]?.id || null;
        }
      });

      plot_points.forEach(pp => {
        const ppAct = bd.plot_points?.find(bp => bp.title === pp.title);
        if (ppAct && ppAct.act) {
          const romanIdx = ['I','II','III','IV','V'].indexOf(ppAct.act.toUpperCase());
          if (romanIdx >= 0) pp.actId = acts[romanIdx]?.id || null;
        }
      });
    });
  }

  // ── 6. World elements → objects se não existirem ──
  const worldElementsToObjects = (bd.world_elements || [])
    .filter(w => w.type === 'location')
    .filter(w => w.name && !(proj.locations || []).find(o => o.name === w.name))
    .map((w, i) => ({
      id: `loc-${proj.id}-world-${i}`,
      name: w.name || '',
      type: 'EXT.',
      description: w.description || '',
      timeOfDay: 'DIA',
      mood: w.tags?.join(', ') || '',
      group: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

  const worldElementsToWorld = (bd.world_elements || [])
    .filter(w => !['location'].includes(w.type))
    .filter(w => w.name && !(proj.objects || []).find(o => o.name === w.name))
    .map((w, i) => ({
      id: `world-${proj.id}-${i}`,
      name: w.name || '',
      type: w.type || 'setting',
      description: w.description || '',
      tags: w.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

  // ── 7. Dialogues ──
  let dialogues;
  if (proj.dialogues?.length) {
    dialogues = proj.dialogues;
  } else {
    dialogues = (bd.dialogues || []).map((d, i) => ({
      id: d.id || `dlg-${proj.id}-${i}`,
      speaker: d.speaker || '',
      line: d.line || '',
      context: d.context || '',
      tags: d.tags || [],
      sceneId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  // ── 8. World elements ──
  let world_elements;
  if (proj.world_elements?.length) {
    world_elements = proj.world_elements;
  } else {
    world_elements = worldElementsToWorld;
  }

  return {
    ...proj,
    entities: {
      characters: proj.characters || [],
      locations: [...(proj.locations || []), ...worldElementsToObjects],
      objects: proj.objects || [],
      scenes,
      plot_points,
      themes,
      acts,
      dialogues,
      world_elements,
      storyboards: [],
      storyboard_frames: [],
      storyboard_layers: [],
    },
  };
}

/**
 * Pega uma entidade pelo ID, procurando em todos os tipos
 */
export function getEntity(proj, entityId) {
  if (!proj?.entities) return null;
  for (const type of Object.keys(proj.entities)) {
    const found = proj.entities[type].find(e => e.id === entityId);
    if (found) return { ...found, _type: type };
  }
  return null;
}

/**
 * Atualiza (ou cria) uma entidade e mantém sync com arrays legados
 */
export function updateEntity(proj, type, entity) {
  if (!proj.entities) proj = ensureEntities(proj);
  const list = proj.entities[type];
  if (!list) return proj;

  const now = Date.now();
  const updated = { ...entity, updatedAt: now };
  
  if (entity.id && list.find(e => e.id === entity.id)) {
    // Atualizar existente
    proj.entities[type] = list.map(e => e.id === entity.id ? updated : e);
  } else {
    // Criar novo
    const newEntity = {
      ...updated,
      id: updated.id || `${type.slice(0, -1)}-${Date.now()}`,
      createdAt: now,
    };
    proj.entities[type] = [...list, newEntity];
  }

  // Sync com arrays legados (characters, locations, objects)
  if (type === 'characters') {
    const exists = (proj.characters || []).findIndex(c => c.id === updated.id);
    if (exists >= 0) {
      proj.characters[exists] = updated;
    } else {
      if (!proj.characters) proj.characters = [];
      proj.characters.push(updated);
    }
  }
  if (type === 'locations') {
    const exists = (proj.locations || []).findIndex(l => l.id === updated.id);
    if (exists >= 0) proj.locations[exists] = updated;
    else {
      if (!proj.locations) proj.locations = [];
      proj.locations.push(updated);
    }
  }
  if (type === 'objects') {
    const exists = (proj.objects || []).findIndex(o => o.id === updated.id);
    if (exists >= 0) proj.objects[exists] = updated;
    else {
      if (!proj.objects) proj.objects = [];
      proj.objects.push(updated);
    }
  }

  return proj;
}

/**
 * Deleta uma entidade e mantém sync com arrays legados
 */
export function deleteEntity(proj, type, id) {
  if (!proj.entities) proj = ensureEntities(proj);
  
  proj.entities[type] = (proj.entities[type] || []).filter(e => e.id !== id);

  // Sync com arrays legados
  if (type === 'characters' && proj.characters) {
    proj.characters = proj.characters.filter(c => c.id !== id);
  }
  if (type === 'locations' && proj.locations) {
    proj.locations = proj.locations.filter(l => l.id !== id);
  }
  if (type === 'objects' && proj.objects) {
    proj.objects = proj.objects.filter(o => o.id !== id);
  }

  return proj;
}
