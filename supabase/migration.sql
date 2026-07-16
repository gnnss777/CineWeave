-- CineWeave - Supabase Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT 'ccee00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  logline TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- CHARACTERS
-- ============================================================
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Protagonista',
  description TEXT DEFAULT '',
  traits JSONB DEFAULT '[]',
  backstory TEXT DEFAULT '',
  avatar TEXT DEFAULT 'amber',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own characters"
  ON public.characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON public.characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON public.characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON public.characters FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'INT.',
  description TEXT DEFAULT '',
  time_of_day TEXT DEFAULT 'NOITE',
  mood TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own locations"
  ON public.locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON public.locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON public.locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON public.locations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- OBJECTS
-- ============================================================
CREATE TABLE public.objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  significance TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own objects"
  ON public.objects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own objects"
  ON public.objects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objects"
  ON public.objects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own objects"
  ON public.objects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SCREENPLAY ELEMENTS
-- ============================================================
CREATE TABLE public.screenplay_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  element_type TEXT NOT NULL CHECK (element_type IN ('scene-heading','action','character','parenthetical','dialogue','transition')),
  text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.screenplay_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own screenplay"
  ON public.screenplay_elements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screenplay"
  ON public.screenplay_elements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screenplay"
  ON public.screenplay_elements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own screenplay"
  ON public.screenplay_elements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MIND MAP NODES
-- ============================================================
CREATE TABLE public.mind_map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('act','scene','character','location','object')),
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mind map nodes"
  ON public.mind_map_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mind map nodes"
  ON public.mind_map_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mind map nodes"
  ON public.mind_map_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mind map nodes"
  ON public.mind_map_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MIND MAP LINKS
-- ============================================================
CREATE TABLE public.mind_map_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mind_map_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mind map links"
  ON public.mind_map_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mind map links"
  ON public.mind_map_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mind map links"
  ON public.mind_map_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RECORDINGS
-- ============================================================
CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  transcript TEXT DEFAULT '',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recordings"
  ON public.recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
  ON public.recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
  ON public.recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON public.recordings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- MEDIA UPLOADS
-- ============================================================
CREATE TABLE public.media_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','note','audio','pdf')),
  storage_path TEXT DEFAULT '',
  url TEXT DEFAULT '',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own media uploads"
  ON public.media_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media uploads"
  ON public.media_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media uploads"
  ON public.media_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media uploads"
  ON public.media_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- BRAINSTORM DOCUMENTS
-- ============================================================
CREATE TABLE public.brainstorm_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf','docx','txt','md','csv')),
  size BIGINT,
  content TEXT,
  metadata JSONB,
  extracted_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','parsed','processing','done','error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brainstorm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own brainstorm documents"
  ON public.brainstorm_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brainstorm documents"
  ON public.brainstorm_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brainstorm documents"
  ON public.brainstorm_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brainstorm documents"
  ON public.brainstorm_documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, avatar_color, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', 'ccee00'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PROJECT VISIBILITY + TAGS COLUMNS
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared', 'unlisted')) NOT NULL,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_url_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS allow_collaboration BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON public.projects(is_published);

-- Sync visibility <-> is_published
CREATE OR REPLACE FUNCTION public.update_project_publish_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visibility = 'public' AND (OLD.visibility IS DISTINCT FROM 'public' OR OLD.is_published IS DISTINCT FROM TRUE) THEN
    NEW.is_published = TRUE;
    NEW.published_at = COALESCE(OLD.published_at, NOW());
  ELSIF NEW.visibility != 'public' AND (OLD.visibility = 'public' OR OLD.is_published IS DISTINCT FROM FALSE) THEN
    NEW.is_published = FALSE;
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_publish_status ON public.projects;
CREATE TRIGGER trigger_update_project_publish_status
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_project_publish_status();

-- Expanded RLS: public projects readable by anyone
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM public.user_project_invitations upi
      WHERE upi.project_id = projects.id AND upi.user_id = auth.uid() AND upi.status = 'accepted'
    )
  );

-- ============================================================
-- USER-PROJECT INVITATIONS (collaboration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_project_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer', 'collaborator')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
  UNIQUE(user_id, project_id)
);

ALTER TABLE public.user_project_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read invitations user is part of"
  ON public.user_project_invitations FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = invited_by
    OR auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "Project owners can invite"
  ON public.user_project_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
    OR auth.uid() = user_id
  );

CREATE POLICY "Users accept/decline own invitations"
  ON public.user_project_invitations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('accepted', 'declined'));

CREATE POLICY "Project owners remove invitations"
  ON public.user_project_invitations FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

-- ============================================================
-- TAGS SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  tag_type TEXT DEFAULT 'custom' CHECK (tag_type IN ('custom', 'predefined', 'user_defined', 'system')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, tag_id, tag_type)
);

CREATE TABLE IF NOT EXISTS public.user_tags (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  tag_color TEXT DEFAULT '#ccee00',
  tag_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.project_tag_usage (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, tag_id, tag_type)
);

ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tag_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read tags of visible projects"
  ON public.project_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_tags.project_id
      AND (
        p.user_id = auth.uid()
        OR p.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM public.user_project_invitations upi
          WHERE upi.project_id = p.id AND upi.user_id = auth.uid() AND upi.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Users add tags to own projects"
  ON public.project_tags FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_tags.project_id)
  );

CREATE POLICY "Users remove own tags"
  ON public.project_tags FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
  );

CREATE POLICY "Users manage own tags"
  ON public.user_tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tags on content tables
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tag_visibility TEXT[] DEFAULT ARRAY['private'];

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

