// src/components/Relatorios.tsx - ENTERPRISE ANALYTICS SYSTEM CORRIGIDO

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import MetricsCard from './MetricsCard';

// === INTERFACES ENTERPRISE OTIMIZADAS ===
interface ReportFilters {
  dateRange: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom' | 'today' | 'yesterday';
  startDate?: string;
  endDate?: string;
  siteId?: string;
  metric: 'revenue' | 'pageviews' | 'ctr' | 'rpm' | 'optimization_score';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  comparison: boolean;
}

interface AnalyticsData {
  id: string;
  site_id: string;
  site_url: string;
  date: string;
  pageviews: number;
  revenue: number;
  rpm: number;
  ctr: number;
  impressions: number;
  clicks: number;
  optimization_score?: number;
  created_at: string;
  // ✅ Dados adicionais do backend
  confidence_level?: number;
  revenue_potential?: number;
  niches_detected?: string[];
  seasonality_factor?: number;
}

interface ReportSummary {
  totalRevenue: number;
  totalPageviews: number;
  averageRpm: number;
  averageCtr: number;
  totalClicks: number;
  totalImpressions: number;
  averageOptimizationScore: number;
  periodComparison: {
    revenueChange: number;
    pageviewsChange: number;
    rpmChange: number;
    ctrChange: number;
    optimizationChange: number;
  };
  topPerformingSites: Array<{
    site_url: string;
    revenue: number;
    pageviews: number;
    rpm: number;
    optimization_score: number;
  }>;
  insights: string[];
  recommendations: Array<{
    type: 'revenue' | 'performance' | 'optimization';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    action: string;
  }>;
}

interface ChartDataPoint {
  date: string;
  value: number;
  comparison?: number;
  label?: string;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  includeCharts: boolean;
  includeInsights: boolean;
  includeComparison: boolean;
  dateRange: string;
}

// === ANIMATION KEYFRAMES ENTERPRISE ===
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const loadingPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.98); }
`;

const chartAnimation = keyframes`
  from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
  to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
`;

const dataRefresh = keyframes`
  0% { background: rgba(48, 209, 88, 0.1); }
  50% { background: rgba(48, 209, 88, 0.2); }
  100% { background: rgba(48, 209, 88, 0.1); }
`;

// === STYLED COMPONENTS ENTERPRISE ===
const RelatoriosContainer = styled.div`
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
  font-size: 40px;
  font-weight: 700;
  background: linear-gradient(135deg, #1D1D1F 0%, #007AFF 50%, #30D158 100%);
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

const PowerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(48, 209, 88, 0.1) 100%);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 24px;
  padding: 8px 20px;
  font-size: 14px;
  color: #007AFF;
  font-weight: 600;
  margin-top: 16px;
`;

const FiltersContainer = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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

const FiltersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const FiltersTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RefreshIndicator = styled.div<{ isRefreshing: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #30D158;
  ${props => props.isRefreshing && css`
    animation: ${dataRefresh} 1s ease-in-out infinite;
  `}
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const FilterLabel = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FilterSelect = styled.select`
  padding: 16px 20px;
  border: 2px solid #E5E5EA;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.16);
    transform: translateY(-1px);
  }
`;

const FilterInput = styled.input`
  padding: 16px 20px;
  border: 2px solid #E5E5EA;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.16);
    transform: translateY(-1px);
  }
`;

const FilterToggle = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid ${props => props.active ? '#007AFF' : '#E5E5EA'};
  border-radius: 10px;
  background: ${props => props.active ? 'rgba(0, 122, 255, 0.05)' : '#FFFFFF'};
  color: ${props => props.active ? '#007AFF' : '#6D6D70'};
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #007AFF;
    background: rgba(0, 122, 255, 0.05);
    transform: translateY(-1px);
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
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
  padding: 16px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: ${props => props.loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 48px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
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
`;

const SummarySection = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SummaryTitle = styled.h3`
  font-size: 22px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryPeriod = styled.div`
  font-size: 14px;
  color: #6D6D70;
  background: rgba(0, 122, 255, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.15);
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 500;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const ChartContainer = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ChartButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#007AFF' : '#E5E5EA'};
  border-radius: 8px;
  background: ${props => props.active ? '#007AFF' : '#FFFFFF'};
  color: ${props => props.active ? '#FFFFFF' : '#6D6D70'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007AFF;
    background: ${props => props.active ? '#007AFF' : 'rgba(0, 122, 255, 0.05)'};
  }
`;

const ChartCanvas = styled.div`
  width: 100%;
  height: 400px;
  position: relative;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.02) 0%, rgba(48, 209, 88, 0.02) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 122, 255, 0.1);
