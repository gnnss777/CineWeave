import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { getLLMApiKey } from '../lib/llm';
import { exportFountain, downloadFountain } from '../lib/fountainExport';
import { parseFountain } from '../lib/fountainImport';
import { exportScreenplayPDF } from '../lib/pdfExport';
import FichaModal from './FichaModal';
import { 
  User, MapPin, Columns, FileText, Edit3,
  Sparkles, Printer, Plus, Download, Upload,
  X, HelpCircle, BookOpen, Minimize2, 
  Trash2, BarChart2, Cpu, Grid, Layers,
  Compass, ShieldAlert, Award, Target, Heart
} from 'lucide-react';

/* ── Beat‑compatible 8‑level Production Revision System ── */
const REVISION_GENERATIONS = [
  { level: 0, name: 'Roteiro Branco',   color: '#3b82f6', marker: '*',  hex: '#3b82f6', label: 'Blue Revision' },
  { level: 1, name: 'Roteiro Rosa',     color: '#ec4899', marker: '**', hex: '#ec4899', label: 'Pink Revision' },
  { level: 2, name: 'Roteiro Amarelo',  color: '#f59e0b', marker: '+',  hex: '#f59e0b', label: 'Yellow Revision' },
  { level: 3, name: 'Roteiro Verde',    color: '#10b981', marker: '++', hex: '#10b981', label: 'Green Revision' },
  { level: 4, name: 'Roteiro Dourado',  color: '#d4a359', marker: '@',  hex: '#d4a359', label: 'Goldenrod Revision' },
  { level: 5, name: 'Roteiro Creme',    color: '#f3f4f6', marker: '@@', hex: '#f3f4f6', label: 'Buff Revision' },
  { level: 6, name: 'Roteiro Salmão',   color: '#f87171', marker: '#',  hex: '#f87171', label: 'Rose Revision' },
  { level: 7, name: 'Roteiro Cereja',   color: '#be123c', marker: '##', hex: '#be123c', label: 'Cherry Revision' },
];

const BEAT_BLOCK_RE = /\/\*\s*BEAT:\s*({[\s\S]*?})\s*END_BEAT\s*\*\//;

const parseBeatMetadata = (screenplay) => {
  if (!screenplay || !screenplay.length) return {};
  const last = screenplay[screenplay.length - 1];
  if (!last || last.type !== 'beat-metadata') return {};
  const match = last.text.match(BEAT_BLOCK_RE);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
};

const generateBeatBlock = (metadata) => {
  const json = JSON.stringify(metadata, null, 2);
  return `/* If you're seeing this, you can remove the following stuff - BEAT:\n${json}\nEND_BEAT*/`;
};

