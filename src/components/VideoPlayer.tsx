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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  currentIndex,
  courseName,
  onClose,
  onNavigate,
}) => {
  const currentItem = playlist[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    setShowSpeedMenu(false);
  };

  // Reset server selection when lecture changes
  useEffect(() => {
    setSelectedServerIndex(0);
    setResolvedStreamUrl(null);
    setStreamError(null);
  }, [currentIndex]);

  // Build servers list from item
  const servers: ServerOption[] = (() => {
    if (currentItem?.servers && currentItem.servers.length > 0) {
      return currentItem.servers;
    }
    return [
      { name: 'Server 1', url: currentItem?.url || '', type: currentItem?.type },
    ];
  })();

  const activeServer = servers[selectedServerIndex] || servers[0];
  const activeUrl = activeServer?.url || currentItem?.url || '';

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

  // Determine URL types
  const isVidmolyUrl = activeUrl.includes('vidmoly.');
  const isEarnvidsUrl = activeUrl.includes('morencius.') || activeUrl.includes('earnvids.');
  const isYouTubeUrl = activeUrl.includes('youtube.') || activeUrl.includes('youtu.be');
  const isHlsUrl = activeUrl.includes('.m3u8');
  const needsApiResolution = (isVidmolyUrl || isEarnvidsUrl) && !isHlsUrl;

  // Resolve stream URL via our server-side API
  useEffect(() => {
    if (!needsApiResolution || !activeUrl) {
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
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), 8000);

    fetch(`/api/stream?code=${code}&provider=${provider}`, { signal: abortController.signal })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timer);
        if (data.streamUrl) {
          setResolvedStreamUrl(data.streamUrl);
        }
        setStreamLoading(false);
      })
      .catch(() => {
        clearTimeout(timer);
        setStreamLoading(false);
      });

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [activeUrl, selectedServerIndex]);

  // Direct HLS stream or resolved stream URL
  const hlsUrl = isHlsUrl ? activeUrl : resolvedStreamUrl;

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const video = videoRef.current;
    setQualities([]);
    setCurrentQuality(-1);
    setIsPlaying(false);

    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (video.canPlayType('application/vnd.apple.mpegurl') && (isSafari || !Hls.isSupported())) {
      video.src = hlsUrl;
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
      hls.loadSource(hlsUrl);
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
      video.src = hlsUrl;
      video.load();
      video.play().catch(() => {});
    }
  }, [hlsUrl]);

  // Sync playback rate when speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [hlsUrl, playbackSpeed]);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [hlsUrl]);

  // Anti-piracy: Block keyboard shortcuts (Save page, Inspect, etc.)
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
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipVideo(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipVideo(10);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipVideo, toggleFullscreen, onClose]);

  if (!currentItem) return null;

  const ytId = isYouTubeUrl
    ? activeUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null
    : null;

  // Determine iframe source if direct HLS stream is not active
  const embedIframeUrl = (() => {
    if (isVidmolyUrl) {
      const code = extractVidmolyCode(activeUrl);
      return code ? `https://vidmoly.net/embed-${code}.html` : activeUrl;
    }
    if (isEarnvidsUrl) {
      const code = extractEarnvidsCode(activeUrl);
      return code ? `https://morencius.com/v/${code}` : activeUrl;
    }
    return activeUrl;
  })();

  const showVideo = Boolean(hlsUrl);
  const showYoutube = Boolean(ytId);
  const showLoading = streamLoading;
  const showIframeFallback = !showVideo && !showYoutube && !showLoading;

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
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.4)',
            gap: '12px',
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
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentItem.label}
            </div>
          </div>

          {/* SERVER SWITCHER */}
          {servers.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255,255,255,0.08)',
                padding: '3px 4px',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              {servers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedServerIndex(idx);
                    setResolvedStreamUrl(null);
                    setStreamError(null);
                  }}
                  style={{
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    borderRadius: '100px',
                    border: 'none',
                    background: selectedServerIndex === idx ? 'var(--accent)' : 'transparent',
                    color: selectedServerIndex === idx ? '#fff' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {srv.name || `Server ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
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
          {showLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: '#fff' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  border: '3px solid rgba(255,255,255,0.15)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Connecting to HD stream…</span>
            </div>
          )}

          {showYoutube && (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              referrerPolicy="no-referrer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          )}

          {showVideo && (
            <>
              <video
                ref={videoRef}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                playsInline
                preload="auto"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
              />

              {/* Big Tap to Play button (critical for Mobile when autoplay is blocked) */}
              {!isPlaying && !showLoading && (
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

          {showIframeFallback && (
            <iframe
              src={embedIframeUrl}
              referrerPolicy="no-referrer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>

        {/* CONTROLS BAR (For custom video element) */}
        {showVideo && (
          <div className="player-controls">
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

            {qualities.length > 0 && (
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

            {/* SPEED CONTROLLER */}
            <div style={{ position: 'relative' }}>
              <button
                className="player-nav-btn"
                onClick={() => {
                  setShowSpeedMenu((s) => !s);
                  setShowQualityMenu(false);
                }}
                title="Playback Speed"
                style={{ fontWeight: 700, minWidth: '42px' }}
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
                        padding: '5px 10px',
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
        )}

        {/* CONTROLS BAR (For iframe fallback - simple navigation) */}
        {!showVideo && (
          <div className="player-controls">
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

            <button className="player-nav-btn" onClick={toggleFullscreen} title="Fullscreen">
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
        )}

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
