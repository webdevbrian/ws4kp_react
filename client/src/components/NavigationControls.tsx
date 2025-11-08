import React, { useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useApp } from '../contexts/AppContext';

const NavigationControls: React.FC = () => {
  const { isPlaying, next, previous, play, pause, refresh } = useNavigation();
  const {
    isFullscreen,
    setIsFullscreen,
    scanlines,
    setScanlines,
    mediaAvailable,
    mediaEnabled,
    setMediaEnabled
  } = useApp();

  const handlePlayPauseClick = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleFullscreenClick = () => {
    const el = document.getElementById('divTwc');
    if (!document.fullscreenElement) {
      (el || document.documentElement).requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMediaToggle = () => {
    setMediaEnabled(!mediaEnabled);
  };

  const handleScanlinesToggle = () => {
    setScanlines(!scanlines);
    // Apply scanlines only to the main display container, not the entire page
    const container = document.getElementById('container');
    if (container) {
      container.classList.toggle('scanlines', !scanlines);
    }
    // Ensure body does not retain the class if it was previously applied
    document.body.classList.remove('scanlines');
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          previous();
          break;
        case ' ':
          e.preventDefault();
          handlePlayPauseClick();
          break;
        case 'F11':
          e.preventDefault();
          handleFullscreenClick();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isPlaying]);

  return (
    <div id="divTwcBottom">
      <div id="divTwcBottomLeft">
        {/* <img
          id="NavigateMenu"
          className="navButton"
          src="/images/nav/ic_menu_white_24dp_2x.png"
          title="Menu"
          onClick={handleMenuClick}
        /> */}
        <img
          id="NavigatePrevious"
          className="navButton"
          src="/images/nav/ic_skip_previous_white_24dp_2x.png"
          title="Previous"
          onClick={previous}
        />
        <img
          id="NavigateNext"
          className="navButton"
          src="/images/nav/ic_skip_next_white_24dp_2x.png"
          title="Next"
          onClick={next}
        />
        <img
          id="NavigatePlay"
          className="navButton"
          src={isPlaying
            ? "/images/nav/ic_pause_white_24dp_2x.png"
            : "/images/nav/ic_play_arrow_white_24dp_2x.png"}
          title={isPlaying ? "Pause" : "Play"}
          onClick={handlePlayPauseClick}
        />
      </div>
      <div id="divTwcBottomMiddle">
        <img
          id="NavigateRefresh"
          className="navButton"
          src="/images/nav/ic_refresh_white_24dp_2x.png"
          title="Refresh"
          onClick={refresh}
        />
      </div>
      <div id="divTwcBottomRight">
        <div id="ToggleMedia" className={mediaAvailable ? 'available' : ''} onClick={handleMediaToggle}>
          <img
            className={`navButton ${mediaEnabled ? 'off' : 'on'}`}
            src="/images/nav/ic_volume_off_white_24dp_2x.png"
            title="Unmute"
            style={{ display: mediaEnabled ? 'none' : 'inline' }}
          />
          <img
            className={`navButton ${mediaEnabled ? 'on' : 'off'}`}
            src="/images/nav/ic_volume_on_white_24dp_2x.png"
            title="Mute"
            style={{ display: mediaEnabled ? 'inline' : 'none' }}
          />
        </div>
        <div id="ToggleScanlines" onClick={handleScanlinesToggle}>
          <img
            className={`navButton ${scanlines ? 'off' : 'on'}`}
            src="/images/nav/ic_scanlines_off_white_24dp_2x.png"
            title="Scan lines on"
            style={{ display: scanlines ? 'none' : 'inline' }}
          />
          <img
            className={`navButton ${scanlines ? 'on' : 'off'}`}
            src="/images/nav/ic_scanlines_on_white_24dp_2x.png"
            title="Scan lines off"
            style={{ display: scanlines ? 'inline' : 'none' }}
          />
        </div>
        {!isIOS() && (
          <img
            id="ToggleFullScreen"
            className="navButton"
            src="/images/nav/ic_fullscreen_white_24dp_2x.png"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            onClick={handleFullscreenClick}
          />
        )}
      </div>
    </div>
  );
};

export default NavigationControls;