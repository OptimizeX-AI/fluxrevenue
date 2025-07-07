// src/components/Configuracoes.tsx - ENTERPRISE GRADE COMPLETE SYSTEM CORRIGIDO

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

type BrazilianRegion = 'br_sp_capital' | 'br_rj_capital' | 'br_sp_interior' | 'br_sul' | 'br_nordeste' | 'br_outros';
type SiteCategory = 'finance_insurance_legal' | 'technology_b2b' | 'health_wellness' | 'real_estate' | 'education' | 'entertainment_lifestyle' | 'general';

// === INTERFACES ENTERPRISE COMPLETAS ===
interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'trial' | 'basic' | 'pro' | 'enterprise';
  trial_end_date?: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
  next_billing_date?: string;
  created_at: string;
  updated_at?: string;
  // ✅ Campos essenciais para o backend
  company?: string;
  phone?: string;
  country: string;
  timezone: string;
  currency: 'BRL' | 'USD' | 'EUR';
  tax_id?: string;
}

interface UserSettings {
  id?: string;
  client_id: string;
  // ✅ CORREÇÃO: Campos que existem na tabela real user_settings
  notifications_enabled: boolean;
  auto_optimization: boolean;
  report_frequency: 'daily' | 'weekly' | 'monthly';
  email_notifications: boolean;
  sms_notifications: boolean;
  // ✅ Campos adicionais para UI (podem não existir na tabela)
  webhook_notifications?: boolean;
  email_reports?: boolean;
  report_format?: 'pdf' | 'excel' | 'dashboard';
  timezone?: string;
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  currency?: 'BRL' | 'USD' | 'EUR';
  theme?: 'light' | 'dark' | 'auto';
  api_access_enabled?: boolean;
  webhook_url?: string;
  slack_webhook?: string;
  ml_enabled?: boolean;
  rl_enabled?: boolean;
  ab_testing_enabled?: boolean;
  optimization_aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
  seasonality_adjustment?: boolean;
  data_retention_days?: number;
  created_at?: string;
  updated_at?: string;
}

