// src/components/Optimizer.tsx - ENTERPRISE GRADE OPTIMIZATION ENGINE CORRIGIDO

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components'; // Presumindo que os styled-components permanecem os mesmos
import { useFluxData } from '../hooks/useFluxData'; // invokeFluxOptimizerEngine será desestruturado
import {
    InvokeFluxOptimizerEnginePayload,
    InvokeFluxOptimizerEngineResponse,
    SelectedOptimizationConfig, // Importar se usado para estado local
    SiteAnalysisDataForOptimizer // Importar se usado para estado local
} from '../types/interfaces';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient'; // Mantido para inserts diretos e selects

// === INTERFACES LOCAIS (OptimizationTask, AnalysisData local, Site local, OptimizationConfig local, OptimizationResult, ScriptTemplate) - Presumindo que permanecem as mesmas ===
// ... (Omitidas para brevidade, mas devem estar aqui como no arquivo original)
interface OptimizationTask {
    id?: string;
    site_id: string;
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

  interface AnalysisData { // Interface local para dados de análise usados no Optimizer
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

  interface Site { // Interface local
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

  interface OptimizationConfig { // Configuração de otimização disponível
    id: string;
    type: 'ad_placement' | 'ad_formats' | 'targeting' | 'blocking' | 'lazy_loading' | 'auto_ads';
    title: string;
    description: string;
    category: 'revenue' | 'performance' | 'user_experience';
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedImpact: number;
    implementationTime: number;
    code?: string;
    settings?: any;
    enabled: boolean; // Se o usuário selecionou esta otimização
    priority: number;
    requirements?: string[];
    warnings?: string[];
  }

