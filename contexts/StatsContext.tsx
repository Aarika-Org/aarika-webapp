import React, { createContext, useContext, useState, useCallback } from 'react';
import { LogEntry } from '../types';

interface StatsContextType {
  isOpen: boolean;
  toggleStats: () => void;
  logs: LogEntry[];
  addLog: (source: LogEntry['source'], event: string, details?: any) => void;
  clearLogs: () => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const toggleStats = () => setIsOpen(prev => !prev);

  const addLog = useCallback((source: LogEntry['source'], event: string, details: any = null) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      source,
      event,
      details,
      type: 'info' // simple for now
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const clearLogs = () => setLogs([]);

  return (
    <StatsContext.Provider value={{ isOpen, toggleStats, logs, addLog, clearLogs }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};
