import { useMemo } from 'react';
import { useProject } from './ProjectContext';
import { findEntityInProject, ALL_ENTITY_TYPES } from './EntitiesSchema';

export function useEntities() {
  const {
    currentProject,
    saveEntity,
    deleteEntityById,
    navigateTo,
  } = useProject();

  const entities = currentProject?.entities;

  const getList = (type) => {
    if (!entities || !Array.isArray(entities[type])) return [];
    return entities[type];
  };

  const characters = useMemo(() => getList('characters'), [entities]);
  const locations = useMemo(() => getList('locations'), [entities]);
  const objects = useMemo(() => getList('objects'), [entities]);
  const scenes = useMemo(() => getList('scenes'), [entities]);
  const plotPoints = useMemo(() => getList('plot_points'), [entities]);
  const themes = useMemo(() => getList('themes'), [entities]);
  const acts = useMemo(() => getList('acts'), [entities]);
  const dialogues = useMemo(() => getList('dialogues'), [entities]);
  const worldElements = useMemo(() => getList('world_elements'), [entities]);

  const findEntity = (entityId) => {
    return findEntityInProject(currentProject, entityId);
  };

  const getScenesByAct = (actId) => {
    return scenes.filter(s => s.actId === actId).sort((a, b) => a.order - b.order);
  };

  const getActById = (actId) => {
    return acts.find(a => a.id === actId);
  };

  const getCharactersInScene = (sceneId) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return [];
    return characters.filter(c => scene.characterIds.includes(c.id));
  };

  const navigateToEntity = (entityId, tab) => {
    const entity = findEntity(entityId);
    if (!entity) return;
    navigateTo(tab || 'encyclopedia', entity.data.id);
  };

  return {
    characters,
    locations,
    objects,
    scenes,
    plotPoints,
    themes,
    acts,
    dialogues,
    worldElements,
    entities,
    findEntity,
    getScenesByAct,
    getActById,
    getCharactersInScene,
    navigateToEntity,
    saveEntity,
    deleteEntityById,
    saveCharacter: (data) => saveEntity('characters', data),
    deleteCharacter: (id) => deleteEntityById('characters', id),
    saveLocation: (data) => saveEntity('locations', data),
    deleteLocation: (id) => deleteEntityById('locations', id),
    saveObject: (data) => saveEntity('objects', data),
    deleteObject: (id) => deleteEntityById('objects', id),
    saveScene: (data) => saveEntity('scenes', data),
    deleteScene: (id) => deleteEntityById('scenes', id),
    savePlotPoint: (data) => saveEntity('plot_points', data),
    deletePlotPoint: (id) => deleteEntityById('plot_points', id),
    saveTheme: (data) => saveEntity('themes', data),
    deleteTheme: (id) => deleteEntityById('themes', id),
    saveAct: (data) => saveEntity('acts', data),
    deleteAct: (id) => deleteEntityById('acts', id),
    saveDialogue: (data) => saveEntity('dialogues', data),
    deleteDialogue: (id) => deleteEntityById('dialogues', id),
    saveWorldElement: (data) => saveEntity('world_elements', data),
    deleteWorldElement: (id) => deleteEntityById('world_elements', id),
  };
}
