import React, { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

interface YouTubePlayerProps {
  videoId: string;
  randomSeek: boolean;
  enabled: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, randomSeek, enabled }) => {
  const { setMusicTrack } = useApp();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!containerRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: enabled ? 1 : 0,
          loop: 1,
          playlist: videoId,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            const player = event.target;

            if (randomSeek) {
              const duration = player.getDuration();
              if (duration > 0) {
                const randomTime = Math.random() * duration;
                player.seekTo(randomTime, true);
              }
            }

            if (enabled) {
              player.playVideo();
              player.setVolume(50);
            }

            setMusicTrack('YouTube: ' + videoId);
          },
          onStateChange: (event: any) => {
            // If ended, loop manually (backup for loop parameter)
            if (event.data === 0) {
              if (randomSeek) {
                const duration = event.target.getDuration();
                const randomTime = Math.random() * duration;
                event.target.seekTo(randomTime, true);
              }
              event.target.playVideo();
            }
          }
        }
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, randomSeek]);

  useEffect(() => {
    if (!playerRef.current) return;

    if (enabled) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [enabled]);

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div ref={containerRef} />
    </div>
  );
};

export default YouTubePlayer;