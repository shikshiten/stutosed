'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Hls from 'hls.js';
import { Course, LectureItem } from '@/types';
import { INITIAL_COURSES } from '@/lib/coursesData';
import { getSubjectThumbnail, getDynamicThumbnailUrl } from '@/lib/subjectThumbnails';
import { getLectureTopicDescription } from '@/lib/topicDescriptions';
import {
  isCourseBookmarked,
  toggleCourseBookmark,
  isVideoSaved,
  toggleSaveVideo,
} from '@/lib/libraryStorage';
import { GateWatchWorkspace } from './GateWatchWorkspace';
import {
  Cpu,
  Layers,
  GraduationCap,
  Folder,
  ArrowRight,
  ArrowLeft,
  Video,
  FileText,
  Search,
  X,
  LayoutGrid,
  List,
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
  Sparkles,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  FolderHeart,
  Share2,
  ListVideo,
  Moon,
  Sun,
} from 'lucide-react';

export type GateViewStep = 'branches' | 'institutes' | 'subjects' | 'lectures';

export interface GateEngineeringViewProps {
  course: Course | null;
  onSelectCourse?: (course: Course) => void;
  onPlayVideo?: (playlist: LectureItem[], index: number) => void;
  theme?: 'light' | 'dark';
  watchedUrls?: Set<string>;
  step?: GateViewStep;
  branch?: string | null;
  institute?: string | null;
  subject?: string | null;
  onStepChange?: (
    step: GateViewStep,
    branch: string | null,
    institute: string | null,
    subject: string | null,
    urlPath: string
  ) => void;
  onMarkWatched?: (url: string, courseId?: string, label?: string) => void;
}

function formatLectureTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ============================================================================
// SINGLE EMBEDDED INLINE THEATER PLAYER COMPONENT (NO MODALS, NO SECOND SCREEN)
// ============================================================================
const InlineTheaterPlayer: React.FC<{
  lecture: LectureItem;
  lectureIndex: number;
  totalLectures: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onMarkWatched: (url: string, label?: string) => void;
  theme?: 'light' | 'dark';
}> = ({
  lecture,
  lectureIndex,
  totalLectures,
  onClose,
  onNavigate,
  onMarkWatched,
  theme = 'light',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const onMarkWatchedRef = useRef(onMarkWatched);
  useEffect(() => {
    onMarkWatchedRef.current = onMarkWatched;
  });

  // Mark watched immediately on play start
  useEffect(() => {
    if (lecture.url) {
      onMarkWatchedRef.current?.(lecture.url, lecture.label);
    }
  }, [lecture.url]);

  // Resolve stream URL whenever active lecture changes
  useEffect(() => {
    let isCancelled = false;
    setIsBuffering(true);
    setResolvedStreamUrl(null);
    setUseIframeFallback(false);
    setCurrentTime(0);
    setDuration(0);

    const targetUrl = lecture.url || '';
    if (!targetUrl) {
      setIsBuffering(false);
      return;
    }

    // Direct YouTube Detection
    if (
      targetUrl.includes('youtube.com') ||
      targetUrl.includes('youtu.be') ||
      lecture.type === 'youtube'
    ) {
      const ytId = targetUrl.match(/(?:v=|youtu\.be\/|live\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (ytId) {
        setResolvedStreamUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`);
        setUseIframeFallback(true);
        setIsBuffering(false);
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
      fetch(`/api/stream?code=${encodeURIComponent(code)}&provider=${provider}`)
        .then((res) => res.json())
        .then((data) => {
          if (isCancelled) return;
          if (data?.streamUrl) {
            setResolvedStreamUrl(data.streamUrl);
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
        });
    } else {
      setResolvedStreamUrl(targetUrl);
      setUseIframeFallback(true);
      setIsBuffering(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [lecture.url, lecture.type]);

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
      const hls = new Hls({
        enableWorker: true,
        progressive: true,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(resolvedStreamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
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
              setUseIframeFallback(true);
              break;
          }
        }
      });
    } else {
      video.src = resolvedStreamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedStreamUrl, useIframeFallback]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3200);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedSelect = (spd: number) => {
    setPlaybackSpeed(spd);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="gate-inline-player"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        marginBottom: '28px',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        background: '#090d16',
        border: '1px solid rgba(255, 107, 74, 0.35)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        position: 'relative',
      }}
    >
      {/* Player Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255, 107, 74, 0.18)',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 8px var(--accent)',
              }}
            />
            Lecture {lectureIndex + 1} of {totalLectures}
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lecture.label}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => lectureIndex > 0 && onNavigate(lectureIndex - 1)}
            disabled={lectureIndex <= 0}
            title="Previous Lecture"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--r-sm)',
              color: lectureIndex > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              cursor: lectureIndex > 0 ? 'pointer' : 'not-allowed',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeft width={14} height={14} />
            <span>Prev</span>
          </button>

          <button
            onClick={() => lectureIndex < totalLectures - 1 && onNavigate(lectureIndex + 1)}
            disabled={lectureIndex >= totalLectures - 1}
            title="Next Lecture"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--r-sm)',
              color: lectureIndex < totalLectures - 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              cursor: lectureIndex < totalLectures - 1 ? 'pointer' : 'not-allowed',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <span>Next</span>
            <ChevronRight width={14} height={14} />
          </button>

          <button
            onClick={onClose}
            title="Close Player"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--r-sm)',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px',
            }}
          >
            <X width={14} height={14} />
          </button>
        </div>
      </div>

      {/* 16:9 Video Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#000000',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {useIframeFallback ? (
          <iframe
            src={resolvedStreamUrl || ''}
            title={lecture.label}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              preload="auto"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              onEnded={() => {
                onMarkWatched(lecture.url, lecture.label);
                if (lectureIndex < totalLectures - 1) {
                  onNavigate(lectureIndex + 1);
                }
              }}
              onClick={togglePlay}
            />

            {/* Buffering Spinner */}
            {isBuffering && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)',
                  pointerEvents: 'none',
                }}
              >
                <div className="player-spinner" style={{ width: '44px', height: '44px' }} />
              </div>
            )}

            {/* Controls Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 40%, transparent 65%)',
                opacity: showControls || !isPlaying ? 1 : 0,
                transition: 'opacity 0.25s ease',
                pointerEvents: showControls || !isPlaying ? 'auto' : 'none',
              }}
            >
              {/* Center Play/Pause button */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={togglePlay}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {isPlaying ? (
                    <Pause width={26} height={26} />
                  ) : (
                    <Play width={26} height={26} fill="currentColor" />
                  )}
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Timeline / Seekbar */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent)',
                    cursor: 'pointer',
                    height: '5px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={togglePlay}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {isPlaying ? (
                        <Pause width={18} height={18} />
                      ) : (
                        <Play width={18} height={18} fill="currentColor" />
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {isMuted ? <VolumeX width={18} height={18} /> : <Volume2 width={18} height={18} />}
                    </button>

                    <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      {formatLectureTime(currentTime)} / {formatLectureTime(duration)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative',
                    }}
                  >
                    {/* Speed Selector */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowSpeedMenu((p) => !p)}
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: 'var(--r-sm)',
                          padding: '3px 8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {playbackSpeed}x
                      </button>

                      {showSpeedMenu && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '6px',
                            background: '#161b26',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 'var(--r-md)',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            zIndex: 10,
                          }}
                        >
                          {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => handleSpeedSelect(spd)}
                              style={{
                                background: playbackSpeed === spd ? 'var(--accent)' : 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                padding: '5px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                      onClick={toggleFullscreen}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {isFullscreen ? <Minimize width={18} height={18} /> : <Maximize width={18} height={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export const GateEngineeringView: React.FC<GateEngineeringViewProps> = ({
  course,
  onSelectCourse,
  onPlayVideo,
  theme = 'light',
  watchedUrls = new Set(),
  step: stepProp,
  branch: branchProp,
  institute: instituteProp,
  subject: subjectProp,
  onStepChange,
  onMarkWatched,
}) => {
  // Navigation drill-down state:
  // Step 1: 'branches' (ECE)
  // Step 2: 'institutes' (Made Easy under ECE)
  // Step 3: 'subjects' (Signal and System under Made Easy)
  // Step 4: 'lectures' (All 36 lectures of Signal and System)
  const [currentStep, setCurrentStep] = useState<GateViewStep>(stepProp || 'branches');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(branchProp ?? 'ECE');
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(instituteProp ?? 'Made Easy');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(subjectProp ?? 'Signal and System');
  const [activeLectureIndex, setActiveLectureIndex] = useState<number>(0);

  const [lectureSearch, setLectureSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync with incoming step/branch/institute/subject prop
  useEffect(() => {
    if (stepProp && stepProp !== currentStep) {
      setCurrentStep(stepProp);
    }
  }, [stepProp, currentStep]);

  useEffect(() => {
    if (branchProp !== undefined) setSelectedBranch(branchProp);
  }, [branchProp]);

  useEffect(() => {
    if (instituteProp !== undefined) setSelectedInstitute(instituteProp);
  }, [instituteProp]);

  useEffect(() => {
    if (subjectProp !== undefined) setSelectedSubject(subjectProp);
  }, [subjectProp]);

  // Load and remember gate navigation step & view mode
  useEffect(() => {
    try {
      if (!stepProp) {
        const savedStep = sessionStorage.getItem('stutosed_gate_step') as GateViewStep | null;
        if (savedStep && ['branches', 'institutes', 'subjects', 'lectures'].includes(savedStep)) {
          setCurrentStep(savedStep);
        }
      }
      const savedMode = localStorage.getItem('stutosed_lecture_view_mode') as 'grid' | 'list' | null;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch {}
  }, [stepProp]);

  const setGateStep = (step: GateViewStep) => {
    setCurrentStep(step);
    try {
      sessionStorage.setItem('stutosed_gate_step', step);
    } catch {}
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('stutosed_lecture_view_mode', mode);
    } catch {}
  };

  // Extract all 36 lectures from the course tabs
  const allLectures: LectureItem[] = useMemo(() => {
    if (course?.tabs && course.tabs.length > 0 && course.tabs[0].items?.length > 0) {
      return course.tabs[0].items;
    }
    const gateCourse = INITIAL_COURSES.find((c) => c.id === 'gate-ece-made-easy-signal-system');
    return gateCourse?.tabs?.[0]?.items || [];
  }, [course]);

  // Filter lectures based on search query
  const filteredLectures = useMemo(() => {
    const q = lectureSearch.toLowerCase().trim();
    if (!q) return allLectures;
    return allLectures.filter(
      (lec) =>
        (lec.label || '').toLowerCase().includes(q) ||
        (lec.subject || '').toLowerCase().includes(q)
    );
  }, [allLectures, lectureSearch]);

  const handleOpenEce = () => {
    setSelectedBranch('ECE');
    setGateStep('institutes');
    onStepChange?.('institutes', 'ECE', null, null, '/ece');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMadeEasy = () => {
    setSelectedInstitute('Made Easy');
    setGateStep('subjects');
    onStepChange?.('subjects', 'ECE', 'Made Easy', null, '/ece/madeeasy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSignalSystem = () => {
    setSelectedSubject('Signal and System');
    setActiveLectureIndex(0);
    setGateStep('lectures');
    onStepChange?.('lectures', 'ECE', 'Made Easy', 'Signal and System', '/ece/madeeasy/signal-system');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated 2-Column Watch Experience for Signal & System (matching screenshot & /watch format)
  if (currentStep === 'lectures') {
    return (
      <GateWatchWorkspace
        allLectures={allLectures}
        activeLectureIndex={activeLectureIndex}
        onSelectLecture={(idx) => setActiveLectureIndex(idx)}
        onBackToSubjects={() => {
          setGateStep('subjects');
          setSelectedSubject(null);
          onStepChange?.('subjects', 'ECE', 'Made Easy', null, '/ece/madeeasy');
        }}
        courseId={course?.id || 'gate-ece-made-easy-signal-system'}
        courseName={course?.name || 'Signal and System — Made Easy'}
        theme={theme}
        watchedUrls={watchedUrls}
        onMarkWatched={onMarkWatched}
      />
    );
  }

  return (
    <div className="gate-view-container animate-fade-in" style={{ padding: '8px 0 48px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* =========================================================
            HEADER & BREADCRUMBS
            ========================================================= */}
        <div style={{ marginBottom: '28px' }}>
          {/* Breadcrumb Navigation Trail */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            {currentStep === 'branches' && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>GATE Engineering Hub</span>
            )}

            {currentStep === 'institutes' && (
              <>
                <button
                  onClick={() => {
                    setGateStep('branches');
                    setSelectedBranch(null);
                    onStepChange?.('branches', null, null, null, '/gate');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft width={14} height={14} />
                  <span>All GATE Branches</span>
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>ECE</span>
              </>
            )}

            {currentStep === 'subjects' && (
              <>
                <button
                  onClick={() => {
                    setGateStep('branches');
                    setSelectedBranch(null);
                    onStepChange?.('branches', null, null, null, '/gate');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft width={14} height={14} />
                  <span>GATE</span>
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <button
                  onClick={() => {
                    setGateStep('institutes');
                    setSelectedInstitute(null);
                    onStepChange?.('institutes', 'ECE', null, null, '/ece');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ECE Branches
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>Made Easy</span>
              </>
            )}
          </div>

          {/* Section Title & Description */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--r-lg)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                }}
              >
                <Cpu width={24} height={24} />
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {currentStep === 'branches' && 'GATE Engineering Preparation'}
                  {currentStep === 'institutes' && 'ECE — Electronics & Communication'}
                  {currentStep === 'subjects' && 'Made Easy — GATE ECE'}
                </h1>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    margin: '3px 0 0',
                    lineHeight: 1.45,
                  }}
                >
                  {currentStep === 'branches' &&
                    'Syllabus-aligned preparation for Electronics, Electrical, Mechanical & Computer Science branches.'}
                  {currentStep === 'institutes' &&
                    'Select coaching provider to explore specialized modules for Electronics & Communication Engineering.'}
                  {currentStep === 'subjects' &&
                    'Curated subject playlists and full-length video courses from Made Easy faculty.'}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-pill)',
                padding: '6px 14px',
                boxShadow: 'var(--sh-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                <Layers width={14} height={14} style={{ color: '#f59e0b' }} />
                <span>1 Branch (ECE)</span>
              </div>
              <span style={{ color: 'var(--border)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Video width={13} height={13} style={{ color: '#10b981' }} />
                <span>36 Lectures</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            STEP 1: BRANCH SELECTION (ECE FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'branches' && (
          <div className="gate-branches-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Select Engineering Branch
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Explore comprehensive coaching modules curated by engineering disciplines.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* ECE FOLDER CARD */}
              <div
                onClick={handleOpenEce}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Accent Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Cpu width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                      }}
                    >
                      Active Track
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    ECE (Electronics & Communication)
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Signals & Systems, Network Theory, Electronic Devices, Analog & Digital Circuits, Communication Systems, and Control Systems.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Made Easy Faculty
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      36 Lectures
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: '#f59e0b' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#f59e0b',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open ECE Folder</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: INSTITUTE SELECTION (MADE EASY FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'institutes' && (
          <div className="gate-institutes-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                ECE Coaching Tracks
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Select coaching provider folder to view organized subject modules.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* MADE EASY FOLDER CARD */}
              <div
                onClick={handleOpenMadeEasy}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GraduationCap width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                      }}
                    >
                      Made Easy GATE
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    Made Easy
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Premier GATE preparation modules curated and delivered by renowned Made Easy faculty.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Signal & System (36 Lectures)
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: '#6366f1' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#6366f1',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open Made Easy Folder</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: SUBJECT SELECTION (SIGNAL AND SYSTEM FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'subjects' && (
          <div className="gate-subjects-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Made Easy Subjects
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Select a subject folder below to open the lecture playlist and video player.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* SIGNAL AND SYSTEM FOLDER CARD */}
              <div
                onClick={handleOpenSignalSystem}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover, #ff5722) 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(255, 107, 74, 0.12)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Folder width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(255, 107, 74, 0.12)',
                        color: 'var(--accent)',
                      }}
                    >
                      36 Lectures
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    Signal and System
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Complete Signals and Systems curriculum covering CT/DT Signals, Operations, Fourier Series, Laplace Transform, Z-Transform, Sampling, and Digital Filters.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Made Easy Faculty
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      HLS High-Speed Stream
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: 'var(--accent)' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open Lectures Playlist</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