  interface OptimizationResult { // Resultado após gerar a otimização
    task_id: string;
    site_id: string;
    optimizations_applied: OptimizationConfig[]; // Usando a interface local OptimizationConfig
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

// === STYLED COMPONENTS (Omitidos para brevidade) ===
// ... (Todos os styled-components)
const optimizationFlow = keyframes` /* ... */ `;
const codeGeneration = keyframes` /* ... */ `;
const revenueBoost = keyframes` /* ... */ `;
const aiOptimizing = keyframes` /* ... */ `;
const slideInUp = keyframes` /* ... */ `;
const OptimizerContainer = styled.div` /* ... */ `;
const Header = styled.header` /* ... */ `;
const Title = styled.h1` /* ... */ `;
const Subtitle = styled.p` /* ... */ `;
const AIBadge = styled.div` /* ... */ `;
const MainLayout = styled.div` /* ... */ `;
const SidePanel = styled.div` /* ... */ `;
const MainPanel = styled.div` /* ... */ `;
const OptimizationCard = styled.div` /* ... */ `;
const SectionTitle = styled.h3` /* ... */ `;
const SiteSelector = styled.div` /* ... */ `;
const SiteGrid = styled.div` /* ... */ `;
const SiteCard = styled.div<{ selected: boolean }>` /* ... */ `;
const SiteInfo = styled.div` /* ... */ `;
const SiteIcon = styled.div<{ optimized?: boolean }>` /* ... */ `;
const SiteDetails = styled.div` /* ... */ `;
const SiteName = styled.h4` /* ... */ `;
const SiteMetrics = styled.div` /* ... */ `;
const OptimizationStatus = styled.div<{ status: 'excellent' | 'good' | 'needs_improvement' | 'critical' }>` /* ... */ `;
const AnalysisPanel = styled.div` /* ... */ `;
const AnalysisTitle = styled.h4` /* ... */ `;
const MetricsGrid = styled.div` /* ... */ `; // Duplicado? Verificar se é o mesmo do Analyzer
const MetricCard = styled.div` /* ... */ `; // Duplicado?
const MetricValue = styled.div` /* ... */ `; // Duplicado?
const MetricLabel = styled.div` /* ... */ `; // Duplicado?
const OptimizationsGrid = styled.div` /* ... */ `;
const OptimizationOption = styled.div<{ selected: boolean; category: 'revenue' | 'performance' | 'user_experience' }>` /* ... */ `;
const OptimizationHeader = styled.div` /* ... */ `;
const OptimizationTitle = styled.h5` /* ... */ `;
const OptimizationBadges = styled.div` /* ... */ `;
const ImpactBadge = styled.span<{ impact: number }>` /* ... */ `;
const DifficultyBadge = styled.span<{ difficulty: 'easy' | 'medium' | 'hard' }>` /* ... */ `;
const OptimizationDescription = styled.p` /* ... */ `;
const OptimizationDetails = styled.div` /* ... */ `;
const DetailItem = styled.div` /* ... */ `;
const DetailValue = styled.span` /* ... */ `;
const DetailLabel = styled.span` /* ... */ `;
const EstimatePanel = styled.div` /* ... */ `;
const EstimateTitle = styled.h4` /* ... */ `;
const EstimateValue = styled.div` /* ... */ `; // Duplicado?
const EstimateBreakdown = styled.div` /* ... */ `;
const ProcessingSteps = styled.div` /* ... */ `; // Duplicado?
const ProcessingStep = styled.div<{ status: string; isActive: boolean }>` /* ... */ `; // Duplicado?
const StepIcon = styled.div<{ status: string }>` /* ... */ `; // Duplicado?
const StepContent = styled.div` /* ... */ `; // Duplicado?
const StepTitle = styled.h5` /* ... */ `; // Duplicado?
const StepDescription = styled.p` /* ... */ `; // Duplicado?
const CodePanel = styled.div` /* ... */ `;
const CodeHeader = styled.div` /* ... */ `;
const CodeTitle = styled.h5` /* ... */ `; // Duplicado?
const CodeContent = styled.pre` /* ... */ `;
const ActionButtons = styled.div` /* ... */ `; // Duplicado?
const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger'; loading?: boolean; size?: 'small' | 'medium' | 'large'; }>` /* ... */ `; // Duplicado?
const EmptyState = styled.div` /* ... */ `; // Duplicado?
const EmptyIcon = styled.div` /* ... */ `; // Duplicado?
// Adicionando os que faltavam para completar o componente
Header.defaultProps = { children: React.createElement(React.Fragment) };
Title.defaultProps = { children: React.createElement(React.Fragment) };
Subtitle.defaultProps = { children: React.createElement(React.Fragment) };
AIBadge.defaultProps = { children: React.createElement(React.Fragment) };
MainLayout.defaultProps = { children: React.createElement(React.Fragment) };
SidePanel.defaultProps = { children: React.createElement(React.Fragment) };
MainPanel.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationCard.defaultProps = { children: React.createElement(React.Fragment) };
SectionTitle.defaultProps = { children: React.createElement(React.Fragment) };
SiteSelector.defaultProps = { children: React.createElement(React.Fragment) };
SiteGrid.defaultProps = { children: React.createElement(React.Fragment) };
SiteCard.defaultProps = { children: React.createElement(React.Fragment) };
SiteInfo.defaultProps = { children: React.createElement(React.Fragment) };
SiteIcon.defaultProps = { children: React.createElement(React.Fragment) };
SiteDetails.defaultProps = { children: React.createElement(React.Fragment) };
SiteName.defaultProps = { children: React.createElement(React.Fragment) };
SiteMetrics.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationStatus.defaultProps = { children: React.createElement(React.Fragment) };
AnalysisPanel.defaultProps = { children: React.createElement(React.Fragment) };
AnalysisTitle.defaultProps = { children: React.createElement(React.Fragment) };
MetricsGrid.defaultProps = { children: React.createElement(React.Fragment) };
MetricCard.defaultProps = { children: React.createElement(React.Fragment) };
MetricValue.defaultProps = { children: React.createElement(React.Fragment) };
MetricLabel.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationsGrid.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationOption.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationHeader.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationTitle.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationBadges.defaultProps = { children: React.createElement(React.Fragment) };
ImpactBadge.defaultProps = { children: React.createElement(React.Fragment) };
DifficultyBadge.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationDescription.defaultProps = { children: React.createElement(React.Fragment) };
OptimizationDetails.defaultProps = { children: React.createElement(React.Fragment) };
DetailItem.defaultProps = { children: React.createElement(React.Fragment) };
DetailValue.defaultProps = { children: React.createElement(React.Fragment) };
DetailLabel.defaultProps = { children: React.createElement(React.Fragment) };
EstimatePanel.defaultProps = { children: React.createElement(React.Fragment) };
EstimateTitle.defaultProps = { children: React.createElement(React.Fragment) };
EstimateValue.defaultProps = { children: React.createElement(React.Fragment) };
EstimateBreakdown.defaultProps = { children: React.createElement(React.Fragment) };
ProcessingSteps.defaultProps = { children: React.createElement(React.Fragment) };
ProcessingStep.defaultProps = { children: React.createElement(React.Fragment) };
StepIcon.defaultProps = { children: React.createElement(React.Fragment) };
StepContent.defaultProps = { children: React.createElement(React.Fragment) };
StepTitle.defaultProps = { children: React.createElement(React.Fragment) };
StepDescription.defaultProps = { children: React.createElement(React.Fragment) };
CodePanel.defaultProps = { children: React.createElement(React.Fragment) };
CodeHeader.defaultProps = { children: React.createElement(React.Fragment) };
CodeTitle.defaultProps = { children: React.createElement(React.Fragment) };
CodeContent.defaultProps = { children: React.createElement(React.Fragment) };
ActionButtons.defaultProps = { children: React.createElement(React.Fragment) };
ActionButton.defaultProps = { children: React.createElement(React.Fragment) };
EmptyState.defaultProps = { children: React.createElement(React.Fragment) };
EmptyIcon.defaultProps = { children: React.createElement(React.Fragment) };


// === CONSTANTS ===
const OPTIMIZATION_CONFIGS: OptimizationConfig[] = [ /* ... (sem mudanças) ... */ { id: 'auto_ads', type: 'auto_ads', title: 'Google Auto Ads Otimizado', description: 'Implementa Auto Ads com configurações personalizadas para máximo RPM mantendo experiência do usuário.', category: 'revenue', difficulty: 'easy', estimatedImpact: 25, implementationTime: 10, enabled: false, priority: 1, requirements: ['Google AdSense aprovado', 'Site com conteúdo original'], warnings: ['Pode afetar layout inicial', 'Monitorar métricas de UX'] }, { id: 'ad_placement', type: 'ad_placement', title: 'Posicionamento Estratégico', description: 'Posiciona anúncios em locais de alta visibilidade e engajamento baseado em heatmaps de usuário.', category: 'revenue', difficulty: 'medium', estimatedImpact: 30, implementationTime: 20, enabled: false, priority: 2, requirements: ['Analytics configurado', 'Acesso ao código HTML'], warnings: ['Requer testes A/B', 'Impacto em Core Web Vitals'] }, { id: 'lazy_loading', type: 'lazy_loading', title: 'Lazy Loading Inteligente', description: 'Carregamento sob demanda para melhorar velocidade sem perder impressões de anúncios.', category: 'performance', difficulty: 'medium', estimatedImpact: 15, implementationTime: 25, enabled: false, priority: 3, requirements: ['Site responsivo', 'JavaScript habilitado'], warnings: ['Pode afetar viewability inicial'] }, { id: 'ad_formats', type: 'ad_formats', title: 'Formatos Otimizados', description: 'Implementa formatos de anúncio com melhor performance: Responsive, Multiplex, In-feed.', category: 'revenue', difficulty: 'easy', estimatedImpact: 20, implementationTime: 15, enabled: false, priority: 4, requirements: ['AdSense aprovado', 'Site mobile-friendly'], warnings: ['Testar em diferentes dispositivos'] }, { id: 'targeting', type: 'targeting', title: 'Targeting Avançado', description: 'Configurações de segmentação de anúncios para atrair anunciantes premium e aumentar CPC.', category: 'revenue', difficulty: 'hard', estimatedImpact: 35, implementationTime: 30, enabled: false, priority: 5, requirements: ['Alto tráfego', 'Conteúdo de qualidade', 'Audiência definida'], warnings: ['Requer análise de audiência', 'Resultados podem variar'] }, { id: 'blocking', type: 'blocking', title: 'Bloqueio de Anúncios de Baixo CPC', description: 'Remove categorias de anúncios com baixo valor para priorizar anunciantes premium.', category: 'revenue', difficulty: 'medium', estimatedImpact: 18, implementationTime: 20, enabled: false, priority: 6, requirements: ['Dados históricos de 30+ dias', 'Volume mínimo de impressões'], warnings: ['Pode reduzir fill rate inicialmente'] } ];

// === COMPONENT PRINCIPAL ===
const Optimizer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  // Desestruturar invokeFluxOptimizerEngine
  const { sites, refreshData, invokeFluxOptimizerEngine } = useFluxData();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [optimizationConfigs, setOptimizationConfigs] = useState<OptimizationConfig[]>(
    // Garantir que enabled seja false no estado inicial, mesmo que o default mude
    OPTIMIZATION_CONFIGS.map(c => ({...c, enabled: false}))
  );
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]); // Pode ser ProcessingStep[]
  const [estimatedImprovement, setEstimatedImprovement] = useState(0);

