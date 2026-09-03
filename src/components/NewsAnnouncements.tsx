'use client';

import React, { useState, useMemo } from 'react';
import { ANNOUNCEMENTS_DATA, AnnouncementItem } from '@/lib/announcementsData';
import {
  Megaphone,
  Sparkles,
  BookOpen,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
} from 'lucide-react';

interface NewsAnnouncementsProps {
  onBackHome?: () => void;
  onExploreCourses?: () => void;
}

export default function NewsAnnouncements({ onBackHome, onExploreCourses }: NewsAnnouncementsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'feature' | 'telegram'>('all');

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return ANNOUNCEMENTS_DATA;
    return ANNOUNCEMENTS_DATA.filter((item) => item.badgeType === activeFilter);
  }, [activeFilter]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Top Back Navigation */}
      {onBackHome && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onBackHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer',
              boxShadow: 'var(--sh-card)',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft width={15} height={15} style={{ color: 'var(--accent)' }} />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(204, 120, 92, 0.08) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          padding: '36px 32px',
          boxShadow: 'var(--sh-card)',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(204, 120, 92, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '700px', position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(204, 120, 92, 0.12)',
              border: '1px solid rgba(204, 120, 92, 0.3)',
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            <Megaphone width={14} height={14} />
            <span>Official Updates &amp; Future Roadmaps</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 38px)',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.8px',
              lineHeight: 1.2,
              margin: '0 0 12px',
            }}
          >
            News &amp; Announcements
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Stutosed portal par aane wale naye courses, upcoming batches, future learning tools, aur student demands ke updates yahan dekhein.
          </p>
        </div>
      </div>

      {/* Prominent Telegram Student Course Request Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(34, 158, 217, 0.1) 0%, rgba(204, 120, 92, 0.1) 100%)',
          border: '1px solid rgba(34, 158, 217, 0.35)',
          borderRadius: 'var(--r-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--sh-card)',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: '1 1 360px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--r-lg)',
              background: '#229ED9',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 8px 16px rgba(34, 158, 217, 0.35)',
            }}
          >
            <Send width={24} height={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-pill)', background: 'rgba(34, 158, 217, 0.2)', color: '#0088cc', textTransform: 'uppercase' }}>
                Open Student Desk
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Direct Admin Line</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 6px',
              }}
            >
              Koi Course ya Study Material Chahiye?
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Agar aapko koi specific course, test series, class notes ya chapter chahiye — seedhe Telegram par batayein! Aapke demand par batch add kar diya jayega.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="https://t.me/bookwormislie"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: 'var(--r-md)',
              background: '#229ED9',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 16px rgba(34, 158, 217, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare width={16} height={16} />
            <span>DM Admin (@bookwormislie)</span>
            <ExternalLink width={13} height={13} style={{ opacity: 0.8 }} />
          </a>

          <a
            href="https://t.me/stutosed"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Send width={15} height={15} style={{ color: '#229ED9' }} />
            <span>Join Official Channel</span>
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px',
        }}
      >
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-dim)', marginRight: '6px' }}>
          Filter:
        </span>

        <button
          onClick={() => setActiveFilter('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--r-pill)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeFilter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: activeFilter === 'all' ? 'var(--accent)' : 'var(--bg-card)',
            color: activeFilter === 'all' ? '#ffffff' : 'var(--text)',
            transition: 'all 0.2s ease',
          }}
        >
          <Layers width={13} height={13} />
          <span>All Updates ({ANNOUNCEMENTS_DATA.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('upcoming')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--r-pill)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeFilter === 'upcoming' ? '1px solid var(--green)' : '1px solid var(--border)',
            background: activeFilter === 'upcoming' ? 'var(--green)' : 'var(--bg-card)',
            color: activeFilter === 'upcoming' ? '#ffffff' : 'var(--text)',
            transition: 'all 0.2s ease',
          }}
        >
          <BookOpen width={13} height={13} />
          <span>Upcoming Batches</span>
        </button>

        <button
          onClick={() => setActiveFilter('feature')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--r-pill)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeFilter === 'feature' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: activeFilter === 'feature' ? 'var(--accent)' : 'var(--bg-card)',
            color: activeFilter === 'feature' ? '#ffffff' : 'var(--text)',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles width={13} height={13} />
          <span>New Features</span>
        </button>

        <button
          onClick={() => setActiveFilter('telegram')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--r-pill)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeFilter === 'telegram' ? '1px solid #229ED9' : '1px solid var(--border)',
            background: activeFilter === 'telegram' ? '#229ED9' : 'var(--bg-card)',
            color: activeFilter === 'telegram' ? '#ffffff' : 'var(--text)',
            transition: 'all 0.2s ease',
          }}
        >
          <MessageSquare width={13} height={13} />
          <span>Student Requests</span>
        </button>
      </div>

      {/* Announcements Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              background: item.highlight
                ? 'linear-gradient(145deg, var(--bg-card) 0%, rgba(204, 120, 92, 0.08) 100%)'
                : 'var(--bg-card)',
              border: item.highlight
                ? '1px solid rgba(204, 120, 92, 0.4)'
                : '1px solid var(--border)',
              borderRadius: 'var(--r-xl)',
              padding: '28px',
              boxShadow: item.highlight
                ? '0 12px 32px -10px rgba(204, 120, 92, 0.25), var(--sh-card)'
                : 'var(--sh-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
          >
            {item.highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(204, 120, 92, 0.22) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            )}

            <div>
              {/* Card Badge & Timestamp */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill)',
                    background:
                      item.badgeType === 'telegram'
                        ? 'rgba(34, 158, 217, 0.12)'
                        : item.badgeType === 'upcoming'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(204, 120, 92, 0.12)',
                    color:
                      item.badgeType === 'telegram'
                        ? '#0088cc'
                        : item.badgeType === 'upcoming'
                        ? 'var(--green)'
                        : 'var(--accent)',
                    border: `1px solid ${
                      item.badgeType === 'telegram'
                        ? 'rgba(34, 158, 217, 0.25)'
                        : item.badgeType === 'upcoming'
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(204, 120, 92, 0.25)'
                    }`,
                  }}
                >
                  {item.badgeType === 'telegram' && <Send width={11} height={11} />}
                  {item.badgeType === 'upcoming' && <BookOpen width={11} height={11} />}
                  {item.badgeType === 'feature' && <Sparkles width={11} height={11} />}
                  {item.badge}
                </span>

                {item.dateTag && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: 'var(--text-dim)',
                      fontWeight: 500,
                    }}
                  >
                    <Clock width={11} height={11} />
                    <span>{item.dateTag}</span>
                  </span>
                )}
              </div>

              {/* Card Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '19px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  marginBottom: '10px',
                }}
              >
                {item.title}
              </h3>

              {/* Card Description */}
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                }}
              >
                {item.description}
              </p>
            </div>

            {/* Action CTA */}
            {item.actionText && (
              <div>
                {item.actionUrl?.startsWith('http') ? (
                  <a
                    href={item.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: 'var(--r-md)',
                      background: item.highlight ? 'var(--accent)' : 'var(--bg-card-hover)',
                      color: item.highlight ? '#ffffff' : 'var(--text)',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      border: item.highlight ? 'none' : '1px solid var(--border)',
                      boxShadow: item.highlight ? '0 4px 14px rgba(204, 120, 92, 0.35)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{item.actionText}</span>
                    <ExternalLink width={13} height={13} />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      if (onExploreCourses) onExploreCourses();
                      else if (onBackHome) onBackHome();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight width={14} height={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
