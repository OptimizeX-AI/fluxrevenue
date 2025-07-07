// src/hooks/useFluxData.ts - ENTERPRISE GRADE DATA MANAGEMENT CORRIGIDO

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  Site,
  Analysis, // Usado para o estado 'analyses'
  MetricsData,
  UserSettings as UserPreferencesData, // Renomeado para evitar conflito com UserSettings do AuthContext
  Notification,
  RateLimit,
  OptimizationTask,
  TrialStatusData,
  AnalyzeAdSensePayload,
  AnalyzeAdSenseResponse,
  GenerateScriptPayload,
  GenerateScriptResponse,
  CreateSitePayload,
  CreateSiteResponse,
  InvokeFluxOptimizerEnginePayload,
  InvokeFluxOptimizerEngineResponse,
  GeneratePdfReportPayload,
  GeneratePdfReportResponse,
  UserProfileData // Para dados da tabela 'clients'
} from '../types/interfaces';


// Interface para o feed de atividades do Dashboard
export interface RecentActivity { // Exportar se o Dashboard for usar diretamente
  id: string;
  type: 'analysis' | 'optimization' | 'site_added';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'processing' | 'failed' | 'completed' | 'pending'; // Adicionado completed/pending
  metadata?: any;
  site_url?: string;
}

// === CACHE MANAGEMENT (mantido) ===
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
class FluxCache {
  private cache = new Map<string, CacheEntry<any>>();
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { this.cache.set(key, { data, timestamp: Date.now(), ttl }); }
  get<T>(key: string): T | null { const entry = this.cache.get(key); if (!entry || (Date.now() - entry.timestamp > entry.ttl)) { if (entry) this.cache.delete(key); return null; } return entry.data; }
  invalidate(pattern?: string): void { if (!pattern) { this.cache.clear(); return; } const keys = Array.from(this.cache.keys()); keys.forEach(key => { if (key.includes(pattern)) this.cache.delete(key); }); }
  getStats = () => ({ size: this.cache.size, keys: Array.from(this.cache.keys()) });
}
const fluxCache = new FluxCache();

// === UTILITY FUNCTIONS (mantidas) ===
const getValidSession = async () => { /* ... (sem mudanças) ... */ try { const { data: { user }, error: userError } = await supabase.auth.getUser(); if (userError) { console.error('❌ Erro ao verificar usuário:', userError); throw new Error(`User error: ${userError.message}`); } if (!user) { console.warn('⚠️ Usuário não autenticado'); throw new Error('No authenticated user'); } const { data: { session }, error: sessionError } = await supabase.auth.getSession(); if (sessionError) { console.error('❌ Erro na sessão:', sessionError); throw new Error(`Session error: ${sessionError.message}`); } if (!session) { console.warn('⚠️ Nenhuma sessão ativa'); throw new Error('No active session'); } console.log('✅ Usuário e sessão válidos:', user.email); return { user, session }; } catch (error) { console.error('❌ getValidSession failed:', error); throw error; } };
const extractSupabaseData = <T>(result: unknown, defaultValue: T): T => { /* ... (sem mudanças) ... */ if (result && typeof result === 'object' && 'data' in result) { const typedResult = result as { data?: T; error?: any }; if (typedResult.error) { console.warn('⚠️ Supabase query error:', typedResult.error); return defaultValue; } return typedResult.data ?? defaultValue; } return defaultValue; };
const extractSettledData = <T>(result: PromiseSettledResult<any>, defaultValue: T): T => { /* ... (sem mudanças) ... */  if (result.status === 'fulfilled') { return extractSupabaseData(result.value, defaultValue); } else { console.warn('⚠️ Promise rejected:', result.reason); return defaultValue; } };

