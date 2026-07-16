import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { syncProjectToSupabase, syncAllProjectsToSupabase, loadProjectsFromSupabase } from '../lib/sync';
import { useSync } from './SyncContext';
import * as db from '../lib/db';
import { ensureEntities, updateEntity as updateEntityInProject, deleteEntity as deleteEntityFromProject } from '../lib/migration';
import { screenplayToBlocks, blocksToScreenplay, mergeBlockStores } from '../lib/diffEngine/hashUtils';
import { diffBlockOrders, enrichChanges, detectModifications } from '../lib/diffEngine/blockDiff';
import { extractEntitiesFromScreenplay, linkEntitiesToScreenplay, buildEntityLinkingMap } from '../lib/entityExtractor';

const ProjectContext = createContext();

// Projects loaded from Supabase

function migrateProjectVersions(proj) {
  if (proj.versions) return proj;
  const versions = { blockStore: {}, all: [], head: null, staging: [] };
  if (proj.history && proj.history.length > 0) {
    for (const oldV of proj.history) {
      if (!oldV.screenplay || oldV.screenplay.length === 0) continue;
      const { blockStore, blockOrder } = screenplayToBlocks(oldV.screenplay);
      mergeBlockStores(versions.blockStore, blockStore);
      const vType = oldV.id.startsWith('v-auto-') ? 'auto' :
                    oldV.id.startsWith('v-manual-') ? 'manual' :
                    oldV.id.startsWith('v-backup-') ? 'backup' : 'manual';
      versions.all.push({
        id: oldV.id,
        parentId: null,
        type: vType,
        name: oldV.name,
        timestamp: oldV.timestamp,
        blockOrder,
        metadata: {
          mindMapNodes: oldV.mindMapNodes || null,
          mindMapLinks: oldV.mindMapLinks || null
        }
      });
    }
    for (let i = versions.all.length - 1; i > 0; i--) {
      versions.all[i].parentId = versions.all[i - 1].id;
    }
    if (versions.all.length > 0) versions.head = versions.all[versions.all.length - 1].id;
    delete proj.history;
  }
  proj.versions = versions;
  return proj;
}