`;

const SVGChart = styled.svg`
  width: 100%;
  height: 100%;
  
  .chart-line {
    stroke: #007AFF;
    stroke-width: 3;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: ${chartAnimation} 2s ease-in-out;
  }
  
  .chart-area {
    fill: url(#chartGradient);
    opacity: 0.3;
  }
  
  .chart-point {
    fill: #007AFF;
    stroke: #FFFFFF;
    stroke-width: 2;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      r: 6;
      fill: #0056CC;
    }
  }
  
  .chart-grid {
    stroke: #F2F2F7;
    stroke-width: 1;
  }
  
  .chart-text {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    font-size: 12px;
    fill: #8E8E93;
  }
`;

const DataTable = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TableTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TableControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableHeaderRow = styled.tr`
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 16px 12px;
  font-weight: 600;
  color: #1D1D1F;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #E5E5EA;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 255, 0.05);
  }
`;

const TableRow = styled.tr<{ highlighted?: boolean }>`
  background: ${props => props.highlighted ? 'rgba(0, 122, 255, 0.02)' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 255, 0.05);
    transform: translateX(4px);
  }
`;

const TableCell = styled.td`
  padding: 16px 12px;
  border-bottom: 1px solid #F2F2F7;
  color: #1D1D1F;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
`;

const InsightsSection = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const InsightCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`
  background: ${props => {
    switch (props.priority) {
      case 'high': return 'rgba(255, 59, 48, 0.03)';
      case 'medium': return 'rgba(255, 149, 0, 0.03)';
      default: return 'rgba(0, 122, 255, 0.03)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.priority) {
      case 'high': return 'rgba(255, 59, 48, 0.1)';
      case 'medium': return 'rgba(255, 149, 0, 0.1)';
      default: return 'rgba(0, 122, 255, 0.1)';
    }
  }};
  border-radius: 16px;
  padding: 24px;
  border-left: 4px solid ${props => {
    switch (props.priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      default: return '#007AFF';
    }
  }};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const InsightHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const InsightIcon = styled.div<{ priority: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: ${props => {
    switch (props.priority) {
      case 'high': return 'rgba(255, 59, 48, 0.1)';
      case 'medium': return 'rgba(255, 149, 0, 0.1)';
      default: return 'rgba(0, 122, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      default: return '#007AFF';
    }
  }};
`;

const PriorityBadge = styled.span<{ priority: string }>`
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      default: return '#007AFF';
    }
  }};
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ExportSection = styled.div`
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const ExportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const ExportButton = styled.button<{ format: string; exporting?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  border: 2px solid #E5E5EA;
  border-radius: 16px;
  background: #FFFFFF;
  color: #1D1D1F;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: ${props => props.exporting ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 120px;
  
  ${props => props.exporting && css`
    animation: ${loadingPulse} 1.5s infinite;
  `}
  
  &:hover:not(:disabled) {
    background: #F2F2F7;
    border-color: #007AFF;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExportIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: #6D6D70;
`;

const LoadingSpinner = styled.div`
  width: 64px;
  height: 64px;
  border: 4px solid #E5E5EA;
  border-top: 4px solid #007AFF;
  border-radius: 50%;
  margin: 0 auto 24px;
  animation: ${loadingPulse} 1.2s linear infinite;
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

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 12px 0;
`;

