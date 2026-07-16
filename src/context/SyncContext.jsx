import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { syncProjectToSupabase } from '../lib/sync';

const QUEUE_KEY = 'cineweave_sync_queue';
const MAX_RETRIES = 3;

const SyncContext = createContext(null);

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const processingRef = useRef(false);
  const queueRef = useRef([]);

  useEffect(() => {
    queueRef.current = loadQueue();
    setPendingCount(queueRef.current.length);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const queue = [...queueRef.current];
    const remaining = [];

    for (const op of queue) {
      try {
        if (op.type === 'syncProject') {
          await syncProjectToSupabase(op.data);
        }
      } catch (err) {
        console.error(`[SyncQueue] ${op.type} failed:`, err);
        op.retries = (op.retries || 0) + 1;
        if (op.retries < MAX_RETRIES) {
          remaining.push(op);
        }
      }
    }

    queueRef.current = remaining;
    saveQueue(remaining);
    setPendingCount(remaining.length);
    processingRef.current = false;
  }, []);

  useEffect(() => {
    if (isOnline && queueRef.current.length > 0) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  const syncProject = useCallback(async (project) => {
    if (isOnline) {
      try {
        await syncProjectToSupabase(project);
      } catch {
        enqueueOperation({ type: 'syncProject', projectId: project.id, data: project });
      }
    } else {
      enqueueOperation({ type: 'syncProject', projectId: project.id, data: project });
    }
  }, [isOnline]);

  const enqueueOperation = useCallback((operation) => {
    const op = {
      ...operation,
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    queueRef.current.push(op);
    saveQueue(queueRef.current);
    setPendingCount(queueRef.current.length);
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    saveQueue([]);
    setPendingCount(0);
  }, []);

  return (
    <SyncContext.Provider value={{
      isOnline,
      pendingCount,
      syncProject,
      clearQueue,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
}