  useEffect(() => { /* ... (lógica de inicialização de selectedSiteId, sem mudanças) ... */ const siteParam = searchParams.get('site'); if (siteParam && sites?.some(site => site.id === siteParam)) { setSelectedSiteId(siteParam); } if (location.state?.fromAnalysis && location.state?.siteId) { setSelectedSiteId(location.state.siteId); } }, [searchParams, location.state, sites]);

  const selectedSite = useMemo(() => { /* ... (sem mudanças) ... */ return sites?.find(s => s.id === selectedSiteId); }, [sites, selectedSiteId]);

  const loadSiteAnalysis = useCallback(async (siteId: string) => { /* ... (sem mudanças na lógica de fetch, mas atenção à RLS) ... */ if (!user?.id || !siteId) return; try { const { data, error } = await supabase .from('adsense_analyses') .select('*') .eq('site_id', siteId) .eq('client_id', user.id) .order('created_at', { ascending: false }) .maybeSingle(); if (error && error.code !== 'PGRST116') { console.error('❌ Erro ao carregar análise:', error); return; } if (data) { const analysisData: AnalysisData = { id: data.id, site_id: data.site_id, client_id: data.client_id, total_revenue: data.total_revenue || 0, total_pageviews: data.total_pageviews || 0, total_impressions: data.total_impressions || 0, total_clicks: data.total_clicks || 0, avg_cpc: data.avg_cpc || 0, avg_ctr: data.avg_ctr || 0, avg_rpm: data.avg_rpm || 0, optimization_score: data.optimization_score || 0, projected_revenue: data.projected_revenue || 0, projected_increase: data.projected_increase || 0, analysis_results: data.analysis_results || {}, opportunities: data.opportunities || [], created_at: data.created_at }; setCurrentAnalysis(analysisData); console.log('✅ Análise carregada:', analysisData); } else { console.log('ℹ️ Nenhuma análise encontrada para o site'); setCurrentAnalysis(null); } } catch (err) { console.error('❌ Erro ao carregar análise:', err); } }, [user?.id]);
  useEffect(() => { if (selectedSiteId) { loadSiteAnalysis(selectedSiteId); } }, [selectedSiteId, loadSiteAnalysis]);

