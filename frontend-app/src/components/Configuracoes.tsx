// src/components/Configuracoes.tsx - ENTERPRISE GRADE COMPLETE SYSTEM REFAVORADO

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { UserProfileData, UserSettings as UserPreferencesData, Site as GlobalSite } from '../types/interfaces'; // Usar os tipos corretos
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabaseClient'; // Removido, usaremos o hook

// === INTERFACES LOCAIS (RateLimitInfo, PlanFeature, Plan, SiteConfig local) ===
type BrazilianRegion = 'br_sp_capital' | 'br_rj_capital' | 'br_sp_interior' | 'br_sul' | 'br_nordeste' | 'br_outros';
type SiteCategory = 'finance_insurance_legal' | 'technology_b2b' | 'health_wellness' | 'real_estate' | 'education' | 'entertainment_lifestyle' | 'general';

interface SiteFormState { // Para o formulário de adicionar/editar site
    id?: string; // Presente ao editar
    url: string;
    name: string;
    monthly_pageviews: string; // Inputs de formulário geralmente são strings
    current_rpm: string;       // Inputs de formulário geralmente são strings
    category: SiteCategory;
    // Adicionar outros campos conforme a tabela 'sites' e o que se deseja configurar
}

interface RateLimitInfo { id: string; user_id: string; key: string; count: number; date: string; operation: string; created_at: string; updated_at: string; }
interface PlanFeature { name: string; limit?: number | string; included: boolean; description?: string; }
interface Plan { id: string; name: string; price: number; currency: string; billing_period: 'monthly' | 'yearly'; features: PlanFeature[]; popular?: boolean; enterprise?: boolean; }

// === STYLED COMPONENTS (Omitidos) ===
const slideInUp = keyframes`/* ... */`; const saveSuccess = keyframes`/* ... */`; const ConfigContainer = styled.div`/* ... */`; const LoadingContainer = styled.div`/* ... */`; const LoadingSpinner = styled.div`/* ... */`; const Header = styled.header`/* ... */`; const Title = styled.h1`/* ... */`; const Subtitle = styled.p`/* ... */`; const TabsContainer = styled.div`/* ... */`; const Tab = styled.button<{ active: boolean }>`/* ... */`; const ContentSection = styled.div`/* ... */`; const SectionTitle = styled.h2`/* ... */`; const FormGrid = styled.div`/* ... */`; const FormGroup = styled.div`/* ... */`; const Label = styled.label`/* ... */`; const RequiredIndicator = styled.span`/* ... */`; const Input = styled.input<{ hasError?: boolean }>`/* ... */`; const Select = styled.select<{ hasError?: boolean }>`/* ... */`; const Textarea = styled.textarea<{ hasError?: boolean }>`/* ... */`; const ErrorMessage = styled.div`/* ... */`; const HelpText = styled.div`/* ... */`; const InfoBox = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`/* ... */`; const InfoTitle = styled.h4<{ type: string }>`/* ... */`; const InfoText = styled.p`/* ... */`; const ToggleContainer = styled.div`/* ... */`; const ToggleInfo = styled.div`/* ... */`; const ToggleTitle = styled.h4`/* ... */`; const ToggleBadge = styled.span<{ type: 'pro' | 'enterprise' | 'beta' }>`/* ... */`; const ToggleDescription = styled.p`/* ... */`; const Toggle = styled.button<{ enabled: boolean; disabled?: boolean }>`/* ... */`; const ActionButtons = styled.div`/* ... */`; const ActionButton = styled.button<any>`/* ... */`; const StatusBadge = styled.span<any>`/* ... */`;
// Lista de Sites (novos styled components)
const SiteListContainer = styled.div`margin-top: 20px;`;
const SiteListItem = styled.div`background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;`;
const SiteUrl = styled.span`font-weight: 500;`;
const SiteToken = styled.code`background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.85em;`;
// Adicionando os que faltavam para completar o componente
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; TabsContainer.defaultProps = { children: React.createElement(React.Fragment) }; Tab.defaultProps = { children: React.createElement(React.Fragment) }; ContentSection.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; FormGrid.defaultProps = { children: React.createElement(React.Fragment) }; FormGroup.defaultProps = { children: React.createElement(React.Fragment) }; Label.defaultProps = { children: React.createElement(React.Fragment) }; RequiredIndicator.defaultProps = { children: React.createElement(React.Fragment) }; Input.defaultProps = { children: React.createElement(React.Fragment) }; Select.defaultProps = { children: React.createElement(React.Fragment) }; Textarea.defaultProps = { children: React.createElement(React.Fragment) }; ErrorMessage.defaultProps = { children: React.createElement(React.Fragment) }; HelpText.defaultProps = { children: React.createElement(React.Fragment) }; InfoBox.defaultProps = { children: React.createElement(React.Fragment) }; InfoTitle.defaultProps = { children: React.createElement(React.Fragment) }; InfoText.defaultProps = { children: React.createElement(React.Fragment) }; ToggleContainer.defaultProps = { children: React.createElement(React.Fragment) }; ToggleInfo.defaultProps = { children: React.createElement(React.Fragment) }; ToggleTitle.defaultProps = { children: React.createElement(React.Fragment) }; ToggleBadge.defaultProps = { children: React.createElement(React.Fragment) }; ToggleDescription.defaultProps = { children: React.createElement(React.Fragment) }; Toggle.defaultProps = { children: React.createElement(React.Fragment) }; ActionButtons.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; StatusBadge.defaultProps = { children: React.createElement(React.Fragment) }; LoadingContainer.defaultProps = { children: React.createElement(React.Fragment) }; LoadingSpinner.defaultProps = { children: React.createElement(React.Fragment) };


