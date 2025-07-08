// frontend-app/src/types/interfaces.ts

// Interfaces de Dados do Domínio (ex: tabelas do DB)

// Para representar atividades recentes (usado em Dashboard e potencialmente useFluxData)
export interface RecentActivity {
  id: string;
  type: 'analysis_completed' | 'site_added' | 'optimization_applied' | 'metric_alert' | 'user_login' | 'report_generated';
  timestamp: string;
  message: string;
  details?: any; // Pode conter site_id, analysis_id, etc.
  user_id?: string; // Para filtrar por usuário se necessário
  icon?: string; // Nome de um ícone para UI
  link?: string; // Link para a página relevante
}


export interface Site {
  id: string;
  client_id: string;
  url: string;
  name?: string; // Adicionado com base na EF create-site
  monthly_pageviews?: number;
  current_rpm?: number;
  target_rpm?: number;
  optimization_token?: string;
  script_installed?: boolean;
  optimization_enabled?: boolean; // Adicionado com base no Dashboard
  category?: string; // Adicionado com base na EF create-site (se for usado)
  adsense_id?: string; // Adicionado com base na EF create-site (se for usado)
  created_at?: string;
  updated_at?: string;
  // Outros campos que possam existir na tabela 'sites'
  geographic_distribution?: any; // Como visto na documentação do Supabase
  content_niche?: string;      // Como visto na documentação do Supabase
}

export interface Analysis { // Para dados da tabela 'adsense_analyses'
  id: string;
  site_id: string;
  client_id: string;
  site_url?: string; // Pode ser preenchido por join ou do objeto Site
  created_at: string;
  // Campos de dados sumarizados que a EF analyze-adsense espera/retorna
  total_revenue?: number;
  total_pageviews?: number;
  total_impressions?: number;
  total_clicks?: number;
  avg_cpc?: number;
  avg_ctr?: number;
  avg_rpm?: number;
  optimization_score?: number;
  projected_revenue?: number;
  projected_increase?: number;
  status: 'completed' | 'processing' | 'failed';
  // Campos JSON ou mais detalhados
  analysis_results?: any; 
  opportunities?: any[]; 
  // Campos que estavam na interface local do Analyzer.tsx
  file_name?: string; 
  period_start?: string;
  period_end?: string;
  // Outros campos da tabela adsense_analyses
  confidence_level?: number; // Do useFluxData
  niches_detected?: string[];  // Do useFluxData
  seasonality_factor?: number; // Do useFluxData
}

export interface MetricsData { // Para dados da tabela 'metrics'
  id: string;
  site_id: string;
  client_id?: string; // Recomendado adicionar esta coluna na tabela
  pageviews: number;
  revenue: number;
  rpm: number;
  ctr: number;
  impressions: number;
  clicks: number;
  timestamp: string;
  created_at: string;
  custom_data?: Record<string, any>; // Para a EF receive-metrics
}

