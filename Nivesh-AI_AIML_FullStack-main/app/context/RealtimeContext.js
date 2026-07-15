'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const RealtimeContext = createContext();

export function RealtimeProvider({ children }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RealtimeContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeRefresh() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeRefresh must be used within RealtimeProvider');
  }
  return context;
}
