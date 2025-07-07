// src/components/ui/toast.tsx - ENTERPRISE GRADE
import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useToast, Toast } from '@/hooks/use-toast';

// === ANIMATIONS ===
const slideInRight = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(100%) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0) scale(1); 
  }
`;

const slideOutRight = keyframes`
  from { 
    opacity: 1; 
    transform: translateX(0) scale(1); 
  }
  to { 
    opacity: 0; 
    transform: translateX(100%) scale(0.95); 
  }
`;

const progressBar = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`;

// === STYLED COMPONENTS ===
const ToastContainer = styled.div<{ 
  variant: string; 
  isExiting: boolean;
}>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'destructive': return 'rgba(255, 59, 48, 0.2)';
      case 'success': return 'rgba(48, 209, 88, 0.2)';
      case 'warning': return 'rgba(255, 149, 0, 0.2)';
      default: return 'rgba(0, 122, 255, 0.2)';
    }
  }};
  border-radius: 16px;
  border-left: 4px solid ${props => {
    switch (props.variant) {
      case 'destructive': return '#FF3B30';
      case 'success': return '#30D158';
      case 'warning': return '#FF9500';
      default: return '#007AFF';
    }
  }};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 20px 24px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  min-width: 320px;
  max-width: 480px;
  animation: ${props => props.isExiting ? slideOutRight : slideInRight} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  
  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const ToastIcon = styled.div<{ variant: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  background: ${props => {
    switch (props.variant) {
      case 'destructive': return 'rgba(255, 59, 48, 0.1)';
      case 'success': return 'rgba(48, 209, 88, 0.1)';
      case 'warning': return 'rgba(255, 149, 0, 0.1)';
      default: return 'rgba(0, 122, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'destructive': return '#FF3B30';
      case 'success': return '#30D158';
      case 'warning': return '#FF9500';
      default: return '#007AFF';
    }
  }};
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.h4`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 6px 0;
  line-height: 1.3;
`;

const ToastDescription = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 14px;
  color: #6D6D70;
  margin: 0;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  color: #8E8E93;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #1D1D1F;
    transform: scale(1.1);
  }
`;

const ProgressIndicator = styled.div<{ 
  variant: string; 
  duration: number;
}>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: ${props => {
    switch (props.variant) {
      case 'destructive': return '#FF3B30';
      case 'success': return '#30D158';
      case 'warning': return '#FF9500';
      default: return '#007AFF';
    }
  }};
  animation: ${progressBar} ${props => props.duration}ms linear;
  border-radius: 0 0 16px 0;
`;

const ToasterContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  pointer-events: none;
  
  & > * {
    pointer-events: auto;
  }
  
  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    left: 16px;
    
    & > * {
      min-width: auto;
      max-width: none;
    }
  }
`;

// === COMPONENTS ===
interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const duration = toast.duration || 5000;

  const getIcon = () => {
    switch (toast.variant) {
      case 'destructive': return '❌';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  return (
    <ToastContainer variant={toast.variant || 'default'} isExiting={isExiting}>
      <ToastHeader>
        <ToastIcon variant={toast.variant || 'default'}>
          {getIcon()}
        </ToastIcon>
        <ToastContent>
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.description && (
            <ToastDescription>{toast.description}</ToastDescription>
          )}
        </ToastContent>
      </ToastHeader>
      
      <CloseButton onClick={handleClose}>
        ×
      </CloseButton>
      
      {duration > 0 && (
        <ProgressIndicator 
          variant={toast.variant || 'default'} 
          duration={duration}
        />
      )}
    </ToastContainer>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <ToasterContainer>
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={dismiss}
        />
      ))}
    </ToasterContainer>
  );
};

export default ToastComponent;

