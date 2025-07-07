// src/components/Analyzer.tsx - ENTERPRISE GRADE ADSENSE ANALYSIS ENGINE CORRIGIDO

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components'; // Presumindo que os styled-components permanecem os mesmos
import { useFluxData } from '../hooks/useFluxData';
import { AnalyzeAdSensePayload, AnalyzeAdSenseResponse } from '../types/interfaces'; // Importar tipos explicitamente
import { useToast } from '../hooks/use-toast';
import MetricsCard from './MetricsCard';
import { useAuth } from '../contexts/AuthContext';

// === INTERFACES LOCAIS (CSVValidation, AnalysisResult, Site local, NicheData, ProcessingStep) - Presumindo que permanecem as mesmas ===
// ... (Omitidas para brevidade, mas devem estar aqui como no arquivo original)
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
    preview: any[];
  }

  interface AnalysisResult { // Esta interface será populada pela AnalyzeAdSenseResponse
    id: string; // Virá de analysis_id da resposta da EF
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

  interface Site { // Esta é a interface local, pode ser diferente da global em useFluxData
    id: string;
    url: string;
    client_id: string;
    name?: string;
    monthly_pageviews?: number;
    current_rpm?: number;
    target_rpm?: number;
    script_installed?: boolean;
    created_at: string;
  }

  interface ProcessingStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    estimatedTime?: number;
  }