export interface UserProfileData { // Para dados da tabela 'clients'
  id: string;
  email?: string;
  company?: string; // 'name' no formulário de Profile é mapeado para 'company'
  name?: string; // Para consistência com o form, pode ser o mesmo que company
  plan: 'free' | 'trial' | 'basic' | 'pro' | 'enterprise';
  status?: string; // 'active', 'inactive', etc.
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired_trial';
  trial_start_date?: string;
  trial_end_date?: string;
  next_billing_date?: string; // Para Navbar/Configurações
  country?: string;
  timezone?: string;
  currency?: 'BRL' | 'USD' | 'EUR';
  created_at: string;
  updated_at?: string;
  // Outros campos da tabela 'clients'
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface UserSettings { // Para dados da tabela 'user_settings' (renomeado de UserPreferencesData)
  id?: string; // Opcional se o ID for o mesmo que client_id e não uma coluna autoincrement
  client_id: string; // FK para clients.id
  notifications_enabled: boolean;
  auto_optimization: boolean;
  report_frequency: 'daily' | 'weekly' | 'monthly';
  email_notifications: boolean;
  sms_notifications: boolean;
  // Campos que estavam na interface local de Configuracoes.tsx e podem ser persistidos
  webhook_notifications?: boolean;
  email_reports?: boolean;
  report_format?: 'pdf' | 'excel' | 'dashboard';
  timezone?: string; // Pode ser redundante se já estiver em UserProfileData/clients
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  currency?: 'BRL' | 'USD' | 'EUR'; // Pode ser redundante
  theme?: 'light' | 'dark' | 'auto';
  api_access_enabled?: boolean;
  webhook_url?: string;
  slack_webhook?: string;
  ml_enabled?: boolean;
  rl_enabled?: boolean;
  ab_testing_enabled?: boolean;
  optimization_aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
  seasonality_adjustment?: boolean;
  data_retention_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Notification { // Para dados da tabela 'notifications'
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'success' | 'warning' | 'info' | 'error'; // Adicionado para Navbar
  action_url?: string; // Para Navbar
  action_label?: string; // Para Navbar
  created_at: string;
}

export interface RateLimit { // Para dados da tabela 'rate_limits'
  id: string;
  user_id: string; 
  key: string;
  count: number;
  date: string; // YYYY-MM-DD
  operation: string; // Ex: 'analysis', 'script_generation'
  // created_at e updated_at são gerenciados pelo DB
}

// Para os passos de processamento exibidos no Optimizer.tsx
export interface ProcessingStep {
  id: string;
  title: string;
  description: string; // Adicionado, conforme erro TS
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  estimatedTime?: number; // em segundos
  details?: string; // Informações adicionais ou logs
}

export interface OptimizationTask { // Para dados da tabela 'optimization_tasks'
  id: string;
  site_id: string;
  client_id?: string; // Recomendado adicionar esta coluna na tabela
  analysis_id?: string; // FK para adsense_analyses
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: number;
  actions?: TaskActionsPayload; // { optimizations: SelectedOptimizationConfig[], analysis_data?: ... }
  results?: any; // Resultado do processamento, ex: { config_id: string, summary: string[] }
  error_message?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  processing_time_ms?: number;
  created_at?: string;
  updated_at?: string;
}

// Interfaces para Payloads e Respostas de Edge Functions

// Para a Edge Function: create-site
export interface CreateSitePayload {
  url: string;
  name?: string; 
  monthly_pageviews: number;
  current_rpm: number;
}
// Ajustado para incluir um campo de erro mais estruturado
export interface CreateSiteResponse {
  success: boolean;
  message?: string;
  data?: Site | null; // Site criado ou null em caso de erro onde success=false
  error?: {
    message: string;
    details?: any;
    code?: string; // e.g., 'validation_error', 'db_error'
  } | null;
}

// Para a Edge Function: analyze-adsense
export interface AnalyzeAdSensePayload {
  // Dados que o frontend envia APÓS processar o CSV
  site_id: string; 
  client_id: string; 
  timestamp: string;
  file_name?: string;
  period_start?: string;
  period_end?: string;
  total_pageviews: number;
  total_impressions: number;
  total_clicks: number;
  total_revenue: number;
  avg_ctr: number;
  avg_rpm: number;
  avg_cpc: number;
  // Informações de validação do CSV podem ser úteis para a EF
  validation_info?: { 
    rowCount: number;
    columnCount: number;
    dataQuality: string;
    qualityScore: number;
  };
  // csv_data?: string; // Removido, pois o frontend processa
}

export interface AnalyzeAdSenseResponse {
  success: boolean;
  message?: string;
  analysis_id?: string; 
  metrics?: Partial<MetricsData & { // Usar Partial para tornar todos os campos opcionais
    avg_cpc?: number; // Adicionar avg_cpc que não está em MetricsData
    // total_impressions, total_clicks, avg_ctr, avg_rpm já estão em MetricsData
    // total_revenue, total_pageviews já estão em MetricsData
  }>;
  optimization_score?: number;
  projected_revenue?: number;
  projected_increase?: number;
  analysis_results?: any; 
  opportunities?: any[]; 
  from_cache?: boolean; // Adicionado para indicar se veio do cache da EF
  cache_age_hours?: number; // Adicionado
  benchmark_used?: any; // Adicionado
  validation_warnings?: string[]; // Adicionado
  processing_time_ms?: number; // Adicionado
}

// Para a Edge Function: flux-optimizer-script (GET request)
// Nenhum payload de corpo, params via URL. Resposta é string.
export interface GenerateScriptResponse { // O hook constrói este objeto
  script?: string; 
  success: boolean;
  message?: string; 
}

// Para a Edge Function: flux-optimizer-engine (POST com otimizações selecionadas)
export interface SelectedOptimizationConfig { 
  type: string; 
  title: string;
  settings?: any; 
  estimated_impact?: number;
  implementation_time?: number;
}

export interface SiteAnalysisDataForOptimizer { 
  optimization_score?: number;
  total_revenue?: number;
  avg_rpm?: number;
}

export interface InvokeFluxOptimizerEnginePayload {
  site_id: string;
  user_id: string; // ID do usuário autenticado (para validação na EF)
  optimizations: SelectedOptimizationConfig[]; 
  analysis_data?: SiteAnalysisDataForOptimizer | null; 
  // taskId é opcional; se não fornecido, EF cria uma nova task
  // Se fornecido, EF pode tentar reprocessar/atualizar uma task existente.
  taskId?: string; 
  // Adicionar outros campos que o Optimizer.tsx envia
  // site_url?: string; // Opcional, EF pode buscar se necessário
  timestamp?: string; // Gerado pela EF ou pelo hook
}

// Interface para os dados de configuração de otimização como exibidos/manipulados na UI (Optimizer.tsx)
// Diferente de SelectedOptimizationConfig que é mais para o payload da EF.
export interface OptimizationConfigDisplay {
  id: string; // e.g., 'auto_ads'
  type: string; // e.g., 'auto_ads'
  title: string;
  description: string;
  category: 'revenue' | 'performance' | 'ux' | string; // string para flexibilidade
  difficulty: 'easy' | 'medium' | 'hard' | string;
  estimated_impact: number; // Em porcentagem, e.g., 25 para 25%
  implementation_time: number; // Em minutos
  enabled: boolean; // Se o usuário selecionou esta otimização
  priority: number;
  requirements: string[];
  warnings: string[];
  settings?: any; // Configurações específicas para esta otimização, se houver
}


export interface InvokeFluxOptimizerEngineResponse {
  success: boolean;
  message?: string;
  script?: string; 
  instructions?: string[]; 
  task_id?: string; // ID da tarefa processada ou criada
  config_id?: string; // ID da optimizer_config criada
}

// Para a Edge Function: receive-metrics
export interface ReceiveMetricsPayload {
    site_id: string;
    optimization_token: string;
    pageviews: number;
    impressions?: number;
    clicks?: number;    
    revenue?: number;   
    timestamp?: string; 
    custom_data?: Record<string, any>;
}
export interface ReceiveMetricsResponse {
    status: 'success' | 'error'; // 'status' é usado pela EF, 'success' seria mais consistente
    success?: boolean; // Adicionar para consistência
    message?: string;
    error?: string; // Se status for 'error'
    calculated_rpm?: number;
    calculated_ctr?: number;
}

// Para a Edge Function: generate-pdf-report 
export interface ReportFiltersForPdf { 
  dateRange: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom' | 'today' | 'yesterday';
  startDate?: string;
  endDate?: string;
  siteId?: string;
  metric: 'revenue' | 'pageviews' | 'ctr' | 'rpm' | 'optimization_score';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  comparison: boolean;
}

export interface AnalyticsDataForPdf { 
  id: string; site_id: string; site_url: string; date: string;
  pageviews: number; revenue: number; rpm: number; ctr: number;
  impressions: number; clicks: number; optimization_score?: number;
  created_at: string; confidence_level?: number; revenue_potential?: number;
  niches_detected?: string[]; seasonality_factor?: number;
}

export interface ReportSummaryForPdf { 
  totalRevenue: number; totalPageviews: number; averageRpm: number; averageCtr: number;
  totalClicks: number; totalImpressions: number; averageOptimizationScore: number;
  periodComparison: { revenueChange: number; pageviewsChange: number; rpmChange: number; ctrChange: number; optimizationChange: number; };
  topPerformingSites: Array<{ site_url: string; revenue: number; pageviews: number; rpm: number; optimization_score: number; }>;
  insights: string[];
  recommendations: Array<{ type: 'revenue' | 'performance' | 'optimization'; title: string; description: string; impact: 'high' | 'medium' | 'low'; action: string; }>;
}

export interface ChartDataPointForPdf { 
  date: string; value: number; comparison?: number; label?: string;
}
export interface GeneratePdfReportPayload {
  analyticsData: AnalyticsDataForPdf[];
  reportSummary: ReportSummaryForPdf | null;
  chartData: ChartDataPointForPdf[];
  filters: ReportFiltersForPdf;
  userId: string; 
  generatedAt: string; 
}

export interface GeneratePdfReportResponse {
  success: boolean;
  message?: string;
  url?: string; 
}

// Outras interfaces que podem ser úteis
export interface TrialStatusData { // Já definida em useFluxData, mas pode ser global
  plan: string;
  subscription_status: string;
  trial_active: boolean;
  trial_expired: boolean;
  days_remaining: number;
  hours_remaining: number;
  trial_end_date?: string | null; // Ajustado para permitir null
  trial_start_date?: string | null; // Ajustado
  company?: string;
  user_id: string;
  checked_at: string;
}

// Para TaskActionsPayload usado em OptimizationTask e flux-optimizer-engine EF
export interface TaskActionsPayload {
    optimizations: SelectedOptimizationConfig[]; // Reusa SelectedOptimizationConfig
    analysis_data?: SiteAnalysisDataForOptimizer | null;
}