// === CONSTANTS ===
const SITE_CATEGORIES_OPTIONS: { value: SiteCategory, label: string }[] = [ { value: 'finance_insurance_legal', label: '💰 Finanças, Seguros e Jurídico'}, { value: 'technology_b2b', label: '💻 Tecnologia e B2B'}, { value: 'health_wellness', label: '🏥 Saúde e Bem-Estar'}, { value: 'real_estate', label: '🏠 Imobiliário'}, { value: 'education', label: '🎓 Educação'}, { value: 'entertainment_lifestyle', label: '🎭 Entretenimento e Lifestyle'}, { value: 'general', label: '📂 Geral'} ];
const TIMEZONES = [ /* ... */ { value: 'America/Sao_Paulo', label: '🇧🇷 São Paulo (UTC-3)' }, { value: 'America/New_York', label: '🇺🇸 Nova York (UTC-5)' }, { value: 'Europe/London', label: '🇬🇧 Londres (UTC+0)' } ];
const LANGUAGES = [ /* ... */ { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' }, { value: 'en-US', label: '🇺🇸 English (US)' } ];
const PLANS: Plan[] = [ /* ... (mantido como no original) ... */ { id: 'free', name: 'Free', price: 0, currency: 'BRL', billing_period: 'monthly', features: [ { name: 'Sites', limit: '1', included: true }, { name: 'Análises', limit: '3/mês', included: true }, { name: 'Relatórios básicos', included: true }, { name: 'Suporte por email', included: true }, { name: 'API access', included: false }, { name: 'Otimização automática', included: false }, { name: 'A/B testing', included: false } ] }, { id: 'basic', name: 'Basic', price: 47, currency: 'BRL', billing_period: 'monthly', features: [ { name: 'Sites', limit: '3', included: true }, { name: 'Análises', limit: '25/mês', included: true }, { name: 'Relatórios avançados', included: true }, { name: 'Suporte prioritário', included: true }, { name: 'API access', included: true }, { name: 'Otimização automática', included: false }, { name: 'A/B testing', included: false } ] }, { id: 'pro', name: 'Pro', price: 97, currency: 'BRL', billing_period: 'monthly', popular: true, features: [ { name: 'Sites', limit: '10', included: true }, { name: 'Análises', limit: 'Ilimitadas', included: true }, { name: 'Relatórios avançados', included: true }, { name: 'Suporte prioritário', included: true }, { name: 'API access', included: true }, { name: 'Otimização automática', included: true }, { name: 'A/B testing', included: true }, { name: 'ML/RL Engine', included: true } ] }, { id: 'enterprise', name: 'Enterprise', price: 297, currency: 'BRL', billing_period: 'monthly', enterprise: true, features: [ { name: 'Sites', limit: 'Ilimitados', included: true }, { name: 'Análises', limit: 'Ilimitadas', included: true }, { name: 'API personalizada', included: true }, { name: 'Suporte dedicado', included: true }, { name: 'Onboarding personalizado', included: true }, { name: 'White-label completo', included: true }, { name: 'SLA 99.9%', included: true } ] } ];

// === COMPONENT PRINCIPAL ===
const Configuracoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth(); // Apenas para user.id, o perfil vem do useFluxData

  const {
    userProfile: fluxUserProfile,
    currentUserPreferences: fluxUserPreferences,
    sites: fluxSites, // Lista de sites do usuário
    rateLimits,
    isLoading: fluxDataIsLoading, // Renomeado para evitar conflito
    updateUserProfile,
    updateUserPreferences,
    addSite: addSiteViaHook, // Renomeado para clareza
    updateSite: updateSiteViaHook, // Renomeado para clareza
    generateScript // Para obter o script de otimização
  } = useFluxData();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'perfil');

  const [profileFormData, setProfileFormData] = useState<Partial<UserProfileData>>({});
  const [preferencesFormData, setPreferencesFormData] = useState<Partial<UserPreferencesData>>({
    // Defaults para evitar undefined em controlled components
    notifications_enabled: true, auto_optimization: false, report_frequency: 'weekly',
    email_notifications: true, sms_notifications: false, webhook_notifications: false,
    email_reports: true, report_format: 'dashboard', timezone: 'America/Sao_Paulo',
    language: 'pt-BR', currency: 'BRL', theme: 'light', api_access_enabled: false,
    webhook_url: '', slack_webhook: '', ml_enabled: false, rl_enabled: false,
    ab_testing_enabled: false, optimization_aggressiveness: 'moderate',
    seasonality_adjustment: true, data_retention_days: 365
  });
  const [siteForm, setSiteForm] = useState<SiteFormState>({ url: '', name: '', monthly_pageviews: '', current_rpm: '', category: 'general' });
  const [editingSite, setEditingSite] = useState<GlobalSite | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['perfil', 'sites', 'preferencias', 'planos', 'api'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (fluxUserProfile) {
      setProfileFormData({
        name: fluxUserProfile.company || fluxUserProfile.email?.split('@')[0] || '',
        email: fluxUserProfile.email,
        country: fluxUserProfile.country || 'BR',
        timezone: fluxUserProfile.timezone || 'America/Sao_Paulo',
        currency: fluxUserProfile.currency || 'BRL',
      });
    }
  }, [fluxUserProfile]);

  useEffect(() => {
    if (fluxUserPreferences) {
      setPreferencesFormData(prev => ({...prev, ...fluxUserPreferences}));
    } else if (user?.id && !fluxDataIsLoading('coreUser')) {
      setPreferencesFormData(prev => ({ ...prev, client_id: user.id }));
    }
  }, [fluxUserPreferences, user?.id, fluxDataIsLoading]);

  useEffect(() => { setSearchParams({ tab: activeTab }, { replace: true }); }, [activeTab, setSearchParams]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... */ const { name, value } = e.target; setProfileFormData(prev => ({ ...prev, [name]: value })); };
  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { /* ... */ const { name, value, type } = e.target; if (type === 'checkbox') { const { checked } = e.target as HTMLInputElement; setPreferencesFormData(prev => ({...prev, [name]: checked})); } else { setPreferencesFormData(prev => ({ ...prev, [name]: value })); } };
  const handleToggleChange = (name: keyof UserPreferencesData) => { setPreferencesFormData(prev => ({...prev, [name]: !prev[name]})); };
  const handleSiteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... */ const { name, value } = e.target; setSiteForm(prev => ({ ...prev, [name]: value })); };


  const validateForm = useCallback((data: any, type: 'profile' | 'preferences' | 'site') => { /* ... */ const errors: Record<string, string> = {}; if (type === 'profile') { if (!data.name?.trim()) errors.name = 'Nome é obrigatório'; if (!data.email?.trim()) errors.email = 'Email é obrigatório'; if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { errors.email = 'Email inválido'; } } else if (type === 'preferences') { if (data.webhook_url && data.webhook_url.trim() !== '' && !/^https?:\/\/.+/.test(data.webhook_url)) { errors.webhook_url = 'Webhook URL inválida'; } if (data.slack_webhook && data.slack_webhook.trim() !== '' && !/^https:\/\/hooks\.slack\.com\/.+/.test(data.slack_webhook)) { errors.slack_webhook = 'Slack webhook inválido'; } } else if (type === 'site') { if (!data.url?.trim()) errors.url = 'URL do site é obrigatória.'; else try { new URL(data.url); } catch (_) { errors.url = 'URL do site inválida.';} if (isNaN(parseFloat(data.monthly_pageviews)) || parseFloat(data.monthly_pageviews) <=0) errors.monthly_pageviews = 'Pageviews deve ser um número positivo.'; if (isNaN(parseFloat(data.current_rpm)) || parseFloat(data.current_rpm) < 0) errors.current_rpm = 'RPM deve ser um número não-negativo.'; if (!data.name?.trim()) errors.name = 'Nome do site é obrigatório.';} setValidationErrors(errors); return Object.keys(errors).length === 0; }, []);

  const saveProfile = useCallback(async () => { /* ... usa updateUserProfile ... */ if (!user?.id || !profileFormData) return; if (!validateForm(profileFormData, 'profile')) { toast({ title: 'Dados Inválidos', variant: 'destructive' }); return; } setSavingProfile(true); const payloadToSave: Partial<Omit<UserProfileData, 'id' | 'email' | 'created_at' | 'updated_at'>> = { company: profileFormData.name, country: profileFormData.country, timezone: profileFormData.timezone, currency: profileFormData.currency }; const result = await updateUserProfile(payloadToSave); if (result.success) { toast({ title: 'Perfil Atualizado! ✅' }); setValidationErrors({}); } else { toast({ title: 'Erro', description: `Erro: ${result.error?.message || 'Tente novamente.'}`, variant: 'destructive' }); } setSavingProfile(false); }, [user?.id, profileFormData, validateForm, toast, updateUserProfile]);
  const savePreferences = useCallback(async () => { /* ... usa updateUserPreferences ... */ if (!user?.id || !preferencesFormData) return; if (!validateForm(preferencesFormData, 'preferences')) { toast({ title: 'Dados Inválidos', variant: 'destructive' }); return; } setSavingPreferences(true); const payloadToSave: Partial<Omit<UserPreferencesData, 'client_id'|'id'|'created_at'|'updated_at'>> = { ...preferencesFormData }; delete (payloadToSave as any).client_id; delete (payloadToSave as any).id; delete (payloadToSave as any).created_at; delete (payloadToSave as any).updated_at; const result = await updateUserPreferences(payloadToSave); if (result.success) { toast({ title: 'Preferências Salvas! ✅' }); setValidationErrors({}); } else { toast({ title: 'Erro', description: `Erro: ${result.error?.message || 'Tente novamente.'}`, variant: 'destructive' }); } setSavingPreferences(false); }, [user?.id, preferencesFormData, validateForm, toast, updateUserPreferences]);

  const handleSaveSite = useCallback(async () => {
    if (!user?.id || !validateForm(siteForm, 'site')) {
      toast({ title: "Dados do Site Inválidos", description: "Por favor, corrija os campos marcados.", variant: "destructive" });
      return;
    }
    setSavingSite(true);
    const siteDataPayload = {
        url: siteForm.url,
        name: siteForm.name,
        monthly_pageviews: parseFloat(siteForm.monthly_pageviews),
        current_rpm: parseFloat(siteForm.current_rpm),
        // category: siteForm.category, // Adicionar se o campo category estiver no formulário
    };

    try {
        let result;
        if (editingSite) { // Atualizar site existente
            result = await updateSiteViaHook(editingSite.id, siteDataPayload);
        } else { // Adicionar novo site
            result = await addSiteViaHook(siteDataPayload);
        }

        if (result.success) {
            toast({ title: editingSite ? "Site Atualizado! ✅" : "Site Adicionado! ✅" });
            setSiteForm({ url: '', name: '', monthly_pageviews: '', current_rpm: '', category: 'general' }); // Reset form
            setEditingSite(null);
            // refreshData('sites') é chamado dentro dos hooks addSiteViaHook/updateSiteViaHook
        } else {
            throw result.error || new Error(editingSite ? "Falha ao atualizar site." : "Falha ao adicionar site.");
        }
    } catch (error: any) {
        toast({ title: "Erro ao Salvar Site", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
        setSavingSite(false);
    }
  }, [user?.id, siteForm, editingSite, validateForm, toast, addSiteViaHook, updateSiteViaHook]);

  const handleEditSite = (site: GlobalSite) => {
    setEditingSite(site);
    setSiteForm({
        id: site.id,
        url: site.url,
        name: site.name || '',
        monthly_pageviews: site.monthly_pageviews?.toString() || '',
        current_rpm: site.current_rpm?.toString() || '',
        category: (site.category as SiteCategory) || 'general', // Cast se necessário
    });
    setActiveTab('sites'); // Mudar para a aba de sites se não estiver lá
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Token Copiado!", description: "Token de otimização copiado para a área de transferência." });
  };


  const isFeatureEnabled = useCallback((feature: string) => { /* ... */ if (!fluxUserProfile) return false; const planFeatures = { free: ['basic_reports', 'email_support'], trial: ['basic_reports', 'email_support', 'api_access'], basic: ['basic_reports', 'email_support', 'api_access', 'advanced_reports'], pro: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine'], enterprise: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine', 'white_label', 'custom_integrations'] }; return planFeatures[fluxUserProfile.plan as keyof typeof planFeatures]?.includes(feature) || false; }, [fluxUserProfile]);
  const currentRateLimit = rateLimits && rateLimits.length > 0 ? rateLimits.find(rl => rl.operation === 'analysis') || rateLimits[0] : null;

  // === RENDER ===
  if (fluxDataIsLoading('coreUser') && !fluxUserProfile && !fluxUserPreferences) {
    return ( <ConfigContainer><LoadingContainer><LoadingSpinner /><h3>Carregando Configurações...</h3></LoadingContainer></ConfigContainer>);
  }

  return (
    <ConfigContainer>
      <Header><Title>⚙️ Configurações</Title><Subtitle>Gerencie suas preferências e configurações da conta</Subtitle></Header>
      <TabsContainer>
        <Tab active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')}>👤 Perfil</Tab>
        <Tab active={activeTab === 'sites'} onClick={() => setActiveTab('sites')}>🌐 Sites</Tab>
        <Tab active={activeTab === 'preferencias'} onClick={() => setActiveTab('preferencias')}>⚙️ Preferências</Tab>
        <Tab active={activeTab === 'planos'} onClick={() => setActiveTab('planos')}>💎 Planos</Tab>
        <Tab active={activeTab === 'api'} onClick={() => setActiveTab('api')}>🔗 API & Integrações</Tab>
      </TabsContainer>

      {activeTab === 'perfil' && fluxUserProfile && ( /* ... JSX Aba Perfil ... */ <ContentSection><SectionTitle>👤 Informações do Perfil</SectionTitle><FormGrid><FormGroup><Label htmlFor="name">Nome/Empresa <RequiredIndicator>*</RequiredIndicator></Label><Input id="name" name="name" type="text" value={profileFormData.name || ''} onChange={handleProfileChange} placeholder="Seu nome ou empresa" hasError={!!validationErrors.name} />{validationErrors.name && (<ErrorMessage>⚠️ {validationErrors.name}</ErrorMessage>)}</FormGroup><FormGroup><Label htmlFor="email">Email <RequiredIndicator>*</RequiredIndicator></Label><Input id="email" name="email" type="email" value={profileFormData.email || ''} onChange={handleProfileChange} placeholder="seu@email.com" hasError={!!validationErrors.email} disabled />{validationErrors.email && (<ErrorMessage>⚠️ {validationErrors.email}</ErrorMessage>)} <HelpText>O email não pode ser alterado após o registro.</HelpText></FormGroup><FormGroup><Label htmlFor="timezone">Fuso Horário</Label><Select id="timezone" name="timezone" value={profileFormData.timezone || 'America/Sao_Paulo'} onChange={handleProfileChange}>{TIMEZONES.map(tz => (<option key={tz.value} value={tz.value}>{tz.label}</option>))}</Select></FormGroup><FormGroup><Label htmlFor="currency">Moeda</Label><Select id="currency" name="currency" value={profileFormData.currency || 'BRL'} onChange={handleProfileChange}><option value="BRL">🇧🇷 Real Brasileiro (BRL)</option> <option value="USD">🇺🇸 Dólar Americano (USD)</option> <option value="EUR">🇪🇺 Euro (EUR)</option></Select></FormGroup></FormGrid><InfoBox type="info"><InfoTitle type="info">📊 Informações da Conta</InfoTitle><InfoText><strong>Plano Atual:</strong> {fluxUserProfile.plan.toUpperCase()} • <strong> Status:</strong> {fluxUserProfile.subscription_status || 'ativo'} • <strong> Membro desde:</strong> {new Date(fluxUserProfile.created_at).toLocaleDateString('pt-BR')}{fluxUserProfile.trial_end_date && (<> <br /> <strong>Trial expira em:</strong> {new Date(fluxUserProfile.trial_end_date).toLocaleDateString('pt-BR')} </>)}</InfoText></InfoBox><ActionButtons><ActionButton variant="secondary" onClick={() => navigate('/dashboard')}>← Voltar</ActionButton><ActionButton variant="primary" onClick={saveProfile} disabled={savingProfile} loading={savingProfile}>{savingProfile ? '💾 Salvando...' : '💾 Salvar Perfil'}</ActionButton></ActionButtons></ContentSection> )}

      {activeTab === 'sites' && (
        <ContentSection>
          <SectionTitle>🌐 Gerenciar Sites</SectionTitle>
          <FormGrid>
            <FormGroup><Label htmlFor="site_url">URL do Site <RequiredIndicator>*</RequiredIndicator></Label><Input id="url" name="url" type="url" placeholder="https://seusite.com" value={siteForm.url} onChange={handleSiteFormChange} hasError={!!validationErrors.url} />{validationErrors.url && <ErrorMessage>⚠️ {validationErrors.url}</ErrorMessage>}</FormGroup>
            <FormGroup><Label htmlFor="site_name">Nome do Site <RequiredIndicator>*</RequiredIndicator></Label><Input id="name" name="name" type="text" placeholder="Meu Site Incrível" value={siteForm.name} onChange={handleSiteFormChange} hasError={!!validationErrors.name}/>{validationErrors.name && <ErrorMessage>⚠️ {validationErrors.name}</ErrorMessage>}</FormGroup>
            <FormGroup><Label htmlFor="monthly_pageviews">Pageviews Mensais <RequiredIndicator>*</RequiredIndicator></Label><Input id="monthly_pageviews" name="monthly_pageviews" type="number" placeholder="100000" value={siteForm.monthly_pageviews} onChange={handleSiteFormChange} hasError={!!validationErrors.monthly_pageviews} />{validationErrors.monthly_pageviews && <ErrorMessage>⚠️ {validationErrors.monthly_pageviews}</ErrorMessage>}</FormGroup>
            <FormGroup><Label htmlFor="current_rpm">RPM Atual (R$) <RequiredIndicator>*</RequiredIndicator></Label><Input id="current_rpm" name="current_rpm" type="number" step="0.01" placeholder="5.50" value={siteForm.current_rpm} onChange={handleSiteFormChange} hasError={!!validationErrors.current_rpm} />{validationErrors.current_rpm && <ErrorMessage>⚠️ {validationErrors.current_rpm}</ErrorMessage>}</FormGroup>
            <FormGroup><Label htmlFor="site_category">Categoria Principal</Label><Select id="category" name="category" value={siteForm.category} onChange={handleSiteFormChange}>{SITE_CATEGORIES_OPTIONS.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}</Select></FormGroup>
          </FormGrid>
          <ActionButtons>
            <ActionButton variant="primary" onClick={handleSaveSite} disabled={savingSite} loading={savingSite}>
              {editingSite ? (savingSite ? '💾 Atualizando...' : '💾 Atualizar Site') : (savingSite ? '➕ Adicionando...' : '➕ Adicionar Site')}
            </ActionButton>
            {editingSite && <ActionButton variant="secondary" onClick={() => { setEditingSite(null); setSiteForm({ url: '', name: '', monthly_pageviews: '', current_rpm: '', category: 'general' }); }}>Cancelar Edição</ActionButton>}
          </ActionButtons>

          <SiteListContainer>
            <SectionTitle style={{marginTop: '30px', fontSize: '20px'}}>Sites Cadastrados ({fluxSites.length})</SectionTitle>
            {fluxSites.length === 0 && <p>Nenhum site cadastrado ainda.</p>}
            {fluxSites.map(site => (
              <SiteListItem key={site.id}>
                <div>
                  <SiteUrl>{site.name || site.url}</SiteUrl>
                  <div style={{fontSize: '0.8em', color: '#666'}}>RPM: R$ {site.current_rpm?.toFixed(2)} | Pageviews: {site.monthly_pageviews?.toLocaleString('pt-BR')}</div>
                  {site.optimization_token && <small>Token: <SiteToken onClick={() => handleCopyToken(site.optimization_token!)} title="Copiar Token">{site.optimization_token.substring(0,15)}...</SiteToken></small>}
                </div>
                <div>
                  <StatusBadge status={site.script_installed ? 'active' : 'inactive'} size="small">{site.script_installed ? 'Script Ativo' : 'Script Inativo'}</StatusBadge>
                  <ActionButton variant="secondary" size="small" style={{marginLeft: '10px'}} onClick={() => handleEditSite(site)}>✏️ Editar</ActionButton>
                </div>
              </SiteListItem>
            ))}
          </SiteListContainer>
        </ContentSection>
      )}

      {activeTab === 'preferencias' && ( /* ... JSX Aba Preferências ... */ <ContentSection><SectionTitle>⚙️ Preferências do Sistema</SectionTitle><ToggleContainer><ToggleInfo><ToggleTitle>🔔 Notificações por Email</ToggleTitle><ToggleDescription>Receba notificações sobre análises concluídas, alertas de performance e atualizações importantes</ToggleDescription></ToggleInfo><Toggle enabled={preferencesFormData.email_notifications || false} onClick={() => handleToggleChange('email_notifications')} /></ToggleContainer><ToggleContainer><ToggleInfo><ToggleTitle>📱 Notificações SMS <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Receba alertas críticos de performance via SMS</ToggleDescription></ToggleInfo><Toggle enabled={preferencesFormData.sms_notifications || false} disabled={!isFeatureEnabled('sms_notifications')} onClick={() => isFeatureEnabled('sms_notifications') && handleToggleChange('sms_notifications')} /></ToggleContainer><ToggleContainer><ToggleInfo><ToggleTitle>⚡ Otimização Automática <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Permitir que a IA aplique otimizações automaticamente</ToggleDescription></ToggleInfo><Toggle enabled={preferencesFormData.auto_optimization || false} disabled={!isFeatureEnabled('auto_optimization')} onClick={() => isFeatureEnabled('auto_optimization') && handleToggleChange('auto_optimization')} /></ToggleContainer><FormGrid><FormGroup><Label htmlFor="report_frequency">📊 Frequência de Relatórios</Label><Select id="report_frequency" name="report_frequency" value={preferencesFormData.report_frequency || 'weekly'} onChange={handlePreferencesChange} ><option value="daily">Diário</option> <option value="weekly">Semanal</option> <option value="monthly">Mensal</option></Select></FormGroup> <FormGroup><Label htmlFor="language">🌐 Idioma</Label><Select id="language" name="language" value={preferencesFormData.language || 'pt-BR'} onChange={handlePreferencesChange}>{LANGUAGES.map(lang => (<option key={lang.value} value={lang.value}>{lang.label}</option>))}</Select></FormGroup> <FormGroup><Label htmlFor="theme">🎨 Tema</Label><Select id="theme" name="theme" value={preferencesFormData.theme || 'light'} onChange={handlePreferencesChange}><option value="light">☀️ Claro</option> <option value="dark">🌙 Escuro</option> <option value="auto">🔄 Automático</option></Select></FormGroup></FormGrid><ActionButtons><ActionButton variant="primary" onClick={savePreferences} disabled={savingPreferences} loading={savingPreferences}>{savingPreferences ? '💾 Salvando...' : '💾 Salvar Preferências'}</ActionButton></ActionButtons></ContentSection> )}
      {activeTab === 'planos' && fluxUserProfile && ( /* ... JSX Aba Planos ... */ <ContentSection><SectionTitle>💎 Planos e Assinatura</SectionTitle><InfoBox type="info"><InfoTitle type="info">📋 Plano Atual</InfoTitle><InfoText>Você está no plano <strong>{fluxUserProfile.plan.toUpperCase()}</strong>. {fluxUserProfile.trial_end_date && (<> Seu período de teste expira em <strong>{new Date(fluxUserProfile.trial_end_date).toLocaleDateString('pt-BR')}</strong>.</>)} {rateLimits && rateLimits.length > 0 ? rateLimits.find(rl => rl.operation === 'analysis') || rateLimits[0] : null ? (<> <br /> <strong>Uso atual:</strong> {rateLimits.find(rl => rl.operation === 'analysis')?.count || 0} de {rateLimits.find(rl => rl.operation === 'analysis')?.operation || 'análises'} este período.</>) : 'Nenhum limite de análise encontrado.'}</InfoText></InfoBox><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>{PLANS.map((plan) => ( <div key={plan.id} style={{ border: fluxUserProfile.plan === plan.id ? '2px solid #007AFF' : '1px solid #E5E5EA', borderRadius: '16px', padding: '24px', background: '#FFFFFF', position: 'relative', transition: 'all 0.3s ease' }}> {plan.popular && ( <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #FF9500 0%, #FFAD33 100%)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}> ⭐ Mais Popular </div> )} <div style={{ textAlign: 'center', marginBottom: '24px' }}> <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}> {plan.name} </h3> <div style={{ fontSize: '36px', fontWeight: '700', color: '#007AFF', marginBottom: '8px' }}> R$ {plan.price} <span style={{ fontSize: '16px', color: '#6D6D70', fontWeight: '500' }}> /{plan.billing_period === 'monthly' ? 'mês' : 'ano'} </span> </div> </div> <div style={{ marginBottom: '24px' }}> {plan.features.map((feature, index) => ( <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: index < plan.features.length - 1 ? '1px solid #F2F2F7' : 'none' }}> <span style={{ marginRight: '12px', fontSize: '16px' }}> {feature.included ? '✅' : '❌'} </span> <div style={{ flex: 1 }}> <span style={{ color: feature.included ? '#1D1D1F' : '#8E8E93', fontWeight: '500' }}> {feature.name} </span> {feature.limit && ( <span style={{ color: '#6D6D70', fontSize: '14px', marginLeft: '8px' }}> ({feature.limit}) </span> )} </div> </div> ))} </div> <ActionButton variant={fluxUserProfile.plan === plan.id ? 'secondary' : 'primary'} style={{ width: '100%' }} onClick={() => { if (fluxUserProfile.plan !== plan.id) { navigate(`/upgrade?plan=${plan.id}`); } }} disabled={fluxUserProfile.plan === plan.id} > {fluxUserProfile.plan === plan.id ? '✅ Plano Atual' : `⬆️ Fazer Upgrade`} </ActionButton> </div> ))}</div></ContentSection> )}
      {activeTab === 'api' && ( /* ... JSX Aba API ... */ <ContentSection><SectionTitle>🔗 API & Integrações</SectionTitle><ToggleContainer><ToggleInfo><ToggleTitle>🔑 Acesso à API <ToggleBadge type="pro">PRO</ToggleBadge></ToggleTitle><ToggleDescription>Habilitar acesso programático aos dados e funcionalidades via API REST</ToggleDescription></ToggleInfo><Toggle enabled={preferencesFormData.api_access_enabled || false} disabled={!isFeatureEnabled('api_access')} onClick={() => isFeatureEnabled('api_access') && handleToggleChange('api_access_enabled')} /></ToggleContainer>{preferencesFormData.api_access_enabled && (<> <FormGrid> <FormGroup> <Label htmlFor="webhook_url">🔗 Webhook URL</Label> <Input id="webhook_url" name="webhook_url" type="url" value={preferencesFormData.webhook_url || ''} onChange={handlePreferencesChange} placeholder="https://seusite.com/webhook" hasError={!!validationErrors.webhook_url} /> {validationErrors.webhook_url && (<ErrorMessage>⚠️ {validationErrors.webhook_url}</ErrorMessage>)} <HelpText>URL para receber notificações quando análises são concluídas</HelpText> </FormGroup> <FormGroup> <Label htmlFor="slack_webhook">💬 Slack Webhook</Label> <Input id="slack_webhook" name="slack_webhook" type="url" value={preferencesFormData.slack_webhook || ''} onChange={handlePreferencesChange} placeholder="https://hooks.slack.com/services/..." hasError={!!validationErrors.slack_webhook} /> {validationErrors.slack_webhook && (<ErrorMessage>⚠️ {validationErrors.slack_webhook}</ErrorMessage>)} <HelpText>URL do webhook do Slack para receber notificações no canal</HelpText> </FormGroup> </FormGrid> <InfoBox type="info"> <InfoTitle type="info">📖 Documentação da API</InfoTitle> <InfoText> Acesse nossa documentação completa da API em{' '} <strong>https://api.fluxrevenue.com.br/docs</strong> para integrar o Flux Revenue com seus sistemas e workflows. </InfoText> </InfoBox> </>)}<ActionButtons><ActionButton variant="secondary" onClick={() => window.open('https://api.fluxrevenue.com.br/docs', '_blank')}>📖 Ver Documentação</ActionButton><ActionButton variant="primary" onClick={savePreferences} disabled={savingPreferences} loading={savingPreferences}>{savingPreferences ? '💾 Salvando...' : '💾 Salvar Configurações API'}</ActionButton></ActionButtons></ContentSection> )}
    </ConfigContainer>
  );
};

export default Configuracoes;
