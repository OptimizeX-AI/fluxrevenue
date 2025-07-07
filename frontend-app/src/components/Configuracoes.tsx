// src/components/Configuracoes.tsx - ENTERPRISE GRADE COMPLETE SYSTEM CORRIGIDO

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components'; // Presumindo que styled-components permanecem
import { useFluxData } from '../hooks/useFluxData';
import { UserProfileData, UserSettings as UserPreferencesData } from '../types/interfaces'; // Usar os tipos corretos
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabaseClient'; // Removido, usaremos o hook

// === INTERFACES LOCAIS (RateLimitInfo, PlanFeature, Plan) - Presumindo que permanecem as mesmas ===
// ... (Omitidas para brevidade)
// Tipos locais que podem ser diferentes ou mais específicos que os globais
type BrazilianRegion = 'br_sp_capital' | 'br_rj_capital' | 'br_sp_interior' | 'br_sul' | 'br_nordeste' | 'br_outros';
type SiteCategory = 'finance_insurance_legal' | 'technology_b2b' | 'health_wellness' | 'real_estate' | 'education' | 'entertainment_lifestyle' | 'general';

interface SiteConfig { // Para o formulário de adicionar/editar site, se implementado aqui
    id?: string;
    url: string;
    client_id: string;
    name: string;
    category: SiteCategory;
    // ... outros campos do site
    created_at: string;
    updated_at?: string;
    script_installed: boolean;
    optimization_enabled: boolean;
}
interface RateLimitInfo {
    id: string;
    user_id: string;
    key: string;
    count: number;
    date: string;
    operation: string;
    created_at: string;
    updated_at: string;
  }

  interface PlanFeature {
    name: string;
    limit?: number | string;
    included: boolean;
    description?: string;
  }

  interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    billing_period: 'monthly' | 'yearly';
    features: PlanFeature[];
    popular?: boolean;
    enterprise?: boolean;
  }

