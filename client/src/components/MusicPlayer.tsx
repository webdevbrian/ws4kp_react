import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';

// Simple background music player that:
// - fetches /playlist.json from the API server
// - serves files from /music (already exposed by Express)
// - starts/stops with AppContext.mediaEnabled
// - updates AppContext.musicTrack with the current filename
const API_BASE = 'http://localhost:8080';

interface PlaylistResponse {
  availableFiles: string[];
}

const MusicPlayer: React.FC = () => {
  const { mediaEnabled, setMediaAvailable, musicTrack, setMusicTrack } = useApp();
  const [tracks, setTracks] = useState<string[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create a stable audio element once
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    audioRef.current.loop = false;
    audioRef.current.crossOrigin = 'anonymous';
  }

  const src = useMemo(() => {
    if (!tracks.length) return '';
    const file = tracks[idx % tracks.length];
    return `${API_BASE}/music/${file}`;
  }, [tracks, idx]);

  useEffect(() => {
    // Load playlist from server
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/playlist.json`);
        if (!res.ok) throw new Error(`Playlist error ${res.status}`);
        const data: PlaylistResponse = await res.json();
        if (Array.isArray(data.availableFiles) && data.availableFiles.length) {
          setTracks(data.availableFiles);
          setMediaAvailable(true);
        } else {
          setTracks([]);
          setMediaAvailable(false);
        }
      } catch (e) {
        console.warn('Failed to load playlist.json', e);
        setTracks([]);
        setMediaAvailable(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setIdx((i) => (i + 1) % Math.max(1, tracks.length));
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!src) return;
    audio.src = src;
    setMusicTrack(src.split('/').pop() || '');

    const playIfEnabled = async () => {
      if (mediaEnabled) {
        try {
          await audio.play();
        } catch (e) {
          // Autoplay may be blocked until user interacts; leave paused
          console.warn('Audio play blocked by browser policy', e);
        }
      } else {
        audio.pause();
      }
    };

    playIfEnabled();
  }, [src, mediaEnabled, setMusicTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (mediaEnabled) {
      audio.play().catch(() => {/* ignore */});
    } else {
      audio.pause();
    }
  }, [mediaEnabled]);

  // No UI; background player only
  return null;
};

export default MusicPlayer;