// === STATE MANAGEMENT ===
interface FluxState {
  metrics: MetricsData | null;
  analyses: Analysis[]; // Vem de adsense_analyses
  sites: Site[];
  userProfile: UserProfileData | null; // Renomeado de userSettings para clareza (vem de 'clients')
  currentUserPreferences: UserPreferencesData | null; // Vem de 'user_settings'
  notifications: Notification[];
  rateLimits: RateLimit[];
  optimizationTasks: OptimizationTask[];
  recentActivityFeed: RecentActivity[];
  loading: boolean;
  error: string | null;
}

// === HOOK INTERFACE ===
interface FluxDataReturn extends FluxState {
  refreshData: () => Promise<void>;
  generateScript: (siteId: string) => Promise<GenerateScriptResponse>;
  // updateUserSettings foi substituído por updateUserPreferences
  addSite: (url: string) => Promise<void>;
  updateSite: (siteId: string, updates: Partial<Site>) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
  invokeAnalyzeAdSense: (payload: AnalyzeAdSensePayload) => Promise<AnalyzeAdSenseResponse>;
  invokeFluxOptimizerEngine: (payload: InvokeFluxOptimizerEnginePayload) => Promise<InvokeFluxOptimizerEngineResponse>;
  invokeGeneratePdfReport: (payload: GeneratePdfReportPayload) => Promise<GeneratePdfReportResponse>;
  updateUserProfile: (data: Partial<UserProfileData>) => Promise<{ success: boolean; error?: any }>;
  updateUserPreferences: (data: Partial<UserPreferencesData>) => Promise<{ success: boolean; error?: any }>;
  fetchRecentActivityFeed: () => Promise<void>; // Adicionado para o Dashboard
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

// === MAIN HOOK ===
export function useFluxData(): FluxDataReturn {
  const { user } = useAuth();

  const [state, setState] = useState<FluxState>({
    metrics: null,
    analyses: [],
    sites: [],
    userProfile: null, // Anteriormente userSettings
    currentUserPreferences: null, // Novo para user_settings
    notifications: [],
    rateLimits: [],
    optimizationTasks: [],
    recentActivityFeed: [], // Novo
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

  const fetchUserData = useCallback(async (signal?: AbortSignal) => {
    if (!userId) return;
    try {
      const { user: authUser } = await getValidSession();
      const cacheKey = getCacheKey('user_data_full'); // Chave de cache mais específica
      const cached = fluxCache.get<Partial<FluxState>>(cacheKey);
      if (cached) { updateState(cached); return; }

      console.log('🔄 Fetching full user data for user:', authUser.email);

      const [
        profileResult,
        preferencesResult, // Novo
        sitesResult, 
        analysesResult,
        notificationsResult,
        rateLimitsResult
      ] = await Promise.allSettled([
        supabase.from('clients').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('user_settings').select('*').eq('client_id', authUser.id).maybeSingle(), // Busca user_settings
        supabase.from('sites').select('*').eq('client_id', authUser.id).order('created_at', { ascending: false }),
        supabase.from('adsense_analyses').select('id, created_at, optimization_score, total_revenue, status, site_id, client_id').eq('client_id', authUser.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('rate_limits').select('*').eq('user_id', authUser.id),
      ]);

      const userProfile = extractSettledData(profileResult, null) as UserProfileData | null;
      const currentUserPreferences = extractSettledData(preferencesResult, null) as UserPreferencesData | null;
      const sites = extractSettledData(sitesResult, []);
      const analyses = extractSettledData(analysesResult, []);
      const notifications = extractSettledData(notificationsResult, []);
      const rateLimits = extractSettledData(rateLimitsResult, []);

      let optimizationTasks: OptimizationTask[] = [];
      if (sites.length > 0) { /* ... (lógica de buscar optimization_tasks) ... */ try { const siteIds = sites.map((s: Site) => s.id); const tasksQuery = await supabase .from('optimization_tasks') .select('id, created_at, status, site_id, completed_at, error_message, results') .in('site_id', siteIds) .order('created_at', { ascending: false }) .limit(10); optimizationTasks = extractSupabaseData(tasksQuery, []); } catch (tasksError) { console.warn('⚠️ Could not fetch optimization tasks:', tasksError); } }
      let metrics: MetricsData | null = null;
      if (sites.length > 0) { /* ... (lógica de buscar metrics) ... */ try { const metricsQuery = await supabase .from('metrics') .select('*') .in('site_id', sites.map((s: Site) => s.id)) .order('timestamp', { ascending: false }) .limit(1); const metricsData = extractSupabaseData(metricsQuery, []); metrics = metricsData[0] || null; } catch (metricsError) { console.warn('⚠️ Could not fetch metrics:', metricsError); } }

      const newState: Partial<FluxState> = { sites, analyses, userProfile, currentUserPreferences, notifications, rateLimits, optimizationTasks, metrics, error: null };
      updateState(newState);
      fluxCache.set(cacheKey, newState, 3 * 60 * 1000);
      console.log('✅ Full user data fetched successfully');
    } catch (error: any) { /* ... (tratamento de erro) ... */ if (error.name === 'AbortError') { console.log('🔄 Data fetch aborted'); return; } console.error('❌ Error fetching user data:', error); updateState({ error: error.message });}
  }, [userId, updateState, getCacheKey]);

  const fetchRecentActivityFeedInternal = useCallback(async (): Promise<RecentActivity[]> => {
    if (!userId) return [];
    try {
      const { data: analysesData } = await supabase
        .from('adsense_analyses')
        .select('id, created_at, status, site_id, sites ( url )') // Adicionado join
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: tasksData } = await supabase
        .from('optimization_tasks')
        .select('id, created_at, status, site_id, sites ( url )') // Adicionado join
        .in('site_id', state.sites.map(s => s.id)) // Usar sites do estado para pegar IDs
        .order('created_at', { ascending: false })
        .limit(3);

      const activities: RecentActivity[] = [];
      analysesData?.forEach((a: any) => activities.push({ id: a.id, type: 'analysis', title: `Análise ${a.sites?.url || a.site_id}`, description: `Status: ${a.status}`, timestamp: a.created_at, status: a.status, site_url: a.sites?.url }));
      tasksData?.forEach((t: any) => activities.push({ id: t.id, type: 'optimization', title: `Otimização ${t.sites?.url || t.site_id}`, description: `Status: ${t.status}`, timestamp: t.created_at, status: t.status, site_url: t.sites?.url }));

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities.slice(0, 8);
    } catch (error) {
      console.error('Error fetching recent activity feed:', error);
      return [];
    }
  }, [userId, state.sites, supabase]); // supabase como dependência

  const fetchRecentActivityFeed = useCallback(async () => {
    const feed = await fetchRecentActivityFeedInternal();
    updateState({ recentActivityFeed: feed });
  }, [fetchRecentActivityFeedInternal, updateState]);


  const setupSubscriptions = useCallback(async () => { /* ... (sem mudanças, mas considerar subs para user_settings) ... */ if (!userId) return; subscriptionsRef.current.forEach(sub => sub?.unsubscribe()); subscriptionsRef.current = []; try { console.log('🔄 Setting up real-time subscriptions...'); const sitesChannel = supabase .channel(`flux_sites_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'sites', filter: `client_id=eq.${userId}` }, (payload) => { console.log('🌐 Real-time site update:', payload); fluxCache.invalidate('sites'); refreshData(); }) .subscribe(); const analysesChannel = supabase .channel(`flux_analyses_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'adsense_analyses', filter: `client_id=eq.${userId}` }, (payload) => { console.log('📈 Real-time analysis update:', payload); fluxCache.invalidate('analyses'); if (payload.eventType === 'INSERT') { setState(prev => ({ ...prev, analyses: [payload.new as Analysis, ...prev.analyses] })); } else { refreshData(); /* Para updates/deletes */ } }) .subscribe(); const notificationsChannel = supabase .channel(`flux_notifications_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => { console.log('🔔 Real-time notification update:', payload); fluxCache.invalidate('notifications'); if (payload.eventType === 'INSERT') { setState(prev => ({ ...prev, notifications: [payload.new as Notification, ...prev.notifications] })); } else { refreshData(); } }) .subscribe(); const optimizationTasksChannel = supabase .channel(`flux_optimization_tasks_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'optimization_tasks' /* filter por site_id indiretamente */ }, async (payload) => { console.log('⚡ Real-time optimization_task update:', payload); await fetchRecentActivityFeed(); // Atualiza feed de atividades await refreshData(); // Atualiza lista de tasks e outras coisas }) .subscribe(); subscriptionsRef.current = [sitesChannel, analysesChannel, notificationsChannel, optimizationTasksChannel]; console.log('✅ Real-time subscriptions setup completed'); } catch (error) { console.error('❌ Error setting up subscriptions:', error); } }, [userId, refreshData, fetchRecentActivityFeed]);


  const refreshDataAndActivity = useCallback(async () => {
    await refreshData(); // refreshData já chama fetchUserData
    await fetchRecentActivityFeed();
  }, [refreshData, fetchRecentActivityFeed]);

  useEffect(() => {
    if (userId) {
      console.log('👤 User authenticated, initializing Flux Data...');
      refreshInProgressRef.current = false;
      setupSubscriptions();
      const initTimer = setTimeout(() => {
        refreshDataAndActivity(); // Chama a combinada
      }, 500);
      return () => { clearTimeout(initTimer); subscriptionsRef.current.forEach(sub => sub?.unsubscribe()); subscriptionsRef.current = []; if (abortControllerRef.current) { abortControllerRef.current.abort(); }};
    }
  }, [userId, setupSubscriptions, refreshDataAndActivity]);


  // Funções de invocação de EF (já implementadas anteriormente, apenas garantindo que usem userId do hook)
  const invokeAnalyzeAdSenseImpl = useCallback(async (payload: AnalyzeAdSensePayload): Promise<AnalyzeAdSenseResponse> => { /* ... (usar userId do hook, não do payload diretamente para segurança) ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, client_id: userId }; try { const { data, error } = await supabase.functions.invoke<AnalyzeAdSenseResponse>('analyze-adsense', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from analyze-adsense'); await refreshDataAndActivity(); return data; } catch (e:any) { return { success:false, message: e.message };} }, [userId, supabase, refreshDataAndActivity]);
  const invokeFluxOptimizerEngineImpl = useCallback(async (payload: InvokeFluxOptimizerEnginePayload): Promise<InvokeFluxOptimizerEngineResponse> => { /* ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, user_id: userId }; try { const { data, error } = await supabase.functions.invoke<InvokeFluxOptimizerEngineResponse>('flux-optimizer-engine', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from flux-optimizer-engine'); await refreshDataAndActivity(); return data; } catch (e:any) { return { success:false, message: e.message };} }, [userId, supabase, refreshDataAndActivity]);
  const invokeGeneratePdfReportImpl = useCallback(async (payload: GeneratePdfReportPayload): Promise<GeneratePdfReportResponse> => { /* ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, userId: userId }; try { const { data, error } = await supabase.functions.invoke<GeneratePdfReportResponse>('generate-pdf-report', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from generate-pdf-report'); return data; } catch (e:any) { return { success:false, message: e.message };} }, [userId, supabase]);

  // Novas funções para Profile e Preferences
  const updateUserProfileImpl = useCallback(async (profileData: Partial<UserProfileData>): Promise<{ success: boolean; error?: any }> => {
    if (!userId) return { success: false, error: new Error('User not authenticated') };
    try {
      const { error } = await supabase.from('clients').update(profileData).eq('id', userId);
      if (error) throw error;
      await refreshData(); // Atualiza o userProfile no estado do hook
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  }, [userId, supabase, refreshData]);

  const updateUserPreferencesImpl = useCallback(async (preferencesData: Partial<UserPreferencesData>): Promise<{ success: boolean; error?: any }> => {
    if (!userId) return { success: false, error: new Error('User not authenticated') };
    try {
      const upsertData = { ...preferencesData, client_id: userId };
      const { error } = await supabase.from('user_settings').upsert(upsertData, { onConflict: 'client_id' });
      if (error) throw error;
      await refreshData(); // Atualiza currentUserPreferences no estado do hook
      return { success: true };
    } catch (error: any) {
      return { success: false, error };
    }
  }, [userId, supabase, refreshData]);

  // Funções para Notificações (para Navbar)
  const markNotificationReadImpl = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId);
      await refreshData(); // Para atualizar a lista de notificações
    } catch (error) { console.error("Error marking notification read:", error); }
  }, [userId, supabase, refreshData]);

  const markAllNotificationsReadImpl = useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      await refreshData();
    } catch (error) { console.error("Error marking all notifications read:", error); }
  }, [userId, supabase, refreshData]);


  // Retorno do Hook
  return {
    ...state,
    refreshData: refreshDataAndActivity, // Usar a combinada
    generateScript: useCallback(async (siteId: string): Promise<GenerateScriptResponse> => { /* ... (implementação de generateScript, similar a invokeFluxOptimizerEngine mas com payload mais simples) ... */ if (!userId) return { script: '', success: false, message: 'User not authenticated' }; const payload: GenerateScriptPayload = { site_id: siteId, user_id: userId, action: 'generate_script', timestamp: new Date().toISOString() }; try {const {data, error} = await supabase.functions.invoke<GenerateScriptResponse>('flux-optimizer-engine', {body: payload}); if(error) throw error; if(!data) throw new Error('No data from EF'); return data;} catch(e:any){ return {script:'', success:false, message:e.message};} }, [userId, supabase]),
    addSite: useCallback(async (url: string) => { /* ... (implementação de addSite) ... */ if (!userId) return; const payload: CreateSitePayload = { url, user_id: userId, timestamp: new Date().toISOString()}; try {await supabase.functions.invoke<CreateSiteResponse>('create-site', {body: payload}); await refreshDataAndActivity();} catch(e){console.error(e);} }, [userId, supabase, refreshDataAndActivity]),
    updateSite: useCallback(async (siteId: string, updates: Partial<Site>) => { /* ... (implementação de updateSite) ... */ if (!userId) return; try {await supabase.from('sites').update(updates).eq('id', siteId).eq('client_id', userId); await refreshDataAndActivity();} catch(e){console.error(e);}}, [userId, supabase, refreshDataAndActivity]),
    clearCache: useCallback(() => fluxCache.invalidate(), []),
    getCacheStats: useCallback(() => fluxCache.getStats(), []),
    invokeAnalyzeAdSense: invokeAnalyzeAdSenseImpl,
    invokeFluxOptimizerEngine: invokeFluxOptimizerEngineImpl,
    invokeGeneratePdfReport: invokeGeneratePdfReportImpl,
    updateUserProfile: updateUserProfileImpl,
    updateUserPreferences: updateUserPreferencesImpl,
    fetchRecentActivityFeed, // Expor para o Dashboard poder chamar se quiser um refresh manual só do feed
    markNotificationRead: markNotificationReadImpl,
    markAllNotificationsRead: markAllNotificationsReadImpl,
    // uploadAndAnalyze e updateUserSettings foram efetivamente substituídos/refatorados
  };
}

// Hooks especializados (useTrialStatus, useMetrics, useAnalyzeAdSense) permanecem como estavam,
// mas useAnalyzeAdSense agora usaria invokeAnalyzeAdSense se fosse refatorado para usar o hook principal.
// Por enquanto, uploadAndAnalyze ainda existe no retorno do useFluxData e é usado por useAnalyzeAdSense.
// Vamos remover uploadAndAnalyze do retorno e ajustar useAnalyzeAdSense para usar invokeAnalyzeAdSense.

export function useTrialStatus() { /* ... (sem mudanças) ... */ const { user } = useAuth(); const [data, setData] = useState<TrialStatusData | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const fetchStatus = useCallback(async () => { if (!user?.id) return; setLoading(true); setError(null); try { const { user: authUser } = await getValidSession(); const { data: clientData, error: clientError } = await supabase .from('clients') .select('plan, subscription_status, trial_end_date, trial_start_date') .eq('id', authUser.id) .maybeSingle(); if (clientError) throw clientError; if (clientData) { const trialEnd = clientData.trial_end_date ? new Date(clientData.trial_end_date) : null; const now = new Date(); const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0; const trialStatus: TrialStatusData = { plan: clientData.plan || 'free', trial_end: clientData.trial_end_date, days_left: daysLeft, is_trial: clientData.plan === 'trial', can_upgrade: true, features_available: ['basic_features'] }; setData(trialStatus); console.log('✅ Trial status loaded:', trialStatus); } } catch (err: any) { setError(err.message); console.error('❌ Error fetching trial status:', err); } finally { setLoading(false); } }, [user?.id]); useEffect(() => { if (user?.id) { const timer = setTimeout(fetchStatus, 300); return () => clearTimeout(timer); } }, [user?.id, fetchStatus]); return { data, loading, error }; }
export function useMetrics(siteId: string) { /* ... (sem mudanças) ... */ const { user } = useAuth(); const [data, setData] = useState<MetricsData | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const fetchMetrics = useCallback(async () => { if (!user?.id || !siteId) return; setLoading(true); setError(null); try { const { data: metricsData, error: metricsError } = await supabase .from('metrics') .select('*') .eq('site_id', siteId) .order('timestamp', { ascending: false }) .limit(1); if (metricsError) throw metricsError; setData(metricsData?.[0] as MetricsData || null); console.log('✅ Metrics loaded for site:', siteId); } catch (err: any) { setError(err.message); console.error('❌ Error fetching metrics:', err); } finally { setLoading(false); } }, [user?.id, siteId]); useEffect(() => { if (user?.id && siteId) { const timer = setTimeout(fetchMetrics, 200); return () => clearTimeout(timer); } }, [user?.id, siteId, fetchMetrics]); return { data, loading, error }; }

// Ajustar useAnalyzeAdSense para usar a nova função invokeAnalyzeAdSense
export function useAnalyzeAdSense() {
  const { invokeAnalyzeAdSense, refreshData } = useFluxData(); // Usar invokeAnalyzeAdSense
  const [data, setData] = useState<AnalyzeAdSenseResponse | null>(null); // Tipar com AnalyzeAdSenseResponse
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCSV = useCallback(async (csvData: string, siteUrl: string, siteId: string, clientId: string, validationInfo?: any) => {
    setLoading(true);
    setError(null);
    try {
      const payload: AnalyzeAdSensePayload = {
        csv_data: csvData,
        site_url: siteUrl,
        site_id: siteId,
        client_id: clientId,
        validation_info: validationInfo,
        timestamp: new Date().toISOString()
      };
      const result = await invokeAnalyzeAdSense(payload); // Chamar a função do hook
      setData(result);
      if (result.success) {
        await refreshData(); // Para atualizar a lista de 'analyses' global se necessário
      } else {
        setError(result.message || 'Análise falhou');
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      // Retornar uma resposta de erro padronizada se invokeAnalyzeAdSense não o fizer
      return { success: false, message: err.message } as AnalyzeAdSenseResponse;
    } finally {
      setLoading(false);
    }
  }, [invokeAnalyzeAdSense, refreshData]);

  return {
    data,
    loading,
    error,
    analyzeCSV, // Manter analyzeCSV se for a API preferida pelo componente
    // analyze: invokeAnalyzeAdSense // Poderia expor diretamente também, mas analyzeCSV é mais específico
  };
}

export default useFluxData;