ALTER TABLE public.objects
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

ALTER TABLE public.screenplay_elements
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Update project.updated_at on content change
CREATE OR REPLACE FUNCTION public.touch_project_on_content_change()
RETURNS TRIGGER AS $$
DECLARE
  pid UUID;
BEGIN
  pid := COALESCE(NEW.project_id, OLD.project_id);
  IF pid IS NOT NULL THEN
    UPDATE public.projects SET updated_at = NOW() WHERE id = pid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_touch_project_on_character
  AFTER INSERT OR UPDATE OR DELETE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

CREATE TRIGGER trigger_touch_project_on_location
  AFTER INSERT OR UPDATE OR DELETE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

CREATE TRIGGER trigger_touch_project_on_object
  AFTER INSERT OR UPDATE OR DELETE ON public.objects
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

CREATE TRIGGER trigger_touch_project_on_screenplay
  AFTER INSERT OR UPDATE OR DELETE ON public.screenplay_elements
  FOR EACH ROW EXECUTE FUNCTION public.touch_project_on_content_change();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_characters_project_id ON public.characters(project_id);
CREATE INDEX idx_locations_project_id ON public.locations(project_id);
CREATE INDEX idx_objects_project_id ON public.objects(project_id);
CREATE INDEX idx_screenplay_project_id ON public.screenplay_elements(project_id);
CREATE INDEX idx_screenplay_sort_order ON public.screenplay_elements(project_id, sort_order);
CREATE INDEX idx_mindmap_nodes_project_id ON public.mind_map_nodes(project_id);
CREATE INDEX idx_mindmap_links_project_id ON public.mind_map_links(project_id);
CREATE INDEX idx_recordings_project_id ON public.recordings(project_id);
CREATE INDEX idx_media_uploads_project_id ON public.media_uploads(project_id);
CREATE INDEX idx_brainstorm_documents_project_id ON public.brainstorm_documents(project_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_objects_updated_at
  BEFORE UPDATE ON public.objects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_screenplay_updated_at
  BEFORE UPDATE ON public.screenplay_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_mindmap_nodes_updated_at
  BEFORE UPDATE ON public.mind_map_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_brainstorm_documents_updated_at
  BEFORE UPDATE ON public.brainstorm_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COLLABORATION: Editor access helper function
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_can_edit_project(pid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = pid)
    OR EXISTS (
      SELECT 1 FROM public.user_project_invitations
      WHERE project_id = pid
        AND user_id = auth.uid()
        AND status = 'accepted'
        AND role IN ('editor', 'collaborator')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update content table policies to allow editors
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['characters','locations','objects','screenplay_elements','mind_map_nodes','mind_map_links','recordings','media_uploads','brainstorm_documents']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %s" ON public.%I FOR INSERT WITH CHECK (public.user_can_edit_project(project_id))', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %s" ON public.%I FOR UPDATE USING (public.user_can_edit_project(project_id))', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %s" ON public.%I FOR DELETE USING (public.user_can_edit_project(project_id))', tbl, tbl);
  END LOOP;
END $$;

-- Update projects policies (INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (public.user_can_edit_project(id))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_project_invitations
    WHERE project_id = id AND user_id = auth.uid() AND status = 'accepted' AND role IN ('editor', 'collaborator')
  ));

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project ON public.project_audit_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.project_audit_log(user_id);
ALTER TABLE public.project_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read audit log"
  ON public.project_audit_log FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id)
    OR EXISTS (
      SELECT 1 FROM public.user_project_invitations
      WHERE project_id = project_audit_log.project_id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );

CREATE POLICY "System can insert audit log"
  ON public.project_audit_log FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}';
  pid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    pid := OLD.project_id;
    changes := jsonb_build_object('deleted', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    pid := NEW.project_id;
    SELECT jsonb_object_agg(key, value) INTO changes
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(OLD) ? key AND to_jsonb(OLD)->>key IS DISTINCT FROM to_jsonb(NEW)->>key;
  ELSE
    pid := NEW.project_id;
  END IF;
  INSERT INTO public.project_audit_log (project_id, entity_type, entity_id, user_id, action, changed_fields)
  VALUES (pid, TG_TABLE_NAME, COALESCE(NEW.id::TEXT, OLD.id::TEXT), auth.uid(), TG_OP, changes);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['characters','locations','objects','screenplay_elements','mind_map_nodes','mind_map_links']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s_changes ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER audit_%s_changes AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_entity_change()', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- PROFILE HELPERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_user_by_email(email_text TEXT)
RETURNS TABLE (id UUID, email TEXT, username TEXT, display_name TEXT, avatar_url TEXT, avatar_color TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1))::TEXT,
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1))::TEXT,
    (au.raw_user_meta_data->>'avatar_url')::TEXT,
    COALESCE(au.raw_user_meta_data->>'avatar_color', 'ccee00')::TEXT
  FROM auth.users au
  WHERE au.email = email_text
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_profiles()
RETURNS TABLE (user_id UUID, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.profiles (id, username, display_name, avatar_url, avatar_color, created_at, updated_at)
  SELECT au.id,
    COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
    au.raw_user_meta_data->>'avatar_url',
    COALESCE(au.raw_user_meta_data->>'avatar_color', 'ccee00'),
    au.created_at,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
  RETURNING id, 'created'::TEXT;
END;
$$;

-- ============================================================
-- STORAGE: Avatar bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar individual upload" ON storage.objects;
CREATE POLICY "Avatar individual upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatar individual update" ON storage.objects;
CREATE POLICY "Avatar individual update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Avatar individual delete" ON storage.objects;
CREATE POLICY "Avatar individual delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );