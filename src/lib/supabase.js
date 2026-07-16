import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.\n' +
    'Falling back to localStorage-only mode.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: username } }
  });
  if (error) throw error;
  if (!data.session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    return signInData;
  }
  // Profile is auto-created by the DB trigger handle_new_user
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ── Profile ──

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Tags ──

export async function fetchProjectTags(projectId) {
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function addProjectTag(projectId, tagId, tagType = 'custom', userId = null) {
  const { data, error } = await supabase
    .from('project_tags')
    .insert({ project_id: projectId, tag_id: tagId, tag_type: tagType, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeProjectTag(projectId, tagId, tagType = 'custom') {
  const { error } = await supabase
    .from('project_tags')
    .delete()
    .eq('project_id', projectId)
    .eq('tag_id', tagId)
    .eq('tag_type', tagType);
  if (error) throw error;
}

export async function fetchUserTags(userId) {
  const { data, error } = await supabase
    .from('user_tags')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function saveUserTag(userId, tagId, color = '#ccee00') {
  const { data, error } = await supabase
    .from('user_tags')
    .upsert({ user_id: userId, tag_id: tagId, tag_color: color }, { onConflict: 'user_id,tag_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserTag(userId, tagId) {
  const { error } = await supabase
    .from('user_tags')
    .delete()
    .eq('user_id', userId)
    .eq('tag_id', tagId);
  if (error) throw error;
}

// ── Avatar Upload ──

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  return publicUrl;
}

export async function deleteAvatar(userId) {
  const { data: list } = await supabase.storage
    .from('avatars')
    .list(userId);
  if (list?.length > 0) {
    const files = list.map(f => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(files);
  }
}

export default supabase;
