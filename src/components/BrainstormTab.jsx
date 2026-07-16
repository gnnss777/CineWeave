import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useEntities } from '../context/useEntities';
import { createEntity } from '../context/EntitiesSchema';
import { createNodeWithEntity, resolveNodeDisplay } from '../lib/mindMapUtils';
import { extractStructureFromDocuments } from '../lib/llm';
import { parseFiles } from '../lib/fileParser';
import { uploadProjectFilesBatch } from '../lib/storage';
import ConfirmModal from './ConfirmModal';
import PromptModal from './PromptModal';
import LottieMic from './LottieMic';
import {
  Mic,
  MicOff,
  Square,
  Upload,
  FileText,
  CheckCircle,
  Radio,
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  Settings,
  SlidersHorizontal,
  Layers,
  Grid,
  List,
  MapPin,
  Target,
  Zap,
  Heart,
  Star,
  Flag,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  Edit,
  Eye,
  RotateCcw,
  Download,
  Share2,
  Link,
  Tag,
  Filter,
  Search,
  Maximize,
  Minimize,
  GripVertical,
  ArrowUpDown,
  Sparkle,
  Wand2,
  RefreshCw,
  MessageSquare,
  Layers as LayersIcon2,
  Image,
  FileText as FileTextIcon,
  Music,
  Video,
  Send,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Heart as FavoriteIcon,
  Bookmark,
  Archive,
  Clock,
  Calendar,
  User,
  Users,
  Globe,
  Palette,
  Flame,
  Gem,
  Key,
  Lock,
  Unlock,
  Eye as EyeIcon,
  EyeOff,
  SortAsc,
  SortDesc,
  Shuffle,
  Brain as BrainIcon,
  Zap as SparkIcon,
  Lightbulb as BulbIcon,
  Target as TargetIcon2,
  Film as FilmIcon,
  Type as TypeIcon,
  MapPin as MapPinIcon,
  Heart as HeartIcon3,
  Star as StarIcon3,
  Flag as FlagIcon5,
  FileAudio,
  FileText as FilePdf,
  FileText as FileDoc,
  FileCode,
  Play,
  Pause,
  StopCircle,
  Volume2,
  VolumeX,
  Trash,
  Plus,
  Minus,
  X as XIcon2,
  ExternalLink,
  FolderOpen,
  Database,
  Zap as ZapIcon,
  Hash,
  MessageSquare as MessageSquareIcon,
  Layers as LayersIcon,
  Globe as GlobeIcon,
  Heart as HeartIcon4,
  Star as StarIcon4,
  Flag as FlagIcon6,
} from 'lucide-react';
import './BrainstormTab.css';

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: Sparkle, color: 'var(--primary-gold)', bg: 'rgba(204, 238, 0, 0.15)' },
  { id: 'characters', label: 'Personagem', icon: User, color: 'var(--color-character)', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'plot_points', label: 'Enredo', icon: TargetIcon2, color: 'var(--primary-gold)', bg: 'rgba(204, 238, 0, 0.15)' },
  { id: 'scenes', label: 'Cena', icon: FilmIcon, color: 'var(--color-act)', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'dialogues', label: 'Diálogo', icon: MessageSquareIcon, color: 'var(--color-object)', bg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'world_elements', label: 'Mundo', icon: GlobeIcon, color: 'var(--color-location)', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'themes', label: 'Tema', icon: HeartIcon4, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
];

const CATEGORY_ICONS = {
  characters: User,
  plot_points: TargetIcon2,
  scenes: FilmIcon,
  dialogues: MessageSquareIcon,
  world_elements: GlobeIcon,
  themes: HeartIcon4,
};

