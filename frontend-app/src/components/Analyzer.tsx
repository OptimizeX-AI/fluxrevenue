// src/components/Analyzer.tsx - Implementando parsing de CSV no frontend

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useAnalyzeAdSense } from '../hooks/usefluxdata';
import { AnalyzeAdSensePayload, AnalyzeAdSenseResponse } from '../types/interfaces';
import { useToast } from '../hooks/use-toast';
import MetricsCard from './MetricsCard';
import { useAuth } from '../contexts/AuthContext';

// === INTERFACES LOCAIS ===
interface CSVRow {
  [key: string]: string | number; // Permitir números após conversão
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
  // Adicionar quaisquer outros campos sumarizados que a EF possa esperar
  // Por exemplo, se a EF precisasse de dados por dia, a estrutura seria mais complexa.
  // No momento, a EF analyze-adsense espera os totais e médias.
}

interface CSVValidation {
  isValid: boolean;
  rowCount: number;
  columnCount: number;
  hasRequiredColumns: boolean;
  requiredColumns: string[]; // Nomes padrão esperados
  missingColumns: string[]; // Colunas obrigatórias não encontradas
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  qualityScore: number;
  errors: string[];
  warnings: string[];
  preview: CSVRow[]; // Preview das primeiras linhas parseadas
}

