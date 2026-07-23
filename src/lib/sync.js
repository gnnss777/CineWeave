import { supabase, getCurrentUser, fetchProfile } from './supabase';
import * as db from './db';

const ID_MAP_KEY = 'cineweave_sb_ids';

// Track brainstorm document sync status
const BSB_SYNCED_FLAG = '__bsb_synced';

const _uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(id) { return typeof id === 'string' && _uuidRe.test(id); }

function isConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co';
}

function loadIdMap() {
  try {
    return JSON.parse(localStorage.getItem(ID_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveIdMap(map) {
  localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
}

export function getSupabaseId(localId, entityType) {
  const map = loadIdMap();
  return map[entityType]?.[localId] || null;
}

export function setSupabaseId(localId, entityType, sbId) {
  const map = loadIdMap();
  if (!map[entityType]) map[entityType] = {};
  map[entityType][localId] = sbId;
  saveIdMap(map);
}

export async function isLoggedIn() {
  if (!isConfigured()) return false;
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function getCurrentProfile() {
  if (!isConfigured()) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const profile = await fetchProfile(user.id);
    return profile;
  } catch {
    return null;
  }
}

export async function loadProjectsFromSupabase() {
  if (!isConfigured()) return null;
  const user = await getCurrentUser().catch(() => null);
  if (!user) return null;

  // Load user's own projects + public projects
  const sbProjects = await db.fetchProjects(user.id);
  if (!sbProjects || sbProjects.length === 0) return [];

  // Also load public projects from other users
  const publicProjects = await db.fetchPublicProjects(50).catch(() => []);

  const allProjects = [...sbProjects];
  for (const pp of (publicProjects || [])) {
    if (!allProjects.find(p => p.id === pp.id)) {
      allProjects.push(pp);
    }
  }

  const map = loadIdMap();
  if (!map.projects) map.projects = {};
  if (!map.characters) map.characters = {};
  if (!map.locations) map.locations = {};
  if (!map.objects) map.objects = {};

  const projects = [];

  for (const sbProj of allProjects) {
    let localId = Object.entries(map.projects).find(([, v]) => v === sbProj.id)?.[0];
    if (!localId) {
      localId = `sb-${sbProj.id.slice(0, 8)}`;
      map.projects[localId] = sbProj.id;
    }

    const [sbChars, sbLocs, sbObjs, sbScreenplay, sbNodes, sbLinks, sbRecs, sbMedia, sbBsd, sbTags, sbIdeas, sbProjectFiles, sbScreenplayImports, sbScenes, sbActs, sbDialogues, sbThemes, sbPlotPoints, sbWorldElements] = await Promise.all([
      db.fetchCharacters(sbProj.id),
      db.fetchLocations(sbProj.id),
      db.fetchObjects(sbProj.id),
      db.fetchScreenplay(sbProj.id),
      db.fetchMindMapNodes(sbProj.id),
      db.fetchMindMapLinks(sbProj.id),
      db.fetchRecordings(sbProj.id),
      db.fetchMediaUploads(sbProj.id),
      db.fetchBrainstormDocuments(sbProj.id),
      db.fetchProjectTags(sbProj.id),
      db.fetchIdeas(sbProj.id).catch(() => []),
      db.fetchProjectFiles(sbProj.id).catch(() => []),
      db.fetchScreenplayImports(sbProj.id).catch(() => []),
      db.fetchScenes(sbProj.id).catch(() => []),
      db.fetchActs(sbProj.id).catch(() => []),
      db.fetchDialogues(sbProj.id).catch(() => []),
      db.fetchThemes(sbProj.id).catch(() => []),
      db.fetchPlotPoints(sbProj.id).catch(() => []),
      db.fetchWorldElements(sbProj.id).catch(() => []),
    ]);

    const characters = (sbChars || []).map(c => {
      map.characters[c.id] = c.id;
      return {
        id: c.id,
        name: c.name,
        role: c.role || 'Protagonista',
        description: c.description || '',
        traits: c.traits || [],
        backstory: c.backstory || '',
        avatar: c.avatar || 'amber',
        notes: c.notes || '',
        tags: c.tags || [],
      };
    });

    const locations = (sbLocs || []).map(l => {
      map.locations[l.id] = l.id;
      return {
        id: l.id,
        name: l.name,
        type: l.type || 'INT.',
        description: l.description || '',
        timeOfDay: l.time_of_day || 'NOITE',
        mood: l.mood || '',
        tags: l.tags || [],
      };
    });

    const objects = (sbObjs || []).map(o => {
      map.objects[o.id] = o.id;
      return {
        id: o.id,
        name: o.name,
        significance: o.significance || '',
        description: o.description || '',
        tags: o.tags || [],
      };
    });

    const screenplay = (sbScreenplay || []).map((el, i) => ({
      id: `sc-${sbProj.id.slice(0, 8)}-${i}`,
      type: el.element_type,
      text: el.text,
      tags: el.tags || [],
    }));

    const mindMapNodes = (sbNodes || []).map(n => ({
      id: n.id,
      label: n.label,
      type: n.node_type,
      x: n.x,
      y: n.y,
      details: n.details || '',
    }));

    const mindMapLinks = (sbLinks || []).map(l => ({
      id: l.id,
      source: l.source_node_id,
      target: l.target_node_id,
    }));

    const recordings = (sbRecs || []).map(r => ({
      id: r.id,
      title: r.title,
      duration: r.duration || '',
      date: r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '',
      transcript: r.transcript || '',
      processed: r.processed || false,
      _sbSynced: true,
    }));

    const mediaUploads = (sbMedia || []).map(m => ({
      id: m.id,
      name: m.name,
      date: m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : '',
      type: m.media_type || 'image',
      url: m.url || '',
      content: '',
      processed: m.processed || false,
      _sbSynced: true,
    }));

    const brainstormDocuments = (sbBsd || []).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size,
      content: d.content,
      metadata: d.metadata,
      extractedData: d.extracted_data,
      status: d.status || 'pending',
      errorMessage: d.error_message,
      createdAt: d.created_at,
      _sbSynced: true,
    }));

    const projectTags = (sbTags || []).map(t => ({
      tag_id: t.tag_id,
      tag_type: t.tag_type,
      user_id: t.user_id,
    }));

    projects.push({
      id: localId,
      title: sbProj.title,
      tagline: sbProj.tagline || '',
      genre: sbProj.genre || '',
      logline: sbProj.logline || '',
      visibility: sbProj.visibility || 'private',
      is_published: sbProj.is_published || false,
      published_at: sbProj.published_at || null,
      allow_collaboration: sbProj.allow_collaboration || false,
      tags: sbProj.tags || [],
      projectTags,
      user_id: sbProj.user_id,
      characters,
      locations,
      objects,
      screenplay,
      mindMapNodes,
      mindMapLinks,
      recordings,
      mediaUploads,
      brainstormDocuments,
      ideas: (sbIdeas || []).map(idea => ({
        id: idea.id,
        text: idea.text,
        category: idea.category || 'general',
        tags: idea.tags || [],
        createdAt: new Date(idea.created_at).getTime(),
        updatedAt: new Date(idea.updated_at).getTime(),
        _sbSynced: true,
      })),
      projectFiles: (sbProjectFiles || []).map(f => ({
        id: f.id,
        name: f.name,
        originalName: f.original_name,
        mimeType: f.mime_type,
        fileSize: f.file_size,
        storagePath: f.storage_path,
        url: f.url,
        source: f.source,
        metadata: f.metadata,
        createdAt: new Date(f.created_at).getTime(),
        _sbSynced: true,
      })),
      screenplayImports: (sbScreenplayImports || []).map(si => ({
        id: si.id,
        fileId: si.file_id,
        originalFilename: si.original_filename,
        importType: si.import_type,
        elementCount: si.element_count,
        metadata: si.metadata,
        createdAt: new Date(si.created_at).getTime(),
      })),
      scenes: (sbScenes || []).map(s => ({
        id: s.id,
        title: s.title || '',
        synopsis: s.synopsis || '',
        actId: s.act_id || null,
        characterIds: s.character_ids || [],
        order: s.order || 0,
        status: s.status || 'draft',
        createdAt: s.created_at ? new Date(s.created_at).getTime() : 0,
        updatedAt: s.updated_at ? new Date(s.updated_at).getTime() : 0,
      })),
      acts: (sbActs || []).map(a => ({
        id: a.id,
        name: a.name || '',
        order: a.order || 0,
        description: a.description || '',
        color: a.color || '#ccee00',
        createdAt: a.created_at ? new Date(a.created_at).getTime() : 0,
        updatedAt: a.updated_at ? new Date(a.updated_at).getTime() : 0,
      })),
      dialogues: (sbDialogues || []).map(d => ({
        id: d.id,
        speaker: d.speaker || '',
        line: d.line || '',
        context: d.context || '',
        sceneId: d.scene_id || null,
        tags: d.tags || [],
        createdAt: d.created_at ? new Date(d.created_at).getTime() : 0,
        updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : 0,
      })),
      themes: (sbThemes || []).map(t => ({
        id: t.id,
        statement: t.statement || '',
        evidence: t.evidence || '',
        relevance: t.relevance || 'Central',
        createdAt: t.created_at ? new Date(t.created_at).getTime() : 0,
        updatedAt: t.updated_at ? new Date(t.updated_at).getTime() : 0,
      })),
      plot_points: (sbPlotPoints || []).map(pp => ({
        id: pp.id,
        title: pp.title || '',
        description: pp.description || '',
        actId: pp.act_id || null,
        tags: pp.tags || [],
        createdAt: pp.created_at ? new Date(pp.created_at).getTime() : 0,
        updatedAt: pp.updated_at ? new Date(pp.updated_at).getTime() : 0,
      })),
      world_elements: (sbWorldElements || []).map(we => ({
        id: we.id,
        name: we.name || '',
        type: we.type || 'setting',
        description: we.description || '',
        tags: we.tags || [],
        createdAt: we.created_at ? new Date(we.created_at).getTime() : 0,
        updatedAt: we.updated_at ? new Date(we.updated_at).getTime() : 0,
      })),
      needsAutoLayout: false,
    });
  }

  saveIdMap(map);
  return projects;
}

export async function syncProjectToSupabase(project) {
  if (!isConfigured()) return;
  const user = await getCurrentUser().catch(() => null);
  if (!user) return;

  const map = loadIdMap();
  if (!map.projects) map.projects = {};
  if (!map.characters) map.characters = {};
  if (!map.locations) map.locations = {};
  if (!map.objects) map.objects = {};
  if (!map.scenes) map.scenes = {};
  if (!map.acts) map.acts = {};
  if (!map.dialogues) map.dialogues = {};
  if (!map.themes) map.themes = {};
  if (!map.plot_points) map.plot_points = {};
  if (!map.world_elements) map.world_elements = {};

  try {
    // 1. Ensure project exists in Supabase
    let sbProjId = map.projects[project.id];
    if (!sbProjId) {
      // Check if project already exists by title
      const existing = await db.fetchProjects(user.id);
      const found = existing?.find(p => p.title === project.title);
      if (found) {
        sbProjId = found.id;
      } else {
        const created = await db.createProject(user.id, project.title, project.tagline, project.genre, project.logline);
        if (!created) return;
        sbProjId = created.id;
      }
      map.projects[project.id] = sbProjId;
      saveIdMap(map);
    }

    // Update project metadata (including visibility and tags)
    const projUpdates = {
      tagline: project.tagline || '',
      genre: project.genre || '',
      logline: project.logline || '',
    };
    if (project.visibility) projUpdates.visibility = project.visibility;
    if (project.tags) projUpdates.tags = project.tags;
    await db.updateProject(sbProjId, projUpdates);

    // 2. Sync characters
    for (const char of (project.characters || [])) {
      const existingSbId = map.characters[char.id] || (char.id?.startsWith('sb-') ? char.id : null);
      const record = {
        name: char.name,
        role: char.role || 'Protagonista',
        description: char.description || '',
        traits: char.traits || [],
        backstory: char.backstory || '',
        avatar: char.avatar || 'amber',
        notes: char.notes || '',
      };

      if (existingSbId) {
        record.id = existingSbId;
      }
      const saved = await db.saveCharacter(user.id, sbProjId, record);
      if (saved && !map.characters[char.id]) {
        map.characters[char.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 3. Sync locations
    for (const loc of (project.locations || [])) {
      const existingSbId = map.locations[loc.id] || (loc.id?.startsWith('sb-') ? loc.id : null);
      const record = {
        name: loc.name,
        type: loc.type || 'INT.',
        description: loc.description || '',
        timeOfDay: loc.timeOfDay || 'NOITE',
        mood: loc.mood || '',
      };
      if (existingSbId) {
        record.id = existingSbId;
      }
      const saved = await db.saveLocation(user.id, sbProjId, record);
      if (saved && !map.locations[loc.id]) {
        map.locations[loc.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 4. Sync objects
    for (const obj of (project.objects || [])) {
      const existingSbId = map.objects[obj.id] || (obj.id?.startsWith('sb-') ? obj.id : null);
      const record = {
        name: obj.name,
        significance: obj.significance || '',
        description: obj.description || '',
      };
      if (existingSbId) {
        record.id = existingSbId;
      }
      const saved = await db.saveObject(user.id, sbProjId, record);
      if (saved && !map.objects[obj.id]) {
        map.objects[obj.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5. Sync screenplay (full replace)
    await db.saveScreenplayElements(user.id, sbProjId, project.screenplay || []);

    // 5b. Sync scenes
    for (const scene of (project.entities?.scenes || [])) {
      const existingSbId = map.scenes[scene.id] || (scene.id?.startsWith('sb-') ? scene.id : null);
      const record = existingSbId ? { ...scene, id: existingSbId } : scene;
      const saved = await db.saveScene(user.id, sbProjId, {
        ...record,
        actId: record.actId,
        characterIds: record.characterIds || [],
      });
      if (saved?.id && saved.id !== scene.id) {
        map.scenes[scene.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5c. Sync acts
    for (const act of (project.entities?.acts || [])) {
      const existingSbId = map.acts[act.id] || (act.id?.startsWith('sb-') ? act.id : null);
      const record = existingSbId ? { ...act, id: existingSbId } : act;
      const saved = await db.saveAct(user.id, sbProjId, record);
      if (saved?.id && saved.id !== act.id) {
        map.acts[act.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5d. Sync dialogues
    for (const d of (project.entities?.dialogues || [])) {
      const existingSbId = map.dialogues[d.id] || (d.id?.startsWith('sb-') ? d.id : null);
      const record = existingSbId ? { ...d, id: existingSbId } : d;
      // Map local sceneId to Supabase UUID (scenes are synced before dialogues)
      const mappedSceneId = (d.sceneId && map.scenes[d.sceneId]) ? map.scenes[d.sceneId] : null;
      const saved = await db.saveDialogue(user.id, sbProjId, {
        ...record,
        sceneId: mappedSceneId || (isUUID(d.sceneId) ? d.sceneId : null),
      });
      if (saved?.id && saved.id !== d.id) {
        map.dialogues[d.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5e. Sync themes
    for (const t of (project.entities?.themes || [])) {
      const existingSbId = map.themes[t.id] || (t.id?.startsWith('sb-') ? t.id : null);
      const record = existingSbId ? { ...t, id: existingSbId } : t;
      const saved = await db.saveTheme(user.id, sbProjId, record);
      if (saved?.id && saved.id !== t.id) {
        map.themes[t.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5f. Sync plot_points
    for (const pp of (project.entities?.plot_points || [])) {
      const existingSbId = map.plot_points[pp.id] || (pp.id?.startsWith('sb-') ? pp.id : null);
      const record = existingSbId ? { ...pp, id: existingSbId } : pp;
      const saved = await db.savePlotPoint(user.id, sbProjId, {
        ...record,
        actId: record.actId,
      });
      if (saved?.id && saved.id !== pp.id) {
        map.plot_points[pp.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 5g. Sync world_elements
    for (const we of (project.entities?.world_elements || [])) {
      const existingSbId = map.world_elements[we.id] || (we.id?.startsWith('sb-') ? we.id : null);
      const record = existingSbId ? { ...we, id: existingSbId } : we;
      const saved = await db.saveWorldElement(user.id, sbProjId, record);
      if (saved?.id && saved.id !== we.id) {
        map.world_elements[we.id] = saved.id;
        saveIdMap(map);
      }
    }

    // 6. Sync mind map nodes + links (full replace)
    const validNodeTypes = ['act', 'scene', 'character', 'location', 'object'];
    let savedNodes = [];
    if (project.mindMapNodes?.length) {
      // Enrich clean nodes with entity data before sync
      const enrichedNodes = project.mindMapNodes.map(n => {
        if (n.entityId) {
          const entities = project.entities || {};
          // Find entity data to fill label/type/details
          for (const [type, list] of Object.entries(entities)) {
            if (!Array.isArray(list)) continue;
            const entity = list.find(e => e.id === n.entityId);
            if (entity) {
              const shortType = type === 'characters' ? 'character' : type === 'locations' ? 'location' : type === 'objects' ? 'object' : type === 'scenes' ? 'scene' : type === 'acts' ? 'act' : null;
              if (!shortType || !validNodeTypes.includes(shortType)) return null;
              return {
                ...n,
                label: entity.name || entity.title || entity.statement || '?',
                type: shortType,
                details: entity.description || entity.synopsis || entity.evidence || '',
              };
            }
          }
        }
        // Fallback for legacy nodes without entityId or not found
        const fallbackType = n.type && validNodeTypes.includes(n.type) ? n.type : 'scene';
        return { ...n, label: n.label || '?', type: fallbackType, details: n.details || '' };
      }).filter(Boolean);
      savedNodes = await db.saveMindMapNodes(user.id, sbProjId, enrichedNodes) || [];
      // Map the generated database UUID back to local nodes' saved_id
      project.mindMapNodes.forEach((node, idx) => {
        if (savedNodes[idx]) {
          node.saved_id = savedNodes[idx].id;
        }
      });
    }
    if (project.mindMapLinks?.length && project.mindMapNodes?.length) {
      await db.saveMindMapLinks(user.id, sbProjId, project.mindMapLinks, project.mindMapNodes);
    }

    // 7. Sync recordings (only new ones)
    for (const rec of (project.recordings || [])) {
      if (rec._sbSynced) continue;
      await db.saveRecording(user.id, sbProjId, rec);
      rec._sbSynced = true;
    }

    // 8. Sync media uploads (only new ones)
    for (const med of (project.mediaUploads || [])) {
      if (med._sbSynced) continue;
      await db.saveMediaUpload(user.id, sbProjId, med);
      med._sbSynced = true;
    }

    // 9. Sync brainstorm documents (only new/updated ones)
    if (!project[BSB_SYNCED_FLAG]) {
      project[BSB_SYNCED_FLAG] = true;
    }
    for (const doc of (project.brainstormDocuments || [])) {
      if (doc._sbSynced) continue;
      await db.upsertBrainstormDocument(user.id, sbProjId, doc);
      doc._sbSynced = true;
    }

    // 10. Sync ideas
    if (Array.isArray(project.ideas)) {
      for (const idea of project.ideas) {
        if (idea._sbSynced) continue;
        try {
          const saved = await db.saveIdea(user.id, sbProjId, idea);
          if (saved) idea._sbSynced = true;
        } catch (err) {
          console.warn('[Supabase sync] Failed to sync idea:', err);
        }
      }
    }

    // 11. Sync project files (storage records only; actual upload handled separately)
    if (Array.isArray(project.projectFiles)) {
      for (const pf of project.projectFiles) {
        if (pf._sbSynced) continue;
        try {
          const saved = await db.saveProjectFile(user.id, sbProjId, pf);
          if (saved) {
            pf._sbSynced = true;
            pf.id = saved.id;
          }
        } catch (err) {
          console.warn('[Supabase sync] Failed to sync project file:', err);
        }
      }
    }

    // 12. Sync screenplay imports
    if (Array.isArray(project.screenplayImports)) {
      for (const si of project.screenplayImports) {
        if (si._sbSynced) continue;
        try {
          const saved = await db.saveScreenplayImport(user.id, sbProjId, si);
          if (saved) si._sbSynced = true;
        } catch (err) {
          console.warn('[Supabase sync] Failed to sync screenplay import:', err);
        }
      }
    }

  } catch (err) {
    console.error('[Supabase sync] Error:', err);
  }
}

export async function syncAllProjectsToSupabase(projects) {
  if (!isConfigured()) return;
  const user = await getCurrentUser().catch(() => null);
  if (!user) return;

  for (const proj of projects) {
    await syncProjectToSupabase(proj);
  }
}

export async function loadPublicProjects() {
  if (!isConfigured()) return [];
  try {
    const sbProjects = await db.fetchPublicProjects(50);
    if (!sbProjects || sbProjects.length === 0) return [];

    const projects = [];
    for (const sbProj of sbProjects) {
      const localId = `pub-${sbProj.id.slice(0, 8)}`;
      projects.push({
        id: localId,
        sbId: sbProj.id,
        title: sbProj.title,
        tagline: sbProj.tagline || '',
        genre: sbProj.genre || '',
        logline: sbProj.logline || '',
        visibility: sbProj.visibility,
        is_published: sbProj.is_published,
        published_at: sbProj.published_at,
        tags: sbProj.tags || [],
        user_id: sbProj.user_id,
        isPublicView: true,
      });
    }
    return projects;
  } catch (err) {
    console.error('[sync] Failed to load public projects:', err);
    return [];
  }
}

export { isConfigured };
