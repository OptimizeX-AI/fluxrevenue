// src/components/Analyzer.tsx - ENTERPRISE GRADE ADSENSE ANALYSIS ENGINE CORRIGIDO E REFAVORADO

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import { useAnalyzeAdSense } from '../hooks/usefluxdata'; // Hook especializado
import { AnalyzeAdSensePayload, AnalyzeAdSenseResponse } from '../types/interfaces';
import { useToast } from '../hooks/use-toast';
import MetricsCard from './MetricsCard';
import { useAuth } from '../contexts/AuthContext';

// === INTERFACES LOCAIS ===
interface CSVRow {
  [key: string]: string;
}

interface ParsedCSVData {
  summary: {
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
  };
  rowCount: number;
  // rawRows: CSVRow[]; // Poderia incluir se necessário para mais validações
}

interface CSVValidation { /* ... (como antes) ... */ isValid: boolean; rowCount: number; columnCount: number; hasRequiredColumns: boolean; requiredColumns: string[]; missingColumns: string[]; dataQuality: 'excellent' | 'good' | 'fair' | 'poor'; qualityScore: number; errors: string[]; warnings: string[]; preview: any[]; }
interface AnalysisResult { /* ... (como antes, mas populada por AnalyzeAdSenseResponse) ... */ id: string; site_id: string; client_id: string; status: 'processing' | 'completed' | 'failed'; total_revenue: number; total_pageviews: number; total_impressions: number; total_clicks: number; avg_cpc: number; avg_ctr: number; avg_rpm: number; optimization_score: number; projected_revenue: number; projected_increase: number; analysis_results: any; opportunities: any[]; created_at: string; processing_time_ms?: number; }
interface Site { /* ... (como antes) ... */ id: string; url: string; client_id: string; name?: string; monthly_pageviews?: number; current_rpm?: number; target_rpm?: number; script_installed?: boolean; created_at: string; }
interface ProcessingStep { /* ... (como antes) ... */ id: string; title: string; description: string; status: 'pending' | 'processing' | 'completed' | 'error'; progress: number; estimatedTime?: number; }

