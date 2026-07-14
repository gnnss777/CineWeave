import { findEntityInProject, getEntityType } from '../context/EntitiesSchema';

export function resolveNodeDisplay(node, project) {
  if (!node) return { label: '?', details: '', type: 'unknown', color: '#718096' };

  if (node.entityId) {
    const result = findEntityInProject(project, node.entityId);
    if (result) {
      const { type, data } = result;
      const label = data.name || data.title || data.statement?.substring(0, 40) || '?';
      const details = data.description || data.synopsis || data.evidence || data.backstory || '';
      return {
        label,
        details,
        type: type === 'characters' ? 'character' :
              type === 'locations' ? 'location' :
              type === 'objects' ? 'object' :
              type === 'scenes' ? 'scene' :
              type === 'plot_points' ? 'plot_point' :
              type === 'themes' ? 'theme' :
              type === 'acts' ? 'act' : 'unknown',
        color: getColorForEntityType(type),
        entity: data,
        entityType: type,
      };
    }
    return { label: node.label || '?', details: '', type: 'unknown', color: '#718096' };
  }

  return {
    label: node.label || '?',
    details: node.details || '',
    type: node.type || 'unknown',
    color: getColorForNodeType(node.type),
  };
}

export function getColorForNodeType(type) {
  switch (type) {
    case 'act': return 'var(--color-act)';
    case 'scene': return 'var(--color-scene)';
    case 'character': return 'var(--color-character)';
    case 'location': return 'var(--color-location)';
    case 'object': return 'var(--color-object)';
    case 'plot_point': return '#a855f7';
    case 'theme': return '#f59e0b';
    default: return '#718096';
  }
}

export function getColorForEntityType(type) {
  switch (type) {
    case 'characters': return 'var(--color-character)';
    case 'locations': return 'var(--color-location)';
    case 'objects': return 'var(--color-object)';
    case 'scenes': return 'var(--color-scene)';
    case 'plot_points': return '#a855f7';
    case 'themes': return '#f59e0b';
    case 'acts': return 'var(--color-act)';
    default: return '#718096';
  }
}

export function createNodeWithEntity(entity, entityType, x, y) {
  return {
    id: `n-${entity.id}`,
    entityId: entity.id,
    x: Math.round(x),
    y: Math.round(y),
  };
}

export function getEntityFromNode(node, project) {
  if (!node?.entityId) return null;
  const result = findEntityInProject(project, node.entityId);
  return result ? result.data : null;
}
