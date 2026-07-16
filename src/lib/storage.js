import { supabase } from './supabase';

const BUCKET = 'project-files';

function isConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'https://placeholder.supabase.co';
}

export async function uploadProjectFile(projectId, userId, file, source = 'brainstorm') {
  if (!isConfigured()) return null;

  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${projectId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return {
    storagePath: fileName,
    url: publicUrl,
    name: fileName,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };
}

export async function deleteProjectFile(storagePath) {
  if (!isConfigured()) return;
  if (!storagePath) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw error;
}

export function getFileUrl(storagePath) {
  if (!isConfigured() || !storagePath) return '';
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);
  return publicUrl;
}

export async function uploadProjectFilesBatch(projectId, userId, files, source = 'brainstorm') {
  const results = [];
  for (const file of files) {
    try {
      const result = await uploadProjectFile(projectId, userId, file, source);
      results.push({ file, result, error: null });
    } catch (error) {
      results.push({ file, result: null, error });
    }
  }
  return results;
}
