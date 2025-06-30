// src/components/SkeletonLoader.tsx
import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'wave',
  className = ''
}) => {
  const getSkeletonStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (variant === 'card') {
    return (
      <div className={`skeleton-card ${animation} ${className}`}>
        <div className="skeleton-card-header">
          <div className="skeleton skeleton-circular" style={{width: 40, height: 40}}></div>
          <div className="skeleton-card-info">
            <div className="skeleton skeleton-text" style={{width: '60%', height: 16}}></div>
            <div className="skeleton skeleton-text" style={{width: '40%', height: 14}}></div>
          </div>
        </div>
        <div className="skeleton skeleton-rectangular" style={{height: 200, marginTop: 12}}></div>
        <div className="skeleton-card-actions">
          <div className="skeleton skeleton-text" style={{width: '30%', height: 32}}></div>
          <div className="skeleton skeleton-text" style={{width: '30%', height: 32}}></div>
        </div>
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton skeleton-${variant} ${animation}`}
            style={{
              ...getSkeletonStyle(),
              width: index === lines - 1 ? '60%' : '100%',
              marginBottom: index < lines - 1 ? '8px' : '0'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton skeleton-${variant} ${animation} ${className}`}
      style={getSkeletonStyle()}
    />
  );
};

export default SkeletonLoader;