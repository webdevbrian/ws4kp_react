import React, { createContext, useContext, useState } from 'react';

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
  const [scanlines, setScanlines] = useState(false);
  const [mediaAvailable, setMediaAvailable] = useState(false);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [musicTrack, setMusicTrack] = useState('Not playing');

  const serverAvailable = window.WS4KP_SERVER_AVAILABLE || false;

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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};