  const getOptimizationStatus = useCallback((site: Site, analysis?: AnalysisData | null) => { /* ... (sem mudanças) ... */ const score = analysis?.optimization_score || 0; if (score >= 85) return 'excellent'; if (score >= 70) return 'good'; if (score >= 50) return 'needs_improvement'; return 'critical'; }, []);
  const toggleOptimization = useCallback((optimizationId: string) => { /* ... (sem mudanças) ... */ setSelectedOptimizations(prev => { const isSelected = prev.includes(optimizationId); const newSelection = isSelected ? prev.filter(id => id !== optimizationId) : [...prev, optimizationId]; setOptimizationConfigs(prevConfigs => prevConfigs.map(config => config.id === optimizationId ? { ...config, enabled: !isSelected } : config )); return newSelection; }); }, []);
  useEffect(() => { /* ... (cálculo de estimatedImprovement, sem mudanças) ... */ const selectedConfigs = optimizationConfigs.filter(config => selectedOptimizations.includes(config.id)); const totalImprovement = selectedConfigs.reduce((acc, config) => { return acc + (config.estimatedImpact * (1 - acc / 100)); }, 0); setEstimatedImprovement(Math.min(totalImprovement, 85)); }, [selectedOptimizations, optimizationConfigs]);

  const initializeProcessingSteps = useCallback(() => { /* ... (sem mudanças) ... */ return [ { id: 'analysis', title: 'Analisando Site', description: 'Verificando configuração atual e oportunidades', status: 'processing', progress: 0 }, { id: 'optimization', title: 'Aplicando Otimizações', description: 'Configurando otimizações selecionadas', status: 'pending', progress: 0 }, { id: 'script', title: 'Gerando Script', description: 'Criando código de implementação personalizado', status: 'pending', progress: 0 }, { id: 'validation', title: 'Validação Final', description: 'Verificando compatibilidade e qualidade', status: 'pending', progress: 0 } ]; }, []);
  const updateProcessingStep = useCallback((stepId: string, updates: any) => { /* ... (sem mudanças) ... */ setProcessingSteps(prev => prev.map(step => step.id === stepId ? { ...step, ...updates } : step )); }, []);

