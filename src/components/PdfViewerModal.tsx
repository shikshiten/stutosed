'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LectureItem, ServerOption } from '@/types';
import { ExternalLink, Download, X, ChevronLeft, ChevronRight, FileText, RefreshCw, Eye } from 'lucide-react';

interface PdfViewerModalProps {
  item: LectureItem;
  courseName: string;
  onClose: () => void;
  playlist?: LectureItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  item,
  courseName,
  onClose,
  playlist,
  currentIndex = 0,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewerMode, setViewerMode] = useState<'proxy' | 'google' | 'direct'>('proxy');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const servers: ServerOption[] = item.servers && item.servers.length > 0 ? item.servers : [];

  // View link: prefer ALBA download link or item url
  const albaServer = servers.find(
    (s) => s.name?.toUpperCase().includes('ALBA') || s.url?.includes('streamvaultpro.cc')
  );
  let viewUrl = albaServer?.downloadUrl || albaServer?.url || item.url || '';
  if (viewUrl.includes('/0:/stream/')) {
    viewUrl = viewUrl.replace('/0:/stream/', '/0:/dl/');
  }

  // Check if it's an image resource
  const isImageResource =
    item.label.toLowerCase().endsWith('.png') ||
    item.label.toLowerCase().endsWith('.jpg') ||
    item.label.toLowerCase().endsWith('.jpeg') ||
    viewUrl.toLowerCase().includes('.png') ||
    viewUrl.toLowerCase().includes('.jpg');

  const proxiedPdfUrl = `/api/pdf?url=${encodeURIComponent(viewUrl)}`;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true`;

  // Download redirects to Publico (ESTE) link or direct URL
  const esteServer = servers.find(
    (s) =>
      s.name?.toUpperCase().includes('ESTE') ||
      s.downloadUrl?.includes('publicbotshub') ||
      s.url?.includes('herokuapp.com')
  );
  const downloadRedirectUrl =
    esteServer?.downloadUrl || esteServer?.url || item.downloadUrl || viewUrl;

  // Auto-dismiss loading spinner after 1.5s max so it never covers the iframe
  useEffect(() => {
    setIsLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 1400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item, viewerMode]);

  const handleOpenFullscreen = () => {
    window.open(proxiedPdfUrl, '_blank');
  };

  const handleDownload = () => {
    window.open(downloadRedirectUrl, '_blank');
  };

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hasPrev = Boolean(playlist && currentIndex > 0 && onNavigate);
  const hasNext = Boolean(playlist && currentIndex < playlist.length - 1 && onNavigate);

  const getActiveViewerUrl = () => {
    if (viewerMode === 'google') return googleDocsViewerUrl;
    if (viewerMode === 'direct') return viewUrl;
    return proxiedPdfUrl;
  };

  return (
    <div
      id="pdf-modal"
      className="open"
      role="dialog"
      aria-modal="true"
      aria-label="PDF Viewer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      {/* Crisp dark backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Main Solid Modal Box (Fixed Dark Mode Faded Look) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1050px',
          height: '92vh',
          maxHeight: '920px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* TOP HEADER BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(204, 120, 92, 0.12)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText width={18} height={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  marginBottom: '2px',
                }}
              >
                {courseName} • Document Notes
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.label}
              </div>
            </div>
          </div>

          {/* Engine Selector & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isImageResource && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--bg)',
                  padding: '2px 4px',
                  borderRadius: '100px',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setViewerMode('proxy')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '100px',
                    background: viewerMode === 'proxy' ? 'var(--accent)' : 'transparent',
                    color: viewerMode === 'proxy' ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Native proxy reader"
                >
                  Proxy Reader
                </button>
                <button
                  onClick={() => setViewerMode('google')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '100px',
                    background: viewerMode === 'google' ? 'var(--accent)' : 'transparent',
                    color: viewerMode === 'google' ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Google Docs Viewer fallback"
                >
                  Google Viewer
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
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
                transition: 'transform 0.15s ease',
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PDF / IMAGE SCREEN */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#0d0d0f',
            overflow: 'hidden',
          }}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#ffffff',
                background: '#0d0d0f',
                zIndex: 3,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255,255,255,0.15)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                Loading document…
              </span>
            </div>
          )}

          {isImageResource ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
            >
              <img
                src={proxiedPdfUrl}
                alt={item.label}
                onLoad={() => setIsLoading(false)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          ) : (
            <iframe
              key={`${item.id}-${viewerMode}`}
              src={getActiveViewerUrl()}
              onLoad={() => setIsLoading(false)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#0d0d0f',
              }}
              title={item.label}
            />
          )}
        </div>

        {/* BOTTOM CONTROLS & ACTION BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasPrev && (
              <button
                onClick={() => onNavigate && onNavigate(currentIndex - 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 14px',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '34px',
                }}
              >
                <ChevronLeft size={15} /> Prev Note
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => onNavigate && onNavigate(currentIndex + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 14px',
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '34px',
                }}
              >
                Next Note <ChevronRight size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleOpenFullscreen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--r-pill)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '34px',
              }}
            >
              <ExternalLink size={13} /> Open Tab
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: 'var(--r-pill)',
                border: 'none',
                background: 'var(--accent)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '34px',
                boxShadow: '0 2px 10px var(--accent-glow)',
              }}
            >
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
