import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { ZoomIn, ZoomOut, Maximize, Plus, Link, Trash, Edit, X, Unlink, User, MapPin, FileText, Edit3, Clock, ArrowLeft, Layout, RefreshCw, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import SharedSidebar from './SharedSidebar';
import FichaModal from './FichaModal';
import { resolveNodeDisplay, createNodeWithEntity, getColorForNodeType } from '../lib/mindMapUtils';

export default function MindMapTab() {
  const { 
    currentProject, 
    updateMindMap, 
    saveCharacter, 
    saveLocation, 
    saveObject,
    saveEntity,
    deleteEntityById,
    updateProject,
    saveVersion,
    restoreVersion,
    tabNavigation,
    navigateTo
  } = useProject();

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  
  // Sync state with context project changes
  useEffect(() => {
    if (currentProject) {
      setNodes(currentProject.mindMapNodes || []);
      setLinks(currentProject.mindMapLinks || []);
    }
  }, [currentProject]);

  // Keyboard shortcut for guide (G key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'g' || e.key === 'G') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return;
        }
        e.preventDefault();
        const { startTour } = require('../context/OnboardingContext').useOnboarding();
        startTour('mindmap');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cross-tab navigation: focus on target node
  useEffect(() => {
    if (!tabNavigation || tabNavigation.tab !== 'mindmap' || !tabNavigation.targetId) return;
    const targetNode = nodes.find(n => n.id === tabNavigation.targetId || n.label === tabNavigation.targetId);
    if (targetNode) {
      setSelectedNodeId(targetNode.id);
      // Center view on the target node
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPan({ x: vw / 2 - targetNode.x * 1, y: vh / 2 - targetNode.y * 1 });
      setZoom(1);
    }
  }, [tabNavigation, nodes]);

  // Auto-fit to screen when nodes change
  useEffect(() => {
    if (nodes.length > 0 && svgRef.current) {
      const timer = setTimeout(() => handleResetPan(), 100);
      return () => clearTimeout(timer);
    }
  }, [nodes]);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Node state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // UI Selection states
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [linkSourceId, setLinkSourceId] = useState(null);
  const [tempLinkPos, setTempLinkPos] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredLinkId, setHoveredLinkId] = useState(null);
  const [isPlacingNode, setIsPlacingNode] = useState(false);
  const [pendingNodeData, setPendingNodeData] = useState(null);


  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sharedSidebarTab, setSharedSidebarTab] = useState('characters');
  const [fichaModal, setFichaModal] = useState(null); // { item, type, mode }
  const [activeFichaTab, setActiveFichaTab] = useState('characters');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // Form states for adding node
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState('scene');
  const [newNodeDetails, setNewNodeDetails] = useState('');

  // Form states for editing ficha directly from node

  const svgRef = useRef(null);

  // Drag node or pan canvas handler
  const handleMouseDown = (e) => {
    // If we're in node placing mode, create the node at click position
    if (isPlacingNode && pendingNodeData) {
      const { x, y } = getSvgCoords(e.clientX, e.clientY);
      const newNode = {
        id: `n-${Date.now()}`,
        label: pendingNodeData.label || 'Novo Nó',
        type: pendingNodeData.type || 'scene',
        x: Math.round(x),
        y: Math.round(y),
        details: pendingNodeData.details || '',
      };
      setNodes(prev => [...prev, newNode]);
      setIsPlacingNode(false);
      setPendingNodeData(null);
      updateMindMap([...nodes, newNode], links);
      return;
    }

    if (e.target.tagName === 'svg' || e.target.id === 'grid-background') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedLinkId(null);
    }
  };

  const getSvgCoords = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedNodeId) {
      const { x, y } = getSvgCoords(e.clientX, e.clientY);
      setNodes(prev => prev.map(node => {
        if (node.id === draggedNodeId) {
          return { ...node, x: x - dragOffset.x, y: y - dragOffset.y };
        }
        return node;
      }));
    } else if (linkSourceId) {
      const { x, y } = getSvgCoords(e.clientX, e.clientY);
      setTempLinkPos({ x, y });
    }
  };

  const handleMouseUp = (e) => {
    setIsPanning(false);
    if (draggedNodeId) {
      updateMindMap(nodes, links);
      setDraggedNodeId(null);
    }
    if (linkSourceId) {
      const target = e.target.closest('[data-node-id]');
      if (target) {
        const targetId = target.getAttribute('data-node-id');
        if (targetId && targetId !== linkSourceId) {
          finishLinking(targetId);
        } else {
          setLinkSourceId(null);
          setTempLinkPos(null);
        }
      } else {
        setLinkSourceId(null);
        setTempLinkPos(null);
      }
    }
  };

  // Touch support for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (e.target.tagName === 'svg' || e.target.id === 'grid-background') {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedLinkId(null);
    setDraggedNodeId(node.id);
    if (node.type === 'character') setActiveFichaTab('characters');
    else if (node.type === 'location') setActiveFichaTab('locations');
    else if (node.type === 'object') setActiveFichaTab('objects');

    const { x, y } = getSvgCoords(e.clientX, e.clientY);
    setDragOffset({
      x: x - node.x,
      y: y - node.y
    });
  };

  const handleConnectorMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setLinkSourceId(nodeId);
    setSelectedNodeId(nodeId);
    const n = nodes.find(n => n.id === nodeId);
    if (n?.type === 'character') setActiveFichaTab('characters');
    else if (n?.type === 'location') setActiveFichaTab('locations');
    else if (n?.type === 'object') setActiveFichaTab('objects');
    const { x, y } = getSvgCoords(e.clientX, e.clientY);
    setTempLinkPos({ x, y });
  };

  const handleLinkClick = (e, linkId) => {
    e.stopPropagation();
    setSelectedLinkId(linkId === selectedLinkId ? null : linkId);
  };

  const handleDeleteLink = (linkId) => {
    const updatedLinks = links.filter(l => l.id !== linkId);
    setLinks(updatedLinks);
    updateMindMap(nodes, updatedLinks);
    setSelectedLinkId(null);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setPan({
      x: mx - (mx - pan.x) * (newZoom / zoom),
      y: my - (my - pan.y) * (newZoom / zoom)
    });
    setZoom(newZoom);
  };

  const handleCanvasClick = (e) => {
    // Handle click-to-place node creation
    if (isPlacingNode && pendingNodeData) {
      // Don't place if clicking on UI elements
      if (e.target.tagName !== 'svg' && e.target.id !== 'grid-background') {
        return;
      }
      const { x, y } = getSvgCoords(e.clientX, e.clientY);
      const newNode = {
        id: `n-${Date.now()}`,
        label: pendingNodeData.label || 'Novo Nó',
        type: pendingNodeData.type || 'scene',
        x: Math.round(x),
        y: Math.round(y),
        details: pendingNodeData.details || '',
      };
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      updateMindMap(updatedNodes, links);
      setIsPlacingNode(false);
      setPendingNodeData(null);
      setSelectedNodeId(newNode.id);
      return;
    }
  };

  const handleResetPan = () => {
    if (nodes.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map(n => n.x)) - 50;
    const maxX = Math.max(...nodes.map(n => n.x)) + 50;
    const minY = Math.min(...nodes.map(n => n.y)) - 50;
    const maxY = Math.max(...nodes.map(n => n.y)) + 50;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom
    });
  };

  const handleReloadFromProject = () => {
    if (currentProject) {
      setNodes(currentProject.mindMapNodes || []);
      setLinks(currentProject.mindMapLinks || []);
    }
  };

  // Auto-arrange using force-directed layout
  const handleAutoArrange = () => {
    if (nodes.length === 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    const viewW = rect ? rect.width : 1000;

    // Build adjacency set
    const adj = new Set();
    links.forEach(l => { adj.add(`${l.source}->${l.target}`); adj.add(`${l.target}->${l.source}`); });

    // Initialize positions in a small circle if nodes have no position
    let positions = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      return { id: n.id, x: n.x || viewW / 2 + Math.cos(angle) * 100, y: n.y || 200 + Math.sin(angle) * 100 };
    });

    // Force-directed layout: N iterations
    const idealEdgeLen = 120;
    const repulsion = 30000;
    const iterations = 80;
    const center = { x: viewW / 2, y: 200 };

    for (let iter = 0; iter < iterations; iter++) {
      const damping = 1 - iter / iterations;
      const forces = positions.map(() => ({ fx: 0, fy: 0 }));

      // Repulsion: every pair of nodes repels
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i], b = positions[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          forces[i].fx += dx; forces[i].fy += dy;
          forces[j].fx -= dx; forces[j].fy -= dy;
        }
      }

      // Attraction: connected nodes attract
      for (const l of links) {
        const i = positions.findIndex(p => p.id === l.source);
        const j = positions.findIndex(p => p.id === l.target);
        if (i === -1 || j === -1) continue;
        const a = positions[i], b = positions[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - idealEdgeLen;
        const force = displacement * 0.06;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        forces[i].fx += dx; forces[i].fy += dy;
        forces[j].fx -= dx; forces[j].fy -= dy;
      }

      // Center gravity: pull everything toward center
      for (let i = 0; i < positions.length; i++) {
        const dx = center.x - positions[i].x;
        const dy = center.y - positions[i].y;
        forces[i].fx += dx * 0.002;
        forces[i].fy += dy * 0.002;
      }

      // Apply forces with damping
      for (let i = 0; i < positions.length; i++) {
        positions[i].x += forces[i].fx * damping;
        positions[i].y += forces[i].fy * damping;
      }
    }

    const updatedNodes = nodes.map(n => {
      const p = positions.find(pos => pos.id === n.id);
      return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : n;
    });

    setNodes(updatedNodes);
    updateMindMap(updatedNodes, links);
    setTimeout(() => handleResetPan(), 50);
  };

  // Auto-arrange if requested (new project / brainstorm import)
  useEffect(() => {
    if (currentProject?.needsAutoLayout && nodes.length > 0) {
      handleAutoArrange();
      const proj = { ...currentProject, needsAutoLayout: false };
      updateProject(proj);
    }
  }, [currentProject, nodes]);

  // Selected Node Details
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Open Ficha Editor
  const getEntityForNode = (node) => {
    if (!node) return null;
    const patterns = [
      { prefix: 'n-char-', type: 'character', db: 'characters', labelKey: 'name' },
      { prefix: 'char-', type: 'character', db: 'characters', labelKey: 'name' },
      { prefix: 'n-loc-', type: 'location', db: 'locations', labelKey: 'name' },
      { prefix: 'loc-', type: 'location', db: 'locations', labelKey: 'name' },
      { prefix: 'n-obj-', type: 'object', db: 'objects', labelKey: 'name' },
      { prefix: 'obj-', type: 'object', db: 'objects', labelKey: 'name' },
    ];
    for (const { prefix, type, db, labelKey } of patterns) {
      if (node.id.startsWith(prefix)) {
        const entityId = node.id.replace(prefix, '');
        const entity = currentProject[db].find(e => e.id === entityId || e[labelKey] === node.label);
        if (entity) return { type, data: entity };
        // Fallback: build from node data
        if (type === 'character') return { type, data: { name: node.label, role: '—', description: node.details, traits: [], backstory: '', notes: '', avatar: 'amber' } };
        if (type === 'location') return { type, data: { name: node.label, type: 'INT.', description: node.details, timeOfDay: 'NOITE', mood: '' } };
        if (type === 'object') return { type, data: { name: node.label, significance: node.details, description: '' } };
      }
    }
    return null;
  };

  // SharedSidebar callbacks
  const getNodeForEntity = (item, type) => {
    if (type === 'character') return nodes.find(n => n.type === 'character' && n.label === item.name);
    if (type === 'location') return nodes.find(n => n.type === 'location' && n.label === item.name);
    if (type === 'object') return nodes.find(n => n.type === 'object' && n.label === item.name);
    if (type === 'act') return nodes.find(n => n.type === 'act' && n.label === item.name);
    return null;
  };

  const handleSidebarEdit = (item, type) => {
    if (!item) {
      if (type === 'character') {
        const newChar = { id: `char-${Date.now()}`, name: 'Novo Personagem', role: 'Coadjuvante', traits: [], description: '', backstory: '', notes: '', avatar: 'amber' };
        setFichaModal({ item: newChar, type: 'character', mode: 'edit' });
      } else if (type === 'location') {
        const newLoc = { id: `loc-${Date.now()}`, name: 'Nova Locação', type: 'EXT.', description: '', timeOfDay: 'DIA', mood: '', group: '' };
        setFichaModal({ item: newLoc, type: 'location', mode: 'edit' });
      } else if (type === 'object') {
        const newObj = { id: `obj-${Date.now()}`, name: 'Novo Objeto', description: '', significance: '', group: '' };
        setFichaModal({ item: newObj, type: 'object', mode: 'edit' });
      } else if (type === 'scene') {
        const newScene = { id: `scene-${Date.now()}`, title: 'Nova Cena', synopsis: '', actId: '', order: 0, status: 'rascunho', characterIds: [], locationId: '', timeOfDay: '' };
        setFichaModal({ item: newScene, type: 'scene', mode: 'edit' });
      } else if (type === 'plot_point') {
        const newPp = { id: `pp-${Date.now()}`, name: 'Novo Plot Point', description: '', impact: '', storyArc: '' };
        setFichaModal({ item: newPp, type: 'plot_point', mode: 'edit' });
      } else if (type === 'theme') {
        const newTheme = { id: `theme-${Date.now()}`, name: 'Novo Tema', statement: '', description: '', tags: [] };
        setFichaModal({ item: newTheme, type: 'theme', mode: 'edit' });
      } else if (type === 'act') {
        const newAct = { id: `act-${Date.now()}`, name: 'Novo Ato', description: '', color: '#ccee00', order: 0 };
        setFichaModal({ item: newAct, type: 'act', mode: 'edit' });
      }
      return;
    }
    if (type === 'node' && item) {
      const newLabel = prompt('Rótulo do nó:', item.label || '');
      if (newLabel === null || newLabel.trim() === '') return;
      const newDetails = prompt('Detalhes:', item.details || '');
      const updated = nodes.map(n => n.id === item.id ? { ...n, label: newLabel.trim(), details: newDetails || '' } : n);
      setNodes(updated);
      setTimeout(() => updateMindMap(updated, links), 50);
    } else {
      setFichaModal({ item, type, mode: 'edit' });
    }
  };

  const handleSidebarDelete = (item, type) => {
    if (!item?.id) return;
    if (!window.confirm(`Excluir ${type} "${item.name}"?`)) return;
    if (type === 'character') {
      deleteCharacter(item.id);
      const node = getNodeForEntity(item, type);
      if (node) handleDeleteNode(node.id);
    } else if (type === 'location') {
      deleteLocation(item.id);
      const node = getNodeForEntity(item, type);
      if (node) handleDeleteNode(node.id);
    } else if (type === 'object') {
      deleteObject(item.id);
      const node = getNodeForEntity(item, type);
      if (node) handleDeleteNode(node.id);
    } else if (type === 'scene') {
      deleteEntityById('scenes', item.id);
    } else if (type === 'plot_point') {
      deleteEntityById('plot_points', item.id);
    } else if (type === 'theme') {
      deleteEntityById('themes', item.id);
    } else if (type === 'act') {
      deleteEntityById('acts', item.id);
    }
  };

  const handleSidebarSelect = (item, type) => {
    const node = getNodeForEntity(item, type);
    if (node) {
      setSelectedNodeId(node.id);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPan({ x: vw / 2 - node.x * zoom, y: vh / 2 - node.y * zoom });
    }
  };

  const handleSidebarSendToScript = (item) => {
    // For mind map, sending to script creates a screenplay element
    const proj = { ...currentProject };
    const scr = [...(proj.screenplay || [])];
    const newId = `sc-mm-${Date.now()}`;
    const label = item.name || item.title || item.statement || 'Item';
    const desc = item.description || item.evidence || item.context || '';
    if (item._bsCategory === 'scenes') {
      scr.push({ id: `${newId}-1`, type: 'scene-heading', text: label.toUpperCase() });
      if (desc) scr.push({ id: `${newId}-2`, type: 'action', text: desc });
    } else if (item._bsCategory === 'dialogues') {
      const speaker = item.speaker || 'PERSONAGEM';
      scr.push({ id: `${newId}-1`, type: 'character', text: speaker.toUpperCase() });
      scr.push({ id: `${newId}-2`, type: 'dialogue', text: item.line || desc });
    } else {
      scr.push({ id: newId, type: 'action', text: `${label}: ${desc}` });
    }
    updateScreenplay(scr);
    navigateTo('screenplay', newId);
  };

  const handleSidebarSendToMap = (item) => {
    // Already in the map, just select
    const node = nodes.find(n => n.label === (item.name || item.title || item.statement));
    if (node) {
      setSelectedNodeId(node.id);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPan({ x: vw / 2 - node.x * zoom, y: vh / 2 - node.y * zoom });
    }
  };

  const handleSaveFicha = (data) => {
    const t = fichaModal.type;
    if (t === 'character') saveCharacter(data);
    else if (t === 'location') saveLocation(data);
    else if (t === 'object') saveObject(data);
    else if (t === 'scene') saveEntity('scenes', data);
    else if (t === 'plot_point') saveEntity('plot_points', data);
    else if (t === 'theme') saveEntity('themes', data);
    else if (t === 'act') saveEntity('acts', data);
    setFichaModal(null);
  };

  const handleDeleteFicha = (id) => {
    if (!window.confirm('Excluir esta ficha?')) return;
    const t = fichaModal.type;
    if (t === 'character') deleteCharacter(id);
    else if (t === 'location') deleteLocation(id);
    else if (t === 'object') deleteObject(id);
    else if (t === 'scene') deleteEntityById('scenes', id);
    else if (t === 'plot_point') deleteEntityById('plot_points', id);
    else if (t === 'theme') deleteEntityById('themes', id);
    else if (t === 'act') deleteEntityById('acts', id);
    setFichaModal(null);
  };



  // Node deletion
  const handleDeleteNode = (id) => {
    const updatedNodes = nodes.filter(n => n.id !== id);
    const updatedLinks = links.filter(l => l.source !== id && l.target !== id);
    setNodes(updatedNodes);
    setLinks(updatedLinks);
    updateMindMap(updatedNodes, updatedLinks);
    setSelectedNodeId(null);
  };

  // Linking nodes
  const finishLinking = (targetId) => {
    if (linkSourceId && linkSourceId !== targetId) {
      const exists = links.some(l => 
        (l.source === linkSourceId && l.target === targetId) ||
        (l.source === targetId && l.target === linkSourceId)
      );

      if (!exists) {
        const newLink = {
          id: `l-${Date.now()}`,
          source: linkSourceId,
          target: targetId
        };
        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        updateMindMap(nodes, updatedLinks);
      }
    }
    setLinkSourceId(null);
    setTempLinkPos(null);
  };

  const getNodeColor = (type) => {
    return getColorForNodeType(type);
  };

  const groupedLocations = currentProject?.locations ? currentProject.locations.reduce((acc, loc) => {
    const groupName = loc.group || 'Geral';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(loc);
    return acc;
  }, {}) : {};

  const groupedObjects = currentProject?.objects ? currentProject.objects.reduce((acc, obj) => {
    const groupName = obj.group || 'Geral';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(obj);
    return acc;
  }, {}) : {};

  return (
    <div className="mindmap-container">
      <style>{`
        .mindmap-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          overflow: hidden;
          background-color: var(--bg-darkest);
        }
        .canvas-svg {
          flex: 1;
          min-width: 0;
          height: 100%;
          cursor: grab;
        }
        .canvas-svg:active {
          cursor: grabbing;
        }
        .node-circle {
          cursor: pointer;
          transition: r 0.2s ease, filter 0.2s ease;
        }
        .node-circle:hover {
          filter: brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.4));
        }
        .node-text {
          fill: #fff;
          font-weight: 500;
          pointer-events: none;
          font-size: 11px;
          text-shadow: 0 1px 4px #000;
        }
        .canvas-controls {
          position: absolute;
          bottom: 5rem;
          left: 1.5rem;
          display: flex;
          gap: 0.4rem;
          z-index: 10;
        }
        .canvas-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(15, 15, 20, 0.92);
          border: 1px solid rgba(255,255,255,0.15);
          color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          transition: all 0.15s ease;
        }
        .canvas-btn:hover {
          background: rgba(30, 30, 40, 0.95);
          border-color: rgba(255,255,255,0.25);
          color: #fff;
          transform: scale(1.05);
        }
        .canvas-btn:active {
          transform: scale(0.95);
        }
        .canvas-btn.accent {
          background: rgba(204, 238, 0, 0.12);
          border-color: rgba(204, 238, 0, 0.3);
          color: var(--primary-gold);
        }
        .canvas-btn.accent:hover {
          background: rgba(204, 238, 0, 0.2);
          border-color: rgba(204, 238, 0, 0.5);
          color: var(--primary-gold);
        }
        .canvas-btn-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          margin: 0 0.2rem;
        }
        .add-node-btn {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          z-index: 10;
        }
        .reference-sidebar {
          width: 380px;
          height: 100%;
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          background: rgba(10, 10, 14, 0.97);
          transition: all 0.3s ease;
          z-index: 20;
        }
        .reference-sidebar.closed {
          width: 0;
          border-left: none;
          overflow: hidden;
        }
        .sidebar-tabs {
          display: flex;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .sidebar-tab {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.6rem 0.2rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-tab:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.02);
        }
        .sidebar-tab.active {
          color: var(--primary-gold);
          border-bottom-color: var(--primary-gold);
          background: rgba(204, 238, 0, 0.04);
        }
        .sidebar-count {
          font-size: 9px;
          background: rgba(255,255,255,0.06);
          color: var(--text-muted);
          padding: 1px 5px;
          border-radius: 8px;
          font-weight: 700;
        }
        .sidebar-tab.active .sidebar-count {
          background: rgba(204, 238, 0, 0.12);
          color: var(--primary-gold);
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .sidebar-card {
          padding: 0.75rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .sidebar-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
          transform: translateX(2px);
        }
        .sidebar-card.active {
          border-color: rgba(204, 238, 0, 0.3);
          background: rgba(204, 238, 0, 0.04);
          box-shadow: 0 0 12px rgba(204, 238, 0, 0.06);
        }
        .sidebar-card-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .sidebar-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }
        .avatar-amber { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.35); }
        .avatar-purple { background: rgba(139,92,246,0.2); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.35); }
        .avatar-red { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.35); }
        .avatar-green { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.35); }
        .avatar-location { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .avatar-object { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
        .sidebar-card-info {
          flex: 1;
          min-width: 0;
        }
        .sidebar-card-name {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-card-role {
          font-size: 9px;
          text-transform: uppercase;
          color: var(--primary-gold);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .sidebar-card-type {
          font-size: 9px;
          font-family: monospace;
          color: #10b981;
          font-weight: 700;
        }
        .sidebar-edit-btn {
          background: none;
          border: 1px solid transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          flex-shrink: 0;
          opacity: 0;
        }
        .sidebar-card:hover .sidebar-edit-btn {
          opacity: 1;
        }
        .sidebar-edit-btn:hover {
          color: var(--primary-gold);
          border-color: rgba(204, 238, 0, 0.2);
          background: rgba(204, 238, 0, 0.08);
        }
        .sidebar-card-desc {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sidebar-traits {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        }
        .trait-tag {
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #9ca3af;
        }
        .trait-tag.more {
          background: rgba(204, 238, 0, 0.06);
          border-color: rgba(204, 238, 0, 0.15);
          color: var(--primary-gold);
        }
        .sidebar-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 9px;
          color: var(--text-muted);
          align-items: center;
        }
        .empty-state {
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          padding: 2rem 0;
        }
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
          padding: 1rem;
        }
        .ficha-form {
          width: 100%;
          max-width: 500px;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .grid-line {
          stroke: rgba(255, 255, 255, 0.03);
          stroke-width: 1;
        }
        .connector-handle {
          cursor: crosshair;
          transition: r 0.15s ease;
        }
        .connector-handle:hover {
          r: 8;
        }
        .linking-active {
          cursor: crosshair !important;
        }
        .link-path {
          transition: d 0.2s ease, stroke 0.15s ease, stroke-width 0.15s ease;
        }
        .view-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.5rem 1rem;
          align-items: center;
        }
        .view-grid .label {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 13px;
        }
        .view-grid .value {
          color: #e5e7eb;
          font-weight: 700;
          font-size: 14px;
        }
        .trait-tag {
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #9ca3af;
        }
        .mobile-node-actions {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 25;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(10,10,14,0.95);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          padding: 0.4rem 0.8rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }
        .mobile-action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .mobile-action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .mobile-action-btn.primary {
          background: rgba(204,238,0,0.12);
          border-color: rgba(204,238,0,0.25);
          color: var(--primary-gold);
        }
        .mobile-action-btn.danger {
          color: #ef4444;
        }
        .mobile-action-btn.danger:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
        }
        .mobile-action-btn.active {
          background: rgba(204,238,0,0.15);
          border-color: var(--border-color-active);
          color: var(--primary-gold);
        }

        /* Placing Node Mode */
        .canvas-svg.placing-node {
          cursor: crosshair !important;
        }
        .canvas-svg.placing-node #grid-background {
          cursor: crosshair !important;
        }
        .canvas-svg.placing-node .node-group {
          pointer-events: none;
        }
        .canvas-svg.placing-node .node-group .node-circle {
          opacity: 0.5;
        }
        .canvas-svg.placing-node .node-group .connector {
          display: none;
        }
        @media(max-width: 768px) {
          .reference-sidebar {
            display: none !important;
          }
          .mobile-node-actions {
            display: flex !important;
          }
        }

        /* ── Modal refinements (ScreenplayTab pattern) ── */
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: none;
          border: none;
          color: var(--primary-gold);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .back-btn:hover {
          background: rgba(204, 238, 0, 0.08);
        }
        .modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          flex: 1;
        }
        .form-modal-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .form-body-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        .form-grid-cols {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-footer {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .field-group label {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }
        .field-group input,
        .field-group select,
        .field-group textarea {
          padding: 0.6rem 0.8rem;
          font-size: 14px;
          border-radius: 6px;
          background: var(--bg-input);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          transition: border-color 0.2s;
          width: 100%;
        }
        .field-group input:focus,
        .field-group select:focus,
        .field-group textarea:focus {
          outline: none;
          border-color: var(--primary-gold);
          box-shadow: 0 0 0 2px rgba(204,238,0,0.12);
        }
        .field-group textarea {
          resize: vertical;
          font-family: var(--font-ui);
          line-height: 1.5;
        }
        .field-row {
          display: flex;
          gap: 0.75rem;
        }
        .form-modal {
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>

      {/* SVG Drawing Canvas */}
<svg
        ref={svgRef}
        className={`canvas-svg ${linkSourceId ? 'linking-active' : ''} ${isPlacingNode ? 'placing-node' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Infinite Grid Background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212, 163, 89, 0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <defs>
          <marker id="arrow-dim" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(212, 163, 89, 0.35)" />
          </marker>
          <marker id="arrow-hover" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(212, 163, 89, 0.7)" />
          </marker>
          <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" />
          </marker>
        </defs>

        <rect id="grid-background" width="100%" height="100%" fill="url(#grid)" />

        {/* Viewport Transform Group (Pan/Zoom) */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Links / Connections */}
          {(() => {
            // Count how many edges share each source-target pair
            const edgeCount = new Map();
            links.forEach(l => {
              const key = [l.source, l.target].sort().join('->');
              edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
            });
            const edgeIndex = new Map();

            return links.map((link) => {
              const sourceNode = nodes.find(n => n.id === link.source);
              const targetNode = nodes.find(n => n.id === link.target);
              if (!sourceNode || !targetNode) return null;
              const isSelected = link.id === selectedLinkId;
              const isHovered = link.id === hoveredLinkId;

              // Calculate offset for overlapping edges
              const key = [link.source, link.target].sort().join('->');
              const count = edgeCount.get(key) || 1;
              const idx = edgeIndex.get(key) || 0;
              edgeIndex.set(key, idx + 1);

              const offset = count > 1 ? (idx - (count - 1) / 2) * 12 : 0;

              // Curved path with offset
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curvature = Math.min(dist * 0.15, 40);

              // Perpendicular offset direction
              const nx = -dy / (dist || 1);
              const ny = dx / (dist || 1);

              const sx0 = sourceNode.x + nx * offset;
              const sy0 = sourceNode.y + ny * offset;
              const tx0 = targetNode.x + nx * offset;
              const ty0 = targetNode.y + ny * offset;

              const mx = (sx0 + tx0) / 2;
              const my = (sy0 + ty0) / 2;
              const cx = mx + nx * curvature;
              const cy = my + ny * curvature;

              // Adjust endpoints to stop at node edge
              const srcR = sourceNode.type === 'act' ? 28 : 22;
              const tgtR = targetNode.type === 'act' ? 28 : 22;

              // Tangent at start: from start to control
              const sDx = cx - sx0, sDy = cy - sy0;
              const sLen = Math.max(Math.sqrt(sDx * sDx + sDy * sDy), 0.1);
              const sx = sx0 + (sDx / sLen) * srcR;
              const sy = sy0 + (sDy / sLen) * srcR;

              // Tangent at end: from control to target (points toward target)
              const tDx = tx0 - cx, tDy = ty0 - cy;
              const tLen = Math.max(Math.sqrt(tDx * tDx + tDy * tDy), 0.1);
              const tx = tx0 - (tDx / tLen) * tgtR;
              const ty = ty0 - (tDy / tLen) * tgtR;

              const pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;

              return (
                <g key={link.id}>
                  {/* Invisible wider path for easier clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20 / zoom}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    onMouseEnter={() => setHoveredLinkId(link.id)}
                    onMouseLeave={() => setHoveredLinkId(null)}
                  />
                   {/* Visible path */}
                  <path
                    d={pathD}
                    className="link-path"
                    fill="none"
                    stroke={
                      isSelected ? '#ef4444' : 
                      isHovered ? 'rgba(212, 163, 89, 0.8)' : 
                      link.type === 'relationship' ? 'rgba(139, 92, 246, 0.6)' : 
                      'rgba(212, 163, 89, 0.55)'
                    }
                    strokeWidth={isSelected ? 4 / zoom : isHovered ? 4 / zoom : link.type === 'relationship' ? 2.5 / zoom : 3.5 / zoom}
                    strokeDasharray={isSelected ? "none" : link.type === 'relationship' ? "3 3" : "none"}
                    markerEnd={isSelected ? "url(#arrow-selected)" : isHovered ? "url(#arrow-hover)" : "url(#arrow-dim)"}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    onMouseEnter={() => setHoveredLinkId(link.id)}
                    onMouseLeave={() => setHoveredLinkId(null)}
                  />
                  {/* Delete button on selected link */}
                  {isSelected && (
                    <g
                      onClick={(e) => { e.stopPropagation(); handleDeleteLink(link.id); }}
                      style={{ cursor: 'pointer' }}
                      transform={`translate(${mx}, ${my - 20 / zoom})`}
                    >
                      <circle r={12 / zoom} fill="#ef4444" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={`${12 / zoom}px`}
                        fontWeight="bold"
                      >
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            });
          })()}

          {/* Act background strips */}
          {currentProject.entities?.acts?.map(act => {
            const actNodes = nodes.filter(n => {
              const resolved = resolveNodeDisplay(n, currentProject);
              return resolved.entity?.actId === act.id || n.entityId === act.id;
            });
            if (actNodes.length === 0) return null;
            const minX = Math.min(...actNodes.map(n => n.x)) - 80;
            const maxX = Math.max(...actNodes.map(n => n.x)) + 80;
            const stripWidth = maxX - minX;
            const svgHeight = 2000;
            return (
              <g key={act.id}>
                <rect
                  x={minX}
                  y={-100}
                  width={stripWidth}
                  height={svgHeight}
                  fill={act.color}
                  opacity={0.03}
                  rx={8}
                />
                <text
                  x={minX + 12}
                  y={-60}
                  fill={act.color}
                  opacity={0.4}
                  fontSize="20"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {act.name}
                </text>
              </g>
            );
          })}

          {/* Node Render Loop */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isLinkingSource = node.id === linkSourceId;
            const isHovered = node.id === hoveredNodeId;
            const display = resolveNodeDisplay(node, currentProject);
            const nodeColor = display.color;
            const displayType = display.type;
            const nodeRadius = displayType === 'act' ? 28 : 22;
            const connectorRadius = 6;

            return (
              <g 
                key={node.id}
                data-node-id={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Outer Glow Ring for selection */}
                {isSelected && (
                  <circle
                    r={nodeRadius + 8}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}

                {/* Node Main Circle */}
                <circle
                  className="node-circle"
                  r={nodeRadius}
                  fill={isLinkingSource ? '#fff' : nodeColor}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="3"
                  filter={isSelected ? `drop-shadow(0 0 10px ${nodeColor})` : 'none'}
                />

                {/* Inner symbol for category */}
                <circle
                  r="6"
                  fill="rgba(0,0,0,0.3)"
                />

                {/* Node Label Text */}
                <text
                  className="node-text"
                  textAnchor="middle"
                  y={displayType === 'act' ? 42 : 36}
                >
                  {display.label}
                </text>

                {/* Connector handle for drag-to-connect */}
                {(isHovered || isSelected || linkSourceId) && (
                  <g
                    onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
                    className="connector-handle"
                  >
                    <circle
                      r={connectorRadius}
                      fill={linkSourceId ? 'rgba(239, 68, 68, 0.9)' : 'rgba(212, 163, 89, 0.9)'}
                      stroke="#fff"
                      strokeWidth="1.5"
                      style={{ transition: 'fill 0.15s, r 0.15s' }}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontSize="8"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      +
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* Temporary line while linking */}
          {linkSourceId && tempLinkPos && (
            (() => {
              const sourceNode = nodes.find(n => n.id === linkSourceId);
              if (!sourceNode) return null;
              const dx = tempLinkPos.x - sourceNode.x;
              const dy = tempLinkPos.y - sourceNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curvature = Math.min(dist * 0.15, 40);
              const nx = -dy / (dist || 1);
              const ny = dx / (dist || 1);
              const mx = (sourceNode.x + tempLinkPos.x) / 2;
              const my = (sourceNode.y + tempLinkPos.y) / 2;
              const cx = mx + nx * curvature;
              const cy = my + ny * curvature;
              return (
                <path
                  d={`M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${tempLinkPos.x} ${tempLinkPos.y}`}
                  fill="none"
                  stroke="rgba(212, 163, 89, 0.6)"
                  strokeWidth={3 / zoom}
                  strokeDasharray="6 3"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()
          )}
        </g>
      </svg>

      {/* Floating Canvas Action buttons */}
      <div className="canvas-controls">
        <button onClick={handleZoomIn} className="canvas-btn" title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} className="canvas-btn" title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <button onClick={handleResetPan} className="canvas-btn" title="Centralizar visualização">
          <Maximize size={18} />
        </button>
        <button onClick={handleReloadFromProject} className="canvas-btn" title="Recarregar nós do projeto">
          <RefreshCw size={18} />
        </button>
        <div className="canvas-btn-divider" />
        <button onClick={handleAutoArrange} className="canvas-btn accent" title="Auto-organizar nós">
          <Layout size={18} />
        </button>
        <button onClick={() => setShowHistoryModal(true)} className="canvas-btn accent" title="Histórico de Versões">
          <Clock size={18} />
        </button>
      </div>

      {/* Linking mode hint */}
      {linkSourceId && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-lg px-4 py-2 text-xs text-yellow-300 flex items-center gap-2">
            <Link size={14} />
            Conectando: clique em outro nó ou solte no conector (+) para finalizar
            <button 
              onClick={() => { setLinkSourceId(null); setTempLinkPos(null); }}
              className="text-yellow-400 hover:text-yellow-300 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Selected connection hint */}
      {selectedLinkId && (
        <div className="absolute top-1.5 right-1/2 translate-x-1/2 z-10">
          <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-2 text-xs text-red-300 flex items-center gap-2">
            <Unlink size={14} />
            Conexão selecionada — clique no ✕ para removê-la
            <button 
              onClick={() => setSelectedLinkId(null)}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => {
          setPendingNodeData({
            label: newNodeLabel || 'Novo Nó',
            type: newNodeType,
            details: newNodeDetails,
          });
          setIsPlacingNode(true);
        }} 
        className="add-node-btn btn-primary py-2 px-3 text-xs flex items-center gap-1"
        data-onboarding="mindmap-add-node"
      >
        <Plus size={14} /> Novo Nó
      </button>

      {/* Shared Sidebar */}
      <SharedSidebar
        currentProject={currentProject}
        activeTab={sharedSidebarTab}
        onTabChange={setSharedSidebarTab}
        onEdit={handleSidebarEdit}
        onDelete={handleSidebarDelete}
        onSelectItem={handleSidebarSelect}
        onSendToScript={handleSidebarSendToScript}
        onSendToMap={handleSidebarSendToMap}
        tabContext="mindmap"
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* ── Mobile: Floating action bar ── */}
      {selectedNode && (() => {
        const sd = resolveNodeDisplay(selectedNode, currentProject);
        return (
          <div className="mobile-node-actions">
            {sd.entity && (
              <button
                onClick={() => setFichaModal({ item: sd.entity, type: sd.entityType === 'characters' ? 'character' : sd.entityType === 'locations' ? 'location' : sd.entityType === 'objects' ? 'object' : sd.entityType === 'scenes' ? 'scene' : sd.entityType === 'plot_points' ? 'plot_point' : sd.entityType === 'themes' ? 'theme' : sd.entityType === 'acts' ? 'act' : 'character', mode: 'view' })}
                className="mobile-action-btn" title="Ver Ficha"
              >
                <FileText size={16} />
              </button>
            )}
            <button onClick={() => handleSidebarEdit(selectedNode, 'node')} className="mobile-action-btn primary" title="Editar Rótulo">
              <Edit size={16} />
            </button>
            <button onClick={() => handleDeleteNode(selectedNode.id)} className="mobile-action-btn danger" title="Excluir nó">
              <Trash size={16} />
            </button>
            <button onClick={() => setSelectedNodeId(null)} className="mobile-action-btn" title="Fechar">
              <X size={16} />
            </button>
          </div>
        );
      })()}

      {pendingNodeData && isPlacingNode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-lg text-black text-sm font-medium flex items-center gap-2 animate-pulse">
          <span>Modo Posicionamento</span>
          <span className="px-2 py-0.5 bg-black/30 rounded text-xs">{pendingNodeData.type}</span>
          <span>|</span>
          <button onClick={() => { setIsPlacingNode(false); setPendingNodeData(null); }} className="ml-2 px-2 py-0.5 bg-black/30 hover:bg-black/50 rounded text-xs">Cancelar</button>
        </div>
      )}

      {/* Shared Ficha Modal */}
      {fichaModal && (
        <FichaModal
          item={fichaModal.item}
          type={fichaModal.type}
          mode={fichaModal.mode}
          acts={currentProject?.entities?.acts || []}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
          onClose={() => setFichaModal(null)}
          onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
        />
      )}

      {/* Modal: Version History */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="form-modal glass bg-black/95 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal-header">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="back-btn">
                <ArrowLeft size={20} />
                <span>Voltar</span>
              </button>
              <h3 className="modal-title">Histórico de Versões</h3>
            </div>

            <div className="form-body-scroll flex flex-col gap-4">
              {/* Form to save manual restore point */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-yellow-500">Criar Versão Manual</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newVersionName} 
                    onChange={e => setNewVersionName(e.target.value)} 
                    placeholder="Ex: Antes de reescrever..." 
                    className="p-1.5 bg-gray-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-yellow-500 flex-1"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      saveVersion(newVersionName);
                      setNewVersionName('');
                    }}
                    className="btn-primary py-1 px-3 text-xs font-bold rounded"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {/* List of saved versions */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Versões Disponíveis ({currentProject.history?.length || 0}/10)</h4>
                
                {(!currentProject.history || currentProject.history.length === 0) ? (
                  <p className="text-xs text-gray-500 text-center py-4 italic">Nenhum ponto de restauração disponível.</p>
                ) : (
                  currentProject.history.map(v => (
                    <div key={v.id} className="bg-white/2 hover:bg-white/5 border border-white/5 rounded-lg p-2.5 flex items-center justify-between transition-colors">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-gray-200 truncate">{v.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(v.timestamp).toLocaleDateString('pt-BR')} às {new Date(v.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja restaurar a versão "${v.name}"? O estado atual será salvo como um backup.`)) {
                            restoreVersion(v.id);
                            setShowHistoryModal(false);
                          }
                        }}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-bold rounded border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="form-footer">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="btn-secondary">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
