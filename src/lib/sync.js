import { supabase, getCurrentUser } from './supabase';
import * as db from './db';

const ID_MAP_KEY = 'cineweave_sb_ids';

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

export async function loadProjectsFromSupabase() {
  if (!isConfigured()) return null;
  const user = await getCurrentUser().catch(() => null);
  if (!user) return null;

  const sbProjects = await db.fetchProjects(user.id);
  if (!sbProjects || sbProjects.length === 0) return [];

  const map = loadIdMap();
  if (!map.projects) map.projects = {};
  if (!map.characters) map.characters = {};
  if (!map.locations) map.locations = {};
  if (!map.objects) map.objects = {};

  const projects = [];

  for (const sbProj of sbProjects) {
    // Find or create local ID mapping
    let localId = Object.entries(map.projects).find(([, v]) => v === sbProj.id)?.[0];
    if (!localId) {
      localId = `sb-${sbProj.id.slice(0, 8)}`;
      map.projects[localId] = sbProj.id;
    }

    const [sbChars, sbLocs, sbObjs, sbScreenplay, sbNodes, sbLinks, sbRecs, sbMedia] = await Promise.all([
      db.fetchCharacters(sbProj.id),
      db.fetchLocations(sbProj.id),
      db.fetchObjects(sbProj.id),
      db.fetchScreenplay(sbProj.id),
      db.fetchMindMapNodes(sbProj.id),
      db.fetchMindMapLinks(sbProj.id),
      db.fetchRecordings(sbProj.id),
      db.fetchMediaUploads(sbProj.id),
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
      };
    });

    const objects = (sbObjs || []).map(o => {
      map.objects[o.id] = o.id;
      return {
        id: o.id,
        name: o.name,
        significance: o.significance || '',
        description: o.description || '',
      };
    });

    const screenplay = (sbScreenplay || []).map((el, i) => ({
      id: `sc-${sbProj.id.slice(0, 8)}-${i}`,
      type: el.element_type,
      text: el.text,
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

    projects.push({
      id: localId,
      title: sbProj.title,
      tagline: sbProj.tagline || '',
      genre: sbProj.genre || '',
      logline: sbProj.logline || '',
      characters,
      locations,
      objects,
      screenplay,
      mindMapNodes,
      mindMapLinks,
      recordings,
      mediaUploads,
      ideas: [],
      needsAutoLayout: false,
      // brainstormData intentionally omitted — not stored in Supabase, preserved from local
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

    // Update project metadata
    await db.updateProject(sbProjId, {
      tagline: project.tagline || '',
      genre: project.genre || '',
      logline: project.logline || '',
    });

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

    // 6. Sync mind map nodes + links (full replace)
    let savedNodes = [];
    if (project.mindMapNodes?.length) {
      savedNodes = await db.saveMindMapNodes(user.id, sbProjId, project.mindMapNodes) || [];
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

export { isConfigured };
