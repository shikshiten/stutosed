'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hls from 'hls.js';
import { Course, LectureItem, ServerOption } from '@/types';
import { INITIAL_COURSES, getCourseById } from '@/lib/coursesData';
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
  Moon,
  Sun,
} from 'lucide-react';

const WATCHED_KEY = 'onafbu_watched_v1';
const LAST_PLAYED_KEY = 'stutosed_last_played_v1';

// Helper to extract Vidmoly code
function extractVidmolyCode(url: string): string | null {
  const m = url.match(/(?:embed-|w\/|vidmoly\.(?:net|me)\/)([a-zA-Z0-9]{10,16})/);
  return m ? m[1] : null;
}

// Helper to extract Earnvids code
function extractEarnvidsCode(url: string): string | null {
  const m = url.match(/morencius\.com\/v\/([a-zA-Z0-9]{10,16})/);
  return m ? m[1] : null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function WatchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseParam = searchParams.get('course') || '';
  const indexParam = searchParams.get('index');
  const folderParam = searchParams.get('folder') || '';
  const subjectParam = searchParams.get('subject') || '';

  // Playlist & Navigation state
  const [playlist, setPlaylist] = useState<LectureItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [courseInfo, setCourseInfo] = useState<{
    id: string;
    name: string;
    category?: string;
    subject?: string;
    thumb?: string;
  }>({
    id: '',
    name: 'Lecture',
    category: 'all',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Video playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [seekHoverTime, setSeekHoverTime] = useState<number | null>(null);
  const [seekHoverPos, setSeekHoverPos] = useState<number>(0);
  const [skipFeedback, setSkipFeedback] = useState<'backward' | 'forward' | null>(null);
  const [playerMode, setPlayerMode] = useState<'proxy' | 'embedded'>('proxy');
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  // Action states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(true);

  // 1. Initial Load: Sync Theme & Resolve Playlist from SessionStorage or Course Data
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('stutosed-theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {}

    // Check sessionStorage first for rich session data
    let sessionData: any = null;
    try {
      const raw = sessionStorage.getItem('stutosed_watch_data');
      if (raw) sessionData = JSON.parse(raw);
    } catch {}

    const parsedIndex = indexParam !== null ? parseInt(indexParam, 10) : (sessionData?.index ?? 0);
    const validIndex = isNaN(parsedIndex) || parsedIndex < 0 ? 0 : parsedIndex;

    if (sessionData && sessionData.playlist && sessionData.playlist.length > 0) {
      setPlaylist(sessionData.playlist);
      setCurrentIndex(Math.min(validIndex, sessionData.playlist.length - 1));
      setCourseInfo({
        id: sessionData.courseId || courseParam,
        name: sessionData.courseName || 'Lecture Series',
        category: sessionData.courseCategory || (sessionData.courseId?.startsWith('beu') ? 'beu' : 'government'),
        subject: sessionData.subjectName || subjectParam || folderParam,
      });
      setIsLoaded(true);
      return;
    }

    // Fallback: Resolve directly from coursesData
    if (courseParam) {
      const course = getCourseById(courseParam) || INITIAL_COURSES.find((c) => c.name.toLowerCase() === courseParam.toLowerCase());
      if (course) {
        let extractedItems: LectureItem[] = [];
        let extractedSubject = course.name;

        if (course.isParmar && course.parmarData) {
          const subjects = Object.keys(course.parmarData);
          const activeSubj = (subjectParam && course.parmarData[subjectParam])
            ? subjectParam
            : (folderParam && course.parmarData[folderParam])
            ? folderParam
            : subjects[0];
          extractedSubject = activeSubj || 'General';
          const subjData = course.parmarData[extractedSubject];
          extractedItems = (subjData?.lectures || [])
            .filter((l) => {
              const u = l.links?.url || Object.values(l.links || {}).find((lnk) =>
                lnk.includes('/dl/') || lnk.includes('.mp4') || lnk.includes('.m3u8') || lnk.includes('embed') || lnk.includes('morencius') || lnk.includes('vidmoly')
              );
              return Boolean(u);
            })
            .map((l) => {
              const u = l.links?.url || Object.values(l.links || {}).find((lnk) =>
                lnk.includes('/dl/') || lnk.includes('.mp4') || lnk.includes('.m3u8') || lnk.includes('embed') || lnk.includes('morencius') || lnk.includes('vidmoly')
              ) || '';
              return {
                label: l.title,
                url: u,
                type: 'hls' as const,
                folderName: extractedSubject,
                subject: extractedSubject,
              };
            });
        } else if (course.isPratham && course.prathamBySubject) {
          const subjects = Object.keys(course.prathamBySubject);
          const activeSubj = (subjectParam && course.prathamBySubject[subjectParam])
            ? subjectParam
            : subjects[0];
          extractedSubject = activeSubj || 'General';
          const items = course.prathamBySubject[extractedSubject] || [];
          extractedItems = items.filter((i) => i.category === 'videos' || i.type !== 'pdf');
        } else if (course.tabs && course.tabs.length > 0) {
          let targetTab = folderParam ? course.tabs.find((t) => t.id === folderParam) : null;
          if (!targetTab) {
            targetTab = course.tabs.find((t) => t.items && t.items.some((i) => i.type !== 'pdf')) || course.tabs[0];
          }
          extractedSubject = targetTab?.label || course.name;
          extractedItems = (targetTab?.items || []).filter((i) => i.type !== 'pdf');
        }

        if (extractedItems.length > 0) {
          setPlaylist(extractedItems);
          setCurrentIndex(Math.min(validIndex, extractedItems.length - 1));
          setCourseInfo({
            id: course.id,
            name: course.name,
            category: course.id.startsWith('beu') ? 'beu' : 'government',
            subject: extractedSubject,
            thumb: course.thumb,
          });
          setIsLoaded(true);
          return;
        }
      }
    }

    setIsLoaded(true);
  }, [courseParam, indexParam, folderParam, subjectParam]);

  const currentItem = playlist[currentIndex] || null;

  // Sync Library & Bookmark states
  useEffect(() => {
    if (courseInfo.id) {
      setIsBookmarked(isCourseBookmarked(courseInfo.id));
    }
  }, [courseInfo.id]);

  useEffect(() => {
    if (currentItem) {
      const saved = isVideoSaved(currentItem.id || currentItem.url);
      setIsSaved(saved);

      try {
        const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
        setIsWatched(Boolean(savedWatched[currentItem.url]));
      } catch {
        setIsWatched(false);
      }
    }
  }, [currentItem]);

  // Mark watched & remember last played
  useEffect(() => {
    if (!currentItem?.url) return;

    try {
      const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
      savedWatched[currentItem.url] = Date.now();
      localStorage.setItem(WATCHED_KEY, JSON.stringify(savedWatched));
      setIsWatched(true);

      const mem = {
        courseId: courseInfo.id,
        courseName: courseInfo.name,
        courseThumb: courseInfo.thumb || '',
        lectureTitle: currentItem.label,
        url: currentItem.url,
        timestamp: Date.now(),
      };
      localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(mem));
    } catch {}
  }, [currentItem, courseInfo]);

  // Active Server & URL resolution
  const servers: ServerOption[] = useMemo(() => {
    if (currentItem?.servers && currentItem.servers.length > 0) return currentItem.servers;
    if (currentItem?.url) return [{ name: 'Server 1', url: currentItem.url, type: currentItem.type }];
    return [];
  }, [currentItem]);

  const activeServer = servers[selectedServerIndex] || servers[0] || null;
  const activeUrl = activeServer?.url || currentItem?.url || '';

  const isVidmolyUrl = activeUrl.includes('vidmoly.') || activeUrl.includes('/w/');
  const isEarnvidsUrl = activeUrl.includes('morencius.com');
  const isYouTubeUrl = activeUrl.includes('youtube.com') || activeUrl.includes('youtu.be') || currentItem?.type === 'youtube';
  const isDirectHlsUrl = activeUrl.includes('.m3u8');
  const isProxyStreamUrl =
    activeUrl.includes('streamvaultpro.cc') ||
    activeUrl.includes('workers.dev') ||
    activeUrl.includes('publicbotshub') ||
    activeUrl.includes('herokuapp.com') ||
    activeUrl.includes('/0:/stream/') ||
    activeUrl.includes('/0:/dl/') ||
    activeUrl.endsWith('.mp4') ||
    activeUrl.endsWith('.mkv') ||
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    activeServer?.name?.toUpperCase().includes('ESTE');
  const isAlbaActive =
    activeServer?.name?.toUpperCase().includes('ALBA') ||
    activeServer?.name?.toUpperCase().includes('ESTE') ||
    (!activeServer && (activeUrl.includes('streamvaultpro.cc') || activeUrl.includes('/0:/stream/') || activeUrl.includes('/0:/dl/'))) ||
    Boolean(activeServer?.streamUrl);
  const canToggleMode = (isVidmolyUrl || isEarnvidsUrl || isAlbaActive || isProxyStreamUrl) && !isYouTubeUrl;
  const needsApiResolution = isVidmolyUrl || isEarnvidsUrl;

  // Stream Resolution with fast in-memory cache
  useEffect(() => {
    if (!activeUrl) return;

    setResolvedStreamUrl(null);
    setStreamError(null);

    if (isYouTubeUrl) {
      setPlayerMode('embedded');
      setStreamLoading(false);
      return;
    }

    if (!needsApiResolution) {
      setPlayerMode('proxy');
      setStreamLoading(false);
      return;
    }

    const abortController = new AbortController();
    const vidmolyCode = isVidmolyUrl ? extractVidmolyCode(activeUrl) : null;
    const earnvidsCode = isEarnvidsUrl ? extractEarnvidsCode(activeUrl) : null;
    const provider = isEarnvidsUrl ? 'earnvids' : 'vidmoly';
    const code = earnvidsCode || vidmolyCode;

    if (!code) {
      setPlayerMode('embedded');
      setStreamLoading(false);
      return;
    }

    setStreamLoading(true);
    setPlayerMode('proxy');

    fetch(`/api/stream?code=${encodeURIComponent(code)}&provider=${provider}`, {
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.streamUrl) {
          setResolvedStreamUrl(data.streamUrl);
        } else {
          setPlayerMode('embedded');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setPlayerMode('embedded');
        }
      })
      .finally(() => {
        setStreamLoading(false);
      });

    return () => abortController.abort();
  }, [activeUrl, needsApiResolution, isVidmolyUrl, isEarnvidsUrl, isYouTubeUrl]);

  // If URL needs resolution (Vidmoly / Earnvids), NEVER use raw activeUrl as stream source!
  const videoSourceUrl = needsApiResolution
    ? resolvedStreamUrl
    : isProxyStreamUrl
    ? getWorkerProxyUrl(activeUrl, 'stream')
    : isDirectHlsUrl
    ? activeUrl
    : activeUrl;

  // Video & HLS Setup
  useEffect(() => {
    if (playerMode !== 'proxy' || !videoSourceUrl || !videoRef.current) return;

    const video = videoRef.current;
    setQualities([]);
    setCurrentQuality(-1);
    setIsPlaying(false);
    setIsBuffering(false);

    if (isProxyStreamUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = videoSourceUrl;
      video.load();
      setIsBuffering(false);
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
      return;
    }

    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (video.canPlayType('application/vnd.apple.mpegurl') && (isSafari || !Hls.isSupported())) {
      video.src = videoSourceUrl;
      video.load();
      video.play().catch(() => {
        setIsBuffering(false);
      });
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
        setIsBuffering(false);
        video.play().catch(() => {
          // Autoplay blocked by mobile browser - show play button so user can tap
          setIsBuffering(false);
        });
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
              // Fatal HLS error fallback to embedded iframe
              setPlayerMode('embedded');
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
      video.play().catch(() => {
        setIsBuffering(false);
      });
    }
  }, [videoSourceUrl, isProxyStreamUrl, playerMode]);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current && playerMode === 'proxy') {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [videoSourceUrl, playbackSpeed, playerMode]);

  // Video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerMode !== 'proxy') return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
    };
    const handleLoadedData = () => {
      setIsBuffering(false);
    };
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [playerMode]);

  // Progress update & seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentItem || playerMode !== 'proxy') return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleTimeUpdate = () => {
      if (!isDraggingSeek) {
        setCurrentTime(video.currentTime);
      }
      if (video.buffered && video.buffered.length > 0) {
        try {
          setBufferedTime(video.buffered.end(video.buffered.length - 1));
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

  // Controls reset timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }, 3500);
    }
  }, [isPlaying]);

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

  const skipVideo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setSkipFeedback(seconds > 0 ? 'forward' : 'backward');
    setTimeout(() => setSkipFeedback(null), 600);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
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
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetControlsTimer();
  };

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

  // Switch to another lecture
  const handleSelectLecture = (newIdx: number) => {
    setCurrentIndex(newIdx);
    setSelectedServerIndex(0);
    try {
      const nextQuery = new URLSearchParams(searchParams.toString());
      nextQuery.set('index', String(newIdx));
      window.history.replaceState(null, '', `?${nextQuery.toString()}`);
    } catch {}

    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Actions
  const handleToggleBookmark = () => {
    if (!courseInfo.id) return;
    const next = toggleCourseBookmark(courseInfo.id);
    setIsBookmarked(next);
  };

  const handleToggleSaveVideo = () => {
    if (!currentItem) return;
    const next = toggleSaveVideo({
      id: currentItem.id || currentItem.url,
      label: currentItem.label,
      url: currentItem.url,
      courseId: courseInfo.id,
      courseName: courseInfo.name,
      courseCategory: courseInfo.category,
      subject: courseInfo.subject,
      type: currentItem.type,
      servers: currentItem.servers,
      links: currentItem.links,
    });
    setIsSaved(next);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleBackToCourse = () => {
    if (window.history.length > 1) {
      router.back();
    } else if (courseInfo.id) {
      router.push(`/?course=${encodeURIComponent(courseInfo.id)}`);
    } else {
      router.push('/');
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('stutosed-theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch {}
  };

  // Dynamic Syllabus Description
  const topicDesc = useMemo(() => {
    return getLectureTopicDescription(currentItem?.label || courseInfo.name);
  }, [currentItem, courseInfo]);

  const showLoading = playerMode === 'proxy' && (streamLoading || (isBuffering && isPlaying));
  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  if (!isLoaded) {
    return (
      <div className="watch-loading-screen">
        <div className="player-spinner" style={{ width: '32px', height: '32px' }} />
        <span>Loading lecture…</span>
      </div>
    );
  }

  if (playlist.length === 0 || !currentItem) {
    return (
      <div className="watch-empty-screen">
        <ArrowLeft width={20} height={20} />
        <h2>No lecture found</h2>
        <p>This lecture playlist is not available or has expired.</p>
        <button onClick={handleBackToCourse} className="watch-back-link">
          ← Return to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="watch-page-root">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="watch-page-header">
        <button onClick={handleBackToCourse} className="watch-back-link">
          <ArrowLeft width={18} height={18} />
          <span>Back to Course</span>
        </button>

        <div className="watch-header-course-info">
          <span className="watch-category-badge">
            {courseInfo.category === 'beu' ? 'BEU Engineering' : 'Govt Exams'}
          </span>
          <span className="watch-course-title-text" title={courseInfo.name}>
            {courseInfo.name}
          </span>
        </div>

        <button onClick={handleToggleTheme} className="watch-theme-toggle-btn" title="Toggle Theme">
          {theme === 'light' ? <Moon width={18} height={18} /> : <Sun width={18} height={18} />}
        </button>
      </header>

      {/* 2. MAIN 2-COLUMN WATCH LAYOUT */}
      <div className="watch-content-layout">
        {/* ==================== LEFT COLUMN: VIDEO + DETAILS + SYLLABUS ==================== */}
        <main className="watch-left-col">
          {/* VIDEO BOX WITH ON-SCREEN OVERLAY CONTROLS */}
          <div
            className={`watch-player-box ${isFullscreen ? 'is-fullscreen' : ''} ${showControls ? 'controls-visible' : 'controls-hidden'}`}
            ref={containerRef}
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            onMouseEnter={resetControlsTimer}
          >
            <div className="player-viewport">
              {/* TOP OVERLAY */}
              <div className="player-top-overlay" onClick={(e) => e.stopPropagation()}>
                <div className="player-title-block">
                  <div className="player-course-chip">{courseInfo.name}</div>
                  <h2 className="player-lecture-heading" title={currentItem.label}>
                    {currentItem.label}
                  </h2>
                </div>

                <div className="player-top-actions">
                  {/* Multi-server pills */}
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

                  {/* Mode Toggle: Smart Proxy / Embedded */}
                  {canToggleMode && (
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

                  {/* Fullscreen / Close Button */}
                  <button
                    className="player-overlay-close-btn"
                    onClick={isFullscreen ? toggleFullscreen : handleBackToCourse}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Back'}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CENTER OVERLAY: Frosted Glass Button that transforms to Spinning Ring on loading */}
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

                    {/* The Center Glass Play button becomes a rotating spinner during loading */}
                    <button
                      className={`player-center-glass-play ${showLoading ? 'is-loading' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPause();
                      }}
                      title={showLoading ? 'Loading high-speed stream…' : 'Play / Pause (Space)'}
                      style={{ cursor: 'pointer' }}
                    >
                      {showLoading ? (
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

              {/* Media Element */}
              {playerMode === 'proxy' ? (
                <video
                  ref={videoRef}
                  playsInline
                  preload="metadata"
                  className="player-native-video"
                  title={currentItem.label}
                  onClick={togglePlayPause}
                />
              ) : isVidmolyUrl || isEarnvidsUrl ? (
                <iframe
                  src={activeUrl}
                  className="player-native-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={currentItem.label}
                  style={{ border: 'none' }}
                />
              ) : (
                <video
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  src={
                    activeServer?.downloadUrl ||
                    (activeUrl.includes('/0:/stream/')
                      ? activeUrl.replace('/0:/stream/', '/0:/dl/')
                      : activeUrl)
                  }
                  className="player-native-video"
                  title={currentItem.label}
                />
              )}

              {/* BOTTOM FLOATING OVERLAY */}
              <div className="player-bottom-overlay" onClick={(e) => e.stopPropagation()}>
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
                      <div className="player-seekbar-tooltip" style={{ left: `${seekHoverPos}%` }}>
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

                {/* Controls Dock */}
                <div className="player-controls-dock">
                  <div className="dock-group-left">
                    <button
                      className="dock-ctrl-btn"
                      disabled={currentIndex === 0}
                      onClick={() => handleSelectLecture(currentIndex - 1)}
                      title="Previous Lecture"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="19 20 9 12 19 4 19 20" />
                        <line x1="5" y1="19" x2="5" y2="5" />
                      </svg>
                    </button>

                    {playerMode === 'proxy' && (
                      <button className="dock-ctrl-btn dock-play-btn" onClick={togglePlayPause} title="Play / Pause">
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
                      onClick={() => handleSelectLecture(currentIndex + 1)}
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

                    {/* Time Display */}
                    {playerMode === 'proxy' && (
                      <div className="dock-time-display">
                        <span className="current-time">{formatTime(currentTime)}</span>
                        <span className="divider">/</span>
                        <span className="total-time">{formatTime(duration)}</span>
                      </div>
                    )}
                  </div>

                  <div className="dock-group-right">
                    {/* Quality Selector */}
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

                    {/* Speed Selector */}
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
            </div>
          </div>

          {/* ==================== INFO & ACTIONS ROW (NO CUT-OFF) ==================== */}
          <div className="watch-info-section">
            {/* Metadata Chips */}
            <div className="watch-meta-chips">
              <span className="watch-chip batch-chip">{courseInfo.name}</span>
              {courseInfo.subject && <span className="watch-chip subject-chip">{courseInfo.subject}</span>}
              <span className="watch-chip counter-chip">
                Lecture {currentIndex + 1} of {playlist.length}
              </span>
            </div>

            {/* Lecture Title */}
            <h1 className="watch-lecture-title">{currentItem.label}</h1>

            {/* YouTube Action Buttons Dock */}
            <div className="watch-action-bar">
              {/* 1. Bookmark Batch */}
              {courseInfo.id && (
                <button
                  className={`watch-action-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={handleToggleBookmark}
                >
                  {isBookmarked ? <BookmarkCheck width={17} height={17} color="var(--accent)" /> : <Bookmark width={17} height={17} />}
                  <span>{isBookmarked ? 'Batch Bookmarked' : 'Bookmark Batch'}</span>
                </button>
              )}

              {/* 2. Save Video to Batch Folder */}
              <button
                className={`watch-action-btn ${isSaved ? 'active' : ''}`}
                onClick={handleToggleSaveVideo}
              >
                {isSaved ? <FolderHeart width={17} height={17} color="var(--accent)" /> : <FolderPlus width={17} height={17} />}
                <span>{isSaved ? 'Saved in Folder' : 'Save Video'}</span>
              </button>

              {/* 3. Watched Status */}
              <div className="watch-action-btn static">
                <CheckCircle2 width={17} height={17} color={isWatched ? 'var(--green)' : 'rgba(255,255,255,0.4)'} />
                <span>{isWatched ? 'Watched' : 'In Progress'}</span>
              </div>

              {/* 4. Share Lecture */}
              <button className="watch-action-btn" onClick={handleShare}>
                <Share2 width={17} height={17} />
                <span>{copiedToast ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>

            {/* ==================== EDUCATIONAL TOPIC DESCRIPTION CARD ==================== */}
            <section className="watch-topic-card">
              <div className="watch-topic-card-header" onClick={() => setIsDescExpanded((p) => !p)}>
                <div className="watch-topic-header-left">
                  <div className="watch-topic-icon-box">
                    <Sparkles width={18} height={18} color="var(--accent)" />
                  </div>
                  <div>
                    <span className="watch-topic-tag">{topicDesc.categoryTag}</span>
                    <h3 className="watch-topic-title">Topic Overview &amp; Key Concepts</h3>
                  </div>
                </div>

                <button className="watch-topic-toggle-btn">
                  <span>{isDescExpanded ? 'Hide Details' : 'Show Details'}</span>
                  {isDescExpanded ? <ChevronUp width={16} height={16} /> : <ChevronDown width={16} height={16} />}
                </button>
              </div>

              {isDescExpanded && (
                <div className="watch-topic-body animate-fade-in">
                  <p className="watch-topic-overview">{topicDesc.overview}</p>

                  <div className="watch-topic-points-box">
                    <div className="watch-topic-points-title">Core Concepts Covered in this Lecture:</div>
                    <ul className="watch-topic-points-list">
                      {topicDesc.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="watch-exam-tip-card">
                    <span className="watch-exam-badge">Exam High-Yield Insight</span>
                    <p className="watch-exam-text">{topicDesc.examTip}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ==================== RIGHT COLUMN: BATCH PLAYLIST QUEUE ==================== */}
        <aside className="watch-right-col">
          <div className="watch-playlist-panel">
            <div className="watch-playlist-header">
              <div className="watch-playlist-header-left">
                <ListVideo width={19} height={19} color="var(--accent)" />
                <div>
                  <h3 className="watch-playlist-title">Batch Lecture Queue</h3>
                  <span className="watch-playlist-count">
                    {playlist.length} Lectures • {courseInfo.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="watch-playlist-items-scroll">
              {playlist.map((lec, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={lec.id || idx}
                    className={`watch-playlist-row ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelectLecture(idx)}
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
                        {isCurrent && <span className="watch-playing-tag">NOW PLAYING</span>}
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
}