// === STYLED COMPONENTS (Omitidos para brevidade, mas devem estar aqui como no arquivo original) ===
// ... (Todos os styled-components como AnalyzerContainer, Header, Title, etc.)
// Copiando os styled components para garantir que o arquivo seja completo
const dataFlow = keyframes`
  0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100vw) rotate(360deg); opacity: 0; }
`;
const analysisProgress = keyframes`
  0% { width: 0%; background: #007AFF; }
  33% { width: 33%; background: #30D158; }
  66% { width: 66%; background: #FF9500; }
  100% { width: 100%; background: #30D158; }
`;
const insightReveal = keyframes`
  0% { opacity: 0; transform: translateY(40px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const moneyFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-5deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;
const aiThinking = keyframes`
  0%, 100% { border-color: #007AFF; box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4); }
  50% { border-color: #30D158; box-shadow: 0 0 0 20px rgba(48, 209, 88, 0); }
`;
const AnalyzerContainer = styled.div`
  max-width: 1400px; margin: 0 auto; padding: 32px 24px; background: #F2F2F7; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
`;
const Header = styled.header`
  text-align: center; margin-bottom: 40px; position: relative; overflow: hidden;
`;
const Title = styled.h1`
  font-size: 42px; font-weight: 700; background: linear-gradient(135deg, #1D1D1F 0%, #007AFF 50%, #30D158 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px 0; letter-spacing: -0.03em; line-height: 1.1;
`;
const Subtitle = styled.p`
  font-size: 19px; color: #6D6D70; margin: 0 0 8px 0; line-height: 1.47; max-width: 700px; margin-left: auto; margin-right: auto;
`;
const PowerBadge = styled.div`
  display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(48, 209, 88, 0.1) 100%); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 24px; padding: 8px 20px; font-size: 14px; color: #007AFF; font-weight: 600; margin-top: 16px; animation: ${aiThinking} 3s infinite;
`;
const MainLayout = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 32px; @media (min-width: 1200px) { grid-template-columns: 400px 1fr; }
`;
const SidePanel = styled.div`
  background: #FFFFFF; border: 1px solid #E5E5EA; border-radius: 20px; padding: 32px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); height: fit-content; position: sticky; top: 32px;
`;
const MainPanel = styled.div`
  background: #FFFFFF; border: 1px solid #E5E5EA; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); min-height: 600px;
`;
const SectionTitle = styled.h3`
  font-size: 20px; font-weight: 600; color: #1D1D1F; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;
`;
const UploadZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 3px dashed ${props => props.isDragOver ? '#30D158' : props.hasFile ? '#007AFF' : '#D1D1D6'}; border-radius: 20px; padding: 48px 24px; text-align: center; background: ${props => props.isDragOver ? 'rgba(48, 209, 88, 0.05)' : props.hasFile ? 'rgba(0, 122, 255, 0.05)' : '#FAFAFA'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; margin-bottom: 32px;
  &:hover { border-color: ${props => props.hasFile ? '#007AFF' : '#30D158'}; background: ${props => props.hasFile ? 'rgba(0, 122, 255, 0.08)' : 'rgba(48, 209, 88, 0.08)'}; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }
`;
const UploadIcon = styled.div<{ hasFile: boolean }>`
  font-size: 48px; margin-bottom: 16px; animation: ${props => props.hasFile ? 'none' : `${dataFlow} 4s infinite`};
`;
const UploadTitle = styled.h4`
  font-size: 18px; font-weight: 600; color: #1D1D1F; margin: 0 0 8px 0;
`;
const UploadDescription = styled.p`
  font-size: 14px; color: #6D6D70; margin: 0 0 16px 0; line-height: 1.5;
`;
const FileInput = styled.input` display: none; `;
const ValidationPanel = styled.div<{ type: 'success' | 'warning' | 'error' }>`
  background: ${props => { switch (props.type) { case 'success': return 'rgba(48, 209, 88, 0.05)'; case 'warning': return 'rgba(255, 149, 0, 0.05)'; case 'error': return 'rgba(255, 59, 48, 0.05)'; default: return 'rgba(142, 142, 147, 0.05)'; } }};
  border: 1px solid ${props => { switch (props.type) { case 'success': return 'rgba(48, 209, 88, 0.15)'; case 'warning': return 'rgba(255, 149, 0, 0.15)'; case 'error': return 'rgba(255, 59, 48, 0.15)'; default: return 'rgba(142, 142, 147, 0.15)'; } }};
  border-radius: 16px; padding: 24px; margin-bottom: 24px; animation: ${insightReveal} 0.5s ease-out;
`;
const ValidationTitle = styled.h4<{ type: string }>`
  color: ${props => { switch (props.type) { case 'success': return '#30D158'; case 'warning': return '#FF9500'; case 'error': return '#FF3B30'; default: return '#8E8E93'; } }};
  font-size: 16px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;
`;
const ValidationGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px;
`;
const ValidationMetric = styled.div`
  text-align: center; background: rgba(255, 255, 255, 0.5); border-radius: 12px; padding: 16px;
`;
const MetricValue = styled.div`
  font-size: 24px; font-weight: 700; color: #007AFF; margin-bottom: 4px;
`;
const MetricLabel = styled.div`
  font-size: 11px; color: #6D6D70; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;
`;
const SiteSelector = styled.div` margin-bottom: 32px; `;
const SiteGrid = styled.div` display: flex; flex-direction: column; gap: 12px; `;
const SiteCard = styled.div<{ selected: boolean }>`
  background: ${props => props.selected ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(48, 209, 88, 0.05) 100%)' : '#FAFAFA'}; border: 2px solid ${props => props.selected ? '#007AFF' : '#E5E5EA'}; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative;
  &:hover { border-color: ${props => props.selected ? '#007AFF' : '#D1D1D6'}; background: ${props => props.selected ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(48, 209, 88, 0.08) 100%)' : '#F2F2F7'}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
`;
const SiteInfo = styled.div` display: flex; align-items: center; gap: 16px; `;
const SiteIcon = styled.div`
  width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #007AFF 0%, #30D158 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 600; flex-shrink: 0;
`;
const SiteDetails = styled.div` flex: 1; min-width: 0; `;
const SiteName = styled.h4`
  font-size: 15px; font-weight: 600; color: #1D1D1F; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const SiteMetrics = styled.div`
  display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: #6D6D70;
`;
const ProcessingPanel = styled.div` text-align: center; padding: 40px 24px; `;
const ProcessingSteps = styled.div` margin: 32px 0; `;
const ProcessingStep = styled.div<{ status: string; isActive: boolean }>`
  display: flex; align-items: center; padding: 16px; margin-bottom: 12px; background: ${props => props.isActive ? 'rgba(0, 122, 255, 0.05)' : '#FAFAFA'}; border: 1px solid ${props => props.status === 'completed' ? '#30D158' : props.status === 'error' ? '#FF3B30' : props.isActive ? '#007AFF' : '#E5E5EA'}; border-radius: 12px; transition: all 0.3s ease;
  ${props => props.isActive && css`animation: ${aiThinking} 2s infinite;`}
`;
const StepIcon = styled.div<{ status: string }>`
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 18px; background: ${props => props.status === 'completed' ? '#30D158' : props.status === 'error' ? '#FF3B30' : props.status === 'processing' ? '#007AFF' : '#E5E5EA'}; color: ${props => props.status === 'pending' ? '#8E8E93' : 'white'}; transition: all 0.3s ease;
`;
const StepContent = styled.div` flex: 1; text-align: left; `;
const StepTitle = styled.h5` font-size: 15px; font-weight: 600; color: #1D1D1F; margin: 0 0 4px 0; `;
const StepDescription = styled.p` font-size: 13px; color: #6D6D70; margin: 0; line-height: 1.4; `;
const ProgressBar = styled.div`
  width: 100%; height: 8px; background: rgba(0, 0, 0, 0.05); border-radius: 4px; margin: 16px 0; overflow: hidden;
`;
const ProgressFill = styled.div<{ progress: number }>`
  height: 100%; width: ${props => props.progress}%; background: linear-gradient(90deg, #007AFF 0%, #30D158 100%); border-radius: 4px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); animation: ${analysisProgress} 3s ease-in-out;
`;
const ResultsPanel = styled.div` animation: ${insightReveal} 0.8s ease-out; `;
const ResultsHeader = styled.div`
  text-align: center; margin-bottom: 32px; padding: 32px; background: linear-gradient(135deg, rgba(48, 209, 88, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%); border-radius: 20px; border: 1px solid rgba(48, 209, 88, 0.15);
`;
const ResultsTitle = styled.h2`
  font-size: 28px; font-weight: 700; color: #30D158; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: center; gap: 12px;
`;
const RevenueHighlight = styled.div`
  font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #30D158 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 16px 0; animation: ${moneyFloat} 3s ease-in-out infinite;
`;
const MetricsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 32px 0;
`;
const OpportunitiesGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 32px 0;
`;
const OpportunityCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`
  background: ${props => { switch (props.priority) { case 'high': return 'rgba(255, 59, 48, 0.03)'; case 'medium': return 'rgba(255, 149, 0, 0.03)'; default: return 'rgba(0, 122, 255, 0.03)'; } }};
  border: 1px solid ${props => { switch (props.priority) { case 'high': return 'rgba(255, 59, 48, 0.1)'; case 'medium': return 'rgba(255, 149, 0, 0.1)'; default: return 'rgba(0, 122, 255, 0.1)'; } }};
  border-radius: 16px; padding: 24px; border-left: 4px solid ${props => { switch (props.priority) { case 'high': return '#FF3B30'; case 'medium': return '#FF9500'; default: return '#007AFF'; } }};
  transition: all 0.3s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }
`;
const ActionButtons = styled.div`
  display: flex; gap: 16px; justify-content: center; margin-top: 32px;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
`;
const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success'; loading?: boolean; }>`
  background: ${props => { switch (props.variant) { case 'success': return 'linear-gradient(135deg, #30D158 0%, #34C759 100%)'; case 'secondary': return 'transparent'; default: return 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)'; } }};
  color: ${props => props.variant === 'secondary' ? '#007AFF' : '#FFFFFF'}; border: ${props => props.variant === 'secondary' ? '2px solid #E5E5EA' : 'none'}; border-radius: 12px; padding: 16px 28px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; font-size: 16px; font-weight: 600; cursor: ${props => props.loading ? 'not-allowed' : 'pointer'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); min-height: 52px; min-width: 160px; display: flex; align-items: center; justify-content: center; gap: 8px;
  ${props => !props.variant || props.variant === 'primary' ? css`box-shadow: 0 4px 16px rgba(0, 122, 255, 0.24);` : ''}
  &:hover:not(:disabled) { background: ${props => { switch (props.variant) { case 'success': return 'linear-gradient(135deg, #28B946 0%, #30D158 100%)'; case 'secondary': return '#F2F2F7'; default: return 'linear-gradient(135deg, #0056CC 0%, #007AFF 100%)'; } }}; transform: translateY(-2px); box-shadow: ${props => props.variant === 'secondary' ? '0 4px 16px rgba(0, 0, 0, 0.08)' : '0 8px 32px rgba(0, 122, 255, 0.32)'}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;
const EmptyState = styled.div` text-align: center; padding: 80px 40px; color: #6D6D70; `;
const EmptyIcon = styled.div` font-size: 64px; margin-bottom: 24px; opacity: 0.6; `;


// === COMPONENT PRINCIPAL ===
const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  // Desestruturar invokeAnalyzeAdSense e remover a função local fetchUserSites
  const { sites, refreshData, invokeAnalyzeAdSense } = useFluxData();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [validation, setValidation] = useState<CSVValidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // Usará a interface local
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // const processingIntervalRef = useRef<NodeJS.Timeout>(); // Não parece estar sendo usado

  useEffect(() => {
    const siteParam = searchParams.get('site');
    if (siteParam && sites?.some(site => site.id === siteParam)) {
      setSelectedSiteId(siteParam);
    } else if (sites && sites.length > 0 && !selectedSiteId) {
      // Opcional: pré-selecionar o primeiro site se nenhum estiver nos params
      // setSelectedSiteId(sites[0].id);
    }
  }, [searchParams, sites, selectedSiteId]);

  // Removida a função fetchUserSites, pois 'sites' agora vem de useFluxData

  const selectedSite = useMemo(() => {
    // 'sites' vem diretamente do useFluxData agora
    return sites?.find(s => s.id === selectedSiteId);
  }, [sites, selectedSiteId]);

  const handleDragOver = useCallback((e: React.DragEvent) => { /* ... (sem mudanças) ... */ e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { /* ... (sem mudanças) ... */ e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const foundCsvFile = files.find(file => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'));
    if (foundCsvFile) {
      setCsvFile(foundCsvFile);
      readCSVFile(foundCsvFile);
    } else {
      toast({ title: 'Arquivo Inválido', description: 'Por favor, envie apenas arquivos CSV.', variant: 'destructive' });
    }
  }, [toast]); // readCSVFile será adicionado como dependência abaixo

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { /* ... (sem mudanças) ... */ const file = e.target.files?.[0]; if (file) { setCsvFile(file); readCSVFile(file); } }, []); // readCSVFile será adicionado

  const validateCSV = useCallback((content: string) => {
    // ... (lógica de validateCSV permanece a mesma) ...
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
    const requiredColumns = ['date', 'ad_unit_name', 'ad_unit_id', 'clicks', 'impressions', 'revenue', 'page_views', 'ctr', 'cpc', 'rpm'];
    const missingColumns = requiredColumns.filter(col => !headers?.some(h => h.includes(col.replace('_', ' ')) || h.includes(col)));
    const hasRequiredColumns = missingColumns.length === 0;
    const rowCount = lines.length - 1;
    const columnCount = headers?.length || 0;
    let qualityScore = 0;
    if (hasRequiredColumns) qualityScore += 40;
    if (rowCount >= 30) qualityScore += 30; // Maior peso para mais dados
    if (rowCount >= 90) qualityScore += 20; // Bônus para dados extensos
    if (columnCount >= 10) qualityScore += 10;
    const dataQuality: CSVValidation['dataQuality'] = qualityScore >= 80 ? 'excellent' : qualityScore >= 60 ? 'good' : qualityScore >= 40 ? 'fair' : 'poor';
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!hasRequiredColumns) errors.push(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
    if (rowCount < 7) warnings.push('Poucos dados para análise confiável (recomendado: 30+ dias)');
    if (columnCount < 8) warnings.push('Dados podem estar incompletos');
    const preview = lines.slice(1, 6).map(line => { const values = line.split(','); return headers?.reduce((obj: any, header, index) => { obj[header] = values[index]?.trim() || ''; return obj; }, {}) || {}; });
    const currentValidation: CSVValidation = { isValid: hasRequiredColumns && rowCount > 0, rowCount, columnCount, hasRequiredColumns, requiredColumns, missingColumns, dataQuality, qualityScore, errors, warnings, preview };
    setValidation(currentValidation);
    if (currentValidation.isValid) {
      toast({ title: 'CSV Validado! ✅', description: `${rowCount} registros carregados com qualidade ${dataQuality}.` });
    } else if (currentValidation.errors.length > 0) {
        toast({ title: 'Erro na Validação do CSV', description: currentValidation.errors.join('; '), variant: 'destructive'});
    }
  }, [toast]);

  const readCSVFile = useCallback((file: File) => {
    // ... (lógica de readCSVFile permanece a mesma, mas agora usa validateCSV que é dependência) ...
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      validateCSV(content); // validateCSV é chamado aqui
    };
    reader.readAsText(file);
  }, [validateCSV]); // validateCSV adicionado como dependência


  const initializeProcessingSteps = useCallback(() => { /* ... (sem mudanças) ... */ const steps: ProcessingStep[] = [ { id: 'parsing', title: 'Processando Dados', description: 'Analisando e validando dados do CSV', status: 'processing', progress: 0, estimatedTime: 10 }, { id: 'analysis', title: 'Análise Inteligente', description: 'IA identificando padrões e oportunidades', status: 'pending', progress: 0, estimatedTime: 20 }, { id: 'optimization', title: 'Detectando Oportunidades', description: 'Calculando potencial de otimização', status: 'pending', progress: 0, estimatedTime: 15 }, { id: 'report', title: 'Gerando Relatório', description: 'Compilando insights e recomendações', status: 'pending', progress: 0, estimatedTime: 10 } ]; setProcessingSteps(steps); }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => { /* ... (sem mudanças) ... */ setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const startAnalysis = useCallback(async () => {
    if (!selectedSiteId || !csvData || !validation?.isValid || !user?.id) {
      toast({ title: 'Dados Incompletos', description: 'Selecione um site, carregue um CSV válido e certifique-se de estar logado.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    initializeProcessingSteps();
    const startTime = Date.now();

    try {
      updateProcessingStep('parsing', { status: 'processing', progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação mais curta
      updateProcessingStep('parsing', { status: 'completed', progress: 100 });

      updateProcessingStep('analysis', { status: 'processing', progress: 30 });

      const payload: AnalyzeAdSensePayload = {
        csv_data: csvData,
        site_id: selectedSiteId,
        site_url: selectedSite?.url,
        client_id: user.id, // Usar user.id que é o client_id
        validation_info: validation, // Passar informações de validação
        timestamp: new Date().toISOString()
      };

      // Usar a função do hook useFluxData
      const efResponse = await invokeAnalyzeAdSense(payload);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na análise da Edge Function');
      }

      // analysisData agora é efResponse
      updateProcessingStep('analysis', { status: 'completed', progress: 100 });

      updateProcessingStep('optimization', { status: 'processing', progress: 60 });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulação
      updateProcessingStep('optimization', { status: 'completed', progress: 100 });

      updateProcessingStep('report', { status: 'processing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      updateProcessingStep('report', { status: 'completed', progress: 100 });

      const processingTime = Date.now() - startTime;

      // Construir o AnalysisResult local a partir da AnalyzeAdSenseResponse
      const result: AnalysisResult = {
        id: efResponse.analysis_id || `local_analysis_${Date.now()}`,
        site_id: selectedSiteId,
        client_id: user.id,
        status: 'completed',
        total_revenue: efResponse.metrics?.total_revenue || 0,
        total_pageviews: efResponse.metrics?.total_pageviews || 0,
        total_impressions: efResponse.metrics?.total_impressions || 0,
        total_clicks: efResponse.metrics?.total_clicks || 0,
        avg_cpc: efResponse.metrics?.avg_cpc || 0,
        avg_ctr: efResponse.metrics?.avg_ctr || 0,
        avg_rpm: efResponse.metrics?.avg_rpm || 0,
        optimization_score: efResponse.optimization_score || 0,
        projected_revenue: efResponse.projected_revenue || 0,
        projected_increase: efResponse.projected_increase || 0,
        analysis_results: efResponse.analysis_results || {},
        opportunities: efResponse.opportunities || [],
        created_at: new Date().toISOString(),
        processing_time_ms: processingTime
      };

      setAnalysisResult(result);
      await refreshData(); // Para atualizar a lista de análises no useFluxData, se necessário

      toast({ title: 'Análise Concluída! 🚀', description: `Processamento realizado em ${(processingTime / 1000).toFixed(1)}s. ${efResponse.message || ''}` });

    } catch (error: any) {
      console.error('❌ Erro na análise:', error);
      const currentStep = processingSteps.find(s => s.status === 'processing');
      if (currentStep) {
        updateProcessingStep(currentStep.id, { status: 'error', progress: 0 });
      }
      toast({ title: 'Erro na Análise', description: error.message || 'Erro ao processar dados. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSiteId, csvData, validation, selectedSite, user, initializeProcessingSteps, updateProcessingStep, processingSteps, refreshData, toast, invokeAnalyzeAdSense]); // Adicionado invokeAnalyzeAdSense

  const resetAnalysis = useCallback(() => { /* ... (sem mudanças) ... */ setCsvFile(null); setCsvData(''); setValidation(null); setAnalysisResult(null); setProcessingSteps([]); setIsProcessing(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } }, []);

  // === RENDER ===
  // ... (O restante do JSX permanece o mesmo, pois as mudanças são lógicas) ...
  if (!user) {
    return (
      <AnalyzerContainer>
        <EmptyState>
          <EmptyIcon>🔒</EmptyIcon>
          <h3>Acesso Restrito</h3>
          <p>Faça login para acessar o analisador AdSense.</p>
        </EmptyState>
      </AnalyzerContainer>
    );
  }

  return (
    <AnalyzerContainer>
      <Header>
        <Title>🧠 Analisador AdSense IA</Title>
        <Subtitle>
          Análise inteligente dos seus dados AdSense com IA avançada para maximizar receita
        </Subtitle>
        <PowerBadge>
          ⚡ Powered by Flux AI Engine
        </PowerBadge>
      </Header>

      <MainLayout>
        {/* Side Panel */}
        <SidePanel>
          {/* Site Selection */}
          <SiteSelector>
            <SectionTitle>🌐 Selecionar Site</SectionTitle>
            {sites && sites.length > 0 ? (
              <SiteGrid>
                {sites.map((site) => (
                  <SiteCard
                    key={site.id}
                    selected={selectedSiteId === site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                  >
                    <SiteInfo>
                      <SiteIcon>
                        {site.url?.charAt(0).toUpperCase() || '🌐'}
                      </SiteIcon>
                      <SiteDetails>
                        <SiteName>{site.url}</SiteName>
                        <SiteMetrics>
                          <div>RPM: R$ {site.current_rpm?.toFixed(2) || '0.00'}</div>
                          <div>Pageviews: {site.monthly_pageviews?.toLocaleString('pt-BR') || '0'}/mês</div>
                        </SiteMetrics>
                      </SiteDetails>
                    </SiteInfo>
                  </SiteCard>
                ))}
              </SiteGrid>
            ) : (
              <EmptyState>
                <EmptyIcon>🌐</EmptyIcon>
                <h4>Nenhum site encontrado</h4>
                <p>Adicione um site primeiro.</p>
                <ActionButton onClick={() => navigate('/configuracoes?tab=sites')}> {/* Ajustar rota se necessário */}
                  ➕ Adicionar Site
                </ActionButton>
              </EmptyState>
            )}
          </SiteSelector>

          {/* File Upload */}
          <SectionTitle>📄 Upload CSV AdSense</SectionTitle>
          <UploadZone
            isDragOver={isDragOver}
            hasFile={!!csvFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon hasFile={!!csvFile}>
              {csvFile ? '✅' : '📊'}
            </UploadIcon>
            <UploadTitle>
              {csvFile ? `Arquivo: ${csvFile.name}` : 'Arraste seu CSV aqui'}
            </UploadTitle>
            <UploadDescription>
              {csvFile
                ? `${(csvFile.size / 1024).toFixed(1)} KB - Pronto para análise`
                : 'Ou clique para selecionar arquivo CSV do Google AdSense'
              }
            </UploadDescription>
          </UploadZone>

          <FileInput
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
          />

          {/* Start Analysis Button */}
          {selectedSiteId && csvFile && validation?.isValid && !isProcessing && !analysisResult && (
            <ActionButton
              variant="primary"
              onClick={startAnalysis}
              style={{ width: '100%', marginTop: '24px' }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : '🚀 Iniciar Análise IA'}
            </ActionButton>
          )}

          {/* Reset Button */}
          {(csvFile || analysisResult) && !isProcessing && (
            <ActionButton
              variant="secondary"
              onClick={resetAnalysis}
              style={{ width: '100%', marginTop: '16px' }}
            >
              🔄 Nova Análise
            </ActionButton>
          )}
        </SidePanel>

        {/* Main Panel */}
        <MainPanel>
          {/* CSV Validation */}
          {validation && (
            <ValidationPanel type={validation.isValid ? 'success' : validation.errors.length > 0 ? 'error' : 'warning'}>
              <ValidationTitle type={validation.isValid ? 'success' : validation.errors.length > 0 ? 'error' : 'warning'}>
                {validation.isValid ? '✅ CSV Validado' : validation.errors.length > 0 ? '❌ Erros Encontrados' : '⚠️ Avisos'}
              </ValidationTitle>

              <ValidationGrid>
                <ValidationMetric>
                  <MetricValue>{validation.rowCount}</MetricValue>
                  <MetricLabel>Registros</MetricLabel>
                </ValidationMetric>
                <ValidationMetric>
                  <MetricValue>{validation.columnCount}</MetricValue>
                  <MetricLabel>Colunas</MetricLabel>
                </ValidationMetric>
                <ValidationMetric>
                  <MetricValue>{validation.qualityScore}%</MetricValue>
                  <MetricLabel>Qualidade</MetricLabel>
                </ValidationMetric>
                <ValidationMetric>
                  <MetricValue>{validation.dataQuality}</MetricValue>
                  <MetricLabel>Classificação</MetricLabel>
                </ValidationMetric>
              </ValidationGrid>

              {validation.errors.length > 0 && (
                <div>
                  <strong>Erros:</strong>
                  <ul>{validation.errors.map((error, index) => (<li key={index}>{error}</li>))}</ul>
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div>
                  <strong>Avisos:</strong>
                  <ul>{validation.warnings.map((warning, index) => (<li key={index}>{warning}</li>))}</ul>
                </div>
              )}
              {validation.isValid && (<p>📊 {csvData.length} registros carregados com qualidade {validation?.dataQuality}. Nossa IA analisará seus dados e gerará insights personalizados.</p>)}
            </ValidationPanel>
          )}

          {isProcessing && (
            <ProcessingPanel>
              <SectionTitle>🤖 Análise em Andamento</SectionTitle>
              <ProcessingSteps>
                {processingSteps.map((step) => (
                  <ProcessingStep key={step.id} status={step.status} isActive={step.status === 'processing'}>
                    <StepIcon status={step.status}>
                      {step.status === 'completed' ? '✅' : step.status === 'error' ? '❌' : step.status === 'processing' ? '⚙️' : '⏳'}
                    </StepIcon>
                    <StepContent>
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                      {step.status === 'processing' && (<ProgressBar><ProgressFill progress={step.progress} /></ProgressBar>)}
                    </StepContent>
                  </ProcessingStep>
                ))}
              </ProcessingSteps>
            </ProcessingPanel>
          )}

          {analysisResult && !isProcessing && (
            <ResultsPanel>
              <ResultsHeader>
                <ResultsTitle>🎉 Análise Concluída</ResultsTitle>
                <RevenueHighlight>R$ {analysisResult.projected_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</RevenueHighlight>
                <p>Potencial de receita projetado</p>
                {analysisResult.processing_time_ms && (<p>Processamento realizado em {(analysisResult.processing_time_ms / 1000).toFixed(1)}s</p>)}
              </ResultsHeader>
              <MetricsGrid>
                <MetricsCard title="Receita Atual" value={`R$ ${analysisResult.total_revenue.toFixed(2)}`} variant="large" color="blue" icon="💰" />
                <MetricsCard title="RPM Médio" value={`R$ ${analysisResult.avg_rpm.toFixed(2)}`} variant="large" color="purple" icon="💎" />
                <MetricsCard title="CTR" value={`${analysisResult.avg_ctr.toFixed(2)}%`} variant="large" color="orange" icon="🎯" />
                <MetricsCard title="Score Otimização" value={`${analysisResult.optimization_score.toFixed(1)}%`} variant="large" color={analysisResult.optimization_score >= 70 ? 'green' : 'orange'} icon="⚡" />
              </MetricsGrid>
              {analysisResult.opportunities && analysisResult.opportunities.length > 0 && (
                <>
                  <SectionTitle>🎯 Oportunidades Identificadas</SectionTitle>
                  <OpportunitiesGrid>
                    {analysisResult.opportunities.map((opportunity: any, index: number) => ( // Adicionada tipagem para opportunity
                      <OpportunityCard key={index} priority={opportunity.priority || 'medium'}>
                        <h4>{opportunity.title}</h4>
                        <p>{opportunity.description}</p>
                        <div><strong>Impacto:</strong> {opportunity.impact}</div>
                        <div><strong>Dificuldade:</strong> {opportunity.difficulty}</div>
                      </OpportunityCard>
                    ))}
                  </OpportunitiesGrid>
                </>
              )}
              <ActionButtons>
                <ActionButton variant="secondary" onClick={() => navigate('/relatorios', { state: { fromAnalysis: true, analysisId: analysisResult.id }})}>
                  📊 Ver Relatório Completo
                </ActionButton>
                <ActionButton variant="success" onClick={() => navigate('/optimizer', { state: { fromAnalysis: true, siteId: analysisResult.site_id, analysisId: analysisResult.id }})}>
                  ⚡ Otimizar Agora
                </ActionButton>
              </ActionButtons>
            </ResultsPanel>
          )}

          {!csvFile && !isProcessing && !analysisResult && (
            <EmptyState>
              <EmptyIcon>🧠</EmptyIcon>
              <h3>Pronto para Análise IA</h3>
              <p>Selecione um site e carregue seu arquivo CSV do Google AdSense para começar a análise inteligente.</p>
              <p>Nossa IA identificará oportunidades de otimização e calculará o potencial de aumento de receita.</p>
            </EmptyState>
          )}
        </MainPanel>
      </MainLayout>
    </AnalyzerContainer>
  );
};

export default Analyzer;