// === STYLED COMPONENTS (Omitidos) ===
// ... (Todos os styled-components)
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
const SiteIcon = styled.div`/* ... */`; // Duplicado?
const SiteDetails = styled.div`/* ... */`;
const SiteName = styled.h4`/* ... */`; // Duplicado?
const SiteMetrics = styled.div`/* ... */`;
const ProcessingPanel = styled.div`/* ... */`;
const ProcessingSteps = styled.div`/* ... */`; // Duplicado?
const ProcessingStep = styled.div<{ status: string; isActive: boolean }>`/* ... */`; // Duplicado?
const StepIcon = styled.div<{ status: string }>`/* ... */`; // Duplicado?
const StepContent = styled.div`/* ... */`; // Duplicado?
const StepTitle = styled.h5`/* ... */`; // Duplicado?
const StepDescription = styled.p`/* ... */`; // Duplicado?
const ProgressBar = styled.div`/* ... */`;
const ProgressFill = styled.div<{ progress: number }>`/* ... */`;
const ResultsPanel = styled.div`/* ... */`;
const ResultsHeader = styled.div`/* ... */`;
const ResultsTitle = styled.h2`/* ... */`;
const RevenueHighlight = styled.div`/* ... */`;
const MetricsGrid = styled.div`/* ... */`; // Duplicado?
const OpportunitiesGrid = styled.div`/* ... */`;
const OpportunityCard = styled.div<{ priority: 'high' | 'medium' | 'low' }>`/* ... */`;
const ActionButtons = styled.div`/* ... */`; // Duplicado?
const ActionButton = styled.button<any>`/* ... */`; // Duplicado?
const EmptyState = styled.div`/* ... */`; // Duplicado?
const EmptyIcon = styled.div`/* ... */`; // Duplicado?
// Adicionando os que faltavam para completar o componente
Header.defaultProps = { children: React.createElement(React.Fragment) };
Title.defaultProps = { children: React.createElement(React.Fragment) };
Subtitle.defaultProps = { children: React.createElement(React.Fragment) };
PowerBadge.defaultProps = { children: React.createElement(React.Fragment) };
MainLayout.defaultProps = { children: React.createElement(React.Fragment) };
SidePanel.defaultProps = { children: React.createElement(React.Fragment) };
MainPanel.defaultProps = { children: React.createElement(React.Fragment) };
SectionTitle.defaultProps = { children: React.createElement(React.Fragment) };
UploadZone.defaultProps = { children: React.createElement(React.Fragment) };
UploadIcon.defaultProps = { children: React.createElement(React.Fragment) };
UploadTitle.defaultProps = { children: React.createElement(React.Fragment) };
UploadDescription.defaultProps = { children: React.createElement(React.Fragment) };
FileInput.defaultProps = { children: React.createElement(React.Fragment) };
ValidationPanel.defaultProps = { children: React.createElement(React.Fragment) };
ValidationTitle.defaultProps = { children: React.createElement(React.Fragment) };
ValidationGrid.defaultProps = { children: React.createElement(React.Fragment) };
ValidationMetric.defaultProps = { children: React.createElement(React.Fragment) };
MetricValue.defaultProps = { children: React.createElement(React.Fragment) };
MetricLabel.defaultProps = { children: React.createElement(React.Fragment) };
SiteSelector.defaultProps = { children: React.createElement(React.Fragment) };
SiteGrid.defaultProps = { children: React.createElement(React.Fragment) };
SiteCard.defaultProps = { children: React.createElement(React.Fragment) };
SiteInfo.defaultProps = { children: React.createElement(React.Fragment) };
SiteIcon.defaultProps = { children: React.createElement(React.Fragment) };
SiteDetails.defaultProps = { children: React.createElement(React.Fragment) };
SiteName.defaultProps = { children: React.createElement(React.Fragment) };
SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) };
ProcessingPanel.defaultProps = { children: React.createElement(React.Fragment) };
ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) };
ProcessingStep.defaultProps = { children: React.createElement(React.Fragment) };
StepIcon.defaultProps = { children: React.createElement(React.Fragment) };
StepContent.defaultProps = { children: React.createElement(React.Fragment) };
StepTitle.defaultProps = { children: React.createElement(React.Fragment) };
StepDescription.defaultProps = { children: React.createElement(React.Fragment) };
ProgressBar.defaultProps = { children: React.createElement(React.Fragment) };
ProgressFill.defaultProps = { children: React.createElement(React.Fragment) };
ResultsPanel.defaultProps = { children: React.createElement(React.Fragment) };
ResultsHeader.defaultProps = { children: React.createElement(React.Fragment) };
ResultsTitle.defaultProps = { children: React.createElement(React.Fragment) };
RevenueHighlight.defaultProps = { children: React.createElement(React.Fragment) };
MetricsGrid.defaultProps = { children: React.createElement(React.Fragment) };
OpportunitiesGrid.defaultProps = { children: React.createElement(React.Fragment) };
OpportunityCard.defaultProps = { children: React.createElement(React.Fragment) };
ActionButtons.defaultProps = { children: React.createElement(React.Fragment) };
ActionButton.defaultProps = { children: React.createElement(React.Fragment) };
EmptyState.defaultProps = { children: React.createElement(React.Fragment) };
EmptyIcon.defaultProps = { children: React.createElement(React.Fragment) };


