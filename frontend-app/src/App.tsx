// src/App.tsx - ENTERPRISE GRADE APPLICATION CORRIGIDO

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from './components/ui/toast';
import Navbar from './components/Navbar';
import './index.css';

// ✅ Lazy loading para performance otimizada
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Analyzer = React.lazy(() => import('./components/Analyzer'));
const Optimizer = React.lazy(() => import('./components/Optimizer'));
const Relatorios = React.lazy(() => import('./components/Relatorios'));
const Configuracoes = React.lazy(() => import('./components/Configuracoes'));

// === STYLED COMPONENTS ENTERPRISE ===
const AppContainer = styled.div`
  min-height: 100vh;
  background: #F2F2F7;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
`;

const MainContent = styled.main`
  min-height: calc(100vh - 72px);
  position: relative;
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2F2F7;
  padding: 24px;
`;

const ErrorCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`;

const ErrorIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FF3B30 0%, #FF453A 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 36px;
  color: white;
`;

const ErrorTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1D1D1F;
  margin: 0 0 12px 0;
`;

const ErrorMessage = styled.p`
  font-size: 17px;
  color: #6D6D70;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ErrorButton = styled.button`
  background: linear-gradient(135deg, #007AFF 0%, #0A84FF 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);

  &:hover {
    background: linear-gradient(135deg, #0056CC 0%, #007AFF 100%);
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2F2F7;
`;

// === ERROR BOUNDARY COMPONENT CORRIGIDO ===
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  useEffect(() => {
    // Log error to monitoring service
    console.error('❌ Application Error:', error);
    
    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }, [error]);

  return (
    <ErrorContainer>
      <ErrorCard>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>Algo deu errado</ErrorTitle>
        <ErrorMessage>
          Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando na correção.
        </ErrorMessage>
        <ErrorButton onClick={resetErrorBoundary}>
          Tentar Novamente
        </ErrorButton>
      </ErrorCard>
    </ErrorContainer>
  );
};

// === LOADING FALLBACK CORRIGIDO ===
const LoadingFallback: React.FC = () => (
  <LoadingContainer>
    <LoadingSpinner />
  </LoadingContainer>
);

// === AUTH GUARD COMPONENT ===
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, isReady } = useAuth();

  // Show loading while auth is initializing
  if (!isReady || loading) {
    return <LoadingFallback />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// === PROTECTED ROUTE WRAPPER ===
const ProtectedRoutes: React.FC = () => {
  return (
    <AuthGuard>
      <AppContainer>
        <Navbar />
        <MainContent>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/optimizer" element={<Optimizer />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </MainContent>
      </AppContainer>
    </AuthGuard>
  );
};

// === MAIN APP COMPONENT CORRIGIDO ===
const App: React.FC = () => {
  // ✅ Global error handling
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(event.reason);
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('❌ Global error:', event.error);
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(event.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('❌ Error Boundary caught:', error, errorInfo);
      }}
      onReset={() => {
        // Reset application state if needed
        window.location.reload();
      }}
    >
      <ConfigProvider>
        <AuthProvider>
          <Router>
            <ProtectedRoutes />
            <Toaster />
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
