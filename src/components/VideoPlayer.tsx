'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { LectureItem, ServerOption } from '@/types';

interface VideoPlayerProps {
  playlist: LectureItem[];
  currentIndex: number;
  courseName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Extract Vidmoly file code from embed URL
function extractVidmolyCode(url: string): string | null {
  const m = url.match(/(?:embed-|w\/|vidmoly\.(?:net|me)\/)([a-zA-Z0-9]{10,16})/);
  return m ? m[1] : null;
}

// Extract Earnvids file code from morencius URL
function extractEarnvidsCode(url: string): string | null {
  const m = url.match(/morencius\.com\/v\/([a-zA-Z0-9]{10,16})/);
  return m ? m[1] : null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  currentIndex,
  courseName,
  onClose,
  onNavigate,
}) => {
  const currentItem = playlist[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playerMode, setPlayerMode] = useState<'proxy' | 'embedded'>('proxy');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [isEmbedLoading, setIsEmbedLoading] = useState<boolean>(true);
  const [isItemChanging, setIsItemChanging] = useState<boolean>(false);


  const speedOptions = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  // Load preferred mode on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('stutosed_preferred_player_mode');
      if (savedMode === 'embedded' || savedMode === 'proxy') {
        setPlayerMode(savedMode);
      }
    } catch {}
  }, []);

  // Reset server selection when lecture index changes
  useEffect(() => {
    setSelectedServerIndex(0);
    setResolvedStreamUrl(null);
    setStreamError(null);
    setIsBuffering(false);
    setIsEmbedLoading(true);
    // Flash "changing" indicator for 120ms to give immediate visual feedback
    setIsItemChanging(true);
    const t = setTimeout(() => setIsItemChanging(false), 120);
    return () => clearTimeout(t);
  }, [currentIndex]);

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    // Cross-origin speed bridge for embedded iframe
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'setPlaybackRate', rate: spd }, '*');
      } catch {}
    }
    setShowSpeedMenu(false);
  };

  // Determine active URL from servers array or fallback
  const servers: ServerOption[] = currentItem?.servers && currentItem.servers.length > 0
    ? currentItem.servers
    : [];

  const activeServer = servers[selectedServerIndex] || null;
  const activeUrl = activeServer?.url || currentItem?.url || '';

  // Determine URL types
  const isVidmolyUrl = activeUrl.includes('vidmoly.');
  const isEarnvidsUrl = activeUrl.includes('morencius.') || activeUrl.includes('earnvids.');
  const isYouTubeUrl = activeUrl.includes('youtube.') || activeUrl.includes('youtu.be');
  const isHlsUrl = activeUrl.includes('.m3u8');

  // Proxy streaming for ALBA, ESTE, direct mp4 files
  const isProxyStreamUrl =
    activeUrl.includes('streamvaultpro.cc') ||
    activeUrl.includes('workers.dev') ||
    activeUrl.includes('publicbotshub') ||
    activeUrl.includes('herokuapp.com') ||
    activeUrl.endsWith('.mp4') ||
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    activeServer?.name?.toUpperCase().includes('ESTE');

  // ALBA = has streamUrl, or is StreamVault URL. Used for Smart Proxy/Embedded toggle display
  const isAlbaActive =
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    (!activeServer && activeUrl.includes('streamvaultpro.cc')) ||
    Boolean(activeServer?.streamUrl);

  // For YouTube — auto-switch to embedded if currently in proxy (can't proxy YouTube)
  useEffect(() => {
    if (isYouTubeUrl && playerMode === 'proxy') {
      setPlayerMode('embedded');
    }
  }, [isYouTubeUrl, playerMode]);

  // If user switches to ESTE (Publico) or non-ALBA server, force mode to proxy
  useEffect(() => {
    if (!isAlbaActive && !isYouTubeUrl && playerMode === 'embedded') {
      setPlayerMode('proxy');
    }
  }, [isAlbaActive, isYouTubeUrl, playerMode]);

  const needsApiResolution = (isVidmolyUrl || isEarnvidsUrl) && !isHlsUrl;

  // Embedded URL builder
  const getEmbeddedUrl = (): string => {
    if (isYouTubeUrl) {
      const id = activeUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : activeUrl;
    }
    if (isVidmolyUrl) {
      const code = extractVidmolyCode(activeUrl);
      return code ? `/api/embed?code=${code}&provider=vidmoly` : activeUrl;
    }
    if (isEarnvidsUrl) {
      const code = extractEarnvidsCode(activeUrl);
      return code ? `/api/embed?code=${code}&provider=earnvids` : activeUrl;
    }
    // StreamVault (ALBA): use official embedded stream page via /api/embed proxy
    if (activeUrl.includes('streamvaultpro.cc') || activeServer?.streamUrl) {
      const streamUrl = activeServer?.streamUrl || activeUrl.replace('/0:/dl/', '/0:/stream/');
      return `/api/embed?url=${encodeURIComponent(streamUrl)}`;
    }
    return `/api/embed?url=${encodeURIComponent(activeUrl)}`;
  };

  // Resolve stream URL for Vidmoly/Earnvids via server-side API (for proxy mode)
  useEffect(() => {
    if (playerMode !== 'proxy' || !needsApiResolution || !activeUrl) {
      setResolvedStreamUrl(null);
      setStreamLoading(false);
      return;
    }

    setStreamLoading(true);
    setResolvedStreamUrl(null);
    setStreamError(null);

    let code: string | null = null;
    let provider = 'vidmoly';

    if (isVidmolyUrl) {
      code = extractVidmolyCode(activeUrl);
    } else if (isEarnvidsUrl) {
      code = extractEarnvidsCode(activeUrl);
      provider = 'earnvids';
    }

    if (!code) {
      setStreamLoading(false);
      setStreamError('Invalid video code');
      return;
    }

    const abortController = new AbortController();

    fetch(`/api/stream?code=${code}&provider=${provider}`, { signal: abortController.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.streamUrl) {
          setResolvedStreamUrl(data.streamUrl);
        } else {
          setStreamError(data.error || 'Unable to load video stream');
        }
        setStreamLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setStreamError('Connection to video stream timed out');
          setStreamLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [activeUrl, needsApiResolution, isVidmolyUrl, isEarnvidsUrl, playerMode]);

  // Determine media source for <video> element
  const videoSourceUrl = isProxyStreamUrl
    ? `/api/stream?url=${encodeURIComponent(activeUrl)}`
    : isHlsUrl
    ? activeUrl
    : resolvedStreamUrl;

  // Video element attachment and HLS / MP4 engine setup
  useEffect(() => {
    if (playerMode !== 'proxy' || !videoSourceUrl || !videoRef.current) return;

    const video = videoRef.current;
    setQualities([]);
    setCurrentQuality(-1);
    setIsPlaying(false);
    setIsBuffering(true);

    // If proxy MP4 stream (ALBA or ESTE), play natively via <video>
    if (isProxyStreamUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = videoSourceUrl;
      video.load();
      video.play().catch(() => {});
      return;
    }

    // HLS Stream (.m3u8) handling
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (video.canPlayType('application/vnd.apple.mpegurl') && (isSafari || !Hls.isSupported())) {
      video.src = videoSourceUrl;
      video.load();
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(videoSourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((lvl, idx) => ({ height: lvl.height, index: idx }));
        setQualities(levels);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSourceUrl;
      video.load();
      video.play().catch(() => {});
    }
  }, [videoSourceUrl, isProxyStreamUrl, playerMode]);

  // Sync playback rate when speed changes
  useEffect(() => {
    if (videoRef.current && playerMode === 'proxy') {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [videoSourceUrl, playbackSpeed, playerMode]);

  // Progress Memory: Resume where left off & record watch progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentItem || playerMode !== 'proxy') return;

    const progressKey = `stutosed_progress_${currentItem.id || currentItem.url}`;

    const handleLoadedMetadata = () => {
      try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
          const savedTime = parseFloat(saved);
          if (savedTime > 5 && video.duration && savedTime < video.duration - 15) {
            video.currentTime = savedTime;
          }
        }
      } catch {}
    };

    let lastSave = 0;
    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSave > 2500) {
        lastSave = now;
        try {
          if (video.currentTime > 5) {
            localStorage.setItem(progressKey, String(Math.floor(video.currentTime)));
          }
        } catch {}
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentItem, videoSourceUrl, playerMode]);

  // Buffering & Play/Pause listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerMode !== 'proxy') return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onLoadStart = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlaying = () => setIsBuffering(false);
    const onSeeking = () => setIsBuffering(true);
    const onSeeked = () => setIsBuffering(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [videoSourceUrl, playerMode]);

  // Play/pause/skip handlers
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, []);

  const skipVideo = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    videoRef.current.currentTime = Math.max(0, Math.min(dur, videoRef.current.currentTime + seconds));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const target = containerRef.current || videoRef.current;
    if (!target) return;
    if (!document.fullscreenElement) target.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  }, []);

  // Keyboard shortcuts (Space, F, Left, Right, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select', 'button'].includes(tag)) return;
      switch (e.key) {
        case ' ':
          if (playerMode === 'proxy') {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          if (playerMode === 'proxy') {
            e.preventDefault();
            skipVideo(-10);
          }
          break;
        case 'ArrowRight':
          if (playerMode === 'proxy') {
            e.preventDefault();
            skipVideo(10);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipVideo, toggleFullscreen, onClose, playerMode]);

  if (!currentItem) return null;

  const ytId = isYouTubeUrl
    ? activeUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null
    : null;

  const showVideo = playerMode === 'proxy' && Boolean(videoSourceUrl);
  const showLoading =
    isItemChanging ||
    (playerMode === 'proxy' && (streamLoading || (isBuffering && !isPlaying && !streamError))) ||
    (playerMode === 'embedded' && isEmbedLoading && !isYouTubeUrl);

  return (
    <div
      id="player-modal"
      className="open"
      role="dialog"
      aria-modal="true"
      aria-label="Video Player"
    >
      <div className="player-backdrop" onClick={onClose} />
      <div className="player-box" ref={containerRef}>
        {/* TOP BAR */}
        <div
          className="player-top-bar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* ROW 1: Course & Lecture Title + Fixed Close Button (Top-Right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              width: '100%',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}
              >
                {courseName}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  lineHeight: '1.35',
                  wordBreak: 'break-word',
                }}
              >
                {currentItem.label}
              </div>
            </div>

            {/* Close Button: Permanently anchored at top-right */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              title="Close (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ROW 2: Toggles & Bot Switchers Row */}
          {(servers.length > 1 || isAlbaActive || isYouTubeUrl) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '2px',
              }}
            >
              {/* DUAL BOT SWITCHER: ALBA / ESTE */}
              {servers.length > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '3px 4px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {servers.length > 1 ? (
                    servers.map((srv, idx) => {
                      const cleanName = srv.name.replace(/^[^\w]+/, '').trim();
                      const isSelected = selectedServerIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedServerIndex(idx);
                            setResolvedStreamUrl(null);
                            setStreamError(null);
                          }}
                          style={{
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '100px',
                            border: 'none',
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '26px',
                          }}
                        >
                          {cleanName}
                        </button>
                      );
                    })
                  ) : (
                    <span
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '100px',
                        background: 'var(--accent)',
                        color: '#fff',
                        minHeight: '26px',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {servers[0]?.name?.replace(/^[^\w]+/, '').trim() || 'ALBA'}
                    </span>
                  )}
                </div>
              )}

              {/* PLAYER MODE TOGGLE: Smart Proxy / Embedded */}
              {(isAlbaActive || isYouTubeUrl) && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '3px 4px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {!isYouTubeUrl && (
                    <button
                      onClick={() => {
                        setPlayerMode('proxy');
                        try {
                          localStorage.setItem('stutosed_preferred_player_mode', 'proxy');
                        } catch {}
                      }}
                      style={{
                        padding: '4px 11px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '100px',
                        border: 'none',
                        background: playerMode === 'proxy' ? 'var(--accent)' : 'transparent',
                        color: playerMode === 'proxy' ? '#fff' : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '26px',
                      }}
                      title="Smart Proxy streaming mode"
                    >
                      Smart Proxy
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPlayerMode('embedded');
                      try {
                        localStorage.setItem('stutosed_preferred_player_mode', 'embedded');
                      } catch {}
                    }}
                    style={{
                      padding: '4px 11px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '100px',
                      border: 'none',
                      background: playerMode === 'embedded' ? 'var(--accent)' : 'transparent',
                      color: playerMode === 'embedded' ? '#fff' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '26px',
                    }}
                    title="Direct video stream mode"
                  >
                    {isYouTubeUrl ? 'YouTube' : 'Embedded'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PLAYER SCREEN */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: '#000',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Buffering overlay for Smart Proxy */}
          {showLoading && (
            <div
              style={{
                position: 'absolute',
                zIndex: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: '#fff',
                background: 'rgba(0,0,0,0.4)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  border: '3px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                Buffering media…
              </span>
            </div>
          )}

          {/* Stream Error View */}
          {streamError && !showLoading && playerMode === 'proxy' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#ff6b6b', padding: '20px', textAlign: 'center', zIndex: 9 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{streamError}</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setPlayerMode('embedded')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Try Embedded Mode
                </button>
                {servers.length > 1 && (
                  <button
                    onClick={() => setSelectedServerIndex((prev) => (prev === 0 ? 1 : 0))}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Switch to {servers[selectedServerIndex === 0 ? 1 : 0]?.name.replace(/^[^\w]+/, '').trim()}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 1: SMART PROXY (HTML5 Custom Video) */}
          {playerMode === 'proxy' && showVideo && (
            <>
              <video
                ref={videoRef}
                controls
                controlsList="nodownload"
                disablePictureInPicture={false}
                playsInline
                preload="metadata"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
              />

              {/* Tap to Play overlay for mobile */}
              {!isPlaying && !showLoading && !streamError && (
                <div
                  onClick={togglePlayPause}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.45)',
                    cursor: 'pointer',
                    zIndex: 10,
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '62px',
                      height: '62px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 30px rgba(204, 120, 92, 0.65)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    Tap to Play
                  </span>
                </div>
              )}
            </>
          )}

          {/* MODE 2: EMBEDDED (YouTube iframe or ALBA direct MP4) */}
          {playerMode === 'embedded' && (() => {
            // YouTube: use iframe embed
            if (isYouTubeUrl && ytId) {
              return (
                <iframe
                  key={ytId}
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsEmbedLoading(false)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#000',
                  }}
                  title={currentItem.label}
                />
              );
            }
            // ALBA / Direct video: pick best download URL
            const directUrl =
              activeServer?.downloadUrl ||
              (activeUrl.includes('/0:/stream/')
                ? activeUrl.replace('/0:/stream/', '/0:/dl/')
                : activeUrl);
            return (
              <video
                controls
                controlsList="nodownload"
                playsInline
                preload="metadata"
                src={directUrl}
                onLoadedMetadata={() => setIsEmbedLoading(false)}
                onCanPlay={() => setIsEmbedLoading(false)}
                onError={() => {
                  // Auto-fallback to Smart Proxy if direct embed fails
                  setPlayerMode('proxy');
                  setStreamError('Direct embed failed — switched to Smart Proxy');
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#000',
                }}
                title={currentItem.label}
              />
            );
          })()}
        </div>

        {/* CONTROLS BAR */}
        <div className="player-controls" style={{ minHeight: '52px' }}>
          <button
            className="player-nav-btn"
            disabled={currentIndex === 0}
            onClick={() => onNavigate(currentIndex - 1)}
            title="Previous (←)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="ctrl-label">Prev</span>
          </button>

          {playerMode === 'proxy' && (
            <>
              <button className="player-nav-btn player-skip-btn" onClick={() => skipVideo(-10)} title="-10s">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 17l-5-5 5-5" />
                  <path d="M18 17l-5-5 5-5" />
                </svg>
                <span className="ctrl-label">10s</span>
              </button>

              <button className="player-nav-btn player-play-btn" onClick={togglePlayPause} title="Play/Pause (Space)">
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              <button className="player-nav-btn player-skip-btn" onClick={() => skipVideo(10)} title="+10s">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 17l5-5-5-5" />
                  <path d="M6 17l5-5-5-5" />
                </svg>
                <span className="ctrl-label">10s</span>
              </button>
            </>
          )}

          {qualities.length > 0 && playerMode === 'proxy' && (
            <div style={{ position: 'relative' }}>
              <button className="player-nav-btn" onClick={() => setShowQualityMenu((q) => !q)}>
                {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height}p`}
              </button>
              {showQualityMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '8px',
                    marginBottom: '8px',
                    zIndex: 100,
                    minWidth: '90px',
                  }}
                >
                  <button
                    className="quality-opt"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '5px 10px',
                      textAlign: 'left',
                      fontSize: '12px',
                    }}
                    onClick={() => {
                      if (hlsRef.current) hlsRef.current.currentLevel = -1;
                      setCurrentQuality(-1);
                      setShowQualityMenu(false);
                    }}
                  >
                    Auto
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      className="quality-opt"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '5px 10px',
                        textAlign: 'left',
                        fontSize: '12px',
                      }}
                      onClick={() => {
                        if (hlsRef.current) hlsRef.current.currentLevel = q.index;
                        setCurrentQuality(q.index);
                        setShowQualityMenu(false);
                      }}
                    >
                      {q.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SPEED CONTROLLER (Works in both Smart Proxy & Embedded) */}
          <div style={{ position: 'relative' }}>
            <button
              className="player-nav-btn"
              onClick={() => {
                setShowSpeedMenu((s) => !s);
                setShowQualityMenu(false);
              }}
              title="Playback Speed"
              style={{ fontWeight: 700, minWidth: '44px' }}
            >
              {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
            </button>
            {showSpeedMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '6px',
                  marginBottom: '8px',
                  zIndex: 100,
                  minWidth: '96px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    padding: '4px 8px',
                    letterSpacing: '0.5px',
                  }}
                >
                  Speed
                </div>
                {speedOptions.map((spd) => (
                  <button
                    key={spd}
                    className="quality-opt"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 10px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: playbackSpeed === spd ? 700 : 500,
                      color: playbackSpeed === spd ? 'var(--accent)' : 'var(--text)',
                      background: playbackSpeed === spd ? 'rgba(204,120,92,0.12)' : 'transparent',
                      borderRadius: 'var(--r-sm)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSpeedChange(spd)}
                  >
                    {spd === 1 ? '1x Normal' : `${spd}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button className="player-nav-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <span className="ctrl-label">Fullscreen</span>
          </button>

          <button
            className="player-nav-btn"
            disabled={currentIndex >= playlist.length - 1}
            onClick={() => onNavigate(currentIndex + 1)}
            title="Next"
          >
            <span className="ctrl-label">Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="player-progress-bar">
          <div className="player-progress-track" style={{ width: '100%' }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
