import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavigationContextType {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentDisplay: string;
  setCurrentDisplay: (display: string) => void;
  displays: string[];
  setDisplays: (displays: string[]) => void;
  hasActiveAlerts: boolean;
  setHasActiveAlerts: (value: boolean) => void;
  next: () => void;
  previous: () => void;
  play: () => void;
  pause: () => void;
  refresh: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const defaultDisplays = [
    'hourly',
    'hourly-graph',
    'travel',
    'current-weather',
    'local-forecast',
    'latest-observations',
    'regional-forecast',
    'almanac',
    'spc-outlook',
    'extended-forecast',
    'radar',
    'hazards'
  ];

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('nav.isPlaying');
      return v === '1' || v === 'true';
    } catch { return false; }
  });
  const [currentDisplay, setCurrentDisplay] = useState<string>(() => {
    try { return localStorage.getItem('nav.currentDisplay') || 'current-weather'; }
    catch { return 'current-weather'; }
  });
  const [displays, setDisplays] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nav.displays');
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : defaultDisplays;
    } catch { return defaultDisplays; }
  });
  const [hasActiveAlerts, setHasActiveAlerts] = useState<boolean>(false);

  // Filter displays based on whether hazards should be shown
  const activeDisplays = displays.filter(d => d !== 'hazards' || hasActiveAlerts);

  const next = useCallback(() => {
    const currentIndex = activeDisplays.indexOf(currentDisplay);
    const nextIndex = (currentIndex + 1) % activeDisplays.length;
    setCurrentDisplay(activeDisplays[nextIndex]);
  }, [currentDisplay, activeDisplays]);

  const previous = useCallback(() => {
    const currentIndex = activeDisplays.indexOf(currentDisplay);
    const previousIndex = currentIndex === 0 ? activeDisplays.length - 1 : currentIndex - 1;
    setCurrentDisplay(activeDisplays[previousIndex]);
  }, [currentDisplay, activeDisplays]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        next();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, next]);

  // Persist core navigation states
  useEffect(() => {
    try { localStorage.setItem('nav.isPlaying', isPlaying ? '1' : '0'); } catch { }
  }, [isPlaying]);

  useEffect(() => {
    try { localStorage.setItem('nav.currentDisplay', currentDisplay); } catch { }
  }, [currentDisplay]);

  useEffect(() => {
    try { localStorage.setItem('nav.displays', JSON.stringify(displays)); } catch { }
  }, [displays]);

  // Keep currentDisplay valid if the list changes or excludes the current one
  useEffect(() => {
    setCurrentDisplay(prev => {
      if (!activeDisplays.includes(prev)) {
        return activeDisplays[0] || 'current-weather';
      }
      return prev;
    });
  }, [activeDisplays]);

  const value = {
    isPlaying,
    setIsPlaying,
    currentDisplay,
    setCurrentDisplay,
    displays,
    setDisplays,
    hasActiveAlerts,
    setHasActiveAlerts,
    next,
    previous,
    play,
    pause,
    refresh,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};