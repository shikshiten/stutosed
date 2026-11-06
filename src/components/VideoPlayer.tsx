'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  syncLectureWatched,
  syncCourseMemory,
  syncVideoProgress,
} from '@/lib/supabaseSync';
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
  AlertTriangle,
} from 'lucide-react';
import { ComplaintModal } from '@/components/ComplaintModal';

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
  const [accumulatedSkip, setAccumulatedSkip] = useState<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapSideRef = useRef<'left' | 'right' | 'center' | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTouchTimeRef = useRef<number>(0);

  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);

  // Video Server Loading Notice state
  const [loadingNoticeVisible, setLoadingNoticeVisible] = useState<boolean>(false);
  const [loadingSeconds, setLoadingSeconds] = useState<number>(0);
  const [showComplaintModal, setShowComplaintModal] = useState<boolean>(false);

  // Library & Bookmark States
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isWatched, setIsWatched] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

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

  // Reset states & trigger loading notice when lecture index or server changes
  useEffect(() => {
    setSelectedServerIndex(0);
    setStreamError(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedTime(0);
    setLoadingNoticeVisible(true);
    setLoadingSeconds(0);
  }, [currentIndex]);

  useEffect(() => {
    setLoadingNoticeVisible(true);
    setLoadingSeconds(0);
  }, [selectedServerIndex]);

  // Handle auto-dismissal when video begins playing, or advance elapsed loading seconds
  useEffect(() => {
    if (isEmbedMode) {
      setLoadingNoticeVisible(false);
      return;
    }
    if (!loadingNoticeVisible) return;
    if (isPlaying && !streamLoading && !isBuffering && !streamError) {
      const timer = setTimeout(() => {
        setLoadingNoticeVisible(false);
      }, 700);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setLoadingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingNoticeVisible, isPlaying, streamLoading, isBuffering, streamError]);

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

  // Auto-hide controls scheduler
  const scheduleAutoHide = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    if (isPlaying && !showSpeedMenu && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying, showSpeedMenu, showQualityMenu]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  useEffect(() => {
    scheduleAutoHide();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSpeedMenu, showQualityMenu, scheduleAutoHide]);

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

  // Determine active URL from servers array or fallback (deduplicating identical URLs)
  const servers: ServerOption[] = useMemo(() => {
    if (currentItem?.servers && currentItem.servers.length > 0) {
      const seen = new Set<string>();
      const distinct: ServerOption[] = [];
      for (const s of currentItem.servers) {
        const key = s.url?.trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          distinct.push(s);
        }
      }
      return distinct;
    }
    return [];
  }, [currentItem]);

  const activeServer = servers[selectedServerIndex] || servers[0] || null;
  const activeUrl = activeServer?.url || currentItem?.url || '';

  // Determine URL types
  const isAbyssUrl =
    activeUrl.includes('abyssplayer.com') ||
    activeUrl.includes('abyss.to') ||
    currentItem?.type === 'abyss' ||
    activeServer?.type === 'abyss';

  const abyssEmbedUrl = useMemo(() => {
    if (!isAbyssUrl) return null;
    if (activeUrl.includes('player.abyssplayer.com')) {
      return activeUrl;
    }
    const match = activeUrl.match(/(?:abyss\.to\/|abyssplayer\.com\/|files\/)([a-zA-Z0-9_-]{8,15})/);
    const fileId = match ? match[1] : (currentItem?.id || '');
    return `https://player.abyssplayer.com/${fileId}`;
  }, [isAbyssUrl, activeUrl, currentItem]);

  const isEmbedMode = Boolean(abyssEmbedUrl);

  const isVidmolyUrl = activeUrl.includes('vidmoly.');
  const isEarnvidsUrl = activeUrl.includes('morencius.') || activeUrl.includes('earnvids.');
  const isYouTubeUrl = activeUrl.includes('youtube.') || activeUrl.includes('youtu.be');
  const isHlsUrl = activeUrl.includes('.m3u8');

  // Direct media streams, mp4 files, Heroku streams
  const isProxyStreamUrl =
    activeUrl.includes('workers.dev') ||
    activeUrl.includes('publicbotshub') ||
    activeUrl.includes('herokuapp.com') ||
    activeUrl.endsWith('.mp4') ||
    activeUrl.endsWith('.mkv');

  const needsApiResolution = !isEmbedMode && (isVidmolyUrl || isEarnvidsUrl) && !isHlsUrl;

  // Resolve stream URL for Vidmoly/Earnvids via cached server-side API
  useEffect(() => {
    if (!needsApiResolution || !activeUrl) {
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

    fetch(`/api/v1/stream?code=${code}&provider=${provider}`, { signal: abortController.signal })
      .then((r) => r.json())
      .then((res) => {
        const streamData = res?.data || res;
        if (streamData?.streamUrl) {
          setResolvedStreamUrl(streamData.streamUrl);
        } else {
          setStreamError('Failed to load stream. Try selecting another server.');
        }
        setStreamLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setStreamError('Stream request timed out. Please retry.');
          setStreamLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [activeUrl, needsApiResolution, isVidmolyUrl, isEarnvidsUrl]);

  // Determine media source for <video> element
  const isHrankerHls = isHlsUrl && activeUrl.includes('hranker.com');
  const videoSourceUrl = isProxyStreamUrl
    ? getWorkerProxyUrl(activeUrl, 'stream')
    : isHrankerHls
    ? `/api/v1/hls-proxy?url=${encodeURIComponent(activeUrl)}&provider=hranker`
    : isHlsUrl
    ? activeUrl
    : resolvedStreamUrl;

  // Video element attachment and HLS / MP4 engine setup
  useEffect(() => {
    if (!videoSourceUrl || !videoRef.current) return;

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
        progressive: true,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        backBufferLength: 90,
        manifestLoadingTimeOut: 15000,
        fragLoadingTimeOut: 20000,
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
              if (data.response?.code === 404) {
                setStreamError(
                  'This lecture is currently being processed by Vidmoly servers. Newly uploaded videos take a few minutes to encode. Please check back shortly or select one of the ready lectures (e.g. Lecture 2 A, 5 C, 7, 8 A).'
                );
                hls.destroy();
                hlsRef.current = null;
                break;
              }
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
  }, [videoSourceUrl, isProxyStreamUrl]);

  // Sync playback rate when speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [videoSourceUrl, playbackSpeed]);

  // Progress Memory: Resume where left off & record watch progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentItem) return;

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
        if (video.currentTime > 5) {
          syncVideoProgress(currentItem.id || currentItem.url, video.currentTime, video.duration);
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentItem, videoSourceUrl, isDraggingSeek]);

  // Buffering & Play/Pause listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      if (currentItem?.url) {
        setIsWatched(true);
        syncLectureWatched(courseId || '', currentItem.url, currentItem.label);
        syncCourseMemory(courseId || '', 'videos', currentItem.url, {
          courseName,
          lectureTitle: currentItem.label,
        });
      }
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
  }, [videoSourceUrl]);

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

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el) return;

    const isCurrentlyFs = Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      isFullscreen
    );

    if (!isCurrentlyFs) {
      // 1. iOS Safari native video fullscreen
      if (!el.requestFullscreen && video && (video as any).webkitEnterFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
          return;
        } catch {}
      }

      // 2. Standard HTML5 fullscreen
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Auto-lock to landscape on mobile if supported
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch {}
      } catch {
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen().catch(() => {});
          }
        }
      } catch {}

      try {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {}

      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Fullscreen change listener to sync state with escape key or browser gestures
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) {
        try {
          if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
          }
        } catch {}
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Lock body scroll in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Mobile Touch Double-Tap to Seek (-10s / +10s) with gesture detection
  const handleViewportTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isEmbedMode) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.player-seekbar-container') ||
      target.closest('.player-server-group') ||
      target.closest('.yt-open-link') ||
      target.closest('.loading-notice-close') ||
      target.closest('.player-floating-menu')
    ) {
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    lastTouchTimeRef.current = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const ratio = x / rect.width;

    const side: 'left' | 'right' | 'center' =
      ratio < 0.40 ? 'left' : ratio > 0.60 ? 'right' : 'center';

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Double-tap or rapid multi-tap on left or right!
    if (timeSinceLastTap < 300 && (side === 'left' || side === 'right')) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      const delta = side === 'left' ? -10 : 10;
      skipVideo(delta);

      setAccumulatedSkip((prev) => {
        if ((delta < 0 && prev > 0) || (delta > 0 && prev < 0)) return delta;
        return prev + delta;
      });
      setSkipFeedback(side === 'left' ? 'backward' : 'forward');

      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => {
        setSkipFeedback(null);
        setAccumulatedSkip(0);
      }, 700);

      lastTapTimeRef.current = now;
      lastTapSideRef.current = side;
      return;
    }

    // Register as potential single tap to hide/show controls
    lastTapTimeRef.current = now;
    lastTapSideRef.current = side;

    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      setShowControls((prev) => {
        const next = !prev;
        if (next) {
          scheduleAutoHide();
        } else if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
        return next;
      });
    }, 220);
  };

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

  // Synchronized state refs for keyboard shortcuts (prevents stale closures)
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const activeTag = (target?.tagName || document.activeElement?.tagName)?.toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        target?.isContentEditable ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (key === ' ' || key === 'k' || key === 'K') {
        e.preventDefault();
        togglePlayPause();
        return;
      }
      if (key === 'ArrowRight' || key === 'l' || key === 'L') {
        e.preventDefault();
        skipVideo(10);
        return;
      }
      if (key === 'ArrowLeft' || key === 'j' || key === 'J') {
        e.preventDefault();
        skipVideo(-10);
        return;
      }
      if (key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, Math.round((volumeRef.current + 0.05) * 100) / 100));
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, Math.round((volumeRef.current - 0.05) * 100) / 100));
        return;
      }
      if (key === 'm' || key === 'M') {
        e.preventDefault();
        toggleMute();
        return;
      }
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (/^[0-9]$/.test(key) && videoRef.current && durationRef.current > 0) {
        e.preventDefault();
        const pct = parseInt(key, 10) / 10;
        const targetTime = durationRef.current * pct;
        videoRef.current.currentTime = targetTime;
        setCurrentTime(targetTime);
        resetControlsTimer();
        return;
      }
      if (key === 'Home' && videoRef.current) {
        e.preventDefault();
        videoRef.current.currentTime = 0;
        setCurrentTime(0);
        resetControlsTimer();
        return;
      }
      if (key === 'End' && videoRef.current && durationRef.current > 0) {
        e.preventDefault();
        videoRef.current.currentTime = durationRef.current;
        setCurrentTime(durationRef.current);
        resetControlsTimer();
        return;
      }
      const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      if (key === '>' || (e.shiftKey && key === '.')) {
        e.preventDefault();
        const curr = playbackSpeedRef.current;
        const next = SPEEDS.find((s) => s > curr) ?? SPEEDS[SPEEDS.length - 1];
        handleSpeedChange(next);
        return;
      }
      if (key === '<' || (e.shiftKey && key === ',')) {
        e.preventDefault();
        const curr = playbackSpeedRef.current;
        const reversed = [...SPEEDS].reverse();
        const next = reversed.find((s) => s < curr) ?? SPEEDS[0];
        handleSpeedChange(next);
        return;
      }
      if (key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipVideo, toggleFullscreen, onClose, resetControlsTimer]);

  const showLoading = streamLoading || isBuffering;

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
              className={`player-box ${isFullscreen ? 'is-fullscreen' : ''} ${!showControls ? 'controls-hidden' : 'controls-visible'}`}
              ref={containerRef}
              onMouseMove={() => {
                if (showControls) scheduleAutoHide();
              }}
              onMouseEnter={() => {
                if (showControls) scheduleAutoHide();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                className="player-viewport"
                onTouchEnd={handleViewportTouchEnd}
                onClick={(e) => {
                  if (isEmbedMode) return;
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('button') ||
                    target.closest('input') ||
                    target.closest('.player-seekbar-container') ||
                    target.closest('.player-server-group') ||
                    target.closest('.yt-open-link') ||
                    target.closest('.loading-notice-close') ||
                    target.closest('.player-floating-menu')
                  ) {
                    return;
                  }
                  if (Date.now() - lastTouchTimeRef.current < 450) {
                    return;
                  }
                  setShowControls((prev) => {
                    const next = !prev;
                    if (next) {
                      scheduleAutoHide();
                    } else if (controlsTimeoutRef.current) {
                      clearTimeout(controlsTimeoutRef.current);
                      controlsTimeoutRef.current = null;
                    }
                    return next;
                  });
                }}
              >
                {/* Busy Server Loading Notice Overlay */}
                {loadingNoticeVisible && (
                  <div
                    className={`player-loading-notice-card ${loadingSeconds > 18 || Boolean(streamError) ? 'is-unavailable' : ''}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="loading-notice-spinner">
                      {loadingSeconds > 18 || Boolean(streamError) ? (
                        <AlertTriangle width={18} height={18} stroke="#ef4444" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      )}
                    </div>
                    <div className="loading-notice-content">
                      <div className="loading-notice-title">
                        <span>{loadingSeconds > 18 || Boolean(streamError) ? 'Playback Unavailable' : 'Connecting to Video Server'}</span>
                        <span className={`loading-notice-badge ${loadingSeconds > 18 || Boolean(streamError) ? 'is-unavailable' : loadingSeconds > 6 ? 'is-waiting' : ''}`}>
                          {loadingSeconds > 18 || Boolean(streamError) ? 'UNAVAILABLE' : loadingSeconds > 6 ? 'PLEASE WAIT' : 'CONNECTING'}
                        </span>
                      </div>
                      <p className="loading-notice-desc">
                        {loadingSeconds > 18 || Boolean(streamError)
                          ? "Abhi playback iski available nahi hai. Upstream server se video load nahi ho pa rahi hai."
                          : loadingSeconds > 6
                          ? "Upstream server is taking a little longer than usual. Please stay here, it will open soon."
                          : "Please wait, video is fetching from server..."}
                      </p>
                      {(loadingSeconds > 18 || Boolean(streamError)) && (
                        <div className="loading-notice-actions">
                          <button
                            type="button"
                            className="loading-notice-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowComplaintModal(true);
                            }}
                          >
                            <AlertTriangle width={13} height={13} />
                            <span>Complain to Developer</span>
                          </button>
                          {servers.length > 1 && (
                            <button
                              type="button"
                              className="loading-notice-action-btn secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedServerIndex((prev) => (prev + 1) % servers.length);
                                setStreamError(null);
                                setLoadingSeconds(0);
                              }}
                            >
                              Try Next Server
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      className="loading-notice-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoadingNoticeVisible(false);
                      }}
                      title="Dismiss notice"
                    >
                      ✕
                    </button>
                  </div>
                )}
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
                            {srv.name?.replace(/\b(ALBA|ESTE)\b/gi, '').replace(/[()[\]]/g, '').replace(/^[^\w]+/, '').trim() || `Server ${idx + 1}`}
                          </button>
                        ))}
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
                {!isEmbedMode && (
                <div className="player-center-overlay">
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
                </div>

                )}

                {/* Double-tap indicator */}
                {skipFeedback && (
                  <div className={`player-skip-indicator ${skipFeedback}`}>
                    <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-1px' }}>
                      {skipFeedback === 'backward' ? '««' : '»»'}
                    </span>
                    <span>
                      {accumulatedSkip !== 0 ? `${Math.abs(accumulatedSkip)}s` : '10s'}
                    </span>
                  </div>
                )}

                {/* Video Media Canvas */}
                {isAbyssUrl && abyssEmbedUrl ? (
                  <div
                    className="player-iframe-container"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      background: '#000000',
                      pointerEvents: 'auto',
                      touchAction: 'auto',
                    }}
                  >
                    <iframe
                      ref={iframeRef}
                      key={abyssEmbedUrl}
                      src={abyssEmbedUrl}
                      title={currentItem.label}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                        pointerEvents: 'auto',
                        touchAction: 'auto',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      onLoad={() => {
                        setStreamLoading(false);
                        setLoadingNoticeVisible(false);
                      }}
                    />
                  </div>
                ) : isYouTubeUrl ? (
                  (() => {
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
                  })()
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      preload="auto"
                      className="player-native-video"
                      title={currentItem.label}
                    />

                    {/* Playback Unavailable Central Fallback Screen */}
                    {(Boolean(streamError) || (streamLoading && loadingSeconds > 18)) && (
                      <div
                        className="player-unavailable-screen"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          zIndex: 25,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'radial-gradient(circle at 50% 40%, rgba(24, 24, 27, 0.96) 0%, rgba(9, 9, 11, 0.98) 100%)',
                          padding: '32px 24px',
                          textAlign: 'center',
                          color: '#ffffff',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            marginBottom: '16px',
                            boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
                          }}
                        >
                          <AlertTriangle width={28} height={28} />
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 800,
                            color: '#ef4444',
                            marginBottom: '8px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            padding: '4px 12px',
                            borderRadius: 'var(--r-pill)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          Playback Unavailable
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px', color: '#ffffff', maxWidth: '520px', lineHeight: 1.35 }}>
                          Abhi playback iski available nahi hai
                        </h3>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.72)', maxWidth: '480px', lineHeight: 1.55, margin: '0 0 24px' }}>
                          Upstream video server is unable to deliver this lecture stream right now. You can report directly to the developer to get this link fixed.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setShowComplaintModal(true)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 24px',
                              borderRadius: 'var(--r-pill)',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '13.5px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.45)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <AlertTriangle width={16} height={16} />
                            <span>Complain to Developer</span>
                          </button>
                          {servers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServerIndex((prev) => (prev + 1) % servers.length);
                                setStreamError(null);
                                setLoadingSeconds(0);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: 'var(--r-pill)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '13.5px',
                                cursor: 'pointer',
                              }}
                            >
                              Try Server {((selectedServerIndex + 1) % servers.length) + 1}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 3. BOTTOM FLOATING OVERLAY (Seekbar, Controls & In-Fullscreen Speed Menu) */}
                {!isEmbedMode && (
                <div
                  className="player-bottom-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Seekbar */}
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

                      {/* Time */}
                      <div className="dock-time-display">
                        <span className="current-time">{formatTime(currentTime)}</span>
                        <span className="divider">/</span>
                        <span className="total-time">{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="dock-group-right">
                      {/* Quality */}
                      {qualities.length > 0 && (
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
                )}
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

      {/* Complain to Developer Pop-up Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        courseName={courseName}
        lectureTitle={currentItem.label}
        lectureUrl={activeUrl}
        serverName={activeServer?.name}
      />
    </div>
  );
};
