// src/App.tsx - ENTERPRISE GRADE APPLICATION REFAVORADO

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from './components/ui/toast';
import Navbar from './components/Navbar';
import './index.css';

// Guards Externos
import AuthGuard from './components/guards/AuthGuard';
import ProtectedRoute from './components/guards/ProtectedRoute';

// Lazy loading para performance otimizada
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Analyzer = React.lazy(() => import('./components/Analyzer'));
const Optimizer = React.lazy(() => import('./components/Optimizer'));
const Relatorios = React.lazy(() => import('./components/Relatorios'));
const Configuracoes = React.lazy(() => import('./components/Configuracoes'));

// Página de Login Externa (simulada, já que não é uma rota React)
// Se houvesse uma página de login interna ao React App, seria algo como:
// const LoginPage = React.lazy(() => import('./pages/LoginPage')); // Exemplo

// === STYLED COMPONENTS (Presumindo que são os mesmos) ===
const AppContainer = styled.div`min-height: 100vh; background: #F2F2F7; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;`;
const MainContent = styled.main`min-height: calc(100vh - 72px); /* Ajustar se a altura da Navbar mudar */ position: relative;`;
const ErrorContainer = styled.div`min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F2F2F7; padding: 24px;`;
const ErrorCard = styled.div`background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 59, 48, 0.2); border-radius: 24px; padding: 48px; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);`;
const ErrorIcon = styled.div`width: 80px; height: 80px; background: linear-gradient(135deg, #FF3B30 0%, #FF453A 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px; color: white;`;
const ErrorTitle = styled.h2`font-size: 28px; font-weight: 700; color: #1D1D1F; margin: 0 0 12px 0;`;
const ErrorMessage = styled.p`font-size: 17px; color: #6D6D70; margin: 0 0 24px 0; line-height: 1.5;`;
const ErrorButton = styled.button`background: linear-gradient(135deg, #007AFF 0%, #0A84FF 100%); color: white; border: none; border-radius: 12px; padding: 16px 32px; font-size: 17px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24); &:hover { background: linear-gradient(135deg, #0056CC 0%, #007AFF 100%); transform: translateY(-2px); }`;
const LoadingContainer = styled.div`min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F2F2F7;`;
AppContainer.defaultProps = { children: React.createElement(React.Fragment) }; MainContent.defaultProps = { children: React.createElement(React.Fragment) }; ErrorContainer.defaultProps = { children: React.createElement(React.Fragment) }; ErrorCard.defaultProps = { children: React.createElement(React.Fragment) }; ErrorIcon.defaultProps = { children: React.createElement(React.Fragment) }; ErrorTitle.defaultProps = { children: React.createElement(React.Fragment) }; ErrorMessage.defaultProps = { children: React.createElement(React.Fragment) }; ErrorButton.defaultProps = { children: React.createElement(React.Fragment) }; LoadingContainer.defaultProps = { children: React.createElement(React.Fragment) };


// === ERROR BOUNDARY COMPONENT ===
interface ErrorFallbackProps { error: Error; resetErrorBoundary: () => void; }
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => { useEffect(() => { console.error('❌ Application Error Boundary caught:', error); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(error); } }, [error]); return ( <ErrorContainer> <ErrorCard> <ErrorIcon>⚠️</ErrorIcon> <ErrorTitle>Algo Inesperado Aconteceu</ErrorTitle> <ErrorMessage>Nossa equipe foi notificada. Por favor, tente recarregar a página ou volte mais tarde.</ErrorMessage> <ErrorButton onClick={resetErrorBoundary}>Recarregar Página</ErrorButton> </ErrorCard> </ErrorContainer> ); };

// === LOADING FALLBACK PARA SUSPENSE ===
const PageLoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 72px)' }}>
    <LoadingSpinner size="large" message="Carregando módulo..." />
  </div>
);

// === LAYOUT PARA ROTAS PROTEGIDAS ===
// Este componente define o layout comum (Navbar + Conteúdo) para páginas autenticadas.
const ProtectedPagesLayout: React.FC = () => {
  const location = useLocation(); // Para passar a key para o MainContent se necessário
  return (
    <AppContainer>
      <Navbar />
      <MainContent key={location.pathname}> {/* key para forçar remount em mudança de rota, se necessário para animações/reset de estado */}
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route
              path="/optimizer"
              element={
                <ProtectedRoute requiredRole="pro" showUpgradePrompt={true}>
                  <Optimizer />
                </ProtectedRoute>
              }
            />
             <Route
              path="/relatorios"
              element={
                // Exemplo: Relatórios podem ser para plano 'basic' ou superior
                <ProtectedRoute requiredRole="basic" showUpgradePrompt={true}>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* Adicionar aqui uma rota para página não encontrada dentro do layout protegido */}
            <Route path="*" element={
              <div style={{padding: "50px", textAlign: "center"}}>
                <h2>Página não encontrada (404)</h2>
                <p>A página que você está procurando não existe dentro da área logada.</p>
                <button onClick={() => window.history.back()}>Voltar</button>
              </div>
            } />
          </Routes>
        </Suspense>
      </MainContent>
    </AppContainer>
  );
};

// === MAIN APP COMPONENT ===
const App: React.FC = () => {
  useEffect(() => { /* ... (Global error handling para JS errors e promise rejections) ... */ const handleUnhandledRejection = (event: PromiseRejectionEvent) => { console.error('❌ Unhandled promise rejection:', event.reason); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(event.reason); } }; const handleError = (event: ErrorEvent) => { console.error('❌ Global error:', event.error); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(event.error); } }; window.addEventListener('unhandledrejection', handleUnhandledRejection); window.addEventListener('error', handleError); return () => { window.removeEventListener('unhandledrejection', handleUnhandledRejection); window.removeEventListener('error', handleError); }; }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => { window.location.assign(window.location.origin + '/dashboard'); /* Tenta voltar para o dashboard */ }}
    >
      <ConfigProvider> {/* Configurações globais da aplicação */}
        <AuthProvider> {/* Gerenciamento de autenticação e dados do usuário */}
          <Router>
            <Routes>
              {/* Rotas Públicas (se houver, ex: /landing, /public-feature) */}
              {/* <Route path="/landing" element={<LandingPage />} /> */}

              {/* Rota de Login: Assumimos que o login é externo (login.html)
                  Se fosse uma rota interna, seria definida aqui, fora do AuthGuard:
              <Route path="/login" element={<LoginPageComponent />} />
              */}

              {/* Todas as rotas principais da aplicação são protegidas */}
              <Route
                path="/*" // Captura /dashboard, /analyzer, etc.
                element={
                  <AuthGuard> {/* AuthGuard externo de components/guards */}
                    <ProtectedPagesLayout /> {/* Layout com Navbar e conteúdo das rotas protegidas */}
                  </AuthGuard>
                }
              />
            </Routes>
            <Toaster /> {/* Para notificações toast globais */}
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