// === STYLED COMPONENTS (Omitidos para brevidade) ===
// ... (Todos os styled-components)
const slideInUp = keyframes`/* ... */`;
const saveSuccess = keyframes`/* ... */`;
const ConfigContainer = styled.div`/* ... */`;
const LoadingContainer = styled.div`/* ... */`;
const LoadingSpinner = styled.div`/* ... */`;
const Header = styled.header`/* ... */`;
const Title = styled.h1`/* ... */`;
const Subtitle = styled.p`/* ... */`;
const TabsContainer = styled.div`/* ... */`;
const Tab = styled.button<{ active: boolean }>`/* ... */`;
const ContentSection = styled.div`/* ... */`;
const SectionTitle = styled.h2`/* ... */`;
const FormGrid = styled.div`/* ... */`;
const FormGroup = styled.div`/* ... */`;
const Label = styled.label`/* ... */`;
const RequiredIndicator = styled.span`/* ... */`;
const Input = styled.input<{ hasError?: boolean }>`/* ... */`;
const Select = styled.select<{ hasError?: boolean }>`/* ... */`;
const Textarea = styled.textarea<{ hasError?: boolean }>`/* ... */`;
const ErrorMessage = styled.div`/* ... */`;
const HelpText = styled.div`/* ... */`;
const InfoBox = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`/* ... */`;
const InfoTitle = styled.h4<{ type: string }>`/* ... */`;
const InfoText = styled.p`/* ... */`;
const ToggleContainer = styled.div`/* ... */`;
const ToggleInfo = styled.div`/* ... */`;
const ToggleTitle = styled.h4`/* ... */`;
const ToggleBadge = styled.span<{ type: 'pro' | 'enterprise' | 'beta' }>`/* ... */`;
const ToggleDescription = styled.p`/* ... */`;
const Toggle = styled.button<{ enabled: boolean; disabled?: boolean }>`/* ... */`;
const ActionButtons = styled.div`/* ... */`;
const ActionButton = styled.button<any>`/* ... */`;
const StatusBadge = styled.span<any>`/* ... */`;
// Adicionando os que faltavam para completar o componente
Header.defaultProps = { children: React.createElement(React.Fragment) };
Title.defaultProps = { children: React.createElement(React.Fragment) };
Subtitle.defaultProps = { children: React.createElement(React.Fragment) };
TabsContainer.defaultProps = { children: React.createElement(React.Fragment) };
Tab.defaultProps = { children: React.createElement(React.Fragment) };
ContentSection.defaultProps = { children: React.createElement(React.Fragment) };
SectionTitle.defaultProps = { children: React.createElement(React.Fragment) };
FormGrid.defaultProps = { children: React.createElement(React.Fragment) };
FormGroup.defaultProps = { children: React.createElement(React.Fragment) };
Label.defaultProps = { children: React.createElement(React.Fragment) };
RequiredIndicator.defaultProps = { children: React.createElement(React.Fragment) };
Input.defaultProps = { children: React.createElement(React.Fragment) };
Select.defaultProps = { children: React.createElement(React.Fragment) };
Textarea.defaultProps = { children: React.createElement(React.Fragment) };
ErrorMessage.defaultProps = { children: React.createElement(React.Fragment) };
HelpText.defaultProps = { children: React.createElement(React.Fragment) };
InfoBox.defaultProps = { children: React.createElement(React.Fragment) };
InfoTitle.defaultProps = { children: React.createElement(React.Fragment) };
InfoText.defaultProps = { children: React.createElement(React.Fragment) };
ToggleContainer.defaultProps = { children: React.createElement(React.Fragment) };
ToggleInfo.defaultProps = { children: React.createElement(React.Fragment) };
ToggleTitle.defaultProps = { children: React.createElement(React.Fragment) };
ToggleBadge.defaultProps = { children: React.createElement(React.Fragment) };
ToggleDescription.defaultProps = { children: React.createElement(React.Fragment) };
Toggle.defaultProps = { children: React.createElement(React.Fragment) };
ActionButtons.defaultProps = { children: React.createElement(React.Fragment) };
ActionButton.defaultProps = { children: React.createElement(React.Fragment) };
StatusBadge.defaultProps = { children: React.createElement(React.Fragment) };
LoadingContainer.defaultProps = { children: React.createElement(React.Fragment) };
LoadingSpinner.defaultProps = { children: React.createElement(React.Fragment) };


