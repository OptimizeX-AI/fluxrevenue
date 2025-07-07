// src/hooks/useFluxData.ts - ENTERPRISE GRADE DATA MANAGEMENT CORRIGIDO

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// === INTERFACES ENTERPRISE (mantidas) ===
interface Site {
  id: string;
  url: string;
  client_id: string;
  name?: string;
  category?: string;
  monthly_pageviews?: number | null;
  current_rpm?: number | null;
  target_rpm?: number | null;
  script_installed?: boolean;
  adsense_id?: string | null;
  optimization_enabled?: boolean;
  created_at: string;
  updated_at?: string;
}

interface Analysis {
  id: string;
  site_id: string;
  client_id: string;
  site_url?: string;
  created_at: string;
  revenue_data?: any;
  total_revenue?: number; // ✅ CORREÇÃO: usar total_revenue do schema
  optimization_score?: number;
  confidence_level?: number;
  status: 'completed' | 'processing' | 'failed';
  csv_data?: string;
  analysis_results?: any;
  niches_detected?: string[];
  seasonality_factor?: number;
}

interface MetricsData {
  id: string;
  site_id: string;
  client_id: string;
  pageviews: number;
  revenue: number;
  rpm: number;
  ctr: number;
  impressions: number;
  clicks: number;
  timestamp: string;
  created_at: string;
}

interface UserSettings {
  id: string;
  plan?: string;
  subscription_status?: string;
  trial_end?: string;
  notifications_enabled?: boolean;
  auto_optimization?: boolean;
  report_frequency?: 'daily' | 'weekly' | 'monthly';
  email_notifications?: boolean;
  sms_notifications?: boolean;
  webhook_notifications?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  timezone?: string;
  language?: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface RateLimit {
  id: string;
  user_id: string;
  key: string;
  count: number;
  date: string;
  operation: string;
  created_at: string;
  updated_at: string;
}

interface OptimizationTask {
  id: string;
  site_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  results?: any;
}

interface TrialStatusData {
  plan: string;
  trial_end?: string;
  days_left?: number;
  is_trial: boolean;
  can_upgrade: boolean;
  features_available: string[];
}

// === CACHE MANAGEMENT (mantido) ===
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class FluxCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// === SINGLETON INSTANCES ===
const fluxCache = new FluxCache();

// === UTILITY FUNCTIONS CORRIGIDAS ===
const withAbortSignal = <T>(query: any, signal?: AbortSignal): T => {
  if (signal && typeof query.abortSignal === 'function') {
    return query.abortSignal(signal);
  }
  return query;
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  if (lastError) {
    throw lastError;
  } else {
    throw new Error('Unknown error occurred during retry');
  }
};

// ✅ CORREÇÃO CRÍTICA: Session validation
const getValidSession = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError);
      throw new Error(`User error: ${userError.message}`);
    }
    if (!user) {
      console.warn('⚠️ Usuário não autenticado');
      throw new Error('No authenticated user');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Erro na sessão:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    if (!session) {
      console.warn('⚠️ Nenhuma sessão ativa');
      throw new Error('No active session');
    }

    console.log('✅ Usuário e sessão válidos:', user.email);
    return { user, session };
  } catch (error) {
    console.error('❌ getValidSession failed:', error);
    throw error;
  }
};

const extractSupabaseData = <T>(
  result: unknown,
  defaultValue: T
): T => {
  if (result && typeof result === 'object' && 'data' in result) {
    const typedResult = result as { data?: T; error?: any };
    if (typedResult.error) {
      console.warn('⚠️ Supabase query error:', typedResult.error);
      return defaultValue;
    }
    return typedResult.data ?? defaultValue;
  }
  return defaultValue;
};

const extractSettledData = <T>(
  result: PromiseSettledResult<any>,
  defaultValue: T
): T => {
  if (result.status === 'fulfilled') {
    return extractSupabaseData(result.value, defaultValue);
  } else {
    console.warn('⚠️ Promise rejected:', result.reason);
    return defaultValue;
  }
};

// === STATE MANAGEMENT ===
interface FluxState {
  metrics: MetricsData | null;
  analyses: Analysis[];
  sites: Site[];
  userSettings: UserSettings | null;
  notifications: Notification[];
  rateLimits: RateLimit[];
  optimizationTasks: OptimizationTask[];
  loading: boolean;
  error: string | null;
}

