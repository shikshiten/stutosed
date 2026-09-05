'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { LectureItem, ServerOption } from '@/types';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';
import { getLectureTopicDescription } from '@/lib/topicDescriptions';
import {
  isCourseBookmarked,
  toggleCourseBookmark,
  isVideoSaved,
  toggleSaveVideo,
} from '@/lib/libraryStorage';
import {
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  FolderHeart,
  CheckCircle2,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  ListVideo,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  BookOpen,
} from 'lucide-react';

interface VideoPlayerProps {
  playlist: LectureItem[];
  currentIndex: number;
  courseName: string;
  courseId?: string;
  courseCategory?: string;
  subjectName?: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onOpenCourse?: () => void;
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

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  currentIndex,
  courseName,
  courseId = '',
  courseCategory = 'all',
  subjectName,
  onClose,
  onNavigate,
  onOpenCourse,
}) => {
  const currentItem = playlist[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [playerMode, setPlayerMode] = useState<'proxy' | 'embedded'>('proxy');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [isDraggingSeek, setIsDraggingSeek] = useState<boolean>(false);
  const [seekHoverTime, setSeekHoverTime] = useState<number | null>(null);
  const [seekHoverPos, setSeekHoverPos] = useState<number>(0);

  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [skipFeedback, setSkipFeedback] = useState<'forward' | 'backward' | null>(null);

  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [isEmbedLoading, setIsEmbedLoading] = useState<boolean>(true);

  // Library & Bookmark States
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isWatched, setIsWatched] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  // Dynamic educational topic description
  const topicDesc = getLectureTopicDescription(currentItem?.label || '', courseName, subjectName);

  // Sync Library states
  useEffect(() => {
    if (courseId) {
      setIsBookmarked(isCourseBookmarked(courseId));
    }
    if (currentItem?.url) {
      setIsSaved(isVideoSaved(currentItem.url));
      try {
        const watched = JSON.parse(localStorage.getItem('stutosed_watched_lectures') || '[]');
        setIsWatched(watched.includes(currentItem.url));
      } catch {}
    }
  }, [courseId, currentItem]);

  // Load preferred mode on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('stutosed_preferred_player_mode');
      if (savedMode === 'embedded' || savedMode === 'proxy') {
        setPlayerMode(savedMode);
      }
    } catch {}
  }, []);

  // Reset states when lecture index changes
  useEffect(() => {
    setSelectedServerIndex(0);
    setStreamError(null);
    setIsEmbedLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);
  }, [currentIndex]);

  // Track Fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Auto-hide controls timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !showSpeedMenu && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  }, [isPlaying, showSpeedMenu, showQualityMenu]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSpeedMenu, showQualityMenu, resetControlsTimer]);

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'setPlaybackRate', rate: spd }, '*');
      } catch {}
    }
    setShowSpeedMenu(false);
    resetControlsTimer();
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

  // Proxy streaming for ALBA, ESTE, direct mp4 files, Heroku streams
  const isProxyStreamUrl =
    activeUrl.includes('streamvaultpro.cc') ||
    activeUrl.includes('workers.dev') ||
    activeUrl.includes('publicbotshub') ||
    activeUrl.includes('herokuapp.com') ||
    activeUrl.endsWith('.mp4') ||
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    activeServer?.name?.toUpperCase().includes('ESTE');

  const isAlbaActive =
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    (!activeServer && activeUrl.includes('streamvaultpro.cc')) ||
    Boolean(activeServer?.streamUrl);

  useEffect(() => {
    if (isYouTubeUrl && playerMode === 'proxy') {
      setPlayerMode('embedded');
    }
  }, [isYouTubeUrl, playerMode]);

  useEffect(() => {
    if (!isAlbaActive && !isYouTubeUrl && playerMode === 'embedded') {
      setPlayerMode('proxy');
    }
  }, [isAlbaActive, isYouTubeUrl, playerMode]);

  const needsApiResolution = (isVidmolyUrl || isEarnvidsUrl) && !isHlsUrl;

  // Resolve stream URL for Vidmoly/Earnvids via cached server-side API
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
          // Seamlessly fallback to direct embed if scraping fails
          setPlayerMode('embedded');
        }
        setStreamLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          // Fallback to embedded if timeout occurs
          setPlayerMode('embedded');
          setStreamLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [activeUrl, needsApiResolution, isVidmolyUrl, isEarnvidsUrl, playerMode]);

  // Determine media source for <video> element
  const videoSourceUrl = isProxyStreamUrl
    ? getWorkerProxyUrl(activeUrl, 'stream')
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
      setDuration(video.duration || 0);
      try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
          const savedTime = parseFloat(saved);
          if (savedTime > 5 && video.duration && savedTime < video.duration - 15) {
            video.currentTime = savedTime;
            setCurrentTime(savedTime);
          }
        }
      } catch {}
    };

    let lastSave = 0;
    const handleTimeUpdate = () => {
      if (!isDraggingSeek) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered && video.buffered.length > 0) {
        try {
          setBufferedTime(video.buffered.end(video.buffered.length - 1));
        } catch {}
      }
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
  }, [currentItem, videoSourceUrl, playerMode, isDraggingSeek]);

  // Buffering & Play/Pause listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerMode !== 'proxy') return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };
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

  // Handlers
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setIsBuffering(true);
      video.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    }
    resetControlsTimer();
  }, [resetControlsTimer]);

  const triggerSkipFeedback = (direction: 'forward' | 'backward') => {
    setSkipFeedback(direction);
    setTimeout(() => setSkipFeedback(null), 600);
  };

  const skipVideo = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    const newTime = Math.max(0, Math.min(dur, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerSkipFeedback(seconds > 0 ? 'forward' : 'backward');
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(() => {
    const target = containerRef.current;
    if (!target) return;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((target as any).webkitExitFullscreen) {
        (target as any).webkitExitFullscreen();
      }
    }
  }, []);

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      videoRef.current.volume = 0.8;
    }
  };

  // Seekbar scrubbing
  const handleSeekCommit = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    setCurrentTime(newTime);
    videoRef.current.currentTime = newTime;
    setIsDraggingSeek(false);
    resetControlsTimer();
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSeekHoverPos(pos * 100);
    setSeekHoverTime(pos * duration);
  };

  // Toggle Bookmark Batch
  const handleToggleBookmark = () => {
    if (!courseId) return;
    const next = toggleCourseBookmark(courseId);
    setIsBookmarked(next);
  };

  // Toggle Save Video to Batch Folder
  const handleToggleSaveVideo = () => {
    if (!currentItem) return;
    const next = toggleSaveVideo({
      id: currentItem.id || currentItem.url,
      label: currentItem.label,
      url: currentItem.url,
      courseId,
      courseName,
      courseCategory,
      subject: subjectName,
      type: currentItem.type,
      servers: currentItem.servers,
      links: currentItem.links,
    });
    setIsSaved(next);
  };

  // Share lecture link
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/?course=${courseId}&play=${encodeURIComponent(currentItem.url)}`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        skipVideo(10);
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        skipVideo(-10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipVideo, toggleFullscreen, onClose, volume, isMuted]);

  const showLoading =
    (playerMode === 'proxy' && (streamLoading || (isBuffering && isPlaying))) ||
    (playerMode === 'embedded' && isEmbedLoading && !isYouTubeUrl);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <div
      id="player-modal"
      className="open yt-watch-modal-container"
      role="dialog"
      aria-modal="true"
      aria-label="Video Player"
    >
      <div className="player-backdrop" onClick={onClose} />

      {/* Main Watch Page Container */}
      <div className="yt-watch-viewport-wrap">
        {/* Top Header Navigation Bar */}
        <header className="yt-watch-top-header">
          <button className="yt-watch-back-btn" onClick={onClose}>
            <ArrowLeft width={18} height={18} />
            <span>Back to Course</span>
          </button>

          <div className="yt-header-course-info">
            <span className="yt-header-badge">{courseCategory === 'beu' ? 'BEU Engineering' : 'Govt Exams'}</span>
            <span className="yt-header-title">{courseName}</span>
          </div>

          <div style={{ width: '80px' }} />
        </header>

        {/* 2-Column YouTube Layout */}
        <div className="yt-watch-main-layout">
          {/* ==================== LEFT COLUMN: VIDEO + DETAILS ==================== */}
          <main className="yt-watch-left-col">
            {/* The Video Box with Fullscreen & Overlay Controls */}
            <div
              className={`player-box ${isFullscreen ? 'is-fullscreen' : ''} ${showControls ? 'controls-visible' : 'controls-hidden'}`}
              ref={containerRef}
              onMouseMove={resetControlsTimer}
              onTouchStart={resetControlsTimer}
              onMouseEnter={resetControlsTimer}
            >
              <div className="player-viewport">
                {/* 1. TOP OVERLAY (Fullscreen & In-Video) */}
                <div
                  className="player-top-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="player-title-block">
                    <div className="player-course-chip">{courseName}</div>
                    <h2 className="player-lecture-heading" title={currentItem.label}>
                      {currentItem.label}
                    </h2>
                  </div>

                  <div className="player-top-actions">
                    {/* Server switchers */}
                    {servers.length > 1 && (
                      <div className="player-server-group">
                        {servers.map((srv, idx) => (
                          <button
                            key={idx}
                            className={`server-pill-btn ${idx === selectedServerIndex ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedServerIndex(idx);
                              setStreamError(null);
                              resetControlsTimer();
                            }}
                          >
                            {srv.name?.replace(/^[^\w]+/, '').trim() || `Server ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mode Toggle */}
                    {(isAlbaActive || isVidmolyUrl || isEarnvidsUrl || isProxyStreamUrl) && !isYouTubeUrl && (
                      <div className="player-mode-group">
                        <button
                          className={`mode-toggle-btn ${playerMode === 'proxy' ? 'active' : ''}`}
                          onClick={() => {
                            setPlayerMode('proxy');
                            resetControlsTimer();
                          }}
                        >
                          Smart Proxy
                        </button>
                        <button
                          className={`mode-toggle-btn ${playerMode === 'embedded' ? 'active' : ''}`}
                          onClick={() => {
                            setPlayerMode('embedded');
                            resetControlsTimer();
                          }}
                        >
                          Embedded
                        </button>
                      </div>
                    )}

                    {/* Close / Exit Fullscreen Button */}
                    <button
                      className="player-overlay-close-btn"
                      onClick={() => {
                        if (document.fullscreenElement) {
                          document.exitFullscreen?.();
                        } else {
                          onClose();
                        }
                      }}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 2. CENTER OVERLAY (Frosted Glass Play + Static Skip Arrows) */}
                <div className="player-center-overlay">
                  {playerMode === 'proxy' && (
                    <>
                      <button
                        className="player-center-skip-arrow backward"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipVideo(-10);
                        }}
                        style={{ opacity: showLoading ? 0 : 1, pointerEvents: showLoading ? 'none' : 'auto' }}
                        title="Backward 10s"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="11 17 6 12 11 7" />
                          <polyline points="18 17 13 12 18 7" />
                        </svg>
                        <span className="skip-hint">10s</span>
                      </button>

                      {/* Glass Play/Pause button — becomes a spinner when buffering */}
                      <button
                        className={`player-center-glass-play${showLoading ? ' is-loading' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        title={showLoading ? 'Loading stream…' : 'Play / Pause (Space)'}
                        style={{ cursor: 'pointer' }}
                      >
                        {showLoading ? (
                          <svg className="center-spinner-svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="11" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                            <circle
                              cx="14" cy="14" r="11"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="20 50"
                              style={{ transformOrigin: 'center', animation: 'centerSpinnerRotate 0.85s linear infinite' }}
                            />
                          </svg>
                        ) : isPlaying ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1.5" />
                            <rect x="14" y="4" width="4" height="16" rx="1.5" />
                          </svg>
                        ) : (
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translateX(2px)' }}>
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        )}
                      </button>

                      <button
                        className="player-center-skip-arrow forward"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipVideo(10);
                        }}
                        style={{ opacity: showLoading ? 0 : 1, pointerEvents: showLoading ? 'none' : 'auto' }}
                        title="Forward 10s"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="13 17 18 12 13 7" />
                          <polyline points="6 17 11 12 6 7" />
                        </svg>
                        <span className="skip-hint">10s</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Double-tap indicator */}
                {skipFeedback && (
                  <div className={`player-skip-indicator ${skipFeedback}`}>
                    {skipFeedback === 'backward' ? '-10s' : '+10s'}
                  </div>
                )}

                {/* Video Media Canvas */}
                {playerMode === 'proxy' ? (
                  <video
                    ref={videoRef}
                    playsInline
                    preload="metadata"
                    className="player-native-video"
                    title={currentItem.label}
                    onClick={togglePlayPause}
                  />
                ) : (
                  (() => {
                    if (isYouTubeUrl) {
                      const ytId = activeUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1];
                      const youtubeWatchUrl = ytId
                        ? `https://www.youtube.com/watch?v=${ytId}`
                        : activeUrl;
                      return (
                        <div className="player-youtube-card">
                          <div className="yt-icon-wrapper">
                            <Play width={28} height={28} fill="currentColor" />
                          </div>
                          <h3>YouTube Video Lecture</h3>
                          <p>This video is hosted on YouTube. Watch directly for 100% native quality & zero buffering.</p>
                          <a href={youtubeWatchUrl} target="_blank" rel="noopener noreferrer" className="yt-open-link">
                            <span>Open on YouTube</span>
                          </a>
                        </div>
                      );
                    }

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
                        className="player-native-video"
                        title={currentItem.label}
                      />
                    );
                  })()
                )}

                {/* 3. BOTTOM FLOATING OVERLAY (Seekbar, Controls & In-Fullscreen Speed Menu) */}
                <div
                  className="player-bottom-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Seekbar */}
                  {playerMode === 'proxy' && (
                    <div
                      className="player-seekbar-container"
                      ref={progressBarRef}
                      onClick={handleSeekCommit}
                      onMouseMove={handleProgressMouseMove}
                      onMouseLeave={() => setSeekHoverTime(null)}
                    >
                      {seekHoverTime !== null && (
                        <div
                          className="player-seekbar-tooltip"
                          style={{ left: `${seekHoverPos}%` }}
                        >
                          {formatTime(seekHoverTime)}
                        </div>
                      )}
                      <div className="player-seekbar-track">
                        <div className="player-seekbar-buffered" style={{ width: `${Math.min(100, bufferedPercent)}%` }} />
                        <div className="player-seekbar-played" style={{ width: `${Math.min(100, playedPercent)}%` }} />
                        <div className="player-seekbar-thumb" style={{ left: `${Math.min(100, playedPercent)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Dock */}
                  <div className="player-controls-dock">
                    <div className="dock-group-left">
                      <button
                        className="dock-ctrl-btn"
                        disabled={currentIndex === 0}
                        onClick={() => onNavigate(currentIndex - 1)}
                        title="Previous Lecture"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="19 20 9 12 19 4 19 20" />
                          <line x1="5" y1="19" x2="5" y2="5" />
                        </svg>
                      </button>

                      {playerMode === 'proxy' && (
                        <button
                          className="dock-ctrl-btn dock-play-btn"
                          onClick={togglePlayPause}
                          title="Play / Pause"
                        >
                          {isPlaying ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translateX(1px)' }}>
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          )}
                        </button>
                      )}

                      <button
                        className="dock-ctrl-btn"
                        disabled={currentIndex >= playlist.length - 1}
                        onClick={() => onNavigate(currentIndex + 1)}
                        title="Next Lecture"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="5 4 15 12 5 20 5 4" />
                          <line x1="19" y1="5" x2="19" y2="19" />
                        </svg>
                      </button>

                      {/* Volume Slider */}
                      {playerMode === 'proxy' && (
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
                      )}

                      {/* Time */}
                      {playerMode === 'proxy' && (
                        <div className="dock-time-display">
                          <span className="current-time">{formatTime(currentTime)}</span>
                          <span className="divider">/</span>
                          <span className="total-time">{formatTime(duration)}</span>
                        </div>
                      )}
                    </div>

                    <div className="dock-group-right">
                      {/* Quality */}
                      {qualities.length > 0 && playerMode === 'proxy' && (
                        <div style={{ position: 'relative' }}>
                          <button
                            className="dock-ctrl-btn quality-chip-btn"
                            onClick={() => {
                              setShowQualityMenu((q) => !q);
                              setShowSpeedMenu(false);
                            }}
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

                      {/* Speed Chip & Menu (Works seamlessly inside Fullscreen) */}
                      <div style={{ position: 'relative' }}>
                        <button
                          className="dock-ctrl-btn speed-chip-btn"
                          onClick={() => {
                            setShowSpeedMenu((s) => !s);
                            setShowQualityMenu(false);
                          }}
                        >
                          <span>{playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}</span>
                        </button>
                        {showSpeedMenu && (
                          <div className="player-floating-menu">
                            <div className="menu-header">Playback Speed</div>
                            {speedOptions.map((spd) => (
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
                      <button
                        className="dock-ctrl-btn fullscreen-toggle-btn"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                      >
                        {isFullscreen ? <Minimize width={16} height={16} /> : <Maximize width={16} height={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== YOUTUBE-STYLE INFO BAR & ACTION ROW ==================== */}
            <div className="yt-watch-info-bar">
              {/* Lecture Title & Index */}
              <div className="yt-watch-title-row">
                <div className="yt-title-meta-left">
                  <div className="yt-meta-chips">
                    <span className="yt-chip yt-chip-batch">{courseName}</span>
                    {subjectName && <span className="yt-chip yt-chip-subject">{subjectName}</span>}
                    <span className="yt-chip yt-chip-counter">
                      Lecture {currentIndex + 1} of {playlist.length}
                    </span>
                  </div>
                  <h1 className="yt-lecture-main-title">{currentItem.label}</h1>
                </div>
              </div>

              {/* YouTube Action Dock: Bookmark Batch, Save Video, Watched, Share */}
              <div className="yt-action-buttons-dock">
                {/* 1. Bookmark Full Batch */}
                {courseId && (
                  <button
                    className={`yt-action-pill ${isBookmarked ? 'active' : ''}`}
                    onClick={handleToggleBookmark}
                    title="Bookmark Full Course Batch in My Library"
                  >
                    {isBookmarked ? (
                      <BookmarkCheck width={17} height={17} color="var(--accent)" />
                    ) : (
                      <Bookmark width={17} height={17} />
                    )}
                    <span>{isBookmarked ? 'Batch Bookmarked' : 'Bookmark Batch'}</span>
                  </button>
                )}

                {/* 2. Save Video to Batch Folder */}
                <button
                  className={`yt-action-pill ${isSaved ? 'active' : ''}`}
                  onClick={handleToggleSaveVideo}
                  title="Save this video into its Batch Folder in My Library"
                >
                  {isSaved ? (
                    <FolderHeart width={17} height={17} color="var(--accent)" />
                  ) : (
                    <FolderPlus width={17} height={17} />
                  )}
                  <span>{isSaved ? 'Saved in Folder' : 'Save Video'}</span>
                </button>

                {/* 3. Watched Status Indicator */}
                <div className="yt-action-pill static">
                  <CheckCircle2 width={17} height={17} color={isWatched ? 'var(--green)' : 'rgba(255,255,255,0.4)'} />
                  <span>{isWatched ? 'Watched' : 'In Progress'}</span>
                </div>

                {/* 4. Share Lecture */}
                <button className="yt-action-pill" onClick={handleShare} title="Share lecture">
                  <Share2 width={17} height={17} />
                  <span>{copiedToast ? 'Copied Link!' : 'Share'}</span>
                </button>
              </div>

              {/* ==================== EDUCATIONAL TOPIC DESCRIPTION CARD ==================== */}
              <section className="yt-topic-description-card">
                <div
                  className="yt-desc-header"
                  onClick={() => setIsDescExpanded((prev) => !prev)}
                >
                  <div className="yt-desc-header-left">
                    <div className="yt-desc-icon-circle">
                      <Sparkles width={16} height={16} color="var(--accent)" />
                    </div>
                    <div>
                      <span className="yt-desc-category-tag">{topicDesc.categoryTag}</span>
                      <h3 className="yt-desc-title">Topic Overview &amp; Key Concepts</h3>
                    </div>
                  </div>

                  <button className="yt-desc-toggle-btn">
                    <span>{isDescExpanded ? 'Hide Details' : 'Show Details'}</span>
                    {isDescExpanded ? <ChevronUp width={16} height={16} /> : <ChevronDown width={16} height={16} />}
                  </button>
                </div>

                {isDescExpanded && (
                  <div className="yt-desc-content animate-fade-in">
                    <p className="yt-desc-overview-p">{topicDesc.overview}</p>

                    <div className="yt-desc-key-points">
                      <div className="yt-key-points-heading">Core Concepts Covered in this Lecture:</div>
                      <ul>
                        {topicDesc.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="yt-desc-exam-tip-box">
                      <span className="exam-tip-badge">Exam High-Yield Insight</span>
                      <p className="exam-tip-text">{topicDesc.examTip}</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </main>

          {/* ==================== RIGHT COLUMN: PLAYLIST & UP NEXT ==================== */}
          <aside className="yt-watch-right-col">
            <div className="yt-playlist-card">
              <div className="yt-playlist-header">
                <div className="yt-playlist-header-left">
                  <ListVideo width={18} height={18} color="var(--accent)" />
                  <div>
                    <h3 className="yt-playlist-title">Batch Lecture Queue</h3>
                    <span className="yt-playlist-sub">
                      {playlist.length} Lectures • {courseName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="yt-playlist-items-scroll">
                {playlist.map((lec, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={lec.id || idx}
                      className={`yt-playlist-item-card ${isCurrent ? 'active' : ''}`}
                      onClick={() => onNavigate(idx)}
                    >
                      <div className="yt-item-idx-wrap">
                        {isCurrent ? (
                          <div className="yt-now-playing-wave">
                            <span />
                            <span />
                            <span />
                          </div>
                        ) : (
                          <span className="yt-item-number">{idx + 1}</span>
                        )}
                      </div>

                      <div className="yt-item-info">
                        <div className="yt-item-title">{lec.label}</div>
                        <div className="yt-item-badge-row">
                          {isCurrent && <span className="now-playing-tag">NOW PLAYING</span>}
                          {lec.servers && lec.servers.length > 1 && (
                            <span className="server-count-tag">{lec.servers.length} Servers</span>
                          )}
                        </div>
                      </div>

                      <button className="yt-item-play-action" title="Play Lecture">
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
    </div>
  );
};
