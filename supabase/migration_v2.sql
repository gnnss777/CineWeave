-- CineWeave - v2: File storage, ideas persistence, screenplay imports

-- Extension pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- ============================================================
-- IDEAS (persistir ideias soltas do brainstorm)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ideas"
  ON public.ideas FOR SELECT
  USING (public.user_can_edit_project(project_id));

CREATE POLICY "Users can insert own ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "Users can update own ideas"
  ON public.ideas FOR UPDATE
  USING (public.user_can_edit_project(project_id));

CREATE POLICY "Users can delete own ideas"
  ON public.ideas FOR DELETE
  USING (public.user_can_edit_project(project_id));

-- ============================================================
-- PROJECT FILES (upload real de arquivos para Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size BIGINT DEFAULT 0,
  storage_path TEXT NOT NULL DEFAULT '',
  url TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'brainstorm' CHECK (source IN ('brainstorm', 'screenplay', 'attachment')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own project files"
  ON public.project_files FOR SELECT
  USING (public.user_can_edit_project(project_id));

CREATE POLICY "Users can insert own project files"
  ON public.project_files FOR INSERT
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "Users can update own project files"
  ON public.project_files FOR UPDATE
  USING (public.user_can_edit_project(project_id));

CREATE POLICY "Users can delete own project files"
  ON public.project_files FOR DELETE
  USING (public.user_can_edit_project(project_id));

-- ============================================================
-- SCREENPLAY IMPORTS (rastrear arquivo fonte do roteiro)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.screenplay_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL DEFAULT '',
  import_type TEXT NOT NULL DEFAULT 'fountain' CHECK (import_type IN ('fountain', 'pdf', 'txt', 'docx')),
  element_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.screenplay_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own screenplay imports"
  ON public.screenplay_imports FOR SELECT
  USING (public.user_can_edit_project(project_id));

CREATE POLICY "Users can insert own screenplay imports"
  ON public.screenplay_imports FOR INSERT
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "Users can delete own screenplay imports"
  ON public.screenplay_imports FOR DELETE
  USING (public.user_can_edit_project(project_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ideas_project_id ON public.ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_source ON public.project_files(project_id, source);
CREATE INDEX IF NOT EXISTS idx_screenplay_imports_project_id ON public.screenplay_imports(project_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS set_ideas_updated_at ON public.ideas;
CREATE TRIGGER set_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_project_files_updated_at ON public.project_files;
CREATE TRIGGER set_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STORAGE: Project files bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-files', 'project-files', true, 52428800, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown','text/csv','image/jpeg','image/png','image/webp','audio/webm','audio/mp3','audio/wav'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Project files public read" ON storage.objects;
CREATE POLICY "Project files public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "Project files authenticated upload" ON storage.objects;
CREATE POLICY "Project files authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Project files authenticated update" ON storage.objects;
CREATE POLICY "Project files authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-files'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Project files authenticated delete" ON storage.objects;
CREATE POLICY "Project files authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- UPDATE PROJECT TIMESTAMPS ON CONTENT CHANGE
-- ============================================================
CREATE TRIGGER trigger_touch_project_on_ideas
  AFTER INSERT OR UPDATE OR DELETE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

CREATE TRIGGER trigger_touch_project_on_project_files
  AFTER INSERT OR UPDATE OR DELETE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

-- ============================================================
-- AUDIT LOG: add new tables
-- ============================================================
CREATE TRIGGER audit_ideas_changes AFTER INSERT OR UPDATE OR DELETE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

CREATE TRIGGER audit_project_files_changes AFTER INSERT OR UPDATE OR DELETE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

-- Update the DO block to include new tables in editor policies
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ideas','project_files','screenplay_imports']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can read own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can read own %s" ON public.%I FOR SELECT USING (public.user_can_edit_project(project_id))', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %s" ON public.%I FOR INSERT WITH CHECK (public.user_can_edit_project(project_id))', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %s" ON public.%I FOR UPDATE USING (public.user_can_edit_project(project_id))', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %s" ON public.%I FOR DELETE USING (public.user_can_edit_project(project_id))', tbl, tbl);
  END LOOP;
END $$;
