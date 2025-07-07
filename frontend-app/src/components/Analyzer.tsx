// src/components/Analyzer.tsx - Implementando parsing de CSV no frontend

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData'; // Hook principal para 'sites' e 'refreshFluxData'
import { useAnalyzeAdSense } from '../hooks/usefluxdata'; // Hook especializado para análise
import { AnalyzeAdSensePayload, AnalyzeAdSenseResponse } from '../types/interfaces'; // Tipos globais
import { useToast } from '../hooks/use-toast';
import MetricsCard from './MetricsCard';
import { useAuth } from '../contexts/AuthContext';

// === INTERFACES LOCAIS ===
interface CSVRow {
  [key: string]: string | number;
}

interface ParsedCSVDataSummary {
  total_pageviews: number;
  total_impressions: number;
  total_clicks: number;
  total_revenue: number;
  avg_ctr: number;
  avg_rpm: number;
  avg_cpc: number;
  period_start?: string;
  period_end?: string;
  file_name?: string;
}

interface CSVValidation {
  isValid: boolean;
  rowCount: number;
  columnCount: number;
  hasRequiredColumns: boolean;
  requiredColumns: string[];
  missingColumns: string[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  qualityScore: number;
  errors: string[];
  warnings: string[];
  preview: CSVRow[];
}

interface AnalysisResult { // Interface local para o estado do resultado no componente
  id: string;
  site_id: string;
  client_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_revenue: number;
  total_pageviews: number;
  total_impressions: number;
  total_clicks: number;
  avg_cpc: number;
  avg_ctr: number;
  avg_rpm: number;
  optimization_score: number;
  projected_revenue: number;
  projected_increase: number;
  analysis_results: any;
  opportunities: any[];
  created_at: string;
  processing_time_ms?: number;
}

interface SiteLocal { // Interface local para o site selecionado, pode ser mais simples que a global `Site`
  id: string;
  url: string;
  current_rpm?: number | null;
  monthly_pageviews?: number | null;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  estimatedTime?: number;
}

// === STYLED COMPONENTS (Presumindo que são os mesmos do arquivo original) ===
const dataFlow = keyframes`/* ... */`;
const analysisProgress = keyframes`/* ... */`;
const insightReveal = keyframes`/* ... */`;
const moneyFloat = keyframes`/* ... */`;
const aiThinking = keyframes`/* ... */`;
const AnalyzerContainer = styled.div`max-width: 1400px; margin: 0 auto; padding: 32px 24px; background: #F2F2F7; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;`;
const Header = styled.header`text-align: center; margin-bottom: 40px; position: relative; overflow: hidden;`;
const Title = styled.h1`font-size: 42px; font-weight: 700; background: linear-gradient(135deg, #1D1D1F 0%, #007AFF 50%, #30D158 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px 0; letter-spacing: -0.03em; line-height: 1.1;`;
const Subtitle = styled.p`font-size: 19px; color: #6D6D70; margin: 0 0 8px 0; line-height: 1.47; max-width: 700px; margin-left: auto; margin-right: auto;`;
const PowerBadge = styled.div`display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(48, 209, 88, 0.1) 100%); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 24px; padding: 8px 20px; font-size: 14px; color: #007AFF; font-weight: 600; margin-top: 16px; animation: ${aiThinking} 3s infinite;`;
const MainLayout = styled.div`display: grid; grid-template-columns: 1fr; gap: 32px; @media (min-width: 1200px) { grid-template-columns: 400px 1fr; }`;
const SidePanel = styled.div`background: #FFFFFF; border: 1px solid #E5E5EA; border-radius: 20px; padding: 32px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); height: fit-content; position: sticky; top: 32px;`;
const MainPanel = styled.div`background: #FFFFFF; border: 1px solid #E5E5EA; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); min-height: 600px;`;
const SectionTitle = styled.h3`font-size: 20px; font-weight: 600; color: #1D1D1F; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;`;
const UploadZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`border: 3px dashed ${props => props.isDragOver ? '#30D158' : props.hasFile ? '#007AFF' : '#D1D1D6'}; border-radius: 20px; padding: 48px 24px; text-align: center; background: ${props => props.isDragOver ? 'rgba(48, 209, 88, 0.05)' : props.hasFile ? 'rgba(0, 122, 255, 0.05)' : '#FAFAFA'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; margin-bottom: 32px; &:hover { border-color: ${props => props.hasFile ? '#007AFF' : '#30D158'}; background: ${props => props.hasFile ? 'rgba(0, 122, 255, 0.08)' : 'rgba(48, 209, 88, 0.08)'}; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }`;
const UploadIcon = styled.div<{ hasFile: boolean }>`font-size: 48px; margin-bottom: 16px; animation: ${props => props.hasFile ? 'none' : `${dataFlow} 4s infinite`};`;
const UploadTitle = styled.h4`font-size: 18px; font-weight: 600; color: #1D1D1F; margin: 0 0 8px 0;`;
const UploadDescription = styled.p`font-size: 14px; color: #6D6D70; margin: 0 0 16px 0; line-height: 1.5;`;
const FileInput = styled.input`display: none;`;
const ValidationPanel = styled.div<{ type: 'success' | 'warning' | 'error' }>`background: ${props => { switch (props.type) { case 'success': return 'rgba(48, 209, 88, 0.05)'; case 'warning': return 'rgba(255, 149, 0, 0.05)'; case 'error': return 'rgba(255, 59, 48, 0.05)'; default: return 'rgba(142, 142, 147, 0.05)'; } }}; border: 1px solid ${props => { switch (props.type) { case 'success': return 'rgba(48, 209, 88, 0.15)'; case 'warning': return 'rgba(255, 149, 0, 0.15)'; case 'error': return 'rgba(255, 59, 48, 0.15)'; default: return 'rgba(142, 142, 147, 0.15)'; } }}; border-radius: 16px; padding: 24px; margin-bottom: 24px; animation: ${insightReveal} 0.5s ease-out;`;
const ValidationTitle = styled.h4<{ type: string }>`color: ${props => { switch (props.type) { case 'success': return '#30D158'; case 'warning': return '#FF9500'; case 'error': return '#FF3B30'; default: return '#8E8E93'; } }}; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;`;
const ValidationGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px;`;
const ValidationMetric = styled.div`text-align: center; background: rgba(255, 255, 255, 0.5); border-radius: 12px; padding: 16px;`;
const MetricValue = styled.div`font-size: 24px; font-weight: 700; color: #007AFF; margin-bottom: 4px;`;
const MetricLabel = styled.div`font-size: 11px; color: #6D6D70; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;`;
const SiteSelector = styled.div`margin-bottom: 32px;`;
const SiteGrid = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const SiteCard = styled.div<{ selected: boolean }>`background: ${props => props.selected ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(48, 209, 88, 0.05) 100%)' : '#FAFAFA'}; border: 2px solid ${props => props.selected ? '#007AFF' : '#E5E5EA'}; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; &:hover { border-color: ${props => props.selected ? '#007AFF' : '#D1D1D6'}; background: ${props => props.selected ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(48, 209, 88, 0.08) 100%)' : '#F2F2F7'}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }`;
const SiteInfo = styled.div`display: flex; align-items: center; gap: 16px;`;
const SiteIconStyled = styled.div`width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #007AFF 0%, #30D158 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 600; flex-shrink: 0;`;
const SiteDetails = styled.div`flex: 1; min-width: 0;`;
const SiteName = styled.h4`font-size: 15px; font-weight: 600; color: #1D1D1F; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const SiteMetrics = styled.div`display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: #6D6D70;`;
const ProcessingPanel = styled.div`text-align: center; padding: 40px 24px;`;
const ProcessingSteps = styled.div`margin: 32px 0;`;
const ProcessingStepStyled = styled.div<{ status: string; isActive: boolean }>`display: flex; align-items: center; padding: 16px; margin-bottom: 12px; background: ${props => props.isActive ? 'rgba(0, 122, 255, 0.05)' : '#FAFAFA'}; border: 1px solid ${props => props.status === 'completed' ? '#30D158' : props.status === 'error' ? '#FF3B30' : props.isActive ? '#007AFF' : '#E5E5EA'}; border-radius: 12px; transition: all 0.3s ease; ${props => props.isActive && css`animation: ${aiThinking} 2s infinite;`}`;
const StepIcon = styled.div<{ status: string }>`width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 18px; background: ${props => props.status === 'completed' ? '#30D158' : props.status === 'error' ? '#FF3B30' : props.status === 'processing' ? '#007AFF' : '#E5E5EA'}; color: ${props => props.status === 'pending' ? '#8E8E93' : 'white'}; transition: all 0.3s ease;`;
const StepContent = styled.div`flex: 1; text-align: left;`;
const StepTitle = styled.h5`font-size: 15px; font-weight: 600; color: #1D1D1F; margin: 0 0 4px 0;`;
const StepDescription = styled.p`font-size: 13px; color: #6D6D70; margin: 0; line-height: 1.4;`;
const ProgressBar = styled.div`width: 100%; height: 8px; background: rgba(0, 0, 0, 0.05); border-radius: 4px; margin: 16px 0; overflow: hidden;`;
const ProgressFill = styled.div<{ progress: number }>`height: 100%; width: ${props => props.progress}%; background: linear-gradient(90deg, #007AFF 0%, #30D158 100%); border-radius: 4px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); animation: ${analysisProgress} 3s ease-in-out;`;
const ResultsPanel = styled.div`animation: ${insightReveal} 0.8s ease-out;`;
const ResultsHeader = styled.div`text-align: center; margin-bottom: 32px; padding: 32px; background: linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%); border-radius: 20px; border: 1px solid rgba(48, 209, 88, 0.15);`;
const ResultsTitle = styled.h2`font-size: 28px; font-weight: 700; color: #30D158; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: center; gap: 12px;`;
const RevenueHighlight = styled.div`font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #30D158 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 16px 0; animation: ${moneyFloat} 3s ease-in-out infinite;`;
const MetricsGridStyled = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 32px 0;`;
const OpportunitiesGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 32px 0;`;
const OpportunityCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`background: ${props => { switch (props.priority) { case 'high': return 'rgba(255, 59, 48, 0.03)'; case 'medium': return 'rgba(255, 149, 0, 0.03)'; default: return 'rgba(0, 122, 255, 0.03)'; } }}; border: 1px solid ${props => { switch (props.priority) { case 'high': return 'rgba(255, 59, 48, 0.1)'; case 'medium': return 'rgba(255, 149, 0, 0.1)'; default: return 'rgba(0, 122, 255, 0.1)'; } }}; border-radius: 16px; padding: 24px; border-left: 4px solid ${props => { switch (props.priority) { case 'high': return '#FF3B30'; case 'medium': return '#FF9500'; default: return '#007AFF'; } }}; transition: all 0.3s ease; &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }`;
const ActionButtons = styled.div`display: flex; gap: 16px; justify-content: center; margin-top: 32px; @media (max-width: 768px) { flex-direction: column; align-items: stretch; }`;
const ActionButton = styled.button<any>`background: ${props => { switch (props.variant) { case 'success': return 'linear-gradient(135deg, #30D158 0%, #34C759 100%)'; case 'secondary': return 'transparent'; default: return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)'; } }}; color: ${props => props.variant === 'secondary' ? '#007AFF' : '#FFFFFF'}; border: ${props => props.variant === 'secondary' ? '2px solid #E5E5EA' : 'none'}; border-radius: 12px; padding: 16px 28px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 16px; font-weight: 600; cursor: ${props => props.loading ? 'not-allowed' : 'pointer'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); min-height: 52px; min-width: 160px; display: flex; align-items: center; justify-content: center; gap: 8px; ${props => !props.variant || props.variant === 'primary' ? css`box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);` : ''} &:hover:not(:disabled) { background: ${props => { switch (props.variant) { case 'success': return 'linear-gradient(135deg, #28B946 0%, #30D158 100%)'; case 'secondary': return '#F2F2F7'; default: return 'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)'; } }}; transform: translateY(-2px); box-shadow: ${props => props.variant === 'secondary' ? '0 4px 16px rgba(0, 0, 0, 0.08)' : '0 8px 32px rgba(0, 122, 255, 0.32)'}; } &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }`;
const EmptyState = styled.div`text-align: center; padding: 80px 40px; color: #6D6D70;`;
const EmptyIconStyled = styled.div`font-size: 64px; margin-bottom: 24px; opacity: 0.6;`;
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; PowerBadge.defaultProps = { children: React.createElement(React.Fragment) }; MainLayout.defaultProps = { children: React.createElement(React.Fragment) }; SidePanel.defaultProps = { children: React.createElement(React.Fragment) }; MainPanel.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadZone.defaultProps = { children: React.createElement(React.Fragment) }; UploadIcon.defaultProps = { children: React.createElement(React.Fragment) }; UploadTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadDescription.defaultProps = { children: React.createElement(React.Fragment) }; FileInput.defaultProps = { children: React.createElement(React.Fragment) }; ValidationPanel.defaultProps = { children: React.createElement(React.Fragment) }; ValidationTitle.defaultProps = { children: React.createElement(React.Fragment) }; ValidationGrid.defaultProps = { children: React.createElement(React.Fragment) }; ValidationMetric.defaultProps = { children: React.createElement(React.Fragment) }; MetricValue.defaultProps = { children: React.createElement(React.Fragment) }; MetricLabel.defaultProps = { children: React.createElement(React.Fragment) }; SiteSelector.defaultProps = { children: React.createElement(React.Fragment) }; SiteGrid.defaultProps = { children: React.createElement(React.Fragment) }; SiteCard.defaultProps = { children: React.createElement(React.Fragment) }; SiteInfo.defaultProps = { children: React.createElement(React.Fragment) }; SiteIconStyled.defaultProps = { children: React.createElement(React.Fragment) }; SiteDetails.defaultProps = { children: React.createElement(React.Fragment) }; SiteName.defaultProps = { children: React.createElement(React.Fragment) }; SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingPanel.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingStepStyled.defaultProps = { children: React.createElement(React.Fragment) }; StepIcon.defaultProps = { children: React.createElement(React.Fragment) }; StepContent.defaultProps = { children: React.createElement(React.Fragment) }; StepTitle.defaultProps = { children: React.createElement(React.Fragment) }; StepDescription.defaultProps = { children: React.createElement(React.Fragment) }; ProgressBar.defaultProps = { children: React.createElement(React.Fragment) }; ProgressFill.defaultProps = { children: React.createElement(React.Fragment) }; ResultsPanel.defaultProps = { children: React.createElement(React.Fragment) }; ResultsHeader.defaultProps = { children: React.createElement(React.Fragment) }; ResultsTitle.defaultProps = { children: React.createElement(React.Fragment) }; RevenueHighlight.defaultProps = { children: React.createElement(React.Fragment) }; MetricsGridStyled.defaultProps = { children: React.createElement(React.Fragment) }; OpportunitiesGrid.defaultProps = { children: React.createElement(React.Fragment) }; OpportunityCard.defaultProps = { children: React.createElement(React.Fragment) }; ActionButtons.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; EmptyState.defaultProps = { children: React.createElement(React.Fragment) }; EmptyIconStyled.defaultProps = { children: React.createElement(React.Fragment) };


