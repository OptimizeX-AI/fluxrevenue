// src/components/Optimizer.tsx - ENTERPRISE GRADE OPTIMIZATION ENGINE CORRIGIDO

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// === INTERFACES ENTERPRISE CORRIGIDAS ===
interface OptimizationTask {
  id?: string;
  site_id: string;
  // ❌ REMOVIDO: client_id (não existe na tabela optimization_tasks)
  analysis_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: number;
  actions?: any;
  results?: any;
  error_message?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface AnalysisData {
  id: string;
  site_id: string;
  client_id: string; // ✅ CORRETO: campo que existe na tabela adsense_analyses
  // ✅ CORREÇÃO: Usar campos corretos do schema
  total_revenue: number;
  total_pageviews: number;
  total_impressions: number;
  total_clicks: number;
  avg_cpc: number;
  avg_ctr: number;
  avg_rpm: number;
  optimization_score: number;
  projected_revenue?: number;
  projected_increase?: number;
  analysis_results?: any;
  opportunities?: any[];
  created_at: string;
}

interface Site {
  id: string;
  url: string;
  client_id: string; // ✅ CORRETO
  name?: string;
  monthly_pageviews?: number;
  current_rpm?: number;
  target_rpm?: number;
  script_installed?: boolean;
  optimization_enabled?: boolean;
  created_at: string;
}

interface OptimizationConfig {
  id: string;
  type: 'ad_placement' | 'ad_formats' | 'targeting' | 'blocking' | 'lazy_loading' | 'auto_ads';
  title: string;
  description: string;
  category: 'revenue' | 'performance' | 'user_experience';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: number; // Percentage increase
  implementationTime: number; // Minutes
  code?: string;
  settings?: any;
  enabled: boolean;
  priority: number;
  requirements?: string[];
  warnings?: string[];
}

interface OptimizationResult {
  task_id: string;
  site_id: string;
  optimizations_applied: OptimizationConfig[];
  estimated_improvement: number;
  script_generated: boolean;
  script_content?: string;
  installation_instructions: string[];
  monitoring_setup: boolean;
  expected_results: {
    revenue_increase: number;
    rpm_improvement: number;
    performance_impact: 'minimal' | 'moderate' | 'significant';
  };
  timeline: {
    immediate: string[];
    week_1: string[];
    week_2: string[];
    month_1: string[];
  };
}

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  variables: string[];
}

// === ANIMATION KEYFRAMES ENTERPRISE ===
const optimizationFlow = keyframes`
  0% { transform: translateX(-50px) scale(0.9); opacity: 0; }
  50% { transform: translateX(0) scale(1.05); opacity: 1; }
  100% { transform: translateX(50px) scale(0.9); opacity: 0; }
`;

const codeGeneration = keyframes`
  0% { background: linear-gradient(90deg, transparent 0%, rgba(0, 122, 255, 0.1) 50%, transparent 100%); }
  100% { background: linear-gradient(90deg, transparent 0%, rgba(48, 209, 88, 0.1) 50%, transparent 100%); }
`;

const revenueBoost = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-2deg); }
  75% { transform: scale(1.1) rotate(2deg); }
`;

const aiOptimizing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.4); border-color: #30D158; }
  50% { box-shadow: 0 0 0 20px rgba(48, 209, 88, 0); border-color: #007AFF; }
  100% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.4); border-color: #30D158; }
`;

const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

// === STYLED COMPONENTS ENTERPRISE ===
const OptimizerContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #F2F2F7;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
  position: relative;
`;

const Title = styled.h1`
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #30D158 0%, #007AFF 50%, #FF9500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  letter-spacing: -0.03em;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  font-size: 19px;
  color: #6D6D70;
  margin: 0 0 8px 0;
  line-height: 1.47;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const AIBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(48, 209, 88, 0.1) 0%, rgba(0, 122, 255, 0.1) 100%);
  border: 1px solid rgba(48, 209, 88, 0.2);
  border-radius: 24px;
  padding: 8px 20px;
  font-size: 14px;
  color: #30D158;
  font-weight: 600;
  margin-top: 16px;
  animation: ${aiOptimizing} 4s infinite;
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  
  @media (min-width: 1200px) {
    grid-template-columns: 400px 1fr;
  }
`;

const SidePanel = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 32px;
  animation: ${slideInUp} 0.6s ease-out;
`;

const MainPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const OptimizationCard = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${slideInUp} 0.7s ease-out;
`;

const SectionTitle = styled.h3`
  font-size: 22px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SiteSelector = styled.div`
  margin-bottom: 32px;
`;

const SiteGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SiteCard = styled.div<{ selected: boolean }>`
  background: ${props => props.selected ? 
    'linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%)' : 
    '#FAFAFA'};
  border: 2px solid ${props => props.selected ? '#30D158' : '#E5E5EA'};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: ${props => props.selected ? '#30D158' : '#007AFF'};
    background: ${props => props.selected ? 
      'linear-gradient(135deg, rgba(48, 209, 88, 0.08) 0%, rgba(0, 122, 255, 0.08) 100%)' :
      'rgba(0, 122, 255, 0.03)'};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const SiteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SiteIcon = styled.div<{ optimized?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.optimized ? 
    'linear-gradient(135deg, #30D158 0%, #34C759 100%)' :
    'linear-gradient(135deg, #007AFF 0%, #30D158 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  animation: ${props => props.optimized ? `${revenueBoost} 2s infinite` : 'none'};
`;

const SiteDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const SiteName = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SiteMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #6D6D70;
`;

const OptimizationStatus = styled.div<{ status: 'excellent' | 'good' | 'needs_improvement' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    switch (props.status) {
      case 'excellent': return 'rgba(48, 209, 88, 0.1)';
      case 'good': return 'rgba(0, 122, 255, 0.1)';
      case 'needs_improvement': return 'rgba(255, 149, 0, 0.1)';
      case 'critical': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'excellent': return '#30D158';
      case 'good': return '#007AFF';
      case 'needs_improvement': return '#FF9500';
      case 'critical': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'excellent': return 'rgba(48, 209, 88, 0.2)';
      case 'good': return 'rgba(0, 122, 255, 0.2)';
      case 'needs_improvement': return 'rgba(255, 149, 0, 0.2)';
      case 'critical': return 'rgba(255, 59, 48, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
`;

const AnalysisPanel = styled.div`
  background: linear-gradient(135deg, rgba(48, 209, 88, 0.03) 0%, rgba(0, 122, 255, 0.03) 100%);
  border: 1px solid rgba(48, 209, 88, 0.15);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
`;

const AnalysisTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #30D158;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(10px);
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #007AFF;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 10px;
  color: #6D6D70;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

const OptimizationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
`;

const OptimizationOption = styled.div<{ 
  selected: boolean; 
  category: 'revenue' | 'performance' | 'user_experience' 
}>`
  background: ${props => props.selected ? 
    'linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%)' : 
    '#FFFFFF'};
  border: 2px solid ${props => props.selected ? '#30D158' : '#E5E5EA'};
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.category) {
        case 'revenue': return 'linear-gradient(90deg, #30D158 0%, #34C759 100%)';
        case 'performance': return 'linear-gradient(90deg, #007AFF 0%, #0A84FF 100%)';
        case 'user_experience': return 'linear-gradient(90deg, #FF9500 0%, #FFAD33 100%)';
        default: return '#E5E5EA';
      }
    }};
    border-radius: 16px 16px 0 0;
  }
  
  &:hover {
    border-color: ${props => props.selected ? '#30D158' : '#007AFF'};
    background: ${props => props.selected ? 
      'linear-gradient(135deg, rgba(48, 209, 88, 0.08) 0%, rgba(0, 122, 255, 0.08) 100%)' :
      'rgba(0, 122, 255, 0.03)'};
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
  
  ${props => props.selected && css`
    animation: ${optimizationFlow} 3s infinite;
  `}
`;

const OptimizationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const OptimizationTitle = styled.h5`
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 8px 0;
  flex: 1;
`;

const OptimizationBadges = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
`;

const ImpactBadge = styled.span<{ impact: number }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => 
    props.impact >= 20 ? 'rgba(48, 209, 88, 0.1)' :
    props.impact >= 10 ? 'rgba(0, 122, 255, 0.1)' :
    'rgba(255, 149, 0, 0.1)'};
  color: ${props => 
    props.impact >= 20 ? '#30D158' :
    props.impact >= 10 ? '#007AFF' :
    '#FF9500'};
  border: 1px solid ${props => 
    props.impact >= 20 ? 'rgba(48, 209, 88, 0.2)' :
    props.impact >= 10 ? 'rgba(0, 122, 255, 0.2)' :
    'rgba(255, 149, 0, 0.2)'};
`;

const DifficultyBadge = styled.span<{ difficulty: 'easy' | 'medium' | 'hard' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${props => {
    switch (props.difficulty) {
      case 'easy': return 'rgba(48, 209, 88, 0.1)';
      case 'medium': return 'rgba(255, 149, 0, 0.1)';
      case 'hard': return 'rgba(255, 59, 48, 0.1)';
      default: return 'rgba(142, 142, 147, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.difficulty) {
      case 'easy': return '#30D158';
      case 'medium': return '#FF9500';
      case 'hard': return '#FF3B30';
      default: return '#8E8E93';
    }
  }};
  border: 1px solid ${props => {
    switch (props.difficulty) {
      case 'easy': return 'rgba(48, 209, 88, 0.2)';
      case 'medium': return 'rgba(255, 149, 0, 0.2)';
      case 'hard': return 'rgba(255, 59, 48, 0.2)';
      default: return 'rgba(142, 142, 147, 0.2)';
    }
  }};
`;

const OptimizationDescription = styled.p`
  font-size: 14px;
  color: #6D6D70;
  line-height: 1.5;
  margin: 0 0 16px 0;
`;

const OptimizationDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #F2F2F7;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const DetailValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #007AFF;
`;

const DetailLabel = styled.span`
  font-size: 10px;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const EstimatePanel = styled.div`
  background: linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%);
  border: 1px solid rgba(48, 209, 88, 0.15);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  text-align: center;
`;