// === CONSTANTS (SITE_CATEGORIES, TIMEZONES, LANGUAGES, PLANS) - Presumindo que permanecem as mesmas ===
// ... (Omitidas para brevidade)
const SITE_CATEGORIES = [ { value: 'finance_insurance_legal', label: '💰 Finanças, Seguros e Jurídico', description: 'Maior valor de CPC - Bancos, seguros, advogados', tier: 'premium' }, { value: 'technology_b2b', label: '💻 Tecnologia e B2B', description: 'Software, SaaS, serviços empresariais', tier: 'high' }, { value: 'health_wellness', label: '🏥 Saúde e Bem-Estar', description: 'Medicina, fitness, nutrição - Nicho YMYL', tier: 'high' }, { value: 'real_estate', label: '🏠 Imobiliário', description: 'Imóveis, construção, decoração', tier: 'medium-high' }, { value: 'education', label: '🎓 Educação', description: 'Cursos, escolas, capacitação', tier: 'medium' }, { value: 'entertainment_lifestyle', label: '🎭 Entretenimento e Lifestyle', description: 'Entretenimento, moda, celebridades', tier: 'volume' }, { value: 'general', label: '📂 Geral', description: 'Categoria geral - benchmark médio', tier: 'medium' } ];
const TIMEZONES = [ { value: 'America/Sao_Paulo', label: '🇧🇷 São Paulo (UTC-3)' }, { value: 'America/New_York', label: '🇺🇸 Nova York (UTC-5)' }, { value: 'Europe/London', label: '🇬🇧 Londres (UTC+0)' }, { value: 'Europe/Paris', label: '🇫🇷 Paris (UTC+1)' }, { value: 'Asia/Tokyo', label: '🇯🇵 Tóquio (UTC+9)' } ];
const LANGUAGES = [ { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' }, { value: 'en-US', label: '🇺🇸 English (US)' }, { value: 'es-ES', label: '🇪🇸 Español' } ];
const PLANS: Plan[] = [ { id: 'free', name: 'Free', price: 0, currency: 'BRL', billing_period: 'monthly', features: [ { name: 'Sites', limit: '1', included: true }, { name: 'Análises', limit: '3/mês', included: true }, { name: 'Relatórios básicos', included: true }, { name: 'Suporte por email', included: true }, { name: 'API access', included: false }, { name: 'Otimização automática', included: false }, { name: 'A/B testing', included: false } ] }, { id: 'basic', name: 'Basic', price: 47, currency: 'BRL', billing_period: 'monthly', features: [ { name: 'Sites', limit: '3', included: true }, { name: 'Análises', limit: '25/mês', included: true }, { name: 'Relatórios avançados', included: true }, { name: 'Suporte prioritário', included: true }, { name: 'API access', included: true }, { name: 'Otimização automática', included: false }, { name: 'A/B testing', included: false } ] }, { id: 'pro', name: 'Pro', price: 97, currency: 'BRL', billing_period: 'monthly', popular: true, features: [ { name: 'Sites', limit: '10', included: true }, { name: 'Análises', limit: 'Ilimitadas', included: true }, { name: 'Relatórios avançados', included: true }, { name: 'Suporte prioritário', included: true }, { name: 'API access', included: true }, { name: 'Otimização automática', included: true }, { name: 'A/B testing', included: true }, { name: 'ML/RL Engine', included: true } ] }, { id: 'enterprise', name: 'Enterprise', price: 297, currency: 'BRL', billing_period: 'monthly', enterprise: true, features: [ { name: 'Sites', limit: 'Ilimitados', included: true }, { name: 'Análises', limit: 'Ilimitadas', included: true }, { name: 'API personalizada', included: true }, { name: 'Suporte dedicado', included: true }, { name: 'Onboarding personalizado', included: true }, { name: 'White-label completo', included: true }, { name: 'SLA 99.9%', included: true } ] } ];

// === COMPONENT PRINCIPAL ===
const Configuracoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Para poder atualizar a aba na URL
  const { toast } = useToast();
  const { user } = useAuth();

  // Usar dados e funções do useFluxData
  const {
    userProfile: fluxUserProfile,
    currentUserPreferences: fluxUserPreferences,
    rateLimits, // Assumindo que rateLimits é um array, pegar o primeiro ou um específico
    loading: fluxDataLoading,
    refreshData, // Usar para atualizar após salvar
    updateUserProfile,
    updateUserPreferences
  } = useFluxData();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'perfil');

  // Estados locais para os formulários, inicializados com dados do hook
  const [profileFormData, setProfileFormData] = useState<Partial<UserProfileData>>({});
  const [preferencesFormData, setPreferencesFormData] = useState<Partial<UserPreferencesData>>({});

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Popular formulários quando dados do hook estiverem disponíveis/mudarem
  useEffect(() => {
    if (fluxUserProfile) {
      setProfileFormData({
        name: fluxUserProfile.company || fluxUserProfile.email?.split('@')[0] || '', // 'name' em UserProfileData refere-se a company
        email: fluxUserProfile.email,
        // Outros campos de UserProfileData que são editáveis
        country: fluxUserProfile.country || 'BR',
        timezone: fluxUserProfile.timezone || 'America/Sao_Paulo',
        currency: fluxUserProfile.currency || 'BRL',
      });
    }
  }, [fluxUserProfile]);

  useEffect(() => {
    if (fluxUserPreferences) {
      setPreferencesFormData(fluxUserPreferences);
    } else if (user?.id && !fluxDataLoading) { // Se não há preferências e não está carregando, usar defaults
        setPreferencesFormData({
            client_id: user.id,
            notifications_enabled: true, auto_optimization: false, report_frequency: 'weekly',
            email_notifications: true, sms_notifications: false,
            // ... outros defaults da interface UserPreferencesData
        });
    }
  }, [fluxUserPreferences, user?.id, fluxDataLoading]);

  // Atualizar aba na URL quando o estado local mudar
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setPreferencesFormData(prev => ({...prev, [name]: checked}));
    } else {
        setPreferencesFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleChange = (name: keyof UserPreferencesData) => {
    setPreferencesFormData(prev => ({...prev, [name]: !prev[name]}));
  };


  const validateForm = useCallback((data: any, type: 'profile' | 'preferences') => { /* ... (mesma lógica de validação) ... */ const errors: Record<string, string> = {}; if (type === 'profile') { if (!data.name?.trim()) errors.name = 'Nome é obrigatório'; if (!data.email?.trim()) errors.email = 'Email é obrigatório'; if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { errors.email = 'Email deve ter formato válido'; } } if (type === 'preferences') { if (data.webhook_url && data.webhook_url.trim() !== '' && !/^https?:\/\/.+/.test(data.webhook_url)) { errors.webhook_url = 'Webhook URL deve começar com http:// ou https://'; } if (data.slack_webhook && data.slack_webhook.trim() !== '' && !/^https:\/\/hooks\.slack\.com\/.+/.test(data.slack_webhook)) { errors.slack_webhook = 'Slack webhook deve ser uma URL válida do Slack'; } } setValidationErrors(errors); return Object.keys(errors).length === 0; }, []);

  const saveProfile = useCallback(async () => {
    if (!user?.id || !profileFormData) return;
    if (!validateForm(profileFormData, 'profile')) {
      toast({ title: 'Dados Inválidos', description: 'Verifique os campos.', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    // A interface UserProfileData tem 'name', mas a tabela clients tem 'company'. Ajustar o payload.
    const payloadToSave: Partial<UserProfileData> = {
        company: profileFormData.name, // Mapear name do form para company
        email: profileFormData.email,
        country: profileFormData.country,
        timezone: profileFormData.timezone,
        currency: profileFormData.currency,
    };
    const result = await updateUserProfile(payloadToSave);
    if (result.success) {
      toast({ title: 'Perfil Atualizado! ✅', description: 'Suas informações foram salvas.' });
      setValidationErrors({});
    } else {
      toast({ title: 'Erro', description: `Erro ao salvar perfil: ${result.error?.message || 'Tente novamente.'}`, variant: 'destructive' });
    }
    setSavingProfile(false);
  }, [user?.id, profileFormData, validateForm, toast, updateUserProfile]);

  const savePreferences = useCallback(async () => {
    if (!user?.id || !preferencesFormData) return;
     if (!validateForm(preferencesFormData, 'preferences')) {
      toast({ title: 'Dados Inválidos', description: 'Verifique os campos.', variant: 'destructive' });
      return;
    }
    setSavingPreferences(true);
    // Garantir que client_id está no payload para o upsert
    const payloadToSave = { ...preferencesFormData, client_id: user.id };
    const result = await updateUserPreferences(payloadToSave);
    if (result.success) {
      toast({ title: 'Preferências Salvas! ✅', description: 'Suas preferências foram atualizadas.' });
      setValidationErrors({});
    } else {
      toast({ title: 'Erro', description: `Erro ao salvar preferências: ${result.error?.message || 'Tente novamente.'}`, variant: 'destructive' });
    }
    setSavingPreferences(false);
  }, [user?.id, preferencesFormData, validateForm, toast, updateUserPreferences]);

  const isFeatureEnabled = useCallback((feature: string) => { /* ... (mesma lógica) ... */ if (!fluxUserProfile) return false; const planFeatures = { free: ['basic_reports', 'email_support'], trial: ['basic_reports', 'email_support', 'api_access'], basic: ['basic_reports', 'email_support', 'api_access', 'advanced_reports'], pro: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine'], enterprise: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine', 'white_label', 'custom_integrations'] }; return planFeatures[fluxUserProfile.plan as keyof typeof planFeatures]?.includes(feature) || false; }, [fluxUserProfile]);

  const rateLimitInfo = rateLimits && rateLimits.length > 0 ? rateLimits[0] : null; // Exemplo simples de pegar o primeiro rate_limit

  // === RENDER ===
  if (fluxDataLoading && !fluxUserProfile && !fluxUserPreferences) {
    return ( /* ... (JSX de loading) ... */ <ConfigContainer><LoadingContainer><LoadingSpinner /><h3>Carregando Configurações...</h3><p>Buscando dados do usuário e preferências</p></LoadingContainer></ConfigContainer>);
  }

  return (
    <ConfigContainer>
      <Header>
        <Title>⚙️ Configurações</Title>
        <Subtitle>Gerencie suas preferências e configurações da conta</Subtitle>
      </Header>

      <TabsContainer>
        <Tab active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')}>👤 Perfil</Tab>
        <Tab active={activeTab === 'preferencias'} onClick={() => setActiveTab('preferencias')}>⚙️ Preferências</Tab>
        {/* Adicionar Aba Sites Aqui se necessário */}
        {/* <Tab active={activeTab === 'sites'} onClick={() => setActiveTab('sites')}>🌐 Sites</Tab> */}
        <Tab active={activeTab === 'planos'} onClick={() => setActiveTab('planos')}>💎 Planos</Tab>
        <Tab active={activeTab === 'api'} onClick={() => setActiveTab('api')}>🔗 API & Integrações</Tab>
      </TabsContainer>

      {activeTab === 'perfil' && fluxUserProfile && (
        <ContentSection>
          <SectionTitle>👤 Informações do Perfil</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label htmlFor="name">Nome/Empresa <RequiredIndicator>*</RequiredIndicator></Label>
                <Input id="name" name="name" type="text" value={profileFormData.name || ''} onChange={handleProfileChange} placeholder="Seu nome ou empresa" hasError={!!validationErrors.name} />
                {validationErrors.name && (<ErrorMessage>⚠️ {validationErrors.name}</ErrorMessage>)}
              </FormGroup>
              <FormGroup>
                <Label htmlFor="email">Email <RequiredIndicator>*</RequiredIndicator></Label>
                <Input id="email" name="email" type="email" value={profileFormData.email || ''} onChange={handleProfileChange} placeholder="seu@email.com" hasError={!!validationErrors.email} />
                {validationErrors.email && (<ErrorMessage>⚠️ {validationErrors.email}</ErrorMessage>)}
              </FormGroup>
              <FormGroup>
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select id="timezone" name="timezone" value={profileFormData.timezone || 'America/Sao_Paulo'} onChange={handleProfileChange}>
                  {TIMEZONES.map(tz => (<option key={tz.value} value={tz.value}>{tz.label}</option>))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="currency">Moeda</Label>
                <Select id="currency" name="currency" value={profileFormData.currency || 'BRL'} onChange={handleProfileChange}>
                  <option value="BRL">🇧🇷 Real Brasileiro (BRL)</option> <option value="USD">🇺🇸 Dólar Americano (USD)</option> <option value="EUR">🇪🇺 Euro (EUR)</option>
                </Select>
              </FormGroup>
            </FormGrid>
            <InfoBox type="info">
              <InfoTitle type="info">📊 Informações da Conta</InfoTitle>
              <InfoText>
                <strong>Plano Atual:</strong> {fluxUserProfile.plan.toUpperCase()} • <strong> Status:</strong> {fluxUserProfile.subscription_status || 'ativo'} • <strong> Membro desde:</strong> {new Date(fluxUserProfile.created_at).toLocaleDateString('pt-BR')}
                {fluxUserProfile.trial_end_date && ( <> <br /> <strong>Trial expira em:</strong> {new Date(fluxUserProfile.trial_end_date).toLocaleDateString('pt-BR')} </> )}
              </InfoText>
            </InfoBox>
            <ActionButtons>
              <ActionButton variant="secondary" onClick={() => navigate('/dashboard')}>← Voltar</ActionButton>
              <ActionButton variant="primary" onClick={saveProfile} disabled={savingProfile} loading={savingProfile}>
                {savingProfile ? '💾 Salvando...' : '💾 Salvar Perfil'}
              </ActionButton>
            </ActionButtons>
        </ContentSection>
      )}

      {activeTab === 'preferencias' && (
        <ContentSection>
          <SectionTitle>⚙️ Preferências do Sistema</SectionTitle>
          {/* Toggles e Form
          grid para preferências, usando preferencesFormData e handlePreferencesChange/handleToggleChange */}
          <ToggleContainer>
            <ToggleInfo><ToggleTitle>🔔 Notificações por Email</ToggleTitle><ToggleDescription>Receba notificações sobre análises concluídas, alertas de performance e atualizações importantes</ToggleDescription></ToggleInfo>
            <Toggle enabled={preferencesFormData.email_notifications || false} onClick={() => handleToggleChange('email_notifications')} />
          </ToggleContainer>
          <ToggleContainer>
            <ToggleInfo><ToggleTitle>📱 Notificações SMS <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Receba alertas críticos de performance via SMS</ToggleDescription></ToggleInfo>
            <Toggle enabled={preferencesFormData.sms_notifications || false} disabled={!isFeatureEnabled('sms_notifications')} onClick={() => isFeatureEnabled('sms_notifications') && handleToggleChange('sms_notifications')} />
          </ToggleContainer>
           <ToggleContainer>
            <ToggleInfo><ToggleTitle>⚡ Otimização Automática <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Permitir que a IA aplique otimizações automaticamente</ToggleDescription></ToggleInfo>
            <Toggle enabled={preferencesFormData.auto_optimization || false} disabled={!isFeatureEnabled('auto_optimization')} onClick={() => isFeatureEnabled('auto_optimization') && handleToggleChange('auto_optimization')} />
          </ToggleContainer>
          {/* ... outros toggles e campos do formulário ... */}
           <FormGrid>
            <FormGroup>
              <Label htmlFor="report_frequency">📊 Frequência de Relatórios</Label>
              <Select id="report_frequency" name="report_frequency" value={preferencesFormData.report_frequency || 'weekly'} onChange={handlePreferencesChange} >
                <option value="daily">Diário</option> <option value="weekly">Semanal</option> <option value="monthly">Mensal</option>
              </Select>
            </FormGroup>
            {/* Outros campos como language, theme, data_retention_days */}
          </FormGrid>
          <ActionButtons>
            <ActionButton variant="primary" onClick={savePreferences} disabled={savingPreferences} loading={savingPreferences}>
              {savingPreferences ? '💾 Salvando...' : '💾 Salvar Preferências'}
            </ActionButton>
          </ActionButtons>
        </ContentSection>
      )}

      {activeTab === 'planos' && fluxUserProfile && (
          <ContentSection>
            {/* ... (JSX da aba de planos, sem mudanças na lógica de backend) ... */}
            <SectionTitle>💎 Planos e Assinatura</SectionTitle>
            <InfoBox type="info"><InfoTitle type="info">📋 Plano Atual</InfoTitle><InfoText>Você está no plano <strong>{fluxUserProfile.plan.toUpperCase()}</strong>. {fluxUserProfile.trial_end_date && (<> Seu período de teste expira em <strong>{new Date(fluxUserProfile.trial_end_date).toLocaleDateString('pt-BR')}</strong>.</>)} {rateLimitInfo && (<> <br /> <strong>Uso atual:</strong> {rateLimitInfo.count} de {rateLimitInfo.operation} este período.</>)}</InfoText></InfoBox>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                {PLANS.map((plan) => ( <div key={plan.id} style={{ border: fluxUserProfile.plan === plan.id ? '2px solid #007AFF' : '1px solid #E5E5EA', borderRadius: '16px', padding: '24px', background: '#FFFFFF', position: 'relative', transition: 'all 0.3s ease' }}> {plan.popular && ( <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FF9500 0%, #FFAD33 100%)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}> ⭐ Mais Popular </div> )} <div style={{ textAlign: 'center', marginBottom: '24px' }}> <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}> {plan.name} </h3> <div style={{ fontSize: '36px', fontWeight: '700', color: '#007AFF', marginBottom: '8px' }}> R$ {plan.price} <span style={{ fontSize: '16px', color: '#6D6D70', fontWeight: '500' }}> /{plan.billing_period === 'monthly' ? 'mês' : 'ano'} </span> </div> </div> <div style={{ marginBottom: '24px' }}> {plan.features.map((feature, index) => ( <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: index < plan.features.length - 1 ? '1px solid #F2F2F7' : 'none' }}> <span style={{ marginRight: '12px', fontSize: '16px' }}> {feature.included ? '✅' : '❌'} </span> <div style={{ flex: 1 }}> <span style={{ color: feature.included ? '#1D1D1F' : '#8E8E93', fontWeight: '500' }}> {feature.name} </span> {feature.limit && ( <span style={{ color: '#6D6D70', fontSize: '14px', marginLeft: '8px' }}> ({feature.limit}) </span> )} </div> </div> ))} </div> <ActionButton variant={fluxUserProfile.plan === plan.id ? 'secondary' : 'primary'} style={{ width: '100%' }} onClick={() => { if (fluxUserProfile.plan !== plan.id) { navigate(`/upgrade?plan=${plan.id}`); } }} disabled={fluxUserProfile.plan === plan.id} > {fluxUserProfile.plan === plan.id ? '✅ Plano Atual' : `⬆️ Fazer Upgrade`} </ActionButton> </div> ))}
            </div>
          </ContentSection>
      )}

      {activeTab === 'api' && (
        <ContentSection>
          {/* ... (JSX da aba API, usando preferencesFormData e savePreferences) ... */}
          <SectionTitle>🔗 API & Integrações</SectionTitle>
          <ToggleContainer>
            <ToggleInfo><ToggleTitle>🔑 Acesso à API <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Habilitar acesso programático aos dados e funcionalidades via API REST</ToggleDescription></ToggleInfo>
            <Toggle enabled={preferencesFormData.api_access_enabled || false} disabled={!isFeatureEnabled('api_access')} onClick={() => isFeatureEnabled('api_access') && handleToggleChange('api_access_enabled')} />
          </ToggleContainer>
          {preferencesFormData.api_access_enabled && (<> <FormGrid> <FormGroup> <Label htmlFor="webhook_url">🔗 Webhook URL</Label> <Input id="webhook_url" name="webhook_url" type="url" value={preferencesFormData.webhook_url || ''} onChange={handlePreferencesChange} placeholder="https://seusite.com/webhook" hasError={!!validationErrors.webhook_url} /> {validationErrors.webhook_url && (<ErrorMessage>⚠️ {validationErrors.webhook_url}</ErrorMessage>)} <HelpText>URL para receber notificações quando análises são concluídas</HelpText> </FormGroup> <FormGroup> <Label htmlFor="slack_webhook">💬 Slack Webhook</Label> <Input id="slack_webhook" name="slack_webhook" type="url" value={preferencesFormData.slack_webhook || ''} onChange={handlePreferencesChange} placeholder="https://hooks.slack.com/services/..." hasError={!!validationErrors.slack_webhook} /> {validationErrors.slack_webhook && (<ErrorMessage>⚠️ {validationErrors.slack_webhook}</ErrorMessage>)} <HelpText>URL do webhook do Slack para receber notificações no canal</HelpText> </FormGroup> </FormGrid> <InfoBox type="info"> <InfoTitle type="info">📖 Documentação da API</InfoTitle> <InfoText> Acesse nossa documentação completa da API em{' '} <strong>https://api.fluxrevenue.com.br/docs</strong> para integrar o Flux Revenue com seus sistemas e workflows. </InfoText> </InfoBox> </>)}
          <ActionButtons>
            <ActionButton variant="secondary" onClick={() => window.open('https://api.fluxrevenue.com.br/docs', '_blank')}>📖 Ver Documentação</ActionButton>
            <ActionButton variant="primary" onClick={savePreferences} disabled={savingPreferences} loading={savingPreferences}>
              {savingPreferences ? '💾 Salvando...' : '💾 Salvar Configurações API'}
            </ActionButton>
          </ActionButtons>
        </ContentSection>
      )}
    </ConfigContainer>
  );
};

export default Configuracoes;
