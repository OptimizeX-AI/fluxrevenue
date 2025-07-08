// src/components/TrialBanner.tsx - ENTERPRISE GRADE REAL-TIME
import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useFluxData } from '../hooks/usefluxdata'; // ✅ Usar hook otimizado
import { supabase } from '../lib/supabaseClient';

// === INTERFACES OTIMIZADAS ===
interface ClientData {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'trial' | 'basic' | 'pro' | 'enterprise';
  trial_end?: string;
  created_at: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  // ✅ Campos adicionais baseados na estrutura real
  monthly_limit?: number;
  analyses_used?: number;
  next_billing_date?: string;
}

interface TrialBannerProps {
  onUpgrade?: () => void;
  variant?: 'default' | 'minimal' | 'urgent' | 'success';
  position?: 'top' | 'inline' | 'floating';
  autoHide?: boolean;
  showProgress?: boolean;
}

interface UsageData {
  analysesCount: number;
  analysesLimit: number;
  sitesCount: number;
  sitesLimit: number;
  percentage: number;
  daysInPeriod: number;
}

// === ANIMATION KEYFRAMES OTIMIZADOS ===
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-24px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const urgentPulse = keyframes`
  0%, 100% { 
    background: linear-gradient(135deg, rgba(255, 59, 48, 0.05) 0%, rgba(255, 149, 0, 0.05) 100%);
    border-color: rgba(255, 59, 48, 0.15);
  }
  50% { 
    background: linear-gradient(135deg, rgba(255, 59, 48, 0.08) 0%, rgba(255, 149, 0, 0.08) 100%);
    border-color: rgba(255, 59, 48, 0.25);
  }
`;

const successGlow = keyframes`
  0%, 100% { box-shadow: 0 2px 8px rgba(48, 209, 88, 0.1); }
  50% { box-shadow: 0 4px 20px rgba(48, 209, 88, 0.2); }
`;

const progressAnimation = keyframes`
  from { width: 0%; }
  to { width: var(--target-width); }
`;

// === STYLED COMPONENTS OTIMIZADOS ===
const BannerContainer = styled.div<{
  variant: string;
  position: string;
  isUrgent: boolean;
  isSuccess: boolean;
}>`
  background: ${props => {
    if (props.isSuccess) return 'linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(52, 199, 89, 0.05) 100%)';
    if (props.isUrgent) return 'linear-gradient(135deg, rgba(255, 59, 48, 0.05) 0%, rgba(255, 149, 0, 0.05) 100%)';
    return 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(48, 209, 88, 0.05) 100%)';
  }};
  border: 1px solid ${props => {
    if (props.isSuccess) return 'rgba(48, 209, 88, 0.15)';
    if (props.isUrgent) return 'rgba(255, 59, 48, 0.15)';
    return 'rgba(0, 122, 255, 0.15)';
  }};
  border-radius: ${props => props.variant === 'minimal' ? '8px' : '16px'};
  padding: ${props => props.variant === 'minimal' ? '16px 20px' : '24px 28px'};
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  animation: ${slideDown} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  
  ${props => props.isUrgent && css`
    animation: ${urgentPulse} 3s ease-in-out infinite;
  `}
  
  ${props => props.isSuccess && css`
    animation: ${successGlow} 2s ease-in-out infinite;
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      if (props.isSuccess) return 'linear-gradient(90deg, #30D158 0%, #34C759 100%)';
      if (props.isUrgent) return 'linear-gradient(90deg, #FF3B30 0%, #FF9500 100%)';
      return 'linear-gradient(90deg, #007AFF 0%, #30D158 100%)';
    }};
    border-radius: 16px 16px 0 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }
`;

const ContentSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0; /* Para text truncation */
`;

