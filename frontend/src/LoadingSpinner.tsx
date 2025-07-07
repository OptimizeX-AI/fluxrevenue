// src/components/LoadingSpinner.tsx - ENTERPRISE GRADE
import React from 'react';
import styled, { keyframes, css } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  variant?: 'primary' | 'secondary' | 'success' | 'white' | 'dark';
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
  icon?: string;
  transparent?: boolean;
}

// === ANIMATIONS ===
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.98); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const dots = keyframes`
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0; }
`;

// === STYLED COMPONENTS ===
const SpinnerContainer = styled.div<{ 
  transparent: boolean; 
  size: string;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => {
    switch (props.size) {
      case 'small': return '8px';
      case 'large': return '24px';
      case 'hero': return '32px';
      default: return '16px';
    }
  }};
  padding: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'large': return '40px';
      case 'hero': return '60px';
      default: return '24px';
    }
  }};
  background: ${props => props.transparent ? 'transparent' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: ${props => props.transparent ? 'none' : 'blur(20px)'};
  -webkit-backdrop-filter: ${props => props.transparent ? 'none' : 'blur(20px)'};
  border-radius: ${props => props.transparent ? '0' : '20px'};
  box-shadow: ${props => props.transparent ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.12)'};
  min-height: ${props => {
    switch (props.size) {
      case 'small': return '80px';
      case 'large': return '200px';
      case 'hero': return '300px';
      default: return '140px';
    }
  }};
  width: 100%;
  position: relative;
  overflow: hidden;
  
  ${props => !props.transparent && css`
    border: 1px solid rgba(0, 0, 0, 0.08);
  `}
`;

const SpinnerWheel = styled.div<{ 
  size: string; 
  variant: string;
}>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      case 'hero': return '80px';
      default: return '48px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      case 'hero': return '80px';
      default: return '48px';
    }
  }};
  border: ${props => {
    const thickness = props.size === 'small' ? '3px' : 
                     props.size === 'large' ? '6px' :
                     props.size === 'hero' ? '8px' : '4px';
    
    const color = props.variant === 'white' ? 'rgba(255, 255, 255, 0.3)' :
                  props.variant === 'dark' ? 'rgba(0, 0, 0, 0.1)' :
                  props.variant === 'success' ? 'rgba(48, 209, 88, 0.2)' :
                  'rgba(0, 122, 255, 0.2)';
    
    return `${thickness} solid ${color}`;
  }};
  border-top: ${props => {
    const thickness = props.size === 'small' ? '3px' : 
                     props.size === 'large' ? '6px' :
                     props.size === 'hero' ? '8px' : '4px';
    
    const color = props.variant === 'white' ? '#FFFFFF' :
                  props.variant === 'dark' ? '#1D1D1F' :
                  props.variant === 'success' ? '#30D158' :
                  '#007AFF';
    
    return `${thickness} solid ${color}`;
  }};
  border-radius: 50%;
  animation: ${spin} 1.2s linear infinite;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: ${props => {
      switch (props.variant) {
        case 'white': return '#FFFFFF';
        case 'dark': return '#1D1D1F';
        case 'success': return '#30D158';
        default: return '#007AFF';
      }
    }};
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.6);
  }
`;

const IconContainer = styled.div<{ size: string }>`
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      case 'hero': return '80px';
      default: return '48px';
    }
  }};
  animation: ${pulse} 2s ease-in-out infinite;
  margin-bottom: 8px;
`;

const MessageContainer = styled.div`
  text-align: center;
  max-width: 300px;
`;

const Message = styled.h3<{ size: string }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '20px';
      case 'hero': return '24px';
      default: return '17px';
    }
  }};
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 8px 0;
  line-height: 1.3;
`;

const SubMessage = styled.p<{ size: string }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '16px';
      case 'hero': return '18px';
      default: return '14px';
    }
  }};
  color: #6D6D70;
  margin: 0;
  line-height: 1.4;
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 240px;
  margin-top: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #007AFF 0%, #30D158 100%);
  border-radius: 2px;
  width: ${props => Math.min(100, Math.max(0, props.progress))}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: #8E8E93;
  text-align: center;
  font-weight: 500;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 12px;
`;

const Dot = styled.div<{ delay: number }>`
  width: 6px;
  height: 6px;
  background: #007AFF;
  border-radius: 50%;
  animation: ${dots} 1.4s infinite;
  animation-delay: ${props => props.delay}s;
`;

// === COMPONENT ===
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'primary',
  message,
  subMessage,
  showProgress = false,
  progress = 0,
  icon,
  transparent = false
}) => {
  return (
    <SpinnerContainer transparent={transparent} size={size}>
      {icon ? (
        <IconContainer size={size}>
          {icon}
        </IconContainer>
      ) : (
        <SpinnerWheel size={size} variant={variant} />
      )}
      
      {(message || subMessage) && (
        <MessageContainer>
          {message && (
            <Message size={size}>{message}</Message>
          )}
          {subMessage && (
            <SubMessage size={size}>{subMessage}</SubMessage>
          )}
        </MessageContainer>
      )}
      
      {showProgress && (
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <ProgressText>{Math.round(progress)}%</ProgressText>
        </ProgressContainer>
      )}
      
      <DotsContainer>
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </DotsContainer>
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
