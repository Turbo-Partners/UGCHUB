import { useState, useEffect } from 'react';

export type ViewMode = 'cards' | 'table' | 'kanban';

export function useViewPreference(storageKey: string, defaultView: ViewMode = 'cards'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as ViewMode) || defaultView;
    } catch {
      return defaultView;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, viewMode);
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  }, [storageKey, viewMode]);

  return [viewMode, setViewMode];
}
