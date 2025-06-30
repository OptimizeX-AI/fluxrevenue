// src/components/Dashboard/MetricsCard.tsx

import React from 'react';
import './MetricsCard.css';

interface MetricsCardProps {
  title: string;
  value: string | number;
  format?: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  subtitle?: string;
  loading?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  format = 'number',
  trend,
  icon,
  subtitle,
  loading = false
}) => {
  const formatValue = (value: string | number): string => {
    if (typeof value === 'string') return value;
    
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    
    return value.toLocaleString('pt-BR');
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    if (trend === 'stable') return '➡️';
    return '';
  };

  const getTrendClass = () => {
    if (trend === 'up') return 'trend-positive';
    if (trend === 'down') return 'trend-negative';
    if (trend === 'stable') return 'trend-neutral';
    return '';
  };

  if (loading) {
    return (
      <div className="metrics-card loading">
        <div className="metrics-card-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-value"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-card">
      <div className="metrics-card-header">
        {icon && <span className="metrics-icon">{icon}</span>}
        <h3 className="metrics-title">{title}</h3>
      </div>
      
      <div className="metrics-content">
        <div className="metrics-value">{formatValue(value)}</div>
        
        {subtitle && (
          <div className="metrics-subtitle">{subtitle}</div>
        )}
        
        {trend && (
          <div className={`metrics-trend ${getTrendClass()}`}>
            <span className="trend-icon">{getTrendIcon()}</span>
            <span className="trend-text">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;