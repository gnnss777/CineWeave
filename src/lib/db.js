import { supabase } from './supabase';

function isConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co';
}

// ── PROJECTS ──────────────────────────────────────────────

export async function fetchProjects(userId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProject(userId, title, tagline = '', genre = '', logline = '') {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, title, tagline, genre, logline })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id, updates) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ── CHARACTERS ────────────────────────────────────────────

export async function fetchCharacters(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function saveCharacter(userId, projectId, character) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    name: character.name,
    role: character.role || 'Protagonista',
    description: character.description || '',
    traits: character.traits || [],
    backstory: character.backstory || '',
    avatar: character.avatar || 'amber',
    notes: character.notes || '',
  };

  if (character.id) {
    const { data, error } = await supabase
      .from('characters')
      .update(record)
      .eq('id', character.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('characters')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteCharacter(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('characters').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── LOCATIONS ─────────────────────────────────────────────

export async function fetchLocations(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function saveLocation(userId, projectId, location) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    name: location.name,
    type: location.type || 'INT.',
    description: location.description || '',
    time_of_day: location.timeOfDay || 'NOITE',
    mood: location.mood || '',
  };

  if (location.id) {
    const { data, error } = await supabase
      .from('locations')
      .update(record)
      .eq('id', location.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('locations')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteLocation(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── OBJECTS ───────────────────────────────────────────────

export async function fetchObjects(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function saveObject(userId, projectId, obj) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    name: obj.name,
    significance: obj.significance || '',
    description: obj.description || '',
  };

  if (obj.id) {
    const { data, error } = await supabase
      .from('objects')
      .update(record)
      .eq('id', obj.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('objects')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteObject(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('objects').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── SCREENPLAY ────────────────────────────────────────────

export async function fetchScreenplay(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('screenplay_elements')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function saveScreenplayElements(userId, projectId, elements) {
  if (!isConfigured()) return null;
  // Delete existing and re-insert
  await supabase.from('screenplay_elements').delete().eq('project_id', projectId);

  if (elements.length === 0) return [];

  const inserts = elements.map((el, i) => ({
    user_id: userId,
    project_id: projectId,
    sort_order: i,
    element_type: el.type,
    text: el.text,
  }));

  const { data, error } = await supabase
    .from('screenplay_elements')
    .insert(inserts)
    .select();
  if (error) throw error;
  return data;
}

// ── MIND MAP ──────────────────────────────────────────────

export async function fetchMindMapNodes(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('mind_map_nodes')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function fetchMindMapLinks(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('mind_map_links')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function saveMindMapNodes(userId, projectId, nodes) {
  if (!isConfigured()) return null;
  await supabase.from('mind_map_nodes').delete().eq('project_id', projectId);

  if (nodes.length === 0) return [];

  const inserts = nodes.map(n => ({
    user_id: userId,
    project_id: projectId,
    label: n.label,
    node_type: n.type,
    x: n.x,
    y: n.y,
    details: n.details || '',
  }));

  const { data, error } = await supabase
    .from('mind_map_nodes')
    .insert(inserts)
    .select();
  if (error) throw error;
  return data;
}

export async function saveMindMapLinks(userId, projectId, links, nodes) {
  if (!isConfigured()) return null;
  await supabase.from('mind_map_links').delete().eq('project_id', projectId);

  if (links.length === 0) return [];

  const inserts = links.map(l => {
    const srcNode = nodes.find(n => n.id === l.source);
    const tgtNode = nodes.find(n => n.id === l.target);
    return {
      user_id: userId,
      project_id: projectId,
      source_node_id: srcNode?.saved_id || l.source,
      target_node_id: tgtNode?.saved_id || l.target,
    };
  }).filter(l => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(l.source_node_id) && uuidRegex.test(l.target_node_id);
  });

  const { data, error } = await supabase
    .from('mind_map_links')
    .insert(inserts)
    .select();
  if (error) throw error;
  return data;
}

// ── RECORDINGS ────────────────────────────────────────────

export async function fetchRecordings(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveRecording(userId, projectId, recording) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('recordings')
    .insert({
      user_id: userId,
      project_id: projectId,
      title: recording.title,
      duration: recording.duration,
      transcript: recording.transcript,
      processed: recording.processed || false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── MEDIA UPLOADS ─────────────────────────────────────────

export async function fetchMediaUploads(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveMediaUpload(userId, projectId, media) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('media_uploads')
    .insert({
      user_id: userId,
      project_id: projectId,
      name: media.name,
      media_type: media.type || 'image',
      url: media.url || '',
      processed: media.processed || false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
