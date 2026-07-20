-- ============================================================
-- Entity Tables for CineWeave
-- Run this in Supabase SQL Editor after the main migration.sql
-- ============================================================

-- ============================================================
-- SCENES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  synopsis TEXT DEFAULT '',
  act_id UUID,
  character_ids JSONB DEFAULT '[]',
  "order" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own scenes" ON public.scenes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenes" ON public.scenes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenes" ON public.scenes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenes" ON public.scenes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON public.scenes(project_id);

-- ============================================================
-- ACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.acts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  "order" INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#ccee00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own acts" ON public.acts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own acts" ON public.acts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own acts" ON public.acts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own acts" ON public.acts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_acts_project ON public.acts(project_id);

-- ============================================================
-- DIALOGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dialogues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL DEFAULT '',
  line TEXT NOT NULL DEFAULT '',
  context TEXT DEFAULT '',
  scene_id UUID,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own dialogues" ON public.dialogues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dialogues" ON public.dialogues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dialogues" ON public.dialogues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dialogues" ON public.dialogues FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_project ON public.dialogues(project_id);

-- ============================================================
-- THEMES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL DEFAULT '',
  evidence TEXT DEFAULT '',
  relevance TEXT DEFAULT 'Central',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own themes" ON public.themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own themes" ON public.themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own themes" ON public.themes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own themes" ON public.themes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_themes_project ON public.themes(project_id);

-- ============================================================
-- PLOT POINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plot_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  act_id UUID,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plot_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own plot_points" ON public.plot_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plot_points" ON public.plot_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plot_points" ON public.plot_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plot_points" ON public.plot_points FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_plot_points_project ON public.plot_points(project_id);

-- ============================================================
-- WORLD ELEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.world_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT DEFAULT 'setting',
  description TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.world_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own world_elements" ON public.world_elements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own world_elements" ON public.world_elements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own world_elements" ON public.world_elements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own world_elements" ON public.world_elements FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_world_elements_project ON public.world_elements(project_id);