const EmptyDescription = styled.p`
  font-size: 16px;
  color: #6D6D70;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

// === COMPONENT PRINCIPAL ===
const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, analyses, refreshData } = useFluxData();

  // ✅ Estados otimizados
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'last_30_days',
    metric: 'revenue',
    granularity: 'daily',
    comparison: false
  });

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof AnalyticsData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // ✅ Initialize from URL params
  useEffect(() => {
    const siteParam = searchParams.get('site');
    const implementationParam = searchParams.get('implementation');

    if (siteParam) {
      setFilters(prev => ({ ...prev, siteId: siteParam }));
    }

    if (implementationParam) {
      // Show implementation success message
      toast({
        title: 'Implementação Concluída! 🎉',
        description: 'Acompanhe os resultados da otimização nos relatórios.'
      });
    }
  }, [searchParams, toast]);

  // ✅ CORREÇÃO: Fetch analytics data com queries corretas e simples
  const fetchAnalyticsData = useCallback(async (showRefreshIndicator = false) => {
    if (!user?.id) return;

    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          startDate.setDate(endDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last_7_days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'last_90_days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate.setTime(new Date(filters.startDate).getTime());
            endDate.setTime(new Date(filters.endDate).getTime());
          }
          break;
      }

      // ✅ CORREÇÃO: Queries separadas e simples - SEM JOINS COMPLEXOS
      const [analysisResult, sitesResult] = await Promise.allSettled([
        // Query 1: Análises simples
        supabase
          .from('adsense_analyses')
          .select('*')
          .eq('client_id', user.id) // ✅ CAMPO CORRETO
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false }),

        // Query 2: Sites do usuário para mapear URLs
        supabase
          .from('sites')
          .select('id, url, client_id')
          .eq('client_id', user.id) // ✅ CAMPO CORRETO
      ]);

      let transformedData: AnalyticsData[] = [];

      // ✅ Process análises result
      if (analysisResult.status === 'fulfilled' && analysisResult.value.data) {
        const analysisData = analysisResult.value.data;
        const sitesData = sitesResult.status === 'fulfilled' ? sitesResult.value.data || [] : [];

        // Create site mapping
        const siteMapping = sitesData.reduce((acc: any, site: any) => {
          acc[site.id] = site.url;
          return acc;
        }, {});

        // Filter by siteId if specified
        const filteredAnalyses = filters.siteId 
          ? analysisData.filter((item: any) => item.site_id === filters.siteId)
          : analysisData;

        transformedData = filteredAnalyses.map((item: any) => ({
          id: item.id,
          site_id: item.site_id,
          site_url: siteMapping[item.site_id] || 'URL não encontrada',
          date: item.created_at,
          pageviews: item.total_pageviews || 0,
          revenue: item.total_revenue || 0,
          rpm: item.avg_rpm || 0,
          ctr: item.avg_ctr || 0,
          impressions: item.total_impressions || 0,
          clicks: item.total_clicks || 0,
          optimization_score: item.optimization_score || 0,
          confidence_level: item.confidence_level || 0,
          revenue_potential: item.projected_revenue || item.total_revenue || 0,
          niches_detected: item.analysis_results?.niches_detected || [],
          seasonality_factor: item.seasonality_factor || 1,
          created_at: item.created_at
        }));
      }

      // ✅ CORREÇÃO: Buscar métricas separadamente se necessário
      if (transformedData.length > 0) {
        try {
          const siteIds = Array.from(new Set(transformedData.map(item => item.site_id)));
          
          const { data: metricsData } = await supabase
            .from('metrics')
            .select('*')
            .in('site_id', siteIds) // ✅ BUSCAR POR SITE_ID
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString())
            .order('timestamp', { ascending: false });

          if (metricsData && metricsData.length > 0) {
            // Merge metrics data with analysis data
            const metricsMap = metricsData.reduce((acc: any, metric: any) => {
              const dateKey = new Date(metric.timestamp).toDateString();
              const key = `${metric.site_id}_${dateKey}`;
              
              if (!acc[key]) {
                acc[key] = {
                  pageviews: 0,
                  revenue: 0,
                  rpm: 0,
                  ctr: 0,
                  impressions: 0,
                  clicks: 0,
                  count: 0
                };
              }
              
              acc[key].pageviews += metric.pageviews || 0;
              acc[key].revenue += metric.revenue || 0;
              acc[key].rpm += metric.rpm || 0;
              acc[key].ctr += metric.ctr || 0;
              acc[key].impressions += metric.impressions || 0;
              acc[key].clicks += metric.clicks || 0;
              acc[key].count += 1;
              
              return acc;
            }, {});

            // Update transformed data with metrics
            transformedData = transformedData.map(item => {
              const dateKey = new Date(item.date).toDateString();
              const key = `${item.site_id}_${dateKey}`;
              const metrics = metricsMap[key];
              
              if (metrics && metrics.count > 0) {
                return {
                  ...item,
                  pageviews: item.pageviews || metrics.pageviews,
                  revenue: item.revenue || metrics.revenue,
                  rpm: item.rpm || (metrics.rpm / metrics.count),
                  ctr: item.ctr || (metrics.ctr / metrics.count),
                  impressions: item.impressions || metrics.impressions,
                  clicks: item.clicks || metrics.clicks
                };
              }
              
              return item;
            });
          }
        } catch (metricsError) {
          console.warn('⚠️ Could not fetch metrics data:', metricsError);
        }
      }

      setAnalyticsData(transformedData);
      generateReportSummary(transformedData);
      generateChartData(transformedData);

    } catch (error) {
      console.error('Erro ao buscar dados de analytics:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de relatórios.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, filters, toast]);

  // ✅ Generate comprehensive report summary
  const generateReportSummary = useCallback((data: AnalyticsData[]) => {
    if (data.length === 0) {
      setReportSummary(null);
      return;
    }

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalPageviews = data.reduce((sum, item) => sum + item.pageviews, 0);
    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
    const averageRpm = data.length > 0 ? data.reduce((sum, item) => sum + item.rpm, 0) / data.length : 0;
    const averageCtr = data.length > 0 ? data.reduce((sum, item) => sum + item.ctr, 0) / data.length : 0;
    const averageOptimizationScore = data.length > 0 ?
      data.reduce((sum, item) => sum + (item.optimization_score || 0), 0) / data.length : 0;

    // ✅ Calculate period comparison
    const periodDays = Math.abs(
      new Date(filters.endDate || new Date()).getTime() -
      new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).getTime()
    ) / (1000 * 60 * 60 * 24);

    const midPoint = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000 / 2);
    const currentPeriod = data.filter(item => new Date(item.date) >= midPoint);
    const previousPeriod = data.filter(item => new Date(item.date) < midPoint);

    const calculateChange = (current: number, previous: number) =>
      previous > 0 ? ((current - previous) / previous) * 100 : 0;

    const currentRevenue = currentPeriod.reduce((sum, item) => sum + item.revenue, 0);
    const previousRevenue = previousPeriod.reduce((sum, item) => sum + item.revenue, 0);
    const currentPageviews = currentPeriod.reduce((sum, item) => sum + item.pageviews, 0);
    const previousPageviews = previousPeriod.reduce((sum, item) => sum + item.pageviews, 0);

    const currentRpm = currentPeriod.length > 0 ?
      currentPeriod.reduce((sum, item) => sum + item.rpm, 0) / currentPeriod.length : 0;
    const previousRpm = previousPeriod.length > 0 ?
      previousPeriod.reduce((sum, item) => sum + item.rpm, 0) / previousPeriod.length : 0;

    const currentCtr = currentPeriod.length > 0 ?
      currentPeriod.reduce((sum, item) => sum + item.ctr, 0) / currentPeriod.length : 0;
    const previousCtr = previousPeriod.length > 0 ?
      previousPeriod.reduce((sum, item) => sum + item.ctr, 0) / previousPeriod.length : 0;

    const currentOptimization = currentPeriod.length > 0 ?
      currentPeriod.reduce((sum, item) => sum + (item.optimization_score || 0), 0) / currentPeriod.length : 0;
    const previousOptimization = previousPeriod.length > 0 ?
      previousPeriod.reduce((sum, item) => sum + (item.optimization_score || 0), 0) / previousPeriod.length : 0;

    const periodComparison = {
      revenueChange: calculateChange(currentRevenue, previousRevenue),
      pageviewsChange: calculateChange(currentPageviews, previousPageviews),
      rpmChange: calculateChange(currentRpm, previousRpm),
      ctrChange: calculateChange(currentCtr, previousCtr),
      optimizationChange: calculateChange(currentOptimization, previousOptimization)
    };

    // ✅ Top performing sites
    const sitePerformance = data.reduce((acc: any, item) => {
      if (!acc[item.site_url]) {
        acc[item.site_url] = {
          revenue: 0,
          pageviews: 0,
          rpm: 0,
          optimization_score: 0,
          count: 0
        };
      }

      acc[item.site_url].revenue += item.revenue;
      acc[item.site_url].pageviews += item.pageviews;
      acc[item.site_url].rpm += item.rpm;
      acc[item.site_url].optimization_score += item.optimization_score || 0;
      acc[item.site_url].count += 1;
      return acc;
    }, {});

    const topPerformingSites = Object.entries(sitePerformance)
      .map(([url, data]: [string, any]) => ({
        site_url: url,
        revenue: data.revenue,
        pageviews: data.pageviews,
        rpm: data.count > 0 ? data.rpm / data.count : 0,
        optimization_score: data.count > 0 ? data.optimization_score / data.count : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ✅ Generate insights and recommendations
    const insights: string[] = [];
    const recommendations: ReportSummary['recommendations'] = [];

    if (periodComparison.revenueChange > 10) {
      insights.push(`Receita cresceu ${periodComparison.revenueChange.toFixed(1)}% no período`);
    } else if (periodComparison.revenueChange < -5) {
      insights.push(`Receita decresceu ${Math.abs(periodComparison.revenueChange).toFixed(1)}% no período`);
      recommendations.push({
        type: 'revenue',
        title: 'Otimizar Receita',
        description: 'Receita em declínio detectada. Considere revisar estratégias de monetização.',
        impact: 'high',
        action: 'Executar nova análise e otimização'
      });
    }

    if (averageOptimizationScore < 70) {
      recommendations.push({
        type: 'optimization',
        title: 'Melhorar Score de Otimização',
        description: `Score médio de ${averageOptimizationScore.toFixed(1)}% está abaixo do ideal.`,
        impact: 'medium',
        action: 'Implementar otimizações sugeridas'
      });
    }

    if (averageCtr < 1) {
      recommendations.push({
        type: 'performance',
        title: 'Otimizar CTR',
        description: `CTR médio de ${averageCtr.toFixed(2)}% pode ser melhorado.`,
        impact: 'medium',
        action: 'Revisar posicionamento de anúncios'
      });
    }

    setReportSummary({
      totalRevenue,
      totalPageviews,
      averageRpm,
      averageCtr,
      totalClicks,
      totalImpressions,
      averageOptimizationScore,
      periodComparison,
      topPerformingSites,
      insights,
      recommendations
    });
  }, [filters]);

  // ✅ Generate chart data
  const generateChartData = useCallback((data: AnalyticsData[]) => {
    const groupedData = data.reduce((acc: any, item) => {
      const dateKey = new Date(item.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          revenue: 0,
          pageviews: 0,
          ctr: 0,
          rpm: 0,
          optimization_score: 0,
          count: 0
        };
      }

      acc[dateKey].revenue += item.revenue;
      acc[dateKey].pageviews += item.pageviews;
      acc[dateKey].ctr += item.ctr;
      acc[dateKey].rpm += item.rpm;
      acc[dateKey].optimization_score += item.optimization_score || 0;
      acc[dateKey].count += 1;
      return acc;
    }, {});

    const chartData: ChartDataPoint[] = Object.values(groupedData)
      .map((item: any) => ({
        date: item.date,
        value: item.count > 0 ?
          (filters.metric === 'revenue' ? item.revenue :
           filters.metric === 'pageviews' ? item.pageviews :
           filters.metric === 'ctr' ? item.ctr / item.count :
           filters.metric === 'rpm' ? item.rpm / item.count :
           item.optimization_score / item.count) : 0,
        label: new Date(item.date).toLocaleDateString('pt-BR', {
          month: 'short',
          day: 'numeric'
        })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setChartData(chartData);
  }, [filters.metric]);

  // ✅ Export functions
  const exportToCSV = useCallback(() => {
    if (!analyticsData.length) return;

    setExporting('csv');
    try {
      const headers = [
        'Data', 'Site', 'Pageviews', 'Receita', 'RPM', 'CTR',
        'Cliques', 'Impressões', 'Score Otimização', 'Potencial'
      ];

      const csvData = analyticsData.map(item => [
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.site_url,
        item.pageviews,
        item.revenue.toFixed(2),
        item.rpm.toFixed(2),
        item.ctr.toFixed(2),
        item.clicks,
        item.impressions,
        item.optimization_score?.toFixed(1) || '0',
        item.revenue_potential?.toFixed(2) || '0'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `flux-revenue-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'CSV Exportado! 📊',
        description: 'Relatório CSV baixado com sucesso.'
      });
    } finally {
      setExporting(null);
    }
  }, [analyticsData, toast]);

  const exportToPDF = useCallback(async () => {
    setExporting('pdf');
    try {
      // ✅ Call Edge Function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {
          analyticsData,
          reportSummary,
          chartData,
          filters,
          userId: user?.id,
          generatedAt: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Download PDF
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `flux-revenue-relatorio-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      toast({
        title: 'PDF Gerado! 📄',
        description: 'Relatório PDF baixado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setExporting(null);
    }
  }, [analyticsData, reportSummary, chartData, filters, user?.id, toast]);

  const exportToJSON = useCallback(() => {
    setExporting('json');
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          userId: user?.id,
          filters,
          totalRecords: analyticsData.length
        },
        summary: reportSummary,
        chartData,
        detailedData: analyticsData,
        insights: reportSummary?.insights || [],
        recommendations: reportSummary?.recommendations || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json;charset=utf-8;'
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `flux-revenue-dados-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: 'JSON Exportado! 💾',
        description: 'Dados JSON baixados com sucesso.'
      });
    } finally {
      setExporting(null);
    }
  }, [analyticsData, reportSummary, chartData, filters, user?.id, toast]);

  // ✅ Auto-refresh setup
  useEffect(() => {
    if (filters.dateRange === 'today' || filters.dateRange === 'yesterday') {
      // Real-time refresh for current data
      refreshIntervalRef.current = setInterval(() => {
        fetchAnalyticsData(true);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [filters.dateRange, fetchAnalyticsData]);

  // ✅ Fetch data when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // ✅ Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = analyticsData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.site_url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortDirection === 'asc' ?
          aStr.localeCompare(bStr) :
          bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [analyticsData, searchTerm, sortField, sortDirection]);

  // ✅ Simple SVG Chart component
  const SimpleChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 300;
      const y = 100 - ((d.value - minValue) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <SVGChart viewBox="0 0 350 150">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#007AFF" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#007AFF" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} className="chart-grid" x1="25" y1={y + 20} x2="325" y2={y + 20} />
        ))}

        {/* Area */}
        {chartType === 'area' && (
          <polygon
            className="chart-area"
            points={`25,120 ${points.split(' ').map((point, i) => {
              const [x, y] = point.split(',');
              return `${Number(x) + 25},${Number(y) + 20}`;
            }).join(' ')} 325,120`}
          />
        )}

        {/* Line */}
        <polyline
          className="chart-line"
          points={points.split(' ').map((point, i) => {
            const [x, y] = point.split(',');
            return `${Number(x) + 25},${Number(y) + 20}`;
          }).join(' ')}
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 300 + 25;
          const y = 120 - ((d.value - minValue) / range) * 80;
          return (
            <circle
              key={i}
              className="chart-point"
              cx={x}
              cy={y}
              r="4"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
        })}

        {/* Y-axis labels */}
        <text className="chart-text" x="5" y="25">{maxValue.toFixed(1)}</text>
        <text className="chart-text" x="5" y="125">{minValue.toFixed(1)}</text>
      </SVGChart>
    );
  };

  // ✅ Handle table sorting
  const handleSort = (field: keyof AnalyticsData) => {
    setSortDirection(prev =>
      sortField === field && prev === 'asc' ? 'desc' : 'asc'
    );
    setSortField(field);
  };

  // === RENDER ===
  return (
    <RelatoriosContainer>
      <Header>
        <Title>📊 Relatórios Avançados</Title>
        <Subtitle>Análise completa de performance e receita AdSense</Subtitle>
        <PowerBadge>
          ⚡ Powered by Flux AI Engine
        </PowerBadge>
      </Header>

      {/* Filters */}
      <FiltersContainer>
        <FiltersHeader>
          <FiltersTitle>🔍 Filtros de Análise</FiltersTitle>
          <RefreshIndicator isRefreshing={refreshing}>
            {refreshing ? '🔄 Atualizando...' : '✅ Dados atualizados'}
          </RefreshIndicator>
        </FiltersHeader>

        <FiltersGrid>
          <FilterGroup>
            <FilterLabel>📅 Período</FilterLabel>
            <FilterSelect
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: e.target.value as ReportFilters['dateRange']
              }))}
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last_7_days">Últimos 7 dias</option>
              <option value="last_30_days">Últimos 30 dias</option>
              <option value="last_90_days">Últimos 90 dias</option>
              <option value="custom">Período personalizado</option>
            </FilterSelect>

            {filters.dateRange === 'custom' && (
              <>
                <FilterLabel>Data Inicial</FilterLabel>
                <FilterInput
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                />
                <FilterLabel>Data Final</FilterLabel>
                <FilterInput
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                />
              </>
            )}
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>🌐 Site</FilterLabel>
            <FilterSelect
              value={filters.siteId || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                siteId: e.target.value || undefined
              }))}
            >
              <option value="">Todos os sites</option>
              {sites?.map(site => (
                <option key={site.id} value={site.id}>
                  {site.url}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>📊 Métrica Principal</FilterLabel>
            <FilterSelect
              value={filters.metric}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                metric: e.target.value as ReportFilters['metric']
              }))}
            >
              <option value="revenue">💰 Receita</option>
              <option value="pageviews">👀 Pageviews</option>
              <option value="ctr">🎯 CTR</option>
              <option value="rpm">💎 RPM</option>
              <option value="optimization_score">⚡ Score Otimização</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>📈 Granularidade</FilterLabel>
            <FilterSelect
              value={filters.granularity}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                granularity: e.target.value as ReportFilters['granularity']
              }))}
            >
              <option value="hourly">📋 Por hora</option>
              <option value="daily">📅 Diário</option>
              <option value="weekly">📊 Semanal</option>
              <option value="monthly">🗓️ Mensal</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>🔄 Comparação</FilterLabel>
            <FilterToggle
              active={filters.comparison}
              onClick={() => setFilters(prev => ({
                ...prev,
                comparison: !prev.comparison
              }))}
            >
              {filters.comparison ? '✅' : '❌'} Período anterior
            </FilterToggle>
          </FilterGroup>
        </FiltersGrid>

        <FilterActions>
          <ActionButton
            variant="secondary"
            onClick={() => setFilters({
              dateRange: 'last_30_days',
              metric: 'revenue',
              granularity: 'daily',
              comparison: false
            })}
          >
            🔄 Limpar Filtros
          </ActionButton>
          <ActionButton
            onClick={() => fetchAnalyticsData()}
            loading={loading}
          >
            📊 Atualizar Dados
          </ActionButton>
        </FilterActions>
      </FiltersContainer>

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <h3>Processando Analytics...</h3>
          <p>Analisando dados de performance e gerando insights</p>
        </LoadingContainer>
      ) : (
        <>
          {/* Summary Section */}
          {reportSummary && (
            <SummarySection>
              <SummaryHeader>
                <SummaryTitle>📈 Resumo do Período</SummaryTitle>
                <SummaryPeriod>
                  {filters.dateRange === 'custom' ?
                    `${filters.startDate} - ${filters.endDate}` :
                    filters.dateRange.replace('_', ' ').toUpperCase()
                  }
                </SummaryPeriod>
              </SummaryHeader>

              <SummaryGrid>
                <MetricsCard
                  title="Receita Total"
                  value={`R$ ${reportSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  trend={reportSummary.periodComparison.revenueChange > 0 ? 'up' :
                    reportSummary.periodComparison.revenueChange < 0 ? 'down' : 'stable'}
                  trendValue={`${Math.abs(reportSummary.periodComparison.revenueChange).toFixed(1)}%`}
                  color="green"
                  icon="💰"
                  isRealTime={true}
                  variant="large"
                />

                <MetricsCard
                  title="Total Pageviews"
                  value={reportSummary.totalPageviews.toLocaleString('pt-BR')}
                  trend={reportSummary.periodComparison.pageviewsChange > 0 ? 'up' :
                    reportSummary.periodComparison.pageviewsChange < 0 ? 'down' : 'stable'}
                  trendValue={`${Math.abs(reportSummary.periodComparison.pageviewsChange).toFixed(1)}%`}
                  color="blue"
                  icon="👀"
                  variant="large"
                />

                <MetricsCard
                  title="RPM Médio"
                  value={`R$ ${reportSummary.averageRpm.toFixed(2)}`}
                  trend={reportSummary.periodComparison.rpmChange > 0 ? 'up' :
                    reportSummary.periodComparison.rpmChange < 0 ? 'down' : 'stable'}
                  trendValue={`${Math.abs(reportSummary.periodComparison.rpmChange).toFixed(1)}%`}
                  color="purple"
                  icon="💎"
                  variant="large"
                />

                <MetricsCard
                  title="CTR Médio"
                  value={`${reportSummary.averageCtr.toFixed(2)}%`}
                  trend={reportSummary.periodComparison.ctrChange > 0 ? 'up' :
                    reportSummary.periodComparison.ctrChange < 0 ? 'down' : 'stable'}
                  trendValue={`${Math.abs(reportSummary.periodComparison.ctrChange).toFixed(1)}%`}
                  color="orange"
                  icon="🎯"
                  variant="large"
                />

                <MetricsCard
                  title="Score Otimização"
                  value={`${reportSummary.averageOptimizationScore.toFixed(1)}%`}
                  trend={reportSummary.periodComparison.optimizationChange > 0 ? 'up' :
                    reportSummary.periodComparison.optimizationChange < 0 ? 'down' : 'stable'}
                  trendValue={`${Math.abs(reportSummary.periodComparison.optimizationChange).toFixed(1)}%`}
                  color={reportSummary.averageOptimizationScore >= 70 ? 'green' : 'orange'}
                  icon="⚡"
                  variant="large"
                />
              </SummaryGrid>
            </SummarySection>
          )}

          {/* Chart Section */}
          <ChartContainer>
            <ChartHeader>
              <ChartTitle>
                📊 Tendência - {filters.metric.charAt(0).toUpperCase() + filters.metric.slice(1)}
              </ChartTitle>
              <ChartControls>
                <ChartButton
                  active={chartType === 'line'}
                  onClick={() => setChartType('line')}
                >
                  📈 Linha
                </ChartButton>
                <ChartButton
                  active={chartType === 'area'}
                  onClick={() => setChartType('area')}
                >
                  📊 Área
                </ChartButton>
                <ChartButton
                  active={chartType === 'bar'}
                  onClick={() => setChartType('bar')}
                >
                  📊 Barras
                </ChartButton>
              </ChartControls>
            </ChartHeader>

            <ChartCanvas>
              {chartData.length > 0 ? (
                <SimpleChart data={chartData} />
              ) : (
                <div>
                  <EmptyIcon>📊</EmptyIcon>
                  <EmptyTitle>Dados insuficientes para gráfico</EmptyTitle>
                  <EmptyDescription>Execute análises para gerar visualizações</EmptyDescription>
                </div>
              )}
            </ChartCanvas>
          </ChartContainer>

          {/* Insights Section */}
          {reportSummary?.recommendations && reportSummary.recommendations.length > 0 && (
            <InsightsSection>
              <SummaryTitle>💡 Insights e Recomendações</SummaryTitle>
              <InsightsGrid>
                {reportSummary.recommendations.map((rec, index) => (
                  <InsightCard key={index} priority={rec.impact}>
                    <InsightHeader>
                      <InsightIcon priority={rec.impact}>
                        {rec.type === 'revenue' ? '💰' :
                         rec.type === 'performance' ? '⚡' : '🎯'}
                      </InsightIcon>
                      <PriorityBadge priority={rec.impact}>
                        {rec.impact === 'high' ? 'Alta' :
                         rec.impact === 'medium' ? 'Média' : 'Baixa'} Prioridade
                      </PriorityBadge>
                    </InsightHeader>
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    <ActionButton
                      variant="primary"
                      onClick={() => {
                        if (rec.type === 'revenue' || rec.type === 'optimization') {
                          navigate('/optimizer');
                        } else {
                          navigate('/analyzer');
                        }
                      }}
                    >
                      {rec.action}
                    </ActionButton>
                  </InsightCard>
                ))}
              </InsightsGrid>
            </InsightsSection>
          )}

          {/* Data Table */}
          {filteredAndSortedData.length > 0 ? (
            <DataTable>
              <TableHeader>
                <TableTitle>📋 Dados Detalhados ({filteredAndSortedData.length} registros)</TableTitle>
                <TableControls>
                  <SearchInput
                    placeholder="Buscar por site..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </TableControls>
              </TableHeader>

              <Table>
                <thead>
                  <TableHeaderRow>
                    <TableHeaderCell onClick={() => handleSort('date')}>
                      Data {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('site_url')}>
                      Site {sortField === 'site_url' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('pageviews')}>
                      Pageviews {sortField === 'pageviews' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('revenue')}>
                      Receita {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('rpm')}>
                      RPM {sortField === 'rpm' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('ctr')}>
                      CTR {sortField === 'ctr' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                    <TableHeaderCell onClick={() => handleSort('optimization_score')}>
                      Score {sortField === 'optimization_score' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHeaderCell>
                  </TableHeaderRow>
                </thead>
                <tbody>
                  {filteredAndSortedData.slice(0, 100).map((item, index) => (
                    <TableRow key={item.id} highlighted={index % 2 === 0}>
                      <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{item.site_url}</TableCell>
                      <TableCell>{item.pageviews.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>R$ {item.revenue.toFixed(2)}</TableCell>
                      <TableCell>R$ {item.rpm.toFixed(2)}</TableCell>
                      <TableCell>{item.ctr.toFixed(2)}%</TableCell>
                      <TableCell>
                        {item.optimization_score ?
                          `${item.optimization_score.toFixed(1)}%` :
                          '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>

              {filteredAndSortedData.length > 100 && (
                <p>Mostrando primeiros 100 registros de {filteredAndSortedData.length} total</p>
              )}
            </DataTable>
          ) : (
            <EmptyState>
              <EmptyIcon>📊</EmptyIcon>
              <EmptyTitle>Nenhum dado encontrado</EmptyTitle>
              <EmptyDescription>
                {searchTerm ?
                  'Nenhum resultado para sua busca. Tente ajustar os filtros.' :
                  'Ajuste os filtros ou realize análises primeiro para ver dados.'
                }
              </EmptyDescription>
              <ActionButton onClick={() => navigate('/analyzer')}>
                🚀 Fazer Análise
              </ActionButton>
            </EmptyState>
          )}

          {/* Export Section */}
          {filteredAndSortedData.length > 0 && (
            <ExportSection>
              <SummaryTitle>📤 Exportar Relatório</SummaryTitle>
              <ExportGrid>
                <ExportButton
                  format="csv"
                  exporting={exporting === 'csv'}
                  onClick={exportToCSV}
                  disabled={!!exporting}
                >
                  <ExportIcon>📊</ExportIcon>
                  CSV
                  <div>{exporting === 'csv' ? 'Gerando...' : 'Planilha Excel'}</div>
                </ExportButton>

                <ExportButton
                  format="pdf"
                  exporting={exporting === 'pdf'}
                  onClick={exportToPDF}
                  disabled={!!exporting}
                >
                  <ExportIcon>📄</ExportIcon>
                  PDF
                  <div>{exporting === 'pdf' ? 'Gerando...' : 'Relatório completo'}</div>
                </ExportButton>

                <ExportButton
                  format="json"
                  exporting={exporting === 'json'}
                  onClick={exportToJSON}
                  disabled={!!exporting}
                >
                  <ExportIcon>💾</ExportIcon>
                  JSON
                  <div>{exporting === 'json' ? 'Preparando...' : 'Dados estruturados'}</div>
                </ExportButton>
              </ExportGrid>
            </ExportSection>
          )}
        </>
      )}
    </RelatoriosContainer>
  );
};

export default Relatorios;