const FILE_TYPE_ICONS = {
  audio: FileAudio,
  pdf: FilePdf,
  docx: FileDoc,
  txt: FileCode,
  md: FileCode,
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', icon: Radio },
  parsing: { label: 'Lendo...', color: 'var(--primary-gold)', bg: 'rgba(204, 238, 0, 0.1)', icon: Loader2, animate: true },
  parsed: { label: 'Lido', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: CheckCircle },
  processing: { label: 'Processando IA...', color: 'var(--primary-gold)', bg: 'rgba(204, 238, 0, 0.1)', icon: Loader2, animate: true },
  processed: { label: 'Processado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle },
  error: { label: 'Erro', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle },
};

export default function BrainstormTab() {
  const { 
    currentProject, 
    processLLMToProject, 
    addMediaUpload, 
    addRecording, 
    addBrainstormDocument, 
    removeBrainstormDocument, 
    updateProject, 
    updateMindMap, 
    updateScreenplay, 
    navigateTo, 
    saveCharacter, 
    deleteCharacter,
    saveEntity,
    deleteEntityById,
    getPendingStagingCount 
  } = useProject();

  const { plotPoints, scenes, dialogues, themes, worldElements } = useEntities();
  const documents = currentProject?.brainstormDocuments || [];
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updated');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [customTranscript, setCustomTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechStatus, setSpeechStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [manualNotes, setManualNotes] = useState('');
  const [manualNotesDocId, setManualNotesDocId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [promptModal, setPromptModal] = useState(null);
  const [extractionError, setExtractionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechActiveRef = useRef(false);
  const accumulatedRef = useRef('');
  const processingRef = useRef(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const fileInputRef = useRef(null);
  const manualNotesRef = useRef(null);

  // Load manual notes from localStorage on mount
  useEffect(() => {
    if (currentProject) {
      const saved = localStorage.getItem(`brainstorm-notes-${currentProject.id}`);
      if (saved && !manualNotes) {
        setManualNotes(saved);
      }
    }
  }, [currentProject, manualNotes]);

  // Auto-save manual notes to localStorage
  useEffect(() => {
    if (currentProject && manualNotes !== undefined) {
      localStorage.setItem(`brainstorm-notes-${currentProject.id}`, manualNotes);
    }
  }, [manualNotes, currentProject]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const uncensorText = (text) => {
    if (!text) return '';
    return text
      .replace(/(^|\s)\*{7}(?=\s|[.,?!]|$)/g, '$1caralho')
      .replace(/(^|\s)\*{5}(?=\s|[.,?!]|$)/g, '$1merda')
      .replace(/(^|\s)\*{4}(?=\s|[.,?!]|$)/g, '$1foda')
      .replace(/(^|\s)\*{3,}(?=\s|[.,?!]|$)/g, '$1[palavrão]')
      .replace(/(^|\s)m\*{3,}a(?=\s|[.,?!]|$)/gi, '$1merda')
      .replace(/(^|\s)p\*{3,}a(?=\s|[.,?!]|$)/gi, '$1porra')
      .replace(/(^|\s)f\*{3,}a(?=\s|[.,?!]|$)/gi, '$1foda')
      .replace(/(^|\s)c\*{3,}o(?=\s|[.,?!]|$)/gi, '$1caralho')
      .replace(/(^|\s)b\*{3,}a(?=\s|[.,?!]|$)/gi, '$1bosta');
  };

  // ── Recording ──────────────────────────────────────
  const startRecording = async () => {
    setCustomTranscript('');
    setLiveTranscript('');
    accumulatedRef.current = '';
    setSpeechStatus('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'pt-BR';
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            let finalPart = '';
            let interimPart = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const t = event.results[i][0].transcript;
              if (event.results[i].isFinal) finalPart += t + ' ';
              else interimPart += t;
            }
            finalPart = uncensorText(finalPart);
            interimPart = uncensorText(interimPart);
            if (finalPart) {
              accumulatedRef.current += finalPart;
              setCustomTranscript(accumulatedRef.current.trim());
            }
            setLiveTranscript((accumulatedRef.current + interimPart).trim());
          };

          recognition.onerror = (e) => {
            if (e.error === 'not-allowed') setSpeechStatus('error:Permissão de microfone negada.');
            else setSpeechStatus(`error:Erro: ${e.error}`);
          };

          recognitionRef.current = recognition;
          recognition.start();
          speechActiveRef.current = true;
          setSpeechStatus('active');
        } catch (err) {
          setSpeechStatus('error:Não foi possível iniciar a transcrição.');
        }
      } else {
        setSpeechStatus('unsupported');
      }

    } catch (err) {
      setIsRecording(true);
      setRecordingTime(0);
      setSpeechStatus('error:Microfone não disponível.');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    speechActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    if (accumulatedRef.current.trim()) {
      setCustomTranscript(accumulatedRef.current.trim());
    }
    setLiveTranscript('');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleSaveRecording = () => {
    if (!customTranscript.trim()) return;
    const title = `Reunião #${(currentProject?.recordings?.length || 0) + 1}`;
    const duration = formatTime(recordingTime || 45);
    const savedRec = addRecording(title, duration, customTranscript);
    
    setAudioUrl(null);
    setCustomTranscript('');
    setRecordingTime(0);
    setShowRecordModal(false);
  };

  // ── File Handling ──────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processFiles(files);
      e.target.value = '';
    }
  };

  const processFiles = async (files) => {
    const supportedFiles = files.filter(f => {
      const type = f.type || getTypeFromExtension(f.name);
      return ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'].includes(type);
    });

    if (supportedFiles.length === 0) {
      setConfirmModal({ title: 'Arquivo não suportado', message: 'Nenhum arquivo suportado. Use PDF, DOCX, TXT ou MD.', variant: 'alert', confirmLabel: 'OK', onConfirm: () => setConfirmModal(null), onCancel: () => setConfirmModal(null) });
      return;
    }

    // Get current user for projectId/userId
    let currentUserId = null;
    let currentProjectIdVal = currentProject?.id;
    try {
      const { getCurrentUser } = await import('../lib/supabase');
      const user = await getCurrentUser();
      currentUserId = user?.id || null;
    } catch (e) {
      console.warn('Could not get current user:', e);
    }

    // Upload files to Supabase Storage
    let uploadResults = [];
    if (currentUserId && currentProjectIdVal) {
      uploadResults = await uploadProjectFilesBatch(currentProjectIdVal, currentUserId, supportedFiles, 'brainstorm');
      for (const ur of uploadResults) {
        if (ur.error) console.warn('Upload failed for', ur.file.name, ur.error);
      }
    }

    const newDocs = supportedFiles.map((file, idx) => {
      const uploadResult = uploadResults[idx]?.result;
      return {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        name: file.name,
        type: getTypeFromExtension(file.name),
        size: file.size,
        status: 'pending',
        content: '',
        metadata: null,
        extractedData: null,
        createdAt: Date.now(),
        projectId: currentProjectIdVal,
        userId: currentUserId,
        storagePath: uploadResult?.storagePath || '',
        fileUrl: uploadResult?.url || '',
        fileId: null,
      };
    });

    // Add all docs at once via project spread to avoid closure issues
    const proj = { ...currentProject };
    if (!proj.brainstormDocuments) proj.brainstormDocuments = [];
    const preparedDocs = newDocs.map(doc => ({
      ...doc,
      id: doc.id || `bsd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: doc.createdAt || Date.now(),
      _sbSynced: false
    }));
    proj.brainstormDocuments = [...preparedDocs, ...proj.brainstormDocuments];
    updateProject(proj);

    await processDocuments(preparedDocs);
  };

  const getTypeFromExtension = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'md': return 'text/markdown';
      default: return 'unknown';
    }
  };

  const processDocuments = async (docsToProcess) => {
    if (processingRef.current) return;
    processingRef.current = true;

    // Helper that accumulates updates and flushes them in one project update
    let pendingUpdates = new Map();
    const flushUpdates = () => {
      if (pendingUpdates.size === 0) return;
      const docs = currentProject?.brainstormDocuments || [];
      const updated = docs.map(d => {
        const u = pendingUpdates.get(d.id);
        return u ? { ...d, ...u } : d;
      });
      pendingUpdates = new Map();
      updateProject({ ...currentProject, brainstormDocuments: updated });
    };
    const markStatus = (docId, updates) => {
      const existing = pendingUpdates.get(docId) || {};
      pendingUpdates.set(docId, { ...existing, ...updates });
    };

    // First mark all as parsing
    docsToProcess.forEach(dp => markStatus(dp.id, { status: 'parsing' }));
    flushUpdates();

    try {
      // Extract actual File objects from doc entries
      const filesToParse = docsToProcess.map(d => d.file).filter(Boolean);
      const results = await parseFiles(filesToParse, (progress) => {
        if (progress.status === 'parsed') {
          markStatus(progress.result.id, { ...progress.result, status: 'parsed' });
          flushUpdates();
        }
      });

      for (const result of results) {
        if (result.status !== 'parsed') continue;
        // Re-find the doc that maps to this file
        const matched = docsToProcess.find(d => d.file === result.file);
        if (matched) markStatus(matched.id, { ...result, status: 'parsed' });
      }
      flushUpdates();

      await extractFromParsedDocs();
    } catch (error) {
      console.error('Parse error:', error);
      docsToProcess.forEach(dp => markStatus(dp.id, { status: 'error', error: error.message }));
    } finally {
      processingRef.current = false;
    }
  };

  const extractFromParsedDocs = async () => {
    // Documents now come from currentProject.brainstormDocuments, already scoped to project
    const unprocessed = documents.filter(d => d.status === 'parsed');
    if (unprocessed.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus('Enviando documentos para IA extrair estrutura...');
    setExtractionError(null);

    const markDoc = (docId, updates) => {
      const docs = currentProject?.brainstormDocuments || [];
      const updated = docs.map(d => d.id === docId ? { ...d, ...updates } : d);
      updateProject({ ...currentProject, brainstormDocuments: updated });
    };

    try {
      const extracted = await extractStructureFromDocuments(
        unprocessed.map(d => ({ 
          id: d.id, 
          name: d.name, 
          type: d.type, 
          content: d.content 
        })),
        (status) => setProcessingStatus(status),
        currentProject
      );

      // Save extracted entities directly to the unified entities store
      if (extracted.plot_points) {
        extracted.plot_points.forEach(p => saveEntity('plot_points', p));
      }
      if (extracted.scenes) {
        extracted.scenes.forEach(s => saveEntity('scenes', s));
      }
      if (extracted.dialogues) {
        extracted.dialogues.forEach(d => saveEntity('dialogues', d));
      }
      if (extracted.world_elements) {
        extracted.world_elements.forEach(w => saveEntity('world_elements', w));
      }
      if (extracted.themes) {
        extracted.themes.forEach(t => saveEntity('themes', t));
      }

      const result = processLLMToProject(extracted, 'Documentos importados', '');

      // Mark each unprocessed document as processed
      // We use the snapshot of brainstormDocuments from the start of this function
      const updatedDocs = documents.map(d => 
        unprocessed.some(u => u.id === d.id) ? { ...d, status: 'processed', extractedData: extracted } : d
      );
      updateProject({ ...currentProject, brainstormDocuments: updatedDocs });

      if (result) {
        const parts = [];
        if (result.characters) parts.push(`${result.characters} personagens`);
        if (result.locations) parts.push(`${result.locations} locações`);
        if (result.objects) parts.push(`${result.objects} objetos`);
        if (result.scenes) parts.push(`${result.scenes} cenas`);
        if (result.plot_points) parts.push(`${result.plot_points} plot points`);
        if (result.themes) parts.push(`${result.themes} temas`);
        if (result.acts) parts.push(`${result.acts} atos`);
        setProcessingStatus(`Extraído: ${parts.join(', ')}`);
        setConfirmModal({
          title: 'Extração concluída!',
          message: `Dados extraídos e integrados ao projeto:\n\n• ${parts.join('\n• ')}\n\nTodas as fichas foram criadas/atualizadas na Enciclopédia.`,
          variant: 'success',
          confirmLabel: 'OK',
          onConfirm: () => setConfirmModal(null),
          onCancel: () => setConfirmModal(null),
        });
      } else {
        setProcessingStatus('Extração concluída!');
      }
      setTimeout(() => setProcessingStatus(''), 5000);
    } catch (error) {
      console.error('Extraction error:', error);
      setProcessingStatus(`Erro: ${error.message}`);
      setExtractionError(error.message);
      
      // Mark each unprocessed document as error (using the snapshot)
      const updatedDocs = documents.map(d => 
        unprocessed.some(u => u.id === d.id) ? { ...d, status: 'error', error: error.message } : d
      );
      updateProject({ ...currentProject, brainstormDocuments: updatedDocs });
      
      // Show error modal
      setConfirmModal({
        title: 'Erro na extração',
        message: `Falha ao processar documentos com IA:\n\n${error.message}\n\nVerifique sua conexão e chave de API da NVIDIA.`,
        variant: 'danger',
        confirmLabel: 'OK',
        onConfirm: () => setConfirmModal(null),
        onCancel: () => setConfirmModal(null),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const mergeByName = (existing, incoming, key) => {
    const map = new Map(existing.map(item => [item[key]?.toLowerCase(), item]));
    incoming.forEach(item => {
      const k = item[key]?.toLowerCase();
      if (k && map.has(k)) {
        map.set(k, { ...map.get(k), ...item });
      } else if (k) {
        map.set(k, item);
      }
    });
    return Array.from(map.values());
  };

  const mergeByTitle = (existing, incoming, key) => mergeByName(existing, incoming, key);

  const mergeByStatement = (existing, incoming, key) => {
    return [...existing, ...incoming];
  };

  const handleDeleteDocument = (id) => {
    removeBrainstormDocument(id);
    const recId = id.startsWith('recording-') ? id.replace('recording-', '') : null;
    if (recId && currentProject?.recordings?.some(r => r.id === recId)) {
      const proj = { ...currentProject };
      proj.recordings = proj.recordings.filter(r => r.id !== recId);
      updateProject(proj);
    }
  };

  const handleRetryDocument = async (doc) => {
    // Reset doc to pending in project
    const updatedDocs = (currentProject?.brainstormDocuments || []).map(d => 
      d.id === doc.id ? { ...d, status: 'pending', error: null } : d
    );
    updateProject({ ...currentProject, brainstormDocuments: updatedDocs });
    await processDocuments([doc]);
  };

  const isProcessingDoc = (d) => !d.id.startsWith('recording-');

  const handleProcessAll = async () => {
    const pending = documents.filter(d => isProcessingDoc(d) && (d.status === 'pending' || d.status === 'error'));
    if (pending.length > 0) await processDocuments(pending);
    const parsed = documents.filter(d => isProcessingDoc(d) && d.status === 'parsed');
    if (parsed.length > 0) await extractFromParsedDocs();
  };

  const handleReprocessAll = async () => {
    // Reset all non-processed imported docs (not recordings) to pending
    const updatedDocs = (currentProject?.brainstormDocuments || []).map(d => 
      isProcessingDoc(d) && d.status !== 'processed' ? { ...d, status: 'pending', extractedData: null } : d
    );
    updateProject({ ...currentProject, brainstormDocuments: updatedDocs });
    const toProcess = updatedDocs.filter(d => isProcessingDoc(d) && d.status !== 'processed');
    await processDocuments(toProcess);
  };

  const handleEditRecordingContent = (docId, newContent) => {
    const updatedDocs = (currentProject?.brainstormDocuments || []).map(d => 
      d.id === docId ? { ...d, content: newContent } : d
    );
    const doc = allDocuments.find(d => d.id === docId);
    if (doc?.metadata?.source === 'recording' && doc.metadata.recordingId) {
      const proj = { ...currentProject };
      proj.recordings = proj.recordings.map(r =>
        r.id === doc.metadata.recordingId ? { ...r, transcript: newContent } : r
      );
      proj.brainstormDocuments = updatedDocs;
      updateProject(proj);
    } else {
      updateProject({ ...currentProject, brainstormDocuments: updatedDocs });
    }
  };

  const addManualNotesAsDocument = () => {
    if (!manualNotes.trim()) return;
    
    const doc = {
      id: `manual-${Date.now()}`,
      name: `Nota manual ${new Date().toLocaleTimeString('pt-BR')}`,
      type: 'txt',
      content: manualNotes,
      status: 'parsed',
      metadata: { source: 'manual', wordCount: manualNotes.split(/\s+/).length },
      extractedData: null,
      createdAt: Date.now()
    };
    
    const newDoc = addBrainstormDocument(doc);
    setManualNotesDocId(newDoc.id);
  };

  // ── Category Filtering ──────────────────────────────────────
  const entityMap = {
    plot_points: plotPoints,
    scenes,
    dialogues,
    themes,
    world_elements: worldElements,
  };

  const filteredItems = useMemo(() => {
    let result;
    if (activeCategory === 'characters') {
      // Characters are still in legacy array for now, will migrate later
      result = (currentProject?.characters || []).map(c => ({
        ...c,
        _category: 'characters',
        title: c.name,
        statement: c.name,
        tags: c.traits || [],
        updatedAt: Date.now(),
      }));
    } else if (activeCategory === 'all') {
      const fromProject = (currentProject?.characters || []).map(c => ({
        ...c,
        _category: 'characters',
        title: c.name,
        statement: c.name,
        tags: c.traits || [],
        updatedAt: Date.now(),
      }));
      const fromEntities = Object.entries(entityMap).flatMap(([catId, items]) =>
        (items || []).map(item => ({ ...item, _category: catId }))
      );
      result = [...fromProject, ...fromEntities];
    } else {
      result = [...(entityMap[activeCategory] || [])];
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.name || item.title || item.statement || '').toLowerCase().includes(query) ||
        (item.description || item.synopsis || item.evidence || item.context || '').toLowerCase().includes(query) ||
        (item.tags || []).some(t => t.toLowerCase().includes(query))
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'updated': return (b.updatedAt || 0) - (a.updatedAt || 0);
        case 'created': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'title': return (a.name || a.title || a.statement || '').localeCompare(b.name || b.title || b.statement || '');
        default: return 0;
      }
    });
    
    return result;
  }, [plotPoints, scenes, dialogues, themes, currentProject?.characters, activeCategory, searchQuery, sortBy]);

  const allDocuments = useMemo(() => {
    const docIds = new Set(documents.map(d => d.id));
    const recordingDocs = (currentProject?.recordings || []).map(rec => ({
      id: `recording-${rec.id}`,
      name: rec.title,
      type: 'transcrição',
      content: rec.transcript || '',
      size: (rec.transcript || '').length,
      status: rec.processed ? 'processed' : 'parsed',
      metadata: { source: 'recording', duration: rec.duration, date: rec.date, recordingId: rec.id, wordCount: (rec.transcript || '').split(/\s+/).filter(Boolean).length },
      extractedData: null,
      createdAt: new Date(rec.date).getTime() || Date.now()
    }));
    return [...recordingDocs.filter(rd => !docIds.has(rd.id)), ...documents];
  }, [documents, currentProject?.recordings]);

  const getCategoryInfo = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  const getCategoryCount = (catId) => {
    if (catId === 'all') {
      const charCount = currentProject?.characters?.length || 0;
      const entityCount = plotPoints.length + scenes.length + dialogues.length + themes.length;
      return charCount + entityCount;
    }
    if (catId === 'characters') return currentProject?.characters?.length || 0;
    return (entityMap[catId] || []).length;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const commitEditItem = (item, newName, newDesc) => {
    const effectiveCat = item._category || 'plot_points';
    if (effectiveCat === 'characters') {
      const char = { ...item, name: newName.trim(), description: newDesc.trim() };
      saveCharacter(char);
      return;
    }
    const entityTypeMap = {
      plot_points: 'plot_points',
      scenes: 'scenes',
      dialogues: 'dialogues',
      world_elements: 'world_elements',
      themes: 'themes',
    };
    const entityType = entityTypeMap[effectiveCat] || 'plot_points';
    
    // Update in entities
    saveEntity(entityType, {
      ...item,
      id: item.id,
      name: newName.trim(),
      title: newName.trim(),
      statement: newName.trim(),
      description: newDesc.trim(),
      evidence: newDesc.trim(),
      context: newDesc.trim(),
      updatedAt: Date.now(),
    });
  };

  const handleEditItem = (item) => {
    const nameField = item.name || item.title || item.statement || '';
    const descField = item.description || item.evidence || item.context || '';
    setPromptModal({
      title: `Editar ${item._category || 'plot_points'}`,
      message: 'Nome:',
      initialValue: nameField,
      onConfirm: (newName) => {
        setPromptModal({
          title: 'Descrição',
          message: 'Descrição:',
          initialValue: descField,
          onConfirm: (newDesc) => {
            commitEditItem(item, newName, newDesc);
            setPromptModal(null);
          },
          onCancel: () => setPromptModal(null),
        });
      },
      onCancel: () => setPromptModal(null),
    });
  };

  const handleDeleteItem = (catId, itemId) => {
    setConfirmModal({ title: 'Excluir Item', message: 'Excluir este item?', variant: 'danger', confirmLabel: 'Excluir', onConfirm: () => { performDeleteItem(catId, itemId); setConfirmModal(null); }, onCancel: () => setConfirmModal(null) });
    return;
  };
  const performDeleteItem = (catId, itemId) => {
    const key = catId === 'all' || catId === 'characters' ? 'plot_points' : catId;

    if (catId === 'characters' || catId === 'all') {
      deleteCharacter(itemId);
      return;
    }

    deleteEntityById(key, itemId);
  };

  const handleSendToScript = (item) => {
    const effectiveCat = item._category || 'scenes';

    if (effectiveCat === 'characters') {
      navigateTo('screenplay', item.name || '');
      return;
    }

    const proj = { ...currentProject };
    const scr = [...(proj.screenplay || [])];
    const newId = `sc-bs-${Date.now()}`;

    switch (effectiveCat) {
      case 'scenes': {
        const title = item.title || item.name || 'Cena';
        const desc = item.description || '';
        scr.push({ id: `${newId}-1`, type: 'scene-heading', text: title.toUpperCase() });
        scr.push({ id: `${newId}-2`, type: 'action', text: desc });
        scr.push({ id: `${newId}-3`, type: 'transition', text: 'CORTA PARA:' });
        break;
      }
      case 'dialogues': {
        const speaker = item.speaker || 'PERSONAGEM';
        const line = item.line || '';
        const ctx = item.context || '';
        if (ctx) scr.push({ id: `${newId}-ctx`, type: 'action', text: ctx });
        scr.push({ id: `${newId}-1`, type: 'character', text: speaker.toUpperCase() });
        scr.push({ id: `${newId}-2`, type: 'dialogue', text: line });
        break;
      }
      case 'plot_points': {
        scr.push({ id: `${newId}`, type: 'action', text: `${item.title || 'Ponto da trama'}: ${item.description || ''}` });
        break;
      }
      case 'world_elements': {
        scr.push({ id: `${newId}`, type: 'action', text: `[MUNDO] ${item.name || 'Elemento'}: ${item.description || ''}` });
        break;
      }
      case 'themes': {
        scr.push({ id: `${newId}`, type: 'action', text: `[TEMA] ${item.statement || 'Tema'}` });
        break;
      }
      default: {
        scr.push({ id: `${newId}`, type: 'action', text: item.name || item.title || item.statement || '' });
      }
    }

    updateScreenplay(scr);
    navigateTo('screenplay', newId);
  };

  const handleSendToMap = (item) => {
    const effectiveCat = item._category || 'characters';

    // Character items already exist in mind map — just navigate
    if (effectiveCat === 'characters') {
      const existingNode = (currentProject?.mindMapNodes || []).find(n => {
        if (!n.entityId) return n.type === 'character' && n.label === item.name;
        const disp = resolveNodeDisplay(n, currentProject);
        return disp.entity?.id === item.id;
      });
      navigateTo('mindmap', existingNode?.id || item.id);
      return;
    }

    const proj = { ...currentProject };
    const nodes = [...(proj.mindMapNodes || [])];
    const links = [...(proj.mindMapLinks || [])];

    const typeMap = {
      plot_points: 'plot_point',
      scenes: 'scene',
      dialogues: 'scene',
      world_elements: 'world',
      themes: 'theme',
    };
    const nodeType = typeMap[effectiveCat] || 'plot_point';
    const entityTypeMap = {
      plot_point: 'plot_points',
      scene: 'scenes',
      world: 'world_elements',
      theme: 'themes',
    };
    const entityType = entityTypeMap[nodeType] || 'plot_points';

    // Create entity from item data
    const entityData = createEntity(entityType, { 
      name: item.name || item.title || item.statement || 'Item',
      title: item.name || item.title || item.statement || 'Item',
      description: item.description || item.evidence || item.context || item.relevance || '',
    });
    saveEntity(entityType, entityData);

    const nodeId = `n-bs-${Date.now()}`;
    const newNode = createNodeWithEntity(entityData, entityType, 300 + Math.random() * 400, 300 + Math.random() * 300);
    nodes.push(newNode);

    const firstAct = nodes.find(n => {
      if (n.entityId) {
        const disp = resolveNodeDisplay(n, currentProject);
        return disp.type === 'act';
      }
      return n.type === 'act';
    });
    if (firstAct && !links.some(l =>
      (l.source === firstAct.id && l.target === nodeId) ||
      (l.source === nodeId && l.target === firstAct.id)
    )) {
      links.push({ id: `l-bs-${Date.now()}`, source: firstAct.id, target: nodeId });
    }

    updateMindMap(nodes, links);
    navigateTo('mindmap', nodeId);
  };

  return (
    <div className="brainstorm-tab" ref={containerRef} data-onboarding="brainstorm-tab">
      {getPendingStagingCount() > 0 && (
        <div
          onClick={() => navigateTo('versions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '10px',
            margin: '12px 16px',
            cursor: 'pointer',
            color: '#f59e0b',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.15s'
          }}
          title="Clique para revisar"
        >
          <AlertTriangle size={16} />
          <span>
            {getPendingStagingCount()} atualização(ões) de roteiro pendente(s) — clique para revisar e aprovar
          </span>
        </div>
      )}
      {/* Header Bar */}
      <header className="brainstorm-header glass">
        <div className="header-left">
          <div className="header-title">
            <BrainIcon className="header-icon" size={24} />
            <div>
              <h1>Ideias</h1>
              <span className="idea-count">{plotPoints.length + scenes.length + dialogues.length + themes.length + worldElements.length} itens extraídos</span>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar itens extraídos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grade"
          >
            <Grid size={20} />
          </button>
          <button 
            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Lista"
          >
            <List size={20} />
          </button>
          <button 
            className={`btn-icon ${isProcessing ? 'processing' : ''}`}
            onClick={handleProcessAll}
            disabled={isProcessing || documents.filter(d => d.status === 'pending' || d.status === 'parsed' || d.status === 'error').length === 0}
            title={isProcessing ? 'Processando...' : 'Processar tudo com IA'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="spinning" size={18} /> Processando
              </>
            ) : (
              <>
                <Sparkles size={18} /> Processar IA
              </>
            )}
          </button>
          <button className="btn-primary" onClick={() => setShowRecordModal(true)}>
            <Mic size={18} /> Gravar Reunião
          </button>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} /> Importar Arquivos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="file-input"
            style={{ display: 'none' }}
          />
        </div>
      </header>

      {/* Category Filter Bar */}
      <div className="category-bar glass">
        <div className="category-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={{ '--chip-color': cat.color, '--chip-bg': cat.bg }}
            >
              <span className="chip-icon"><cat.icon size={14} /></span>
              {cat.label}
              <span className="chip-count">{getCategoryCount(cat.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <div className="processing-banner glass-accent">
          <Loader2 className="spinning" size={20} />
          <span>{processingStatus}</span>
        </div>
      )}

      {/* ============ 4-PANEL DASHBOARD ============ */}
      <main className={`brainstorm-dashboard ${viewMode}`}>
        
        {/* PANEL 1: GRAVADORES (top-left) */}
        <section className="panel panel-recorder glass" data-onboarding="brainstorm-recorder">
          <div className="panel-header">
            <h3>
              <Radio className="text-red-500 animate-pulse" size={18} />
              Gravador de Reunião
            </h3>
            <span className="panel-badge">{currentProject?.recordings?.length || 0} gravados</span>
          </div>

          <div className="panel-content">
            {isRecording ? (
              <>
                <button 
                  onClick={stopRecording}
                  className="record-button-circle recording pulse-record"
                  aria-label="Parar gravação"
                >
                  <Square size={32} color="#fff" />
                </button>
                <div className="recording-timer text-2xl font-mono font-bold text-red-500">{formatTime(recordingTime)}</div>
                <div className="speech-status">
                  {speechStatus === 'active' && <span className="status-active"><span className="pulse-dot" /> Transcrevendo ao vivo...</span>}
                  {speechStatus === 'unsupported' && <span className="status-warn">Transcrição não suportada neste navegador</span>}
                  {speechStatus?.startsWith('error:') && <span className="status-error">{speechStatus.replace('error:', '')}</span>}
                </div>
                <div className="live-transcript" aria-live="polite">{liveTranscript || customTranscript}</div>
              </>
            ) : audioUrl ? (
              <>
                <audio src={audioUrl} controls className="audio-player w-full" />
                <div className="w-full flex flex-col gap-3">
                  <label className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                    <MessageSquare size={12} /> Transcrição Editável:
                  </label>
                  <textarea 
                    value={customTranscript} 
                    onChange={(e) => setCustomTranscript(e.target.value)}
                    className="w-full p-2 text-sm bg-gray-900 border border-gray-700 rounded-md text-white"
                    style={{ height: '70px', resize: 'vertical' }}
                    placeholder="Transcrição..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveRecording} className="btn-primary py-2 text-xs flex-1 justify-center rounded-lg">
                        Salvar Ideias
                    </button>
                    <button onClick={() => setAudioUrl(null)} className="btn-secondary py-2 text-xs rounded-lg">
                      Descartar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={startRecording}
                  className="record-button-circle idle"
                >
                  <LottieMic isRecording={false} size={40} />
                </button>
                <span className="text-sm text-gray-400">Clique para iniciar</span>
              </>
            )}

            <div className="divider" />
            
            <div className="section-header">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500">Gravações Recentes</h4>
            </div>
            <div className="recordings-list">
              {currentProject?.recordings?.length > 0 ? (
                (currentProject?.recordings || []).slice(0, 5).map((rec) => (
                  <div key={rec.id} className="recording-item">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200">{rec.title}</span>
                        <span className="text-xs text-gray-500">{rec.duration} • {rec.date}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 italic">"{rec.transcript}"</p>
                    </div>
                    <div>
                      {rec.processed ? (
                        <CheckCircle size={18} className="text-green-500" title="Processado e integrado ao MindMap" />
                      ) : (
                        <span className="text-[10px] bg-yellow-900/40 text-yellow-500 border border-yellow-700/30 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhuma gravacao salva ainda.</p>
              )}
            </div>
          </div>
        </section>

        {/* PANEL 2: DOCUMENTOS IMPORTADOS (top-right) */}
        <section className="panel panel-documents glass" data-onboarding="brainstorm-documents">
          <div className="panel-header">
            <h3>
              <FileText size={18} />
              Documentos Importados
            </h3>
            <div className="panel-actions">
              <button className="btn-secondary sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Importar
              </button>
            </div>
          </div>

          <div className="panel-content">
            {/* Drop Zone */}
            <div 
              className={`drop-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="file-input"
                style={{ display: 'none' }}
              />
              <Upload size={32} className="text-gray-500" />
              <div>
                <p className="font-semibold text-sm">Arraste ou clique para enviar</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, MD</p>
              </div>
            </div>

            {allDocuments.length > 0 && (
              <>
                <div className="section-header">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">Documentos ({allDocuments.length})</h4>
                  <div className="flex gap-2">
                    {documents.some(d => d.status === 'pending' || d.status === 'parsed' || d.status === 'error') && (
                      <button className="btn-secondary py-1 px-3 text-xs rounded" onClick={handleProcessAll}>
                        <ZapIcon size={12} /> Processar Pendentes
                      </button>
                    )}
                    {documents.some(d => d.status === 'processed') && (
                      <button className="btn-secondary py-1 px-3 text-xs rounded" onClick={handleReprocessAll}>
                        <RotateCcw size={12} /> Reprocessar
                      </button>
                    )}
                  </div>
                </div>

                <div className={`documents-container ${viewMode}`}>
                  {allDocuments.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      viewMode={viewMode}
                      onDelete={() => handleDeleteDocument(doc.id)}
                      onRetry={() => handleRetryDocument(doc)}
                      onExpand={() => setExpandedDoc(doc.id === expandedDoc ? null : doc.id)}
                      isExpanded={expandedDoc === doc.id}
                      onEditContent={handleEditRecordingContent}
                      STATUS_CONFIG={STATUS_CONFIG}
                      FILE_TYPE_ICONS={FILE_TYPE_ICONS}
                    />
                  ))}
                </div>
              </>
            )}

            {allDocuments.length === 0 && (
              <div className="empty-state glass text-center py-8">
                <FolderOpen className="empty-icon" size={48} />
                <h3>Nenhum documento ainda</h3>
                <p className="text-gray-500">Importe PDF, DOCX, TXT, MD ou grave uma reunião</p>
              </div>
            )}
          </div>
        </section>

        {/* PANEL 3: CAIXA DE TEXTO MANUAL (bottom-left) */}
        <section className="panel panel-manual-notes glass" data-onboarding="brainstorm-notes">
          <div className="panel-header">
            <h3>
              <Edit size={18} />
              Caixa de Texto Manual
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{manualNotes.split(/\s+/).filter(Boolean).length} palavras</span>
              <span className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle size={10} /> Auto-salvo
              </span>
            </div>
          </div>

          <div className="panel-content">
            <textarea
              ref={manualNotesRef}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full p-4 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-yellow-600"
              style={{ minHeight: '280px', height: '100%' }}
              placeholder="Digite suas ideias, observações, brainstorming livre...&#10;&#10;Ex: 'O detetive Max descobre que a corporação Zenith está clonando memórias...'&#10;&#10;Tudo aqui é auto-salvo localmente e pode virar documento processável pela IA."
            />
            
            <div className="flex gap-2 mt-4">
              <button 
                className="btn-primary py-2 px-4 flex-1 justify-center rounded-lg font-bold"
                onClick={addManualNotesAsDocument}
                disabled={!manualNotes.trim()}
              >
                <Plus size={16} /> Adicionar como Documento
              </button>
              <button 
                className="btn-secondary py-2 px-4 rounded-lg"
                onClick={() => setManualNotes('')}
                disabled={!manualNotes.trim()}
              >
                Limpar
              </button>
            </div>

            {manualNotesDocId && (
              <p className="text-xs text-green-500 mt-3 flex items-center gap-1">
                <CheckCircle size={12} /> Nota adicionada como documento: <strong>Nota manual {new Date().toLocaleTimeString('pt-BR')}</strong>
              </p>
            )}
          </div>
        </section>

        {/* PANEL 4: ITENS EXTRAÍDOS + PROCESSAMENTO (bottom-right) */}
        <section className="panel panel-items glass" data-onboarding="brainstorm-items">
          <div className="panel-header">
            <h3>
              <Sparkles size={18} />
              Itens Extraídos / Processamento
            </h3>
            <div className="panel-actions">
              <button 
                className="btn-secondary sm" 
                onClick={() => { setActiveCategory('all'); setViewMode('grid'); }}
                disabled={activeCategory === 'all' && viewMode === 'grid'}
              >
                <Grid size={14} /> Todas
              </button>
            </div>
          </div>

          <div className="panel-content">
            {isProcessing && (
              <div className="processing-banner glass-accent">
                <Loader2 className="spinning" size={20} />
                <span>{processingStatus}</span>
              </div>
            )}

            {filteredItems.length > 0 ? (
              <>
                {activeCategory !== 'all' && (
                  <div className="category-section-header">
                    <span className="category-section-title">
                      {getCategoryInfo(activeCategory).icon && React.createElement(getCategoryInfo(activeCategory).icon, { size: 16 })} {getCategoryInfo(activeCategory).label}
                    </span>
                    <span className="category-section-count">{filteredItems.length} itens</span>
                  </div>
                )}
                <div className={`items-container ${viewMode}`}>
                  {filteredItems.map((item, index) => (
                    <ItemCard
                      key={`${activeCategory}-${item.id || index}`}
                      item={item}
                      category={activeCategory}
                      viewMode={viewMode}
                      getCategoryInfo={getCategoryInfo}
                      formatDate={formatDate}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onSendToScript={handleSendToScript}
                      onSendToMap={handleSendToMap}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state glass">
                {documents.length === 0 ? (
                  <>
                    <FolderOpen className="empty-icon" size={64} />
                    <h2>Nenhum documento ainda</h2>
                    <p>Grave uma reunião ou importe arquivos (PDF, DOCX, TXT) para começar a extrair estrutura</p>
                    <div className="empty-actions">
                      <button className="btn-primary" onClick={() => setShowRecordModal(true)}>
                        <Mic size={18} /> Gravar Reunião
                      </button>
                      <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={18} /> Importar Arquivos
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Search className="empty-icon" size={64} />
                    <h2>Nenhum item nesta categoria</h2>
                    <p>Processe documentos com a IA para extrair {getCategoryInfo(activeCategory).label.toLowerCase()}s</p>
                    <button className="btn-primary" onClick={handleProcessAll} disabled={isProcessing}>
                      <Sparkles size={18} /> Processar com IA
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Recording Modal */}
      {showRecordModal && (
        <RecordingModal
          isOpen={showRecordModal}
          onClose={() => { setShowRecordModal(false); setAudioUrl(null); }}
          isRecording={isRecording}
          recordingTime={recordingTime}
          audioUrl={audioUrl}
          customTranscript={customTranscript}
          setCustomTranscript={setCustomTranscript}
          liveTranscript={liveTranscript}
          speechStatus={speechStatus}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSave={handleSaveRecording}
          formatTime={formatTime}
        />
      )}

      {confirmModal && <ConfirmModal {...confirmModal} />}
      {promptModal && <PromptModal {...promptModal} />}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileChange}
        className="file-input"
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ===== SUB-COMPONENTS =====

function DocumentCard({ doc, viewMode, onDelete, onRetry, onExpand, isExpanded, onEditContent, STATUS_CONFIG, FILE_TYPE_ICONS }) {
  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const isRecording = doc.metadata?.source === 'recording';
  const FileIcon = isRecording ? Mic : (FILE_TYPE_ICONS[doc.type] || FileText);
  const [editContent, setEditContent] = useState(doc.content || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setEditContent(doc.content || '');
  }, [doc.content, isEditing]);

  const handleSaveEdit = () => {
    onEditContent(doc.id, editContent);
    setIsEditing(false);
  };

  const fileSize = isRecording
    ? `${(doc.content || '').split(/\s+/).filter(Boolean).length} palavras`
    : (doc.size / 1024).toFixed(1) + ' KB';

  if (viewMode === 'list') {
    return (
      <div className={`doc-card list ${doc.status} ${isExpanded ? 'expanded' : ''}`}>
        <div className="doc-main">
          <div className="doc-icon-wrapper">
            <FileIcon size={24} />
          </div>
          <div className="doc-info">
            <div className="doc-header">
              <span className="doc-name">{doc.name}</span>
              <span className={`doc-status ${doc.status}`}>
                <StatusIcon className={status.animate ? 'spinning' : ''} size={14} />
                {status.label}
              </span>
            </div>
            <div className="doc-meta">
              <span>{fileSize}</span>
              {!isRecording && <><span>•</span><span>{doc.type.toUpperCase()}</span></>}
              {isRecording && <><span>•</span><span>{doc.metadata.duration}</span></>}
              {doc.metadata?.pages && <><span>•</span><span>{doc.metadata.pages} pág</span></>}
            </div>
            {doc.error && <div className="doc-error">{doc.error}</div>}
          </div>
          <div className="doc-actions">
            {doc.status === 'error' && (
              <button className="action-btn" onClick={onRetry} title="Tentar novamente">
                <RotateCcw size={16} />
              </button>
            )}
            <button className="action-btn" onClick={onExpand} title={isExpanded ? 'Recolher' : 'Expandir'}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button className="action-btn danger" onClick={onDelete} title="Remover">
              <Trash size={16} />
            </button>
          </div>
        </div>
        {isExpanded && doc.content && (
          <div className="doc-expanded">
            {isEditing ? (
              <div className="doc-edit-area">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-md text-white"
                  rows={6}
                />
                <div className="flex gap-2 mt-2">
                  <button className="btn-primary py-1 px-3 text-xs rounded" onClick={handleSaveEdit}>
                    <Check size={14} /> Salvar
                  </button>
                  <button className="btn-secondary py-1 px-3 text-xs rounded" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="doc-content-preview">
                <div className="doc-content-text">{doc.content}</div>
                {isRecording && (
                  <button className="btn-secondary py-1 px-3 text-xs rounded mt-2" onClick={() => setIsEditing(true)}>
                    <Edit size={14} /> Editar Transcrição
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {isExpanded && doc.extractedData && (
          <div className="doc-expanded">
            <div className="extracted-summary">
              <h5>Itens extraídos deste documento:</h5>
              <div className="extracted-counts">
                {Object.entries(doc.extractedData).map(([key, val]) => 
                  Array.isArray(val) && val.length > 0 && (
                    <span key={key} className="extracted-tag">
                      {key}: {val.length}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`doc-card grid ${doc.status} ${isExpanded ? 'expanded' : ''}`}>
      <div className="doc-card-header">
        <div className="doc-icon-wrapper">
          <FileIcon size={32} />
        </div>
        <div className="doc-card-info">
          <h4 className="doc-card-name">{doc.name}</h4>
          <div className="doc-card-meta">
            <span>{fileSize}</span>
            {!isRecording && <><span>•</span><span>{doc.type.toUpperCase()}</span></>}
            {isRecording && <><span>•</span><span>{doc.metadata.duration}</span></>}
          </div>
        </div>
        <span className={`doc-card-status ${doc.status}`}>
          <StatusIcon className={status.animate ? 'spinning' : ''} size={14} />
          {status.label}
        </span>
      </div>
      <div className="doc-card-actions">
        {doc.status === 'error' && (
          <button className="action-btn" onClick={onRetry} title="Tentar novamente">
            <RotateCcw size={16} />
          </button>
        )}
        <button className="action-btn" onClick={onExpand} title={isExpanded ? 'Recolher' : 'Expandir'}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button className="action-btn danger" onClick={onDelete} title="Remover">
          <Trash size={16} />
        </button>
      </div>
      {doc.error && <div className="doc-card-error">{doc.error}</div>}
      {isExpanded && doc.content && (
        <div className="doc-card-expanded">
          {isEditing ? (
            <div className="doc-edit-area">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 text-sm bg-gray-900 border border-gray-700 rounded-md text-white"
                rows={6}
              />
              <div className="flex gap-2 mt-2">
                <button className="btn-primary py-1 px-3 text-xs rounded" onClick={handleSaveEdit}>
                  <Check size={14} /> Salvar
                </button>
                <button className="btn-secondary py-1 px-3 text-xs rounded" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="doc-content-preview">
              <div className="doc-content-text">{doc.content}</div>
              {isRecording && (
                <button className="btn-secondary py-1 px-3 text-xs rounded mt-2" onClick={() => setIsEditing(true)}>
                  <Edit size={14} /> Editar Transcrição
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {isExpanded && doc.extractedData && (
        <div className="doc-card-expanded">
          <div className="extracted-summary">
            <h5>Itens extraídos:</h5>
            <div className="extracted-counts">
              {Object.entries(doc.extractedData).map(([key, val]) => 
                Array.isArray(val) && val.length > 0 && (
                  <span key={key} className="extracted-tag">
                    {key}: {val.length}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, category, viewMode, getCategoryInfo, formatDate, onEdit, onDelete, onSendToScript, onSendToMap }) {
  const effectiveCat = item._category || category;
  const cat = getCategoryInfo(effectiveCat);
  const Icon = CATEGORY_ICONS[effectiveCat] || TargetIcon2;
  const color = cat.color;
  const bg = cat.bg;

  const cardStyle = {
    '--item-color': color,
    '--item-bg': bg,
  };

  if (viewMode === 'list') {
    return (
      <div className={`item-card list ${item.favorite ? 'favorite' : ''}`} style={cardStyle}>
        <div className="card-color-bar" />
        <div className="card-main">
          <div className="card-header">
            <span className="card-category" style={{ background: bg, color: color }}>
              <Icon size={12} /> {cat.label}
            </span>
            <div className="card-actions">
              <button className="action-btn" onClick={() => onSendToMap(item)} title="Ver no Mapa">
                <MapPinIcon size={16} />
              </button>
              <button className="action-btn" onClick={() => onSendToScript(item)} title="Ver no Roteiro">
                <FilmIcon size={16} />
              </button>
              <button className="action-btn" onClick={() => onEdit(item)} title="Editar">
                <Edit size={16} />
              </button>
              <button className="action-btn danger" onClick={() => onDelete(item._category || category, item.id || item.name)} title="Excluir">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <h3 className="card-title">{item.name || item.title || item.statement}</h3>
          <p className="card-content">{item.description || item.evidence || item.context || ''}</p>
          <div className="card-footer">
            <div className="card-tags">
              {(item.tags || []).slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {(item.tags || []).length > 3 && <span className="tag more">+{(item.tags || []).length - 3}</span>}
            </div>
            <div className="card-meta">
              <span className="meta-item"><Clock size={12} /> {formatDate(item.updatedAt || item.createdAt)}</span>
              {item.sourceDoc && <span className="meta-item source-doc">Fonte: {item.sourceDoc}</span>}
            </div>
          </div>
        </div>
        <div className="card-drag-handle"><GripVertical size={20} /></div>
      </div>
    );
  }

  return (
    <div className={`item-card grid ${item.favorite ? 'favorite' : ''}`} style={cardStyle}>
      <div className="card-color-bar" />
      <div className="card-main">
        <div className="card-header">
          <span className="card-category" style={{ background: bg, color: color }}>
            <Icon size={12} /> {cat.label}
          </span>
          <div className="card-actions">
            <button className="action-btn" onClick={() => onSendToMap(item)} title="Ver no Mapa">
              <MapPinIcon size={16} />
            </button>
            <button className="action-btn" onClick={() => onSendToScript(item)} title="Ver no Roteiro">
              <FilmIcon size={16} />
            </button>
            <button className="action-btn" onClick={() => onEdit(item)} title="Editar">
              <Edit size={16} />
            </button>
            <button className="action-btn danger" onClick={() => onDelete(item._category || category, item.id || item.name)} title="Excluir">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h3 className="card-title">{item.name || item.title || item.statement}</h3>
        <p className="card-content">{item.description || item.evidence || item.context || item.relevance || ''}</p>
        <div className="card-footer">
          <div className="card-tags">
            {(item.tags || []).slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {(item.tags || []).length > 3 && <span className="tag more">+{(item.tags || []).length - 3}</span>}
          </div>
          <div className="card-meta">
            <span className="meta-item"><Clock size={12} /> {formatDate(item.updatedAt || item.createdAt)}</span>
            {item.sourceDoc && <span className="meta-item source-doc">Fonte: {item.sourceDoc}</span>}
          </div>
        </div>
      </div>
      <div className="card-expand-hint" onClick={() => onSendToMap(item)}>
        <ExternalLink size={16} /> Ver no Mapa
      </div>
      <div className="card-drag-handle"><GripVertical size={20} /></div>
    </div>
  );
}

function RecordingModal({ 
  isOpen, onClose, isRecording, recordingTime, audioUrl, 
  customTranscript, setCustomTranscript, liveTranscript, speechStatus,
  onStartRecording, onStopRecording, onSave, formatTime 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal recording-modal glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <Mic className="header-icon" size={24} />
            <h2>{isRecording ? 'Gravando Reunião' : 'Gravar Reunião'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><XIcon size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="recording-area">
            {isRecording ? (
              <>
                <button 
                  onClick={onStopRecording}
                  className="record-button-circle recording pulse-record"
                  aria-label="Parar gravação"
                >
                  <Square size={32} color="#fff" />
                </button>
                <div className="recording-timer">{formatTime(recordingTime)}</div>
                <div className="speech-status">
                  {speechStatus === 'active' && <span className="status-active"><span className="pulse-dot" /> Transcrevendo ao vivo...</span>}
                  {speechStatus === 'unsupported' && <span className="status-warn">Transcrição não suportada neste navegador</span>}
                  {speechStatus?.startsWith('error:') && <span className="status-error">{speechStatus.replace('error:', '')}</span>}
                </div>
                <div className="live-transcript" aria-live="polite">{liveTranscript || customTranscript}</div>
              </>
            ) : audioUrl ? (
              <>
                <audio src={audioUrl} controls className="audio-player" />
                <div className="transcript-section">
                  <label>Transcrição / Notas da reunião</label>
                  <textarea
                    value={customTranscript}
                    onChange={(e) => setCustomTranscript(e.target.value)}
                    className="transcript-textarea"
                    placeholder="Cole a transcrição aqui ou edite as notas..."
                    rows={6}
                  />
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={onStartRecording}
                  className="record-button-circle idle"
                >
                  <LottieMic isRecording={false} size={40} />
                </button>
                <p className="record-hint">Clique para começar a gravar a reunião</p>
              </>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={isRecording}>Cancelar</button>
          <button 
            className="btn-primary" 
            onClick={onSave} 
            disabled={isRecording || !customTranscript.trim()}
          >
            <Check size={18} /> Salvar Reunião
          </button>
        </div>
      </div>
    </div>
  );
}

export { CATEGORIES };