import {
  Site,
  Analysis,
  MetricsData,
  UserSettings,
  Notification,
  RateLimit,
  Site,
  Analysis,
  MetricsData,
  UserSettings,
  Notification,
  RateLimit,
  OptimizationTask,
  TrialStatusData, // Adicionada esta que estava faltando na importação anterior
  AnalyzeAdSensePayload,
  AnalyzeAdSenseResponse,
  GenerateScriptPayload,
  GenerateScriptResponse,
  CreateSitePayload,
  CreateSiteResponse
} from '../types/interfaces';

// === HOOK INTERFACE ===
interface FluxDataReturn extends FluxState {
  refreshData: () => Promise<void>;
  uploadAndAnalyze: (csvData: string, siteUrl: string) => Promise<AnalyzeAdSenseResponse>;
  generateScript: (siteId: string) => Promise<GenerateScriptResponse>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  addSite: (url: string) => Promise<void>; // Mantendo Promise<void> conforme definido anteriormente
  updateSite: (siteId: string, updates: Partial<Site>) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
}

// === MAIN HOOK ===
export function useFluxData(): FluxDataReturn {
  const { user } = useAuth();

  // ✅ Centralized state
  const [state, setState] = useState<FluxState>({
    metrics: null,
    analyses: [],
    sites: [],
    userSettings: null,
    notifications: [],
    rateLimits: [],
    optimizationTasks: [],
    loading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshInProgressRef = useRef(false);
  const subscriptionsRef = useRef<any[]>([]);

  const userId = useMemo(() => user?.id, [user]);

  const updateState = useCallback((updates: Partial<FluxState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getCacheKey = useCallback((type: string, params?: any) => {
    const baseKey = `${userId}_${type}`;
    return params ? `${baseKey}_${JSON.stringify(params)}` : baseKey;
  }, [userId]);

  // ✅ CORREÇÃO CRÍTICA: Data fetching com campos corretos do schema
  const fetchUserData = useCallback(async (signal?: AbortSignal) => {
    if (!userId) return;

    try {
      const { user: authUser, session } = await getValidSession();

      const cacheKey = getCacheKey('user_data');
      const cachedData = fluxCache.get<Partial<FluxState>>(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached user data');
        updateState(cachedData);
        return;
      }

      console.log('🔄 Fetching fresh user data for user:', authUser.email);

      // ✅ CORREÇÃO: Queries com campos corretos baseado no schema
      const [
        clientsResult,
        sitesResult, 
        analysesResult,
        notificationsResult,
        rateLimitsResult
      ] = await Promise.allSettled([
        withAbortSignal(
          supabase
            .from('clients')
            .select('id, plan, subscription_status, trial_end_date as trial_end, email, company, status')
            .eq('id', authUser.id) // ✅ CORRETO: usar 'id' na tabela clients
            .maybeSingle(),
          signal
        ),
        withAbortSignal(
          supabase
            .from('sites')
            .select('*')
            .eq('client_id', authUser.id) // ✅ CORRETO: usar 'client_id' na tabela sites
            .order('created_at', { ascending: false }),
          signal
        ),
        withAbortSignal(
          supabase
            .from('adsense_analyses')
            .select('id, created_at, optimization_score, total_revenue, status, site_id, client_id')
            .eq('client_id', authUser.id) // ✅ CORRETO: usar 'client_id' na tabela adsense_analyses
            .order('created_at', { ascending: false })
            .limit(50),
          signal
        ),
        withAbortSignal(
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', authUser.id) // ✅ CORRETO: usar 'user_id' na tabela notifications
            .order('created_at', { ascending: false })
            .limit(10),
          signal
        ),
        withAbortSignal(
          supabase
            .from('rate_limits')
            .select('*')
            .eq('user_id', authUser.id), // ✅ CORRETO: usar 'user_id' na tabela rate_limits
          signal
        )
      ]);

      // ✅ Process results
      const clientData = extractSettledData(clientsResult, null);
      const sites = extractSettledData(sitesResult, []);
      const analyses = extractSettledData(analysesResult, []);
      const notifications = extractSettledData(notificationsResult, []);
      const rateLimits = extractSettledData(rateLimitsResult, []);

      // ✅ CORREÇÃO: Buscar optimization_tasks baseado nos sites do usuário
      let optimizationTasks: OptimizationTask[] = [];
      if (sites.length > 0) {
        try {
          const siteIds = sites.map((site: Site) => site.id);
          const tasksQuery = await withAbortSignal(
            supabase
              .from('optimization_tasks')
              .select('id, created_at, status, site_id, completed_at, error_message, results')
              .in('site_id', siteIds) // ✅ CORRETO: buscar tasks dos sites do usuário
              .order('created_at', { ascending: false })
              .limit(10),
            signal
          );
          optimizationTasks = extractSupabaseData(tasksQuery, []);
        } catch (tasksError) {
          console.warn('⚠️ Could not fetch optimization tasks:', tasksError);
        }
      }

      // ✅ Fetch latest metrics if sites exist
      let metrics: MetricsData | null = null;
      if (sites.length > 0) {
        try {
          const metricsQuery = await withAbortSignal(
            supabase
              .from('metrics')
              .select('*')
              .in('site_id', sites.map((site: Site) => site.id))
              .order('timestamp', { ascending: false })
              .limit(1),
            signal
          );
          const metricsData = extractSupabaseData(metricsQuery, []);
          metrics = metricsData[0] || null;
        } catch (metricsError) {
          console.warn('⚠️ Could not fetch metrics:', metricsError);
        }
      }

      // ✅ Handle user settings from clients table
      const userSettings: UserSettings | null = clientData ? {
        id: clientData.id,
        plan: clientData.plan,
        subscription_status: clientData.subscription_status,
        trial_end: clientData.trial_end,
        notifications_enabled: true,
        auto_optimization: false,
        report_frequency: 'weekly' as const,
        email_notifications: true,
        sms_notifications: false,
        webhook_notifications: false,
        theme: 'light' as const,
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR'
      } : null;

      const newState: Partial<FluxState> = {
        sites,
        analyses,
        userSettings,
        notifications,
        rateLimits,
        optimizationTasks,
        metrics,
        error: null
      };

      // Update state and cache
      updateState(newState);
      fluxCache.set(cacheKey, newState, 3 * 60 * 1000); // 3 minutes TTL

      console.log('✅ User data fetched successfully:', {
        userSettings: !!userSettings,
        sites: sites.length,
        analyses: analyses.length,
        notifications: notifications.length,
        rateLimits: rateLimits.length,
        optimizationTasks: optimizationTasks.length,
        metrics: !!metrics
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🔄 Data fetch aborted');
        return;
      }
      console.error('❌ Error fetching user data:', error);
      updateState({ error: error.message });
    }
  }, [userId, updateState, getCacheKey]);

  // ✅ Real-time subscriptions com campos corretos
  const setupSubscriptions = useCallback(async () => {
    if (!userId) return;

    subscriptionsRef.current.forEach(sub => sub?.unsubscribe());
    subscriptionsRef.current = [];

    try {
      console.log('🔄 Setting up real-time subscriptions...');

      // ✅ CORREÇÃO: Subscriptions com campos corretos
      const sitesChannel = supabase
        .channel(`flux_sites_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sites',
          filter: `client_id=eq.${userId}` // ✅ CORRETO
        }, (payload) => {
          console.log('🌐 Real-time site update:', payload);
          fluxCache.invalidate('sites');
          refreshData();
        })
        .subscribe();

      const analysesChannel = supabase
        .channel(`flux_analyses_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'adsense_analyses',
          filter: `client_id=eq.${userId}` // ✅ CORRETO
        }, (payload) => {
          console.log('📈 Real-time analysis update:', payload);
          fluxCache.invalidate('analyses');
          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              analyses: [payload.new as Analysis, ...prev.analyses]
            }));
          }
        })
        .subscribe();

      const notificationsChannel = supabase
        .channel(`flux_notifications_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}` // ✅ CORRETO
        }, (payload) => {
          console.log('🔔 Real-time notification update:', payload);
          fluxCache.invalidate('notifications');
          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              notifications: [payload.new as Notification, ...prev.notifications]
            }));
          }
        })
        .subscribe();

      subscriptionsRef.current = [sitesChannel, analysesChannel, notificationsChannel];
      console.log('✅ Real-time subscriptions setup completed');

    } catch (error) {
      console.error('❌ Error setting up subscriptions:', error);
    }
  }, [userId]);

  // ✅ Main refresh function (mantida)
  const refreshData = useCallback(async (): Promise<void> => {
    if (!userId) return;

    if (refreshInProgressRef.current) {
      console.log('🔄 Refresh already in progress, skipping...');
      return;
    }

    refreshInProgressRef.current = true;
    updateState({ loading: true, error: null });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      await withRetry(
        () => fetchUserData(abortControllerRef.current?.signal),
        3,
        1000
      );
    } catch (error: any) {
      console.error('❌ RefreshData failed after retries:', error);
      updateState({ error: error.message });
    } finally {
      updateState({ loading: false });
      refreshInProgressRef.current = false;
    }
  }, [userId, fetchUserData, updateState]);

  // ✅ Enhanced methods com autenticação correta (mantidos com correções de campo)
  const uploadAndAnalyze = useCallback(async (csvData: string, siteUrl: string): Promise<AnalyzeAdSenseResponse> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { user: authUser } = await getValidSession();
      console.log('🔄 Uploading CSV data for analysis:', {
        siteUrl,
        dataLength: csvData.length,
        userId: authUser.id
      });

      const payload: AnalyzeAdSensePayload = {
        csv_data: csvData,
        site_url: siteUrl,
        user_id: authUser.id,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke<AnalyzeAdSenseResponse>('analyze-adsense', {
        body: payload
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from analyze-adsense function');


      console.log('✅ Analysis completed successfully:', data);
      fluxCache.invalidate('analyses');
      fluxCache.invalidate('user_data');
      await refreshData();
      return data;
    } catch (error: any) {
      console.error('❌ Upload and analyze error:', error);
      // Retornar um objeto de erro padronizado se desejado, ou relançar
      return { success: false, message: error.message || 'Error processing CSV analysis', data: error };
    }
  }, [userId, refreshData]);

  const generateScript = useCallback(async (siteId: string): Promise<GenerateScriptResponse> => {
    if (!userId) {
      // Lançar um erro ou retornar uma resposta de erro padronizada
      const errorResponse: GenerateScriptResponse = { script: '', success: false, message: 'User not authenticated' };
      // throw new Error('User not authenticated'); // Alternativa
      return errorResponse;
    }

    try {
      const { user: authUser } = await getValidSession();
      const cacheKey = getCacheKey('script', siteId);
      const cachedResponse = fluxCache.get<GenerateScriptResponse>(cacheKey);
      
      if (cachedResponse && cachedResponse.success) {
        console.log('📦 Using cached optimization script for site:', siteId);
        return cachedResponse;
      }

      console.log('🔄 Generating new optimization script for site:', siteId);

      const payload: GenerateScriptPayload = {
        site_id: siteId,
        user_id: authUser.id,
        action: 'generate_script',
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke<GenerateScriptResponse>('flux-optimizer-engine', {
        body: payload
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from flux-optimizer-engine function');


      if (data.success) {
        fluxCache.set(cacheKey, data, 60 * 60 * 1000); // Cache a resposta completa
        console.log('✅ Optimization script generated successfully');
      } else {
        console.warn('⚠️ Script generation failed:', data.message);
      }
      return data;
    } catch (error: any) {
      console.error('❌ Script generation error:', error);
      return { script: '', success: false, message: error.message || 'Error generating optimization script' };
    }
  }, [userId, getCacheKey]);

  const updateUserSettings = useCallback(async (settings: Partial<UserSettings>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { user: authUser } = await getValidSession();
      
      // ✅ CORREÇÃO: Atualizar na tabela clients usando 'id'
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id) // ✅ CORRETO: usar 'id' na tabela clients
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const newUserSettings: UserSettings = {
          id: data.id,
          plan: data.plan,
          subscription_status: data.subscription_status,
          trial_end: data.trial_end_date,
          ...settings
        };
        updateState({ userSettings: newUserSettings });
      }

      fluxCache.invalidate('user_data');
      console.log('✅ User settings updated successfully');
    } catch (error: any) {
      console.error('❌ Update user settings error:', error);
      throw new Error(error.message || 'Error updating user settings');
    }
  }, [userId, updateState]);

  const addSite = useCallback(async (url: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { user: authUser } = await getValidSession();
      console.log('🔄 Adding new site:', url);

      const payload: CreateSitePayload = {
        url,
        user_id: authUser.id,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke<CreateSiteResponse>('create-site', {
        body: payload
      });

      if (error) throw error;
      // Opcional: verificar data.success se a interface CreateSiteResponse incluir
      if (data && !data.success && data.message) {
        console.warn(`⚠️ Add site warning: ${data.message}`);
        // Poderia lançar um erro aqui se !data.success for considerado uma falha crítica
        // throw new Error(data.message || 'Failed to add site with warning');
      }


      fluxCache.invalidate('sites');
      fluxCache.invalidate('user_data');
      await refreshData();
      console.log('✅ Site add attempt processed. Response:', data);
    } catch (error: any) {
      console.error('❌ Add site error:', error);
      // Não relançar o erro aqui mantém o tipo de retorno Promise<void>
      // throw new Error(error.message || 'Error adding site');
    }
  }, [userId, refreshData]);

  const updateSite = useCallback(async (siteId: string, updates: Partial<Site>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { user: authUser } = await getValidSession();
      
      // ✅ CORREÇÃO: Atualizar site usando 'client_id'
      const { error } = await supabase
        .from('sites')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', siteId)
        .eq('client_id', authUser.id); // ✅ CORRETO: usar 'client_id' na tabela sites

      if (error) throw error;

      fluxCache.invalidate('sites');
      fluxCache.invalidate('user_data');
      await refreshData();
      console.log('✅ Site updated successfully');
    } catch (error: any) {
      console.error('❌ Update site error:', error);
      throw new Error(error.message || 'Error updating site');
    }
  }, [userId, refreshData]);

  // ✅ Cache management (mantidos)
  const clearCache = useCallback(() => {
    fluxCache.invalidate();
    console.log('🗑️ All cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    return fluxCache.getStats();
  }, []);

  // ✅ Setup effect
  useEffect(() => {
    if (userId) {
      console.log('👤 User authenticated, initializing Flux Data...');
      refreshInProgressRef.current = false;
      setupSubscriptions();
      const initTimer = setTimeout(() => {
        refreshData();
      }, 500);

      return () => {
        clearTimeout(initTimer);
        subscriptionsRef.current.forEach(sub => sub?.unsubscribe());
        subscriptionsRef.current = [];
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [userId, setupSubscriptions, refreshData]);

  // ✅ Cleanup effect
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up Flux Data hook...');
      subscriptionsRef.current.forEach(sub => sub?.unsubscribe());
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refreshData,
    uploadAndAnalyze,
    generateScript,
    updateUserSettings,
    addSite,
    updateSite,
    clearCache,
    getCacheStats
  };
}

// === SPECIALIZED HOOKS CORRIGIDOS ===
export function useTrialStatus() {
  const { user } = useAuth();
  const [data, setData] = useState<TrialStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { user: authUser } = await getValidSession();
      
      // ✅ CORREÇÃO: Buscar dados do trial na tabela clients usando 'id'
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('plan, subscription_status, trial_end_date, trial_start_date')
        .eq('id', authUser.id) // ✅ CORRETO
        .maybeSingle();

      if (clientError) throw clientError;

      if (clientData) {
        const trialEnd = clientData.trial_end_date ? new Date(clientData.trial_end_date) : null;
        const now = new Date();
        const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

        const trialStatus: TrialStatusData = {
          plan: clientData.plan || 'free',
          trial_end: clientData.trial_end_date,
          days_left: daysLeft,
          is_trial: clientData.plan === 'trial',
          can_upgrade: true,
          features_available: ['basic_features']
        };

        setData(trialStatus);
        console.log('✅ Trial status loaded:', trialStatus);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error fetching trial status:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      const timer = setTimeout(fetchStatus, 300);
      return () => clearTimeout(timer);
    }
  }, [user?.id, fetchStatus]);

  return { data, loading, error };
}

export function useMetrics(siteId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user?.id || !siteId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('metrics')
        .select('*')
        .eq('site_id', siteId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (metricsError) throw metricsError;

      setData(metricsData?.[0] as MetricsData || null);
      console.log('✅ Metrics loaded for site:', siteId);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, siteId]);

  useEffect(() => {
    if (user?.id && siteId) {
      const timer = setTimeout(fetchMetrics, 200);
      return () => clearTimeout(timer);
    }
  }, [user?.id, siteId, fetchMetrics]);

  return { data, loading, error };
}

export function useAnalyzeAdSense() {
  const { uploadAndAnalyze } = useFluxData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCSV = useCallback(async (csvData: string, siteUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await uploadAndAnalyze(csvData, siteUrl);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploadAndAnalyze]);

  return {
    data,
    loading,
    error,
    analyzeCSV,
    analyze: uploadAndAnalyze
  };
}

export default useFluxData;

