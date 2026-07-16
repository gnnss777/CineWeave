import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';

export default function FrameTimeline({ frames, activeFrameId, onSelectFrame }) {
  const { currentProject } = useProject();
  const entities = currentProject.entities;
  const [selectedSceneId, setSelectedSceneId] = useState('');

  // Filtrar frames por cena
  const filteredFrames = selectedSceneId
    ? frames.filter((f) => f.scene_id === selectedSceneId)
    : frames;

  // Agrupar por cena
  const framesByScene = frames.reduce((acc, frame) => {
    const scene = entities.scenes.find((s) => s.id === frame.scene_id);
    const sceneName = scene?.title || `Scene ${frame.order + 1}`;

    if (!acc[sceneName]) {
      acc[sceneName] = [];
    }

    acc[sceneName].push(frame);
    return acc;
  }, {});

  return (
    <div className="frame-timeline">
      <div className="timeline-header">
        <h3>Frame Timeline</h3>
        <div className="timeline-actions">
          <select
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
            className="scene-filter"
          >
            <option value="">All Scenes</option>
            {entities.scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.title}
              </option>
            ))}
          </select>
          <span className="frame-count">{filteredFrames.length} frames</span>
        </div>
      </div>

      <div className="timeline-scroll">
        {Object.entries(framesByScene).map(([sceneName, sceneFrames]) => (
          <div key={sceneName} className="scene-group">
            <div className="scene-group-header">
              <span className="scene-name">{sceneName}</span>
              <span className="scene-frame-count">{sceneFrames.length} frames</span>
            </div>

            <div className="scene-frames">
              {sceneFrames.map((frame) => {
                const scene = entities.scenes.find((s) => s.id === frame.scene_id);

                return (
                  <div
                    key={frame.id}
                    className={`timeline-frame ${activeFrameId === frame.id ? 'active' : ''}`}
                    onClick={() => onSelectFrame(frame.id)}
                  >
                    <div className="frame-thumbnail">
                      <div className="frame-placeholder">
                        <span className="frame-number">{frame.order + 1}</span>
                      </div>
                    </div>

                    <div className="frame-details">
                      <div className="frame-number">{frame.order + 1}</div>
                      <div className="frame-scene">
                        {scene?.title || 'Untitled Scene'}
                      </div>
                      <div className="frame-meta">
                        {frame.width}x{frame.height}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFrames.length === 0 && (
          <div className="empty-state">
            <p>No frames found for this scene</p>
          </div>
        )}
      </div>
    </div>
  );
}
