'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Hls from 'hls.js';
import { LectureItem } from '@/types';
import {
  isCourseBookmarked,
  toggleCourseBookmark,
  isVideoSaved,
  toggleSaveVideo,
} from '@/lib/libraryStorage';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  FolderHeart,
  Share2,
  ListVideo,
  Moon,
  Sun,
  ExternalLink,
} from 'lucide-react';

function formatLectureTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export interface GateWatchWorkspaceProps {
  allLectures: LectureItem[];
  activeLectureIndex: number;
  onSelectLecture: (index: number) => void;
  onBackToSubjects: () => void;
  courseId: string;
  courseName: string;
  theme?: 'light' | 'dark';
  watchedUrls?: Set<string>;
  onMarkWatched?: (url: string, courseId?: string, label?: string) => void;
}

export const GateWatchWorkspace: React.FC<GateWatchWorkspaceProps> = ({
  allLectures,
  activeLectureIndex,
  onSelectLecture,
  onBackToSubjects,
  courseId,
  courseName,
  theme: initialTheme = 'light',
  watchedUrls = new Set(),
  onMarkWatched,
}) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(initialTheme);
  const currentLecture = allLectures[activeLectureIndex] || allLectures[0];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [streamLoading, setStreamLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [qualities, setQualities] = useState<{ index: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [seekHoverTime, setSeekHoverTime] = useState<number | null>(null);
  const [seekHoverPos, setSeekHoverPos] = useState<number>(0);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);

  // Sync bookmark and saved state
  useEffect(() => {
    setIsBookmarked(isCourseBookmarked(courseId));
  }, [courseId]);

  useEffect(() => {
    if (currentLecture?.url) {
      setIsSaved(isVideoSaved(currentLecture.url));
    }
  }, [currentLecture?.url]);

  // Keep a stable ref for onMarkWatched to completely eliminate render loops
  const onMarkWatchedRef = useRef(onMarkWatched);
  useEffect(() => {
    onMarkWatchedRef.current = onMarkWatched;
  });

  // Mark watched immediately on play start
  useEffect(() => {
    if (currentLecture?.url) {
      onMarkWatchedRef.current?.(currentLecture.url, courseId, currentLecture.label);
    }
  }, [currentLecture?.url, courseId]);

  // Resolve stream URL whenever active lecture changes
  useEffect(() => {
    let isCancelled = false;
    setIsBuffering(true);
    setStreamLoading(true);
    setResolvedStreamUrl(null);
    setUseIframeFallback(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);

    const targetUrl = currentLecture?.url || '';
    if (!targetUrl) {
      setIsBuffering(false);
      setStreamLoading(false);
      return;
    }

    // Direct YouTube Detection
    if (
      targetUrl.includes('youtube.com') ||
      targetUrl.includes('youtu.be') ||
      currentLecture?.type === 'youtube'
    ) {
      const ytId = targetUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (ytId) {
        setResolvedStreamUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`);
        setUseIframeFallback(true);
        setIsBuffering(false);
        setStreamLoading(false);
        setIsPlaying(true);
        return;
      }
    }

    // Vidmoly or Earnvids Code extraction
    const vidmolyMatch = targetUrl.match(/(?:embed-|w\/|vidmoly\.(?:net|me|to)\/)([a-zA-Z0-9]{10,16})/);
    const earnvidsMatch = targetUrl.match(/morencius\.com\/v\/([a-zA-Z0-9]{10,16})/);
    const code = vidmolyMatch?.[1] || earnvidsMatch?.[1];
    const provider = earnvidsMatch ? 'earnvids' : 'vidmoly';
    if (code) {
      fetch(`/api/v1/stream?code=${encodeURIComponent(code)}&provider=${provider}`)
        .then((res) => res.json())
        .then((json) => {
          if (isCancelled) return;
          const streamData = json?.data || json;
          if (streamData?.streamUrl) {
            setResolvedStreamUrl(streamData.streamUrl);
            setUseIframeFallback(false);
          } else {
            const embedUrl = targetUrl.includes('embed-')
              ? targetUrl
              : targetUrl.replace('/w/', '/embed-') + '.html';
            setResolvedStreamUrl(embedUrl);
            setUseIframeFallback(true);
            setIsBuffering(false);
          }
        })
        .catch(() => {
          if (isCancelled) return;
          const embedUrl = targetUrl.includes('embed-')
            ? targetUrl
            : targetUrl.replace('/w/', '/embed-') + '.html';
          setResolvedStreamUrl(embedUrl);
          setUseIframeFallback(true);
          setIsBuffering(false);
        })
        .finally(() => {
          if (!isCancelled) setStreamLoading(false);
        });
    } else if (
      targetUrl.includes('publicbotshub') ||
      targetUrl.includes('file-stream-bot') ||
      targetUrl.includes('herokuapp.com')
    ) {
      // Direct opening for bot links without smart proxy embed
      setResolvedStreamUrl(targetUrl);
      setUseIframeFallback(false);
      setIsBuffering(false);
      setStreamLoading(false);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    } else {
      setResolvedStreamUrl(targetUrl);
      setUseIframeFallback(true);
      setIsBuffering(false);
      setStreamLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [currentLecture?.url, currentLecture?.type]);

  // Attach HLS or Native Video stream
  useEffect(() => {
    if (!resolvedStreamUrl || useIframeFallback) return;

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = resolvedStreamUrl;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      let networkRetryCount = 0;
      const hls = new Hls({
        enableWorker: true,
        progressive: true,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 60 * 1000 * 1000,
        backBufferLength: 90,
        lowLatencyMode: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });
      hlsRef.current = hls;
      hls.loadSource(resolvedStreamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        networkRetryCount = 0;
        const lvls = hls.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          bitrate: lvl.bitrate,
        }));
        setQualities(lvls);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryCount < 3) {
                networkRetryCount++;
                hls.startLoad();
              } else {
                hls.destroy();
                setUseIframeFallback(true);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setUseIframeFallback(true);
              break;
          }
        }
      });
    } else {
      video.src = resolvedStreamUrl;
      video.play().catch(() => {});
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onTimeUpdate = () => {
      if (video) {
        setCurrentTime(video.currentTime);
        if (video.buffered.length > 0) {
          setBufferedTime(video.buffered.end(video.buffered.length - 1));
        }
      }
    };
    const onLoadedMetadata = () => {
      if (video) setDuration(video.duration);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedStreamUrl, useIframeFallback]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3200);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play().catch(() => {});
  };

  const skipVideo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSeekHoverPos(pos * 100);
    setSeekHoverTime(pos * duration);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    setShowSpeedMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = spd;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleToggleTheme = () => {
    const next = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(next);
    try {
      localStorage.setItem('stutosed-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {}
  };

  const handleToggleBookmark = () => {
    const next = toggleCourseBookmark(courseId);
    setIsBookmarked(next);
  };

  const handleToggleSaveVideo = () => {
    if (!currentLecture) return;
    const next = toggleSaveVideo({
      id: currentLecture.id || currentLecture.url,
      label: currentLecture.label,
      url: currentLecture.url,
      courseId,
      courseName,
      subject: 'Signal and System',
      type: currentLecture.type,
      servers: currentLecture.servers,
      links: currentLecture.links,
    });
    setIsSaved(next);
  };

  const handleToggleWatched = () => {
    if (!currentLecture?.url) return;
    onMarkWatched?.(currentLecture.url, courseId, currentLecture.label);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };



  const isWatched = Boolean(currentLecture?.url && watchedUrls.has(currentLecture.url));
  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  const servers = currentLecture?.servers || [];

  return (
    <div className="watch-page-container">
      {/* 1. TOP RESPONSIVE HEADER BAR */}
      <header className="watch-top-nav">
        <div className="nav-left-cell">
          <button className="watch-nav-btn" onClick={onBackToSubjects} title="Back to Made Easy Subjects">
            <ArrowLeft width={18} height={18} />
            <span className="btn-label-desktop">Back</span>
          </button>
        </div>

        <div className="nav-center-cell">
          <span className="nav-course-brand">{courseName}</span>
        </div>

        <div className="nav-right-cell">
          <button
            className="watch-nav-btn theme-btn"
            onClick={handleToggleTheme}
            title={currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {currentTheme === 'light' ? <Moon width={17} height={17} /> : <Sun width={17} height={17} />}
          </button>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN DESKTOP WORKSPACE */}
      <div className="watch-main-layout">
        {/* LEFT COLUMN: THE MASTER VIDEO THEATER + YT INFO BAR */}
        <div className="watch-theater-col">
          <div
            ref={containerRef}
            className={`player-box ${isFullscreen ? 'is-fullscreen' : ''} ${
              useIframeFallback ? 'is-embed-mode' : ''
            } ${!showControls ? 'controls-hidden' : 'controls-visible'}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseMove}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              className="player-viewport"
              onClick={() => {
                if (useIframeFallback) return;
                setShowControls((prev) => !prev);
              }}
            >
              {/* Top Overlay: Title & Multi-server pills */}
              <div className="player-top-overlay" onClick={(e) => e.stopPropagation()}>
                <div className="player-title-block">
                  <div className="player-course-chip">Signal and System • Made Easy</div>
                  <h2 className="player-lecture-heading" title={currentLecture.label}>
                    {currentLecture.label}
                  </h2>
                </div>

                <div className="player-top-actions">
                  {servers.length > 1 && (
                    <div className="player-server-group">
                      {servers.map((srv, idx) => (
                        <button
                          key={idx}
                          className={`server-pill-btn ${idx === selectedServerIndex ? 'active' : ''}`}
                          onClick={() => setSelectedServerIndex(idx)}
                        >
                          {srv.name || `Server ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Center Play & Skip Buttons */}
              {!useIframeFallback && (
                <div className="player-center-overlay">
                  <button
                    className="player-center-skip-arrow backward"
                    onClick={(e) => {
                      e.stopPropagation();
                      skipVideo(-10);
                    }}
                    title="Backward 10s"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="11 17 6 12 11 7" />
                      <polyline points="18 17 13 12 18 7" />
                    </svg>
                    <span className="skip-hint">10s</span>
                  </button>

                  <button
                    className={`player-center-glass-play ${streamLoading || isBuffering ? 'is-loading' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    title="Play / Pause"
                  >
                    {streamLoading || isBuffering ? (
                      <svg className="center-spinner-svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="11" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                        <circle
                          cx="14"
                          cy="14"
                          r="11"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="20 50"
                          style={{ transformOrigin: 'center', animation: 'centerSpinnerRotate 0.85s linear infinite' }}
                        />
                      </svg>
                    ) : isPlaying ? (
                      <Pause width={24} height={24} fill="currentColor" />
                    ) : (
                      <Play width={26} height={26} fill="currentColor" style={{ transform: 'translateX(2px)' }} />
                    )}
                  </button>

                  <button
                    className="player-center-skip-arrow forward"
                    onClick={(e) => {
                      e.stopPropagation();
                      skipVideo(10);
                    }}
                    title="Forward 10s"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 17 18 12 13 7" />
                      <polyline points="6 17 11 12 6 7" />
                    </svg>
                    <span className="skip-hint">10s</span>
                  </button>
                </div>
              )}

              {/* Media Element: Native Video or Fallback Iframe */}
              {useIframeFallback ? (
                <div
                  className="player-iframe-container"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    background: '#000000',
                  }}
                >
                  <iframe
                    src={resolvedStreamUrl || currentLecture.url}
                    title={currentLecture.label}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  preload="auto"
                  className="player-native-video"
                  title={currentLecture.label}
                />
              )}

              {/* Bottom Floating Overlay: Seekbar & Controls Dock */}
              {!useIframeFallback && (
                <div className="player-bottom-overlay" onClick={(e) => e.stopPropagation()}>
                  {/* Seekbar */}
                  <div
                    className="player-seekbar-container"
                    ref={progressBarRef}
                    onClick={handleSeekCommit}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={() => setSeekHoverTime(null)}
                  >
                    {seekHoverTime !== null && (
                      <div className="player-seekbar-tooltip" style={{ left: `${seekHoverPos}%` }}>
                        {formatLectureTime(seekHoverTime)}
                      </div>
                    )}
                    <div className="player-seekbar-track">
                      <div className="player-seekbar-buffered" style={{ width: `${Math.min(100, bufferedPercent)}%` }} />
                      <div className="player-seekbar-played" style={{ width: `${Math.min(100, playedPercent)}%` }} />
                      <div className="player-seekbar-thumb" style={{ left: `${Math.min(100, playedPercent)}%` }} />
                    </div>
                  </div>

                  {/* Controls Dock */}
                  <div className="player-controls-dock">
                    <div className="dock-group-left">
                      <button
                        className="dock-ctrl-btn"
                        disabled={activeLectureIndex === 0}
                        onClick={() => onSelectLecture(activeLectureIndex - 1)}
                        title="Previous Lecture"
                      >
                        <ChevronLeft width={18} height={18} />
                      </button>

                      <button className="dock-ctrl-btn dock-play-btn" onClick={togglePlayPause} title="Play / Pause">
                        {isPlaying ? <Pause width={16} height={16} fill="currentColor" /> : <Play width={16} height={16} fill="currentColor" />}
                      </button>

                      <button
                        className="dock-ctrl-btn"
                        disabled={activeLectureIndex >= allLectures.length - 1}
                        onClick={() => onSelectLecture(activeLectureIndex + 1)}
                        title="Next Lecture"
                      >
                        <ChevronRight width={18} height={18} />
                      </button>

                      {/* Volume Slider */}
                      <div
                        className="dock-volume-box"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <button className="dock-ctrl-btn" onClick={toggleMute} title="Mute/Unmute">
                          {isMuted || volume === 0 ? <VolumeX width={16} height={16} /> : <Volume2 width={16} height={16} />}
                        </button>
                        <div className={`dock-volume-slider-wrap ${showVolumeSlider ? 'visible' : ''}`}>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="dock-volume-slider"
                          />
                        </div>
                      </div>

                      {/* Time Display */}
                      <div className="dock-time-display">
                        <span className="current-time">{formatLectureTime(currentTime)}</span>
                        <span className="divider">/</span>
                        <span className="total-time">{formatLectureTime(duration)}</span>
                      </div>
                    </div>

                    <div className="dock-group-right">
                      {/* Quality Selector */}
                      {qualities.length > 0 && (
                        <div style={{ position: 'relative' }}>
                          <button
                            className="dock-ctrl-btn quality-chip-btn"
                            onClick={() => setShowQualityMenu((q) => !q)}
                          >
                            <span>{currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height}p`}</span>
                          </button>
                          {showQualityMenu && (
                            <div className="player-floating-menu">
                              <div className="menu-header">Quality</div>
                              <button
                                className={`menu-item ${currentQuality === -1 ? 'active' : ''}`}
                                onClick={() => {
                                  if (hlsRef.current) hlsRef.current.currentLevel = -1;
                                  setCurrentQuality(-1);
                                  setShowQualityMenu(false);
                                }}
                              >
                                <span>Auto</span>
                                {currentQuality === -1 && <span>✓</span>}
                              </button>
                              {qualities.map((q) => (
                                <button
                                  key={q.index}
                                  className={`menu-item ${currentQuality === q.index ? 'active' : ''}`}
                                  onClick={() => {
                                    if (hlsRef.current) hlsRef.current.currentLevel = q.index;
                                    setCurrentQuality(q.index);
                                    setShowQualityMenu(false);
                                  }}
                                >
                                  <span>{q.height}p</span>
                                  {currentQuality === q.index && <span>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Speed Selector */}
                      <div style={{ position: 'relative' }}>
                        <button
                          className="dock-ctrl-btn speed-chip-btn"
                          onClick={() => setShowSpeedMenu((s) => !s)}
                        >
                          <span>{playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}</span>
                        </button>
                        {showSpeedMenu && (
                          <div className="player-floating-menu">
                            <div className="menu-header">Playback Speed</div>
                            {[0.75, 1, 1.25, 1.5, 1.75, 2].map((spd) => (
                              <button
                                key={spd}
                                className={`menu-item ${playbackSpeed === spd ? 'active' : ''}`}
                                onClick={() => handleSpeedChange(spd)}
                              >
                                <span>{spd === 1 ? '1x Normal' : `${spd}x`}</span>
                                {playbackSpeed === spd && <span style={{ color: 'var(--accent)' }}>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Toggle */}
                      <button className="dock-ctrl-btn fullscreen-toggle-btn" onClick={toggleFullscreen} title="Fullscreen">
                        {isFullscreen ? <Minimize width={16} height={16} /> : <Maximize width={16} height={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="watch-info-section">
            {/* Metadata Chips */}
            <div className="watch-meta-chips">
              <span className="watch-chip batch-chip">Signal and System</span>
              <span className="watch-chip subject-chip">Made Easy</span>
              <span className="watch-chip counter-chip">
                Lecture {activeLectureIndex + 1} of {allLectures.length}
              </span>
            </div>

            {/* Lecture Title */}
            <h1 className="watch-lecture-title">{currentLecture.label}</h1>

            {/* Action Buttons Dock */}
            <div className="watch-action-bar">
              <button
                className={`watch-action-btn ${isBookmarked ? 'active' : ''}`}
                onClick={handleToggleBookmark}
              >
                {isBookmarked ? <BookmarkCheck width={17} height={17} color="var(--accent)" /> : <Bookmark width={17} height={17} />}
                <span>{isBookmarked ? 'Batch Bookmarked' : 'Bookmark Batch'}</span>
              </button>

              <button
                className={`watch-action-btn ${isSaved ? 'active' : ''}`}
                onClick={handleToggleSaveVideo}
              >
                {isSaved ? <FolderHeart width={17} height={17} color="var(--accent)" /> : <FolderPlus width={17} height={17} />}
                <span>{isSaved ? 'Saved in Folder' : 'Save Video'}</span>
              </button>

              <div
                className="watch-action-btn static"
                onClick={handleToggleWatched}
                style={{ cursor: 'pointer' }}
                title="Toggle watched status"
              >
                <CheckCircle2 width={17} height={17} color={isWatched ? 'var(--green)' : 'rgba(255,255,255,0.4)'} />
                <span>{isWatched ? 'Watched' : 'In Progress'}</span>
              </div>

              <button className="watch-action-btn" onClick={handleShare}>
                <Share2 width={17} height={17} />
                <span>{copiedToast ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>


          </div>
        </div>

        {/* RIGHT COLUMN: BATCH PLAYLIST QUEUE */}
        <aside className="watch-right-col">
          <div className="watch-playlist-panel">
            <div className="watch-playlist-header">
              <div className="watch-playlist-header-left">
                <ListVideo width={19} height={19} color="var(--accent)" />
                <div>
                  <h3 className="watch-playlist-title">Batch Lecture Queue</h3>
                  <span className="watch-playlist-count">
                    {allLectures.length} Lectures • Signal and System (Made Easy)
                  </span>
                </div>
              </div>
            </div>

            <div className="watch-playlist-items-scroll">
              {allLectures.map((lec, idx) => {
                const isCurrent = idx === activeLectureIndex;
                return (
                  <div
                    key={lec.id || idx}
                    className={`watch-playlist-row ${isCurrent ? 'active' : ''}`}
                    onClick={() => onSelectLecture(idx)}
                  >
                    <div className="watch-row-idx">
                      {isCurrent ? (
                        <div className="yt-now-playing-wave">
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : (
                        <span className="watch-row-num">{idx + 1}</span>
                      )}
                    </div>

                    <div className="watch-row-info">
                      <div className="watch-row-title">{lec.label}</div>
                      <div className="watch-row-tags">
                        {lec.servers && lec.servers.length > 1 && (
                          <span className="watch-server-tag">{lec.servers.length} Servers</span>
                        )}
                      </div>
                    </div>

                    <button className="watch-row-play-btn" title="Play Lecture">
                      <Play width={13} height={13} fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
