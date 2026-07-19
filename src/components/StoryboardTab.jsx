import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { createEntity } from '../context/EntitiesSchema';

// Importar componentes
import StoryboardCanvas from './StoryboardCanvas';
import FrameTimeline from './FrameTimeline';
import LayerPanel from './LayerPanel';

export default function StoryboardTab() {
  const { currentProject, navigateTo } = useProject();
  const entities = currentProject.entities;

  // Estado da storyboard
  const [activeFrameId, setActiveFrameId] = useState(null);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [frames, setFrames] = useState(entities.storyboard_frames || []);
  const [layers, setLayers] = useState(entities.storyboard_layers || []);
  const [selectedStoryboard, setSelectedStoryboard] = useState('main');

  // Adicionar novo frame
  const handleAddFrame = (sceneId) => {
    const scene = entities.scenes.find((s) => s.id === sceneId);

    console.log('[StoryboardTab] handleAddFrame - sceneId:', sceneId);
    console.log('[StoryboardTab] handleAddFrame - scene:', scene);

    if (!scene) return;

    // Determinar próximo order
    const nextOrder = frames.length > 0 ? Math.max(...frames.map((f) => f.order)) + 1 : 0;

    const newFrame = createEntity('storyboard_frames', {
      id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storyboard_id: selectedStoryboard,
      scene_id: sceneId,
      order: nextOrder,
      width: 1920,
      height: 1080,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Criar layer de background
    const newLayer = createEntity('storyboard_layers', {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storyboard_id: selectedStoryboard,
      frame_id: newFrame.id,
      name: 'Background',
      type: 'background',
      opacity: 100,
      visible: true,
      locked: false,
      blend_mode: 'source-over',
      data: { color: '#ffffff' },
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Atualizar entities
    const updatedFrames = [...frames, newFrame];
    const updatedLayers = [...layers, newLayer];

    setFrames(updatedFrames);
    setLayers(updatedLayers);

    // Atualizar currentProject
    currentProject.entities.storyboard_frames = updatedFrames;
    currentProject.entities.storyboard_layers = updatedLayers;

    // Salvar no localStorage
    saveToStorage();

    // Ativar o novo frame
    setActiveFrameId(newFrame.id);

    // Navegar para o novo frame
    navigateTo('storyboard', newFrame.id);
  };

  // Ativar frame
  const handleSelectFrame = (frameId) => {
    setActiveFrameId(frameId);
  };

  // Excluir frame
  const handleDeleteFrame = (frameId) => {
    if (!confirm('Are you sure you want to delete this frame?')) return;

    const updatedFrames = frames.filter((f) => f.id !== frameId);
    setFrames(updatedFrames);

    // Atualizar currentProject
    currentProject.entities.storyboard_frames = updatedFrames;
    saveToStorage();
  };

  // Salvar no localStorage
  function saveToStorage() {
    try {
      const projects = JSON.parse(localStorage.getItem('cineweave_projects') || '[]');
      const projectIndex = projects.findIndex((p) => p.id === currentProject.id);
      if (projectIndex !== -1) {
        projects[projectIndex] = currentProject;
        localStorage.setItem('cineweave_projects', JSON.stringify(projects));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Frame atual
  const activeFrame = frames.find((f) => f.id === activeFrameId);

  return (
    <div className="storyboard-tab">
      <div className="storyboard-container">
        {/* Sidebar com frame list */}
        <div className="storyboard-sidebar">
          <div className="sidebar-header">
            <h2>Storyboard Frames</h2>

            {/* Select de storyboard */}
            <select
              value={selectedStoryboard}
              onChange={(e) => setSelectedStoryboard(e.target.value)}
              className="storyboard-select"
            >
              <option value="main">Main Storyboard</option>
              <option value="alternate">Alternate Storyboard</option>
            </select>
          </div>

          {/* Lista de cenas para adicionar frames */}
          <div className="scene-adder">
            <label>Add Frame From Scene:</label>
            <select
              value=""
              onChange={(e) => e.target.value && handleAddFrame(e.target.value)}
              className="scene-select"
            >
              <option value="">Select a scene...</option>
              {entities.scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.title}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline de frames */}
          <div className="frame-timeline-container">
            <FrameTimeline
              frames={frames}
              activeFrameId={activeFrameId}
              onSelectFrame={handleSelectFrame}
            />
          </div>
        </div>

        {/* Área principal com canvas */}
        <div className="storyboard-main">
          {activeFrame ? (
            <>
              {/* Canvas */}
              <StoryboardCanvas
                activeFrame={activeFrame}
                frames={frames}
                onSelectFrame={handleSelectFrame}
              />

              {/* Layer Panel */}
              <div className="layer-panel-container">
                <LayerPanel
                  layers={layers.filter((l) => l.frame_id === activeFrameId)}
                  activeLayerId={activeLayerId}
                  onToggleLayer={() => {}}
                  onSelectLayer={setActiveLayerId}
                  onAddLayer={() => {}}
                />
              </div>
            </>
          ) : (
            <div className="storyboard-empty">
              <div className="empty-state">
                <h2>No Frames Yet</h2>
                <p>Start by adding frames from scenes in your screenplay</p>
                <div className="empty-actions">
                  <select className="empty-select">
                    <option value="">Select a scene...</option>
                    {entities.scenes.slice(0, 5).map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
