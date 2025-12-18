import { useEffect, useRef, useState } from "react";
import { flushQueue, getPendingCount } from "@/lib/offlineQueue";

export function useSyncQueue(opts?: { inspectionId?: string }) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, remaining: 0 });
  const timer = useRef<number | null>(null);

  async function refresh() {
    try {
      const c = await getPendingCount(opts?.inspectionId);
      setPending(c);
    } catch {
      // IndexedDB not available
    }
  }

  async function syncNow() {
    if (syncing) return;
    if (!navigator.onLine) return;

    setSyncing(true);
    setProgress({ sent: 0, remaining: pending });

    try {
      await flushQueue({
        onProgress: (sent, remaining) => setProgress({ sent, remaining }),
      });
    } finally {
      setSyncing(false);
      await refresh();
    }
  }

  useEffect(() => {
    refresh();
    const onOnline = () => syncNow();
    window.addEventListener("online", onOnline);

    timer.current = window.setInterval(() => refresh(), 5000) as unknown as number;

    return () => {
      window.removeEventListener("online", onOnline);
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.inspectionId]);

  return { pending, syncing, progress, refresh, syncNow };
}