  const generateOptimizationScript = useCallback(async () => {
    if (!selectedSiteId || selectedOptimizations.length === 0 || !user?.id) {
      toast({ title: 'Seleção Incompleta', description: 'Selecione um site, pelo menos uma otimização e certifique-se de estar logado.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    const steps = initializeProcessingSteps();
    setProcessingSteps(steps);

    try {
      updateProcessingStep('analysis', { status: 'processing', progress: 30 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      updateProcessingStep('analysis', { status: 'completed', progress: 100 });

      updateProcessingStep('optimization', { status: 'processing', progress: 40 });
      const currentSelectedConfigs = optimizationConfigs.filter(config =>
        selectedOptimizations.includes(config.id)
      );

      // Criar a tarefa no banco de dados ANTES de chamar a EF principal
      const taskPayload: Omit<OptimizationTask, 'id' | 'created_at' | 'updated_at'> = {
        site_id: selectedSiteId,
        analysis_id: currentAnalysis?.id,
        status: 'pending', // A EF pode atualizar isso depois
        priority: 1,
        actions: {
          optimizations: currentSelectedConfigs.map(c => ({ type: c.type, title: c.title, settings: c.settings })),
          estimated_improvement: estimatedImprovement,
        },
        scheduled_at: new Date().toISOString()
      };

      const { data: taskResult, error: taskError } = await supabase
        .from('optimization_tasks')
        .insert([taskPayload])
        .select()
        .maybeSingle();

      if (taskError) {
        console.error('❌ Erro ao criar task de otimização:', taskError);
        // Decidir se continua ou para. Por ora, continua com a geração do script.
      }
      updateProcessingStep('optimization', { status: 'completed', progress: 100 });

      updateProcessingStep('script', { status: 'processing', progress: 60 });

      const efPayload: InvokeFluxOptimizerEnginePayload = {
        site_id: selectedSiteId,
        site_url: selectedSite?.url,
        optimizations: currentSelectedConfigs.map(c => ({ // Mapear para SelectedOptimizationConfig da interface global
            type: c.type,
            title: c.title,
            settings: c.settings,
            estimated_impact: c.estimatedImpact,
            implementation_time: c.implementationTime
        })),
        analysis_data: currentAnalysis ? { // Mapear para SiteAnalysisDataForOptimizer
            optimization_score: currentAnalysis.optimization_score,
            total_revenue: currentAnalysis.total_revenue,
            avg_rpm: currentAnalysis.avg_rpm
        } : null,
        user_id: user.id,
        task_id: taskResult?.id,
        timestamp: new Date().toISOString()
      };

      // Usar a função do hook useFluxData
      const efResponse = await invokeFluxOptimizerEngine(efPayload);

      if (!efResponse.success) {
        throw new Error(efResponse.message || 'Falha na geração do script pela Edge Function');
      }
      updateProcessingStep('script', { status: 'completed', progress: 100 });

      updateProcessingStep('validation', { status: 'processing', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulação
      updateProcessingStep('validation', { status: 'completed', progress: 100 });

      const result: OptimizationResult = {
        task_id: taskResult?.id || `local_task_${Date.now()}`,
        site_id: selectedSiteId,
        optimizations_applied: currentSelectedConfigs,
        estimated_improvement: estimatedImprovement,
        script_generated: true,
        script_content: efResponse.script || '// Nenhum script retornado',
        installation_instructions: efResponse.instructions || ['Instruir manualmente.'],
        monitoring_setup: true, // Assumindo
        expected_results: { /* ... (lógica de expected_results) ... */ revenue_increase: estimatedImprovement, rpm_improvement: estimatedImprovement * 0.8, performance_impact: estimatedImprovement > 25 ? 'moderate' : 'minimal' },
        timeline: { /* ... (lógica de timeline) ... */ immediate: ['Script implementado', 'Monitoramento ativo'], week_1: ['Primeiros resultados visíveis', 'Ajustes automáticos'], week_2: ['Otimização completa', 'Métricas estabilizadas'], month_1: ['ROI maximizado', 'Relatório completo disponível'] }
      };
      setOptimizationResult(result);
      await refreshData();
      toast({ title: 'Otimização Concluída! 🚀', description: `Script gerado com potencial de ${estimatedImprovement.toFixed(1)}% de melhoria. ${efResponse.message || ''}` });

    } catch (error: any) {
      console.error('❌ Erro na otimização:', error);
      const currentStep = processingSteps.find(s => s.status === 'processing');
      if (currentStep) {
        updateProcessingStep(currentStep.id, { status: 'error', progress: 0 });
      }
      toast({ title: 'Erro na Otimização', description: error.message || 'Erro ao gerar otimizações. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSiteId, selectedOptimizations, optimizationConfigs, selectedSite, currentAnalysis, user, estimatedImprovement, initializeProcessingSteps, updateProcessingStep, processingSteps, refreshData, toast, invokeFluxOptimizerEngine]); // Adicionado invokeFluxOptimizerEngine

  const resetOptimization = useCallback(() => { /* ... (sem mudanças) ... */ setSelectedOptimizations([]); setOptimizationConfigs(prev => prev.map(config => ({ ...config, enabled: false }))); setOptimizationResult(null); setProcessingSteps([]); setEstimatedImprovement(0); }, []);

  // === RENDER ===
  // ... (O restante do JSX permanece o mesmo) ...
  if (!user) { return ( <OptimizerContainer> <EmptyState> <EmptyIcon>🔒</EmptyIcon> <h3>Acesso Restrito</h3> <p>Faça login para acessar o otimizador AdSense.</p> </EmptyState> </OptimizerContainer> ); }
  return ( <OptimizerContainer> {/* ... Conteúdo JSX ... */} </OptimizerContainer> );
};

export default Optimizer;
