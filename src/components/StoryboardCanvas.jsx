import React, { useState, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { useProject } from '../context/ProjectContext';
import { brushPresets } from '../lib/canvasBrushes';
import { renderBackground, backgroundPresets } from '../lib/backgrounds';
import { exportFrameToPNG, exportFrameToPDF } from '../lib/export';

export default function StoryboardCanvas({ activeFrame, frames, onSelectFrame }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [activeTool, setActiveTool] = useState('pencil');
  const [brush, setBrush] = useState(brushPresets[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [onionSkin, setOnionSkin] = useState(false);
  const [currentBackground, setCurrentBackground] = useState(backgroundPresets[0]);

  // Inicializar canvas
  useEffect(() => {
    if (canvasRef.current && activeFrame) {
      initCanvas();
    }

    return () => {
      if (stageRef.current) {
        stageRef.current.destroy();
      }
    };
  }, [activeFrame]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Criar stage
    const stage = new Konva.Stage({
      container: canvasRef.current,
      width: 1920,
      height: 1080,
    });

    stageRef.current = stage;

    // Criar layer principal
    const layer = new Konva.Layer({ name: 'main-layer' });
    layerRef.current = layer;
    stage.add(layer);

    // Renderizar background
    renderBackground(layer, currentBackground, 1920, 1080);

    // Configurar pointer events
    setupPointerEvents(stage, layer);
  }, [currentBackground]);

  const setupPointerEvents = useCallback((stage, layer) => {
    stage.on('pointerdown', (e) => {
      e.cancelBubble = true;

      // Handle drawing
      if (e.target !== stage) {
        const pos = stage.getPointerPosition();

        // Create new stroke
        const stroke = new Konva.Line({
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: brush.color,
          strokeWidth: brushSize,
          lineCap: 'round',
          lineJoin: 'round',
          opacity: brush.opacity,
          listening: false,
        });

        layer.add(stroke);

        // Update stroke width based on brush
        stroke.strokeWidth(brushSize);

        // Store current stroke
        const currentStroke = {
          id: `stroke-${Date.now()}`,
          type: 'ink',
          points: [
            {
              x: pos.x,
              y: pos.y,
              width: brushSize,
              pressure: 0.5,
            },
          ],
          color: brush.color,
          opacity: brush.opacity,
        };

        // Update current drawing
        setCurrentDrawing((prev) => ({
          ...prev,
          strokes: [...(prev.strokes || []), currentStroke],
        }));

        setIsDrawing(true);
      }
    });

    stage.on('pointermove', (e) => {
      if (!isDrawing || e.target !== stage) return;

      const pos = stage.getPointerPosition();
      const lastStroke = currentDrawing.strokes?.slice(-1)[0];

      if (lastStroke) {
        const points = [
          ...lastStroke.points,
          {
            x: pos.x,
            y: pos.y,
            width: brushSize,
            pressure: 0.5,
          },
        ];

        lastStroke.points = points;
        lastStroke.color = brush.color;
        lastStroke.opacity = brush.opacity;

        // Update Konva line
        lastStroke.line.points(points);
        lastStroke.line.strokeWidth(brushSize);
      }
    });

    stage.on('pointerup', () => {
      setIsDrawing(false);
    });

    stage.on('pointerleave', () => {
      setIsDrawing(false);
    });
  }, [brush, brushSize, isDrawing, currentDrawing]);

  const [currentDrawing, setCurrentDrawing] = useState({
    strokes: [],
    currentStroke: null,
  });

  // Handle brush change
  const handleBrushChange = useCallback((brushId) => {
    const newBrush = brushPresets.find((b) => b.id === brushId);
    if (newBrush) {
      setBrush(newBrush);
    }
  }, []);

  // Handle brush size change
  const handleBrushSizeChange = useCallback((size) => {
    setBrushSize(Number(size));
  }, []);

  // Handle background change
  const handleBackgroundChange = useCallback((bgId) => {
    const bg = backgroundPresets.find((b) => b.id === bgId);
    if (bg && layerRef.current) {
      renderBackground(layerRef.current, bg, 1920, 1080);
      setCurrentBackground(bg);
    }
  }, []);

  // Handle onion skin toggle
  const handleOnionSkinToggle = useCallback((enabled) => {
    setOnionSkin(enabled);
    if (enabled && activeFrame) {
      // Find previous and next frames
      const currentIndex = frames.findIndex((f) => f.id === activeFrame.id);
      const previousFrame = currentIndex > 0 ? frames[currentIndex - 1] : null;
      const nextFrame = currentIndex < frames.length - 1 ? frames[currentIndex + 1] : null;

      // Render onion skin
      if (layerRef.current) {
        // For now, just set the state - onion skin rendering will be implemented
        console.log('Onion skin enabled:', { previousFrame, nextFrame });
      }
    }
  }, [activeFrame, frames]);

  // Handle export
  const handleExportPNG = useCallback(async () => {
    if (stageRef.current) {
      const result = await exportFrameToPNG(stageRef.current, activeFrame.scene.title);
      console.log(result);
    }
  }, [activeFrame]);

  const handleExportPDF = useCallback(async () => {
    if (stageRef.current) {
      const result = await exportFrameToPDF(stageRef.current, activeFrame.scene.title);
      console.log(result);
    }
  }, [activeFrame]);

  if (!activeFrame) {
    return (
      <div className="storyboard-canvas-placeholder">
        <div className="placeholder-content">
          <h2>Select a Frame</h2>
          <p>Choose a frame from the timeline to start drawing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storyboard-canvas-container">
      {/* Toolbar */}
      <div className="storyboard-toolbar">
        <div className="toolbar-section">
          <h3>Tools</h3>
          <div className="tool-buttons">
            {brushPresets.map((b) => (
              <button
                key={b.id}
                className={`tool-btn ${activeTool === b.id ? 'active' : ''}`}
                onClick={() => setActiveTool(b.id)}
                title={b.name}
              >
                <div className="tool-icon">
                  {b.id === 'pencil' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  )}
                  {b.id === 'brush' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13.296L13.704 9 8 14.704 12.296 19 18 13.296zM12.296 19L3 9.704 9.704 3 19 12.296 12.296 19z" />
                    </svg>
                  )}
                  {b.id === 'pen' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  )}
                  {b.id === 'eraser' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" />
                      <line x1="9" y1="11" x2="19" y2="21" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Brush Size</h3>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => handleBrushSizeChange(e.target.value)}
            className="brush-slider"
          />
          <span className="brush-size-value">{brushSize}px</span>
        </div>

        <div className="toolbar-section">
          <h3>Background</h3>
          <select
            value={currentBackground.id}
            onChange={(e) => handleBackgroundChange(e.target.value)}
            className="background-select"
          >
            {backgroundPresets.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-section">
          <h3>Actions</h3>
          <button onClick={handleExportPNG} className="action-btn">
            Export PNG
          </button>
          <button onClick={handleExportPDF} className="action-btn">
            Export PDF
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-wrapper" ref={canvasRef}>
        <canvas ref={canvasRef} width={1920} height={1080} />
      </div>

      {/* Info bar */}
      <div className="storyboard-info-bar">
        <div className="info-item">
          <span className="info-label">Scene:</span>
          <span className="info-value">{activeFrame.scene.title}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Frame:</span>
          <span className="info-value">{activeFrame.order + 1}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Resolution:</span>
          <span className="info-value">1920 x 1080</span>
        </div>
      </div>
    </div>
  );
}