function initVersionStore() {
  return { blockStore: {}, all: [], head: null, staging: [] };
}

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  
  const [currentProjectId, setCurrentProjectId] = useState('');

  // Cache to localStorage (offline fallback only)
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('cineweave_projects', JSON.stringify(projects));
    }
  }, [projects]);

  const { syncProject } = useSync();

  // Load projects from Supabase on startup (cloud-first)
  useEffect(() => {
    (async () => {
      try {
        const sbProjects = await loadProjectsFromSupabase();
        if (sbProjects && sbProjects.length > 0) {
          setProjects(sbProjects.map(p => ensureEntities(p)));
          return;
        }
      } catch (err) {
        console.error('[ProjectContext] Failed to load from Supabase:', err);
      }
      // Fallback to localStorage cache if cloud fails
      const cached = localStorage.getItem('cineweave_projects');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.length > 0) setProjects(parsed);
        } catch {}
      }
    })();
  }, []);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const updateProject = (updatedProj) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    syncProject(updatedProj);
  };

  const [lastSavedTimestamp, setLastSavedTimestamp] = useState(0);
  const [lastUserEditTimestamp, setLastUserEditTimestamp] = useState(0);

  const vs = (proj) => {
    if (!proj.versions) proj.versions = initVersionStore();
    return proj.versions;
  };

  const autoSaveVersionIfNeeded = (proj, type = 'Roteiro') => {
    const now = Date.now();
    if (now - lastSavedTimestamp > 120000) {
      const v = vs(proj);
      const { blockStore: newBlocks, blockOrder } = screenplayToBlocks(proj.screenplay || []);
      mergeBlockStores(v.blockStore, newBlocks);
      const vType = (type === 'Brainstorm' || type === 'Extração IA') ? 'ai' :
                    type === 'Importação Roteiro' ? 'import' : 'auto';
      const ver = {
        id: `v-auto-${now}`,
        parentId: v.head,
        type: vType,
        name: `Auto-save ${type} (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
        timestamp: now,
        blockOrder,
        metadata: {
          mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
          mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
        }
      };
      v.all.unshift(ver);
      v.head = ver.id;
      setLastSavedTimestamp(now);
    }
  };

  const saveVersion = (name = '') => {
    const proj = { ...currentProject };
    const v = vs(proj);
    const now = Date.now();
    const { blockStore: newBlocks, blockOrder } = screenplayToBlocks(proj.screenplay || []);
    mergeBlockStores(v.blockStore, newBlocks);
    const ver = {
      id: `v-manual-${now}`,
      parentId: v.head,
      type: 'manual',
      name: name || `Versão ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: now,
      blockOrder,
      metadata: {
        mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
        mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
      }
    };
    v.all.unshift(ver);
    v.head = ver.id;
    setLastSavedTimestamp(now);
    updateProject(proj);
  };

  const _backupCurrent = (proj, label) => {
    const v = vs(proj);
    const { blockStore: newBlocks, blockOrder } = screenplayToBlocks(proj.screenplay || []);
    mergeBlockStores(v.blockStore, newBlocks);
    const ver = {
      id: `v-backup-${Date.now()}`,
      parentId: v.head,
      type: 'backup',
      name: label || `Backup ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      blockOrder,
      metadata: {
        mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
        mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
      }
    };
    v.all.unshift(ver);
    v.head = ver.id;
    return proj;
  };

  const restoreVersion = (versionId) => {
    const proj = { ...currentProject };
    const v = vs(proj);
    const target = v.all.find(vr => vr.id === versionId);
    if (!target) return;
    _backupCurrent(proj, `Antes de restaurar: ${target.name}`);
    const restored = blocksToScreenplay(target.blockOrder, v.blockStore);
    const nodeSnap = target.metadata?.mindMapNodes || [];
    const linkSnap = target.metadata?.mindMapLinks || [];
    if (restored.length > 0) proj.screenplay = restored;
    if (nodeSnap.length > 0) proj.mindMapNodes = JSON.parse(JSON.stringify(nodeSnap));
    if (linkSnap.length > 0) proj.mindMapLinks = JSON.parse(JSON.stringify(linkSnap));
    updateProject(proj);
  };

  /* ── Staging (Pending Changes) ── */
  const stageProposedChanges = (proposedScreenplay, source, name) => {
    const proj = { ...currentProject };
    const v = vs(proj);
    const now = Date.now();
    const { blockStore: newBlocks, blockOrder } = screenplayToBlocks(proposedScreenplay);
    const stagingEntry = {
      id: `stg-${now}`,
      source,
      sourceVersionId: v.head,
      name: name || `Proposta de ${source} (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
      timestamp: now,
      newBlocks,
      blockOrder,
      status: 'pending'
    };
    v.staging.push(stagingEntry);
    updateProject(proj);
    return stagingEntry;
  };

  const approveStaging = (stagingId) => {
    const proj = { ...currentProject };
    const v = vs(proj);
    const idx = v.staging.findIndex(s => s.id === stagingId);
    if (idx === -1) return null;
    const entry = v.staging[idx];
    mergeBlockStores(v.blockStore, entry.newBlocks);
    const now = Date.now();
    const newVersion = {
      id: `v-${now}`,
      parentId: v.head,
      type: entry.source === 'brainstorm' ? 'ai' :
            entry.source === 'compile' ? 'ai' :
            entry.source === 'import' ? 'import' : 'manual',
      name: entry.name,
      timestamp: now,
      blockOrder: entry.blockOrder,
      metadata: {
        sourceStagingId: entry.id
      }
    };
    v.all.unshift(newVersion);
    v.head = newVersion.id;
    const restored = blocksToScreenplay(entry.blockOrder, v.blockStore);
    if (restored.length > 0) proj.screenplay = restored;
    v.staging.splice(idx, 1);
    updateProject(proj);
    return newVersion;
  };

  const approveStagingPartial = (stagingId, selections) => {
    const proj = { ...currentProject };
    const v = vs(proj);
    const idx = v.staging.findIndex(s => s.id === stagingId);
    if (idx === -1) return null;
    const entry = v.staging[idx];
    const headVersion = v.all.find(vr => vr.id === v.head);
    if (!headVersion) return null;
    const mergedStore = { ...v.blockStore };
    mergeBlockStores(mergedStore, entry.newBlocks);
    const { changes } = diffBlockOrders(headVersion.blockOrder, entry.blockOrder);
    const enriched = enrichChanges(changes, mergedStore, mergedStore);
    const detected = detectModifications(enriched);
    const resultBlockOrder = [...headVersion.blockOrder];
    let offset = 0;
    for (let i = 0; i < detected.length; i++) {
      const c = detected[i];
      const sel = selections[i];
      if (sel === undefined || sel === true) {
        if (c.type === 'added') {
          const insertAt = Math.min(c.displayIndex + offset, resultBlockOrder.length);
          resultBlockOrder.splice(insertAt, 0, [c.blockId, c.hash]);
          offset++;
        } else if (c.type === 'removed' && c.block) {
          const removeIdx = resultBlockOrder.findIndex(([id]) => id === c.blockId);
          if (removeIdx !== -1) {
            resultBlockOrder.splice(removeIdx, 1);
            if (removeIdx < c.displayIndex + offset) offset--;
          }
        } else if (c.type === 'modified') {
          const replaceIdx = resultBlockOrder.findIndex(([id]) => id === c.oldBlockId);
          if (replaceIdx !== -1) {
            resultBlockOrder[replaceIdx] = [c.newBlockId, c.newHash];
          }
        }
      }
    }
    mergeBlockStores(v.blockStore, entry.newBlocks);
    const now = Date.now();
    const newVersion = {
      id: `v-${now}`,
      parentId: v.head,
      type: entry.source === 'brainstorm' ? 'ai' :
            entry.source === 'compile' ? 'ai' :
            entry.source === 'import' ? 'import' : 'manual',
      name: `${entry.name} (parcial)`,
      timestamp: now,
      blockOrder: resultBlockOrder,
      metadata: { sourceStagingId: entry.id, partial: true }
    };
    v.all.unshift(newVersion);
    v.head = newVersion.id;
    const restored = blocksToScreenplay(resultBlockOrder, v.blockStore);
    if (restored.length > 0) proj.screenplay = restored;
    v.staging.splice(idx, 1);
    updateProject(proj);
    return newVersion;
  };

  const rejectStaging = (stagingId) => {
    const proj = { ...currentProject };
    const v = vs(proj);
    v.staging = v.staging.filter(s => s.id !== stagingId);
    updateProject(proj);
  };

  const getPendingStagingCount = () => {
    const v = currentProject?.versions;
    return v?.staging?.filter(s => s.status === 'pending').length || 0;
  };

  const getVersionScreenplay = (versionId) => {
    const v = currentProject?.versions;
    if (!v) return [];
    const target = v.all.find(vr => vr.id === versionId);
    if (!target) return [];
    return blocksToScreenplay(target.blockOrder, v.blockStore);
  };

  const compareVersions = (versionIdA, versionIdB) => {
    const v = currentProject?.versions;
    if (!v) return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
    const vA = v.all.find(vr => vr.id === versionIdA);
    const vB = v.all.find(vr => vr.id === versionIdB);
    if (!vA || !vB) return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
    const { changes: rawChanges, stats } = diffBlockOrders(vA.blockOrder, vB.blockOrder);
    const enriched = enrichChanges(rawChanges, v.blockStore, v.blockStore);
    const changes = detectModifications(enriched);
    const finalStats = {
      added: changes.filter(c => c.type === 'added').length,
      removed: changes.filter(c => c.type === 'removed').length,
      modified: changes.filter(c => c.type === 'modified').length,
      unchanged: stats.unchanged
    };
    return { changes, stats: finalStats };
  };

  const compareWithStaging = (stagingId) => {
    const v = currentProject?.versions;
    if (!v) return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
    const staging = v.staging.find(s => s.id === stagingId);
    if (!staging) return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
    const headVersion = v.all.find(vr => vr.id === v.head);
    if (!headVersion) return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 } };
    const mergedStore = { ...v.blockStore };
    mergeBlockStores(mergedStore, staging.newBlocks);
    const { changes: rawChanges, stats } = diffBlockOrders(headVersion.blockOrder, staging.blockOrder);
    const enriched = enrichChanges(rawChanges, mergedStore, mergedStore);
    const changes = detectModifications(enriched);
    const finalStats = {
      added: changes.filter(c => c.type === 'added').length,
      removed: changes.filter(c => c.type === 'removed').length,
      modified: changes.filter(c => c.type === 'modified').length,
      unchanged: stats.unchanged
    };
    return { changes, stats: finalStats };
  };

  const linkNodeToFirstAct = (proj, nodeId) => {
    const firstAct = proj.mindMapNodes.find(n => {
      if (n.type === 'act') return true;
      if (n.entityId && proj.entities?.acts?.some(a => a.id === n.entityId)) return true;
      return false;
    });
    if (firstAct) {
      const exists = proj.mindMapLinks.some(l =>
        (l.source === firstAct.id && l.target === nodeId) ||
        (l.source === nodeId && l.target === firstAct.id)
      );
      if (!exists) {
        proj.mindMapLinks.push({
          id: `l-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: firstAct.id,
          target: nodeId
        });
      }
    }
  };

  const addProject = (title, tagline = '', genre = '', logline = '', visibility = 'private') => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title,
      tagline,
      genre,
      logline,
      visibility,
      tags: [],
      characters: [],
      locations: [],
      objects: [],
      screenplay: [
        { id: `sc-${Date.now()}-1`, type: 'scene-heading', text: 'INT. LOCAL INICIAL - DIA' },
        { id: `sc-${Date.now()}-2`, type: 'action', text: 'Descreva a ação inicial aqui.' }
      ],
      mindMapNodes: [
        { id: `n-${Date.now()}-act1`, label: 'ATO I: Introdução', type: 'act', x: 150, y: 150, details: 'Apresentação dos personagens e do conflito inicial.' },
        { id: `n-${Date.now()}-act2`, label: 'ATO II: Complicação', type: 'act', x: 400, y: 150, details: 'Obstáculos maiores e o ponto de não retorno.' },
        { id: `n-${Date.now()}-act3`, label: 'ATO III: Clímax', type: 'act', x: 650, y: 150, details: 'O confronto decisivo e a crise máxima.' },
        { id: `n-${Date.now()}-act4`, label: 'ATO IV: Resolução', type: 'act', x: 900, y: 150, details: 'O desfecho, consequências e nova realidade.' }
      ],
      mindMapLinks: [
        { id: `l-${Date.now()}-1`, source: `n-${Date.now()}-act1`, target: `n-${Date.now()}-act2` },
        { id: `l-${Date.now()}-2`, source: `n-${Date.now()}-act2`, target: `n-${Date.now()}-act3` },
        { id: `l-${Date.now()}-3`, source: `n-${Date.now()}-act3`, target: `n-${Date.now()}-act4` }
      ],
      recordings: [],
      mediaUploads: [],
      brainstormDocuments: [],
      ideas: [],
      projectFiles: [],
      screenplayImports: [],
      needsAutoLayout: true,
      versions: initVersionStore()
    };
    setProjects(prev => [...prev, newProj]);
    setCurrentProjectId(newProj.id);
    return newProj;
  };

  const deleteProject = async (id) => {
    if (projects.length <= 1) return;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    // Delete from Supabase if logged in
    try {
      const map = JSON.parse(localStorage.getItem('cineweave_sb_ids') || '{}');
      const sbProjId = map.projects?.[id];
      if (sbProjId) {
        await db.deleteProject(sbProjId);
        // Clean up ID map
        delete map.projects[id];
        localStorage.setItem('cineweave_sb_ids', JSON.stringify(map));
      }
    } catch (err) {
      console.error('[ProjectContext] Failed to delete from Supabase:', err);
    }
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    setCurrentProjectId(remaining[0].id);
  };

  const syncAllToCloud = async () => {
    try {
      await syncAllProjectsToSupabase(projects);
    } catch (err) {
      console.error('[ProjectContext] Sync all failed:', err);
    }
  };

  // ── VISIBILITY & TAGS ──
  const setProjectVisibility = (projectId, visibility) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, visibility } : p
    ));
  };

  const setProjectTags = (projectId, tags) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tags } : p
    ));
  };

  // Add / Edit elements in project database
  const saveCharacter = (character) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    const now = Date.now();
    if (character.id) {
      // Update existing character in entities
      proj.entities = proj.entities || {};
      proj.entities.characters = proj.entities.characters.map(c => c.id === character.id ? { ...c, ...character, updatedAt: now } : c);
      // Update mind map nodes (both legacy and entityId-linked)
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.entityId === character.id || node.id === `n-${character.id}` || node.id === character.id) {
          return { ...node, entityId: character.id, label: character.name, details: `${character.role}. ${character.description}` };
        }
        return node;
      });
    } else {
      const newChar = { ...character, id: `char-${now}`, createdAt: now, updatedAt: now };
      proj.entities = proj.entities || {};
      if (!proj.entities.characters) proj.entities.characters = [];
      proj.entities.characters.push(newChar);
      // Create clean mind map node with entityId
      proj.mindMapNodes.push({
        id: `n-${newChar.id}`,
        entityId: newChar.id,
        x: Math.round(300 + Math.random() * 400),
        y: Math.round(300 + Math.random() * 200),
      });
      linkNodeToFirstAct(proj, `n-${newChar.id}`);
    }
    updateProject(proj);
  };

  const deleteCharacter = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.entities = proj.entities || {};
    proj.entities.characters = (proj.entities.characters || []).filter(c => c.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.entityId !== id && node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  const saveLocation = (location) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    const now = Date.now();
    if (location.id) {
      proj.entities = proj.entities || {};
      proj.entities.locations = proj.entities.locations.map(l => l.id === location.id ? { ...l, ...location, updatedAt: now } : l);
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.entityId === location.id || node.id === `n-${location.id}` || node.id === location.id) {
          return { ...node, entityId: location.id, label: location.name, details: `${location.type} ${location.name}. ${location.description}` };
        }
        return node;
      });
    } else {
      const newLoc = { ...location, id: `loc-${now}`, createdAt: now, updatedAt: now };
      proj.entities = proj.entities || {};
      if (!proj.entities.locations) proj.entities.locations = [];
      proj.entities.locations.push(newLoc);
      proj.mindMapNodes.push({
        id: `n-${newLoc.id}`,
        entityId: newLoc.id,
        x: Math.round(300 + Math.random() * 400),
        y: Math.round(400 + Math.random() * 200),
      });
      linkNodeToFirstAct(proj, `n-${newLoc.id}`);
    }
    updateProject(proj);
  };

  const deleteLocation = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.entities = proj.entities || {};
    proj.entities.locations = (proj.entities.locations || []).filter(l => l.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.entityId !== id && node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  const saveObject = (obj) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    const now = Date.now();
    if (obj.id) {
      proj.entities = proj.entities || {};
      proj.entities.objects = proj.entities.objects.map(o => o.id === obj.id ? { ...o, ...obj, updatedAt: now } : o);
      proj.mindMapNodes = proj.mindMapNodes.map(node => {
        if (node.entityId === obj.id || node.id === `n-${obj.id}` || node.id === obj.id) {
          return { ...node, entityId: obj.id, label: obj.name, details: obj.significance };
        }
        return node;
      });
    } else {
      const newObj = { ...obj, id: `obj-${now}`, createdAt: now, updatedAt: now };
      proj.entities = proj.entities || {};
      if (!proj.entities.objects) proj.entities.objects = [];
      proj.entities.objects.push(newObj);
      proj.mindMapNodes.push({
        id: `n-${newObj.id}`,
        entityId: newObj.id,
        x: Math.round(300 + Math.random() * 400),
        y: Math.round(350 + Math.random() * 200),
      });
      linkNodeToFirstAct(proj, `n-${newObj.id}`);
    }
    updateProject(proj);
  };

  const deleteObject = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ficha');
    proj.entities = proj.entities || {};
    proj.entities.objects = (proj.entities.objects || []).filter(o => o.id !== id);
    proj.mindMapNodes = proj.mindMapNodes.filter(node => node.entityId !== id && node.id !== `n-${id}` && node.id !== id);
    updateProject(proj);
  };

  // ── ENTITIES CRUD (centralized) ──────────────────────────────
  const saveEntity = (type, entity) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return updateEntity(p, type, entity);
    }));
  };

  const deleteEntityById = (type, entityId) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return deleteEntityFromProject(p, type, entityId);
    }));
  };

  // ── IDEAS ─────────────────────────────────────────────────────
  const saveIdea = (idea) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ideia');
    if (idea.id) {
      proj.ideas = proj.ideas.map(i => i.id === idea.id ? idea : i);
    } else {
      const newIdea = { ...idea, id: `idea-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() };
      proj.ideas.unshift(newIdea);
    }
    updateProject(proj);
  };

  const deleteIdea = (id) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Ideia');
    proj.ideas = proj.ideas.filter(i => i.id !== id);
    updateProject(proj);
  };

  const updateIdea = (id, updates) => {
    const proj = { ...currentProject };
    proj.ideas = proj.ideas.map(i => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i);
    updateProject(proj);
  };

  const reorderIdeas = (ideas) => {
    const proj = { ...currentProject };
    proj.ideas = ideas;
    updateProject(proj);
  };

  const addRecording = (title, duration, transcript) => {
    const proj = { ...currentProject };
    const newRec = {
      id: `rec-${Date.now()}`,
      title,
      duration,
      date: new Date().toLocaleDateString('pt-BR'),
      transcript,
      processed: false
    };
    proj.recordings.unshift(newRec);
    updateProject(proj);
    return newRec;
  };

  const addMediaUpload = (name, type, url = '', content = '') => {
    const proj = { ...currentProject };
    const newMed = {
      id: `med-${Date.now()}`,
      name,
      date: new Date().toLocaleDateString('pt-BR'),
      type,
      url: url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
      content: content || '',
      processed: false
    };
    proj.mediaUploads.unshift(newMed);
    updateProject(proj);
  };

  const addBrainstormDocument = (document) => {
    const proj = { ...currentProject };
    if (!proj.brainstormDocuments) proj.brainstormDocuments = [];
    const newDoc = {
      ...document,
      id: document.id || `bsd-${Date.now()}`,
      createdAt: document.createdAt || new Date().toISOString(),
      projectId: document.projectId || proj.id,
      _sbSynced: false
    };
    proj.brainstormDocuments.unshift(newDoc);
    updateProject(proj);
    return newDoc;
  };

  const removeBrainstormDocument = (documentId) => {
    const proj = { ...currentProject };
    if (proj.brainstormDocuments) {
      proj.brainstormDocuments = proj.brainstormDocuments.filter(d => d.id !== documentId);
      updateProject(proj);
    }
  };

  const processBrainstorm = () => {
    const proj = { ...currentProject };
    let changed = false;

    const unprocessedRecs = proj.recordings.filter(r => !r.processed);
    const unprocessedMeds = proj.mediaUploads.filter(m => !m.processed);

    if (unprocessedRecs.length === 0 && unprocessedMeds.length === 0) return false;

    autoSaveVersionIfNeeded(proj, 'Brainstorm');

    proj.recordings = proj.recordings.map(r => ({ ...r, processed: true }));
    proj.mediaUploads = proj.mediaUploads.map(m => ({ ...m, processed: true }));

    const latestTranscript = unprocessedRecs[0]?.transcript || '';

    if (latestTranscript.toLowerCase().includes('personagem') || latestTranscript.toLowerCase().includes('vilão') || latestTranscript.toLowerCase().includes('mocinho')) {
      const newChar = {
        id: `char-mock-${Date.now()}`,
        name: 'Doutor Shinoda',
        role: 'Aliado Secreto',
        description: 'Um médico hacker renegado que realiza implantes ilegais nos esgotos da cidade.',
        traits: ['Sábio', 'Trêmulo', 'Nervoso'],
        backstory: 'Ex-cirurgião da Zenith Corporation demitido por tentar denunciar experimentos imorais.',
        avatar: 'green',
        notes: 'Extraído automaticamente da gravação de áudio.'
      };
      proj.entities = proj.entities || {};
      if (!proj.entities.characters) proj.entities.characters = [];
      proj.entities.characters.push({ ...newChar, relationships: [], createdAt: Date.now(), updatedAt: Date.now() });
      proj.mindMapNodes.push({
        id: `n-${newChar.id}`,
        entityId: newChar.id,
        x: 450,
        y: 400,
      });
      linkNodeToFirstAct(proj, `n-${newChar.id}`);
      changed = true;
    } else if (latestTranscript.toLowerCase().includes('cenário') || latestTranscript.toLowerCase().includes('lugar') || latestTranscript.toLowerCase().includes('cidade')) {
      const newLoc = {
        id: `loc-mock-${Date.now()}`,
        name: 'O Mercado das Sombras',
        type: 'EXT.',
        description: 'Um mercado caótico sob a ponte do viaduto do chá, com barracas brilhando em holografia roxa e verde vendendo hardware obsoleto.',
        timeOfDay: 'NOITE',
        mood: 'Caótico, Perigoso, Luminoso'
      };
      proj.entities = proj.entities || {};
      if (!proj.entities.locations) proj.entities.locations = [];
      proj.entities.locations.push({ ...newLoc, group: '', createdAt: Date.now(), updatedAt: Date.now() });
      proj.mindMapNodes.push({
        id: `n-${newLoc.id}`,
        entityId: newLoc.id,
        x: 650,
        y: 420,
        details: `EXT. ${newLoc.name}. ${newLoc.description}`
      });
      linkNodeToFirstAct(proj, `n-${newLoc.id}`);
      changed = true;
    } else {
      const newSceneId = `sc-mock-${Date.now()}`;
      const title = 'INT. MERCADO DAS SOMBRAS - NOITE';
      proj.screenplay.push(
        { id: `${newSceneId}-1`, type: 'scene-heading', text: title },
        { id: `${newSceneId}-2`, type: 'action', text: 'Max entra no mercado úmido. A chuva passa pelas grelhas do viaduto superior. As barracas vendem chips biológicos piscando em luz violeta.' },
        { id: `${newSceneId}-3`, type: 'character', text: 'MAX' },
        { id: `${newSceneId}-4`, type: 'dialogue', text: 'Alguém aqui tem que saber onde fica o laboratório secundário da Dra. Vance.' }
      );
      proj.mindMapNodes.push({
        id: `n-${newSceneId}`,
        label: 'Cena: Mercado das Sombras',
        type: 'scene',
        x: 650,
        y: 250,
        details: 'Max busca pistas no Mercado das Sombras.'
      });
      
      const act2 = proj.mindMapNodes.find(n => n.id.includes('act2') || n.id === 'n-act2');
      if (act2) {
        proj.mindMapLinks.push({
          id: `l-mock-${Date.now()}`,
          source: act2.id,
          target: `n-${newSceneId}`
        });
      }
      changed = true;
    }

    if (changed) {
      proj.needsAutoLayout = true;
    }

    updateProject(proj);
    return changed;
  };

  const markRecordingsProcessed = () => {
    const proj = { ...currentProject };
    proj.recordings = proj.recordings.map(r => ({ ...r, processed: true }));
    updateProject(proj);
  };

  const processLLMToProject = (llmData, recordingTitle, recordingTranscript) => {
    // llmData can be either old format (characters, locations, objects, scenes) 
    // or new format (characters, plot_points, scenes, dialogues, world_elements, themes)
    // We MERGE with existing project data instead of replacing

    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Extração IA');

    // Ensure entities object exists
    if (!proj.entities) {
      proj.entities = {
        characters: [],
        locations: [],
        objects: [],
        scenes: [],
        plot_points: [],
        themes: [],
        acts: [],
        dialogues: [],
        world_elements: [],
      };
    }

    // 1. Handle ACTS - preserve existing, add new from scenes
    let actNodes = proj.mindMapNodes.filter(n => n.type === 'act');
    const llmActs = new Set();
    
    const scenesSource = llmData.scenes || llmData.plot_points || [];
    if (Array.isArray(scenesSource)) {
      scenesSource.forEach(scene => {
        if (scene.act && typeof scene.act === 'string') {
          const uAct = scene.act.trim().toUpperCase();
          if (uAct) llmActs.add(uAct);
        }
      });
    }

    const romanToInt = (roman) => {
      const uRoman = (roman || '').trim().toUpperCase();
      const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
      return map[uRoman] || 99;
    };

    const sortedActs = Array.from(llmActs).sort((a, b) => romanToInt(a) - romanToInt(b));
    
    sortedActs.forEach((actStr, index) => {
      const actLabel = `ATO ${actStr.toUpperCase()}`;
      const exists = actNodes.some(n => {
        if (n.entityId && proj.entities?.acts?.some(a => a.id === n.entityId && `ATO ${a.name}`.toUpperCase().includes(actStr))) return true;
        return n.label?.toUpperCase().includes(actStr);
      });
      if (!exists) {
        const actEntity = {
          id: `act-${Date.now()}-${actStr.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: `ATO ${actStr.toUpperCase()}`,
          order: index + 1,
          description: `Estrutura do Ato ${actStr.toUpperCase()}`,
          color: '#ccee00',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (!proj.entities.acts) proj.entities.acts = [];
        proj.entities.acts.push(actEntity);
        actNodes.push({
          id: `n-${actEntity.id}`,
          entityId: actEntity.id,
          x: 150 + index * 250,
          y: 150,
        });
      }
    });

    actNodes = actNodes.map((act, index) => ({
      ...act,
      x: 150 + index * 250,
      y: 150
    }));

    proj.mindMapNodes = proj.mindMapNodes.filter(n => {
      if (n.type === 'act') return false;
      if (n.entityId && proj.entities?.acts?.some(a => a.id === n.entityId)) return false;
      return true;
    });
    proj.mindMapNodes.push(...actNodes);

    for (let index = 0; index < actNodes.length - 1; index++) {
      proj.mindMapLinks.push({
        id: `l-act-seq-${Date.now()}-${index}`,
        source: actNodes[index].id,
        target: actNodes[index + 1].id
      });
    }

    // 2. MERGE CHARACTERS (by name)
    const newCharacters = (llmData.characters || []).map(char => ({
      name: char.name || '',
      role: char.role || 'Coadjuvante',
      description: char.description || '',
      traits: Array.isArray(char.traits) ? char.traits : [],
      backstory: char.backstory || '',
      avatar: ['amber','green','blue','purple','red','pink'][Math.floor(Math.random() * 6)],
      notes: ''
    })).filter(c => c.name);

    newCharacters.forEach(newChar => {
      const existingIdx = (proj.entities.characters || []).findIndex(c => c.name.toLowerCase() === newChar.name.toLowerCase());
      if (existingIdx >= 0) {
        // Merge: update existing with new info (preserve user edits in notes/avatar)
        proj.entities.characters[existingIdx] = {
          ...proj.entities.characters[existingIdx],
          role: newChar.role,
          description: newChar.description || proj.entities.characters[existingIdx].description,
          traits: [...new Set([...(proj.entities.characters[existingIdx].traits || []), ...newChar.traits])],
          backstory: newChar.backstory || proj.entities.characters[existingIdx].backstory,
          updatedAt: Date.now(),
        };
        // Update mindMap node
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.entityId === proj.entities.characters[existingIdx].id || n.id === `n-${proj.entities.characters[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            entityId: proj.entities.characters[existingIdx].id,
          };
        }
      } else {
        // Create new
        const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullChar = { ...newChar, id, avatar: newChar.avatar || 'amber', relationships: [], createdAt: Date.now(), updatedAt: Date.now() };
        if (!proj.entities.characters) proj.entities.characters = [];
        proj.entities.characters.push(fullChar);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          entityId: id,
          x: Math.round(300 + Math.random() * 400),
          y: Math.round(300 + Math.random() * 200),
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 3. MERGE LOCATIONS (from world_elements type=location or old locations)
    const locationSources = [
      ...(llmData.world_elements || []).filter(w => w.type === 'location'),
      ...(llmData.locations || [])
    ];

    locationSources.forEach(loc => {
      const newLoc = {
        name: loc.name || '',
        type: loc.type || 'INT.',
        description: loc.description || '',
        timeOfDay: loc.timeOfDay || 'DIA',
        mood: loc.mood || ''
      };
      if (!newLoc.name) return;

      const existingIdx = (proj.entities.locations || []).findIndex(l => 
        l.name.toLowerCase() === newLoc.name.toLowerCase() && l.type === newLoc.type
      );
      if (existingIdx >= 0) {
        proj.entities.locations[existingIdx] = { ...proj.entities.locations[existingIdx], ...newLoc, updatedAt: Date.now() };
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.entityId === proj.entities.locations[existingIdx].id || n.id === `n-${proj.entities.locations[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            entityId: proj.entities.locations[existingIdx].id,
          };
        }
      } else {
        const id = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullLoc = { ...newLoc, id, group: '', createdAt: Date.now(), updatedAt: Date.now() };
        if (!proj.entities.locations) proj.entities.locations = [];
        proj.entities.locations.push(fullLoc);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          entityId: id,
          x: Math.round(300 + Math.random() * 400),
          y: Math.round(300 + Math.random() * 200),
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 4. MERGE OBJECTS (from world_elements type=object/technology or old objects)
    const objectSources = [
      ...(llmData.world_elements || []).filter(w => ['object', 'technology', 'organization'].includes(w.type)),
      ...(llmData.objects || [])
    ];

    objectSources.forEach(obj => {
      const newObj = {
        name: obj.name || '',
        description: obj.description || '',
        significance: obj.significance || ''
      };
      if (!newObj.name) return;

      const existingIdx = (proj.entities.objects || []).findIndex(o => o.name.toLowerCase() === newObj.name.toLowerCase());
      if (existingIdx >= 0) {
        proj.entities.objects[existingIdx] = { ...proj.entities.objects[existingIdx], ...newObj, updatedAt: Date.now() };
        const nodeIdx = proj.mindMapNodes.findIndex(n => n.entityId === proj.entities.objects[existingIdx].id || n.id === `n-${proj.entities.objects[existingIdx].id}`);
        if (nodeIdx >= 0) {
          proj.mindMapNodes[nodeIdx] = {
            ...proj.mindMapNodes[nodeIdx],
            entityId: proj.entities.objects[existingIdx].id,
          };
        }
      } else {
        const id = `obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const fullObj = { ...newObj, id, group: '', createdAt: Date.now(), updatedAt: Date.now() };
        if (!proj.entities.objects) proj.entities.objects = [];
        proj.entities.objects.push(fullObj);
        proj.mindMapNodes.push({
          id: `n-${id}`,
          entityId: id,
          x: Math.round(300 + Math.random() * 400),
          y: Math.round(300 + Math.random() * 200),
        });
        linkNodeToFirstAct(proj, `n-${id}`);
      }
    });

    // 5. APPEND SCENES to screenplay (dedup by scene-heading text)
    const newScenes = (llmData.scenes || []).filter(s => s.title || (s.elements && s.elements.length));
    let screenplayIdCounter = proj.screenplay.length;
    
    newScenes.forEach(scene => {
      const sceneHeadingText = scene.title || `CENA ${screenplayIdCounter + 1}`;
      const existsInScreenplay = proj.screenplay.some(s => 
        s.type === 'scene-heading' && s.text.trim().toUpperCase() === sceneHeadingText.trim().toUpperCase()
      );
      
      if (!existsInScreenplay) {
        if (scene.elements && Array.isArray(scene.elements)) {
          scene.elements.forEach(el => {
            proj.screenplay.push({
              id: `sc-el-${Date.now()}-${screenplayIdCounter++}`,
              type: el.type || 'action',
              text: el.text || ''
            });
          });
        } else {
          proj.screenplay.push(
            { id: `sc-el-${Date.now()}-${screenplayIdCounter++}`, type: 'scene-heading', text: sceneHeadingText },
            { id: `sc-el-${Date.now()}-${screenplayIdCounter++}`, type: 'action', text: scene.description || '' }
          );
        }
      }

      // Also save scene to entities
      const sceneId = `scn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      proj.entities.scenes.push({
        id: sceneId,
        title: scene.title || `Cena ${proj.entities.scenes.length + 1}`,
        synopsis: scene.description || '',
        actId: null, // could be resolved from act letter
        characterIds: [],
        order: proj.entities.scenes.length,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Add scene node to mindmap
      const mindmapSceneId = `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const actLetter = (scene.act || 'I').trim().toUpperCase();
      const actIdx = actNodes.findIndex(n => n.label.toUpperCase().includes(`ATO ${actLetter}`));
      const colX = 150 + (actIdx >= 0 ? actIdx : 0) * 250;
      const sceneCount = proj.mindMapNodes.filter(n => n.type === 'scene').length;
      const rowY = 520 + sceneCount * 120;

      proj.mindMapNodes.push({
        id: `n-${mindmapSceneId}`,
        label: scene.title || `Cena ${sceneCount + 1}`,
        type: 'scene',
        x: colX + Math.random() * 20,
        y: rowY,
        details: scene.description || ''
      });

      const targetAct = proj.mindMapNodes.find(n => n.type === 'act' && n.label.toUpperCase().includes(`ATO ${actLetter}`));
      if (targetAct) {
        proj.mindMapLinks.push({
          id: `l-scene-${mindmapSceneId}`,
          source: targetAct.id,
          target: `n-${mindmapSceneId}`
        });
      }
    });

    // 6. WORLD ELEMENTS (non-location, non-object) - add as generic nodes AND to entities
    const otherWorldElements = (llmData.world_elements || []).filter(w => 
      !['location', 'object', 'technology', 'organization'].includes(w.type)
    );
    otherWorldElements.forEach(w => {
      if (!w.name) return;
      const id = `world-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const full = { ...w, id };
      // Add to entities
      proj.entities.world_elements.push({
        id,
        name: full.name,
        type: full.type || 'setting',
        description: full.description || '',
        tags: full.tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      proj.mindMapNodes.push({
        id: `n-${id}`,
        label: full.name,
        type: 'world',
        x: 300 + Math.random() * 400,
        y: 300 + Math.random() * 200,
        details: `${full.type}: ${full.description}`
      });
      linkNodeToFirstAct(proj, `n-${id}`);
    });

    // 7. PLOT POINTS - add as act-level nodes or connect to acts AND to entities
    (llmData.plot_points || []).forEach((pp, i) => {
      if (!pp.title) return;
      const id = `plot-${Date.now()}-${i}`;
      const actLetter = (pp.act || 'I').trim().toUpperCase();
      const actIdx = actNodes.findIndex(n => n.label.toUpperCase().includes(`ATO ${actLetter}`));
      const colX = 150 + (actIdx >= 0 ? actIdx : 0) * 250;
      const rowY = 300 + i * 100;
      
      // Add to entities
      proj.entities.plot_points.push({
        id,
        title: pp.title,
        description: pp.description || '',
        actId: null, // could be resolved
        tags: pp.tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      proj.mindMapNodes.push({
        id: `n-${id}`,
        entityId: id,
        x: Math.round(colX),
        y: Math.round(rowY),
      });

      const targetAct = proj.mindMapNodes.find(n => {
        if (n.type === 'act') return n.label?.toUpperCase().includes(`ATO ${actLetter}`);
        if (n.entityId && proj.entities?.acts?.some(a => a.id === n.entityId && `ATO ${a.name}`.includes(`ATO ${actLetter}`))) return true;
        return false;
      });
      if (targetAct) {
        proj.mindMapLinks.push({
          id: `l-plot-${id}`,
          source: targetAct.id,
          target: `n-${id}`
        });
      }
    });

    // 8. THEMES - add as special nodes AND to entities
    (llmData.themes || []).forEach((t, i) => {
      if (!t.statement) return;
      const id = `theme-${Date.now()}-${i}`;
      
      // Add to entities
      proj.entities.themes.push({
        id,
        statement: t.statement,
        evidence: t.evidence || '',
        relevance: t.relevance || 'Central',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      proj.mindMapNodes.push({
        id: `n-${id}`,
        entityId: id,
        x: Math.round(800 + Math.random() * 200),
        y: Math.round(150 + i * 80),
      });
      linkNodeToFirstAct(proj, `n-${id}`);
    });

    // 9. DIALOGUES - add to entities
    (llmData.dialogues || []).forEach((d, i) => {
      if (!d.speaker || !d.line) return;
      const id = `dlg-${Date.now()}-${i}`;
      proj.entities.dialogues.push({
        id,
        speaker: d.speaker,
        line: d.line,
        context: d.context || '',
        tags: d.tags || [],
        sceneId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // 10. Rebuild semantic links (character-location, character-object, object-location)
    rebuildSemanticLinks(proj);

    updateProject(proj);
    return { 
      characters: newCharacters.length, 
      locations: locationSources.length, 
      objects: objectSources.length, 
      scenes: newScenes.length 
    };
  };

  const importScreenplayWithEntities = (importedElements) => {
    const proj = { ...currentProject };
    // Always backup current version before importing
    _backupCurrent(proj, `Antes de importar: ${new Date().toLocaleString('pt-BR')}`);

    if (!proj.entities) {
      proj.entities = {
        characters: [], locations: [], objects: [],
        scenes: [], plot_points: [], themes: [],
        acts: [], dialogues: [], world_elements: [],
      };
    }

    // Extract entities from screenplay text
    const extracted = extractEntitiesFromScreenplay(importedElements, proj.entities);

    // Helper: generate consistent ID
    const genId = (prefix) => `${prefix}-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Track new entity IDs for mind map creation
    const newEntityIds = [];

    // 1. MERGE CHARACTERS (into entities.characters + legacy proj.characters)
    for (const item of extracted.characters) {
      if (!item.name) continue;
      const exists = proj.entities.characters.find(
        c => c.name?.toUpperCase() === item.name.toUpperCase()
      );
      if (!exists) {
        const id = item.id || genId('char');
        const fullChar = {
          ...item, id,
          role: item.role || 'Coadjuvante',
          traits: item.traits || [],
          backstory: item.backstory || '',
          avatar: item.avatar || ['amber','green','blue','purple','red','pink'][proj.entities.characters.length % 6],
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        proj.entities.characters.push(fullChar);
        if (!proj.characters) proj.characters = [];
        proj.characters.push({ ...fullChar, relationships: [] });
        newEntityIds.push({ id, type: 'character', label: fullChar.name });
      }
    }

    // 2. MERGE LOCATIONS
    for (const item of extracted.locations) {
      if (!item.name) continue;
      const exists = proj.entities.locations.find(
        l => l.name?.toUpperCase() === item.name.toUpperCase() && l.type === item.type
      );
      if (!exists) {
        const id = item.id || genId('loc');
        const fullLoc = {
          ...item, id,
          timeOfDay: item.timeOfDay || 'DIA',
          mood: item.mood || '',
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        proj.entities.locations.push(fullLoc);
        if (!proj.locations) proj.locations = [];
        proj.locations.push({ ...fullLoc, group: '' });
        newEntityIds.push({ id, type: 'location', label: fullLoc.name });
      }
    }

    // 3. MERGE SCENES
    for (const item of extracted.scenes) {
      if (!item.title) continue;
      const exists = proj.entities.scenes.find(
        s => s.title?.toUpperCase() === item.title.toUpperCase()
      );
      if (!exists) {
        const id = item.id || genId('scn');
        const fullScene = {
          ...item, id,
          synopsis: item.synopsis || '',
          actId: item.actId || null,
          characterIds: item.characterIds || [],
          order: proj.entities.scenes.length,
          status: 'draft',
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        proj.entities.scenes.push(fullScene);
        newEntityIds.push({ id, type: 'scene', label: fullScene.title });
      }
    }

    // 4. MERGE ACTS
    for (const item of extracted.acts) {
      if (!item.name) continue;
      const exists = proj.entities.acts.find(
        a => a.name?.toUpperCase() === item.name.toUpperCase()
      );
      if (!exists) {
        const id = item.id || genId('act');
        const fullAct = {
          ...item, id,
          order: proj.entities.acts.length,
          color: '#ccee00',
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        proj.entities.acts.push(fullAct);
        newEntityIds.push({ id, type: 'act', label: fullAct.name });
      }
    }

    // 5. MERGE OBJECTS
    for (const item of extracted.objects) {
      if (!item.name) continue;
      const exists = proj.entities.objects.find(
        o => o.name?.toUpperCase() === item.name.toUpperCase()
      );
      if (!exists) {
        const id = item.id || genId('obj');
        const fullObj = {
          ...item, id,
          description: item.description || '',
          significance: item.significance || '',
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        proj.entities.objects.push(fullObj);
        if (!proj.objects) proj.objects = [];
        proj.objects.push({ ...fullObj, group: '' });
        newEntityIds.push({ id, type: 'object', label: fullObj.name });
      }
    }

    // 6. CREATE MIND MAP NODES for new entities
    if (!proj.mindMapNodes) proj.mindMapNodes = [];
    const firstActNode = proj.mindMapNodes.find(n => {
      if (n.type === 'act') return true;
      if (n.entityId && proj.entities?.acts?.some(a => a.id === n.entityId)) return true;
      return false;
    });
    for (const { id, type, label } of newEntityIds) {
      const nodeId = `n-${id}`;
      const exists = proj.mindMapNodes.some(n => n.id === nodeId || n.entityId === id);
      if (exists) continue;
      let nodeX = 300 + Math.random() * 400;
      let nodeY = 300 + Math.random() * 200;
      if (type === 'act') {
        const actIdx = proj.entities.acts.length - 1;
        nodeX = 150 + actIdx * 250;
        nodeY = 150;
      }
      proj.mindMapNodes.push({
        id: nodeId,
        entityId: id,
        x: Math.round(nodeX),
        y: Math.round(nodeY),
      });
      // Link to first act (except acts themselves)
      if (type !== 'act' && firstActNode) {
        const alreadyLinked = proj.mindMapLinks?.some(l =>
          (l.source === firstActNode.id && l.target === nodeId) ||
          (l.source === nodeId && l.target === firstActNode.id)
        );
        if (!alreadyLinked) {
          if (!proj.mindMapLinks) proj.mindMapLinks = [];
          proj.mindMapLinks.push({
            id: `l-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: firstActNode.id,
            target: nodeId,
          });
        }
      }
    }

    // Debug: verify extracted data
    console.log('[ImportDebug] extracted:', {
      chars: extracted.characters.length,
      locs: extracted.locations.length,
      scenes: extracted.scenes.length,
      acts: extracted.acts.length,
    });
    console.log('[ImportDebug] proj.entities.characters:', proj.entities.characters?.length);
    console.log('[ImportDebug] proj.entities.scenes:', proj.entities.scenes?.length);
    console.log('[ImportDebug] proj.characters (legacy):', proj.characters?.length);

    // Build linking map and link entities to screenplay
    const entityMaps = buildEntityLinkingMap(proj.entities, extracted);
    const linkedScreenplay = linkEntitiesToScreenplay(importedElements, entityMaps);

    // Update screenplay
    proj.screenplay = linkedScreenplay;
    proj.needsAutoLayout = true;
    updateProject(proj);

    return {
      characters: extracted.characters.length,
      locations: extracted.locations.length,
      scenes: extracted.scenes.length,
      acts: extracted.acts.length,
    };
  };

  const enrichWithLLM = (llmData) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Extração IA Roteiro');

    // Process plot_points
    (llmData.plot_points || []).forEach((pp, i) => {
      if (!pp.title) return;
      proj.entities = proj.entities || {};
      if (!proj.entities.plot_points) proj.entities.plot_points = [];
      const exists = proj.entities.plot_points.find(
        p => p.title?.toUpperCase() === pp.title?.toUpperCase()
      );
      if (!exists) {
        proj.entities.plot_points.push({
          id: `plot-import-${Date.now()}-${i}`,
          title: pp.title,
          description: pp.description || '',
          act: pp.act || 'I',
          tags: pp.tags || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    // Process themes
    (llmData.themes || []).forEach((t, i) => {
      if (!t.statement) return;
      proj.entities = proj.entities || {};
      if (!proj.entities.themes) proj.entities.themes = [];
      const exists = proj.entities.themes.find(
        th => th.statement?.toUpperCase() === t.statement?.toUpperCase()
      );
      if (!exists) {
        proj.entities.themes.push({
          id: `theme-import-${Date.now()}-${i}`,
          statement: t.statement,
          evidence: t.evidence || '',
          relevance: t.relevance || 'Central',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    // Process objects/world_elements
    const worldElements = llmData.world_elements || llmData.objects || [];
    worldElements.forEach((obj, i) => {
      if (!obj.name) return;
      proj.entities = proj.entities || {};
      if (!proj.entities.objects) proj.entities.objects = [];
      const exists = proj.entities.objects.find(
        o => o.name?.toUpperCase() === obj.name?.toUpperCase()
      );
      if (!exists) {
        proj.entities.objects.push({
          id: `obj-import-${Date.now()}-${i}`,
          name: obj.name,
          description: obj.description || '',
          significance: obj.significance || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    updateProject(proj);

    return {
      plot_points: (llmData.plot_points || []).length,
      themes: (llmData.themes || []).length,
      objects: worldElements.length,
    };
  };

  const rebuildSemanticLinks = (proj) => {
    // Clear existing relationship links
    proj.mindMapLinks = proj.mindMapLinks.filter(l => l.type !== 'relationship');

    const mentions = (text, name) => {
      if (!text || !name) return false;
      const cleanText = text.toLowerCase();
      const cleanName = name.toLowerCase();
      return cleanName.length > 2 && cleanText.includes(cleanName);
    };

    const nodeAttractions = {};

    // Character <-> Location
    (proj.entities?.characters || []).forEach(char => {
      (proj.entities?.locations || []).forEach(loc => {
        const charMentionLoc = mentions(char.description, loc.name) || mentions(char.backstory, loc.name);
        const locMentionChar = mentions(loc.description, char.name);
        if (charMentionLoc || locMentionChar) {
          const charNodeId = `n-${char.id}`;
          const locNodeId = `n-${loc.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-char-loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: charNodeId,
            target: locNodeId,
            type: 'relationship'
          });
          nodeAttractions[charNodeId] = locNodeId;
        }
      });
    });

    // Character <-> Object
    (proj.entities?.characters || []).forEach(char => {
      (proj.entities?.objects || []).forEach(obj => {
        const charMentionObj = mentions(char.description, obj.name) || mentions(char.backstory, obj.name);
        const objMentionChar = mentions(obj.description, char.name) || mentions(obj.significance, char.name);
        if (charMentionObj || objMentionChar) {
          const charNodeId = `n-${char.id}`;
          const objNodeId = `n-${obj.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-char-obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: charNodeId,
            target: objNodeId,
            type: 'relationship'
          });
          if (!nodeAttractions[objNodeId]) nodeAttractions[objNodeId] = charNodeId;
        }
      });
    });

    // Object <-> Location
    (proj.entities?.objects || []).forEach(obj => {
      (proj.entities?.locations || []).forEach(loc => {
        const locMentionObj = mentions(loc.description, obj.name);
        const objMentionLoc = mentions(obj.description, loc.name) || mentions(obj.significance, loc.name);
        if (locMentionObj || objMentionLoc) {
          const locNodeId = `n-${loc.id}`;
          const objNodeId = `n-${obj.id}`;
          proj.mindMapLinks.push({
            id: `l-rel-loc-obj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: locNodeId,
            target: objNodeId,
            type: 'relationship'
          });
          if (!nodeAttractions[objNodeId]) nodeAttractions[objNodeId] = locNodeId;
        }
      });
    });

    // Reposition nodes based on attractions
    proj.mindMapNodes = proj.mindMapNodes.map(node => {
      const targetId = nodeAttractions[node.id];
      if (targetId) {
        const targetNode = proj.mindMapNodes.find(n => n.id === targetId);
        if (targetNode) {
          const angle = node.type === 'object' ? Math.PI / 3 : -Math.PI / 3;
          return {
            ...node,
            x: Math.round(targetNode.x + Math.cos(angle) * 120),
            y: Math.round(targetNode.y + Math.sin(angle) * 120)
          };
        }
      }
      return node;
    });
  };

  const updateScreenplay = (newScreenplay) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Roteiro');
    proj.screenplay = newScreenplay;
    const now = Date.now();
    if (now - lastUserEditTimestamp > 30000) {
      const v = vs(proj);
      const { blockStore: newBlocks, blockOrder } = screenplayToBlocks(newScreenplay || []);
      mergeBlockStores(v.blockStore, newBlocks);
      const ver = {
        id: `v-user-${now}`,
        parentId: v.head,
        type: 'user',
        name: `Edição do usuário (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
        timestamp: now,
        blockOrder,
        metadata: {
          mindMapNodes: JSON.parse(JSON.stringify(proj.mindMapNodes || [])),
          mindMapLinks: JSON.parse(JSON.stringify(proj.mindMapLinks || []))
        }
      };
      v.all.unshift(ver);
      v.head = ver.id;
      setLastUserEditTimestamp(now);
    }
    updateProject(proj);
  };

  const updateMindMap = (nodes, links) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Mapa');
    proj.mindMapNodes = nodes;
    proj.mindMapLinks = links;
    updateProject(proj);
  };

  // Cross-tab navigation
  const [tabNavigation, setTabNavigation] = useState(null);
  const navigateTo = useCallback((tab, targetId) => {
    setTabNavigation({ tab, targetId });
  }, []);

  // Auto-clear navigation after it's been consumed
  useEffect(() => {
    if (tabNavigation) {
      const t = setTimeout(() => setTabNavigation(null), 3000);
      return () => clearTimeout(t);
    }
  }, [tabNavigation]);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      currentProjectId,
      setCurrentProjectId,
      updateProject,
      addProject,
      deleteProject,
      syncAllToCloud,
      setProjectVisibility,
      setProjectTags,
      saveCharacter,
      deleteCharacter,
      saveLocation,
      deleteLocation,
      saveObject,
      deleteObject,
      saveEntity,
      deleteEntityById,
      saveIdea,
      deleteIdea,
      updateIdea,
      reorderIdeas,
      addRecording,
      addMediaUpload,
      addBrainstormDocument,
      removeBrainstormDocument,
      processBrainstorm,
      processLLMToProject,
      importScreenplayWithEntities,
      enrichWithLLM,
      markRecordingsProcessed,
      updateScreenplay,
      updateMindMap,
      tabNavigation,
      navigateTo,
      // Versioning system
      saveVersion,
      restoreVersion,
      stageProposedChanges,
      approveStaging,
      approveStagingPartial,
      rejectStaging,
      getPendingStagingCount,
      getVersionScreenplay,
      compareVersions,
      compareWithStaging
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
