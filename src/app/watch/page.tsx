import React, { Suspense } from 'react';
import WatchClient from './WatchClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch Lecture — stutosed',
  description: 'Stream structured video lectures with full topic notes and syllabus queue.',
};

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="player-spinner" style={{ width: '28px', height: '28px' }} />
            <span>Loading watch experience…</span>
          </div>
        </div>
      }
    >
      <WatchClient />
    </Suspense>
  );
}
