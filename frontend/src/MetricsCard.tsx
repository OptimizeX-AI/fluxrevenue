// src/components/MetricsCard.tsx - ENTERPRISE GRADE METRICS CARD
import React, { memo, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';

// === INTERFACES ===
interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  trendValue?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'auto';
  isRealTime?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'large' | 'hero';
  precision?: number;
  currency?: string;
  formatAs?: 'number' | 'currency' | 'percentage';
  refreshInterval?: number;
  lastUpdated?: string;
  target?: number;
  benchmark?: number;
  animated?: boolean;
  priority?: 'high' | 'medium' | 'low';
  status?: 'success' | 'warning' | 'error' | 'info';
  confidence?: number; // ✅ ADICIONADO
}

// === ANIMATIONS ===
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const countUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// === STYLED COMPONENTS ===
const Card = styled.div<{ 
  variant: string; 
  color: string; 
  hasClick: boolean;
  isLoading: boolean;
  animated: boolean;
  priority?: string;
  status?: string;
}>`
  background: #FFFFFF;
  border: 1px solid ${props => {
    switch (props.status) {
      case 'success': return 'rgba(48, 209, 88, 0.2)';
      case 'warning': return 'rgba(255, 149, 0, 0.2)';
      case 'error': return 'rgba(255, 59, 48, 0.2)';
      default: return '#E5E5EA';
    }
  }};
  border-radius: ${props => {
    switch (props.variant) {
      case 'hero': return '24px';
      case 'large': return '20px';
      case 'compact': return '12px';
      default: return '16px';
    }
  }};
  padding: ${props => {
    switch (props.variant) {
      case 'hero': return '40px';
      case 'large': return '32px';
      case 'compact': return '20px';
      default: return '24px';
    }
  }};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${props => props.hasClick ? 'pointer' : 'default'};
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.6s ease forwards;
  
  ${props => props.animated && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
  
  ${props => props.isLoading && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
      animation: ${shimmer} 2s infinite;
    }
  `}
  
  &:hover {
    ${props => props.hasClick && css`
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border-color: ${() => {
        switch (props.color) {
          case 'blue': return '#007AFF';
          case 'green': return '#30D158';
          case 'red': return '#FF3B30';
          case 'orange': return '#FF9500';
          case 'purple': return '#AF52DE';
          default: return '#007AFF';
        }
      }};
    `}
  }
`;

const Header = styled.div<{ variant: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => {
    switch (props.variant) {
      case 'hero': return '24px';
      case 'large': return '20px';
      case 'compact': return '12px';
      default: return '16px';
    }
  }};
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const Icon = styled.div<{ variant: string; color: string }>`
  font-size: ${props => {
    switch (props.variant) {
      case 'hero': return '32px';
      case 'large': return '24px';
      case 'compact': return '16px';
      default: return '20px';
    }
  }};
  line-height: 1;
  flex-shrink: 0;
`;

const Title = styled.h3<{ variant: string }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: ${props => {
    switch (props.variant) {
      case 'hero': return '20px';
      case 'large': return '17px';
      case 'compact': return '14px';
      default: return '15px';
    }
  }};
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  line-height: 1.3;
  truncate: true;
`;

const RealTimeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(48, 209, 88, 0.1);
  border: 1px solid rgba(48, 209, 88, 0.2);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #30D158;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &::before {
    content: '●';
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const ValueSection = styled.div<{ variant: string }>`
  margin-bottom: ${props => {
    switch (props.variant) {
      case 'hero': return '20px';
      case 'large': return '16px';
      case 'compact': return '8px';
      default: return '12px';
    }
  }};
`;

const Value = styled.div<{ variant: string; color: string; animated: boolean }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: ${props => {
    switch (props.variant) {
      case 'hero': return '48px';
      case 'large': return '36px';
      case 'compact': return '20px';
      default: return '28px';
    }
  }};
  font-weight: 700;
  color: ${props => {
    switch (props.color) {
      case 'blue': return '#007AFF';
      case 'green': return '#30D158';
      case 'red': return '#FF3B30';
      case 'orange': return '#FF9500';
      case 'purple': return '#AF52DE';
      default: return '#1D1D1F';
    }
  }};
  line-height: 1.1;
  margin-bottom: 8px;
  font-feature-settings: "tnum";
  
  ${props => props.animated && css`
    animation: ${countUp} 0.8s ease forwards;
  `}
`;

const Subtitle = styled.p<{ variant: string }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => {
    switch (props.variant) {
      case 'hero': return '16px';
      case 'large': return '14px';
      case 'compact': return '12px';
      default: return '13px';
    }
  }};
  color: #6D6D70;
  margin: 0;
  line-height: 1.4;
`;

const MetaInfo = styled.div<{ variant: string }>`
  display: flex;
  flex-direction: column;
  gap: ${props => {
    switch (props.variant) {
      case 'hero': return '16px';
      case 'large': return '12px';
      case 'compact': return '8px';
      default: return '10px';
    }
  }};
`;