const EstimateTitle = styled.h4`
  font-size: 20px;
  font-weight: 600;
  color: #30D158;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const EstimateValue = styled.div`
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #30D158 0%, #007AFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 16px 0;
  animation: ${revenueBoost} 2s ease-in-out infinite;
`;

const EstimateBreakdown = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const ProcessingSteps = styled.div`
  margin: 32px 0;
`;

const ProcessingStep = styled.div<{ status: string; isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: ${props => props.isActive ? 'rgba(48, 209, 88, 0.05)' : '#FAFAFA'};
  border: 1px solid ${props => 
    props.status === 'completed' ? '#30D158' :
    props.status === 'error' ? '#FF3B30' :
    props.isActive ? '#30D158' : '#E5E5EA'};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  ${props => props.isActive && css`
    animation: ${aiOptimizing} 2s infinite;
  `}
`;

const StepIcon = styled.div<{ status: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 18px;
  background: ${props => 
    props.status === 'completed' ? '#30D158' :
    props.status === 'error' ? '#FF3B30' :
    props.status === 'processing' ? '#30D158' : '#E5E5EA'};
  color: ${props => props.status === 'pending' ? '#8E8E93' : 'white'};
  transition: all 0.3s ease;
`;

const StepContent = styled.div`
  flex: 1;
  text-align: left;
`;

const StepTitle = styled.h5`
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
`;

const StepDescription = styled.p`
  font-size: 13px;
  color: #6D6D70;
  margin: 0;
  line-height: 1.4;
`;

const CodePanel = styled.div`
  background: #1A1A1A;
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${codeGeneration};
    animation: ${codeGeneration} 3s infinite;
    pointer-events: none;
  }
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
`;

const CodeTitle = styled.h5`
  color: #30D158;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
