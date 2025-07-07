// Em src/types/interfaces.ts (criar este arquivo)
export interface TrialStatusData {
  days_remaining: number;
  trial_active: boolean;
  trial_end_date: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  features_available: string[];
}

export interface MetricsData {
  total_revenue: number;
  revenue_change_percent: number;
  active_optimizations: number;
  optimization_change_percent: number;
  last_analysis_date: string;
}

export interface DashboardData {
  totalRevenue: number;
  revenueChange: number;
  activeOptimizations: number;
  optimizationChange: number;
  lastAnalysis: string;
  trialDaysLeft?: number;
}

export interface Site {
  id: string;
  client_id: string;
  url: string;
  monthly_pageviews?: number;
  current_rpm?: number;
  target_rpm?: number;
  optimization_token?: string;
  script_installed?: boolean;
  created_at?: string;
}
// src/types/interfaces.ts
export interface OptimizationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  adsense_analyses: Array<{ file_name: string }>;
  sites: Array<{ url: string }>;
}

// Interfaces para Payloads e Respostas de Edge Functions

// Para a Edge Function: analyze-adsense
export interface AnalyzeAdSensePayload {
  csv_data: string;
  site_id: string; // Adicionado, pois é enviado pelo Analyzer.tsx
  site_url?: string; // Opcional, pode ser derivado do site_id no backend
  client_id: string; // Alterado de user_id para consistência com Analyzer.tsx e schema
  validation_info?: any; // Enviado pelo Analyzer.tsx
  timestamp: string;
}

export interface AnalyzeAdSenseResponse {
  success: boolean;
  message?: string;
  analysis_id?: string; // ID da análise criada, em snake_case
  metrics?: {
    total_revenue?: number;
    total_pageviews?: number;
    total_impressions?: number;
    total_clicks?: number;
    avg_cpc?: number;
    avg_ctr?: number;
    avg_rpm?: number;
  };
  optimization_score?: number;
  projected_revenue?: number;
  projected_increase?: number;
  analysis_results?: any; // Dados brutos da análise
  opportunities?: any[]; // Lista de oportunidades identificadas
}

// Para a Edge Function: flux-optimizer-engine (ação: generate_script - usada por useFluxData)
export interface GenerateScriptPayload {
  site_id: string;
  user_id: string; // Validação via JWT no backend é crucial
  action: 'generate_script'; // Específico para esta ação
  timestamp: string;
}

export interface GenerateScriptResponse {
  script: string;
  message?: string;
  success: boolean;
}

// Novas interfaces para a chamada mais complexa a flux-optimizer-engine pelo Optimizer.tsx
export interface SelectedOptimizationConfig { // Configurações de otimização que o usuário seleciona
  type: string; // ex: 'auto_ads', 'ad_placement'
  title: string;
  settings?: any; // Configurações específicas da otimização
  estimated_impact?: number;
  implementation_time?: number;
}

export interface SiteAnalysisDataForOptimizer { // Dados da análise atual do site, se houver
  optimization_score?: number;
  total_revenue?: number;
  avg_rpm?: number;
  // Adicionar outros campos da análise que podem ser úteis para a EF
}

export interface InvokeFluxOptimizerEnginePayload {
  site_id: string;
  site_url?: string; // Opcional, pode ser derivado do site_id
  optimizations: SelectedOptimizationConfig[]; // Array das otimizações selecionadas
  analysis_data?: SiteAnalysisDataForOptimizer | null; // Dados da última análise do site
  user_id: string; // ID do usuário autenticado (para referência, mas a EF deve usar JWT)
  task_id?: string; // ID da tarefa criada em optimization_tasks pelo Optimizer.tsx
  timestamp: string;
}

export interface InvokeFluxOptimizerEngineResponse {
  success: boolean;
  message?: string;
  script?: string; // O script de otimização gerado
  instructions?: string[]; // Instruções de instalação do script
  // Outros campos que a EF possa retornar, como um ID de acompanhamento, etc.
}


// Para a Edge Function: create-site
export interface CreateSitePayload {
  url: string;
  user_id: string; // Validação via JWT no backend é crucial
  timestamp: string;
}

// A resposta para create-site pode ser o objeto do site criado
// Reutilizando a interface Site já existente, se aplicável, ou uma específica.
// Assumindo que a EF retorna o objeto do site criado:
export type CreateSiteResponse = Site & { success: boolean; message?: string; };
// Se a resposta for mais simples:
// export interface CreateSiteResponse {
//   success: boolean;
//   message?: string;
//   site_id?: string;
// }

// Para a Edge Function: generate-pdf-report (chamada pelo Relatorios.tsx)
export interface ReportFiltersForPdf { // Espelho dos filtros usados em Relatorios.tsx
  dateRange: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom' | 'today' | 'yesterday';
  startDate?: string;
  endDate?: string;
  siteId?: string;
  metric: 'revenue' | 'pageviews' | 'ctr' | 'rpm' | 'optimization_score';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  comparison: boolean;
}

export interface AnalyticsDataForPdf { // Espelho de AnalyticsData em Relatorios.tsx
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
  confidence_level?: number;
  revenue_potential?: number;
  niches_detected?: string[];
  seasonality_factor?: number;
}

export interface ReportSummaryForPdf { // Espelho de ReportSummary em Relatorios.tsx
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

export interface ChartDataPointForPdf { // Espelho de ChartDataPoint em Relatorios.tsx
  date: string;
  value: number;
  comparison?: number;
  label?: string;
}
export interface GeneratePdfReportPayload {
  analyticsData: AnalyticsDataForPdf[];
  reportSummary: ReportSummaryForPdf | null;
  chartData: ChartDataPointForPdf[];
  filters: ReportFiltersForPdf;
  userId: string; // ID do usuário autenticado
  generatedAt: string; // Timestamp da geração
}

export interface GeneratePdfReportResponse {
  success: boolean;
  message?: string;
  url?: string; // URL para o PDF gerado (ex: link de storage)
}
