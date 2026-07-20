import React, { useState, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { brushPresets } from '../lib/canvasBrushes';
import { backgroundPresets } from '../lib/backgrounds';
import { exportFrameToPNG, exportFrameToPDF } from '../lib/export';

export default function StoryboardCanvas({ activeFrame, frames, onSelectFrame }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const lineRef = useRef(null); // current Konva.Line being drawn

  const [activeTool, setActiveTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);
  const [currentBackground, setCurrentBackground] = useState(backgroundPresets[0]);

  // Mutable refs for values needed inside Konva event handlers
  // (avoid stale closures without re-registering handlers on every render)
  const activeToolRef = useRef(activeTool);
  const brushSizeRef = useRef(brushSize);
  const isDrawingRef = useRef(isDrawing);

  activeToolRef.current = activeTool;
  brushSizeRef.current = brushSize;
  isDrawingRef.current = isDrawing;

  // Derive brush config from activeTool
  const getActiveBrush = useCallback(() => {
    return brushPresets.find((b) => b.id === activeToolRef.current) || brushPresets[1];
  }, []);

  // Initialise / re-init Konva stage when frame changes
  useEffect(() => {
    if (!containerRef.current || !activeFrame) return;

    // Destroy previous stage if any
    if (stageRef.current) {
      stageRef.current.destroy();
      stageRef.current = null;
    }

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 1920,
      height: 1080,
    });
    stageRef.current = stage;

    const layer = new Konva.Layer({ name: 'main-layer' });
    layerRef.current = layer;
    stage.add(layer);

    // Background layer (bottom)
    const bgLayer = new Konva.Layer({ name: 'bg-layer' });
    bgLayer.moveToBottom();
    stage.add(bgLayer);
    renderKonvaBackground(bgLayer, currentBackground);

    // Draw existing frame strokes if available
    if (activeFrame.strokes?.length) {
      replayStrokes(layer, activeFrame.strokes);
    }

    // Onion skin layer
    if (onionSkin) {
      const osLayer = new Konva.Layer({ name: 'onion-layer' });
      osLayer.opacity(0.25);
      osLayer.moveToBottom(); // above bg, below main
      stage.add(osLayer);
      renderOnionSkin(osLayer, activeFrame, frames);
    }

    // --- Pointer event handlers (registered once per stage lifecycle) ---
    stage.on('pointerdown touchstart', (e) => {
      // Only respond to clicks on the drawing layer itself
      if (e.target.getParent() !== layerRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const b = getActiveBrush();

      const points = [pos.x, pos.y];
      const konvaLine = new Konva.Line({
        points,
        stroke: b.id === 'eraser' ? '#ffffff' : b.color,
        strokeWidth: brushSizeRef.current,
        lineCap: 'round',
        lineJoin: 'round',
        opacity: b.id === 'eraser' ? 1 : b.opacity,
        globalCompositeOperation:
          b.id === 'eraser' ? 'destination-out' : 'source-over',
        listening: false,
      });
      layer.add(konvaLine);
      lineRef.current = konvaLine;

      isDrawingRef.current = true;
      setIsDrawing(true);
    });

    stage.on('pointermove touchmove', () => {
      if (!isDrawingRef.current) return;
      const line = lineRef.current;
      if (!line) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const newPoints = [...line.points(), pos.x, pos.y];
      line.points(newPoints);
    });

    stage.on('pointerup touchend pointerleave', () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      setIsDrawing(false);
      lineRef.current = null;
    });

    return () => {
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
      lineRef.current = null;
    };
  }, [activeFrame, currentBackground, onionSkin]);

  // Brush change: sync activeTool + update default size from preset
  const handleBrushChange = useCallback((brushId) => {
    setActiveTool(brushId);
    const preset = brushPresets.find((b) => b.id === brushId);
    if (preset) setBrushSize(preset.width);
  }, []);

  // Background change: trigger re-init via state
  const handleBackgroundChange = useCallback((bgId) => {
    const bg = backgroundPresets.find((b) => b.id === bgId);
    if (!bg) return;
    setCurrentBackground(bg);
  }, []);

  // Onion skin toggle
  const handleOnionSkinToggle = useCallback((enabled) => {
    setOnionSkin(enabled);
  }, []);

  // Export
  const handleExportPNG = useCallback(async () => {
    if (stageRef.current) {
      await exportFrameToPNG(stageRef.current, activeFrame.scene?.title || 'frame');
    }
  }, [activeFrame]);

  const handleExportPDF = useCallback(async () => {
    if (stageRef.current) {
      await exportFrameToPDF(stageRef.current, activeFrame.scene?.title || 'frame');
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
                onClick={() => handleBrushChange(b.id)}
                title={b.name}
              >
                <div className="tool-icon">
                  {b.id === 'light-pencil' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" opacity="0.5" />
                    </svg>
                  )}
                  {b.id === 'pencil' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  )}
                  {b.id === 'pen' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  )}
                  {b.id === 'brush' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13.296L13.704 9 8 14.704 12.296 19 18 13.296zM12.296 19L3 9.704 9.704 3 19 12.296 12.296 19z" />
                    </svg>
                  )}
                  {b.id === 'ink-brush' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <path d="M2 2l7.586 7.586" />
                      <circle cx="11" cy="11" r="2" />
                    </svg>
                  )}
                  {b.id === 'charcoal' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="4" />
                      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="4" />
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
            onChange={(e) => setBrushSize(Number(e.target.value))}
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
          <h3>Onion Skin</h3>
          <button
            className={`tool-btn ${onionSkin ? 'active' : ''}`}
            onClick={() => handleOnionSkinToggle(!onionSkin)}
            title="Toggle onion skin"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" opacity="0.5" />
              <circle cx="12" cy="12" r="2" opacity="0.25" />
            </svg>
          </button>
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

      {/* Canvas container — single ref, no <canvas> element (Konva owns the DOM) */}
      <div className="canvas-wrapper" ref={containerRef} />

      {/* Info bar */}
      <div className="storyboard-info-bar">
        <div className="info-item">
          <span className="info-label">Scene:</span>
          <span className="info-value">{activeFrame.scene?.title || '—'}</span>
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

/**
 * Render a Konva background using Konva.Rect / Konva.Line shapes
 * (renderBackground from backgrounds.js uses Canvas2D API — incompatible with Konva layers)
 */
function renderKonvaBackground(layer, bg) {
  layer.destroyChildren();

  if (bg.type === 'solid' || !bg.pattern) {
    layer.add(new Konva.Rect({
      x: 0, y: 0, width: 1920, height: 1080,
      fill: bg.color,
      listening: false,
    }));
  } else if (bg.pattern === 'grid') {
    layer.add(new Konva.Rect({
      x: 0, y: 0, width: 1920, height: 1080,
      fill: '#ffffff',
      listening: false,
    }));
    const gridGroup = new Konva.Group({ listening: false });
    const gridSize = 50;
    for (let x = 0; x <= 1920; x += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [x, 0, x, 1080],
        stroke: bg.color,
        strokeWidth: 1,
      }));
    }
    for (let y = 0; y <= 1080; y += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [0, y, 1920, y],
        stroke: bg.color,
        strokeWidth: 1,
      }));
    }
    layer.add(gridGroup);
  } else if (bg.pattern === 'dots') {
    layer.add(new Konva.Rect({
      x: 0, y: 0, width: 1920, height: 1080,
      fill: '#ffffff',
      listening: false,
    }));
    const dotGroup = new Konva.Group({ listening: false });
    const spacing = 50;
    for (let x = 0; x <= 1920; x += spacing) {
      for (let y = 0; y <= 1080; y += spacing) {
        dotGroup.add(new Konva.Circle({
          x, y, radius: 2,
          fill: bg.color,
        }));
      }
    }
    layer.add(dotGroup);
  }

  layer.batchDraw();
}

