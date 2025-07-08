// src/components/guards/ProtectedRoute.tsx - ENTERPRISE GRADE
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'free' | 'trial' | 'basic' | 'pro' | 'enterprise';
  requiredPermissions?: string[];
  fallbackComponent?: React.ComponentType;
  redirectPath?: string;
  showUpgradePrompt?: boolean;
}

// === ANIMATIONS ===
const slideInScale = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(24px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
`;

const upgradeShine = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

// === STYLED COMPONENTS ===
const RouteContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%);
  padding: 24px;
`;

const AccessCard = styled.div<{ variant: 'loading' | 'upgrade' | 'error' }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'upgrade': return 'rgba(255, 149, 0, 0.2)';
      case 'error': return 'rgba(255, 59, 48, 0.2)';
      default: return 'rgba(0, 122, 255, 0.2)';
    }
  }};
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: ${slideInScale} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  position: relative;
  overflow: hidden;
  
  ${props => props.variant === 'upgrade' && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 149, 0, 0.1), transparent);
      animation: ${upgradeShine} 3s infinite;
    }
  `}
`;

const AccessIcon = styled.div<{ variant: 'loading' | 'upgrade' | 'error' | 'auth' }>`
  width: 88px;
  height: 88px;
  background: ${props => {
    switch (props.variant) {
      case 'upgrade': return 'linear-gradient(135deg, #FF9500 0%, #FF9F0A 100%)';
      case 'error': return 'linear-gradient(135deg, #FF3B30 0%, #FF453A 100%)';
      case 'auth': return 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)';
      default: return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)';
    }
  }};
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: white;
  font-weight: 700;
  box-shadow: 0 8px 24px ${props => {
    switch (props.variant) {
      case 'upgrade': return 'rgba(255, 149, 0, 0.24)';
      case 'error': return 'rgba(255, 59, 48, 0.24)';
      case 'auth': return 'rgba(142, 142, 147, 0.24)';
      default: return 'rgba(0, 122, 255, 0.24)';
    }
  }};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    background: inherit;
    border-radius: 25px;
    z-index: -1;
    opacity: 0.3;
    filter: blur(8px);
  }
`;

const AccessTitle = styled.h2`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #1D1D1F;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const AccessMessage = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 18px;
  color: #6D6D70;
  margin: 0 0 32px 0;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 24px 0;
  text-align: left;
  max-width: 350px;
  margin-left: auto;
  margin-right: auto;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-size: 15px;
  color: #1D1D1F;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: '✨';
    font-size: 16px;
    flex-shrink: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 32px;
`;

const PrimaryButton = styled.button<{ variant?: 'upgrade' | 'login' }>`
  background: ${props => 
    props.variant === 'upgrade' ? 
    'linear-gradient(135deg, #FF9500 0%, #FF9F0A 100%)' :
    'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)'
  };
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  padding: 18px 32px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
  box-shadow: ${props => 
    props.variant === 'upgrade' ? 
    '0 4px 16px rgba(255, 149, 0, 0.24)' :
    '0 4px 16px rgba(0, 122, 255, 0.24)'
  };
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: ${props => 
      props.variant === 'upgrade' ? 
      'linear-gradient(135deg, #E6850F 0%, #FF9500 100%)' :
      'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)'
    };
    transform: translateY(-3px);
    box-shadow: ${props => 
      props.variant === 'upgrade' ? 
      '0 8px 32px rgba(255, 149, 0, 0.32)' :
      '0 8px 32px rgba(0, 122, 255, 0.32)'
    };
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #007AFF;
  border: 2px solid #E5E5EA;
  border-radius: 14px;
  padding: 16px 30px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
  
  &:hover {
    background: #F2F2F7;
    border-color: #007AFF;
    color: #0056CC;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const PlanBadge = styled.div<{ plan: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${props => {
    switch (props.plan) {
      case 'enterprise': return 'linear-gradient(135deg, rgba(175, 82, 222, 0.1) 0%, rgba(191, 90, 242, 0.1) 100%)';
      case 'pro': return 'linear-gradient(135deg, rgba(48, 209, 88, 0.1) 0%, rgba(52, 199, 89, 0.1) 100%)';
      case 'basic': return 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 159, 10, 0.1) 100%)';
      default: return 'linear-gradient(135deg, rgba(142, 142, 147, 0.1) 0%, rgba(174, 174, 178, 0.1) 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.plan) {
      case 'enterprise': return 'rgba(175, 82, 222, 0.2)';
      case 'pro': return 'rgba(48, 209, 88, 0.2)';
      case 'basic': return 'rgba(255, 149, 0, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
  border-radius: 24px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: ${props => {
    switch (props.plan) {
      case 'enterprise': return '#AF52DE';
      case 'pro': return '#30D158';
      case 'basic': return '#FF9500';
      default: return '#8E8E93';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
`;

