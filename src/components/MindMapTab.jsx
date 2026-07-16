import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { ZoomIn, ZoomOut, Maximize, Plus, Link, Trash, Edit, X, Unlink, User, MapPin, FileText, Edit3, Clock, ArrowLeft, Layout, RefreshCw, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import SharedSidebar from './SharedSidebar';
import FichaModal from './FichaModal';
import ConfirmModal from './ConfirmModal';
import PromptModal from './PromptModal';
import { resolveNodeDisplay, createNodeWithEntity, getColorForNodeType } from '../lib/mindMapUtils';
import { createEntity, findEntityInProject } from '../context/EntitiesSchema';
import './MindMapTab.css';

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
    const targetNode = nodes.find(n => n.id === tabNavigation.targetId || n.label === tabNavigation.targetId || n.entityId === tabNavigation.targetId);
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
  const [sidebarPosition, setSidebarPosition] = useState('right');
  const [sharedSidebarTab, setSharedSidebarTab] = useState('characters');
  const [fichaModal, setFichaModal] = useState(null); // { item, type, mode }
  const [confirmModal, setConfirmModal] = useState(null);
  const [promptModal, setPromptModal] = useState(null);
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

  // Map node type (singular) to entity type (plural)
  const nodeTypeToEntityType = {
    character: 'characters',
    location: 'locations',
    object: 'objects',
    scene: 'scenes',
    plot_point: 'plot_points',
    dialogue: 'dialogues',
    world_element: 'world_elements',
    theme: 'themes',
    act: 'acts',
  };

  // Clean nodes for save: only store { id, entityId, x, y } for entity-linked nodes
  const cleanNodesForSave = (nodes) => nodes.map(n => {
    if (n.entityId) return { id: n.id, entityId: n.entityId, x: n.x, y: n.y };
    return n;
  });

  // Drag node or pan canvas handler
  const handleMouseDown = (e) => {
    // If we're in node placing mode, create the node at click position
    if (isPlacingNode && pendingNodeData) {
      const { x, y } = getSvgCoords(e.clientX, e.clientY);
      const nodeType = pendingNodeData.type || 'scene';
      const entityType = nodeTypeToEntityType[nodeType] || 'scenes';
      const entityData = createEntity(entityType, { name: pendingNodeData.label || 'Novo Nó', description: pendingNodeData.details || '', title: pendingNodeData.label || 'Novo Nó' });
      saveEntity(entityType, entityData);
      const newNode = createNodeWithEntity(entityData, entityType, x, y);
      setNodes(prev => [...prev, newNode]);
      setIsPlacingNode(false);
      setPendingNodeData(null);
      updateMindMap(cleanNodesForSave([...nodes, newNode]), links);
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
      updateMindMap(cleanNodesForSave(nodes), links);
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
    const nodeDisplay = resolveNodeDisplay(node, currentProject);
    if (nodeDisplay.type === 'character') setActiveFichaTab('characters');
    else if (nodeDisplay.type === 'location') setActiveFichaTab('locations');
    else if (nodeDisplay.type === 'object') setActiveFichaTab('objects');

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
    const nDisplay = resolveNodeDisplay(n, currentProject);
    if (nDisplay?.type === 'character') setActiveFichaTab('characters');
    else if (nDisplay?.type === 'location') setActiveFichaTab('locations');
    else if (nDisplay?.type === 'object') setActiveFichaTab('objects');
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
    updateMindMap(cleanNodesForSave(nodes), updatedLinks);
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
      const nodeType = pendingNodeData.type || 'scene';
      const entityType = nodeTypeToEntityType[nodeType] || 'scenes';
      const entityData = createEntity(entityType, { name: pendingNodeData.label || 'Novo Nó', description: pendingNodeData.details || '', title: pendingNodeData.label || 'Novo Nó' });
      saveEntity(entityType, entityData);
      const newNode = createNodeWithEntity(entityData, entityType, x, y);
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      updateMindMap(cleanNodesForSave(updatedNodes), links);
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
    updateMindMap(cleanNodesForSave(updatedNodes), links);
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

  // Get entity for a node using entityId
  const getEntityForNode = (node) => {
    if (!node?.entityId) return null;
    const result = findEntityInProject(currentProject, node.entityId);
    if (result) {
      const { type, data } = result;
      const shortType = type === 'characters' ? 'character' : type === 'locations' ? 'location' : type === 'objects' ? 'object' : type === 'scenes' ? 'scene' : type === 'plot_points' ? 'plot_point' : type === 'dialogues' ? 'dialogue' : type === 'world_elements' ? 'world_element' : type === 'themes' ? 'theme' : type === 'acts' ? 'act' : null;
      return shortType ? { type: shortType, data } : null;
    }
    return null;
  };

  // SharedSidebar callbacks
  const getNodeForEntity = (item, type) => {
    return nodes.find(n => {
      if (!n.entityId) return false;
      const display = resolveNodeDisplay(n, currentProject);
      return display.entity?.id === item.id;
    });
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
      setPromptModal({ title: 'Editar Nó', message: 'Rótulo do nó:', initialValue: item.label || '', onConfirm: (newValue) => {
        // If node has entityId, update the entity instead
        if (item.entityId) {
          const entityType = findEntityInProject(currentProject, item.entityId)?.type;
          if (entityType) {
            saveEntity(entityType, { id: item.entityId, name: newValue.trim(), title: newValue.trim() });
            setPromptModal(null);
            return;
          }
        }
        setPromptModal({ title: 'Editar Nó', message: 'Detalhes:', initialValue: item.details || '', onConfirm: (newDetails) => { const updated = nodes.map(n => n.id === item.id ? { ...n, label: newValue.trim(), details: newDetails || '' } : n); setNodes(updated); setTimeout(() => updateMindMap(cleanNodesForSave(updated), links), 50); setPromptModal(null); }, onCancel: () => setPromptModal(null) });
      }, onCancel: () => setPromptModal(null) });
      return;
    } else {
      setFichaModal({ item, type, mode: 'edit' });
    }
  };

  const handleSidebarDelete = (item, type) => {
    if (!item?.id) return;
    setConfirmModal({ title: 'Excluir', message: `Excluir ${type} "${item.name}"?`, variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => { performSidebarDelete(item, type); setConfirmModal(null); }, onCancel: () => setConfirmModal(null) });
  };
  const performSidebarDelete = (item, type) => {
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
    const node = getNodeForEntity(item);
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
    setConfirmModal({ title: 'Excluir Ficha', message: 'Excluir esta ficha?', variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => { performDeleteFicha(id); setConfirmModal(null); }, onCancel: () => setConfirmModal(null) });
    return;
  };
  const performDeleteFicha = (id) => {
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
    const nodeToDelete = nodes.find(n => n.id === id);
    // If node has entityId, also delete the entity
    if (nodeToDelete?.entityId) {
      const found = findEntityInProject(currentProject, nodeToDelete.entityId);
      if (found) deleteEntityById(found.type, found.data.id);
    }
    const updatedNodes = nodes.filter(n => n.id !== id);
    const updatedLinks = links.filter(l => l.source !== id && l.target !== id);
    setNodes(updatedNodes);
    setLinks(updatedLinks);
    updateMindMap(cleanNodesForSave(updatedNodes), updatedLinks);
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
        updateMindMap(cleanNodesForSave(nodes), updatedLinks);
      }
    }
    setLinkSourceId(null);
    setTempLinkPos(null);
  };

  const getNodeColor = (type) => {
    return getColorForNodeType(type);
  };

  const groupedLocations = currentProject?.entities?.locations ? currentProject.entities.locations.reduce((acc, loc) => {
    const groupName = loc.group || 'Geral';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(loc);
    return acc;
  }, {}) : {};

  const groupedObjects = currentProject?.entities?.objects ? currentProject.entities.objects.reduce((acc, obj) => {
    const groupName = obj.group || 'Geral';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(obj);
    return acc;
  }, {}) : {};

  if (!currentProject) {
    return (
      <div className="mindmap-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '14px' }}>Nenhum projeto selecionado</div>
        <div style={{ fontSize: '12px', color: '#555' }}>Crie ou selecione um projeto para usar o Mapa Mental</div>
      </div>
    );
  }

  let vpLeft = -Infinity, vpTop = -Infinity, vpRight = Infinity, vpBottom = Infinity;
  const inView = (n) => n && n.x >= vpLeft && n.x <= vpRight && n.y >= vpTop && n.y <= vpBottom;

  return (
    <div className="mindmap-container">

      {/* Viewport bounds for culling */}
      {(() => {
        const r = svgRef.current?.getBoundingClientRect();
        const margin = 300;
        vpLeft = r ? (-pan.x / zoom) - margin : -Infinity;
        vpTop = r ? (-pan.y / zoom) - margin : -Infinity;
        vpRight = r ? vpLeft + (r.width / zoom) + margin * 2 : Infinity;
        vpBottom = r ? vpTop + (r.height / zoom) + margin * 2 : Infinity;
        return null;
      })()}

      {/* SVG Drawing Canvas */}
      <svg className="mindmap-canvas" data-onboarding="mindmap-canvas">
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
        {/* Viewport bounds for culling */}
        {(() => {
          const r = svgRef.current?.getBoundingClientRect();
          const margin = 300;
          vpLeft = r ? (-pan.x / zoom) - margin : -Infinity;
          vpTop = r ? (-pan.y / zoom) - margin : -Infinity;
          vpRight = r ? vpLeft + (r.width / zoom) + margin * 2 : Infinity;
          vpBottom = r ? vpTop + (r.height / zoom) + margin * 2 : Infinity;
          return null;
        })()}
        {/* Infinite Grid Background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(204, 238, 0, 0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <defs>
          <marker id="arrow-dim" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(204, 238, 0, 0.35)" />
          </marker>
          <marker id="arrow-hover" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(204, 238, 0, 0.7)" />
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
            // Viewport culling: only render links connected to visible nodes
            const svgRect = svgRef.current?.getBoundingClientRect();
            const margin = 200;
            const vLeft = svgRect ? (-pan.x / zoom) - margin : -Infinity;
            const vTop = svgRect ? (-pan.y / zoom) - margin : -Infinity;
            const vRight = svgRect ? vLeft + (svgRect.width / zoom) + margin * 2 : Infinity;
            const vBottom = svgRect ? vTop + (svgRect.height / zoom) + margin * 2 : Infinity;
            const inView = (n) => n.x >= vLeft && n.x <= vRight && n.y >= vTop && n.y <= vBottom;
            const visibleLinks = links.filter(l => {
              const sn = nodes.find(n => n.id === l.source);
              const tn = nodes.find(n => n.id === l.target);
              return sn && tn && (inView(sn) || inView(tn));
            });

            // Count how many edges share each source-target pair
            const edgeCount = new Map();
            visibleLinks.forEach(l => {
              const key = [l.source, l.target].sort().join('->');
              edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
            });
            const edgeIndex = new Map();

            return visibleLinks.map((link) => {
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
              const srcDisplay = resolveNodeDisplay(sourceNode, currentProject);
              const tgtDisplay = resolveNodeDisplay(targetNode, currentProject);
              const srcR = srcDisplay.type === 'act' ? 28 : 22;
              const tgtR = tgtDisplay.type === 'act' ? 28 : 22;

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
                      isHovered ? 'rgba(204, 238, 0, 0.8)' : 
                      link.type === 'relationship' ? 'rgba(139, 92, 246, 0.6)' : 
                      'rgba(204, 238, 0, 0.55)'
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
          {nodes.filter(n => inView(n)).map((node) => {
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
                    data-onboarding="mindmap-connector"
                  >
                    <circle
                      r={connectorRadius}
                      fill={linkSourceId ? 'rgba(239, 68, 68, 0.9)' : 'rgba(204, 238, 0, 0.9)'}
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
                  stroke="rgba(204, 238, 0, 0.6)"
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
      {currentProject && (
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
          position={sidebarPosition}
          onPositionToggle={() => setSidebarPosition(prev => prev === 'right' ? 'left' : 'right')}
        />
      )}

      {/* ── Mobile: Floating action bar ── */}
      {selectedNode && (() => {
        const sd = resolveNodeDisplay(selectedNode, currentProject);
        return (
          <div className="mobile-node-actions">
            {sd.entity && (
              <button
                onClick={() => setFichaModal({ item: sd.entity, type: sd.entityType === 'characters' ? 'character' : sd.entityType === 'locations' ? 'location' : sd.entityType === 'objects' ? 'object' : sd.entityType === 'scenes' ? 'scene' : sd.entityType === 'plot_points' ? 'plot_point' : sd.entityType === 'dialogues' ? 'dialogue' : sd.entityType === 'world_elements' ? 'world_element' : sd.entityType === 'themes' ? 'theme' : sd.entityType === 'acts' ? 'act' : 'character', mode: 'view' })}
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
          onNavigateToMindMap={(id) => navigateTo('mindmap', id)}
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
                        onClick={() => setConfirmModal({ title: 'Restaurar Versão', message: `Tem certeza que deseja restaurar a versão "${v.name}"? O estado atual será salvo como um backup.`, variant: 'danger', confirmLabel: 'Restaurar', onConfirm: () => { restoreVersion(v.id); setShowHistoryModal(false); setConfirmModal(null); }, onCancel: () => setConfirmModal(null) })}
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

      {confirmModal && <ConfirmModal {...confirmModal} />}
      {promptModal && <PromptModal {...promptModal} />}
      <SharedSidebar
        currentProject={currentProject}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onEdit={(item, type, mode) => openFicha(item, type, mode)}
        onNavigateToMindMap={(id) => navigateTo('mindmap', id)}
        onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
        onSelectItem={(item, type) => openFicha(item, type)}
        tabContext="mindmap"
        data-onboarding="mindmap-sidebar"
      />
    </div>
    <div className="mindmap-tab-container" data-onboarding="mindmap-tab">
  );
}