const IconContainer = styled.div<{ 
  isUrgent: boolean; 
  isSuccess: boolean;
  variant: string;
}>`
  width: ${props => props.variant === 'minimal' ? '36px' : '48px'};
  height: ${props => props.variant === 'minimal' ? '36px' : '48px'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.variant === 'minimal' ? '18px' : '24px'};
  background: ${props => {
    if (props.isSuccess) return 'rgba(48, 209, 88, 0.1)';
    if (props.isUrgent) return 'rgba(255, 59, 48, 0.1)';
    return 'rgba(0, 122, 255, 0.1)';
  }};
  color: ${props => {
    if (props.isSuccess) return '#30D158';
    if (props.isUrgent) return '#FF3B30';
    return '#007AFF';
  }};
  border: 1px solid ${props => {
    if (props.isSuccess) return 'rgba(48, 209, 88, 0.2)';
    if (props.isUrgent) return 'rgba(255, 59, 48, 0.2)';
    return 'rgba(0, 122, 255, 0.2)';
  }};
  flex-shrink: 0;
`;

const TextContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3<{ 
  isUrgent: boolean; 
  isSuccess: boolean;
  variant: string;
}>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: ${props => props.variant === 'minimal' ? '15px' : '18px'};
  font-weight: 600;
  color: ${props => {
    if (props.isSuccess) return '#30D158';
    if (props.isUrgent) return '#FF3B30';
    return '#1D1D1F';
  }};
  margin: 0 0 6px 0;
  line-height: 1.2;
`;

const Description = styled.p<{ variant: string }>`
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => props.variant === 'minimal' ? '13px' : '15px'};
  color: #6D6D70;
  margin: 0 0 8px 0;
  line-height: 1.33;
`;

const MetaBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const PlanBadge = styled.span<{ plan: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${props => {
    switch (props.plan) {
      case 'trial': return 'rgba(255, 149, 0, 0.1)';
      case 'basic': return 'rgba(142, 142, 147, 0.1)';
      case 'pro': return 'rgba(48, 209, 88, 0.1)';
      case 'enterprise': return 'rgba(175, 82, 222, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.plan) {
      case 'trial': return '#FF9500';
      case 'basic': return '#8E8E93';
      case 'pro': return '#30D158';
      case 'enterprise': return '#AF52DE';
      default: return '#8E8E93';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid ${props => {
    switch (props.plan) {
      case 'trial': return 'rgba(255, 149, 0, 0.2)';
      case 'basic': return 'rgba(142, 142, 147, 0.2)';
      case 'pro': return 'rgba(48, 209, 88, 0.2)';
      case 'enterprise': return 'rgba(175, 82, 222, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
`;

const UsageBadge = styled.span<{ percentage: number }>`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${props => {
    if (props.percentage >= 90) return 'rgba(255, 59, 48, 0.1)';
    if (props.percentage >= 70) return 'rgba(255, 149, 0, 0.1)';
    return 'rgba(48, 209, 88, 0.1)';
  }};
  color: ${props => {
    if (props.percentage >= 90) return '#FF3B30';
    if (props.percentage >= 70) return '#FF9500';
    return '#30D158';
  }};
  border: 1px solid ${props => {
    if (props.percentage >= 90) return 'rgba(255, 59, 48, 0.2)';
    if (props.percentage >= 70) return 'rgba(255, 149, 0, 0.2)';
    return 'rgba(48, 209, 88, 0.2)';
  }};
`;

