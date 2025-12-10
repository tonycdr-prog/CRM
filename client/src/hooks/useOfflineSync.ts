import { useState, useEffect, useCallback } from "react";
import { loadStorageData, saveStorageData, type StorageData } from "@/lib/storage";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: number | null;
  syncError: string | null;
}

interface SyncQueueItem {
  id: string;
  entityType: "test" | "project" | "damperTemplate" | "stairwellTest";
  entityId: string;
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "airflow-sync-queue";
const LAST_SYNC_KEY = "airflow-last-sync";

function loadSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function getLastSyncTime(): number | null {
  const raw = localStorage.getItem(LAST_SYNC_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function setLastSyncTime(time: number): void {
  localStorage.setItem(LAST_SYNC_KEY, time.toString());
}

export function useOfflineSync(userId?: string) {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingChanges: loadSyncQueue().length,
    lastSyncTime: getLastSyncTime(),
    syncError: null,
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      // Attempt to sync when coming back online
      if (userId) {
        syncToServer();
      }
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId]);

  // Queue a change for sync
  const queueChange = useCallback((
    entityType: SyncQueueItem["entityType"],
    entityId: string,
    action: SyncQueueItem["action"],
    data: any
  ) => {
    const queue = loadSyncQueue();
    
    // Check if there's already a pending change for this entity
    const existingIndex = queue.findIndex(
      item => item.entityType === entityType && item.entityId === entityId
    );

    const newItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      action,
      data,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      // Replace existing change with new one
      if (action === "delete") {
        // If deleting, remove any pending creates/updates
        queue.splice(existingIndex, 1);
        if (queue[existingIndex]?.action !== "create") {
          queue.push(newItem);
        }
      } else {
        queue[existingIndex] = newItem;
      }
    } else {
      queue.push(newItem);
    }

    saveSyncQueue(queue);
    setSyncState(prev => ({ ...prev, pendingChanges: queue.length }));

    // If online, try to sync immediately
    if (navigator.onLine && userId) {
      syncToServer();
    }
  }, [userId]);

  // Sync to server
  const syncToServer = useCallback(async () => {
    if (!userId || !navigator.onLine) return;

    const queue = loadSyncQueue();
    if (queue.length === 0) return;

    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      // Group changes by type
      const changes = {
        tests: queue.filter(i => i.entityType === "test").map(i => i.data),
        projects: queue.filter(i => i.entityType === "project").map(i => i.data),
        damperTemplates: queue.filter(i => i.entityType === "damperTemplate").map(i => i.data),
        stairwellTests: queue.filter(i => i.entityType === "stairwellTest").map(i => i.data),
      };

      const response = await fetch(`/api/sync/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const result = await response.json();
      
      // Clear synced items
      saveSyncQueue([]);
      setLastSyncTime(result.lastSync);

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        pendingChanges: 0,
        lastSyncTime: result.lastSync,
        syncError: null,
      }));
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : "Sync failed",
      }));
    }
  }, [userId]);

  // Fetch data from server
  const fetchFromServer = useCallback(async (): Promise<StorageData | null> => {
    if (!userId || !navigator.onLine) return null;

    try {
      const response = await fetch(`/api/sync/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const serverData = await response.json();
      setLastSyncTime(serverData.lastSync);

      setSyncState(prev => ({
        ...prev,
        lastSyncTime: serverData.lastSync,
      }));

      return serverData;
    } catch (error) {
      console.error("Failed to fetch from server:", error);
      return null;
    }
  }, [userId]);

  // Clear sync queue (for testing/reset)
  const clearQueue = useCallback(() => {
    saveSyncQueue([]);
    setSyncState(prev => ({ ...prev, pendingChanges: 0 }));
  }, []);

  return {
    ...syncState,
    queueChange,
    syncToServer,
    fetchFromServer,
    clearQueue,
  };
}

export default useOfflineSync;
