import { useState, useEffect, useRef, useCallback } from 'react';
import { tasksAPI } from '../api';

const POLL_INTERVAL_MS = 30_000; // 30 seconds — Firestore is slow, no need to hammer it

/**
 * useRealtimeTasks
 * Smart polling hook — polls every 30s, pauses when tab is hidden,
 * and refetches immediately on window focus / tab becoming visible.
 */
export function useRealtimeTasks(projectId) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive]   = useState(false);
  const [error, setError]     = useState(null);

  const intervalRef   = useRef(null);
  const isMounted     = useRef(true);
  const lastEtagRef   = useRef('');

  const fetchTasks = useCallback(async (silent = false) => {
    if (!projectId || document.hidden) return; // skip if tab not visible
    try {
      const res  = await tasksAPI.list(projectId);
      const data = res.data.tasks || [];

      if (!isMounted.current) return;

      // Skip re-render if data hasn't changed (cheap string comparison)
      const etag = data.map((t) => `${t.id}:${t.updatedAt}`).join('|');
      if (etag !== lastEtagRef.current) {
        lastEtagRef.current = etag;
        setTasks(data);
      }

      setError(null);
      setIsLive(true);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err);
      setIsLive(false);
    } finally {
      if (!silent && isMounted.current) setLoading(false);
    }
  }, [projectId]);

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchTasks(true), POLL_INTERVAL_MS);
  }, [fetchTasks]);

  useEffect(() => {
    if (!projectId) return;
    isMounted.current   = true;
    lastEtagRef.current = '';

    setLoading(true);
    setIsLive(false);
    fetchTasks(false);
    startInterval();

    // Refetch immediately when window regains focus
    const handleFocus = () => { fetchTasks(true); startInterval(); };

    // Pause polling when tab hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        fetchTasks(true);
        startInterval();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted.current = false;
      clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchTasks, startInterval, projectId]);

  const refresh = useCallback(() => fetchTasks(true), [fetchTasks]);

  return { tasks, setTasks, loading, isLive, error, refresh };
}
