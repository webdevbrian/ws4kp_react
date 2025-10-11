import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavigationContextType {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentDisplay: string;
  setCurrentDisplay: (display: string) => void;
  displays: string[];
  setDisplays: (displays: string[]) => void;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState('current-weather');
  const [displays, setDisplays] = useState<string[]>([
    'progress',
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
  ]);

  const next = useCallback(() => {
    const currentIndex = displays.indexOf(currentDisplay);
    const nextIndex = (currentIndex + 1) % displays.length;
    setCurrentDisplay(displays[nextIndex]);
  }, [currentDisplay, displays]);

  const previous = useCallback(() => {
    const currentIndex = displays.indexOf(currentDisplay);
    const previousIndex = currentIndex === 0 ? displays.length - 1 : currentIndex - 1;
    setCurrentDisplay(displays[previousIndex]);
  }, [currentDisplay, displays]);

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
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, next]);

  const value = {
    isPlaying,
    setIsPlaying,
    currentDisplay,
    setCurrentDisplay,
    displays,
    setDisplays,
    next,
    previous,
    play,
    pause,
    refresh,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};