const TrendContainer = styled.div<{ variant: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TrendIndicator = styled.div<{ trend: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => {
    switch (props.trend) {
      case 'up': return 'rgba(48, 209, 88, 0.1)';
      case 'down': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.trend) {
      case 'up': return 'rgba(48, 209, 88, 0.2)';
      case 'down': return 'rgba(255, 59, 48, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#30D158';
      case 'down': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
`;

const BenchmarkInfo = styled.div`
  font-size: 12px;
  color: #8E8E93;
  font-weight: 500;
`;

const LastUpdated = styled.div`
  font-size: 11px;
  color: #AEAEB2;
  font-weight: 500;
`;

// ✅ CONFIDENCE COMPONENTS
const ConfidenceIndicator = styled.div<{ confidence: number }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: ${props => {
    if (props.confidence >= 90) return 'rgba(48, 209, 88, 0.1)';
    if (props.confidence >= 70) return 'rgba(52, 199, 89, 0.1)';
    if (props.confidence >= 50) return 'rgba(255, 149, 0, 0.1)';
    return 'rgba(255, 59, 48, 0.1)';
  }};
  border: 1px solid ${props => {
    if (props.confidence >= 90) return 'rgba(48, 209, 88, 0.2)';
    if (props.confidence >= 70) return 'rgba(52, 199, 89, 0.2)';
    if (props.confidence >= 50) return 'rgba(255, 149, 0, 0.2)';
    return 'rgba(255, 59, 48, 0.2)';
  }};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => {
    if (props.confidence >= 90) return '#30D158';
    if (props.confidence >= 70) return '#34C759';
    if (props.confidence >= 50) return '#FF9500';
    return '#FF3B30';
  }};
`;

const ConfidenceBar = styled.div<{ confidence: number }>`
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const ConfidenceFill = styled.div<{ confidence: number }>`
  height: 100%;
  width: ${props => Math.min(100, Math.max(0, props.confidence))}%;
  background: ${props => {
    if (props.confidence >= 90) return 'linear-gradient(90deg, #30D158 0%, #34C759 100%)';
    if (props.confidence >= 70) return 'linear-gradient(90deg, #34C759 0%, #52D469 100%)';
    if (props.confidence >= 50) return 'linear-gradient(90deg, #FF9500 0%, #FF9F0A 100%)';
    return 'linear-gradient(90deg, #FF3B30 0%, #FF453A 100%)';
  }};
  border-radius: 2px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
`;

const ConfidenceText = styled.span`
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`;

// === COMPONENT ===
const MetricsCard: React.FC<MetricsCardProps> = memo(({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  icon,
  color = 'auto',
  isRealTime = false,
  isLoading = false,
  onClick,
  variant = 'default',
  precision = 2,
  currency = 'BRL',
  formatAs,
  refreshInterval,
  lastUpdated,
  target,
  benchmark,
  animated = false,
  priority,
  status,
  confidence
}) => {
  // ✅ Auto-detect color based on trend
  const resolvedColor = useMemo(() => {
    if (color !== 'auto') return color;
    
    switch (trend) {
      case 'up': return 'green';
      case 'down': return 'red';
      default: return 'blue';
    }
  }, [color, trend]);

  // ✅ Format value
  const formatValue = (val: string | number, format?: string, curr = 'BRL', prec = 2): string => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    if (isNaN(numValue)) return val.toString();
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: curr,
          minimumFractionDigits: prec,
          maximumFractionDigits: prec
        }).format(numValue);
      
      case 'percentage':
        return `${numValue.toFixed(prec)}%`;
      
      case 'number':
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: prec
        }).format(numValue);
      
      default:
        return val.toString();
    }
  };

  // ✅ Get trend icon
  const getTrendIcon = (trendType: string): string => {
    switch (trendType) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '';
    }
  };

  const formattedValue = useMemo(() => {
    return formatValue(value, formatAs, currency, precision);
  }, [value, formatAs, currency, precision]);

  return (
    <Card
      variant={variant}
      color={resolvedColor}
      hasClick={!!onClick}
      isLoading={isLoading}
      animated={animated}
      priority={priority}
      status={status}
      onClick={onClick}
    >
      {/* Header */}
      <Header variant={variant}>
        <TitleSection>
          {icon && (
            <Icon variant={variant} color={resolvedColor}>
              {icon}
            </Icon>
          )}
          <Title variant={variant}>{title}</Title>
        </TitleSection>
        
        {isRealTime && (
          <RealTimeIndicator>
            Live
          </RealTimeIndicator>
        )}
      </Header>

      {/* Value Section */}
      <ValueSection variant={variant}>
        <Value 
          variant={variant} 
          color={resolvedColor}
          animated={animated}
        >
          {formattedValue}
        </Value>
        
        {subtitle && (
          <Subtitle variant={variant}>
            {subtitle}
          </Subtitle>
        )}
      </ValueSection>

      {/* Meta Information */}
      <MetaInfo variant={variant}>
        {trend !== 'neutral' && trendValue && (
          <TrendContainer variant={variant}>
            <TrendIndicator trend={trend}>
              {getTrendIcon(trend)} {trendValue}
            </TrendIndicator>
          </TrendContainer>
        )}
        
        {confidence !== undefined && (
          <ConfidenceIndicator confidence={confidence}>
            <span>Confiança:</span>
            <ConfidenceBar confidence={confidence}>
              <ConfidenceFill confidence={confidence} />
            </ConfidenceBar>
            <ConfidenceText>{Math.round(confidence)}%</ConfidenceText>
          </ConfidenceIndicator>
        )}
        
        {benchmark && (
          <BenchmarkInfo>
            Meta: {formatValue(benchmark, formatAs, currency, precision)}
          </BenchmarkInfo>
        )}
        
        {lastUpdated && (
          <LastUpdated>
            Atualizado: {new Date(lastUpdated).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </LastUpdated>
        )}
      </MetaInfo>
    </Card>
  );
});

MetricsCard.displayName = 'MetricsCard';

export default MetricsCard;
