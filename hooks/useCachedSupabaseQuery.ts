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
      if (queryError) throw queryError;
      
      setData(freshData as T);
      setCachedData({ data: freshData as T, timestamp: Date.now() });
    } catch (err: any) {
      console.error(`Error fetching data for ${cacheKey}:`, err.message);
      setError(err);
      if (!cachedData?.data) {
        setData(null);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...dependencies]);

  // Effect for initial load and when main dependencies change
  useEffect(() => {
    const isCacheStale = !cachedData || (Date.now() - cachedData.timestamp > CACHE_DURATION);

    if (isCacheStale || !cachedData?.data) {
      fetchData(false);
    } else {
      setData(cachedData.data);
      setLoading(false);
      fetchData(true); // Background refresh for freshness
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // Effect for handling real-time data changes from subscriptions
  useEffect(() => {
    if (!lastDataChange || loading) {
      return;
    }
    
    const currentData = data;
    
    const isArrayOfObjects = (d: any): d is { id: any }[] => Array.isArray(d);

    if (!isArrayOfObjects(currentData) && lastDataChange.type !== 'batch_update') {
      fetchData(true);
      return;
    }

    const updateAndCache = (newData: T) => {
      setData(newData);
      setCachedData({ data: newData, timestamp: Date.now() });
    };

    switch (lastDataChange.type) {
      case 'add':
        if(isArrayOfObjects(currentData)) {
            if (!currentData.find(item => item.id === lastDataChange.payload.id)) {
              updateAndCache([...currentData, lastDataChange.payload] as unknown as T);
            }
        }
        break;
      case 'update':
        if(isArrayOfObjects(currentData)) {
            let itemFound = false;
            const updatedData = currentData.map(item => {
              if (item.id === lastDataChange.payload.id) {
                itemFound = true;
                return lastDataChange.payload;
              }
              return item;
            });
            if (!itemFound) {
              updatedData.push(lastDataChange.payload);
            }
            updateAndCache(updatedData as unknown as T);
        }
        break;
      case 'delete':
        if(isArrayOfObjects(currentData)) {
            updateAndCache(currentData.filter(item => item.id !== lastDataChange.payload.id) as unknown as T);
        }
        break;
      case 'delete_many':
        if(isArrayOfObjects(currentData)) {
            const idsToDelete = new Set(lastDataChange.payload.ids);
            updateAndCache(currentData.filter(item => !idsToDelete.has(item.id)) as unknown as T);
        }
        break;
      default:
        // For batch_update or unknown types, fall back to a full refetch
        fetchData(true);
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDataChange]);


  return { data, loading, error };
}
