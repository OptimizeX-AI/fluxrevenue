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
  site_url: string;
  user_id: string; // Embora o user_id do JWT seja a fonte da verdade no backend
  timestamp: string;
}

export interface AnalyzeAdSenseResponse {
  success: boolean;
  message?: string;
  analysisId?: string; // ID da análise criada
  // Outros campos relevantes da resposta podem ser adicionados aqui
  data?: any; // Para flexibilidade, caso a resposta seja variada
}

// Para a Edge Function: flux-optimizer-engine (ação: generate_script)
export interface GenerateScriptPayload {
  site_id: string;
  user_id: string; // Validação via JWT no backend é crucial
  action: 'generate_script';
  timestamp: string;
}

export interface GenerateScriptResponse {
  script: string;
  message?: string;
  success: boolean;
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
