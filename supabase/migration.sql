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
