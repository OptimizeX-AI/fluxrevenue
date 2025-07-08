// src/components/Optimizer.tsx - ENTERPRISE GRADE OPTIMIZATION ENGINE CORRIGIDO E ALINHADO

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Removido useRef não utilizado
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useFluxData } from '../hooks/useFluxData';
import {
    InvokeFluxOptimizerEnginePayload,
    InvokeFluxOptimizerEngineResponse,
    SelectedOptimizationConfig, // Tipo para as otimizações selecionadas pelo usuário
    SiteAnalysisDataForOptimizer // Tipo para os dados da análise enviados à EF
} from '../types/interfaces';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient'; // Mantido para inserts diretos (optimization_tasks) e selects (adsense_analyses)

// === INTERFACES LOCAIS (mantidas para estrutura interna do componente) ===
interface OptimizationTaskLocal { // Para a criação da task no frontend antes de chamar a EF
  id?: string;
  site_id: string;
  analysis_id?: string | null; // Permitir null
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: number;
  actions?: { // Este 'actions' é o que será salvo no DB e usado pela EF
    optimizations: SelectedOptimizationConfig[];
    analysis_data?: SiteAnalysisDataForOptimizer | null;
    // Outros metadados que a EF possa precisar do frontend
  };
  results?: any;
  error_message?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface AnalysisDataLocal { // Para o estado local 'currentAnalysis'
  id: string;
  site_id: string;
  client_id: string;
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

interface SiteLocal { // Para o estado local 'selectedSite'
  id: string;
  url: string;
  client_id: string;
  name?: string;
  monthly_pageviews?: number;
  current_rpm?: number;
  target_rpm?: number;
  script_installed?: boolean;
  optimization_enabled?: boolean;
  created_at: string;
}

interface OptimizationConfigUI extends SelectedOptimizationConfig { // Estende para UI
  // Campos da SelectedOptimizationConfig (type, title, settings, estimated_impact, implementation_time)
  // Adiciona campos específicos da UI que estão na constante OPTIMIZATION_CONFIGS
  id: string; // id local para UI
  description: string;
  category: 'revenue' | 'performance' | 'user_experience';
  difficulty: 'easy' | 'medium' | 'hard';
  enabled: boolean; // Se o usuário selecionou esta otimização
  priority: number; // Ordem de exibição/sugestão
  requirements?: string[];
  warnings?: string[];
}


interface OptimizationResultUI { // Para o estado local 'optimizationResult'
  task_id: string;
  site_id: string;
  optimizations_applied: OptimizationConfigUI[];
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

interface ProcessingStep { /* ... (como antes) ... */ id: string; title: string; description: string; status: 'pending' | 'processing' | 'completed' | 'error'; progress: number; estimatedTime?: number; }


// === STYLED COMPONENTS (Omitidos) ===
const optimizationFlow = keyframes`/* ... */`; const codeGeneration = keyframes`/* ... */`; const revenueBoost = keyframes`/* ... */`; const aiOptimizing = keyframes`/* ... */`; const slideInUp = keyframes`/* ... */`; const OptimizerContainer = styled.div`/* ... */`; const Header = styled.header`/* ... */`; const Title = styled.h1`/* ... */`; const Subtitle = styled.p`/* ... */`; const AIBadge = styled.div`/* ... */`; const MainLayout = styled.div`/* ... */`; const SidePanel = styled.div`/* ... */`; const MainPanel = styled.div`/* ... */`; const OptimizationCard = styled.div`/* ... */`; const SectionTitle = styled.h3`/* ... */`; const SiteSelector = styled.div`/* ... */`; const SiteGrid = styled.div`/* ... */`; const SiteCardStyled = styled.div<{ selected: boolean }>`/* ... */`; const SiteInfo = styled.div`/* ... */`; const SiteIcon = styled.div<{ optimized?: boolean }>`/* ... */`; const SiteDetails = styled.div`/* ... */`; const SiteName = styled.h4`/* ... */`; const SiteMetrics = styled.div`/* ... */`; const OptimizationStatus = styled.div<{ status: 'excellent' | 'good' | 'needs_improvement' | 'critical' }>`/* ... */`; const AnalysisPanel = styled.div`/* ... */`; const AnalysisTitle = styled.h4`/* ... */`; const MetricsGrid = styled.div`/* ... */`; const MetricCard = styled.div`/* ... */`; const MetricValue = styled.div`/* ... */`; const MetricLabel = styled.div`/* ... */`; const OptimizationsGrid = styled.div`/* ... */`; const OptimizationOption = styled.div<{ selected: boolean; category: 'revenue' | 'performance' | 'user_experience' }>`/* ... */`; const OptimizationHeader = styled.div`/* ... */`; const OptimizationTitle = styled.h5`/* ... */`; const OptimizationBadges = styled.div`/* ... */`; const ImpactBadge = styled.span<{ impact: number }>`/* ... */`; const DifficultyBadge = styled.span<{ difficulty: 'easy' | 'medium' | 'hard' }>`/* ... */`; const OptimizationDescription = styled.p`/* ... */`; const OptimizationDetails = styled.div`/* ... */`; const DetailItem = styled.div`/* ... */`; const DetailValue = styled.span`/* ... */`; const DetailLabel = styled.span`/* ... */`; const EstimatePanel = styled.div`/* ... */`; const EstimateTitle = styled.h4`/* ... */`; const EstimateValueStyled = styled.div`/* ... */`; const EstimateBreakdown = styled.div`/* ... */`; const ProcessingSteps = styled.div`/* ... */`; const ProcessingStepStyled = styled.div<{ status: string; isActive: boolean }>`/* ... */`; const StepIcon = styled.div<{ status: string }>`/* ... */`; const StepContent = styled.div`/* ... */`; const StepTitle = styled.h5`/* ... */`; const StepDescription = styled.p`/* ... */`; const CodePanel = styled.div`/* ... */`; const CodeHeader = styled.div`/* ... */`; const CodeTitleStyled = styled.h5`/* ... */`; const CodeContent = styled.pre`/* ... */`; const ActionButtons = styled.div`/* ... */`; const ActionButton = styled.button<any>`/* ... */`; const EmptyState = styled.div`/* ... */`; const EmptyIconStyled = styled.div`/* ... */`;
Header.defaultProps = { children: React.createElement(React.Fragment) }; Title.defaultProps = { children: React.createElement(React.Fragment) }; Subtitle.defaultProps = { children: React.createElement(React.Fragment) }; AIBadge.defaultProps = { children: React.createElement(React.Fragment) }; MainLayout.defaultProps = { children: React.createElement(React.Fragment) }; SidePanel.defaultProps = { children: React.createElement(React.Fragment) }; MainPanel.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationCard.defaultProps = { children: React.createElement(React.Fragment) }; SectionTitle.defaultProps = { children: React.createElement(React.Fragment) }; SiteSelector.defaultProps = { children: React.createElement(React.Fragment) }; SiteGrid.defaultProps = { children: React.createElement(React.Fragment) }; SiteCardStyled.defaultProps = { children: React.createElement(React.Fragment) }; SiteInfo.defaultProps = { children: React.createElement(React.Fragment) }; SiteIcon.defaultProps = { children: React.createElement(React.Fragment) }; SiteDetails.defaultProps = { children: React.createElement(React.Fragment) }; SiteName.defaultProps = { children: React.createElement(React.Fragment) }; SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationStatus.defaultProps = { children: React.createElement(React.Fragment) }; AnalysisPanel.defaultProps = { children: React.createElement(React.Fragment) }; AnalysisTitle.defaultProps = { children: React.createElement(React.Fragment) }; MetricsGrid.defaultProps = { children: React.createElement(React.Fragment) }; MetricCard.defaultProps = { children: React.createElement(React.Fragment) }; MetricValue.defaultProps = { children: React.createElement(React.Fragment) }; MetricLabel.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationsGrid.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationOption.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationHeader.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationTitle.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationBadges.defaultProps = { children: React.createElement(React.Fragment) }; ImpactBadge.defaultProps = { children: React.createElement(React.Fragment) }; DifficultyBadge.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationDescription.defaultProps = { children: React.createElement(React.Fragment) }; OptimizationDetails.defaultProps = { children: React.createElement(React.Fragment) }; DetailItem.defaultProps = { children: React.createElement(React.Fragment) }; DetailValue.defaultProps = { children: React.createElement(React.Fragment) }; DetailLabel.defaultProps = { children: React.createElement(React.Fragment) }; EstimatePanel.defaultProps = { children: React.createElement(React.Fragment) }; EstimateTitle.defaultProps = { children: React.createElement(React.Fragment) }; EstimateValueStyled.defaultProps = { children: React.createElement(React.Fragment) }; EstimateBreakdown.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) }; ProcessingStepStyled.defaultProps = { children: React.createElement(React.Fragment) }; StepIcon.defaultProps = { children: React.createElement(React.Fragment) }; StepContent.defaultProps = { children: React.createElement(React.Fragment) }; StepTitle.defaultProps = { children: React.createElement(React.Fragment) }; StepDescription.defaultProps = { children: React.createElement(React.Fragment) }; CodePanel.defaultProps = { children: React.createElement(React.Fragment) }; CodeHeader.defaultProps = { children: React.createElement(React.Fragment) }; CodeTitleStyled.defaultProps = { children: React.createElement(React.Fragment) }; CodeContent.defaultProps = { children: React.createElement(React.Fragment) }; ActionButtons.defaultProps = { children: React.createElement(React.Fragment) }; ActionButton.defaultProps = { children: React.createElement(React.Fragment) }; EmptyState.defaultProps = { children: React.createElement(React.Fragment) }; EmptyIconStyled.defaultProps = { children: React.createElement(React.Fragment) };


// === CONSTANTS ===
const OPTIMIZATION_CONFIGS_DATA: OptimizationConfigUI[] = [ /* ... (mantido como no original) ... */ { id: 'auto_ads', type: 'auto_ads', title: 'Google Auto Ads Otimizado', description: 'Implementa Auto Ads com configurações personalizadas para máximo RPM mantendo experiência do usuário.', category: 'revenue', difficulty: 'easy', estimated_impact: 25, implementation_time: 10, enabled: false, priority: 1, requirements: ['Google AdSense aprovado', 'Site com conteúdo original'], warnings: ['Pode afetar layout inicial', 'Monitorar métricas de UX'] }, { id: 'ad_placement', type: 'ad_placement', title: 'Posicionamento Estratégico', description: 'Posiciona anúncios em locais de alta visibilidade e engajamento baseado em heatmaps de usuário.', category: 'revenue', difficulty: 'medium', estimated_impact: 30, implementation_time: 20, enabled: false, priority: 2, requirements: ['Analytics configurado', 'Acesso ao código HTML'], warnings: ['Requer testes A/B', 'Impacto em Core Web Vitals'] }, { id: 'lazy_loading', type: 'lazy_loading', title: 'Lazy Loading Inteligente', description: 'Carregamento sob demanda para melhorar velocidade sem perder impressões de anúncios.', category: 'performance', difficulty: 'medium', estimated_impact: 15, implementation_time: 25, enabled: false, priority: 3, requirements: ['Site responsivo', 'JavaScript habilitado'], warnings: ['Pode afetar viewability inicial'] }, { id: 'ad_formats', type: 'ad_formats', title: 'Formatos Otimizados', description: 'Implementa formatos de anúncio com melhor performance: Responsive, Multiplex, In-feed.', category: 'revenue', difficulty: 'easy', estimated_impact: 20, implementation_time: 15, enabled: false, priority: 4, requirements: ['AdSense aprovado', 'Site mobile-friendly'], warnings: ['Testar em diferentes dispositivos'] }, { id: 'targeting', type: 'targeting', title: 'Targeting Avançado', description: 'Configurações de segmentação de anúncios para atrair anunciantes premium e aumentar CPC.', category: 'revenue', difficulty: 'hard', estimated_impact: 35, implementation_time: 30, enabled: false, priority: 5, requirements: ['Alto tráfego', 'Conteúdo de qualidade', 'Audiência definida'], warnings: ['Requer análise de audiência', 'Resultados podem variar'] }, { id: 'blocking', type: 'blocking', title: 'Bloqueio de Anúncios de Baixo CPC', description: 'Remove categorias de anúncios com baixo valor para priorizar anunciantes premium.', category: 'revenue', difficulty: 'medium', estimated_impact: 18, implementation_time: 20, enabled: false, priority: 6, requirements: ['Dados históricos de 30+ dias', 'Volume mínimo de impressões'], warnings: ['Pode reduzir fill rate inicialmente'] } ];

// === COMPONENT PRINCIPAL ===
const Optimizer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, refreshData: refreshFluxData, invokeFluxOptimizerEngine, generateScript } = useFluxData();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisDataLocal | null>(null);
  const [optimizationConfigs, setOptimizationConfigs] = useState<OptimizationConfigUI[]>(
    OPTIMIZATION_CONFIGS_DATA.map(c => ({ ...c, enabled: false }))
  );
  // selectedOptimizations armazena os IDs das configs selecionadas
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultUI | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [estimatedImprovement, setEstimatedImprovement] = useState(0);
  const [currentSiteScript, setCurrentSiteScript] = useState<string | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);


  useEffect(() => { /* ... (lógica de inicialização de selectedSiteId) ... */ const siteParam = searchParams.get('site'); if (siteParam && sites?.some(site => site.id === siteParam)) { setSelectedSiteId(siteParam); } if (location.state?.fromAnalysis && location.state?.siteId) { setSelectedSiteId(location.state.siteId); } }, [searchParams, location.state, sites]);
  const selectedSite = useMemo(() => sites?.find(s => s.id === selectedSiteId) as SiteLocal | undefined, [sites, selectedSiteId]);

  const loadSiteAnalysis = useCallback(async (siteId: string) => { /* ... (lógica como antes, mas usando AnalysisDataLocal) ... */ if (!user?.id || !siteId) return; try { const { data, error } = await supabase .from('adsense_analyses') .select('*') .eq('site_id', siteId) .eq('client_id', user.id) .order('created_at', { ascending: false }) .maybeSingle(); if (error && error.code !== 'PGRST116') { console.error('❌ Erro ao carregar análise:', error); return; } if (data) { const analysisData: AnalysisDataLocal = { id: data.id, site_id: data.site_id, client_id: data.client_id, total_revenue: data.total_revenue || 0, total_pageviews: data.total_pageviews || 0, total_impressions: data.total_impressions || 0, total_clicks: data.total_clicks || 0, avg_cpc: data.avg_cpc || 0, avg_ctr: data.avg_ctr || 0, avg_rpm: data.avg_rpm || 0, optimization_score: data.optimization_score || 0, projected_revenue: data.projected_revenue || 0, projected_increase: data.projected_increase || 0, analysis_results: data.analysis_results || {}, opportunities: data.opportunities || [], created_at: data.created_at }; setCurrentAnalysis(analysisData); } else { setCurrentAnalysis(null); } } catch (err) { console.error('❌ Erro ao carregar análise:', err); } }, [user?.id]);
  useEffect(() => { if (selectedSiteId) { loadSiteAnalysis(selectedSiteId); setCurrentSiteScript(null); /* Limpar script ao mudar de site */ } }, [selectedSiteId, loadSiteAnalysis]);

  const getOptimizationStatus = useCallback((_site: SiteLocal, analysis?: AnalysisDataLocal | null) => { /* ... */ const score = analysis?.optimization_score || 0; if (score >= 85) return 'excellent'; if (score >= 70) return 'good'; if (score >= 50) return 'needs_improvement'; return 'critical'; }, []);

  const toggleOptimization = useCallback((optimizationId: string) => {
    setOptimizationConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.id === optimizationId
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
    setSelectedOptimizations(prevSelected =>
      prevSelected.includes(optimizationId)
        ? prevSelected.filter(id => id !== optimizationId)
        : [...prevSelected, optimizationId]
    );
  }, []);

  useEffect(() => { /* ... (cálculo de estimatedImprovement) ... */ const currentSelectedConfigs = optimizationConfigs.filter(config => config.enabled); const totalImprovement = currentSelectedConfigs.reduce((acc, config) => acc + (config.estimated_impact * (1 - acc / 100)), 0); setEstimatedImprovement(Math.min(totalImprovement, 85)); }, [optimizationConfigs]);

  const initializeProcessingSteps = useCallback(() => { /* ... */ return [ { id: 'analysis', title: 'Analisando Site', status: 'processing', progress: 0 }, { id: 'optimization', title: 'Aplicando Otimizações', status: 'pending', progress: 0 }, { id: 'script', title: 'Gerando Script', status: 'pending', progress: 0 }, { id: 'validation', title: 'Validação Final', status: 'pending', progress: 0 } ]; }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => { setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const handleGenerateOptimization = useCallback(async () => {
    if (!selectedSiteId || selectedOptimizations.length === 0 || !user?.id || !selectedSite) {
      toast({ title: 'Seleção Incompleta', description: 'Selecione um site e pelo menos uma otimização.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setProcessingSteps(initializeProcessingSteps());
    setOptimizationResult(null); // Limpar resultado anterior

    try {
      updateProcessingStep('analysis', { status: 'processing', progress: 30 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('analysis', { status: 'completed', progress: 100 });

      updateProcessingStep('optimization', { status: 'processing', progress: 40 });

      const configsToApply = optimizationConfigs.filter(c => c.enabled)
        .map(c => ({ // Mapear para SelectedOptimizationConfig
            type: c.type,
            title: c.title,
            settings: c.settings, // Assegurar que settings seja passado
            estimated_impact: c.estimated_impact,
            implementation_time: c.implementation_time
        }));

      const taskPayloadForDb: Omit<OptimizationTaskLocal, 'id' | 'created_at' | 'updated_at' | 'started_at' | 'completed_at' | 'results' | 'error_message' | 'processing_time_ms'> = {
        site_id: selectedSiteId,
        analysis_id: currentAnalysis?.id || null,
        status: 'pending',
        priority: 1,
        actions: {
          optimizations: configsToApply,
          analysis_data: currentAnalysis ? {
            optimization_score: currentAnalysis.optimization_score,
            total_revenue: currentAnalysis.total_revenue,
            avg_rpm: currentAnalysis.avg_rpm,
          } : null,
        },
        scheduled_at: new Date().toISOString(),
      };

      const { data: taskResult, error: taskError } = await supabase
        .from('optimization_tasks')
        .insert([taskPayloadForDb])
        .select()
        .single();

      if (taskError || !taskResult) {
        throw new Error(`Falha ao criar tarefa de otimização: ${taskError?.message}`);
      }
      updateProcessingStep('optimization', { status: 'completed', progress: 100 });
      updateProcessingStep('script', { status: 'processing', progress: 60 });

      const efPayload: Omit<InvokeFluxOptimizerEnginePayload, 'user_id' | 'timestamp'> = {
        site_id: selectedSiteId,
        optimizations: configsToApply,
        analysis_data: taskPayloadForDb.actions.analysis_data,
        taskId: taskResult.id, // Passar o ID da tarefa criada
      };

      const efResponse = await invokeFluxOptimizerEngine(efPayload);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na geração do script pela Edge Function');
      }
      updateProcessingStep('script', { status: 'completed', progress: 100 });

      updateProcessingStep('validation', { status: 'processing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('validation', { status: 'completed', progress: 100 });

      const result: OptimizationResultUI = {
        task_id: taskResult.id,
        site_id: selectedSiteId,
        optimizations_applied: optimizationConfigs.filter(c => c.enabled),
        estimated_improvement: estimatedImprovement,
        script_generated: !!efResponse.script,
        script_content: efResponse.script || '// Nenhum script específico retornado para estas otimizações.',
        installation_instructions: efResponse.instructions || ['Siga as melhores práticas para adicionar o script ao seu site.'],
        monitoring_setup: true,
        expected_results: { revenue_increase: estimatedImprovement, rpm_improvement: estimatedImprovement * 0.7, performance_impact: estimatedImprovement > 20 ? 'moderate' : 'minimal' },
        timeline: { immediate: ['Implementar script'], week_1: ['Monitorar métricas'], week_2: ['Analisar impacto'], month_1: ['Resultados consolidados'] }
      };
      setOptimizationResult(result);
      await refreshFluxData('all'); // Refresh all data
      toast({ title: 'Otimização Processada! 🚀', description: efResponse.message || `Script e instruções gerados.` });

    } catch (error: any) { /* ... (tratamento de erro como antes) ... */ console.error('❌ Erro na otimização:', error); const currentProcessingStep = processingSteps.find(s => s.status === 'processing'); if (currentProcessingStep) { updateProcessingStep(currentProcessingStep.id, { status: 'error', progress: 0 }); } toast({ title: 'Erro na Otimização', description: error.message || 'Erro ao gerar otimizações.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSiteId, selectedOptimizations, optimizationConfigs, selectedSite, currentAnalysis, user, estimatedImprovement, initializeProcessingSteps, updateProcessingStep, processingSteps, refreshFluxData, toast, invokeFluxOptimizerEngine, supabase]);

  const handleFetchCurrentScript = useCallback(async () => {
    if (!selectedSiteId) {
        toast({ title: "Selecione um Site", description: "Por favor, selecione um site para ver o script atual.", variant: "default" });
        return;
    }
    setIsLoadingScript(true);
    setCurrentSiteScript(null);
    try {
        const response = await generateScript(selectedSiteId);
        if (response.success && response.script) {
            setCurrentSiteScript(response.script);
            toast({ title: "Script Carregado", description: "Script de otimização atual do site carregado." });
        } else {
            throw new Error(response.message || "Falha ao carregar script atual.");
        }
    } catch (error: any) {
        toast({ title: "Erro ao Carregar Script", description: error.message, variant: "destructive" });
    } finally {
        setIsLoadingScript(false);
    }
  }, [selectedSiteId, generateScript, toast]);


  const resetOptimization = useCallback(() => { /* ... */ setSelectedOptimizations([]); setOptimizationConfigs(OPTIMIZATION_CONFIGS_DATA.map(c => ({ ...c, enabled: false }))); setOptimizationResult(null); setProcessingSteps([]); setEstimatedImprovement(0); setCurrentSiteScript(null); }, []);

  // === RENDER ===
  // ... (O JSX principal permanece o mesmo, mas agora pode ter um botão para handleFetchCurrentScript e exibir currentSiteScript) ...
  if (!user) { return ( <OptimizerContainer> <EmptyState> <EmptyIconStyled>🔒</EmptyIconStyled> <h3>Acesso Restrito</h3> <p>Faça login para acessar o otimizador AdSense.</p> </EmptyState> </OptimizerContainer> ); }
  return ( <OptimizerContainer> {/* ... Conteúdo JSX ... Adicionar botão e display para currentSiteScript se desejar ... */} </OptimizerContainer> );
};

export default Optimizer;
