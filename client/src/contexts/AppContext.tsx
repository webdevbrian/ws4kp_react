import React, { createContext, useContext, useEffect, useState } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  stationId?: string;
  radarId?: string;
  zoneId?: string;
  officeId?: string;
  gridX?: number;
  gridY?: number;
}

interface AppContextType {
  location: Location | null;
  setLocation: (location: Location | null) => void;
  serverAvailable: boolean;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  scanlines: boolean;
  setScanlines: (value: boolean) => void;
  mediaAvailable: boolean;
  setMediaAvailable: (value: boolean) => void;
  mediaEnabled: boolean;
  setMediaEnabled: (value: boolean) => void;
  musicTrack: string;
  setMusicTrack: (value: string) => void;
  youtubeEnabled: boolean;
  setYoutubeEnabled: (value: boolean) => void;
  youtubeUrl: string;
  setYoutubeUrl: (value: string) => void;
  youtubeRandomSeek: boolean;
  setYoutubeRandomSeek: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanlines, setScanlines] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('app.scanlines');
      return v === '1' || v === 'true';
    } catch { return false; }
  });
  const [mediaAvailable, setMediaAvailable] = useState(false);
  const [mediaEnabled, setMediaEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('app.mediaEnabled');
      return v === '1' || v === 'true';
    } catch { return false; }
  });
  const [musicTrack, setMusicTrack] = useState<string>(() => {
    try {
      return localStorage.getItem('app.musicTrack') || 'Not playing';
    } catch { return 'Not playing'; }
  });
  const [youtubeEnabled, setYoutubeEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('app.youtubeEnabled');
      return v === '1' || v === 'true';
    } catch { return false; }
  });
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('app.youtubeUrl') || 'https://www.youtube.com/watch?v=j-prqnvaDgA';
    } catch { return 'https://www.youtube.com/watch?v=j-prqnvaDgA'; }
  });
  const [youtubeRandomSeek, setYoutubeRandomSeek] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('app.youtubeRandomSeek');
      return v === '1' || v === 'true';
    } catch { return false; }
  });

  const serverAvailable = window.WS4KP_SERVER_AVAILABLE || false;

  useEffect(() => {
    try { localStorage.setItem('app.scanlines', scanlines ? '1' : '0'); } catch { }
    const container = document.getElementById('container');
    if (container) container.classList.toggle('scanlines', scanlines);
    document.body.classList.remove('scanlines');
  }, [scanlines]);

  useEffect(() => {
    try { localStorage.setItem('app.mediaEnabled', mediaEnabled ? '1' : '0'); } catch { }
  }, [mediaEnabled]);

  useEffect(() => {
    try { localStorage.setItem('app.musicTrack', musicTrack || ''); } catch { }
  }, [musicTrack]);

  useEffect(() => {
    try { localStorage.setItem('app.youtubeEnabled', youtubeEnabled ? '1' : '0'); } catch { }
  }, [youtubeEnabled]);

  useEffect(() => {
    try { localStorage.setItem('app.youtubeUrl', youtubeUrl || ''); } catch { }
  }, [youtubeUrl]);

  useEffect(() => {
    try { localStorage.setItem('app.youtubeRandomSeek', youtubeRandomSeek ? '1' : '0'); } catch { }
  }, [youtubeRandomSeek]);

  const value = {
    location,
    setLocation,
    serverAvailable,
    isFullscreen,
    setIsFullscreen,
    scanlines,
    setScanlines,
    mediaAvailable,
    setMediaAvailable,
    mediaEnabled,
    setMediaEnabled,
    musicTrack,
    setMusicTrack,
    youtubeEnabled,
    setYoutubeEnabled,
    youtubeUrl,
    setYoutubeUrl,
    youtubeRandomSeek,
    setYoutubeRandomSeek,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};