const ProgressSection = styled.div<{ show: boolean }>`
  width: 100%;
  margin-top: 12px;
  display: ${props => props.show ? 'block' : 'none'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ 
  percentage: number;
  isUrgent: boolean;
  animated: boolean;
}>`
  height: 100%;
  background: ${props => {
    if (props.percentage >= 90) return 'linear-gradient(90deg, #FF3B30 0%, #FF453A 100%)';
    if (props.percentage >= 70) return 'linear-gradient(90deg, #FF9500 0%, #FF9F0A 100%)';
    return 'linear-gradient(90deg, #007AFF 0%, #0A84FF 100%)';
  }};
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  width: ${props => Math.min(100, Math.max(0, props.percentage))}%;
  
  ${props => props.animated && css`
    animation: ${progressAnimation} 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    --target-width: ${props.percentage}%;
  `}
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8E8E93;
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const PrimaryButton = styled.button<{ 
  isUrgent: boolean;
  isSuccess: boolean;
  variant: string;
}>`
  background: ${props => {
    if (props.isSuccess) return '#30D158';
    if (props.isUrgent) return '#FF3B30';
    return '#007AFF';
  }};
  color: #FFFFFF;
  border: none;
  border-radius: ${props => props.variant === 'minimal' ? '6px' : '8px'};
  padding: ${props => props.variant === 'minimal' ? '10px 16px' : '12px 20px'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => props.variant === 'minimal' ? '14px' : '15px'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: ${props => props.variant === 'minimal' ? '36px' : '44px'};
  white-space: nowrap;
  
  &:hover {
    background: ${props => {
      if (props.isSuccess) return '#28B946';
      if (props.isUrgent) return '#E52D27';
      return '#0056CC';
    }};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled.button<{ variant: string }>`
  background: transparent;
  color: #007AFF;
  border: 1px solid #D1D1D6;
  border-radius: ${props => props.variant === 'minimal' ? '6px' : '8px'};
  padding: ${props => props.variant === 'minimal' ? '9px 15px' : '11px 19px'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => props.variant === 'minimal' ? '14px' : '15px'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: ${props => props.variant === 'minimal' ? '36px' : '44px'};
  white-space: nowrap;
  
  &:hover {
    background: #F2F2F7;
    border-color: #007AFF;
    color: #0056CC;
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: #8E8E93;
  font-size: 18px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #1D1D1F;
  }
`;

// === COMPONENT PRINCIPAL MEMOIZADO ===
// ✅ COMPONENTE PRINCIPAL CORRIGIDO
const TrialBanner: React.FC<TrialBannerProps> = memo(({
  onUpgrade,
  variant = 'default',
  position = 'inline',
  autoHide = true,
  showProgress = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ✅ Usar useFluxData (mantido - correto)
  const {
    analyses,
    sites,
    currentUserPreferences: userSettings,
    isLoading,
    refreshData
  } = useFluxData();
  
  // ✅ Estados locais (mantidos)
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // ✅ CORREÇÃO CRÍTICA: Fetch client data com .maybeSingle()
  useEffect(() => {
    const fetchClientData = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔄 Buscando dados do cliente...');
        
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // ✅ CORREÇÃO CRÍTICA: .single() → .maybeSingle()
        
        if (error) {
          console.error('❌ Erro na query cliente:', error);
          return;
        }
        
        if (data) {
          console.log('✅ Dados do cliente carregados:', data);
          setClientData({
            ...data,
            name: data.name || data.email?.split('@')[0] || 'Usuario'
          });
        } else {
          console.log('ℹ️ Cliente não encontrado, criando...');
          await createDefaultClient();
        }
        
      } catch (err) {
        console.error('❌ Erro ao carregar dados do cliente:', err);
      }
    };
    
    // ✅ CORREÇÃO: Helper para criar cliente padrão
    const createDefaultClient = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'Usuario',
            plan: 'trial',
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            subscription_status: 'trialing'
          }, { 
            onConflict: 'id' 
          })
          .select()
          .maybeSingle(); // ✅ CORREÇÃO: usar .maybeSingle()
        
        if (!error && data) {
          console.log('✅ Cliente criado/atualizado:', data);
          setClientData({
            ...data,
            name: data.name || data.email?.split('@')[0] || 'Usuario'
          });
        }
      } catch (error) {
        console.error('❌ Erro ao criar cliente:', error);
      }
    };
    
    fetchClientData();
    
    // ✅ Real-time subscription (mantida - correta)
    const subscription = supabase
      .channel(`client_updates:${user?.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients' },
        (payload) => {
          console.log('📊 Plano atualizado:', payload.new);
          const newData = payload.new as any;
          setClientData({
            ...newData,
            name: newData.name || newData.email?.split('@')[0] || 'Usuario'
          });
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);
  // ✅ Calcular dados de usage memoizados
  const usageData = useMemo((): UsageData => {
    if (!clientData) {
      return {
        analysesCount: 0,
        analysesLimit: 0,
        sitesCount: 0,
        sitesLimit: 0,
        percentage: 0,
        daysInPeriod: 0
      };
    }

    // Limites baseados no plano
    const limits = {
      free: { analyses: 3, sites: 1 },
      trial: { analyses: 10, sites: 3 },
      basic: { analyses: 25, sites: 5 },
      pro: { analyses: 100, sites: 15 },
      enterprise: { analyses: 1000, sites: 50 }
    };

    const planLimits = limits[clientData.plan] || limits.free;
    const analysesCount = analyses.length;
    const sitesCount = sites.length;
    const percentage = planLimits.analyses > 0 ? 
      (analysesCount / planLimits.analyses) * 100 : 0;

    // Calcular dias no período atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInPeriod = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));

    return {
      analysesCount,
      analysesLimit: planLimits.analyses,
      sitesCount,
      sitesLimit: planLimits.sites,
      percentage: Math.min(100, percentage),
      daysInPeriod
    };
  }, [clientData, analyses.length, sites.length]);

  // ✅ Calcular status do trial memoizado
  const trialStatus = useMemo(() => {
    if (!clientData) return { 
      isVisible: false, 
      isUrgent: false, 
      isSuccess: false,
      daysLeft: 0,
      isExpired: false
    };

    // Se já é pro ou enterprise, mostrar success
    if (['pro', 'enterprise'].includes(clientData.plan)) {
      return { 
        isVisible: variant !== 'minimal', 
        isUrgent: false, 
        isSuccess: true,
        daysLeft: 0,
        isExpired: false
      };
    }

    // Se usage alto, sempre mostrar
    if (usageData.percentage >= 80) {
      return {
        isVisible: true,
        isUrgent: usageData.percentage >= 90,
        isSuccess: false,
        daysLeft: 0,
        isExpired: false
      };
    }

    // Se tem trial_end, calcular dias restantes
    if (clientData.trial_end) {
      const trialEndDate = new Date(clientData.trial_end);
      const now = new Date();
      const diffTime = trialEndDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isVisible: true,
        isUrgent: daysLeft <= 3 && daysLeft > 0,
        isSuccess: false,
        daysLeft: Math.max(0, daysLeft),
        isExpired: daysLeft <= 0
      };
    }

    // Se é free, sempre mostrar se não auto-hide
    return { 
      isVisible: !autoHide || usageData.percentage > 50, 
      isUrgent: false, 
      isSuccess: false,
      daysLeft: 0,
      isExpired: false
    };
  }, [clientData, usageData, variant, autoHide]);

  // ✅ Handlers otimizados
  const handleUpgrade = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/configuracoes?tab=planos');
    }
  }, [onUpgrade, navigate]);

  const handleLearnMore = useCallback(() => {
    navigate('/configuracoes?tab=account');
  }, [navigate]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setTimeout(() => setIsVisible(false), 300);
  }, []);

  // ✅ Renderizar conteúdo baseado no estado
  const renderContent = useCallback(() => {
    if (!clientData) return null;

    // Priority: Usage limit
    if (usageData.percentage >= 90) {
      return {
        icon: '⚠️',
        title: 'Limite de análises atingido',
        description: `Você usou ${usageData.analysesCount} de ${usageData.analysesLimit} análises. Faça upgrade para continuar.`,
        primaryAction: 'Upgrade Agora',
        isUrgent: true
      };
    }

    if (usageData.percentage >= 80) {
      return {
        icon: '📊',
        title: 'Limite de análises próximo',
        description: `Você usou ${usageData.analysesCount} de ${usageData.analysesLimit} análises este mês.`,
        primaryAction: 'Ver Planos',
        isUrgent: false
      };
    }

    // Success state
    if (trialStatus.isSuccess) {
      return {
        icon: '✅',
        title: `Plano ${clientData.plan.toUpperCase()} Ativo`,
        description: 'Você tem acesso completo a todas as funcionalidades do Flux Revenue.',
        primaryAction: 'Ver Dashboard',
        isUrgent: false
      };
    }

    // Trial states
    switch (clientData.plan) {
      case 'trial':
        if (trialStatus.isExpired) {
          return {
            icon: '⏰',
            title: 'Trial Expirado',
            description: 'Seu trial gratuito expirou. Faça upgrade para continuar usando todas as funcionalidades.',
            primaryAction: 'Fazer Upgrade',
            isUrgent: true
          };
        }

        if (trialStatus.isUrgent) {
          return {
            icon: '🚨',
            title: `${trialStatus.daysLeft} ${trialStatus.daysLeft === 1 ? 'dia restante' : 'dias restantes'}`,
            description: 'Seu trial está acabando! Não perca acesso às otimizações avançadas.',
            primaryAction: 'Upgrade Urgente',
            isUrgent: true
          };
        }

        return {
          icon: '🚀',
          title: `${trialStatus.daysLeft} dias de trial restantes`,
          description: 'Aproveite ao máximo seu trial gratuito do Flux Revenue.',
          primaryAction: 'Ver Planos Pro',
          isUrgent: false
        };

      case 'basic':
        return {
          icon: '⭐',
          title: 'Desbloqueie recursos Pro',
          description: 'Análises ilimitadas, otimizações avançadas e suporte prioritário.',
          primaryAction: 'Upgrade para Pro',
          isUrgent: false
        };

      case 'free':
      default:
        return {
          icon: '🎯',
          title: 'Maximize suas receitas',
          description: 'Faça upgrade para Pro e tenha acesso a análises ilimitadas e IA avançada.',
          primaryAction: 'Começar Trial',
          isUrgent: false
        };
    }
  }, [clientData, usageData, trialStatus]);

  // ✅ Controle de visibilidade
  useEffect(() => {
    if (trialStatus.isVisible && !dismissed && !isLoading('global')) {
      setIsVisible(true);
    }
  }, [trialStatus.isVisible, dismissed, isLoading]);

  // === RENDER CONDITIONS ===
  if (isLoading('global') || !trialStatus.isVisible || !clientData || dismissed || !isVisible) {
    return null;
  }

  const content = renderContent();
  if (!content) return null;

  const isUrgent = content.isUrgent || usageData.percentage >= 90;
  const isSuccess = trialStatus.isSuccess;

  return (
    <BannerContainer
      variant={variant}
      position={position}
      isUrgent={isUrgent}
      isSuccess={isSuccess}
    >
      {autoHide && !isUrgent && (
        <DismissButton onClick={handleDismiss}>
          ×
        </DismissButton>
      )}

      <ContentSection>
        <IconContainer 
          isUrgent={isUrgent}
          isSuccess={isSuccess}
          variant={variant}
        >
          {content.icon}
        </IconContainer>
        
        <TextContent>
          <Title 
            isUrgent={isUrgent}
            isSuccess={isSuccess}
            variant={variant}
          >
            {content.title}
          </Title>
          
          <Description variant={variant}>
            {content.description}
          </Description>

          <MetaBadges>
            <PlanBadge plan={clientData.plan}>
              {clientData.plan.toUpperCase()}
            </PlanBadge>
            
            {usageData.percentage > 0 && (
              <UsageBadge percentage={usageData.percentage}>
                {Math.round(usageData.percentage)}% usado
              </UsageBadge>
            )}
          </MetaBadges>

          {/* Progress Bar */}
          {showProgress && usageData.percentage > 0 && (
            <ProgressSection show={true}>
              <ProgressBar>
                <ProgressFill 
                  percentage={usageData.percentage}
                  isUrgent={isUrgent}
                  animated={true}
                />
              </ProgressBar>
              <ProgressText>
                <span>{usageData.analysesCount} de {usageData.analysesLimit} análises</span>
                <span>Período: {usageData.daysInPeriod} dias</span>
              </ProgressText>
            </ProgressSection>
          )}
        </TextContent>
      </ContentSection>

      <ActionsSection>
        <PrimaryButton
          isUrgent={isUrgent}
          isSuccess={isSuccess}
          variant={variant}
          onClick={handleUpgrade}
        >
          {content.primaryAction}
        </PrimaryButton>
        
        {!isUrgent && !isSuccess && (
          <SecondaryButton 
            variant={variant}
            onClick={handleLearnMore}
          >
            Saiba Mais
          </SecondaryButton>
        )}
      </ActionsSection>
    </BannerContainer>
  );
});

TrialBanner.displayName = 'TrialBanner';

export default TrialBanner;
