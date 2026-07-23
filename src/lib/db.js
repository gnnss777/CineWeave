import { supabase } from './supabase';

function isConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co';
}

/** Check if string is a valid UUID (Supabase uses uuid PK columns) */
function isUUID(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
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

// ── BRAINSTORM DOCUMENTS ────────────────────────────────────

export async function fetchBrainstormDocuments(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('brainstorm_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertBrainstormDocument(userId, projectId, document) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    name: document.name,
    type: document.type,
    size: document.size,
    content: document.content,
    metadata: document.metadata,
    extracted_data: document.extractedData,
    status: document.status || 'pending',
    error_message: document.errorMessage,
  };

  if (document.id) {
    const { data, error } = await supabase
      .from('brainstorm_documents')
      .update(record)
      .eq('id', document.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('brainstorm_documents')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteBrainstormDocument(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('brainstorm_documents').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── PROJECT FILES ──────────────────────────────────────────

export async function fetchProjectFiles(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveProjectFile(userId, projectId, fileRecord) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    name: fileRecord.name,
    original_name: fileRecord.originalName || fileRecord.name,
    mime_type: fileRecord.mimeType || 'application/octet-stream',
    file_size: fileRecord.fileSize || 0,
    storage_path: fileRecord.storagePath || '',
    url: fileRecord.url || '',
    source: fileRecord.source || 'brainstorm',
    metadata: fileRecord.metadata || {},
  };

  if (fileRecord.id) {
    const { data, error } = await supabase
      .from('project_files')
      .update(record)
      .eq('id', fileRecord.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('project_files')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteProjectFile(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('project_files').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── IDEAS ──────────────────────────────────────────────────

export async function fetchIdeas(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveIdea(userId, projectId, idea) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    text: idea.text || '',
    category: idea.category || 'general',
    tags: idea.tags || [],
  };

  if (idea.id) {
    const { data, error } = await supabase
      .from('ideas')
      .update(record)
      .eq('id', idea.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('ideas')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteIdea(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── SCREENPLAY IMPORTS ────────────────────────────────────

export async function fetchScreenplayImports(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('screenplay_imports')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveScreenplayImport(userId, projectId, importRecord) {
  if (!isConfigured()) return null;
  const record = {
    user_id: userId,
    project_id: projectId,
    file_id: importRecord.fileId || null,
    original_filename: importRecord.originalFilename || '',
    import_type: importRecord.importType || 'fountain',
    element_count: importRecord.elementCount || 0,
    metadata: importRecord.metadata || {},
  };

  const { data, error } = await supabase
    .from('screenplay_imports')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScreenplayImport(id) {
  if (!isConfigured()) return null;
  const { error } = await supabase.from('screenplay_imports').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ── PUBLIC PROJECTS ────────────────────────────────────────

export async function fetchPublicProjects(limit = 50) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchProjectsByTags(tagIds, limit = 50) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('project_tags')
    .select('project_id')
    .in('tag_id', tagIds)
    .limit(limit);
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const projectIds = [...new Set(data.map(d => d.project_id))];
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds)
    .order('updated_at', { ascending: false });
  if (pError) throw pError;
  return projects;
}

export async function updateProjectVisibility(projectId, visibility) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('projects')
    .update({ visibility })
    .eq('id', projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── TAGS ───────────────────────────────────────────────────

export async function fetchProjectTags(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function addProjectTag(projectId, tagId, tagType = 'custom', userId = null) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('project_tags')
    .insert({ project_id: projectId, tag_id: tagId, tag_type: tagType, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeProjectTag(projectId, tagId, tagType = 'custom') {
  if (!isConfigured()) return null;
  const { error } = await supabase
    .from('project_tags')
    .delete()
    .eq('project_id', projectId)
    .eq('tag_id', tagId)
    .eq('tag_type', tagType);
  if (error) throw error;
  return true;
}

export async function fetchUserTags(userId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_tags')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function saveUserTag(userId, tagId, color = '#ccee00') {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_tags')
    .upsert({ user_id: userId, tag_id: tagId, tag_color: color }, { onConflict: 'user_id,tag_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserTag(userId, tagId) {
  if (!isConfigured()) return null;
  const { error } = await supabase
    .from('user_tags')
    .delete()
    .eq('user_id', userId)
    .eq('tag_id', tagId);
  if (error) throw error;
  return true;
}

// ── INVITATIONS ────────────────────────────────────────────

export async function findUserByEmail(email) {
  if (!isConfigured()) return null;
  try {
    const { data, error } = await supabase.rpc('find_user_by_email', { email_text: email });
    if (!error && data) return Array.isArray(data) ? data[0] : data;
  } catch {}
  // Fallback: profiles by username
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', email.split('@')[0])
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function fetchProjectInvitations(projectId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_project_invitations')
    .select('*, profiles!user_id(id, username, display_name, avatar_url)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function inviteUserToProject(projectId, userId, role = 'viewer', invitedBy) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_project_invitations')
    .insert({ project_id: projectId, user_id: userId, role, invited_by: invitedBy, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function acceptInvitation(invitationId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_project_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function declineInvitation(invitationId) {
  if (!isConfigured()) return null;
  const { data, error } = await supabase
    .from('user_project_invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── SCENES ──────────────────────────────────────────────────
export async function fetchScenes(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true });
  if (error) { console.error('[db] fetchScenes error:', error); return []; }
  return data || [];
}

export async function saveScene(userId, projectId, scene) {
  if (!isConfigured()) return scene;
  if (scene.id && isUUID(scene.id)) {
    const { data, error } = await supabase
      .from('scenes')
      .update({
        title: scene.title, synopsis: scene.synopsis,
        act_id: scene.actId, character_ids: scene.characterIds || [],
        order: scene.order || 0, status: scene.status || 'draft',
      })
      .eq('id', scene.id)
      .select()
      .single();
    if (error) { console.error('[db] saveScene error:', error); return scene; }
    return data;
  }
  const { data, error } = await supabase
    .from('scenes')
    .insert({
      project_id: projectId, user_id: userId,
      title: scene.title || '', synopsis: scene.synopsis || '',
      act_id: scene.actId || null, character_ids: scene.characterIds || [],
      order: scene.order || 0, status: scene.status || 'draft',
    })
    .select()
    .single();
  if (error) { console.error('[db] saveScene error:', error); return scene; }
  return data;
}

// ── ACTS ────────────────────────────────────────────────────
export async function fetchActs(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('acts')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true });
  if (error) { console.error('[db] fetchActs error:', error); return []; }
  return data || [];
}

export async function saveAct(userId, projectId, act) {
  if (!isConfigured()) return act;
  if (act.id && isUUID(act.id)) {
    const { data, error } = await supabase
      .from('acts')
      .update({
        name: act.name, order: act.order || 0,
        description: act.description || '', color: act.color || '#ccee00',
      })
      .eq('id', act.id)
      .select()
      .single();
    if (error) { console.error('[db] saveAct error:', error); return act; }
    return data;
  }
  const { data, error } = await supabase
    .from('acts')
    .insert({
      project_id: projectId, user_id: userId,
      name: act.name || '', order: act.order || 0,
      description: act.description || '', color: act.color || '#ccee00',
    })
    .select()
    .single();
  if (error) { console.error('[db] saveAct error:', error); return act; }
  return data;
}

// ── DIALOGUES ──────────────────────────────────────────────
export async function fetchDialogues(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('dialogues')
    .select('*')
    .eq('project_id', projectId);
  if (error) { console.error('[db] fetchDialogues error:', error); return []; }
  return data || [];
}

export async function saveDialogue(userId, projectId, dialogue) {
  if (!isConfigured()) return dialogue;
  // UPDATE if ID is a Supabase UUID, INSERT otherwise
  if (dialogue.id && isUUID(dialogue.id)) {
    const { data, error } = await supabase
      .from('dialogues')
      .update({
        speaker: dialogue.speaker, line: dialogue.line,
        context: dialogue.context || '', scene_id: dialogue.sceneId || null,
        tags: dialogue.tags || [],
      })
      .eq('id', dialogue.id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) { console.error('[db] saveDialogue error:', error); return dialogue; }
    return data;
  }
  // INSERT — omits local non-UUID id, lets Supabase generate UUID PK
  const { data, error } = await supabase
    .from('dialogues')
    .insert({
      project_id: projectId, user_id: userId,
      speaker: dialogue.speaker || '', line: dialogue.line || '',
      context: dialogue.context || '', scene_id: dialogue.sceneId || null,
      tags: dialogue.tags || [],
    })
    .select()
    .single();
  if (error) { console.error('[db] saveDialogue error:', error); return dialogue; }
  return data;
}

// ── THEMES ─────────────────────────────────────────────────
export async function fetchThemes(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('project_id', projectId);
  if (error) { console.error('[db] fetchThemes error:', error); return []; }
  return data || [];
}

export async function saveTheme(userId, projectId, theme) {
  if (!isConfigured()) return theme;
  if (theme.id && isUUID(theme.id)) {
    const { data, error } = await supabase
      .from('themes')
      .update({
        statement: theme.statement, evidence: theme.evidence || '',
        relevance: theme.relevance || 'Central',
      })
      .eq('id', theme.id)
      .select()
      .single();
    if (error) { console.error('[db] saveTheme error:', error); return theme; }
    return data;
  }
  const { data, error } = await supabase
    .from('themes')
    .insert({
      project_id: projectId, user_id: userId,
      statement: theme.statement || '', evidence: theme.evidence || '',
      relevance: theme.relevance || 'Central',
    })
    .select()
    .single();
  if (error) { console.error('[db] saveTheme error:', error); return theme; }
  return data;
}

// ── PLOT POINTS ────────────────────────────────────────────
export async function fetchPlotPoints(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('plot_points')
    .select('*')
    .eq('project_id', projectId);
  if (error) { console.error('[db] fetchPlotPoints error:', error); return []; }
  return data || [];
}

export async function savePlotPoint(userId, projectId, pp) {
  if (!isConfigured()) return pp;
  if (pp.id && isUUID(pp.id)) {
    const { data, error } = await supabase
      .from('plot_points')
      .update({
        title: pp.title, description: pp.description || '',
        act_id: pp.actId || null, tags: pp.tags || [],
      })
      .eq('id', pp.id)
      .select()
      .single();
    if (error) { console.error('[db] savePlotPoint error:', error); return pp; }
    return data;
  }
  const { data, error } = await supabase
    .from('plot_points')
    .insert({
      project_id: projectId, user_id: userId,
      title: pp.title || '', description: pp.description || '',
      act_id: pp.actId || null, tags: pp.tags || [],
    })
    .select()
    .single();
  if (error) { console.error('[db] savePlotPoint error:', error); return pp; }
  return data;
}

// ── WORLD ELEMENTS ──────────────────────────────────────────
export async function fetchWorldElements(projectId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from('world_elements')
    .select('*')
    .eq('project_id', projectId);
  if (error) { console.error('[db] fetchWorldElements error:', error); return []; }
  return data || [];
}

export async function saveWorldElement(userId, projectId, we) {
  if (!isConfigured()) return we;
  if (we.id && isUUID(we.id)) {
    const { data, error } = await supabase
      .from('world_elements')
      .update({
        name: we.name, type: we.type || 'setting',
        description: we.description || '', tags: we.tags || [],
      })
      .eq('id', we.id)
      .select()
      .single();
    if (error) { console.error('[db] saveWorldElement error:', error); return we; }
    return data;
  }
  const { data, error } = await supabase
    .from('world_elements')
    .insert({
      project_id: projectId, user_id: userId,
      name: we.name || '', type: we.type || 'setting',
      description: we.description || '', tags: we.tags || [],
    })
    .select()
    .single();
  if (error) { console.error('[db] saveWorldElement error:', error); return we; }
  return data;
}
