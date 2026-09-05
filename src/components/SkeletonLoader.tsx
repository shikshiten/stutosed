'use client';

import React from 'react';

export const ShimmerVideoSkeleton: React.FC = () => {
  return (
    <div className="skeleton-video-wrap">
      <div className="skeleton-video-canvas">
        <div className="skeleton-shimmer" />
        <div className="skeleton-center-pulse">
          <div className="skeleton-play-icon" />
          <span className="skeleton-buffering-text">Loading high-speed stream…</span>
        </div>
      </div>
      <div className="skeleton-meta-bar">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-sub" />
        <div className="skeleton-actions-row">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
      </div>
    </div>
  );
};

export const ShimmerCourseGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="courses-grid skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="course-card skeleton-card">
          <div className="skeleton-card-thumb">
            <div className="skeleton-shimmer" />
          </div>
          <div className="skeleton-card-body">
            <div className="skeleton-line skeleton-pill-line" />
            <div className="skeleton-line skeleton-card-title" />
            <div className="skeleton-line skeleton-card-sub" />
            <div className="skeleton-card-footer">
              <div className="skeleton-line skeleton-small" />
              <div className="skeleton-line skeleton-small" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ShimmerLectureListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="skeleton-lecture-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-lecture-row">
          <div className="skeleton-row-badge" />
          <div className="skeleton-row-info">
            <div className="skeleton-line skeleton-row-title" />
            <div className="skeleton-line skeleton-row-sub" />
          </div>
          <div className="skeleton-row-pill" />
        </div>
      ))}
    </div>
  );
};
