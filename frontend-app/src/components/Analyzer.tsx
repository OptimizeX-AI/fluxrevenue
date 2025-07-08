// src/components/Analyzer.tsx - Corrigindo REQUIRED_CSV_HEADERS_STANDARD

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

interface SiteLocal {
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

// === STYLED COMPONENTS (Omitidos para manter o foco) ===
const dataFlow = keyframes`/* ... */`; const analysisProgress = keyframes`/* ... */`; const insightReveal = keyframes`/* ... */`; const moneyFloat = keyframes`/* ... */`; const aiThinking = keyframes`/* ... */`; const AnalyzerContainer = styled.div`/* ... */`; const Header = styled.header`/* ... */`; const Title = styled.h1`/* ... */`; const Subtitle = styled.p`/* ... */`; const PowerBadge = styled.div`/* ... */`; const MainLayout = styled.div`/* ... */`; const SidePanel = styled.div`/* ... */`; const MainPanel = styled.div`/* ... */`; const SectionTitle = styled.h3`/* ... */`; const UploadZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`/* ... */`; const UploadIcon = styled.div<{ hasFile: boolean }>`/* ... */`; const UploadTitle = styled.h4`/* ... */`; const UploadDescription = styled.p`/* ... */`; const FileInput = styled.input`/* ... */`; const ValidationPanel = styled.div<{ type: 'success' | 'warning' | 'error' }>`/* ... */`; const ValidationTitle = styled.h4<{ type: string }>`/* ... */`; const ValidationGrid = styled.div`/* ... */`; const ValidationMetric = styled.div`/* ... */`; const MetricValue = styled.div`/* ... */`; const MetricLabel = styled.div`/* ... */`; const SiteSelector = styled.div`/* ... */`; const SiteGrid = styled.div`/* ... */`; const SiteCard = styled.div<{ selected: boolean }>`/* ... */`; const SiteInfo = styled.div`/* ... */`; const SiteIconStyled = styled.div`/* ... */`; const SiteDetails = styled.div`/* ... */`; const SiteName = styled.h4`/* ... */`; const SiteMetrics = styled.div`/* ... */`; const ProcessingPanel = styled.div`/* ... */`; const ProcessingSteps = styled.div`/* ... */`; const ProcessingStepStyled = styled.div<{ status: string; isActive: boolean }>`/* ... */`; const StepIcon = styled.div<{ status: string }>`/* ... */`; const StepContent = styled.div`/* ... */`; const StepTitle = styled.h5`/* ... */`; const StepDescription = styled.p`/* ... */`; const ProgressBar = styled.div`/* ... */`; const ProgressFill = styled.div<{ progress: number }>`/* ... */`; const ResultsPanel = styled.div`/* ... */`; const ResultsHeader = styled.div`/* ... */`; const ResultsTitle = styled.h2`/* ... */`; const RevenueHighlight = styled.div`/* ... */`; const MetricsGridStyled = styled.div`/* ... */`; const OpportunitiesGrid = styled.div`/* ... */`; const OpportunityCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`/* ... */`; const ActionButtons = styled.div`/* ... */`; const ActionButton = styled.button<any>`/* ... */`; const EmptyState = styled.div`/* ... */`; const EmptyIconStyled = styled.div`/* ... */`; const EmptyTitle = styled.h3`font-size: 17px; font-weight: 600; color: #1D1D1F; margin: 0 0 8px 0;`; const EmptyDescription = styled.p`font-size: 15px; color: #6D6D70; margin: 0 0 24px 0; line-height: 1.5;`;
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; PowerBadge.defaultProps = { children: React.createElement(React.Fragment) }; MainLayout.defaultProps = { children: React.createElement(React.Fragment) }; SidePanel.defaultProps = { children: React.createElement(React.Fragment) }; MainPanel.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadZone.defaultProps = { children: React.createElement(React.Fragment) }; UploadIcon.defaultProps = { children: React.createElement(React.Fragment) }; UploadTitle.defaultProps = { children: React.createElement(React.Fragment) }; UploadDescription.defaultProps = { children: React.createElement(React.Fragment) }; FileInput.defaultProps = { children: React.createElement(React.Fragment) }; ValidationPanel.defaultProps = { children: React.createElement(React.Fragment) }; ValidationTitle.defaultProps = { children: React.createElement(React.Fragment) }; ValidationGrid.defaultProps = { children: React.createElement(React.Fragment) }; ValidationMetric.defaultProps = { children: React.createElement(React.Fragment) }; MetricValue.defaultProps = { children: React.createElement(React.Fragment) }; MetricLabel.defaultProps = { children: React.createElement(React.Fragment) }; SiteSelector.defaultProps = { children: React.createElement(React.Fragment) }; SiteGrid.defaultProps = { children: React.createElement(React.Fragment) }; SiteCard.defaultProps = { children: React.createElement(React.Fragment) }; SiteInfo.defaultProps = { children: React.createElement(React.Fragment) }; SiteIconStyled.defaultProps = { children: React.createElement(React.Fragment) }; SiteDetails.defaultProps = { children: React.createElement(React.Fragment) }; SiteName.defaultProps = { children: React.createElement(React.Fragment) }; SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingPanel.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingStepStyled.defaultProps = { children: React.createElement(React.Fragment) }; StepIcon.defaultProps = { children: React.createElement(React.Fragment) }; StepContent.defaultProps = { children: React.createElement(React.Fragment) }; StepTitle.defaultProps = { children: React.createElement(React.Fragment) }; StepDescription.defaultProps = { children: React.createElement(React.Fragment) }; ProgressBar.defaultProps = { children: React.createElement(React.Fragment) }; ProgressFill.defaultProps = { children: React.createElement(React.Fragment) }; ResultsPanel.defaultProps = { children: React.createElement(React.Fragment) }; ResultsHeader.defaultProps = { children: React.createElement(React.Fragment) }; ResultsTitle.defaultProps = { children: React.createElement(React.Fragment) }; RevenueHighlight.defaultProps = { children: React.createElement(React.Fragment) }; MetricsGridStyled.defaultProps = { children: React.createElement(React.Fragment) }; OpportunitiesGrid.defaultProps = { children: React.createElement(React.Fragment) }; OpportunityCard.defaultProps = { children: React.createElement(React.Fragment) }; ActionButtons.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; EmptyState.defaultProps = { children: React.createElement(React.Fragment) }; EmptyIconStyled.defaultProps = { children: React.createElement(React.Fragment) }; EmptyTitle.defaultProps = { children: React.createElement(React.Fragment) }; EmptyDescription.defaultProps = { children: React.createElement(React.Fragment) };


// Helper para normalizar nomes de colunas do CSV
const normalizeHeader = (header: string): string => {
  return header.toLowerCase().replace(/"/g, '').replace(/\s+/g, '_').replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/\((usd|brl)\)/g, '').trim();
};

// Mapeamento de possíveis nomes de colunas para nomes padrão
const ADSENSE_COLUMN_MAPPING: { [key: string]: keyof ParsedCSVDataSummary | 'skip' } = {
  'date': 'period_start',
  'data': 'period_start',
  'dia': 'period_start',
  'page_views': 'total_pageviews',
  'visualizacoes_de_pagina': 'total_pageviews',
  'impressions': 'total_impressions',
  'impressoes': 'total_impressions',
  'ad_impressions': 'total_impressions',
  'clicks': 'total_clicks',
  'cliques': 'total_clicks',
  'estimated_earnings': 'total_revenue',
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

// Campos padrão que são essenciais após o parsing e mapeamento para a lógica de sumarização
const REQUIRED_CSV_HEADERS_STANDARD: (keyof ParsedCSVDataSummary)[] = [
  'total_pageviews',
  'total_impressions',
  'total_clicks',
  'total_revenue'
  // 'period_start' é crucial para determinar o período, mas o parsing tenta encontrá-lo.
  // As médias (avg_ctr, avg_rpm, avg_cpc) são calculadas a partir dos totais.
];


const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData: refreshFluxData } = useFluxData();
  const { analyzeCSV, loading: analysisHookLoading } = useAnalyzeAdSense(); // Removido error e data não usados diretamente

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

  const selectedSite = useMemo(() => sites?.find(s => s.id === selectedSiteId) as SiteLocal | undefined, [sites, selectedSiteId]);

  const parseAndValidateCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');

      if (lines.length < 2) {
        const err = "Arquivo CSV inválido: requer cabeçalho e pelo menos uma linha de dados.";
        // Usar a constante REQUIRED_CSV_HEADERS_STANDARD aqui
        setValidation({ isValid: false, errors: [err], warnings:[], columnCount:0,dataQuality:'poor',hasRequiredColumns:false,missingColumns: REQUIRED_CSV_HEADERS_STANDARD.map(String),preview:[],qualityScore:0,rowCount:0,requiredColumns:REQUIRED_CSV_HEADERS_STANDARD.map(String) });
        toast({ title: 'Erro no CSV', description: err, variant: 'destructive'});
        setParsedCsvSummary(null);
        return;
      }

      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const normalizedHeaders = rawHeaders.map(normalizeHeader);

      const headerMap: { [key: string]: number } = {}; // Mapeia standardHeaderKey para o índice da coluna original
      const foundStandardHeaders = new Set<string>();

      REQUIRED_CSV_HEADERS_STANDARD.forEach(standardHeaderKey => {
        for (const [adsenseHeaderPattern, mappedStandardKey] of Object.entries(ADSENSE_COLUMN_MAPPING)) {
            if (standardHeaderKey === mappedStandardKey) { // Procurar pelo standard key nos mapeamentos
                const headerIndex = normalizedHeaders.findIndex(nh => nh.includes(adsenseHeaderPattern));
                if (headerIndex !== -1) {
                    headerMap[standardHeaderKey as string] = headerIndex;
                    foundStandardHeaders.add(standardHeaderKey);
                    break;
                }
            }
        }
      });
      // Adicionar mapeamento para 'date' separadamente, pois é usado para period_start/end
      const dateHeaderIndex = normalizedHeaders.findIndex(nh => nh.includes('date') || nh.includes('data') || nh.includes('dia'));
      if (dateHeaderIndex !== -1) {
          headerMap['period_start'] = dateHeaderIndex; // Usamos 'period_start' para a coluna de data
      }


      const missingStandardHeaders: string[] = REQUIRED_CSV_HEADERS_STANDARD.filter(
        standardHeader => !foundStandardHeaders.has(standardHeader)
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

        // Popular rowObject usando headerMap e os índices corretos
        (Object.keys(headerMap) as (keyof ParsedCSVDataSummary)[]).forEach(standardKey => {
            const originalIndex = headerMap[standardKey];
            let value: string | number = values[originalIndex];
            if (['total_pageviews', 'total_impressions', 'total_clicks', 'total_revenue'].includes(standardKey)) {
                const cleanedValue = value.toString().replace(/R\$\s?/g, '').replace(/[^\d,.-]/g, '').replace(/\./g, (match, offset, full) => offset === full.lastIndexOf('.') ? match : '').replace(/,/g, '.');
                value = parseFloat(cleanedValue) || 0;
            }
            rowObject[standardKey] = value;
        });

        if (i <= 5) previewData.push(rowObject);

        tempSummary.total_pageviews += (rowObject.total_pageviews as number || 0);
        tempSummary.total_impressions += (rowObject.total_impressions as number || 0);
        tempSummary.total_clicks += (rowObject.total_clicks as number || 0);
        tempSummary.total_revenue += (rowObject.total_revenue as number || 0);

        const dateStr = rowObject['period_start'] as string; // 'date' é mapeado para 'period_start'
        if (dateStr) {
            let currentDate: Date | null = null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { currentDate = new Date(dateStr + "T00:00:00Z"); }
            else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dateStr)) { const p = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!; currentDate = new Date(Date.UTC(Number(p[3]), Number(p[2])-1, Number(p[1]))); } // MM/DD/YYYY -> DD/MM/YYYY
             // Adicione mais formatos de data se necessário, ou use uma biblioteca

            if (currentDate && !isNaN(currentDate.getTime())) {
                if (!minDate || currentDate.getTime() < minDate.getTime()) minDate = currentDate;
                if (!maxDate || currentDate.getTime() > maxDate.getTime()) maxDate = currentDate;
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
      if (!hasRequired) errors.push(`Colunas essenciais não encontradas no CSV: ${missingStandardHeaders.join(', ')}. Verifique o mapeamento e o arquivo.`);
      if (dataRowCount < 1) errors.push("Nenhuma linha de dados válida encontrada no CSV.");
      if (!tempSummary.period_start || !tempSummary.period_end) warnings.push("Não foi possível determinar o período (data inicial/final) a partir do CSV.");

      const currentValidation: CSVValidation = {
        isValid: hasRequired && dataRowCount > 0 && !!tempSummary.period_start && !!tempSummary.period_end, // Adicionado cheque de data
        rowCount: dataRowCount,
        columnCount: rawHeaders.length,
        hasRequiredColumns: hasRequired,
        requiredColumns: REQUIRED_CSV_HEADERS_STANDARD.map(String),
        missingColumns: missingStandardHeaders,
        dataQuality: dataQualityVal,
        qualityScore,
        errors,
        warnings: warnings.concat(dataRowCount < 7 && dataRowCount > 0 ? ['Poucos dados para análise ideal (recomendado: 7+ dias).'] : []),
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
        timestamp: new Date().toISOString(),
        // Garantir que todos os campos de ParsedCSVDataSummary estejam aqui
        // e que os campos opcionais de AnalyzeAdSensePayload tenham fallbacks se necessário
        file_name: parsedCsvSummary.file_name || csvFile?.name,
        period_start: parsedCsvSummary.period_start,
        period_end: parsedCsvSummary.period_end,
      };

      // analyzeCSV agora espera um único objeto payload
      const efResponse = await analyzeCSV(payloadForEF);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na análise da Edge Function');
      }

      updateProcessingStep('analysis', { status: 'completed', progress: 100 });
      updateProcessingStep('optimization', { status: 'processing', progress: 60 }); await new Promise(resolve => setTimeout(resolve, 1000)); updateProcessingStep('optimization', { status: 'completed', progress: 100 });
      updateProcessingStep('report', { status: 'processing', progress: 80 }); await new Promise(resolve => setTimeout(resolve, 500)); updateProcessingStep('report', { status: 'completed', progress: 100 });

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

    } catch (error: any) { /* ... */ console.error('❌ Erro na análise:', error); const currentProcessingStep = processingSteps.find(s => s.status === 'processing'); if (currentProcessingStep) { updateProcessingStep(currentProcessingStep.id, { status: 'error', progress: 0 }); } toast({ title: 'Erro na Análise', description: error.message || 'Erro ao processar dados.', variant: 'destructive' });
    } finally {
      setIsProcessingUI(false);
    }
  }, [selectedSiteId, parsedCsvSummary, validation, selectedSite, user, initializeProcessingSteps, updateProcessingStep, processingSteps, toast, analyzeCSV, csvFile?.name]);

  const resetAnalysis = useCallback(() => { setCsvFile(null); setParsedCsvSummary(null); setValidation(null); setAnalysisResult(null); setProcessingSteps([]); setIsProcessingUI(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } }, []);

  // === RENDER ===
  if (!user) { return ( <AnalyzerContainer> <EmptyState> <EmptyIconStyled>🔒</EmptyIconStyled> <h3>Acesso Restrito</h3> <p>Faça login para acessar o analisador AdSense.</p> </EmptyState> </AnalyzerContainer> ); }
  return ( <AnalyzerContainer> {/* ... Conteúdo JSX ... */} </AnalyzerContainer> );
};

export default Analyzer;