interface SiteConfig {
  id?: string;
  url: string;
  client_id: string;
  name: string;
  category: SiteCategory;
  content_niche?: string;
  country: string;
  primary_region: BrazilianRegion;
  language: string;
  geographic_distribution?: Array<{
    region: BrazilianRegion;
    percentage: number;
    tier: number;
  }>;
  monthly_pageviews?: number;
  current_rpm?: number;
  target_rpm?: number;
  script_installed: boolean;
  optimization_enabled: boolean;
  adsense_id?: string;
  analytics_id?: string;
  optimization_token?: string;
  api_enabled: boolean;
  webhook_enabled: boolean;
  ab_testing_enabled: boolean;
  mobile_optimization: boolean;
  lazy_loading_enabled: boolean;
  ad_placement_auto: boolean;
  targeting_enabled: boolean;
  cache_enabled: boolean;
  cache_ttl: number;
  cdn_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

interface RateLimitInfo {
  id: string;
  user_id: string; // ✅ CORREÇÃO: Campo correto baseado no schema
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

// === ANIMATION KEYFRAMES ENTERPRISE ===
const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const saveSuccess = keyframes`
  0% { background: linear-gradient(135deg, #30D158 0%, #34C759 100%); }
  50% { background: linear-gradient(135deg, #00C851 0%, #30D158 100%); }
  100% { background: linear-gradient(135deg, #30D158 0%, #34C759 100%); }
`;

const upgradeShine = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

// === STYLED COMPONENTS ENTERPRISE ===
const ConfigContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #F2F2F7;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #E5E5EA;
  border-top: 4px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #1D1D1F 0%, #007AFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  letter-spacing: -0.025em;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #6D6D70;
  margin: 0 0 8px 0;
  line-height: 1.47;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const TabsContainer = styled.div`
  display: flex;
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  gap: 4px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 14px 18px;
  border: none;
  border-radius: 10px;
  background: ${props => props.active ?
    'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)' :
    'transparent'};
  color: ${props => props.active ? '#FFFFFF' : '#6D6D70'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  
  ${props => props.active && css`
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);
  `}
  
  &:hover {
    background: ${props => props.active ?
      'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)' :
      'rgba(0, 122, 255, 0.05)'};
    transform: translateY(-1px);
  }
`;

const ContentSection = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${slideInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #007AFF 0%, #30D158 100%);
    border-radius: 20px 20px 0 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 24px 0;
  letter-spacing: -0.017em;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RequiredIndicator = styled.span`
  color: #FF3B30;
  font-size: 14px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 16px 20px;
  border: 2px solid ${props => props.hasError ? '#FF3B30' : '#E5E5EA'};
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#FF3B30' : '#007AFF'};
    box-shadow: 0 0 0 4px ${props => props.hasError ?
      'rgba(255, 59, 48, 0.16)' :
      'rgba(0, 122, 255, 0.16)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #F2F2F7;
    color: #8E8E93;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: #8E8E93;
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 16px 20px;
  border: 2px solid ${props => props.hasError ? '#FF3B30' : '#E5E5EA'};
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#FF3B30' : '#007AFF'};
    box-shadow: 0 0 0 4px ${props => props.hasError ?
      'rgba(255, 59, 48, 0.16)' :
      'rgba(0, 122, 255, 0.16)'};
    transform: translateY(-1px);
  }
`;

const Textarea = styled.textarea<{ hasError?: boolean }>`
  padding: 16px 20px;
  border: 2px solid ${props => props.hasError ? '#FF3B30' : '#E5E5EA'};
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  resize: vertical;
  min-height: 120px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#FF3B30' : '#007AFF'};
    box-shadow: 0 0 0 4px ${props => props.hasError ?
      'rgba(255, 59, 48, 0.16)' :
      'rgba(0, 122, 255, 0.16)'};
    transform: translateY(-1px);
  }
`;

const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 13px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HelpText = styled.div`
  color: #6D6D70;
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.4;
`;

const InfoBox = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(48, 209, 88, 0.05)';
      case 'warning': return 'rgba(255, 149, 0, 0.05)';
      case 'error': return 'rgba(255, 59, 48, 0.05)';
      default: return 'rgba(0, 122, 255, 0.05)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'success': return 'rgba(48, 209, 88, 0.15)';
      case 'warning': return 'rgba(255, 149, 0, 0.15)';
      case 'error': return 'rgba(255, 59, 48, 0.15)';
      default: return 'rgba(0, 122, 255, 0.15)';
    }
  }};
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
`;

const InfoTitle = styled.h4<{ type: string }>`
  color: ${props => {
    switch (props.type) {
      case 'success': return '#30D158';
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#007AFF';
    }
  }};
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #6D6D70;
  margin: 0;
  line-height: 1.5;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid #F2F2F7;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleInfo = styled.div`
  flex: 1;
  margin-right: 16px;
`;

const ToggleTitle = styled.h4`
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleBadge = styled.span<{ type: 'pro' | 'enterprise' | 'beta' }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    switch (props.type) {
      case 'pro': return 'rgba(48, 209, 88, 0.1)';
      case 'enterprise': return 'rgba(175, 82, 222, 0.1)';
      case 'beta': return 'rgba(255, 149, 0, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'pro': return '#30D158';
      case 'enterprise': return '#AF52DE';
      case 'beta': return '#FF9500';
      default: return '#8E8E93';
    }
  }};
`;

const ToggleDescription = styled.p`
  font-size: 15px;
  color: #6D6D70;
  margin: 0;
  line-height: 1.4;