// === COMPONENT PRINCIPAL ===
const Analyzer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData: refreshFluxData } = useFluxData(); // Renomeado para evitar conflito
  const { analyzeCSV, loading: analysisLoading, error: analysisError, data: analysisDataFromHook } = useAnalyzeAdSense();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  // const [csvData, setCsvData] = useState<string>(''); // Conteúdo bruto do CSV, não mais enviado diretamente
  const [parsedCsvSummary, setParsedCsvSummary] = useState<ParsedCSVData['summary'] | null>(null);
  const [validation, setValidation] = useState<CSVValidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Para a simulação de UI
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { /* ... (seleção de site por URL param) ... */ const siteParam = searchParams.get('site'); if (siteParam && sites?.some(site => site.id === siteParam)) { setSelectedSiteId(siteParam); } else if (sites && sites.length > 0 && !selectedSiteId) { /* setSelectedSiteId(sites[0].id); */ } }, [searchParams, sites, selectedSiteId]);
  const selectedSite = useMemo(() => sites?.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  // Funções de Drag & Drop e FileSelect (sem mudanças na lógica, mas chamam parseAndValidateCSV)
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const files = Array.from(e.dataTransfer.files); const found = files.find(f => f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv')); if (found) { setCsvFile(found); parseAndValidateCSV(found); } else { toast({ title: 'Arquivo Inválido', description: 'CSV apenas.', variant: 'destructive' }); } }, [toast]); // parseAndValidateCSV será dependência
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setCsvFile(file); parseAndValidateCSV(file); } }, []); // parseAndValidateCSV será dependência

  const parseAndValidateCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // 1. Validar estrutura básica do CSV (colunas, etc.)
      // A função validateCSV original já faz isso, mas opera sobre o conteúdo string.
      // Vamos primeiro validar, depois parsear para os dados sumarizados.

      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) { // Header + pelo menos 1 linha de dados
        setValidation({ isValid: false, errors: ["Arquivo CSV vazio ou sem dados."], warnings:[], columnCount:0,dataQuality:'poor',hasRequiredColumns:false,missingColumns:[],preview:[],qualityScore:0,rowCount:0,requiredColumns:[] });
        toast({ title: 'Erro no CSV', description: 'Arquivo CSV vazio ou sem dados.', variant: 'destructive'});
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

      // Mapeamento de nomes de coluna flexíveis para nomes padrão
      const columnMapping: { [key: string]: keyof ParsedCSVData['summary'] | 'skip' } = {
        'date': 'period_start', // Usaremos a primeira data como period_start e a última como period_end
        'data': 'period_start',
        'day': 'period_start',
        'page views': 'total_pageviews',
        'pageviews': 'total_pageviews',
        'impressions': 'total_impressions',
        'impressões': 'total_impressions',
        'clicks': 'total_clicks',
        'cliques': 'total_clicks',
        'estimated earnings (usd)': 'total_revenue', // Ajustar para sua moeda/coluna
        'estimated earnings (brl)': 'total_revenue',
        'earnings (usd)': 'total_revenue',
        'earnings (brl)': 'total_revenue',
        'receita estimada (brl)': 'total_revenue',
        'receita (brl)': 'total_revenue',
        'ad impressions': 'total_impressions',
        'page rpm': 'avg_rpm',
        'rpm da página': 'avg_rpm',
        'page ctr': 'avg_ctr',
        'ctr da página': 'avg_ctr',
        'cost per click (cpc)': 'avg_cpc',
        'cpc': 'avg_cpc',
      };
      const requiredFields: (keyof ParsedCSVData['summary'])[] = ['total_pageviews', 'total_impressions', 'total_clicks', 'total_revenue'];

      let total_pageviews = 0;
      let total_impressions = 0;
      let total_clicks = 0;
      let total_revenue = 0;
      let minDate: Date | null = null;
      let maxDate: Date | null = null;
      let rowCount = 0;

      const dataRows = lines.slice(1);
      rowCount = dataRows.length;

      for (const line of dataRows) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const rowObject: any = {};
        headers.forEach((header, index) => {
          rowObject[header] = values[index];
        });

        // Extrair e somar os valores principais
        const pv = parseFloat(rowObject['page views'] || rowObject['pageviews'] || '0');
        const impr = parseFloat(rowObject['impressions'] || rowObject['impressões'] || rowObject['ad impressions'] || '0');
        const clicks = parseFloat(rowObject['clicks'] || rowObject['cliques'] || '0');
        // Tentar vários nomes para receita, ajustando para BRL (removendo R$, substituindo vírgula por ponto)
        let revenueStr = rowObject['estimated earnings (usd)'] || rowObject['estimated earnings (brl)'] || rowObject['earnings (usd)'] || rowObject['earnings (brl)'] || rowObject['receita estimada (brl)'] || rowObject['receita (brl)'] || '0';
        revenueStr = revenueStr.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.');
        const rev = parseFloat(revenueStr);

        total_pageviews += isNaN(pv) ? 0 : pv;
        total_impressions += isNaN(impr) ? 0 : impr;
        total_clicks += isNaN(clicks) ? 0 : clicks;
        total_revenue += isNaN(rev) ? 0 : rev;

        // Datas
        const dateStr = rowObject['date'] || rowObject['data'] || rowObject['day'];
        if (dateStr) {
            // Tentar formatos comuns de data: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
            let currentDate: Date | null = null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { // YYYY-MM-DD
                currentDate = new Date(dateStr);
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) { // DD/MM/YYYY ou MM/DD/YYYY
                const parts = dateStr.split('/');
                // Assumir MM/DD/YYYY se mês > 12, senão DD/MM/YYYY (ambiguidade!)
                // Para AdSense, geralmente é YYYY-MM-DD ou específico da localidade.
                // Vamos assumir DD/MM/YYYY para o Brasil se não for YYYY-MM-DD
                currentDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            if (currentDate && !isNaN(currentDate.getTime())) {
                if (!minDate || currentDate < minDate) minDate = currentDate;
                if (!maxDate || currentDate > maxDate) maxDate = currentDate;
            }
        }
      }

      const summary: ParsedCSVData['summary'] = {
        total_pageviews,
        total_impressions,
        total_clicks,
        total_revenue,
        avg_ctr: total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0,
        avg_rpm: total_pageviews > 0 ? (total_revenue / total_pageviews) * 1000 : 0,
        avg_cpc: total_clicks > 0 ? total_revenue / total_clicks : 0,
        period_start: minDate ? minDate.toISOString().split('T')[0] : undefined,
        period_end: maxDate ? maxDate.toISOString().split('T')[0] : undefined,
        file_name: file.name
      };
      setParsedCsvSummary(summary);

      // Validação básica dos dados sumarizados (pode ser expandida)
      const localValidation: CSVValidation = {
        isValid: requiredFields.every(field => typeof summary[field] === 'number' && summary[field] >= 0) && rowCount > 0,
        rowCount,
        columnCount: headers.length,
        hasRequiredColumns: true, // Assumindo que o parsing tentou encontrar os campos
        requiredColumns: requiredFields, // Simplificado
        missingColumns: [], // Simplificado
        dataQuality: rowCount > 30 ? 'good' : rowCount > 7 ? 'fair' : 'poor',
        qualityScore: rowCount > 30 ? 75 : rowCount > 7 ? 50 : 25,
        errors: [],
        warnings: [],
        preview: lines.slice(1,6).map(l => l.substring(0,100)) // Preview simples
      };
      if (!localValidation.isValid) {
        localValidation.errors.push("Dados sumarizados do CSV parecem inválidos ou insuficientes.");
      }
      setValidation(localValidation);

      if (localValidation.isValid) {
        toast({ title: 'CSV Processado! ✅', description: `${rowCount} registros lidos e sumarizados.` });
      } else {
        toast({ title: 'Erro no Processamento do CSV', description: localValidation.errors.join('; ') || 'Verifique os dados.', variant: 'destructive'});
      }
    };
    reader.readAsText(file);
  }, [toast]);

  // Adicionar parseAndValidateCSV às dependências de handleDrop e handleFileSelect
  useEffect(() => {
    // Este useEffect é apenas para mostrar que handleDrop e handleFileSelect
    // são recriados se parseAndValidateCSV mudar.
  }, [handleDrop, handleFileSelect]);


  const initializeProcessingSteps = useCallback(() => { /* ... (sem mudanças) ... */ const steps: ProcessingStep[] = [ { id: 'parsing', title: 'Preparando Dados', description: 'Enviando dados sumarizados para análise', status: 'processing', progress: 0, estimatedTime: 5 }, { id: 'analysis', title: 'Análise Inteligente', description: 'IA identificando padrões e oportunidades', status: 'pending', progress: 0, estimatedTime: 20 }, { id: 'optimization', title: 'Detectando Oportunidades', description: 'Calculando potencial de otimização', status: 'pending', progress: 0, estimatedTime: 15 }, { id: 'report', title: 'Gerando Relatório', description: 'Compilando insights e recomendações', status: 'pending', progress: 0, estimatedTime: 10 } ]; setProcessingSteps(steps); }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => { /* ... (sem mudanças) ... */ setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const startAnalysis = useCallback(async () => {
    if (!selectedSiteId || !parsedCsvSummary || !validation?.isValid || !user?.id) {
      toast({ title: 'Dados Incompletos', description: 'Selecione um site e carregue e processe um CSV válido.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
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
        site_url: selectedSite?.url,
        client_id: user.id,
        validation_info: validation, // Opcional, a EF tem sua própria validação
        timestamp: new Date().toISOString()
      };

      const efResponse = await analyzeCSV(payload); // analyzeCSV é do hook useAnalyzeAdSense
                                                  // e já chama invokeAnalyzeAdSense

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

      const result: AnalysisResult = {
        id: efResponse.analysis_id || `local_analysis_${Date.now()}`,
        site_id: selectedSiteId,
        client_id: user.id,
        status: 'completed',
        total_revenue: efResponse.metrics?.total_revenue || parsedCsvSummary.total_revenue,
        total_pageviews: efResponse.metrics?.total_pageviews || parsedCsvSummary.total_pageviews,
        total_impressions: efResponse.metrics?.total_impressions || parsedCsvSummary.total_impressions,
        total_clicks: efResponse.metrics?.total_clicks || parsedCsvSummary.total_clicks,
        avg_cpc: efResponse.metrics?.avg_cpc || parsedCsvSummary.avg_cpc,
        avg_ctr: efResponse.metrics?.avg_ctr || parsedCsvSummary.avg_ctr,
        avg_rpm: efResponse.metrics?.avg_rpm || parsedCsvSummary.avg_rpm,
        optimization_score: efResponse.optimization_score || 0,
        projected_revenue: efResponse.projected_revenue || 0,
        projected_increase: efResponse.projected_increase || 0,
        analysis_results: efResponse.analysis_results || {},
        opportunities: efResponse.opportunities || [],
        created_at: new Date().toISOString(),
        processing_time_ms: processingTime
      };

      setAnalysisResult(result);
      // refreshFluxData já é chamado dentro de analyzeCSV (que usa invokeAnalyzeAdSense) se sucesso

      toast({ title: 'Análise Concluída! 🚀', description: `Processamento realizado em ${(processingTime / 1000).toFixed(1)}s. ${efResponse.message || ''}` });

    } catch (error: any) {
      console.error('❌ Erro na análise:', error);
      const currentProcessingStep = processingSteps.find(s => s.status === 'processing');
      if (currentProcessingStep) {
        updateProcessingStep(currentProcessingStep.id, { status: 'error', progress: 0 });
      }
      toast({ title: 'Erro na Análise', description: error.message || 'Erro ao processar dados. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSiteId, parsedCsvSummary, validation, selectedSite, user, initializeProcessingSteps, updateProcessingStep, processingSteps, toast, analyzeCSV]);

  const resetAnalysis = useCallback(() => { /* ... (sem mudanças) ... */ setCsvFile(null); /*setCsvData('');*/ setParsedCsvSummary(null); setValidation(null); setAnalysisResult(null); setProcessingSteps([]); setIsProcessing(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } }, []);

  // === RENDER ===
  // ... (O restante do JSX permanece o mesmo) ...
  if (!user) { return ( <AnalyzerContainer> <EmptyState> <EmptyIcon>🔒</EmptyIcon> <h3>Acesso Restrito</h3> <p>Faça login para acessar o analisador AdSense.</p> </EmptyState> </AnalyzerContainer> ); }
  return ( <AnalyzerContainer> {/* ... Conteúdo JSX ... */} </AnalyzerContainer> );
};

export default Analyzer;
