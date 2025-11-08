import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { DataChange } from '../App';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache duration in milliseconds (e.g., 5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function useCachedSupabaseQuery<T>({
  cacheKey,
  query,
  dependencies = [],
  lastDataChange,
}: {
  cacheKey: string;
  query: () => Promise<{ data: T | null; error: any }>;
  dependencies?: any[];
  lastDataChange: DataChange | null;
}) {
  const [cachedData, setCachedData] = useLocalStorage<CacheEntry<T> | null>(cacheKey, null);
  const [data, setData] = useState<T | null>(cachedData?.data ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data: freshData, error: queryError } = await query();

      if (queryError) {
        throw queryError;
      }

      setData(freshData as T);
      setCachedData({ data: freshData as T, timestamp: Date.now() });
    } catch (err: any) {
      console.error(`Error fetching data for ${cacheKey}:`, err.message);
      setError(err);
      // If fetch fails, keep showing stale data if available
      if (!cachedData?.data) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, query, setCachedData, ...dependencies]);

  useEffect(() => {
    const isCacheStale = !cachedData || (Date.now() - cachedData.timestamp > CACHE_DURATION);

    if (isCacheStale) {
      // If cache is stale or empty, perform a full load
      fetchData(false);
    } else {
      // If cache is fresh, show cached data and refresh in the background
      setData(cachedData.data);
      setLoading(false); // We have data to show, so not in a "hard" loading state
      fetchData(true); // Background refresh
    }
  }, [fetchData, lastDataChange]); // Rerun when dependencies or lastDataChange timestamp changes

  return { data, loading, error };
}