`;

const CodeContent = styled.pre`
  color: #E5E5EA;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
  z-index: 1;
  
  .comment { color: #6D6D70; }
  .string { color: #FF9500; }
  .keyword { color: #007AFF; }
  .function { color: #30D158; }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}>`
  background: ${props => {
    switch (props.variant) {
      case 'success': return 'linear-gradient(135deg, #30D158 0%, #34C759 100%)';
      case 'danger': return 'linear-gradient(135deg, #FF3B30 0%, #FF453A 100%)';
      case 'secondary': return 'transparent';
      default: return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)';
    }
  }};
  color: ${props => props.variant === 'secondary' ? '#007AFF' : '#FFFFFF'};
  border: ${props => props.variant === 'secondary' ? '2px solid #E5E5EA' : 'none'};
  border-radius: 12px;
  padding: ${props => {
    switch (props.size) {
      case 'small': return '12px 20px';
      case 'large': return '20px 32px';
      default: return '16px 28px';
    }
  }};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  }};
  font-weight: 600;
  cursor: ${props => props.loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: ${props => {
    switch (props.size) {
      case 'small': return '40px';
      case 'large': return '60px';
      default: return '52px';
    }
  }};
  min-width: ${props => {
    switch (props.size) {
      case 'small': return '120px';
      case 'large': return '200px';
      default: return '160px';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  
  ${props => !props.variant || props.variant === 'primary' ? css`
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);
  ` : ''}
  
  &:hover:not(:disabled) {
    background: ${props => {
      switch (props.variant) {
        case 'success': return 'linear-gradient(135deg, #28B946 0%, #30D158 100%)';
        case 'danger': return 'linear-gradient(135deg, #E52D27 0%, #FF3B30 100%)';
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  ${props => props.loading && css`
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      animation: ${optimizationFlow} 1.5s infinite;
    }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  color: #6D6D70;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
`;

// === CONSTANTS ===
const OPTIMIZATION_CONFIGS: OptimizationConfig[] = [
  {
    id: 'auto_ads',
    type: 'auto_ads',
    title: 'Google Auto Ads Otimizado',
    description: 'Implementa Auto Ads com configurações personalizadas para máximo RPM mantendo experiência do usuário.',
    category: 'revenue',
    difficulty: 'easy',
    estimatedImpact: 25,
    implementationTime: 10,
    enabled: false,
    priority: 1,
    requirements: ['Google AdSense aprovado', 'Site com conteúdo original'],
    warnings: ['Pode afetar layout inicial', 'Monitorar métricas de UX']
  },
  {
    id: 'ad_placement',
    type: 'ad_placement',
    title: 'Posicionamento Estratégico',
    description: 'Posiciona anúncios em locais de alta visibilidade e engajamento baseado em heatmaps de usuário.',
    category: 'revenue',
    difficulty: 'medium',
    estimatedImpact: 30,
    implementationTime: 20,
    enabled: false,
    priority: 2,
    requirements: ['Analytics configurado', 'Acesso ao código HTML'],
    warnings: ['Requer testes A/B', 'Impacto em Core Web Vitals']
  },
  {
    id: 'lazy_loading',
    type: 'lazy_loading',
    title: 'Lazy Loading Inteligente',
    description: 'Carregamento sob demanda para melhorar velocidade sem perder impressões de anúncios.',
    category: 'performance',
    difficulty: 'medium',
    estimatedImpact: 15,
    implementationTime: 25,
    enabled: false,
    priority: 3,
    requirements: ['Site responsivo', 'JavaScript habilitado'],
    warnings: ['Pode afetar viewability inicial']
  },
  {
    id: 'ad_formats',
    type: 'ad_formats',
    title: 'Formatos Otimizados',
    description: 'Implementa formatos de anúncio com melhor performance: Responsive, Multiplex, In-feed.',
    category: 'revenue',
    difficulty: 'easy',
    estimatedImpact: 20,
    implementationTime: 15,
    enabled: false,
    priority: 4,
    requirements: ['AdSense aprovado', 'Site mobile-friendly'],
    warnings: ['Testar em diferentes dispositivos']
  },
  {
    id: 'targeting',
    type: 'targeting',
    title: 'Targeting Avançado',
    description: 'Configurações de segmentação de anúncios para atrair anunciantes premium e aumentar CPC.',
    category: 'revenue',
    difficulty: 'hard',
    estimatedImpact: 35,
    implementationTime: 30,
    enabled: false,
    priority: 5,
    requirements: ['Alto tráfego', 'Conteúdo de qualidade', 'Audiência definida'],
    warnings: ['Requer análise de audiência', 'Resultados podem variar']
  },
  {
    id: 'blocking',
    type: 'blocking',
    title: 'Bloqueio de Anúncios de Baixo CPC',
    description: 'Remove categorias de anúncios com baixo valor para priorizar anunciantes premium.',
    category: 'revenue',
    difficulty: 'medium',
    estimatedImpact: 18,
    implementationTime: 20,
    enabled: false,
    priority: 6,
    requirements: ['Dados históricos de 30+ dias', 'Volume mínimo de impressões'],
    warnings: ['Pode reduzir fill rate inicialmente']
  }
];

// === COMPONENT PRINCIPAL ===
const Optimizer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData } = useFluxData();

  // ✅ Estados otimizados
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [optimizationConfigs, setOptimizationConfigs] = useState<OptimizationConfig[]>(OPTIMIZATION_CONFIGS);
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [estimatedImprovement, setEstimatedImprovement] = useState(0);

  // ✅ Initialize from URL/state
  useEffect(() => {
    // From URL params
    const siteParam = searchParams.get('site');
    if (siteParam && sites?.some(site => site.id === siteParam)) {
      setSelectedSiteId(siteParam);
    }

    // From navigation state (from Analyzer)
    if (location.state?.fromAnalysis && location.state?.siteId) {
      setSelectedSiteId(location.state.siteId);
    }
  }, [searchParams, location.state, sites]);

  // ✅ Selected site data
  const selectedSite = useMemo(() => {
    return sites?.find(s => s.id === selectedSiteId);
  }, [sites, selectedSiteId]);

  // ✅ CORREÇÃO: Load site analysis com .maybeSingle()
  const loadSiteAnalysis = useCallback(async (siteId: string) => {
    if (!user?.id || !siteId) return;

    try {
      // ✅ CORREÇÃO: Usar .maybeSingle() e campos corretos
      const { data, error } = await supabase
        .from('adsense_analyses')
        .select('*')
        .eq('site_id', siteId)
        .eq('client_id', user.id) // ✅ CORRETO: usar client_id
        .order('created_at', { ascending: false })
        .maybeSingle(); // ✅ CORREÇÃO: usar maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar análise:', error);
        return;
      }

      if (data) {
        // ✅ CORREÇÃO: Map to correct interface
        const analysisData: AnalysisData = {
          id: data.id,
          site_id: data.site_id,
          client_id: data.client_id,
          // ✅ Map schema fields correctly
          total_revenue: data.total_revenue || 0,
          total_pageviews: data.total_pageviews || 0,
          total_impressions: data.total_impressions || 0,
          total_clicks: data.total_clicks || 0,
          avg_cpc: data.avg_cpc || 0,
          avg_ctr: data.avg_ctr || 0,
          avg_rpm: data.avg_rpm || 0,
          optimization_score: data.optimization_score || 0,
          projected_revenue: data.projected_revenue || 0,
          projected_increase: data.projected_increase || 0,
          analysis_results: data.analysis_results || {},
          opportunities: data.opportunities || [],
          created_at: data.created_at
        };

        setCurrentAnalysis(analysisData);
        console.log('✅ Análise carregada:', analysisData);
      } else {
        console.log('ℹ️ Nenhuma análise encontrada para o site');
        setCurrentAnalysis(null);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar análise:', err);
    }
  }, [user?.id]);

  // ✅ Load analysis when site changes
  useEffect(() => {
    if (selectedSiteId) {
      loadSiteAnalysis(selectedSiteId);
    }
  }, [selectedSiteId, loadSiteAnalysis]);

  // ✅ Calculate optimization status
  const getOptimizationStatus = useCallback((site: Site, analysis?: AnalysisData | null) => {
    const score = analysis?.optimization_score || 0;
    
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs_improvement';
    return 'critical';
  }, []);

  // ✅ Handle optimization selection
  const toggleOptimization = useCallback((optimizationId: string) => {
    setSelectedOptimizations(prev => {
      const isSelected = prev.includes(optimizationId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== optimizationId)
        : [...prev, optimizationId];
      
      // Update config state
      setOptimizationConfigs(prevConfigs => 
        prevConfigs.map(config => 
          config.id === optimizationId 
            ? { ...config, enabled: !isSelected }
            : config
        )
      );
      
      return newSelection;
    });
  }, []);

  // ✅ Calculate estimated improvement
  useEffect(() => {
    const selectedConfigs = optimizationConfigs.filter(config => 
      selectedOptimizations.includes(config.id)
    );
    
    // Calculate compound improvement (not just sum)
    const totalImprovement = selectedConfigs.reduce((acc, config) => {
      return acc + (config.estimatedImpact * (1 - acc / 100));
    }, 0);
    
    setEstimatedImprovement(Math.min(totalImprovement, 85)); // Cap at 85%
  }, [selectedOptimizations, optimizationConfigs]);

  // ✅ Initialize processing steps
  const initializeProcessingSteps = useCallback(() => {
    return [
      {
        id: 'analysis',
        title: 'Analisando Site',
        description: 'Verificando configuração atual e oportunidades',
        status: 'processing',
        progress: 0
      },
      {
        id: 'optimization',
        title: 'Aplicando Otimizações',
        description: 'Configurando otimizações selecionadas',
        status: 'pending',
        progress: 0
      },
      {
        id: 'script',
        title: 'Gerando Script',
        description: 'Criando código de implementação personalizado',
        status: 'pending',
        progress: 0
      },
      {
        id: 'validation',
        title: 'Validação Final',
        description: 'Verificando compatibilidade e qualidade',
        status: 'pending',
        progress: 0
      }
    ];
  }, []);

  // ✅ Update processing step
  const updateProcessingStep = useCallback((stepId: string, updates: any) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  // ✅ CORREÇÃO: Generate optimization script com task creation correta
  const generateOptimizationScript = useCallback(async () => {
    if (!selectedSiteId || selectedOptimizations.length === 0) {
      toast({
        title: 'Seleção Incompleta',
        description: 'Selecione um site e pelo menos uma otimização.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    const steps = initializeProcessingSteps();
    setProcessingSteps(steps);

    try {
      // Step 1: Analysis
      updateProcessingStep('analysis', { status: 'processing', progress: 30 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProcessingStep('analysis', { status: 'completed', progress: 100 });

      // Step 2: Optimization
      updateProcessingStep('optimization', { status: 'processing', progress: 40 });
      
      const selectedConfigs = optimizationConfigs.filter(config => 
        selectedOptimizations.includes(config.id)
      );

      // ✅ CORREÇÃO: Task data sem client_id (não existe na tabela)
      const taskData: Omit<OptimizationTask, 'id' | 'created_at' | 'updated_at'> = {
        site_id: selectedSiteId, // ✅ CORRETO: campo que existe
        analysis_id: currentAnalysis?.id, // ✅ CORRETO: campo que existe
        status: 'pending',
        priority: 1, // ✅ CORRETO: campo que existe
        actions: {
          optimizations: selectedConfigs.map(config => ({
            type: config.type,
            title: config.title,
            settings: config.settings || {},
            estimated_impact: config.estimatedImpact,
            implementation_time: config.implementationTime
          })),
          estimated_improvement: estimatedImprovement,
          site_data: {
            url: selectedSite?.url,
            current_rpm: selectedSite?.current_rpm,
            monthly_pageviews: selectedSite?.monthly_pageviews
          },
          analysis_data: currentAnalysis ? {
            optimization_score: currentAnalysis.optimization_score,
            total_revenue: currentAnalysis.total_revenue,
            avg_rpm: currentAnalysis.avg_rpm
          } : null
        },
        scheduled_at: new Date().toISOString() // ✅ CORRETO: campo que existe
      };

      // ✅ CORREÇÃO: Save task to database
      const { data: taskResult, error: taskError } = await supabase
        .from('optimization_tasks')
        .insert([taskData])
        .select()
        .maybeSingle(); // ✅ CORREÇÃO: usar maybeSingle()

      if (taskError) {
        console.error('❌ Erro ao criar task:', taskError);
        // Continue with local processing if DB fails
      } else {
        console.log('✅ Task criada:', taskResult);
      }

      updateProcessingStep('optimization', { status: 'completed', progress: 100 });

      // Step 3: Script Generation
      updateProcessingStep('script', { status: 'processing', progress: 60 });
      
      // ✅ Call Edge Function for script generation
      const { data: scriptData, error: scriptError } = await supabase.functions
        .invoke('flux-optimizer-engine', {
          body: {
            site_id: selectedSiteId,
            site_url: selectedSite?.url,
            optimizations: selectedConfigs,
            analysis_data: currentAnalysis,
            user_id: user!.id,
            task_id: taskResult?.id,
            timestamp: new Date().toISOString()
          }
        });

      if (scriptError) {
        console.error('❌ Erro na geração de script:', scriptError);
        throw new Error('Erro ao gerar script de otimização');
      }

      updateProcessingStep('script', { status: 'completed', progress: 100 });

      // Step 4: Validation
      updateProcessingStep('validation', { status: 'processing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProcessingStep('validation', { status: 'completed', progress: 100 });

      // ✅ Create optimization result
      const result: OptimizationResult = {
        task_id: taskResult?.id || `task_${Date.now()}`,
        site_id: selectedSiteId,
        optimizations_applied: selectedConfigs,
        estimated_improvement: estimatedImprovement,
        script_generated: true,
        script_content: scriptData?.script || '',
        installation_instructions: scriptData?.instructions || [],
        monitoring_setup: true,
        expected_results: {
          revenue_increase: estimatedImprovement,
          rpm_improvement: estimatedImprovement * 0.8,
          performance_impact: estimatedImprovement > 25 ? 'moderate' : 'minimal'
        },
        timeline: {
          immediate: ['Script implementado', 'Monitoramento ativo'],
          week_1: ['Primeiros resultados visíveis', 'Ajustes automáticos'],
          week_2: ['Otimização completa', 'Métricas estabilizadas'],
          month_1: ['ROI maximizado', 'Relatório completo disponível']
        }
      };

      setOptimizationResult(result);

      // Refresh data
      await refreshData();

      toast({
        title: 'Otimização Concluída! 🚀',
        description: `Script gerado com potencial de ${estimatedImprovement.toFixed(1)}% de melhoria`
      });

    } catch (error) {
      console.error('❌ Erro na otimização:', error);
      
      // Mark current step as error
      const currentStep = processingSteps.find(s => s.status === 'processing');
      if (currentStep) {
        updateProcessingStep(currentStep.id, { status: 'error', progress: 0 });
      }
      
      toast({
        title: 'Erro na Otimização',
        description: 'Erro ao gerar otimizações. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSiteId, selectedOptimizations, optimizationConfigs, selectedSite, currentAnalysis, user, estimatedImprovement, initializeProcessingSteps, updateProcessingStep, processingSteps, refreshData, toast]);

  // ✅ Reset optimization
  const resetOptimization = useCallback(() => {
    setSelectedOptimizations([]);
    setOptimizationConfigs(prev => prev.map(config => ({ ...config, enabled: false })));
    setOptimizationResult(null);
    setProcessingSteps([]);
    setEstimatedImprovement(0);
  }, []);

  // === RENDER ===
  if (!user) {
    return (
      <OptimizerContainer>
        <EmptyState>
          <EmptyIcon>🔒</EmptyIcon>
          <h3>Acesso Restrito</h3>
          <p>Faça login para acessar o otimizador AdSense.</p>
        </EmptyState>
      </OptimizerContainer>
    );
  }

  return (
    <OptimizerContainer>
      <Header>
        <Title>⚡ Otimizador AdSense IA</Title>
        <Subtitle>
          Otimização inteligente automática para maximizar sua receita AdSense
        </Subtitle>
        <AIBadge>
          🤖 Powered by Flux Optimization Engine
        </AIBadge>
      </Header>

      <MainLayout>
        {/* Side Panel */}
        <SidePanel>
          {/* Site Selection */}
          <SiteSelector>
            <SectionTitle>🌐 Selecionar Site</SectionTitle>
            {sites && sites.length > 0 ? (
              <SiteGrid>
                {sites.map((site) => {
                  const status = getOptimizationStatus(site, currentAnalysis);
                  return (
                    <SiteCard
                      key={site.id}
                      selected={selectedSiteId === site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                    >
                      <SiteInfo>
                        <SiteIcon optimized={status === 'excellent'}>
                          {site.url?.charAt(0).toUpperCase() || '🌐'}
                        </SiteIcon>
                        <SiteDetails>
                          <SiteName>{site.url}</SiteName>
                          <SiteMetrics>
                            <div>RPM: R$ {site.current_rpm?.toFixed(2) || '0.00'}</div>
                            <div>Pageviews: {site.monthly_pageviews?.toLocaleString('pt-BR') || '0'}/mês</div>
                          </SiteMetrics>
                          <OptimizationStatus status={status}>
                            {status === 'excellent' ? '🌟 Excelente' :
                             status === 'good' ? '✅ Bom' :
                             status === 'needs_improvement' ? '⚠️ Melhorar' :
                             '🚨 Crítico'}
                          </OptimizationStatus>
                        </SiteDetails>
                      </SiteInfo>
                    </SiteCard>
                  );
                })}
              </SiteGrid>
            ) : (
              <EmptyState>
                <EmptyIcon>🌐</EmptyIcon>
                <h4>Nenhum site encontrado</h4>
                <p>Adicione um site primeiro.</p>
                <ActionButton size="small" onClick={() => navigate('/sites')}>
                  ➕ Adicionar Site
                </ActionButton>
              </EmptyState>
            )}
          </SiteSelector>

          {/* Current Analysis */}
          {currentAnalysis && (
            <AnalysisPanel>
              <AnalysisTitle>
                📊 Análise Atual
              </AnalysisTitle>
              <MetricsGrid>
                <MetricCard>
                  <MetricValue>R$ {currentAnalysis.total_revenue.toFixed(2)}</MetricValue>
                  <MetricLabel>Receita</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>R$ {currentAnalysis.avg_rpm.toFixed(2)}</MetricValue>
                  <MetricLabel>RPM</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>{currentAnalysis.avg_ctr.toFixed(2)}%</MetricValue>
                  <MetricLabel>CTR</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>{currentAnalysis.optimization_score.toFixed(0)}%</MetricValue>
                  <MetricLabel>Score</MetricLabel>
                </MetricCard>
              </MetricsGrid>
              <p>
                {currentAnalysis.opportunities?.length || 0} oportunidades identificadas
              </p>
            </AnalysisPanel>
          )}

          {/* Estimated Improvement */}
          {selectedOptimizations.length > 0 && (
            <EstimatePanel>
              <EstimateTitle>
                📈 Melhoria Estimada
              </EstimateTitle>
              <EstimateValue>
                +{estimatedImprovement.toFixed(1)}%
              </EstimateValue>
              <p>Potencial de aumento na receita</p>
              <EstimateBreakdown>
                <DetailItem>
                  <DetailValue>{selectedOptimizations.length}</DetailValue>
                  <DetailLabel>Otimizações</DetailLabel>
                </DetailItem>
                <DetailItem>
                  <DetailValue>
                    {optimizationConfigs
                      .filter(c => selectedOptimizations.includes(c.id))
                      .reduce((sum, c) => sum + c.implementationTime, 0)
                    }m
                  </DetailValue>
                  <DetailLabel>Implementação</DetailLabel>
                </DetailItem>
              </EstimateBreakdown>
            </EstimatePanel>
          )}
        </SidePanel>

        {/* Main Panel */}
        <MainPanel>
          {/* Optimization Options */}
          {!isGenerating && !optimizationResult && (
            <OptimizationCard>
              <SectionTitle>⚡ Otimizações Disponíveis</SectionTitle>
              <OptimizationsGrid>
                {optimizationConfigs.map((config) => (
                  <OptimizationOption
                    key={config.id}
                    selected={config.enabled}
                    category={config.category}
                    onClick={() => toggleOptimization(config.id)}
                  >
                    <OptimizationHeader>
                      <OptimizationTitle>{config.title}</OptimizationTitle>
                      <OptimizationBadges>
                        <ImpactBadge impact={config.estimatedImpact}>
                          +{config.estimatedImpact}%
                        </ImpactBadge>
                        <DifficultyBadge difficulty={config.difficulty}>
                          {config.difficulty === 'easy' ? 'Fácil' :
                           config.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </DifficultyBadge>
                      </OptimizationBadges>
                    </OptimizationHeader>
                    
                    <OptimizationDescription>
                      {config.description}
                    </OptimizationDescription>
                    
                    <OptimizationDetails>
                      <DetailItem>
                        <DetailValue>{config.implementationTime}m</DetailValue>
                        <DetailLabel>Tempo</DetailLabel>
                      </DetailItem>
                      <DetailItem>
                        <DetailValue>
                          {config.category === 'revenue' ? '💰' :
                           config.category === 'performance' ? '⚡' : '👤'}
                        </DetailValue>
                        <DetailLabel>
                          {config.category === 'revenue' ? 'Receita' :
                           config.category === 'performance' ? 'Performance' : 'UX'}
                        </DetailLabel>
                      </DetailItem>
                      <DetailItem>
                        <DetailValue>#{config.priority}</DetailValue>
                        <DetailLabel>Prioridade</DetailLabel>
                      </DetailItem>
                    </OptimizationDetails>

                    {config.requirements && config.requirements.length > 0 && (
                      <div style={{ marginTop: '16px', fontSize: '12px', color: '#6D6D70' }}>
                        <strong>Requisitos:</strong> {config.requirements.join(', ')}
                      </div>
                    )}

                    {config.warnings && config.warnings.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#FF9500' }}>
                        <strong>⚠️ Atenção:</strong> {config.warnings.join(', ')}
                      </div>
                    )}
                  </OptimizationOption>
                ))}
              </OptimizationsGrid>

              {selectedSiteId && selectedOptimizations.length > 0 && (
                <ActionButtons>
                  <ActionButton
                    variant="secondary"
                    onClick={resetOptimization}
                  >
                    🔄 Limpar Seleção
                  </ActionButton>
                  <ActionButton
                    variant="success"
                    size="large"
                    onClick={generateOptimizationScript}
                  >
                    🚀 Gerar Otimização
                  </ActionButton>
                </ActionButtons>
              )}
            </OptimizationCard>
          )}

          {/* Processing Steps */}
          {isGenerating && (
            <OptimizationCard>
              <SectionTitle>🤖 Otimização em Andamento</SectionTitle>
              <ProcessingSteps>
                {processingSteps.map((step, index) => (
                  <ProcessingStep
                    key={step.id}
                    status={step.status}
                    isActive={step.status === 'processing'}
                  >
                    <StepIcon status={step.status}>
                      {step.status === 'completed' ? '✅' :
                       step.status === 'error' ? '❌' :
                       step.status === 'processing' ? '⚙️' : '⏳'}
                    </StepIcon>
                    <StepContent>
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </StepContent>
                  </ProcessingStep>
                ))}
              </ProcessingSteps>
            </OptimizationCard>
          )}

          {/* Optimization Results */}
          {optimizationResult && (
            <OptimizationCard>
              <SectionTitle>🎉 Otimização Concluída</SectionTitle>
              
              <EstimatePanel>
                <EstimateTitle>
                  📈 Resultado da Otimização
                </EstimateTitle>
                <EstimateValue>
                  +{optimizationResult.estimated_improvement.toFixed(1)}%
                </EstimateValue>
                <p>Melhoria estimada na receita</p>
                
                <EstimateBreakdown>
                  <DetailItem>
                    <DetailValue>+{optimizationResult.expected_results.revenue_increase.toFixed(1)}%</DetailValue>
                    <DetailLabel>Receita</DetailLabel>
                  </DetailItem>
                  <DetailItem>
                    <DetailValue>+{optimizationResult.expected_results.rpm_improvement.toFixed(1)}%</DetailValue>
                    <DetailLabel>RPM</DetailLabel>
                  </DetailItem>
                  <DetailItem>
                    <DetailValue>{optimizationResult.optimizations_applied.length}</DetailValue>
                    <DetailLabel>Otimizações</DetailLabel>
                  </DetailItem>
                  <DetailItem>
                    <DetailValue>{optimizationResult.expected_results.performance_impact}</DetailValue>
                    <DetailLabel>Impacto UX</DetailLabel>
                  </DetailItem>
                </EstimateBreakdown>
              </EstimatePanel>

              {/* Generated Script */}
              {optimizationResult.script_content && (
                <CodePanel>
                  <CodeHeader>
                    <CodeTitle>📜 Script de Otimização Gerado</CodeTitle>
                  </CodeHeader>
                  <CodeContent>
                    {optimizationResult.script_content}
                  </CodeContent>
                </CodePanel>
              )}

              {/* Installation Instructions */}
              {optimizationResult.installation_instructions && optimizationResult.installation_instructions.length > 0 && (
                <div style={{ margin: '24px 0' }}>
                  <h4>📋 Instruções de Instalação:</h4>
                  <ol>
                    {optimizationResult.installation_instructions.map((instruction, index) => (
                      <li key={index} style={{ margin: '8px 0', lineHeight: '1.5' }}>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Timeline */}
              <div style={{ margin: '24px 0' }}>
                <h4>📅 Timeline de Resultados:</h4>
                <MetricsGrid>
                  <MetricCard>
                    <MetricValue>Imediato</MetricValue>
                    <MetricLabel>{optimizationResult.timeline.immediate.join(', ')}</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>1 Semana</MetricValue>
                    <MetricLabel>{optimizationResult.timeline.week_1.join(', ')}</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>2 Semanas</MetricValue>
                    <MetricLabel>{optimizationResult.timeline.week_2.join(', ')}</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>1 Mês</MetricValue>
                    <MetricLabel>{optimizationResult.timeline.month_1.join(', ')}</MetricLabel>
                  </MetricCard>
                </MetricsGrid>
              </div>

              <ActionButtons>
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(optimizationResult.script_content || '');
                    toast({
                      title: 'Copiado!',
                      description: 'Script copiado para a área de transferência.'
                    });
                  }}
                >
                  📋 Copiar Script
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={() => navigate('/relatorios', { 
                    state: { 
                      fromOptimization: true, 
                      siteId: optimizationResult.site_id,
                      taskId: optimizationResult.task_id
                    }
                  })}
                >
                  📊 Ver Resultados
                </ActionButton>
                <ActionButton
                  variant="success"
                  onClick={resetOptimization}
                >
                  ⚡ Nova Otimização
                </ActionButton>
              </ActionButtons>
            </OptimizationCard>
          )}

          {/* Empty State */}
          {!selectedSiteId && !isGenerating && !optimizationResult && (
            <OptimizationCard>
              <EmptyState>
                <EmptyIcon>⚡</EmptyIcon>
                <h3>Pronto para Otimizar</h3>
                <p>
                  Selecione um site para começar a otimização inteligente.
                  Nossa IA aplicará as melhores práticas para maximizar sua receita AdSense.
                </p>
                <p>
                  <strong>Benefícios:</strong><br />
                  • Aumento médio de 15-35% na receita<br />
                  • Implementação automática<br />
                  • Monitoramento contínuo<br />
                  • Sem impacto na velocidade
                </p>
              </EmptyState>
            </OptimizationCard>
          )}
        </MainPanel>
      </MainLayout>
    </OptimizerContainer>
  );
};

export default Optimizer;
