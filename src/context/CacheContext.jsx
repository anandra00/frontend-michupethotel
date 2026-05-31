import { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext();

export const CacheProvider = ({ children }) => {
  const [cache, setCache] = useState({});

  const getCache = useCallback((key) => {
    return cache[key];
  }, [cache]);

  const setCacheValue = useCallback((key, value) => {
    setCache((prev) => ({ ...prev, [key]: value }));
  }, []);

  const removeCache = useCallback((key) => {
    setCache((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  return (
    <CacheContext.Provider value={{ getCache, setCacheValue, removeCache, clearCache }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
