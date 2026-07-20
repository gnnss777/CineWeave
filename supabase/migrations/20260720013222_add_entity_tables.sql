-- Entity tables (scenes, acts, dialogues, themes, plot_points, world_elements)
-- already exist in remote DB. This migration is kept for local dev consistency.
-- See add_entity_tables.sql for the DDL.

-- Storyboard tables for CineWeave
-- Storyboards, frames, layers, and drawing elements

CREATE TABLE IF NOT EXISTS project_storyboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_storyboard_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storyboard_id UUID REFERENCES project_storyboards(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
  "order" INT NOT NULL,
  width INT NOT NULL DEFAULT 1920,
  height INT NOT NULL DEFAULT 1080,
  preview_url TEXT,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_storyboard_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storyboard_id UUID REFERENCES project_storyboards(id) ON DELETE CASCADE,
  frame_id UUID REFERENCES project_storyboard_frames(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('drawing', 'text', 'image', 'background')),
  opacity FLOAT NOT NULL DEFAULT 100,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  blend_mode TEXT CHECK (blend_mode IN (
    'source-over', 'multiply', 'screen', 'overlay',
    'darken', 'lighten', 'color-dodge', 'color-burn',
    'hard-light', 'soft-light', 'difference', 'exclusion',
    'hue', 'saturation', 'color', 'luminosity'
  )) DEFAULT 'source-over',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_storyboard_drawing_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  layer_id UUID REFERENCES project_storyboard_layers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('path', 'rect', 'circle', 'text', 'image')),
  data JSONB NOT NULL,
  width INT NOT NULL DEFAULT 1920,
  height INT NOT NULL DEFAULT 1080,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_storyboards_project_id ON project_storyboards(project_id);
CREATE INDEX IF NOT EXISTS idx_frames_project_id ON project_storyboard_frames(project_id);
CREATE INDEX IF NOT EXISTS idx_frames_storyboard_id ON project_storyboard_frames(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_frames_scene_id ON project_storyboard_frames(scene_id);
CREATE INDEX IF NOT EXISTS idx_frames_order ON project_storyboard_frames(storyboard_id, "order");
CREATE INDEX IF NOT EXISTS idx_layers_project_id ON project_storyboard_layers(project_id);
CREATE INDEX IF NOT EXISTS idx_layers_frame_id ON project_storyboard_layers(frame_id);
CREATE INDEX IF NOT EXISTS idx_layers_storyboard_id ON project_storyboard_layers(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_drawing_elements_layer_id ON project_storyboard_drawing_elements(layer_id);