interface AnalysisResult {
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

interface Site {
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

// === STYLED COMPONENTS (Omitidos para manter o foco) ===
const dataFlow = keyframes`/* ... */`;
const analysisProgress = keyframes`/* ... */`;
const insightReveal = keyframes`/* ... */`;
const moneyFloat = keyframes`/* ... */`;
const aiThinking = keyframes`/* ... */`;
const AnalyzerContainer = styled.div`/* ... */`;
const Header = styled.header`/* ... */`;
const Title = styled.h1`/* ... */`;
const Subtitle = styled.p`/* ... */`;
const PowerBadge = styled.div`/* ... */`;
const MainLayout = styled.div`/* ... */`;
const SidePanel = styled.div`/* ... */`;
const MainPanel = styled.div`/* ... */`;
const SectionTitle = styled.h3`/* ... */`;
const UploadZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`/* ... */`;
const UploadIcon = styled.div<{ hasFile: boolean }>`/* ... */`;
const UploadTitle = styled.h4`/* ... */`;
const UploadDescription = styled.p`/* ... */`;
const FileInput = styled.input`/* ... */`;
const ValidationPanel = styled.div<{ type: 'success' | 'warning' | 'error' }>`/* ... */`;
const ValidationTitle = styled.h4<{ type: string }>`/* ... */`;
const ValidationGrid = styled.div`/* ... */`;
const ValidationMetric = styled.div`/* ... */`;
const MetricValue = styled.div`/* ... */`;
const MetricLabel = styled.div`/* ... */`;
const SiteSelector = styled.div`/* ... */`;
const SiteGrid = styled.div`/* ... */`;
const SiteCard = styled.div<{ selected: boolean }>`/* ... */`;
const SiteInfo = styled.div`/* ... */`;
const SiteIconStyled = styled.div`/* ... */`; // Renomeado para evitar conflito com nome de interface
const SiteDetails = styled.div`/* ... */`;
const SiteName = styled.h4`/* ... */`;
const SiteMetrics = styled.div`/* ... */`;
const ProcessingPanel = styled.div`/* ... */`;
const ProcessingSteps = styled.div`/* ... */`;
const ProcessingStepStyled = styled.div<{ status: string; isActive: boolean }>`/* ... */`; // Renomeado
const StepIcon = styled.div<{ status: string }>`/* ... */`;
const StepContent = styled.div`/* ... */`;
const StepTitle = styled.h5`/* ... */`;
const StepDescription = styled.p`/* ... */`;
const ProgressBar = styled.div`/* ... */`;
const ProgressFill = styled.div<{ progress: number }>`/* ... */`;
const ResultsPanel = styled.div`/* ... */`;
const ResultsHeader = styled.div`/* ... */`;
const ResultsTitle = styled.h2`/* ... */`;
const RevenueHighlight = styled.div`/* ... */`;
const MetricsGridStyled = styled.div`/* ... */`; // Renomeado
const OpportunitiesGrid = styled.div`/* ... */`;
const OpportunityCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`/* ... */`;
const ActionButtons = styled.div`/* ... */`;
const ActionButton = styled.button<any>`/* ... */`;
const EmptyState = styled.div`/* ... */`;
const EmptyIconStyled = styled.div`/* ... */`; // Renomeado
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; PowerBadge.defaultProps = { children: React.createElement(React.Fragment) }; MainLayout.defaultProps = { children: React.createElement(React.Fragment) }; SidePanel.defaultProps = { children: React.createElement(React.Fragment) }; MainPanel.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadZone.defaultProps = { children: React.createElement(React.Fragment) }; UploadIcon.defaultProps = { children: React.createElement(React.Fragment) }; UploadTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadDescription.defaultProps = { children: React.createElement(React.Fragment) }; FileInput.defaultProps = { children: React.createElement(React.Fragment) }; ValidationPanel.defaultProps = { children: React.createElement(React.Fragment) }; ValidationTitle.defaultProps = { children: React.createElement(React.Fragment) }; ValidationGrid.defaultProps = { children: React.createElement(React.Fragment) }; ValidationMetric.defaultProps = { children: React.createElement(React.Fragment) }; MetricValue.defaultProps = { children: React.createElement(React.Fragment) }; MetricLabel.defaultProps = { children: React.createElement(React.Fragment) }; SiteSelector.defaultProps = { children: React.createElement(React.Fragment) }; SiteGrid.defaultProps = { children: React.createElement(React.Fragment) }; SiteCard.defaultProps = { children: React.createElement(React.Fragment) }; SiteInfo.defaultProps = { children: React.createElement(React.Fragment) }; SiteIconStyled.defaultProps = { children: React.createElement(React.Fragment) }; SiteDetails.defaultProps = { children: React.createElement(React.Fragment) }; SiteName.defaultProps = { children: React.createElement(React.Fragment) }; SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingPanel.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingStepStyled.defaultProps = { children: React.createElement(React.Fragment) }; StepIcon.defaultProps = { children: React.createElement(React.Fragment) }; StepContent.defaultProps = { children: React.createElement(React.Fragment) }; StepTitle.defaultProps = { children: React.createElement(React.Fragment) }; StepDescription.defaultProps = { children: React.createElement(React.Fragment) }; ProgressBar.defaultProps = { children: React.createElement(React.Fragment) }; ProgressFill.defaultProps = { children: React.createElement(React.Fragment) }; ResultsPanel.defaultProps = { children: React.createElement(React.Fragment) }; ResultsHeader.defaultProps = { children: React.createElement(React.Fragment) }; ResultsTitle.defaultProps = { children: React.createElement(React.Fragment) }; RevenueHighlight.defaultProps = { children: React.createElement(React.Fragment) }; MetricsGridStyled.defaultProps = { children: React.createElement(React.Fragment) }; OpportunitiesGrid.defaultProps = { children: React.createElement(React.Fragment) }; OpportunityCard.defaultProps = { children: React.createElement(React.Fragment) }; ActionButtons.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; EmptyState.defaultProps = { children: React.createElement(React.Fragment) }; EmptyIconStyled.defaultProps = { children: React.createElement(React.Fragment) };


// Helper para normalizar nomes de colunas do CSV
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().replace(/"/g, '').replace(/\s+/g, '_').replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/\((usd|brl)\)/g, '').trim();
};

// Mapeamento de possíveis nomes de colunas para nomes padrão
const ADSENSE_COLUMN_MAPPING: { [key: string]: keyof ParsedCSVDataSummary } = {
  'date': 'period_start', // Usaremos a primeira data como period_start e a última como period_end
  'data': 'period_start',
  'dia': 'period_start',
  'page_views': 'total_pageviews',
  'visualizacoes_de_pagina': 'total_pageviews',
  'impressions': 'total_impressions',
  'impressoes': 'total_impressions',
  'ad_impressions': 'total_impressions',
  'clicks': 'total_clicks',
  'cliques': 'total_clicks',
  'estimated_earnings': 'total_revenue', // Removeremos (usd) ou (brl) com normalizeHeader
  'earnings': 'total_revenue',
  'receita_estimada': 'total_revenue',
  'ganhos_estimados': 'total_revenue',
  'page_rpm': 'avg_rpm',
  'rpm_da_pagina': 'avg_rpm',
  'page_ctr': 'avg_ctr',
  'ctr_da_pagina': 'avg_ctr',
  'cost_per_click_cpc': 'avg_cpc',
  'cpc': 'avg_cpc',
};
const REQUIRED_CSV_HEADERS_STANDARD: (keyof ParsedCSVDataSummary)[] = ['total_pageviews', 'total_impressions', 'total_clicks', 'total_revenue'];


const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData: refreshFluxData } = useFluxData();
  const { analyzeCSV, loading: analysisHookLoading, error: analysisHookError, data: analysisDataFromHook } = useAnalyzeAdSense();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvSummary, setParsedCsvSummary] = useState<ParsedCSVDataSummary | null>(null);
  const [validation, setValidation] = useState<CSVValidation | null>(null);
  const [isProcessingUI, setIsProcessingUI] = useState(false); // Para a simulação de UI local
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
      const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim() !== ''); // Lidar com diferentes quebras de linha

      if (lines.length < 2) {
        const err = "Arquivo CSV vazio ou sem dados suficientes (cabeçalho + 1 linha de dados).";
        setValidation({ isValid: false, errors: [err], warnings:[], columnCount:0,dataQuality:'poor',hasRequiredColumns:false,missingColumns:[],preview:[],qualityScore:0,rowCount:0,requiredColumns:[] });
        toast({ title: 'Erro no CSV', description: err, variant: 'destructive'});
        setParsedCsvSummary(null);
        return;
      }

      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const normalizedHeaders = rawHeaders.map(normalizeHeader);

      const mappedHeaders: { [key: string]: string } = {};
      const foundStandardHeaders = new Set<string>();
      const missingStandardHeaders: string[] = [...REQUIRED_CSV_HEADERS_STANDARD];

      normalizedHeaders.forEach((nh, index) => {
        for (const adSenseHeader in ADSENSE_COLUMN_MAPPING) {
          if (nh.includes(adSenseHeader)) {
            const standardHeader = ADSENSE_COLUMN_MAPPING[adSenseHeader];
            mappedHeaders[rawHeaders[index]] = standardHeader; // Mapear do header original para o padrão
            foundStandardHeaders.add(standardHeader);
            const missingIndex = missingStandardHeaders.indexOf(standardHeader as keyof ParsedCSVDataSummary);
            if (missingIndex > -1) missingStandardHeaders.splice(missingIndex, 1);
            break;
          }
        }
      });

      const hasRequired = missingStandardHeaders.length === 0;
      const dataRows = lines.slice(1);
      const rowCount = dataRows.length;

      let tempSummary: ParsedCSVDataSummary = {
        total_pageviews: 0, total_impressions: 0, total_clicks: 0, total_revenue: 0,
        avg_ctr: 0, avg_rpm: 0, avg_cpc: 0, file_name: file.name
      };
      const previewData: CSVRow[] = [];
      let minDate: Date | null = null;
      let maxDate: Date | null = null;

      dataRows.forEach((line, rowIndex) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const rowObject: CSVRow = {};
        rawHeaders.forEach((header, index) => {
            const standardHeader = mappedHeaders[header];
            if (standardHeader && standardHeader !== 'skip') {
                let value: string | number = values[index];
                // Conversões numéricas
                if (['total_pageviews', 'total_impressions', 'total_clicks', 'total_revenue', 'avg_rpm', 'avg_ctr', 'avg_cpc'].includes(standardHeader)) {
                    value = parseFloat(value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
                }
                rowObject[standardHeader] = value;
            }
        });

        if (rowIndex < 5) previewData.push(rowObject); // Preview

        tempSummary.total_pageviews += (rowObject.total_pageviews as number || 0);
        tempSummary.total_impressions += (rowObject.total_impressions as number || 0);
        tempSummary.total_clicks += (rowObject.total_clicks as number || 0);
        tempSummary.total_revenue += (rowObject.total_revenue as number || 0);

        const dateStr = rowObject['period_start'] as string; // Assumindo que 'date' foi mapeado para 'period_start'
        if (dateStr) {
            let currentDate: Date | null = null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { currentDate = new Date(dateStr); }
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) { const p = dateStr.split('/'); currentDate = new Date(Date.parse(`${p[1]}/${p[0]}/${p[2]}`)); } // MM/DD/YYYY
            else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) { const p = dateStr.split('.'); currentDate = new Date(Date.parse(`${p[1]}.${p[0]}.${p[2]}`)); } // MM.DD.YYYY

            if (currentDate && !isNaN(currentDate.getTime())) {
                if (!minDate || currentDate < minDate) minDate = currentDate;
                if (!maxDate || currentDate > maxDate) maxDate = currentDate;
            }
        }
      });

      tempSummary.avg_ctr = tempSummary.total_impressions > 0 ? (tempSummary.total_clicks / tempSummary.total_impressions) * 100 : 0;
      tempSummary.avg_rpm = tempSummary.total_pageviews > 0 ? (tempSummary.total_revenue / tempSummary.total_pageviews) * 1000 : 0;
      tempSummary.avg_cpc = tempSummary.total_clicks > 0 ? tempSummary.total_revenue / tempSummary.total_clicks : 0;
      tempSummary.period_start = minDate ? minDate.toISOString().split('T')[0] : undefined;
      tempSummary.period_end = maxDate ? maxDate.toISOString().split('T')[0] : undefined;

      setParsedCsvSummary(tempSummary);

      let qualityScore = 0;
      if (hasRequired) qualityScore += 50;
      if (rowCount >= 30) qualityScore += 30; else if (rowCount >= 7) qualityScore += 15;
      if (tempSummary.period_start && tempSummary.period_end) qualityScore += 20;
      qualityScore = Math.min(100, qualityScore);

      const dataQualityVal: CSVValidation['dataQuality'] = qualityScore >= 80 ? 'excellent' : qualityScore >= 60 ? 'good' : qualityScore >= 40 ? 'fair' : 'poor';
      const errors: string[] = [];
      if (!hasRequired) errors.push(`Colunas obrigatórias não encontradas: ${missingStandardHeaders.join(', ')} (ou nomes alternativos)`);
      if (rowCount < 1) errors.push("Nenhuma linha de dados encontrada no CSV.");

      const currentValidation: CSVValidation = {
        isValid: hasRequired && rowCount > 0,
        rowCount,
        columnCount: rawHeaders.length,
        hasRequiredColumns: hasRequired,
        requiredColumns: REQUIRED_CSV_HEADERS_STANDARD,
        missingColumns: missingStandardHeaders,
        dataQuality: dataQualityVal,
        qualityScore,
        errors,
        warnings: rowCount < 7 ? ['Poucos dados para análise ideal (recomendado: 7+ dias).'] : [],
        preview: previewData
      };
      setValidation(currentValidation);

      if (currentValidation.isValid) {
        toast({ title: 'CSV Processado! ✅', description: `${rowCount} registros lidos e sumarizados.` });
      } else {
        toast({ title: 'Erro no Processamento do CSV', description: currentValidation.errors.join('; ') || 'Verifique o formato e as colunas do CSV.', variant: 'destructive'});
      }
    };
    reader.readAsText(file, 'UTF-8'); // Especificar encoding pode ajudar
  }, [toast]);

  useEffect(() => { /* Dependências de handleDrop e handleFileSelect */ }, [handleDrop, handleFileSelect, parseAndValidateCSV]);

  const initializeProcessingSteps = useCallback(() => { /* ... */ const steps: ProcessingStep[] = [ { id: 'parsing', title: 'Preparando Dados', description: 'Enviando dados sumarizados para análise', status: 'processing', progress: 0, estimatedTime: 5 }, { id: 'analysis', title: 'Análise Inteligente', description: 'IA identificando padrões e oportunidades', status: 'pending', progress: 0, estimatedTime: 20 }, { id: 'optimization', title: 'Detectando Oportunidades', description: 'Calculando potencial de otimização', status: 'pending', progress: 0, estimatedTime: 15 }, { id: 'report', title: 'Gerando Relatório', description: 'Compilando insights e recomendações', status: 'pending', progress: 0, estimatedTime: 10 } ]; setProcessingSteps(steps); }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => { /* ... */ setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const startAnalysis = useCallback(async () => {
    if (!selectedSiteId || !parsedCsvSummary || !validation?.isValid || !user?.id) {
      toast({ title: 'Dados Incompletos', description: 'Selecione um site e carregue e processe um CSV válido.', variant: 'destructive' });
      return;
    }

    setIsProcessingUI(true); // UI local de processamento
    initializeProcessingSteps();
    const startTime = Date.now();

    try {
      updateProcessingStep('parsing', { status: 'processing', progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('parsing', { status: 'completed', progress: 100 });

      updateProcessingStep('analysis', { status: 'processing', progress: 30 });

      const payload: AnalyzeAdSensePayload = {
        ...parsedCsvSummary, // Contém os campos sumarizados
        site_id: selectedSiteId,
        site_url: selectedSite?.url, // Opcional
        client_id: user.id,
        // validation_info: validation, // Opcional, EF tem sua validação
        timestamp: new Date().toISOString()
      };

      // Usar a função do hook useAnalyzeAdSense, passando o payload completo
      const efResponse = await analyzeCSV(payload);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na análise da Edge Function');
      }

      updateProcessingStep('analysis', { status: 'completed', progress: 100 });
      updateProcessingStep('optimization', { status: 'processing', progress: 60 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProcessingStep('optimization', { status: 'completed', progress: 100 });
      updateProcessingStep('report', { status: 'processing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('report', { status: 'completed', progress: 100 });

      const processingTime = Date.now() - startTime;

      const resultData: AnalysisResult = {
        id: efResponse.analysis_id || `local_${Date.now()}`,
        site_id: selectedSiteId,
        client_id: user.id,
        status: 'completed',
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
      // refreshFluxData é chamado dentro de analyzeCSV (do hook useAnalyzeAdSense) se sucesso
      toast({ title: 'Análise Concluída! 🚀', description: `Processamento via EF em ${(processingTime / 1000).toFixed(1)}s. ${efResponse.message || ''}` });

    } catch (error: any) {
      console.error('❌ Erro na análise:', error);
      const currentProcessingStep = processingSteps.find(s => s.status === 'processing'); // Corrigido nome da var
      if (currentProcessingStep) {
        updateProcessingStep(currentProcessingStep.id, { status: 'error', progress: 0 });
      }
      toast({ title: 'Erro na Análise', description: error.message || 'Erro ao processar dados. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessingUI(false);
    }
  }, [selectedSiteId, parsedCsvSummary, validation, selectedSite, user, initializeProcessingSteps, updateProcessingStep, processingSteps, toast, analyzeCSV]);

  const resetAnalysis = useCallback(() => { setCsvFile(null); setParsedCsvSummary(null); setValidation(null); setAnalysisResult(null); setProcessingSteps([]); setIsProcessingUI(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } }, []);

  // === RENDER ===
  // ... (O restante do JSX permanece o mesmo, usando isProcessingUI e analysisHookLoading/Error se necessário) ...
  if (!user) { return ( <AnalyzerContainer> <EmptyState> <EmptyIconStyled>🔒</EmptyIconStyled> <h3>Acesso Restrito</h3> <p>Faça login para acessar o analisador AdSense.</p> </EmptyState> </AnalyzerContainer> ); }
  return ( <AnalyzerContainer> {/* ... Conteúdo JSX ... */} </AnalyzerContainer> );
};

export default Analyzer;