`;

const Toggle = styled.button<{ enabled: boolean; disabled?: boolean }>`
  width: 64px;
  height: 38px;
  border-radius: 19px;
  border: none;
  background: ${props =>
    props.disabled ? '#E5E5EA' :
    props.enabled ? 'linear-gradient(135deg, #30D158 0%, #34C759 100%)' :
    '#E5E5EA'};
  position: relative;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.enabled && !props.disabled && css`
    box-shadow: 0 2px 8px rgba(48, 209, 88, 0.24);
  `}
  
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.enabled ? '29px' : '3px'};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #FFFFFF;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:hover:not(:disabled) {
    transform: scale(1.02);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  saving?: boolean;
  loading?: boolean;
}>`
  background: ${props => {
    switch (props.variant) {
      case 'danger': return 'linear-gradient(135deg, #FF3B30 0%, #FF453A 100%)';
      case 'success': return 'linear-gradient(135deg, #30D158 0%, #34C759 100%)';
      case 'secondary': return 'transparent';
      default: return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)';
    }
  }};
  color: ${props => props.variant === 'secondary' ? '#007AFF' : '#FFFFFF'};
  border: ${props => props.variant === 'secondary' ? '2px solid #E5E5EA' : 'none'};
  border-radius: 12px;
  padding: 16px 28px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 52px;
  min-width: 140px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  ${props => props.saving && css`
    animation: ${saveSuccess} 0.8s ease;
  `}
  
  ${props => !props.variant || props.variant === 'primary' ? css`
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);
  ` : ''}
  
  &:hover:not(:disabled) {
    background: ${props => {
      switch (props.variant) {
        case 'danger': return 'linear-gradient(135deg, #E52D27 0%, #FF3B30 100%)';
        case 'success': return 'linear-gradient(135deg, #28B946 0%, #30D158 100%)';
        case 'secondary': return '#F2F2F7';
        default: return 'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)';
      }
    }};
    transform: translateY(-2px);
    box-shadow: ${props =>
      props.variant === 'secondary' ? '0 4px 16px rgba(0, 0, 0, 0.08)' :
      '0 8px 32px rgba(0, 122, 255, 0.32)'
    };
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusBadge = styled.span<{
  status: 'active' | 'inactive' | 'pending' | 'error';
  size?: 'small' | 'medium';
}>`
  padding: ${props => props.size === 'small' ? '4px 10px' : '6px 14px'};
  border-radius: 20px;
  font-size: ${props => props.size === 'small' ? '11px' : '12px'};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(48, 209, 88, 0.1)';
      case 'pending': return 'rgba(255, 149, 0, 0.1)';
      case 'error': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#30D158';
      case 'pending': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(48, 209, 88, 0.2)';
      case 'pending': return 'rgba(255, 149, 0, 0.2)';
      case 'error': return 'rgba(255, 59, 48, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