export default function ScreenplayTab() {
  const { 
    currentProject, 
    updateScreenplay, 
    saveCharacter, 
    saveLocation, 
    saveObject,
    deleteCharacter,
    deleteLocation,
    deleteObject,
    saveEntity,
    deleteEntityById,
    navigateTo,
    tabNavigation
  } = useProject();

  const [elements, setElements] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('outliner');
  const [zenMode, setZenMode] = useState(false);
  const [paperTheme, setPaperTheme] = useState('dark');
  
  const [fichaModal, setFichaModal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiTone, setAiTone] = useState('dramatico');
  const [showCompileModal, setShowCompileModal] = useState(false);
  const [outlinerSearch, setOutlinerSearch] = useState('');

  /* ── Beat‑compatible Revision Mode ── */
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionGeneration, setRevisionGeneration] = useState(0);
  const [revisions, setRevisions] = useState([]);

  /* ── Novel Mode (Modo Romance) ── */
  const [novelMode, setNovelMode] = useState(false);

  const [autocomplete, setAutocomplete] = useState({
    show: false, suggestions: [], index: 0, x: 0, y: 0, blockId: '', type: '' 
  });

  const [activeBlockMenu, setActiveBlockMenu] = useState({ show: false, blockId: '', index: 0, x: 0, y: 0 });

  /* ── Simulated Plugins ── */
  const [selectedPlugin, setSelectedPlugin] = useState('linter');
  const [pluginLog, setPluginLog] = useState([]);
  const [pluginRunning, setPluginRunning] = useState(false);

  const elementRefs = useRef({});
  const autocompleteRef = useRef(null);
  const blockTexts = useRef({});
  const ceInitSet = useRef(new Set());
  const fountainInputRef = useRef(null);
  const [pendingAutoTypes, setPendingAutoTypes] = useState({});

  const handleFountainExport = () => {
    const content = exportFountain(currentProject);
    downloadFountain(content, currentProject.title);
  };

  const handlePDFExport = () => {
    exportScreenplayPDF(currentProject);
  };

  const handleFountainImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fountainText = ev.target.result;
      const imported = parseFountain(fountainText);
      saveScreenplay(imported);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /* Load BEAT metadata on init */
  useEffect(() => {
    if (currentProject) {
      const els = currentProject.screenplay || [];
      setElements(els);
      const meta = parseBeatMetadata(els);
      if (meta['Revision Mode'] !== undefined) setRevisionMode(meta['Revision Mode']);
      if (meta['Revision Level'] !== undefined) setRevisionGeneration(meta['Revision Level']);
      if (meta['NovelMode'] !== undefined) setNovelMode(meta['NovelMode']);
    }
  }, [currentProject]);

  const saveScreenplay = (updatedElements) => {
    const entities = currentProject.entities;
    const withoutMeta = updatedElements.filter(el => el.type !== 'beat-metadata');

    const linked = withoutMeta.map(el => {
      if (el.entityId) return el;
      if (el.type === 'scene-heading') {
        const text = el.text.toUpperCase().trim();
        const matchingScene = entities?.scenes?.find(s =>
          s.title.toUpperCase() === text
        );
        if (matchingScene) return { ...el, entityId: matchingScene.id };
        const loc = entities?.locations?.find(l =>
          l.name.toUpperCase() === text || `${l.type} ${l.name}`.toUpperCase() === text
        );
        if (loc) return { ...el, entityId: loc.id };
      }
      if (el.type === 'character') {
        const charName = el.text.trim().toUpperCase();
        const matchingChar = entities?.characters?.find(c =>
          c.name.toUpperCase() === charName
        );
        if (matchingChar) return { ...el, entityId: matchingChar.id };
      }
      return el;
    });

    const meta = {
      'Revision Level': revisionGeneration,
      'Revision Mode': revisionMode,
      'NovelMode': novelMode,
      'BlockRevisions': revisions.reduce((acc, id) => { acc[id] = revisionGeneration; return acc; }, {}),
      'CharacterGenders': (currentProject.characters || []).reduce((acc, c) => {
        const gender = (c.notes || '').toLowerCase().includes('feminino') ? 'Feminino' : 'Masculino';
        acc[c.name.toUpperCase()] = gender;
        return acc;
      }, {}),
      'DocumentStyle': novelMode ? 'novel' : 'screenplay'
    };
    const metaBlock = { id: 'beat-metadata', type: 'beat-metadata', text: generateBeatBlock(meta) };
    setElements([...linked, metaBlock]);
    updateScreenplay([...linked, metaBlock]);
  };

  useEffect(() => {
    if (!tabNavigation || tabNavigation.tab !== 'screenplay' || !tabNavigation.targetId) return;
    setActiveTab('editor');
    const targetId = tabNavigation.targetId;
    let targetEl;
    if (elementRefs.current[targetId]) {
      targetEl = elementRefs.current[targetId];
    } else {
      const matched = elements.find(el =>
        el.type === 'character' && el.text && el.text.toLowerCase().includes(targetId.toLowerCase())
      );
      if (matched && elementRefs.current[matched.id]) {
        targetEl = elementRefs.current[matched.id];
      }
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.focus({ preventScroll: true });
      targetEl.style.outline = '2px solid #ccee00';
      targetEl.style.outlineOffset = '2px';
      setTimeout(() => {
        targetEl.style.outline = '';
        targetEl.style.outlineOffset = '';
      }, 2000);
    }
  }, [tabNavigation, elements]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveBlockMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const focusBlock = (blockId, position = 'end') => {
    setTimeout(() => {
      const el = elementRefs.current[blockId];
      if (!el) return;
      el.focus();
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        if (position === 'start') range.collapse(true);
        else if (position === 'end') range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (_) {}
    }, 20);
  };

  const closeAutocomplete = () => {
    setAutocomplete(prev => ({ ...prev, show: false }));
  };

  const applyAutocomplete = (value) => {
    const { blockId, type } = autocomplete;
    const formatted = value.toUpperCase();
    const updated = elements.map(item =>
      item.id === blockId ? { ...item, text: formatted } : item
    );
    saveScreenplay(updated);
    closeAutocomplete();
    focusBlock(blockId, 'end');
    if (type === 'character') {
      const idx = elements.findIndex(el => el.id === blockId);
      const nextEl = elements[idx + 1];
      if (nextEl && (nextEl.type === 'dialogue' || nextEl.type === 'parenthetical')) {
        focusBlock(nextEl.id, 'start');
      } else {
        const newDialogue = {
          id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'dialogue', text: ''
        };
        const updatedWithDialogue = [...updated];
        updatedWithDialogue.splice(idx + 1, 0, newDialogue);
        saveScreenplay(updatedWithDialogue);
        focusBlock(newDialogue.id, 'start');
      }
    }
  };

  const triggerAutocomplete = (id, text, overrideType) => {
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;
    const type = overrideType || currentEl.type;
    if (type === 'character') {
      const query = text.trim().toUpperCase();
      if (query.length > 0) {
        const matching = currentProject.characters
          .filter(c => c.name.toUpperCase().startsWith(query))
          .map(c => c.name);
        if (matching.length > 0) {
          const activeEl = elementRefs.current[id];
          if (activeEl) {
            const rect = activeEl.getBoundingClientRect();
            setAutocomplete({
              show: true, suggestions: matching, index: 0,
              x: rect.left, y: rect.bottom + window.scrollY,
              blockId: id, type: 'character'
            });
          }
        } else { closeAutocomplete(); }
      } else { closeAutocomplete(); }
    } else if (type === 'scene-heading') {
      const query = text.trim().toUpperCase();
      if (query.length > 0) {
        const prefixes = ['INT.', 'EXT.', 'INT./EXT.'];
        const matchedPrefixes = prefixes.filter(p => p.startsWith(query) && p !== query);
        const matchedLocations = currentProject.locations
          .filter(l => l.name.toUpperCase().startsWith(query) || `${l.type} ${l.name}`.toUpperCase().startsWith(query))
          .map(l => `${l.type} ${l.name.toUpperCase()}`);
        const matching = [...matchedPrefixes, ...matchedLocations];
        if (matching.length > 0) {
          const activeEl = elementRefs.current[id];
          if (activeEl) {
            const rect = activeEl.getBoundingClientRect();
            setAutocomplete({
              show: true, suggestions: matching, index: 0,
              x: rect.left, y: rect.bottom + window.scrollY,
              blockId: id, type: 'location'
            });
          }
        } else { closeAutocomplete(); }
      } else { closeAutocomplete(); }
    } else { closeAutocomplete(); }
  };

  /* ── All‑caps‑until‑parenthesis check (Beat‑compatible) ── */
  const isAllCapsUntilParen = (str) => {
    if (!str || str.trim().length < 3) return false;
    let within = false;
    let hasLetter = false;
    for (const ch of str) {
      if (ch === '(') within = true;
      else if (ch === ')') within = false;
      else if (!within && ch.toLowerCase() !== ch.toUpperCase()) {
        hasLetter = true;
        if (ch !== ch.toUpperCase()) return false;
      }
    }
    return hasLetter;
  };

  const getPrevEl = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    return idx > 0 ? { el: elements[idx - 1], index: idx - 1 } : null;
  };
  const getNextEl = (id) => {
    const idx = elements.findIndex(el => el.id === id);
    return idx >= 0 && idx < elements.length - 1 ? { el: elements[idx + 1], index: idx + 1 } : null;
  };

  /* ── Local draft text (no re-render on keystroke) ── */
  const handleInput = (id, text) => {
    blockTexts.current[id] = text;
    if (revisionMode) {
      setRevisions(prev => [...new Set([...prev, id])]);
    }
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;
    const trimmed = text.trim();
    const trimmedUpper = trimmed.toUpperCase();
    const prev = getPrevEl(id);
    const prevEmpty = !prev || !prev.el.text || prev.el.text.trim() === '';
    const next = getNextEl(id);
    const nextEmpty = !next || !next.el.text || next.el.text.trim() === '';

    /* ── @ forced character cue ── */
    if (text.startsWith('@') && currentEl.type !== 'character') {
      const clean = text.slice(1);
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'character' }));
      const el = elementRefs.current[id];
      if (el) el.innerText = clean;
      return;
    }

    /* ── . forced scene heading ── */
    if (text.startsWith('.') && currentEl.type !== 'scene-heading') {
      const clean = text.slice(1);
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'scene-heading' }));
      const el = elementRefs.current[id];
      if (el) el.innerText = clean;
      return;
    }

    /* 1. Scene heading (INT/EXT/I/E, must have empty line before) */
    if (currentEl.type !== 'scene-heading' && prevEmpty) {
      const headingPrefixes = ['INT.', 'EXT.', 'I/E.', 'INT/EXT.', 'INT./EXT.', 'E/I.', 'E./I.'];
      const startsWithPrefix = headingPrefixes.some(p => trimmedUpper.startsWith(p));
      if (startsWithPrefix) {
        const formatted = trimmedUpper;
        blockTexts.current[id] = formatted;
        setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'scene-heading' }));
        const el = elementRefs.current[id];
        if (el && el.innerText !== formatted) el.innerText = formatted;
        triggerAutocomplete(id, formatted, 'scene-heading');
        return;
      }
    }

    /* 2. Transition (> prefix) */
    if (currentEl.type !== 'transition' && text.startsWith('>')) {
      const clean = text.replace(/^>/, '').toUpperCase();
      blockTexts.current[id] = clean;
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'transition' }));
      const el = elementRefs.current[id];
      if (el && el.innerText !== clean) el.innerText = clean;
      return;
    }

    /* 3. Transition (all-caps + ends with TO:, preceded by empty) */
    if (currentEl.type !== 'transition' && prevEmpty && isAllCapsUntilParen(trimmed) && / TO:$/.test(trimmed.toUpperCase())) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'transition' }));
      triggerAutocomplete(id, text, 'transition');
      return;
    }

    /* 4. Character (all-caps, ≥3 chars, preceded by empty, next NOT empty) */
    if (currentEl.type !== 'character' && prevEmpty && !nextEmpty && isAllCapsUntilParen(trimmed)) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'character' }));
      triggerAutocomplete(id, text, 'character');
      return;
    }

    /* 5. Parenthetical (starts with (, previous is char/dialogue/paren and not empty) */
    const dialogueBlockTypes = ['character', 'dialogue', 'parenthetical'];
    if (currentEl.type !== 'parenthetical' && text.startsWith('(') && prev && dialogueBlockTypes.includes(prev.el.type) && !prevEmpty) {
      setPendingAutoTypes(prev2 => ({ ...prev2, [id]: 'parenthetical' }));
      return;
    }

    triggerAutocomplete(id, text);
  };

  const handleBlur = (id) => {
    const text = blockTexts.current[id];
    const pendingType = pendingAutoTypes[id];
    if (text !== undefined || pendingType) {
      const updated = elements.map(el =>
        el.id === id ? { ...el, text: text !== undefined ? text : el.text, ...(pendingType ? { type: pendingType } : {}) } : el
      );
      saveScreenplay(updated);
    }
    setPendingAutoTypes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleKeyDown = (e, index, el) => {
    const text = blockTexts.current[el.id] !== undefined ? blockTexts.current[el.id] : el.text;
    if (autocomplete.show) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, index: (prev.index + 1) % prev.suggestions.length })); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, index: (prev.index - 1 + prev.suggestions.length) % prev.suggestions.length })); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyAutocomplete(autocomplete.suggestions[autocomplete.index]); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeAutocomplete(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      e.preventDefault();
      const typeMap = { '1': 'scene-heading', '2': 'action', '3': 'character', '4': 'parenthetical', '5': 'dialogue', '6': 'transition' };
      const nextType = typeMap[e.key];
      let formattedText = text;
      if (nextType === 'scene-heading' || nextType === 'character') formattedText = text.toUpperCase();
      blockTexts.current[el.id] = formattedText;
      ceInitSet.current.delete(el.id);
      const updated = elements.map(item => item.id === el.id ? { ...item, type: nextType, text: formattedText } : item);
      saveScreenplay(updated);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const caretOffset = preCaretRange.toString().length;
        const part1 = text.slice(0, caretOffset);
        const part2 = text.slice(caretOffset);
        let nextType = 'action';
        if (el.type === 'scene-heading') nextType = 'action';
        else if (el.type === 'character') nextType = 'dialogue';
        else if (el.type === 'parenthetical') nextType = 'dialogue';
        else if (el.type === 'dialogue') nextType = 'action';
        const newEl = { id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: nextType, text: part2 };
        const updated = [...elements];
        updated[index] = { ...el, text: part1 };
        updated.splice(index + 1, 0, newEl);
        blockTexts.current[el.id] = part1;
        ceInitSet.current.delete(el.id);
        saveScreenplay(updated);
        focusBlock(newEl.id, 'start');
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const types = ['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];
      const currentIndex = types.indexOf(el.type);
      const nextIndex = (currentIndex + (e.shiftKey ? -1 : 1) + types.length) % types.length;
      const nextType = types[nextIndex];
      let formattedText = text;
      if (nextType === 'scene-heading' || nextType === 'character') formattedText = text.toUpperCase();
      blockTexts.current[el.id] = formattedText;
      ceInitSet.current.delete(el.id);
      const updated = elements.map(item => item.id === el.id ? { ...item, type: nextType, text: formattedText } : item);
      saveScreenplay(updated);
      return;
    }
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const isAtStart = preCaretRange.toString().length === 0;
        if (isAtStart) {
          e.preventDefault();
          if (index > 0) {
            const previousEl = elements[index - 1];
            const prevId = previousEl.id;
            const prevLength = previousEl.text.length;
            const mergedText = previousEl.text + text;
            const updated = elements.filter(item => item.id !== el.id);
            updated[index - 1] = { ...previousEl, text: mergedText };
            ceInitSet.current.delete(prevId);
            saveScreenplay(updated);
            setTimeout(() => {
              const prevNode = elementRefs.current[prevId];
              if (prevNode) {
                prevNode.focus();
                const newRange = document.createRange();
                const sel = window.getSelection();
                if (prevNode.firstChild) {
                  const targetOffset = Math.min(prevLength, prevNode.firstChild.length || 0);
                  try { newRange.setStart(prevNode.firstChild, targetOffset); newRange.setEnd(prevNode.firstChild, targetOffset); } catch (_) { newRange.selectNodeContents(prevNode); newRange.collapse(false); }
                } else { newRange.selectNodeContents(prevNode); newRange.collapse(false); }
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            }, 30);
          }
          return;
        }
      }
    }
    if (e.key === 'ArrowUp') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const isAtStart = preCaretRange.toString().length === 0;
        if (isAtStart && index > 0) { e.preventDefault(); focusBlock(elements[index - 1].id, 'end'); }
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const postCaretRange = range.cloneRange();
        postCaretRange.selectNodeContents(e.target);
        postCaretRange.setStart(range.endContainer, range.endOffset);
        const isAtEnd = postCaretRange.toString().trim() === '';
        if (isAtEnd && index < elements.length - 1) { e.preventDefault(); focusBlock(elements[index + 1].id, 'start'); }
      }
      return;
    }
  };

  const addLineAtEnd = (type) => {
    const newEl = { id: `sc-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, text: type === 'scene-heading' ? 'INT. NOVO CENÁRIO - DIA' : '' };
    const updated = [...elements, newEl];
    saveScreenplay(updated);
    focusBlock(newEl.id, 'end');
  };

  const findMatchingCharacter = (nameText) => {
    if (!nameText || !currentProject || !currentProject.characters) return null;
    const cleanText = nameText.trim().toUpperCase();
    return currentProject.characters.find(char => cleanText === char.name.toUpperCase() || char.name.toUpperCase().includes(cleanText));
  };

  const handleGripClick = (e, blockId, index) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveBlockMenu({ show: true, blockId, index, x: rect.left - 180, y: rect.bottom + window.scrollY });
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const moveBlockDown = (index) => {
    if (index === elements.length - 1) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const duplicateBlock = (index) => {
    const updated = [...elements];
    const block = updated[index];
    const duplicated = { ...block, id: `sc-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    updated.splice(index + 1, 0, duplicated);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const deleteBlock = (index) => {
    const updated = elements.filter((_, i) => i !== index);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const changeBlockType = (index, nextType) => {
    const updated = elements.map((item, i) => i === index ? { ...item, type: nextType } : item);
    saveScreenplay(updated);
    setActiveBlockMenu(prev => ({ ...prev, show: false }));
  };

  const handleAIAutoComplete = async (blockId) => {
    const key = getLLMApiKey();
    if (!key) { alert('Por favor, configure sua chave de API nas configurações do CineWeave para usar a IA.'); return; }
    setAiLoading(true); setAiError('');
    try {
      const currentIdx = elements.findIndex(el => el.id === blockId);
      const contextSlice = elements.slice(Math.max(0, currentIdx - 4), currentIdx + 1);
      const formattedContext = contextSlice.map(item => `${item.type.toUpperCase()}: ${item.text}`).join('\n');
      const systemPrompt = `Você é um co-roteirista profissional.\nEscreva a continuação do roteiro. Adicione exatamente 2 ou 3 novos elementos que continuem a história de forma orgânica.\nUse o contexto de personagens e locações do projeto para manter a coerência.\nPERSONAGENS CADASTRADOS: ${currentProject.characters.map(c => c.name).join(', ')}\nLOCAÇÕES CADASTRADAS: ${currentProject.locations.map(l => l.name).join(', ')}\n\nRetorne APENAS um array JSON válido contendo os novos elementos, no formato exato:\n[\n  { "type": "action" | "character" | "parenthetical" | "dialogue", "text": "..." }\n]\nNÃO retorne markdown, NÃO adicione blocos de código com \`\`\`, e NÃO insira textos introdutórios ou explicativos. Apenas o JSON puro.`;
      const userPrompt = `Abaixo está o final da cena escrita até agora. Escreva os próximos 2-3 blocos do roteiro de forma brilhante e cinematográfica:\n\n${formattedContext}`;
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 500, top_p: 0.95 })
      });
      if (!res.ok) throw new Error(`Falha no servidor de IA: código ${res.status}`);
      const data = await res.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';
      let cleanedJsonStr = aiResponse.trim();
      if (cleanedJsonStr.startsWith('```')) cleanedJsonStr = cleanedJsonStr.replace(/```(json)?/g, '').trim();
      const parsedNewElements = JSON.parse(cleanedJsonStr);
      if (Array.isArray(parsedNewElements)) {
        const enriched = parsedNewElements.map(item => ({ ...item, id: `sc-line-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
        const updated = [...elements];
        updated.splice(currentIdx + 1, 0, ...enriched);
        saveScreenplay(updated);
        focusBlock(enriched[0].id, 'start');
      }
    } catch (err) { console.error(err); setAiError('Ocorreu um erro ao gerar. Verifique seu formato ou tente novamente.'); }
    finally { setAiLoading(false); }
  };

  const handleAIImproveBlock = async (blockId) => {
    const key = getLLMApiKey();
    if (!key) { alert('Chave de API NVIDIA não configurada.'); return; }
    const block = elements.find(el => el.id === blockId);
    if (!block || !block.text.trim()) return;
    setAiLoading(true); setAiError('');
    try {
      const systemPrompt = `Você é um refinador de roteiros profissional de Hollywood.\nReescreva a linha fornecida para torná-la incrível, cinemática e com o tom: "${aiTone.toUpperCase()}".\nMantenha o tipo de elemento original (${block.type.toUpperCase()}).\nRetorne APENAS o texto reescrito final, sem aspas adicionais, sem markdown e sem qualquer explicação prévia.`;
      const userPrompt = `Reescreva esta fala/ação para o tom ${aiTone}:\n"${block.text}"`;
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.8, max_tokens: 300 })
      });
      if (!res.ok) throw new Error('AI Error code ' + res.status);
      const data = await res.json();
      const updatedText = (data.choices?.[0]?.message?.content || block.text).trim().replace(/^"|"$/g, '');
      const updated = elements.map(el => el.id === blockId ? { ...el, text: updatedText } : el);
      saveScreenplay(updated);
    } catch (err) { console.error(err); setAiError('Erro ao refinar bloco.'); }
    finally { setAiLoading(false); }
  };

  const [aiFeedback, setAiFeedback] = useState(null);
  const handleAIFeedback = async () => {
    const key = getLLMApiKey();
    if (!key) { alert('Configure sua chave de API NVIDIA primeiro.'); return; }
    setAiLoading(true); setAiError(''); setAiFeedback(null);
    try {
      const text = elements.filter(el => el.type !== 'beat-metadata').map(el => `${el.type.toUpperCase()}: ${el.text}`).join('\n');
      const systemPrompt = 'Você é um analista de roteiros profissional. Analise o roteiro abaixo e forneça feedback sobre: estrutura, ritmo, diálogo, personagens, formatação. Seja específico e construtivo. Responda em português.';
      const res = await fetch('/api/nvidia/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'meta/llama-3.1-70b-instruct', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.5, max_tokens: 800 })
      });
      if (!res.ok) throw new Error('AI Error code ' + res.status);
      const data = await res.json();
      setAiFeedback(data.choices?.[0]?.message?.content || 'Sem retorno.');
    } catch (err) { console.error(err); setAiError('Erro ao obter feedback.'); }
    finally { setAiLoading(false); }
  };

  /* ── Page estimator & scene list ── */
  const paginatedElements = useMemo(() => {
    let currentPage = 1;
    let score = 0;
    const items = [];
    elements.forEach((el, index) => {
      if (el.type === 'beat-metadata') return;
      let weight = 1;
      const textLength = el.text ? el.text.length : 0;
      if (el.type === 'scene-heading') weight = 4.5;
      else if (el.type === 'action') weight = Math.ceil(textLength / 65) + 1.2;
      else if (el.type === 'character') weight = 2.0;
      else if (el.type === 'parenthetical') weight = 1.2;
      else if (el.type === 'dialogue') weight = Math.ceil(textLength / 38) + 1.2;
      else if (el.type === 'transition') weight = 2.0;
      score += weight;
      if (score > 34 && index > 0) {
        items.push({ isPageBreak: true, pageNum: currentPage, nextPageNum: currentPage + 1 });
        currentPage++;
        score = weight;
      }
      items.push({ ...el, originalIndex: index, pageNum: currentPage });
    });
    return { items, totalPages: currentPage };
  }, [elements]);

  const sceneHeadingsList = useMemo(() => {
    const list = [];
    elements.forEach((el, index) => {
      if (el.type === 'scene-heading') {
        const text = el.text || '';
        const colorMatch = text.match(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/);
        const color = colorMatch ? colorMatch[1] : '#22252a';
        const cleanText = text.replace(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/g, '').replace(/#([^#]+)#/g, '').trim();
        const numMatch = text.match(/#([^#]+)#/);
        const sceneNum = numMatch ? numMatch[1] : (list.length + 1).toString();
        let sceneWords = 0;
        let j = index + 1;
        while (j < elements.length && elements[j].type !== 'scene-heading') {
          if (elements[j].text) sceneWords += elements[j].text.split(/\s+/).filter(Boolean).length;
          j++;
        }
        list.push({ id: el.id, text: el.text, cleanText, color, sceneNumber: sceneNum, words: sceneWords || 50, index });
      }
    });
    return list;
  }, [elements]);

  const storylines = useMemo(() => {
    const map = {};
    elements.forEach((el) => {
      if (!el.text) return;
      const matches = [...el.text.matchAll(/\[\[beat\s+([^\]]+)\]\]/gi)];
      matches.forEach(m => {
        const beatVal = m[1];
        let category = 'Geral', detail = beatVal;
        if (beatVal.includes(':')) { const split = beatVal.split(':'); category = split[0].trim(); detail = split[1].trim(); }
        else if (beatVal.includes(',')) { const split = beatVal.split(','); category = split[0].trim(); detail = split[1].trim(); }
        if (!map[category]) map[category] = [];
        map[category].push({ text: el.text, detail, type: el.type });
      });
    });
    return map;
  }, [elements]);

  const stats = useMemo(() => {
    let wordCount = 0, actionCount = 0, dialogueCount = 0;
    let characterLines = {}, characterWords = {};
    let locationsMap = { INT: 0, EXT: 0, Est: 0 };
    let timeOfDayMap = { DIA: 0, NOITE: 0, TARDE: 0, OUTRO: 0 };
    let femaleSpeakers = new Set();
    elements.forEach((el, idx) => {
      if (!el.text || el.type === 'beat-metadata') return;
      const words = el.text.split(/\s+/).filter(Boolean).length;
      wordCount += words;
      if (el.type === 'action') actionCount++;
      if (el.type === 'dialogue') dialogueCount++;
      if (el.type === 'character') {
        const charName = el.text.trim().toUpperCase();
        characterLines[charName] = (characterLines[charName] || 0) + 1;
        let j = idx + 1, dialogueWordsSum = 0;
        while (j < elements.length && (elements[j].type === 'dialogue' || elements[j].type === 'parenthetical')) {
          if (elements[j].text) dialogueWordsSum += elements[j].text.split(/\s+/).filter(Boolean).length;
          j++;
        }
        characterWords[charName] = (characterWords[charName] || 0) + dialogueWordsSum;
        const matchingChar = currentProject.characters.find(c => c.name.toUpperCase() === charName);
        if (matchingChar && (matchingChar.notes?.toLowerCase().includes('feminino') || matchingChar.description?.toLowerCase().includes('gata'))) {
          femaleSpeakers.add(charName);
        }
      }
      if (el.type === 'scene-heading') {
        const upper = el.text.toUpperCase();
        if (upper.includes('INT.')) locationsMap.INT++;
        else if (upper.includes('EXT.')) locationsMap.EXT++;
        else locationsMap.Est++;
        if (upper.includes('DIA')) timeOfDayMap.DIA++;
        else if (upper.includes('NOITE')) timeOfDayMap.NOITE++;
        else if (upper.includes('TARDE')) timeOfDayMap.TARDE++;
        else timeOfDayMap.OUTRO++;
      }
    });
    const charactersStats = Object.keys(characterLines).map(name => ({ name, lines: characterLines[name], words: characterWords[name] || 0 })).sort((a, b) => b.lines - a.lines);
    return {
      wordCount, pagesCount: paginatedElements.totalPages, estimatedMinutes: paginatedElements.totalPages,
      actionCount, dialogueCount, locationsMap, timeOfDayMap, charactersStats,
      femaleSpeakersCount: femaleSpeakers.size, bechdelPassed: femaleSpeakers.size >= 2
    };
  }, [elements, currentProject, paginatedElements]);

  const moveCard = (sceneIndex, direction) => {
    if (direction === 'up' && sceneIndex === 0) return;
    if (direction === 'down' && sceneIndex === sceneHeadingsList.length - 1) return;
    const swapIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    const targetScene = sceneHeadingsList[sceneIndex];
    const swapScene = sceneHeadingsList[swapIndex];
    const getSceneBlock = (headingIndex) => {
      const idx = elements.findIndex(el => el.id === headingIndex.id);
      let end = elements.length;
      for (let j = idx + 1; j < elements.length; j++) {
        if (elements[j].type === 'scene-heading') { end = j; break; }
      }
      return { start: idx, end };
    };
    const firstBlock = getSceneBlock(Math.min(sceneIndex, swapIndex) === sceneIndex ? targetScene : swapScene);
    const secondBlock = getSceneBlock(Math.max(sceneIndex, swapIndex) === sceneIndex ? targetScene : swapScene);
    const updated = [...elements];
    const firstPart = updated.slice(0, firstBlock.start);
    const firstBlockData = updated.slice(firstBlock.start, firstBlock.end);
    const middlePart = updated.slice(firstBlock.end, secondBlock.start);
    const secondBlockData = updated.slice(secondBlock.start, secondBlock.end);
    const lastPart = updated.slice(secondBlock.end);
    saveScreenplay([...firstPart, ...secondBlockData, ...middlePart, ...firstBlockData, ...lastPart]);
  };

  const changeCardColor = (sceneIndex, colorCode) => {
    const scene = sceneHeadingsList[sceneIndex];
    const cleanText = scene.text.replace(/\[\[(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\]\]/g, '').trim();
    const updated = elements.map(el => el.id === scene.id ? { ...el, text: `${cleanText} [[${colorCode}]]` } : el);
    saveScreenplay(updated);
  };

  const updateCardSynopsis = (sceneIndex, newSynopsisText) => {
    const scene = sceneHeadingsList[sceneIndex];
    const idx = elements.findIndex(el => el.id === scene.id);
    if (idx >= 0) {
      let synopsisIdx = -1;
      if (idx + 1 < elements.length && elements[idx + 1].type === 'synopsis') synopsisIdx = idx + 1;
      const updated = [...elements];
      if (synopsisIdx >= 0) {
        updated[synopsisIdx] = { ...updated[synopsisIdx], text: newSynopsisText };
      } else {
        updated.splice(idx + 1, 0, { id: `sc-syn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, type: 'synopsis', text: newSynopsisText });
      }
      saveScreenplay(updated);
    }
  };

  /* ── Simulated Beat Plugins ── */
  const runPlugin = () => {
    setPluginRunning(true);
    setPluginLog([`[Beat Plugin Engine] Inicializando plugin: ${selectedPlugin.toUpperCase()}...`]);
    let currentLogs = [];
    const log = (msg) => { currentLogs.push(msg); setPluginLog([...currentLogs]); };
    setTimeout(() => {
      if (selectedPlugin === 'linter') {
        log('[Slugline Linter] Buscando cabeçalhos despadronizados...');
        const updated = elements.map(el => {
          if (el.type === 'scene-heading') { const formatted = el.text.toUpperCase(); log(`[Normalizado] -> ${formatted}`); return { ...el, text: formatted }; }
          return el;
        });
        saveScreenplay(updated);
        log('[Sucesso] Todos os cabeçalhos foram colocados em CAIXA ALTA!');
      } else if (selectedPlugin === 'bechdel') {
        log('[Diversity Analyzer] Rodando varredura por diversidade...');
        log(`[Análise] Personagens Femininos Identificados: ${stats.femaleSpeakersCount}`);
        if (stats.bechdelPassed) log('[PASSED] Seu roteiro atende aos critérios do Teste de Bechdel-Wallace!');
        else { log('[FALHA] Seu roteiro não atende aos critérios do Teste de Bechdel.'); log('  Dica: Garanta ao menos duas personagens femininas com nome próprio conversando.'); }
      } else if (selectedPlugin === 'cleaner') {
        log('[Markup Cleaner] Eliminando blocos de diálogo e ação vazios...');
        const updated = elements.filter(el => el.text && el.text.trim() !== '');
        saveScreenplay(updated);
        log('[Sucesso] Roteiro limpo de linhas e blocos vazios indesejados.');
      }
      setPluginRunning(false);
    }, 1500);
  };

  /* ── Compile Screenplay from Brainstorm ── */
  const handleCompileScreenplay = () => {
    setAiLoading(true); setAiError(''); setShowCompileModal(false);
    setTimeout(() => {
      try {
        const bd = currentProject.brainstormData || {};
        const plotPoints = bd.plot_points || [];
        const bdScenes = bd.scenes || [];
        const dialogues = bd.dialogues || [];
        const compiledElements = [];
        compiledElements.push(
          { id: `tp-1`, type: 'title-page', key: 'title', value: currentProject.title || 'Smoke Ninja Cat', text: `Title: ${currentProject.title || 'Smoke Ninja Cat'}` },
          { id: `tp-2`, type: 'title-page', key: 'credit', value: 'Written by', text: 'Credit: Written by' },
          { id: `tp-3`, type: 'title-page', key: 'author', value: 'CineWeave Creator', text: 'Author: CineWeave Creator' },
          { id: `tp-4`, type: 'title-page', key: 'draft date', value: new Date().toLocaleDateString('pt-BR'), text: `Draft date: ${new Date().toLocaleDateString('pt-BR')}` }
        );
        const acts = ['I', 'II', 'III', 'IV'];
        acts.forEach(actStr => {
          const actPlots = plotPoints.filter(p => (p.act || 'I').toUpperCase() === actStr);
          const actScenes = bdScenes.filter(s => (s.act || 'I').toUpperCase() === actStr);
          if (actPlots.length > 0 || actScenes.length > 0) {
            compiledElements.push({ id: `sc-act-${actStr}`, type: 'section', level: 1, text: `ATO ${actStr}` });
            actPlots.forEach((plot, pIdx) => { compiledElements.push({ id: `sc-syn-act-${actStr}-${pIdx}`, type: 'synopsis', text: plot.description || plot.title }); });
            actScenes.forEach((scene, sIdx) => {
              const colors = ['green', 'blue', 'pink', 'purple'];
              const randColor = colors[sIdx % colors.length];
              const titleText = (scene.title || '').toUpperCase().startsWith('INT.') || (scene.title || '').toUpperCase().startsWith('EXT.') ? scene.title.toUpperCase() : `EXT. ${scene.title.toUpperCase() || 'LOCAL'} - DIA`;
              compiledElements.push(
                { id: `sc-h-${scene.id}`, type: 'scene-heading', text: `${titleText} [[${randColor}]]` },
                { id: `sc-a-${scene.id}`, type: 'action', text: scene.description || 'Descreva as ações da cena aqui.' }
              );
              const relevantDialogues = dialogues.filter(d => d.context && d.context.toLowerCase().includes((scene.title || '').toLowerCase()));
              if (relevantDialogues.length > 0) {
                relevantDialogues.forEach((d, dIdx) => {
                  compiledElements.push({ id: `sc-c-${scene.id}-${dIdx}`, type: 'character', text: d.speaker.toUpperCase() });
                  compiledElements.push({ id: `sc-d-${scene.id}-${dIdx}`, type: 'dialogue', text: d.line });
                });
              } else {
                compiledElements.push({ id: `sc-c-def-${scene.id}`, type: 'character', text: 'PERSONAGEM' });
                compiledElements.push({ id: `sc-d-def-${scene.id}`, type: 'dialogue', text: 'Fale algo marcante aqui.' });
              }
            });
          }
        });
        saveScreenplay(compiledElements);
        setActiveTab('editor');
        alert('Compilação concluída com sucesso! Seu roteiro foi estruturado em blocos.');
      } catch (err) { console.error(err); setAiError('Falha ao compilar roteiro.'); }
      finally { setAiLoading(false); }
    }, 1200);
  };

  const handlePrint = () => { window.print(); };

  const outlinerFilteredScenes = useMemo(() => {
    if (!outlinerSearch) return sceneHeadingsList;
    const q = outlinerSearch.toLowerCase();
    return sceneHeadingsList.filter(s => s.cleanText.toLowerCase().includes(q));
  }, [sceneHeadingsList, outlinerSearch]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'scene-heading': return 'CENA';
      case 'action': return 'AÇÃO';
      case 'character': return 'PERSONAGEM';
      case 'parenthetical': return 'PARÊNTESE';
      case 'dialogue': return 'DIÁLOGO';
      case 'transition': return 'TRANSIÇÃO';
      case 'section': return 'SEÇÃO';
      case 'synopsis': return 'SINOPSES';
      default: return 'AÇÃO';
    }
  };

  const getStyleForType = (type) => {
    switch (type) {
      case 'scene-heading': return 'script-scene-heading';
      case 'action': return 'script-action';
      case 'character': return 'script-character';
      case 'parenthetical': return 'script-parenthetical';
      case 'dialogue': return 'script-dialogue';
      case 'transition': return 'script-transition';
      default: return 'script-action';
    }
  };

  /* ── Novel Mode prose renderer ── */
  const renderNovelText = (el, index) => {
    if (el.type === 'scene-heading') {
      const clean = (el.text || '').replace(/\[\[.*?\]\]/g, '').replace(/#.*?#/g, '').trim();
      return <h3 key={el.id} className="novel-chapter-heading">CAPÍTULO {index + 1}: {clean}</h3>;
    }
    if (el.type === 'action') {
      return <p key={el.id} className="novel-paragraph">{el.text}</p>;
    }
    if (el.type === 'character') {
      return <p key={el.id} className="novel-dialogue-line"><em className="novel-speaker">{el.text}</em></p>;
    }
    if (el.type === 'dialogue') {
      return <p key={el.id} className="novel-dialogue-text">— {el.text}</p>;
    }
    if (el.type === 'parenthetical') {
      return <p key={el.id} className="novel-parenthetical"><em>({el.text.replace(/[()]/g, '')})</em></p>;
    }
    if (el.type === 'transition') {
      return <p key={el.id} className="novel-transition"><em>{el.text}</em></p>;
    }
    if (el.type === 'section') {
      return <h2 key={el.id} className="novel-section-heading">{el.text}</h2>;
    }
    if (el.type === 'synopsis') {
      return <p key={el.id} className="novel-synopsis"><em>{el.text}</em></p>;
    }
    return null;
  };

  /* ── Helper to get active revision gen ── */
  const activeGen = REVISION_GENERATIONS.find(g => g.level === revisionGeneration) || REVISION_GENERATIONS[0];

  /* ── FichaModal handlers + Beat integration ── */
  const openFicha = (item, type, mode = 'view') => {
    setFichaModal({ item, type, mode });
  };
  const handleFichaSave = (data) => {
    const t = fichaModal.type;
    if (t === 'character') saveCharacter(data);
    else if (t === 'location') saveLocation(data);
    else if (t === 'object') saveObject(data);
    else saveEntity(t + 's', data);

    if (revisionMode && data.id && elements) {
      const linkedIds = elements.filter(el => el.entityId === data.id).map(el => el.id);
      if (linkedIds.length > 0) {
        setRevisions(prev => [...new Set([...prev, ...linkedIds])]);
      }
    }
    setFichaModal(null);
  };
  const handleFichaDelete = (id) => {
    const t = fichaModal.type;
    if (t === 'character') deleteCharacter(id);
    else if (t === 'location') deleteLocation(id);
    else if (t === 'object') deleteObject(id);
    else deleteEntityById(t + 's', id);
    setFichaModal(null);
  };

  /* ── Entity matching helpers for Ficha badges ── */
  const findMatchingScene = (text) => {
    if (!text || !currentProject?.entities?.scenes) return null;
    const clean = text.trim().toUpperCase();
    return currentProject.entities.scenes.find(s => s.title.toUpperCase() === clean);
  };
  const findMatchingLocationFromHeading = (text) => {
    if (!text) return null;
    const clean = text.trim().toUpperCase();
    const all = [...(currentProject?.entities?.locations || []), ...(currentProject?.locations || [])];
    return all.find(l =>
      l.name.toUpperCase() === clean ||
      `${l.type || 'INT.'} ${l.name}`.toUpperCase() === clean
    );
  };

  return (
    <div className={`screenplay-layout-container ${zenMode ? 'zen-active' : ''}`} style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: '#050505', color: '#fff' }}>
      <style>{`
        .sidebar-panel {
          width: 320px;
          border-right: 1px solid #141419;
          background-color: #08080a;
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-panel.collapsed { width: 0; overflow: hidden; border-right: none; }
        .sidebar-tabs { display: flex; background: #020203; border-bottom: 1px solid #141419; }
        .sidebar-tab-btn {
          flex: 1; padding: 10px 4px; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; color: #7c7c82;
          background: none; border: none; border-bottom: 2px solid transparent;
          cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.2s;
        }
        .sidebar-tab-btn:hover { color: #fff; background: rgba(255,255,255,0.02); }
        .sidebar-tab-btn.active { color: #ccee00; border-bottom-color: #ccee00; background: rgba(204,238,0,0.05); }
        .workspace { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: #030303; position: relative; }
        .toolbar {
          height: 54px; border-bottom: 1px solid #141419; background-color: #08080a;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px; flex-shrink: 0;
        }
        .toolbar-tabs { display: flex; gap: 4px; }
        .toolbar-tab-btn {
          padding: 6px 14px; font-size: 11px; font-weight: 600; color: #8c8c94;
          background: none; border: 1px solid transparent; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .toolbar-tab-btn:hover { color: #fff; background-color: rgba(255,255,255,0.04); }
        .toolbar-tab-btn.active { color: #000; background-color: #ccee00; font-weight: 700; }
        .editor-container {
          flex: 1; position: relative; display: flex; flex-direction: column;
          overflow-y: auto; background: #050507; align-items: center; padding: 2rem 1rem 4rem 1rem;
        }
        .format-badge {
          font-family: var(--font-ui); font-size: 8px; font-weight: 800; letter-spacing: 0.1em;
          padding: 2px 5px; border-radius: 4px; opacity: 0; transition: opacity 0.2s ease;
          position: absolute; left: -95px; top: 8px; width: 90px; text-align: right;
          background-color: rgba(255,255,255,0.04); color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.08);
        }
        .script-element-wrapper { position: relative; width: 100%; }
        .script-element-wrapper:hover .format-badge, .script-element-wrapper:focus-within .format-badge { opacity: 0.8; }
        .script-element-actions-trigger {
          position: absolute; right: -100px; top: 4px; display: flex; align-items: center; gap: 4px;
          opacity: 0; transition: opacity 0.2s ease;
        }
        .script-element-wrapper:hover .script-element-actions-trigger, .script-element-wrapper:focus-within .script-element-actions-trigger { opacity: 1; }
        .corkboard {
          flex: 1; background-color: #030304; background-image: radial-gradient(#111 1px, transparent 1px);
          background-size: 20px 20px; padding: 24px; overflow-y: auto;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; align-content: start; width: 100%;
        }
        .index-card {
          background-color: #0a0a0d; border: 1px solid #1d1d24; border-radius: 8px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.4); display: flex; flex-direction: column;
          height: 200px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s;
        }
        .index-card:hover { transform: translateY(-2px); border-color: #ccee00; }
        .index-card-header { height: 32px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #141419; font-weight: 700; font-size: 11px; }
        .index-card-title { font-family: "Courier Prime", monospace; font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 8px; }
        .index-card-body { flex: 1; padding: 12px; font-size: 12px; color: #8e8e96; overflow-y: auto; font-style: italic; }
        .index-card-synopsis-textarea { width: 100%; height: 100%; background: none; border: none; resize: none; color: #eaeaea; font-size: 11px; line-height: 15px; outline: none; }
        .index-card-footer { height: 32px; padding: 0 12px; border-top: 1px solid #141419; display: flex; align-items: center; justify-content: space-between; }
        .color-dot { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
        .timeline-container { flex: 1; background: #050506; padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .timeline-track { display: flex; gap: 6px; padding-bottom: 12px; border-bottom: 1px solid #141419; overflow-x: auto; }
        .timeline-block { height: 60px; border-radius: 6px; padding: 8px; cursor: pointer; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }
        .timeline-block:hover { transform: translateY(-2px); filter: brightness(1.2); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 24px; }
        .stats-card { background-color: #08080a; border: 1px solid #141419; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
        .stats-number { font-size: 2.2rem; font-weight: 800; color: #ccee00; line-height: 1; }
        .zen-active .sidebar-panel { display: none !important; }
        .zen-active .toolbar { display: none !important; }
        
        /* Novel Mode Styles */
        .novel-container { max-width: 650px; margin: 0 auto; padding: 3rem 2rem; color: #e5e7eb; font-family: 'Georgia', serif; line-height: 1.8; }
        .novel-chapter-heading { font-size: 1.5rem; font-weight: bold; color: #ccee00; margin-top: 2.5rem; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(204,238,0,0.2); padding-bottom: 0.5rem; }
        .novel-section-heading { font-size: 1.2rem; font-weight: bold; color: #ccee00; margin-top: 2rem; margin-bottom: 1rem; }
        .novel-paragraph { margin-bottom: 1rem; text-indent: 1.5em; font-size: 1rem; color: #d1d5db; }
        .novel-dialogue-text { margin-bottom: 0.5rem; margin-left: 1.5rem; color: #e5e7eb; }
        .novel-speaker { font-weight: bold; color: #ccee00; font-style: normal; display: block; margin-top: 0.8rem; }
        .novel-parenthetical { margin-bottom: 0.3rem; margin-left: 1.5rem; color: #9ca3af; font-size: 0.9rem; }
        .novel-transition { text-align: center; font-style: italic; color: #6b7280; margin: 1.5rem 0; letter-spacing: 0.1em; }
        .novel-synopsis { font-style: italic; color: #9ca3af; margin: 1rem 0; border-left: 2px solid rgba(204,238,0,0.2); padding-left: 1rem; }
        
        /* Revision Star Marker */
        .revision-star {
          position: absolute;
          right: -28px;
          top: 6px;
          font-size: 14px;
          line-height: 1;
          font-weight: bold;
          user-select: none;
          pointer-events: none;
          opacity: 0.7;
        }
        .revision-star-bar {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 2px;
          opacity: 0.5;
        }
      `}</style>

      {/* ── Sidebar ── */}
      <div className={`sidebar-panel ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-tabs">
          <button onClick={() => setSidebarTab('outliner')} className={`sidebar-tab-btn ${sidebarTab === 'outliner' ? 'active' : ''}`} title="Estrutura de Cenas"><Columns size={16} /><span>Outliner</span></button>
          <button onClick={() => setSidebarTab('characters')} className={`sidebar-tab-btn ${sidebarTab === 'characters' ? 'active' : ''}`} title="Personagens"><User size={16} /><span>Personas</span></button>
          <button onClick={() => setSidebarTab('locations')} className={`sidebar-tab-btn ${sidebarTab === 'locations' ? 'active' : ''}`} title="Locacoes"><MapPin size={16} /><span>Locacoes</span></button>
          <button onClick={() => setSidebarTab('objects')} className={`sidebar-tab-btn ${sidebarTab === 'objects' ? 'active' : ''}`} title="Objetos de Cena"><FileText size={16} /><span>Objetos</span></button>
          <button onClick={() => setSidebarTab('scenes')} className={`sidebar-tab-btn ${sidebarTab === 'scenes' ? 'active' : ''}`} title="Cenas"><BookOpen size={16} /><span>Cenas</span></button>
          <button onClick={() => setSidebarTab('plot_points')} className={`sidebar-tab-btn ${sidebarTab === 'plot_points' ? 'active' : ''}`} title="Plot Points"><Target size={16} /><span>Plot Points</span></button>
          <button onClick={() => setSidebarTab('themes')} className={`sidebar-tab-btn ${sidebarTab === 'themes' ? 'active' : ''}`} title="Temas"><Heart size={16} /><span>Temas</span></button>
          <button onClick={() => setSidebarTab('acts')} className={`sidebar-tab-btn ${sidebarTab === 'acts' ? 'active' : ''}`} title="Atos"><Layers size={16} /><span>Atos</span></button>
          <button onClick={() => setSidebarTab('boneyard')} className={`sidebar-tab-btn ${sidebarTab === 'boneyard' ? 'active' : ''}`} title="Pilha de Descartes"><Trash2 size={16} /><span>Boneyard</span></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sidebarTab === 'outliner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Filtrar outliner..." value={outlinerSearch} onChange={e => setOutlinerSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '12px', background: '#020203', border: '1px solid #1d1d24', borderRadius: '6px', color: '#fff', outline: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {outlinerFilteredScenes.map((scene) => (
                  <div key={scene.id} onClick={() => focusBlock(scene.id, 'start')} style={{ padding: '10px', borderRadius: '6px', background: '#0a0a0d', borderLeft: `3px solid ${scene.color}`, cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '9px', color: '#ccee00', fontWeight: 'bold' }}>CENA {scene.sceneNumber}</span>
                      <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Courier Prime", monospace' }}>{scene.cleanText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sidebarTab === 'characters' && (
            <>
              <button onClick={() => openFicha({ name: '', role: 'Coadjuvante', description: '', traits: [], backstory: '', notes: '' }, 'character', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Novo Personagem</button>
              {currentProject.characters.map(char => (
                <div key={char.id} onClick={() => openFicha(char, 'character')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.15)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>{char.name ? char.name[0].toUpperCase() : '?'}</div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{char.name}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{char.role}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(char, 'character', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'locations' && (
            <>
              <button onClick={() => openFicha({ name: '', type: 'EXT.', description: '', timeOfDay: 'DIA', mood: '' }, 'location', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Nova Locacao</button>
              {currentProject.locations.map(loc => (
                <div key={loc.id} onClick={() => openFicha(loc, 'location')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={12} /></div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{loc.name}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{loc.type} • {loc.timeOfDay}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(loc, 'location', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'objects' && (
            <>
              <button onClick={() => openFicha({ name: '', description: '', significance: '' }, 'object', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Novo Objeto</button>
              {currentProject.objects.map(obj => (
                <div key={obj.id} onClick={() => openFicha(obj, 'object')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={12} /></div>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{obj.name}</h4>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(obj, 'object', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'boneyard' && (
            <div style={{ padding: '8px', background: 'rgba(255,0,0,0.03)', border: '1px solid rgba(255,0,0,0.1)', borderRadius: '8px' }}>
              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Boneyard Ativo</span>
              <p style={{ fontSize: '11px', color: '#7c7c82', lineHeight: '15px' }}>Adicione seoes ou linhas como <code># Boneyard</code> para listar fragmentos de descartes aqui.</p>
            </div>
          )}
          {sidebarTab === 'scenes' && (
            <>
              <button onClick={() => openFicha({ title: 'Nova Cena', synopsis: '', actId: '', order: 0, status: 'rascunho', characterIds: [], locationId: '', timeOfDay: '' }, 'scene', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Nova Cena</button>
              {(currentProject?.entities?.scenes || []).map(scene => (
                <div key={scene.id} onClick={() => openFicha(scene, 'scene')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={12} /></div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{scene.title}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{scene.synopsis ? scene.synopsis.substring(0, 50) : 'Sem sinopse'}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(scene, 'scene', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'plot_points' && (
            <>
              <button onClick={() => openFicha({ name: 'Novo Plot Point', description: '', impact: '', storyArc: '' }, 'plot_point', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Novo Plot Point</button>
              {(currentProject?.entities?.plot_points || []).map(pp => (
                <div key={pp.id} onClick={() => openFicha(pp, 'plot_point')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={12} /></div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{pp.name}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{pp.description ? pp.description.substring(0, 50) : ''}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(pp, 'plot_point', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'themes' && (
            <>
              <button onClick={() => openFicha({ name: 'Novo Tema', statement: '', description: '', tags: [] }, 'theme', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Novo Tema</button>
              {(currentProject?.entities?.themes || []).map(theme => (
                <div key={theme.id} onClick={() => openFicha(theme, 'theme')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={12} /></div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{theme.name}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{theme.statement ? theme.statement.substring(0, 50) : ''}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(theme, 'theme', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
          {sidebarTab === 'acts' && (
            <>
              <button onClick={() => openFicha({ name: 'Novo Ato', description: '', color: '#ccee00', order: 0 }, 'act', 'edit')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(204,238,0,0.08)', color: '#ccee00', border: '1px dashed rgba(204,238,0,0.3)', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} /> Novo Ato</button>
              {(currentProject?.entities?.acts || []).map(act => (
                <div key={act.id} onClick={() => openFicha(act, 'act')} style={{ padding: '12px', borderRadius: '8px', background: '#0a0a0d', border: '1px solid #141419', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(204,238,0,0.1)', color: '#ccee00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={12} /></div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{act.name}</h4>
                      <p style={{ fontSize: '10px', color: '#7c7c82' }}>{act.description ? act.description.substring(0, 50) : ''}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFicha(act, 'act', 'edit'); }} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer' }}><Edit3 size={12} /></button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Main workspace ── */}
      <div className="workspace">
        <div className="toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toolbar-tab-btn" title="Alternar Painel Lateral"><Columns size={16} /></button>
            <div className="toolbar-tabs">
              <button onClick={() => setActiveTab('editor')} className={`toolbar-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}><Edit3 size={14} /><span>Editor</span></button>
              <button onClick={() => setActiveTab('cards')} className={`toolbar-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}><Grid size={14} /><span>Fichas</span></button>
              <button onClick={() => setActiveTab('timeline')} className={`toolbar-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}><Layers size={14} /><span>Linha do Tempo</span></button>
              <button onClick={() => setActiveTab('stats')} className={`toolbar-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}><BarChart2 size={14} /><span>Estatisticas</span></button>
              <button onClick={() => setActiveTab('plugins')} className={`toolbar-tab-btn ${activeTab === 'plugins' ? 'active' : ''}`}><Cpu size={14} /><span>Plugins</span></button>
              <button onClick={() => setActiveTab('style')} className={`toolbar-tab-btn ${activeTab === 'style' ? 'active' : ''}`}><Compass size={14} /><span>Estilo & Revisao</span></button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              ref={fountainInputRef}
              type="file"
              accept=".fountain,.txt"
              onChange={handleFountainImport}
              style={{ display: 'none' }}
            />
            <button onClick={() => fountainInputRef.current.click()} className="toolbar-tab-btn" title="Importar .fountain"><Upload size={14} /><span>Importar</span></button>
            <button onClick={handleFountainExport} className="toolbar-tab-btn" title="Exportar .fountain"><Download size={14} /><span>Exportar</span></button>
            <button onClick={handlePDFExport} className="toolbar-tab-btn" title="Exportar PDF"><Printer size={14} /></button>
            <button onClick={handleAIFeedback} disabled={aiLoading} className="toolbar-tab-btn" title="Feedback da IA"><Award size={14} /><span>Feedback IA</span></button>
            <button onClick={() => setShowCompileModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}><Sparkles size={12} /><span>Compilar</span></button>
            <button onClick={() => setZenMode(!zenMode)} className={`toolbar-tab-btn ${zenMode ? 'active' : ''}`} title="Modo Zen Distracao Zero"><Minimize2 size={14} /></button>
          </div>
        </div>

        <div className={`editor-container ${paperTheme === 'light' ? 'light-theme' : ''}`}>
          
          {/* ── A. TEXT EDITOR ── */}
          {activeTab === 'editor' && (
            novelMode ? (
              <div className="novel-container">
                {elements.filter(el => el.type !== 'beat-metadata').length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#7c7c82' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '16px' }}>Modo Romance ativado. Escreva seu roteiro em prosa literaria.</p>
                  </div>
                ) : (
                  elements.map((el, index) => {
                    if (el.type === 'beat-metadata') return null;
                    return renderNovelText(el, index);
                  })
                )}
                <div style={{ position: 'fixed', bottom: '24px', background: 'rgba(8,8,10,0.95)', border: '1px solid #141419', borderRadius: '30px', padding: '6px 16px', display: 'flex', gap: '8px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Capitulo</button>
                  <button onClick={() => addLineAtEnd('action')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Paragrafo</button>
                  <button onClick={() => addLineAtEnd('character')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Fala</button>
                  <button onClick={() => addLineAtEnd('dialogue')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Dialogo</button>
                </div>
              </div>
            ) : (
              <div className={`screenplay-container ${paperTheme === 'dark' ? 'dark-paper' : ''}`} style={{ width: '100%', maxWidth: '816px' }}>
                {elements.filter(el => el.type !== 'beat-metadata').length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#7c7c82' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '16px' }}>Seu roteiro esta em branco. Escreva um cabecalho de cena para comecar.</p>
                    <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ Comecar Roteiro</button>
                  </div>
                ) : (
                  paginatedElements.items.map((item) => {
                    if (item.isPageBreak) {
                      return <div key={`break-${item.pageNum}`} className="virtual-page-break">FIM DA PAGINA {item.pageNum} • INICIO DA PAGINA {item.nextPageNum}</div>;
                    }
                    const el = elements[item.originalIndex];
                    if (!el) return null;
                    if (el.type === 'beat-metadata') return null;
                    if (el.type === 'title-page') {
                      return <div key={el.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0', fontSize: '11px', color: '#7c7c82', display: 'flex', gap: '8px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#ccee00' }}>[FOLHA DE ROSTO]</span>
                        <span>{el.text}</span>
                      </div>;
                    }
                    const isRevised = revisions.includes(el.id);
                    const gen = REVISION_GENERATIONS.find(g => g.level === revisionGeneration) || REVISION_GENERATIONS[0];
                    return (
                      <div key={el.id} className="script-element-wrapper">
                        <span className="format-badge">{getTypeLabel(pendingAutoTypes[el.id] || el.type)}</span>
                        {isRevised && (
                          <>
                            <span className="revision-star" style={{ color: gen.hex }}>{gen.marker}</span>
                            <div className="revision-star-bar" style={{ backgroundColor: gen.hex }} />
                          </>
                        )}
                        <div
                          ref={ref => {
                            if (ref) {
                              elementRefs.current[el.id] = ref;
                              if (!ceInitSet.current.has(el.id) || !ref.innerText.trim()) {
                                ref.innerText = el.text;
                                ceInitSet.current.add(el.id);
                              }
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          className={`script-element ${getStyleForType(pendingAutoTypes[el.id] || el.type)}`}
                          onInput={(e) => handleInput(el.id, e.target.innerText)}
                          onBlur={() => handleBlur(el.id)}
                          onKeyDown={(e) => handleKeyDown(e, item.originalIndex, el)}
                          style={{ minHeight: '1.5em' }}
                        />
                        <div className="script-element-actions-trigger">
                          <button onClick={() => handleAIAutoComplete(el.id)} style={{ padding: '4px', borderRadius: '4px', background: 'rgba(204,238,0,0.1)', border: '1px solid rgba(204,238,0,0.3)', color: '#ccee00', cursor: 'pointer' }} title="Completar Cena com IA"><Sparkles size={11} /></button>
                          <select value={aiTone} onChange={(e) => { setAiTone(e.target.value); setTimeout(() => handleAIImproveBlock(el.id), 50); }} style={{ background: '#020203', border: '1px solid #1d1d24', color: '#fff', fontSize: '9px', borderRadius: '4px', padding: '2px' }} title="Reescrever Linha com IA">
                            <option value="dramatico">Drama</option>
                            <option value="misterioso">Misterio</option>
                            <option value="comico">Comico</option>
                            <option value="acao">Acao</option>
                          </select>
                        </div>
                        <div onClick={(e) => handleGripClick(e, el.id, item.originalIndex)} style={{ position: 'absolute', left: '-24px', top: '8px', cursor: 'pointer', color: '#444', fontSize: '12px', userSelect: 'none' }} title="Acoes do Bloco">⠿</div>
                        {(pendingAutoTypes[el.id] || el.type) === 'character' && findMatchingCharacter(el.text) && (
                          <span onClick={() => openFicha(findMatchingCharacter(el.text), 'character')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(204,238,0,0.12)', color: '#ccee00', border: '1px solid rgba(204,238,0,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Ficha
                          </span>
                        )}
                        {(pendingAutoTypes[el.id] || el.type) === 'scene-heading' && findMatchingScene(el.text) && (
                          <span onClick={() => openFicha(findMatchingScene(el.text), 'scene')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cena
                          </span>
                        )}
                        {(pendingAutoTypes[el.id] || el.type) === 'scene-heading' && !findMatchingScene(el.text) && findMatchingLocationFromHeading(el.text) && (
                          <span onClick={() => openFicha(findMatchingLocationFromHeading(el.text), 'location')} style={{ position: 'absolute', right: '16px', top: '8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Loc
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div style={{ position: 'fixed', bottom: '24px', background: 'rgba(8,8,10,0.95)', border: '1px solid #141419', borderRadius: '30px', padding: '6px 16px', display: 'flex', gap: '8px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => addLineAtEnd('scene-heading')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Cena</button>
                  <button onClick={() => addLineAtEnd('action')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Acao</button>
                  <button onClick={() => addLineAtEnd('character')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Persona</button>
                  <button onClick={() => addLineAtEnd('dialogue')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Dialogo</button>
                  <button onClick={() => addLineAtEnd('parenthetical')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>() Parentese</button>
                  <button onClick={() => addLineAtEnd('transition')} style={{ background: 'none', border: 'none', color: '#eaeaea', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Transicao</button>
                </div>
              </div>
            )
          )}

          {aiFeedback && (
            <div style={{ maxWidth: '816px', margin: '20px auto', background: 'rgba(10,10,14,0.8)', border: '1px solid rgba(204,238,0,0.15)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#ccee00', margin: 0 }}>Feedback da IA</h3>
                <button onClick={() => setAiFeedback(null)} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>Fechar</button>
              </div>
              <div style={{ fontSize: '12px', color: '#c8c8d0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {aiFeedback}
              </div>
            </div>
          )}

          {/* ── B. CORKBOARD ── */}
          {activeTab === 'cards' && (
            <div className="corkboard">
              {sceneHeadingsList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#7c7c82' }}>
                  <HelpCircle size={48} style={{ margin: '0 auto 16px auto', color: '#444' }} />
                  <p>Nenhuma cena identificada no roteiro. Comece criando um cabecalho de cena!</p>
                </div>
              ) : (
                sceneHeadingsList.map((scene, sceneIdx) => (
                  <div key={scene.id} className="index-card">
                    <div className="index-card-header" style={{ borderTop: `4px solid ${scene.color}` }}>
                      <span style={{ color: '#ccee00' }}>#{scene.sceneNumber}</span>
                      <h3 className="index-card-title">{scene.cleanText}</h3>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => moveCard(sceneIdx, 'up')} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                        <button onClick={() => moveCard(sceneIdx, 'down')} style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                      </div>
                    </div>
                    <div className="index-card-body">
                      <textarea
                        className="index-card-synopsis-textarea"
                        value={elements[elements.findIndex(el => el.id === scene.id) + 1]?.type === 'synopsis' ? elements[elements.findIndex(el => el.id === scene.id) + 1].text : ''}
                        onChange={e => updateCardSynopsis(sceneIdx, e.target.value)}
                        placeholder="Adicione uma sinopse descritiva para esta cena..."
                      />
                    </div>
                    <div className="index-card-footer">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['#10b981', '#3b82f6', '#ec4899', '#ef4444', '#f59e0b', '#22252a'].map(c => (
                          <div key={c} onClick={() => changeCardColor(sceneIdx, c)} className="color-dot" style={{ backgroundColor: c, border: scene.color === c ? '2px solid #fff' : 'none' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── C. TIMELINE ── */}
          {activeTab === 'timeline' && (
            <div className="timeline-container">
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Mural de Cenas por Comprimento (Tempo de Tela)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Cada bloco representa uma cena. A largura representa o tempo de tela proporcional de acordo com a quantidade de blocos.</p>
                <div className="timeline-track">
                  {sceneHeadingsList.map((scene) => (
                    <div key={scene.id} onClick={() => focusBlock(scene.id, 'start')} className="timeline-block" style={{ width: `${Math.max(80, scene.words * 1.5)}px`, backgroundColor: scene.color, borderLeft: '4px solid #ccee00' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff' }}>#{scene.sceneNumber}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scene.cleanText}</span>
                      <span style={{ fontSize: '9px', color: '#eaeae3', alignSelf: 'flex-end' }}>{scene.words} pal</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Rastreador de Subtramas (Storylines / Beats)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Mapeia subtramas anotadas com o marcador Beat ex: <code>{"[[beat Agnes:Mother finds diary]]"}</code>.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.keys(storylines).length === 0 ? (
                    <p style={{ fontSize: '11px', color: '#7c7c82', fontStyle: 'italic' }}>Nenhuma subtrama beat identificada. Adicione marcas no texto como <code>{"[[beat Fumaca, treinamento]]"}</code>!</p>
                  ) : (
                    Object.keys(storylines).map(cat => (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: '#08080a', border: '1px solid #141419', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccee00' }}>SUBTRAMA: {cat.toUpperCase()}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {storylines[cat].map((beat, bIdx) => (
                            <div key={bIdx} style={{ background: '#121217', padding: '6px 12px', borderRadius: '4px', border: '1px solid #22252a', fontSize: '10px' }}>
                              <span style={{ color: '#ec4899', fontWeight: 'bold' }}>• {beat.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── D. STATS ── */}
          {activeTab === 'stats' && (
            <div style={{ flex: 1, width: '100%', overflowY: 'auto', background: '#050506' }}>
              <div className="stats-grid">
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>PAGINAS ESTIMADAS</span><div className="stats-number">{stats.pagesCount}</div></div>
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TOTAL DE PALAVRAS</span><div className="stats-number">{stats.wordCount}</div></div>
                <div className="stats-card"><span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TEMPO DE TELA ESTIMADO</span><div className="stats-number">{stats.estimatedMinutes} min</div></div>
                <div className="stats-card">
                  <span style={{ fontSize: '11px', color: '#7c7c82', fontWeight: 'bold' }}>TESTE BECHDEL-WALLACE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    {stats.bechdelPassed ? <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={16} /> Aprovado!</span> : <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={16} /> Falhou</span>}
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Distribuicao de Linhas de Dialogo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.charactersStats.map(c => {
                      const totalLines = stats.charactersStats.reduce((sum, item) => sum + item.lines, 0);
                      const pct = Math.round((c.lines / (totalLines || 1)) * 100);
                      return (
                        <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                            <span style={{ color: '#7c7c82' }}>{c.lines} falas ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#1c1c24', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#ccee00', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Metricas Ambientais</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7c7c82', display: 'block', marginBottom: '6px' }}>AMBIENTE (INT. vs EXT.)</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <div style={{ flex: 1, background: '#121217', padding: '8px', borderRadius: '6px', textAlign: 'center' }}><span style={{ display: 'block', fontWeight: 'bold', color: '#ccee00' }}>{stats.locationsMap.INT}</span><span style={{ fontSize: '9px', color: '#7c7c82' }}>INTERIORES</span></div>
                        <div style={{ flex: 1, background: '#121217', padding: '8px', borderRadius: '6px', textAlign: 'center' }}><span style={{ display: 'block', fontWeight: 'bold', color: '#ccee00' }}>{stats.locationsMap.EXT}</span><span style={{ fontSize: '9px', color: '#7c7c82' }}>EXTERIORES</span></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7c7c82', display: 'block', marginBottom: '6px' }}>PERIODOS DO DIA</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                        {Object.entries(stats.timeOfDayMap).map(([period, val]) => (
                          <div key={period} style={{ flex: 1, background: '#121217', padding: '6px', borderRadius: '4px', textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#fff' }}>{val}</span><span style={{ display: 'block', fontSize: '8px', color: '#7c7c82' }}>{period}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── E. PLUGINS ── */}
          {activeTab === 'plugins' && (
            <div style={{ flex: 1, padding: '32px', background: '#050506', overflowY: 'auto', width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Plugin Store (Extensoes Beat)</h3>
                  <p style={{ fontSize: '12px', color: '#7c7c82' }}>Execute scripts rapidos para higienizar e analisar sua base de roteiro.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div onClick={() => setSelectedPlugin('linter')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'linter' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'linter' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>1. Slugline Headings Linter</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Converte automaticamente todos os cabecalhos de cena para CAIXA ALTA.</p>
                    </div>
                    <div onClick={() => setSelectedPlugin('bechdel')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'bechdel' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'bechdel' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>2. Diversity & Bechdel Test Script</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Mapeia genero de personagens e verifica dialogos cruzados.</p>
                    </div>
                    <div onClick={() => setSelectedPlugin('cleaner')} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #141419', background: selectedPlugin === 'cleaner' ? 'rgba(204,238,0,0.04)' : '#08080a', borderLeft: selectedPlugin === 'cleaner' ? '4px solid #ccee00' : '4px solid transparent', cursor: 'pointer' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>3. Empty Blocks Cleaner</h4>
                      <p style={{ fontSize: '11px', color: '#7c7c82', marginTop: '4px' }}>Elimina blocos ou paragrafos de roteiro que ficaram em branco ou vazios.</p>
                    </div>
                  </div>
                  <button onClick={runPlugin} disabled={pluginRunning} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}>{pluginRunning ? 'Executando script...' : 'Executar Plugin Ativo'}</button>
                </div>
                <div style={{ background: '#020203', border: '1px solid #1c1c22', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column', height: '360px' }}>
                  <span style={{ color: '#7c7c82', borderBottom: '1px solid #141419', paddingBottom: '8px', display: 'block', marginBottom: '12px' }}>TERMINAL OUTPUT LOG</span>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pluginLog.length === 0 ? <span style={{ color: '#444' }}>Aguardando execucao de plugin...</span> : pluginLog.map((log, idx) => <span key={idx} style={{ color: log.includes('[Sucesso]') || log.includes('[PASSED]') ? '#10b981' : log.includes('[FALHA]') ? '#ef4444' : '#eaeaea' }}>{log}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── F. STYLE & REVISIONS ── */}
          {activeTab === 'style' && (
            <div style={{ flex: 1, padding: '32px', background: '#050506', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
              
              {/* Paper Theme Selection */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Padrao de Visualizacao / Estilos</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Altere o estilo geral da folha de escrita.</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div onClick={() => setPaperTheme('dark')} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: paperTheme === 'dark' ? '2px solid #ccee00' : '1px solid #141419', background: '#08080a', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontWeight: 'bold', fontSize: '13px' }}>Folha Escura (Distracao Zero)</span>
                    <span style={{ fontSize: '11px', color: '#7c7c82' }}>Texto cinza sobre fundo preto profundo</span>
                  </div>
                  <div onClick={() => setPaperTheme('light')} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: paperTheme === 'light' ? '2px solid #ccee00' : '1px solid #141419', background: '#08080a', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontWeight: 'bold', fontSize: '13px' }}>Folha de Producao (Clara)</span>
                    <span style={{ fontSize: '11px', color: '#7c7c82' }}>Texto escuro sobre folha branca padrao</span>
                  </div>
                </div>
              </div>

              {/* Novel Mode Toggle */}
              <div style={{ borderTop: '1px solid #141419', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Modo Romance (Novel Mode)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>Reformata o roteiro como prosa literaria — cabecalhos viram capitulos, dialogos usam travessao.</p>
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold', fontSize: '13px' }}>Ativar Modo Romance</span>
                    <span style={{ fontSize: '11px', color: '#7c7c82' }}>Alterna entre visualizacao de roteiro e prosa literaria.</span>
                  </div>
                  <button onClick={() => setNovelMode(!novelMode)} style={{ background: novelMode ? '#10b981' : '#ccee00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', minWidth: '80px' }}>
                    {novelMode ? 'Ativo' : 'Desativado'}
                  </button>
                </div>
              </div>

              {/* Beat 8-Level Production Revision System */}
              <div style={{ borderTop: '1px solid #141419', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Controle de Revisoes de Producao (Sistema Beat 8 Geracoes)</h3>
                <p style={{ fontSize: '12px', color: '#7c7c82', marginBottom: '16px' }}>
                  Monitore edicoes em tempo real. Cada geracao de revisao usa um marcador de margem especifico e cor canonica da industria: 
                  <code style={{ color: '#ccee00' }}> * ** + ++ @@ # ##</code>
                </p>
                
                {/* Revision Generation Selector */}
                <div style={{ background: '#08080a', border: '1px solid #141419', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>Geracao de Revisao Ativa</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {REVISION_GENERATIONS.map(gen => {
                      const isActive = revisionGeneration === gen.level;
                      return (
                        <div 
                          key={gen.level}
                          onClick={() => setRevisionGeneration(gen.level)}
                          style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer',
                            background: isActive ? `rgba(${parseInt(gen.hex.slice(1,3),16)}, ${parseInt(gen.hex.slice(3,5),16)}, ${parseInt(gen.hex.slice(5,7),16)}, 0.15)` : '#020203',
                            border: isActive ? `2px solid ${gen.hex}` : '1px solid #1d1d24',
                            textAlign: 'center', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: gen.hex, marginBottom: '4px' }}>{gen.marker}</div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: isActive ? gen.hex : '#7c7c82' }}>{gen.name}</div>
                          <div style={{ fontSize: '8px', color: '#7c7c82' }}>{gen.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revision Mode Toggle */}
                <div style={{ background: '#08080a', border: '1px solid #141419', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'block', fontWeight: 'bold', fontSize: '13px' }}>Ativar Modo de Revisao</span>
                      {revisionMode && (
                        <span style={{ display: 'inline-block', padding: '2px 8px', background: activeGen.hex, color: '#000', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                          {activeGen.marker} {activeGen.name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#7c7c82' }}>Modificacoes feitas no editor serao monitoradas com estrelas na margem.</span>
                    {revisions.length > 0 && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#ccee00', fontWeight: 'bold', marginTop: '4px' }}>
                        {revisions.length} alteracoes marcadas na margem
                      </span>
                    )}
                  </div>
                  <button onClick={() => setRevisionMode(!revisionMode)} style={{ background: revisionMode ? '#ef4444' : '#ccee00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', minWidth: '80px' }}>
                    {revisionMode ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Autocomplete ── */}
      {autocomplete.show && (
        <div ref={autocompleteRef} className="screenplay-autocomplete" style={{ left: `${autocomplete.x}px`, top: `${autocomplete.y}px` }}>
          <div className="p-1 border-b border-white/5 mb-1 flex justify-between items-center">
            <span className="text-[8px] uppercase tracking-wider text-yellow-500 font-bold">Sugestoes de Roteiro</span>
            <span className="text-[7px] text-gray-500 font-mono">[Tab] Autocompletar</span>
          </div>
          {autocomplete.suggestions.map((val, idx) => (
            <div key={val} onClick={() => applyAutocomplete(val)} className={`screenplay-autocomplete-item ${idx === autocomplete.index ? 'selected' : ''}`}>
              <span>{val}</span>
              <span className="screenplay-autocomplete-badge">{autocomplete.type === 'character' ? 'Personagem' : 'Locacao'}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Block Menu ── */}
      {activeBlockMenu.show && (
        <div className="block-menu-dropdown" style={{ position: 'absolute', left: `${activeBlockMenu.x}px`, top: `${activeBlockMenu.y}px`, background: '#0a0a0d', border: '1px solid #1d1d24', borderRadius: '6px', padding: '4px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', width: '180px' }} onClick={(e) => e.stopPropagation()}>
          <div onClick={() => moveBlockUp(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Mover para Cima</span></div>
          <div onClick={() => moveBlockDown(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Mover para Baixo</span></div>
          <div onClick={() => duplicateBlock(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Duplicar Bloco</span></div>
          <div onClick={() => deleteBlock(activeBlockMenu.index)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span>Excluir Bloco</span></div>
          <div style={{ borderBottom: '1px solid #141419', margin: '4px 0' }} />
          <div style={{ padding: '2px 12px', fontSize: '8px', color: '#7c7c82', fontWeight: 'bold' }}>CONVERTER PARA...</div>
          {['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'].map(t => (
            <div key={t} onClick={() => changeBlockType(activeBlockMenu.index, t)} style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', textTransform: 'capitalize' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{getTypeLabel(t)}</div>
          ))}
        </div>
      )}

      {/* ── Compile Modal ── */}
      {showCompileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '480px', padding: '24px', background: '#0a0a0d', border: '1px solid #1d1d24', borderRadius: '12px', textAlign: 'center' }}>
            <Sparkles size={48} style={{ color: '#ccee00', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Compilar Assistente de Roteiro</h3>
            <p style={{ fontSize: '12px', color: '#7c7c82', lineHeight: '18px', marginBottom: '24px' }}>
              Isso reunira os nos do Mapa Mental, ideias gravadas e os dados de Brainstorm estruturado para criar um rascunho completo do roteiro em blocos estilizados.
            </p>
            {aiLoading ? (
              <div style={{ padding: '12px', color: '#ccee00', fontSize: '13px', fontWeight: 'bold' }}>Compilando roteiro estruturado...</div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="button" onClick={() => setShowCompileModal(false)} style={{ background: '#121217', border: '1px solid #1d1d24', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                <button type="button" onClick={handleCompileScreenplay} style={{ background: '#ccee00', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Iniciar Compilacao</button>
              </div>
            )}
            {aiError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '10px' }}>{aiError}</p>}
          </div>
        </div>
      )}

      {/* ── FichaModal (unificado) ── */}
      {fichaModal && (
        <FichaModal
          item={fichaModal.item}
          type={fichaModal.type}
          mode={fichaModal.mode}
          acts={currentProject?.entities?.acts || []}
          onSave={handleFichaSave}
          onDelete={handleFichaDelete}
          onClose={() => setFichaModal(null)}
          onNavigateToEncyclopedia={(id) => navigateTo('encyclopedia', id)}
        />
      )}

    </div>
  );
}
