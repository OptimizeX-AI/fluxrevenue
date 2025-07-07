// src/App.tsx - ENTERPRISE GRADE APPLICATION REFAVORADO

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { AuthProvider } from './contexts/AuthContext'; // AuthProvider ainda é necessário
import { ConfigProvider } from './contexts/ConfigContext';
// import { useAuth } from './contexts/AuthContext'; // useAuth não é mais usado diretamente em App.tsx para o AuthGuard local
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from './components/ui/toast'; // Assumindo que esta é a importação correta para o Toaster
import Navbar from './components/Navbar';
import './index.css';

// Guards Externos
import AuthGuard from './components/guards/AuthGuard'; // Importar o AuthGuard externo
import ProtectedRoute from './components/guards/ProtectedRoute'; // Importar o ProtectedRoute externo

// Lazy loading para performance otimizada
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Analyzer = React.lazy(() => import('./components/Analyzer'));
const Optimizer = React.lazy(() => import('./components/Optimizer'));
const Relatorios = React.lazy(() => import('./components/Relatorios'));
const Configuracoes = React.lazy(() => import('./components/Configuracoes'));

// === STYLED COMPONENTS (Omitidos para brevidade, mas devem estar aqui como no arquivo original) ===
const AppContainer = styled.div` /* ... */ `;
const MainContent = styled.main` /* ... */ `;
const ErrorContainer = styled.div` /* ... */ `;
const ErrorCard = styled.div` /* ... */ `;
const ErrorIcon = styled.div` /* ... */ `;
const ErrorTitle = styled.h2` /* ... */ `;
const ErrorMessage = styled.p` /* ... */ `;
const ErrorButton = styled.button` /* ... */ `;
const LoadingContainer = styled.div` /* ... */ `;
// Adicionando os que faltavam para completar o componente
AppContainer.defaultProps = { children: React.createElement(React.Fragment) };
MainContent.defaultProps = { children: React.createElement(React.Fragment) };
ErrorContainer.defaultProps = { children: React.createElement(React.Fragment) };
ErrorCard.defaultProps = { children: React.createElement(React.Fragment) };
ErrorIcon.defaultProps = { children: React.createElement(React.Fragment) };
ErrorTitle.defaultProps = { children: React.createElement(React.Fragment) };
ErrorMessage.defaultProps = { children: React.createElement(React.Fragment) };
ErrorButton.defaultProps = { children: React.createElement(React.Fragment) };
LoadingContainer.defaultProps = { children: React.createElement(React.Fragment) };



// === ERROR BOUNDARY COMPONENT (Mantido como estava) ===
interface ErrorFallbackProps { error: Error; resetErrorBoundary: () => void; }
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => { /* ... (sem mudanças) ... */ useEffect(() => { console.error('❌ Application Error:', error); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(error); } }, [error]); return ( <ErrorContainer> <ErrorCard> <ErrorIcon>⚠️</ErrorIcon> <ErrorTitle>Algo deu errado</ErrorTitle> <ErrorMessage> Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando na correção. </ErrorMessage> <ErrorButton onClick={resetErrorBoundary}> Tentar Novamente </ErrorButton> </ErrorCard> </ErrorContainer> ); };

// === LOADING FALLBACK (Mantido como estava) ===
const LoadingFallback: React.FC = () => ( <LoadingContainer> <LoadingSpinner size="large" message="Carregando página..." /> </LoadingContainer> );

// REMOVIDO: AuthGuard local, pois usaremos o externo.

// === LAYOUT PARA ROTAS PROTEGIDAS ===
const ProtectedLayout: React.FC = () => {
  return (
    <AppContainer>
      <Navbar />
      <MainContent>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route
              path="/optimizer"
              element={
                // Exemplo de uso do ProtectedRoute para uma funcionalidade PRO
                <ProtectedRoute requiredRole="pro" showUpgradePrompt={true}>
                  <Optimizer />
                </ProtectedRoute>
              }
            />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* Adicionar aqui uma rota para /login se o AuthGuard externo redirecionar para cá,
                ou garantir que o AuthGuard redirecione para a página de login externa correta.
                Por agora, o AuthGuard externo lida com o redirecionamento para a URL de login externa.
            */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback para rotas não encontradas */}
          </Routes>
        </Suspense>
      </MainContent>
    </AppContainer>
  );
};

// === MAIN APP COMPONENT ===
const App: React.FC = () => {
  useEffect(() => { /* ... (Global error handling, sem mudanças) ... */ const handleUnhandledRejection = (event: PromiseRejectionEvent) => { console.error('❌ Unhandled promise rejection:', event.reason); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(event.reason); } }; const handleError = (event: ErrorEvent) => { console.error('❌ Global error:', event.error); if (typeof window !== 'undefined' && (window as any).Sentry) { (window as any).Sentry.captureException(event.error); } }; window.addEventListener('unhandledrejection', handleUnhandledRejection); window.addEventListener('error', handleError); return () => { window.removeEventListener('unhandledrejection', handleUnhandledRejection); window.removeEventListener('error', handleError); }; }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => { console.error('❌ Error Boundary caught:', error, errorInfo); }}
      onReset={() => { window.location.reload(); }}
    >
      <ConfigProvider>
        <AuthProvider> {/* AuthProvider envolve tudo que precisa de autenticação */}
          <Router>
            <Routes>
              {/* Rota de Login - Esta rota NÃO deve ser protegida pelo AuthGuard.
                  Assumindo que a página de login é externa (login.html) e o AuthGuard
                  redireciona para lá. Se houvesse uma rota /login interna ao React app:
              <Route path="/login" element={<LoginPage />} />
              */}

              {/* Rotas Protegidas */}
              <Route
                path="/*" // Todas as outras rotas (ex: /dashboard, /analyzer, etc.)
                element={
                  <AuthGuard> {/* AuthGuard externo protegendo o ProtectedLayout */}
                    <ProtectedLayout />
                  </AuthGuard>
                }
              />
            </Routes>
            <Toaster /> {/* Para notificações globais */}
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