/**
 * Replay saved stroke data as Konva.Line shapes
 */
function replayStrokes(layer, strokes) {
  strokes.forEach((stroke) => {
    if (!stroke.points?.length) return;
    const flatPoints = stroke.points.flatMap((p) => [p.x, p.y]);
    layer.add(new Konva.Line({
      points: flatPoints,
      stroke: stroke.color || '#e0e0e0',
      strokeWidth: stroke.width || 3,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: stroke.opacity ?? 0.8,
      globalCompositeOperation:
        stroke.type === 'eraser' ? 'destination-out' : 'source-over',
      listening: false,
    }));
  });
  layer.batchDraw();
}

/**
 * Render previous/next frame strokes as onion skin overlay
 */
function renderOnionSkin(layer, activeFrame, frames) {
  if (!frames?.length) return;
  const idx = frames.findIndex((f) => f.id === activeFrame.id);
  if (idx < 0) return;

  // Previous frame — red tint
  if (idx > 0) {
    const prev = frames[idx - 1];
    if (prev.strokes?.length) {
      const group = new Konva.Group({ opacity: 0.3, listening: false });
      prev.strokes.forEach((stroke) => {
        if (!stroke.points?.length) return;
        const flat = stroke.points.flatMap((p) => [p.x, p.y]);
        group.add(new Konva.Line({
          points: flat,
          stroke: '#ff4444',
          strokeWidth: stroke.width || 3,
          lineCap: 'round',
          lineJoin: 'round',
          listening: false,
        }));
      });
      layer.add(group);
    }
  }

  // Next frame — blue tint
  if (idx < frames.length - 1) {
    const next = frames[idx + 1];
    if (next.strokes?.length) {
      const group = new Konva.Group({ opacity: 0.3, listening: false });
      next.strokes.forEach((stroke) => {
        if (!stroke.points?.length) return;
        const flat = stroke.points.flatMap((p) => [p.x, p.y]);
        group.add(new Konva.Line({
          points: flat,
          stroke: '#4488ff',
          strokeWidth: stroke.width || 3,
          lineCap: 'round',
          lineJoin: 'round',
          listening: false,
        }));
      });
      layer.add(group);
    }
  }

  layer.batchDraw();
}
