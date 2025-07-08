// src/components/guards/AuthGuard.tsx - ENTERPRISE GRADE
import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

// === ANIMATIONS ===
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// === STYLED COMPONENTS ===
const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%);
  padding: 24px;
`;

const AuthCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: ${fadeIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const AuthIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #007AFF 0%, #30D158 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 36px;
  color: white;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.24);
`;

const AuthTitle = styled.h2`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1D1D1F;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
`;

const AuthMessage = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17px;
  color: #6D6D70;
  margin: 0 0 32px 0;
  line-height: 1.5;
`;

const RedirectButton = styled.button`
  background: linear-gradient(135deg, #007AFF 0%, #0A84FF 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);
  
  &:hover {
    background: linear-gradient(135deg, #0056CC 0%, #007AFF 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 122, 255, 0.32);
  }
`;

// === COMPONENT ===
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { loading, isAuthenticated, isReady } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirectedRef = useRef(false);

  // ✅ Loading state enterprise
  if (loading || !isReady) {
    return (
      <AuthContainer>
        <LoadingSpinner
          size="large"
          variant="primary"
          message="Carregando Flux Revenue..."
          subMessage="Verificando autenticação"
          icon="⚡"
        />
      </AuthContainer>
    );
  }

  // ✅ Redirect logic with enterprise UI
  if (!isAuthenticated && !isRedirecting && !hasRedirectedRef.current) {
    console.log('❌ Usuário não autenticado - redirecionando...');
    hasRedirectedRef.current = true;
    setIsRedirecting(true);

    // Auto redirect after showing message
    setTimeout(() => {
      if (window.FluxConfig?.redirectToLogin) {
        window.FluxConfig.redirectToLogin();
      } else {
        window.location.href = 'https://fluxrevenue.com.br/login.html';
      }
    }, 2000);

    return (
      <AuthContainer>
        <AuthCard>
          <AuthIcon>🔐</AuthIcon>
          <AuthTitle>Acesso Restrito</AuthTitle>
          <AuthMessage>
            Você precisa estar logado para acessar o Flux Revenue Dashboard.
            Redirecionando para o login...
          </AuthMessage>
          <LoadingSpinner
            size="medium"
            variant="primary"
            transparent
          />
        </AuthCard>
      </AuthContainer>
    );
  }

  // ✅ Not authenticated but already tried redirect
  if (!isAuthenticated) {
    return (
      <AuthContainer>
        <AuthCard>
          <AuthIcon>⚠️</AuthIcon>
          <AuthTitle>Sessão Expirada</AuthTitle>
          <AuthMessage>
            Sua sessão expirou. Por favor, faça login novamente para continuar.
          </AuthMessage>
          <RedirectButton
            onClick={() => {
              window.location.href = 'https://fluxrevenue.com.br/login.html';
            }}
          >
            Fazer Login
          </RedirectButton>
        </AuthCard>
      </AuthContainer>
    );
  }

  console.log('✅ Usuário autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
};

export default AuthGuard;