`;

// === CONSTANTS ===
const SITE_CATEGORIES = [
  {
    value: 'finance_insurance_legal',
    label: '💰 Finanças, Seguros e Jurídico',
    description: 'Maior valor de CPC - Bancos, seguros, advogados',
    tier: 'premium'
  },
  {
    value: 'technology_b2b',
    label: '💻 Tecnologia e B2B',
    description: 'Software, SaaS, serviços empresariais',
    tier: 'high'
  },
  {
    value: 'health_wellness',
    label: '🏥 Saúde e Bem-Estar',
    description: 'Medicina, fitness, nutrição - Nicho YMYL',
    tier: 'high'
  },
  {
    value: 'real_estate',
    label: '🏠 Imobiliário',
    description: 'Imóveis, construção, decoração',
    tier: 'medium-high'
  },
  {
    value: 'education',
    label: '🎓 Educação',
    description: 'Cursos, escolas, capacitação',
    tier: 'medium'
  },
  {
    value: 'entertainment_lifestyle',
    label: '🎭 Entretenimento e Lifestyle',
    description: 'Entretenimento, moda, celebridades',
    tier: 'volume'
  },
  {
    value: 'general',
    label: '📂 Geral',
    description: 'Categoria geral - benchmark médio',
    tier: 'medium'
  }
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: '🇧🇷 São Paulo (UTC-3)' },
  { value: 'America/New_York', label: '🇺🇸 Nova York (UTC-5)' },
  { value: 'Europe/London', label: '🇬🇧 Londres (UTC+0)' },
  { value: 'Europe/Paris', label: '🇫🇷 Paris (UTC+1)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Tóquio (UTC+9)' }
];

const LANGUAGES = [
  { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'es-ES', label: '🇪🇸 Español' }
];

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'BRL',
    billing_period: 'monthly',
    features: [
      { name: 'Sites', limit: '1', included: true },
      { name: 'Análises', limit: '3/mês', included: true },
      { name: 'Relatórios básicos', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'API access', included: false },
      { name: 'Otimização automática', included: false },
      { name: 'A/B testing', included: false }
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 47,
    currency: 'BRL',
    billing_period: 'monthly',
    features: [
      { name: 'Sites', limit: '3', included: true },
      { name: 'Análises', limit: '25/mês', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'API access', included: true },
      { name: 'Otimização automática', included: false },
      { name: 'A/B testing', included: false }
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 97,
    currency: 'BRL',
    billing_period: 'monthly',
    popular: true,
    features: [
      { name: 'Sites', limit: '10', included: true },
      { name: 'Análises', limit: 'Ilimitadas', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'API access', included: true },
      { name: 'Otimização automática', included: true },
      { name: 'A/B testing', included: true },
      { name: 'ML/RL Engine', included: true }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 297,
    currency: 'BRL',
    billing_period: 'monthly',
    enterprise: true,
    features: [
      { name: 'Sites', limit: 'Ilimitados', included: true },
      { name: 'Análises', limit: 'Ilimitadas', included: true },
      { name: 'API personalizada', included: true },
      { name: 'Suporte dedicado', included: true },
      { name: 'Onboarding personalizado', included: true },
      { name: 'White-label completo', included: true },
      { name: 'SLA 99.9%', included: true }
    ]
  }
];

// === COMPONENT PRINCIPAL ===
const Configuracoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData } = useFluxData();

  // ✅ Estados otimizados
  const [activeTab, setActiveTab] = useState('perfil');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    client_id: user?.id || '',
    notifications_enabled: true,
    auto_optimization: false,
    report_frequency: 'weekly',
    email_notifications: true,
    sms_notifications: false,
    webhook_notifications: false,
    email_reports: true,
    report_format: 'dashboard',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'BRL',
    theme: 'light',
    api_access_enabled: false,
    webhook_url: '',
    slack_webhook: '',
    ml_enabled: false,
    rl_enabled: false,
    ab_testing_enabled: false,
    optimization_aggressiveness: 'moderate',
    seasonality_adjustment: true,
    data_retention_days: 365
  });
  
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ✅ Initialize from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['perfil', 'sites', 'preferencias', 'planos', 'api'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ✅ CORREÇÃO CRÍTICA: Fetch all user data com campos corretos
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // ✅ CORREÇÃO: Queries com campos corretos e .maybeSingle()
        const [profileResult, settingsResult, rateLimitResult] = await Promise.allSettled([
          supabase.from('clients').select('*').eq('id', user.id).maybeSingle(), // ✅ CORRETO
          supabase.from('user_settings').select('*').eq('client_id', user.id).maybeSingle(), // ✅ CORRETO
          supabase.from('rate_limits').select('*').eq('user_id', user.id).maybeSingle() // ✅ CORRETO
        ]);

        // ✅ Process profile
        if (profileResult.status === 'fulfilled' && profileResult.value.data) {
          const profileData = profileResult.value.data;
          setUserProfile({
            id: profileData.id,
            name: profileData.company || profileData.email || 'Usuário',
            email: profileData.email,
            plan: profileData.plan || 'free',
            trial_end_date: profileData.trial_end_date,
            subscription_status: profileData.subscription_status || 'active',
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
            company: profileData.company,
            country: profileData.country || 'BR',
            timezone: profileData.timezone || 'America/Sao_Paulo',
            currency: profileData.currency || 'BRL'
          });
        } else {
          console.log('ℹ️ Profile not found or error:', profileResult.status === 'rejected' ? profileResult.reason : 'No data');
        }

        // ✅ CORREÇÃO: Process settings with proper fallback
        if (settingsResult.status === 'fulfilled') {
          if (settingsResult.value.data) {
            // ✅ Settings exist - merge with defaults
            setUserSettings(prev => ({
              ...prev,
              ...settingsResult.value.data,
              client_id: user.id
            }));
            console.log('✅ User settings loaded:', settingsResult.value.data);
          } else {
            // ✅ No settings found - will create on first save
            console.log('ℹ️ No user settings found, using defaults');
            setUserSettings(prev => ({
              ...prev,
              client_id: user.id
            }));
          }
        } else {
          console.warn('⚠️ Settings query failed:', settingsResult.reason);
        }

        // ✅ Process rate limits
        if (rateLimitResult.status === 'fulfilled' && rateLimitResult.value.data) {
          setRateLimitInfo(rateLimitResult.value.data);
          console.log('✅ Rate limits loaded:', rateLimitResult.value.data);
        } else {
          console.log('ℹ️ No rate limits found or error:', rateLimitResult.status === 'rejected' ? rateLimitResult.reason : 'No data');
        }

      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar configurações do usuário.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, toast]);

  // ✅ Validation functions
  const validateForm = useCallback((data: any, type: 'profile' | 'settings') => {
    const errors: Record<string, string> = {};
    
    if (type === 'profile') {
      if (!data.name?.trim()) errors.name = 'Nome é obrigatório';
      if (!data.email?.trim()) errors.email = 'Email é obrigatório';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Email deve ter formato válido';
      }
    }
    
    if (type === 'settings') {
      if (data.webhook_url && !/^https?:\/\/.+/.test(data.webhook_url)) {
        errors.webhook_url = 'Webhook URL deve começar com http:// ou https://';
      }
      if (data.slack_webhook && !/^https:\/\/hooks\.slack\.com\/.+/.test(data.slack_webhook)) {
        errors.slack_webhook = 'Slack webhook deve ser uma URL válida do Slack';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // ✅ CORREÇÃO CRÍTICA: Save functions com UPSERT
  const saveProfile = useCallback(async () => {
    if (!user?.id || !userProfile) return;
    
    if (!validateForm(userProfile, 'profile')) {
      toast({
        title: 'Dados Inválidos',
        description: 'Verifique os campos marcados em vermelho.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          company: userProfile.name,
          email: userProfile.email,
          country: userProfile.country,
          timezone: userProfile.timezone,
          currency: userProfile.currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Perfil Atualizado! ✅',
        description: 'Suas informações foram salvas com sucesso.'
      });
      
      setValidationErrors({});
      
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar perfil. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [user?.id, userProfile, validateForm, toast]);

  const saveSettings = useCallback(async () => {
    if (!user?.id) return;
    
    if (!validateForm(userSettings, 'settings')) {
      toast({
        title: 'Dados Inválidos',
        description: 'Verifique os campos marcados em vermelho.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // ✅ CORREÇÃO CRÍTICA: UPSERT para user_settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          client_id: user.id,
          notifications_enabled: userSettings.notifications_enabled,
          auto_optimization: userSettings.auto_optimization,
          report_frequency: userSettings.report_frequency,
          email_notifications: userSettings.email_notifications,
          sms_notifications: userSettings.sms_notifications,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id' // ✅ CRÍTICO: Conflict resolution
        });

      if (error) throw error;

      toast({
        title: 'Configurações Salvas! ✅',
        description: 'Suas preferências foram atualizadas.'
      });
      
      setValidationErrors({});
      
      // ✅ Refresh data to get updated settings
      setTimeout(() => {
        const fetchUpdatedSettings = async () => {
          const { data } = await supabase
            .from('user_settings')
            .select('*')
            .eq('client_id', user.id)
            .maybeSingle();
          
          if (data) {
            setUserSettings(prev => ({ ...prev, ...data }));
          }
        };
        fetchUpdatedSettings();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [user?.id, userSettings, validateForm, toast]);

  // ✅ Helper functions
  const isFeatureEnabled = useCallback((feature: string) => {
    if (!userProfile) return false;
    
    const planFeatures = {
      free: ['basic_reports', 'email_support'],
      trial: ['basic_reports', 'email_support', 'api_access'],
      basic: ['basic_reports', 'email_support', 'api_access', 'advanced_reports'],
      pro: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine'],
      enterprise: ['basic_reports', 'email_support', 'api_access', 'advanced_reports', 'auto_optimization', 'ab_testing', 'ml_engine', 'white_label', 'custom_integrations']
    };
    
    return planFeatures[userProfile.plan]?.includes(feature) || false;
  }, [userProfile]);

  // === RENDER ===
  if (loading) {
    return (
      <ConfigContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <h3>Carregando Configurações...</h3>
          <p>Buscando dados do usuário e preferências</p>
        </LoadingContainer>
      </ConfigContainer>
    );
  }

  return (
    <ConfigContainer>
      <Header>
        <Title>⚙️ Configurações</Title>
        <Subtitle>Gerencie suas preferências e configurações da conta</Subtitle>
      </Header>

      {/* Navigation Tabs */}
      <TabsContainer>
        <Tab 
          active={activeTab === 'perfil'} 
          onClick={() => setActiveTab('perfil')}
        >
          👤 Perfil
        </Tab>
        <Tab 
          active={activeTab === 'preferencias'} 
          onClick={() => setActiveTab('preferencias')}
        >
          ⚙️ Preferências
        </Tab>
        <Tab 
          active={activeTab === 'planos'} 
          onClick={() => setActiveTab('planos')}
        >
          💎 Planos
        </Tab>
        <Tab 
          active={activeTab === 'api'} 
          onClick={() => setActiveTab('api')}
        >
          🔗 API & Integrações
        </Tab>
      </TabsContainer>

      {/* Profile Tab */}
      {activeTab === 'perfil' && (
        <ContentSection>
          <SectionTitle>👤 Informações do Perfil</SectionTitle>
          
          {userProfile && (
            <>
              <FormGrid>
                <FormGroup>
                  <Label htmlFor="name">Nome/Empresa <RequiredIndicator>*</RequiredIndicator></Label>
                  <Input
                    id="name"
                    type="text"
                    value={userProfile.name || ''}
                    onChange={(e) => setUserProfile(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="Seu nome ou empresa"
                    hasError={!!validationErrors.name}
                  />
                  {validationErrors.name && (
                    <ErrorMessage>⚠️ {validationErrors.name}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="email">Email <RequiredIndicator>*</RequiredIndicator></Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email || ''}
                    onChange={(e) => setUserProfile(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    placeholder="seu@email.com"
                    hasError={!!validationErrors.email}
                  />
                  {validationErrors.email && (
                    <ErrorMessage>⚠️ {validationErrors.email}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    id="timezone"
                    value={userProfile.timezone || 'America/Sao_Paulo'}
                    onChange={(e) => setUserProfile(prev => prev ? ({ ...prev, timezone: e.target.value }) : null)}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    id="currency"
                    value={userProfile.currency || 'BRL'}
                    onChange={(e) => setUserProfile(prev => prev ? ({ ...prev, currency: e.target.value as any }) : null)}
                  >
                    <option value="BRL">🇧🇷 Real Brasileiro (BRL)</option>
                    <option value="USD">🇺🇸 Dólar Americano (USD)</option>
                    <option value="EUR">🇪🇺 Euro (EUR)</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <InfoBox type="info">
                <InfoTitle type="info">📊 Informações da Conta</InfoTitle>
                <InfoText>
                  <strong>Plano Atual:</strong> {userProfile.plan.toUpperCase()} • 
                  <strong> Status:</strong> {userProfile.subscription_status} • 
                  <strong> Membro desde:</strong> {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                  {userProfile.trial_end_date && (
                    <>
                      <br />
                      <strong>Trial expira em:</strong> {new Date(userProfile.trial_end_date).toLocaleDateString('pt-BR')}
                    </>
                  )}
                </InfoText>
              </InfoBox>

              <ActionButtons>
                <ActionButton
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  ← Voltar
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={saveProfile}
                  loading={saving}
                  saving={saving}
                >
                  {saving ? '💾 Salvando...' : '💾 Salvar Perfil'}
                </ActionButton>
              </ActionButtons>
            </>
          )}
        </ContentSection>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferencias' && (
        <ContentSection>
          <SectionTitle>⚙️ Preferências do Sistema</SectionTitle>
          
          <ToggleContainer>
            <ToggleInfo>
              <ToggleTitle>
                🔔 Notificações por Email
              </ToggleTitle>
              <ToggleDescription>
                Receba notificações sobre análises concluídas, alertas de performance e atualizações importantes
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              enabled={userSettings.email_notifications}
              onClick={() => setUserSettings(prev => ({
                ...prev,
                email_notifications: !prev.email_notifications
              }))}
            />
          </ToggleContainer>

          <ToggleContainer>
            <ToggleInfo>
              <ToggleTitle>
                📱 Notificações SMS
                <ToggleBadge type="pro">PRO</ToggleBadge>
              </ToggleTitle>
              <ToggleDescription>
                Receba alertas críticos de performance via SMS
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              enabled={userSettings.sms_notifications}
              disabled={!isFeatureEnabled('sms_notifications')}
              onClick={() => isFeatureEnabled('sms_notifications') && setUserSettings(prev => ({
                ...prev,
                sms_notifications: !prev.sms_notifications
              }))}
            />
          </ToggleContainer>

          <ToggleContainer>
            <ToggleInfo>
              <ToggleTitle>
                ⚡ Otimização Automática
                <ToggleBadge type="pro">PRO</ToggleBadge>
              </ToggleTitle>
              <ToggleDescription>
                Permitir que a IA aplique otimizações automaticamente quando oportunidades são detectadas
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              enabled={userSettings.auto_optimization}
              disabled={!isFeatureEnabled('auto_optimization')}
              onClick={() => isFeatureEnabled('auto_optimization') && setUserSettings(prev => ({
                ...prev,
                auto_optimization: !prev.auto_optimization
              }))}
            />
          </ToggleContainer>

          <ToggleContainer>
            <ToggleInfo>
              <ToggleTitle>
                🤖 Machine Learning Avançado
                <ToggleBadge type="enterprise">ENTERPRISE</ToggleBadge>
              </ToggleTitle>
              <ToggleDescription>
                Usar algoritmos de ML mais avançados para predições e otimizações
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              enabled={userSettings.ml_enabled || false}
              disabled={!isFeatureEnabled('ml_engine')}
              onClick={() => isFeatureEnabled('ml_engine') && setUserSettings(prev => ({
                ...prev,
                ml_enabled: !prev.ml_enabled
              }))}
            />
          </ToggleContainer>

          <FormGrid>
            <FormGroup>
              <Label htmlFor="report_frequency">📊 Frequência de Relatórios</Label>
              <Select
                id="report_frequency"
                value={userSettings.report_frequency}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  report_frequency: e.target.value as any
                }))}
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </Select>
              <HelpText>
                Com que frequência você deseja receber relatórios automáticos por email
              </HelpText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="language">🌐 Idioma da Interface</Label>
              <Select
                id="language"
                value={userSettings.language || 'pt-BR'}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  language: e.target.value as any
                }))}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="theme">🎨 Tema da Interface</Label>
              <Select
                id="theme"
                value={userSettings.theme || 'light'}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  theme: e.target.value as any
                }))}
              >
                <option value="light">☀️ Claro</option>
                <option value="dark">🌙 Escuro</option>
                <option value="auto">🔄 Automático</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="data_retention">🗂️ Retenção de Dados (dias)</Label>
              <Input
                id="data_retention"
                type="number"
                min="30"
                max="3650"
                value={userSettings.data_retention_days || 365}
                onChange={(e) => setUserSettings(prev => ({
                  ...prev,
                  data_retention_days: parseInt(e.target.value) || 365
                }))}
                placeholder="365"
              />
              <HelpText>
                Por quantos dias manter dados históricos de análises (30-3650 dias)
              </HelpText>
            </FormGroup>
          </FormGrid>

          <ActionButtons>
            <ActionButton
              variant="secondary"
              onClick={() => setUserSettings({
                client_id: user?.id || '',
                notifications_enabled: true,
                auto_optimization: false,
                report_frequency: 'weekly',
                email_notifications: true,
                sms_notifications: false,
                webhook_notifications: false,
                email_reports: true,
                report_format: 'dashboard',
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                currency: 'BRL',
                theme: 'light',
                api_access_enabled: false,
                webhook_url: '',
                slack_webhook: '',
                ml_enabled: false,
                rl_enabled: false,
                ab_testing_enabled: false,
                optimization_aggressiveness: 'moderate',
                seasonality_adjustment: true,
                data_retention_days: 365
              })}
            >
              🔄 Restaurar Padrões
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={saveSettings}
              loading={saving}
              saving={saving}
            >
              {saving ? '💾 Salvando...' : '💾 Salvar Preferências'}
            </ActionButton>
          </ActionButtons>
        </ContentSection>
      )}

      {/* Plans Tab */}
      {activeTab === 'planos' && (
        <ContentSection>
          <SectionTitle>💎 Planos e Assinatura</SectionTitle>
          
          {userProfile && (
            <>
              <InfoBox type="info">
                <InfoTitle type="info">📋 Plano Atual</InfoTitle>
                <InfoText>
                  Você está no plano <strong>{userProfile.plan.toUpperCase()}</strong>.
                  {userProfile.trial_end_date && (
                    <> Seu período de teste expira em <strong>{new Date(userProfile.trial_end_date).toLocaleDateString('pt-BR')}</strong>.</>
                  )}
                  {rateLimitInfo && (
                    <>
                      <br />
                      <strong>Uso atual:</strong> {rateLimitInfo.count} de {rateLimitInfo.operation} este período.
                    </>
                  )}
                </InfoText>
              </InfoBox>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      border: userProfile.plan === plan.id ? '2px solid #007AFF' : '1px solid #E5E5EA',
                      borderRadius: '16px',
                      padding: '24px',
                      background: '#FFFFFF',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #FF9500 0%, #FFAD33 100%)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        ⭐ Mais Popular
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
                        {plan.name}
                      </h3>
                      <div style={{ fontSize: '36px', fontWeight: '700', color: '#007AFF', marginBottom: '8px' }}>
                        R$ {plan.price}
                        <span style={{ fontSize: '16px', color: '#6D6D70', fontWeight: '500' }}>
                          /{plan.billing_period === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      {plan.features.map((feature, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: index < plan.features.length - 1 ? '1px solid #F2F2F7' : 'none'
                          }}
                        >
                          <span style={{ marginRight: '12px', fontSize: '16px' }}>
                            {feature.included ? '✅' : '❌'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <span style={{
                              color: feature.included ? '#1D1D1F' : '#8E8E93',
                              fontWeight: '500'
                            }}>
                              {feature.name}
                            </span>
                            {feature.limit && (
                              <span style={{ color: '#6D6D70', fontSize: '14px', marginLeft: '8px' }}>
                                ({feature.limit})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <ActionButton
                      variant={userProfile.plan === plan.id ? 'secondary' : 'primary'}
                      style={{ width: '100%' }}
                      onClick={() => {
                        if (userProfile.plan !== plan.id) {
                          navigate(`/upgrade?plan=${plan.id}`);
                        }
                      }}
                      disabled={userProfile.plan === plan.id}
                    >
                      {userProfile.plan === plan.id ? '✅ Plano Atual' : `⬆️ Fazer Upgrade`}
                    </ActionButton>
                  </div>
                ))}
              </div>
            </>
          )}
        </ContentSection>
      )}

      {/* API & Integrations Tab */}
      {activeTab === 'api' && (
        <ContentSection>
          <SectionTitle>🔗 API & Integrações</SectionTitle>
          
          <ToggleContainer>
            <ToggleInfo>
              <ToggleTitle>
                🔑 Acesso à API
                <ToggleBadge type="pro">PRO</ToggleBadge>
              </ToggleTitle>
              <ToggleDescription>
                Habilitar acesso programático aos dados e funcionalidades via API REST
              </ToggleDescription>
            </ToggleInfo>
            <Toggle
              enabled={userSettings.api_access_enabled || false}
              disabled={!isFeatureEnabled('api_access')}
              onClick={() => isFeatureEnabled('api_access') && setUserSettings(prev => ({
                ...prev,
                api_access_enabled: !prev.api_access_enabled
              }))}
            />
          </ToggleContainer>

          {userSettings.api_access_enabled && (
            <>
              <FormGrid>
                <FormGroup>
                  <Label htmlFor="webhook_url">🔗 Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    value={userSettings.webhook_url || ''}
                    onChange={(e) => setUserSettings(prev => ({
                      ...prev,
                      webhook_url: e.target.value
                    }))}
                    placeholder="https://seusite.com/webhook"
                    hasError={!!validationErrors.webhook_url}
                  />
                  {validationErrors.webhook_url && (
                    <ErrorMessage>⚠️ {validationErrors.webhook_url}</ErrorMessage>
                  )}
                  <HelpText>
                    URL para receber notificações quando análises são concluídas
                  </HelpText>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="slack_webhook">💬 Slack Webhook</Label>
                  <Input
                    id="slack_webhook"
                    type="url"
                    value={userSettings.slack_webhook || ''}
                    onChange={(e) => setUserSettings(prev => ({
                      ...prev,
                      slack_webhook: e.target.value
                    }))}
                    placeholder="https://hooks.slack.com/services/..."
                    hasError={!!validationErrors.slack_webhook}
                  />
                  {validationErrors.slack_webhook && (
                    <ErrorMessage>⚠️ {validationErrors.slack_webhook}</ErrorMessage>
                  )}
                  <HelpText>
                    URL do webhook do Slack para receber notificações no canal
                  </HelpText>
                </FormGroup>
              </FormGrid>

              <InfoBox type="info">
                <InfoTitle type="info">📖 Documentação da API</InfoTitle>
                <InfoText>
                  Acesse nossa documentação completa da API em{' '}
                  <strong>https://api.fluxrevenue.com.br/docs</strong> para integrar
                  o Flux Revenue com seus sistemas e workflows.
                </InfoText>
              </InfoBox>
            </>
          )}

          <ActionButtons>
            <ActionButton
              variant="secondary"
              onClick={() => window.open('https://api.fluxrevenue.com.br/docs', '_blank')}
            >
              📖 Ver Documentação
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={saveSettings}
              loading={saving}
              saving={saving}
            >
              {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
            </ActionButton>
          </ActionButtons>
        </ContentSection>
      )}
    </ConfigContainer>
  );
};

export default Configuracoes;