const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData: refreshFluxData } = useFluxData();
  const { analyzeCSV, loading: analysisHookLoading, error: analysisHookError } = useAnalyzeAdSense();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvSummary, setParsedCsvSummary] = useState<ParsedCSVDataSummary | null>(null);
  const [validation, setValidation] = useState<CSVValidation | null>(null);
  const [isProcessingUI, setIsProcessingUI] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const siteParam = searchParams.get('site');
    if (siteParam && sites?.some(site => site.id === siteParam)) {
        setSelectedSiteId(siteParam);
    }
  }, [searchParams, sites]);

  const selectedSite = useMemo(() => sites?.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const parseAndValidateCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');

      if (lines.length < 2) {
        const err = "Arquivo CSV inválido: requer cabeçalho e pelo menos uma linha de dados.";
        setValidation({ isValid: false, errors: [err], warnings:[], columnCount:0,dataQuality:'poor',hasRequiredColumns:false,missingColumns:[],preview:[],qualityScore:0,rowCount:0,requiredColumns:REQUIRED_CSV_HEADERS_STANDARD });
        toast({ title: 'Erro no CSV', description: err, variant: 'destructive'});
        setParsedCsvSummary(null);
        return;
      }

      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const normalizedHeaders = rawHeaders.map(normalizeHeader);

      const headerMap: { [key: string]: number } = {};
      normalizedHeaders.forEach((h, i) => {
        // Priorizar mapeamentos mais completos primeiro
        for (const [adsenseHeader, standardHeaderKey] of Object.entries(ADSENSE_COLUMN_MAPPING)) {
            if (h.includes(adsenseHeader) && !Object.values(headerMap).includes(standardHeaderKey as any)) {
                 headerMap[standardHeaderKey as string] = i;
                 break;
            }
        }
        // Fallback para mapeamentos parciais se não encontrado um completo
        if (!Object.values(headerMap).includes(h as any)) {
            for (const [adsenseHeader, standardHeaderKey] of Object.entries(ADSENSE_COLUMN_MAPPING)) {
                if (h === adsenseHeader && !Object.values(headerMap).includes(standardHeaderKey as any)) {
                    headerMap[standardHeaderKey as string] = i;
                    break;
                }
            }
        }
      });

      const missingStandardHeaders: string[] = REQUIRED_CSV_HEADERS_STANDARD.filter(
        standardHeader => headerMap[standardHeader as string] === undefined
      );
      const hasRequired = missingStandardHeaders.length === 0;

      let tempSummary: ParsedCSVDataSummary = {
        total_pageviews: 0, total_impressions: 0, total_clicks: 0, total_revenue: 0,
        avg_ctr: 0, avg_rpm: 0, avg_cpc: 0, file_name: file.name
      };
      const previewData: CSVRow[] = [];
      let minDate: Date | null = null;
      let maxDate: Date | null = null;
      const dataRowCount = lines.length - 1;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const rowObject: CSVRow = {};

        // Popular rowObject usando headerMap e rawHeaders para referência de índice
        rawHeaders.forEach((rawHeader, index) => {
            const normalizedCurrentHeader = normalizeHeader(rawHeader);
            // Encontrar qual standardHeader corresponde a este normalizedCurrentHeader
            let standardKey: keyof ParsedCSVDataSummary | 'skip' | undefined;
            for(const [key, val] of Object.entries(ADSENSE_COLUMN_MAPPING)){
                if(normalizedCurrentHeader.includes(key)){
                    standardKey = val;
                    break;
                }
            }
            if(standardKey && standardKey !== 'skip'){
                 let value: string | number = values[index];
                 if (['total_pageviews', 'total_impressions', 'total_clicks', 'total_revenue', 'avg_rpm', 'avg_ctr', 'avg_cpc'].includes(standardKey)) {
                    const cleanedValue = value.toString().replace(/R\$\s?/g, '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(/,/g, '.');
                    value = parseFloat(cleanedValue) || 0;
                 }
                 rowObject[standardKey] = value;
            }
        });

        if (i <= 5) previewData.push(rowObject);

        tempSummary.total_pageviews += (rowObject.total_pageviews as number || 0);
        tempSummary.total_impressions += (rowObject.total_impressions as number || 0);
        tempSummary.total_clicks += (rowObject.total_clicks as number || 0);
        tempSummary.total_revenue += (rowObject.total_revenue as number || 0);

        const dateStr = rowObject['period_start'] as string; // 'date' é mapeado para 'period_start'
        if (dateStr) {
            let currentDate: Date | null = null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { currentDate = new Date(dateStr + "T00:00:00"); } // Adicionar T00 para evitar problemas de fuso
            else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dateStr)) { const p = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!; currentDate = new Date(Date.parse(`${p[2]}/${p[1]}/${p[3]}`)); } // MM/DD/YYYY
            else if (/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(dateStr)) { const p = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)!; currentDate = new Date(Date.parse(`${p[2]}-${p[1]}-${p[0]}`)); } // DD.MM.YYYY

            if (currentDate && !isNaN(currentDate.getTime())) {
                if (!minDate || currentDate < minDate) minDate = currentDate;
                if (!maxDate || currentDate > maxDate) maxDate = currentDate;
            }
        }
      }

      tempSummary.avg_ctr = tempSummary.total_impressions > 0 ? (tempSummary.total_clicks / tempSummary.total_impressions) * 100 : 0;
      tempSummary.avg_rpm = tempSummary.total_pageviews > 0 ? (tempSummary.total_revenue / tempSummary.total_pageviews) * 1000 : 0;
      tempSummary.avg_cpc = tempSummary.total_clicks > 0 ? tempSummary.total_revenue / tempSummary.total_clicks : 0;
      tempSummary.period_start = minDate ? minDate.toISOString().split('T')[0] : undefined;
      tempSummary.period_end = maxDate ? maxDate.toISOString().split('T')[0] : undefined;

      setParsedCsvSummary(tempSummary);

      let qualityScore = 0;
      if (hasRequired) qualityScore += 50;
      if (dataRowCount >= 30) qualityScore += 30; else if (dataRowCount >= 7) qualityScore += 15;
      if (tempSummary.period_start && tempSummary.period_end) qualityScore += 20;
      qualityScore = Math.min(100, qualityScore);

      const dataQualityVal: CSVValidation['dataQuality'] = qualityScore >= 80 ? 'excellent' : qualityScore >= 60 ? 'good' : qualityScore >= 40 ? 'fair' : 'poor';
      const errors: string[] = [];
      if (!hasRequired) errors.push(`Colunas essenciais não encontradas: ${missingStandardHeaders.join(', ')}. Verifique o mapeamento.`);
      if (dataRowCount < 1) errors.push("Nenhuma linha de dados válida encontrada no CSV.");

      const currentValidation: CSVValidation = {
        isValid: hasRequired && dataRowCount > 0,
        rowCount: dataRowCount,
        columnCount: rawHeaders.length,
        hasRequiredColumns: hasRequired,
        requiredColumns: REQUIRED_CSV_HEADERS_STANDARD,
        missingColumns: missingStandardHeaders,
        dataQuality: dataQualityVal,
        qualityScore,
        errors,
        warnings: dataRowCount < 7 && dataRowCount > 0 ? ['Poucos dados para análise ideal (recomendado: 7+ dias).'] : [],
        preview: previewData
      };
      setValidation(currentValidation);

      if (currentValidation.isValid) {
        toast({ title: 'CSV Processado e Validado! ✅', description: `${dataRowCount} registros lidos. Pronto para análise IA.` });
      } else {
        toast({ title: 'Erro no Processamento do CSV', description: currentValidation.errors.join('; ') || 'Verifique o formato e as colunas do CSV.', variant: 'destructive'});
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, [toast]);

  const handleDropCb = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); const found = files.find(f => f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv')); if (found) { setCsvFile(found); parseAndValidateCSV(found); } else { toast({ title: 'Arquivo Inválido', description: 'CSV apenas.', variant: 'destructive' }); } }, [toast, parseAndValidateCSV]);
  const handleFileSelectCb = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setCsvFile(file); parseAndValidateCSV(file); } }, [parseAndValidateCSV]);

  const initializeProcessingSteps = useCallback(() => { /* ... */ const steps: ProcessingStep[] = [ { id: 'parsing', title: 'Preparando Dados', description: 'Enviando dados sumarizados para análise', status: 'processing', progress: 0, estimatedTime: 5 }, { id: 'analysis', title: 'Análise Inteligente', description: 'IA identificando padrões e oportunidades', status: 'pending', progress: 0, estimatedTime: 20 }, { id: 'optimization', title: 'Detectando Oportunidades', description: 'Calculando potencial de otimização', status: 'pending', progress: 0, estimatedTime: 15 }, { id: 'report', title: 'Gerando Relatório', description: 'Compilando insights e recomendações', status: 'pending', progress: 0, estimatedTime: 10 } ]; setProcessingSteps(steps); }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => { /* ... */ setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const startAnalysis = useCallback(async () => {
    if (!selectedSiteId || !parsedCsvSummary || !validation?.isValid || !user?.id) {
      toast({ title: 'Dados Incompletos', description: 'Selecione um site e carregue e processe um CSV válido.', variant: 'destructive' });
      return;
    }

    setIsProcessingUI(true);
    initializeProcessingSteps();
    const startTime = Date.now();

    try {
      updateProcessingStep('parsing', { status: 'processing', progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('parsing', { status: 'completed', progress: 100 });

      updateProcessingStep('analysis', { status: 'processing', progress: 30 });

      const payloadForEF: AnalyzeAdSensePayload = {
        ...parsedCsvSummary,
        site_id: selectedSiteId,
        site_url: selectedSite?.url,
        client_id: user.id,
        validation_info: {
            rowCount: validation.rowCount,
            columnCount: validation.columnCount,
            dataQuality: validation.dataQuality,
            qualityScore: validation.qualityScore,
        },
        timestamp: new Date().toISOString()
      };

      const efResponse = await analyzeCSV(payloadForEF);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na análise da Edge Function');
      }

      updateProcessingStep('analysis', { status: 'completed', progress: 100 });
      // ... (outros passos de UI e construção de AnalysisResult como antes) ...
      updateProcessingStep('optimization', { status: 'processing', progress: 60 }); await new Promise(resolve => setTimeout(resolve, 1000)); updateProcessingStep('optimization', { status: 'completed', progress: 100 }); updateProcessingStep('report', { status: 'processing', progress: 80 }); await new Promise(resolve => setTimeout(resolve, 500)); updateProcessingStep('report', { status: 'completed', progress: 100 });
      const processingTime = Date.now() - startTime;
      const resultData: AnalysisResult = {
        id: efResponse.analysis_id || `local_${Date.now()}`,
        site_id: selectedSiteId, client_id: user.id, status: 'completed',
        total_revenue: efResponse.metrics?.total_revenue ?? parsedCsvSummary.total_revenue,
        total_pageviews: efResponse.metrics?.total_pageviews ?? parsedCsvSummary.total_pageviews,
        total_impressions: efResponse.metrics?.total_impressions ?? parsedCsvSummary.total_impressions,
        total_clicks: efResponse.metrics?.total_clicks ?? parsedCsvSummary.total_clicks,
        avg_cpc: efResponse.metrics?.avg_cpc ?? parsedCsvSummary.avg_cpc,
        avg_ctr: efResponse.metrics?.avg_ctr ?? parsedCsvSummary.avg_ctr,
        avg_rpm: efResponse.metrics?.avg_rpm ?? parsedCsvSummary.avg_rpm,
        optimization_score: efResponse.optimization_score || 0,
        projected_revenue: efResponse.projected_revenue || 0,
        projected_increase: efResponse.projected_increase || 0,
        analysis_results: efResponse.analysis_results || {},
        opportunities: efResponse.opportunities || [],
        created_at: new Date().toISOString(),
        processing_time_ms: processingTime
      };
      setAnalysisResult(resultData);
      toast({ title: 'Análise Concluída! 🚀', description: `Processamento via EF em ${(processingTime / 1000).toFixed(1)}s. ${efResponse.message || ''}` });

    } catch (error: any) { /* ... (tratamento de erro como antes) ... */ console.error('❌ Erro na análise:', error); const currentProcessingStep = processingSteps.find(s => s.status === 'processing'); if (currentProcessingStep) { updateProcessingStep(currentProcessingStep.id, { status: 'error', progress: 0 }); } toast({ title: 'Erro na Análise', description: error.message || 'Erro ao processar dados. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessingUI(false);
    }
  }, [selectedSiteId, parsedCsvSummary, validation, selectedSite, user, initializeProcessingSteps, updateProcessingStep, processingSteps, toast, analyzeCSV]);

  const resetAnalysis = useCallback(() => { setCsvFile(null); setParsedCsvSummary(null); setValidation(null); setAnalysisResult(null); setProcessingSteps([]); setIsProcessingUI(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } }, []);

  // === RENDER (O JSX principal permanece o mesmo) ===
  if (!user) { return ( <AnalyzerContainer> <EmptyState> <EmptyIconStyled>🔒</EmptyIconStyled> <h3>Acesso Restrito</h3> <p>Faça login para acessar o analisador AdSense.</p> </EmptyState> </AnalyzerContainer> ); }
  return ( <AnalyzerContainer> {/* ... Conteúdo JSX ... */} </AnalyzerContainer> );
};

export default Analyzer;
