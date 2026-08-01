// hooks/useCache.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

export function useCache<T>({ key, ttl = 5 * 60 * 1000 }: CacheOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheData = useCallback(async (value: T) => {
    try {
      const cacheItem = {
        data: value,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      setData(value);
    } catch (err) {
      console.error('Error caching data:', err);
    }
  }, [key]);

  const getCachedData = useCallback(async (): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error('Error reading cache:', err);
      return null;
    }
  }, [key, ttl]);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setData(null);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, [key]);

  const fetchData = useCallback(async (fetcher: () => Promise<T>) => {
    try {
      setLoading(true);
      
      // Check cache first
      const cached = await getCachedData();
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return cached;
      }

      // Fetch fresh data
      const fresh = await fetcher();
      await cacheData(fresh);
      setData(fresh);
      return fresh;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCachedData, cacheData]);

  return {
    data,
    loading,
    error,
    fetchData,
    cacheData,
    clearCache,
    getCachedData
  };
}

export default useCache;