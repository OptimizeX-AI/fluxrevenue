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