// src/components/ErrorMessage.tsx
import React from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  variant?: 'inline' | 'card' | 'banner';
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Ops! Algo deu errado',
  onRetry,
  variant = 'card',
  type = 'error'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className={`error-message error-message-${variant} error-message-${type}`}>
      <div className="error-icon">
        {getIcon()}
      </div>
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-text">{message}</p>
        {onRetry && (
          <button 
            className="error-retry-button"
            onClick={onRetry}
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;