const OFFLINE_QUEUE_KEY = 'orbit_offline_transaction_queue';

export const offlineSyncService = {
  getQueue: () => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  enqueue: (transactionPayload) => {
    try {
      const queue = offlineSyncService.getQueue();
      queue.push({
        ...transactionPayload,
        _clientQueuedAt: new Date().toISOString(),
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error('Failed to queue offline transaction:', e);
      return false;
    }
  },

  clearQueue: () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  syncPending: async (apiClient) => {
    if (!navigator.onLine) return { syncedCount: 0 };
    const queue = offlineSyncService.getQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    let synced = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        await apiClient.post('/transactions', item);
        synced++;
      } catch (err) {
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } else {
      offlineSyncService.clearQueue();
    }

    if (synced > 0) {
      window.dispatchEvent(new CustomEvent('orbit:transaction-created'));
    }

    return { syncedCount: synced };
  },

  initOnlineListener: (apiClient) => {
    window.addEventListener('online', () => {
      offlineSyncService.syncPending(apiClient);
    });
    // Check on startup
    if (navigator.onLine) {
      offlineSyncService.syncPending(apiClient);
    }
  },
};

export default offlineSyncService;