// === COMPONENT ===
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  fallbackComponent: FallbackComponent,
  redirectPath,
  showUpgradePrompt = true
}) => {
  const { isAuthenticated, loading, isReady, user, userPlan } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasRedirectedRef = useRef(false);

  // ✅ Plan hierarchy for role checking
  const planHierarchy = ['free', 'trial', 'basic', 'pro', 'enterprise'];
  
  const hasRequiredRole = (userPlan: string, requiredRole: string): boolean => {
    const userLevel = planHierarchy.indexOf(userPlan);
    const requiredLevel = planHierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  };

  // ✅ Check permissions
  const hasRequiredPermissions = (permissions: string[]): boolean => {
    // TODO: Implement permission checking logic
    // For now, return true
    return true;
  };

  // ✅ Enterprise loading state
  if (loading || !isReady) {
    return (
      <RouteContainer>
        <LoadingSpinner
          size="large"
          variant="primary"
          message="Verificando Acesso..."
          subMessage="Validando permissões"
          icon="🔐"
        />
      </RouteContainer>
    );
  }

  // ✅ Authentication check
  if (!isAuthenticated && !isRedirecting && !hasRedirectedRef.current) {
    console.log('❌ Usuário não autenticado - redirecionando para login...');
    hasRedirectedRef.current = true;
    setIsRedirecting(true);

    // Show redirect message briefly
    setTimeout(() => {
      const targetUrl = redirectPath || 'https://fluxrevenue.com.br/login.html';
      window.location.href = targetUrl;
    }, 2000);

    return (
      <RouteContainer>
        <AccessCard variant="loading">
          <AccessIcon variant="auth">🔐</AccessIcon>
          <AccessTitle>Acesso Restrito</AccessTitle>
          <AccessMessage>
            Você precisa estar logado para acessar esta área.
            Redirecionando para o login...
          </AccessMessage>
          <LoadingSpinner
            size="medium"
            variant="primary"
            transparent
          />
        </AccessCard>
      </RouteContainer>
    );
  }

  // ✅ Role/Plan requirement check
  if (requiredRole && userPlan && !hasRequiredRole(userPlan, requiredRole)) {
    const planFeatures = {
      basic: ['Mais sites', 'Análises ilimitadas', 'Relatórios avançados'],
      pro: ['IA avançada', 'Otimização automática', 'A/B Testing', 'Suporte prioritário'],
      enterprise: ['White-label', 'API personalizada', 'Suporte dedicado', 'SLA 99.9%']
    };

    if (showUpgradePrompt) {
      return (
        <RouteContainer>
          <AccessCard variant="upgrade">
            <AccessIcon variant="upgrade">💎</AccessIcon>
            <PlanBadge plan={requiredRole}>
              Plano {requiredRole.toUpperCase()} Necessário
            </PlanBadge>
            <AccessTitle>Upgrade Necessário</AccessTitle>
            <AccessMessage>
              Esta funcionalidade está disponível apenas para o plano {requiredRole.toUpperCase()}.
              Faça upgrade agora e desbloqueie todo o potencial do Flux Revenue.
            </AccessMessage>
            
            <FeaturesList>
              {planFeatures[requiredRole as keyof typeof planFeatures]?.map((feature, index) => (
                <FeatureItem key={index}>{feature}</FeatureItem>
              ))}
            </FeaturesList>

            <ActionButtons>
              <SecondaryButton onClick={() => window.history.back()}>
                ← Voltar
              </SecondaryButton>
              <PrimaryButton 
                variant="upgrade"
                onClick={() => {
                  window.location.href = `/configuracoes?tab=planos&highlight=${requiredRole}`;
                }}
              >
                💎 Fazer Upgrade
              </PrimaryButton>
            </ActionButtons>
          </AccessCard>
        </RouteContainer>
      );
    }

    // If no upgrade prompt, use fallback or redirect
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    window.history.back();
    return null;
  }

  // ✅ Permission check
  if (requiredPermissions && !hasRequiredPermissions(requiredPermissions)) {
    return (
      <RouteContainer>
        <AccessCard variant="error">
          <AccessIcon variant="error">⛔</AccessIcon>
          <AccessTitle>Permissão Negada</AccessTitle>
          <AccessMessage>
            Você não tem permissão para acessar esta funcionalidade.
            Entre em contato com o administrador se necessário.
          </AccessMessage>
          
          <ActionButtons>
            <SecondaryButton onClick={() => window.history.back()}>
              ← Voltar
            </SecondaryButton>
            <PrimaryButton onClick={() => {
              window.open('mailto:support@fluxrevenue.com.br?subject=Solicitação de Acesso', '_blank');
            }}>
              📧 Contatar Suporte
            </PrimaryButton>
          </ActionButtons>
        </AccessCard>
      </RouteContainer>
    );
  }

  // ✅ Session expired check
  if (!isAuthenticated) {
    return (
      <RouteContainer>
        <AccessCard variant="error">
          <AccessIcon variant="auth">⏰</AccessIcon>
          <AccessTitle>Sessão Expirada</AccessTitle>
          <AccessMessage>
            Sua sessão expirou por segurança. Por favor, faça login novamente
            para continuar usando o Flux Revenue.
          </AccessMessage>
          
          <ActionButtons>
            <PrimaryButton 
              variant="login"
              onClick={() => {
                window.location.href = 'https://fluxrevenue.com.br/login.html';
              }}
            >
              🔐 Fazer Login
            </PrimaryButton>
          </ActionButtons>
        </AccessCard>
      </RouteContainer>
    );
  }

  // ✅ All checks passed, render protected content
  console.log('✅ Acesso autorizado - renderizando conteúdo protegido');
  return <>{children}</>;
};

export default ProtectedRoute;
