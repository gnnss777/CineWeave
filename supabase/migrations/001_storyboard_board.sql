-- Migration para adicionar Storyboard Board ao CineWeave
-- Autor: AI Assistant
-- Data: 2026-07-16
-- Fase: Storyboard Board

-- Tabela de storyboards (coleções de quadros)
CREATE TABLE IF NOT EXISTS project_storyboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de frames (quadros brancos para desenhar)
CREATE TABLE IF NOT EXISTS project_storyboard_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storyboard_id UUID REFERENCES project_storyboards(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES project_entities.scenes(id) ON DELETE SET NULL,
  order INT NOT NULL,
  width INT NOT NULL DEFAULT 1920,
  height INT NOT NULL DEFAULT 1080,
  preview_url TEXT,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de layers (camadas para organizar o quadro)
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

-- Tabela de drawing elements (strokes, paths, etc)
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_storyboards_project_id ON project_storyboards(project_id);
CREATE INDEX IF NOT EXISTS idx_frames_project_id ON project_storyboard_frames(project_id);
CREATE INDEX IF NOT EXISTS idx_frames_storyboard_id ON project_storyboard_frames(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_frames_scene_id ON project_storyboard_frames(scene_id);
CREATE INDEX IF NOT EXISTS idx_frames_order ON project_storyboard_frames(storyboard_id, `order`);
CREATE INDEX IF NOT EXISTS idx_layers_project_id ON project_storyboard_layers(project_id);
CREATE INDEX IF NOT EXISTS idx_layers_frame_id ON project_storyboard_layers(frame_id);
CREATE INDEX IF NOT EXISTS idx_layers_storyboard_id ON project_storyboard_layers(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_drawing_elements_layer_id ON project_storyboard_drawing_elements(layer_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_storyboards_updated_at BEFORE UPDATE ON project_storyboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_frames_updated_at BEFORE UPDATE ON project_storyboard_frames
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_layers_updated_at BEFORE UPDATE ON project_storyboard_layers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drawing_elements_updated_at BEFORE UPDATE ON project_storyboard_drawing_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
