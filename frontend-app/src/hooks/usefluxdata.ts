// src/hooks/useFluxData.ts - ENTERPRISE GRADE DATA MANAGEMENT CORRIGIDO

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  Site,
  Analysis,
  MetricsData,
  UserSettings as UserPreferencesData,
  Notification,
  RateLimit,
  OptimizationTask,
  TrialStatusData,
  AnalyzeAdSensePayload,
  AnalyzeAdSenseResponse,
  GenerateScriptPayload, // Esta interface pode não ser mais necessária se passarmos params via URL
  GenerateScriptResponse,
  CreateSitePayload,
  CreateSiteResponse,
  InvokeFluxOptimizerEnginePayload,
  InvokeFluxOptimizerEngineResponse,
  GeneratePdfReportPayload,
  GeneratePdfReportResponse,
  UserProfileData
} from '../types/interfaces';


export interface RecentActivity {
  id: string;
  type: 'analysis' | 'optimization' | 'site_added';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'processing' | 'failed' | 'completed' | 'pending';
  metadata?: any;
  site_url?: string;
}

interface CacheEntry<T> { data: T; timestamp: number; ttl: number; }
class FluxCache {
  private cache = new Map<string, CacheEntry<any>>();
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { this.cache.set(key, { data, timestamp: Date.now(), ttl }); }
  get<T>(key: string): T | null { const entry = this.cache.get(key); if (!entry || (Date.now() - entry.timestamp > entry.ttl)) { if (entry) this.cache.delete(key); return null; } return entry.data; }
  invalidate(pattern?: string): void { if (!pattern) { this.cache.clear(); return; } const keys = Array.from(this.cache.keys()); keys.forEach(key => { if (key.includes(pattern)) this.cache.delete(key); }); }
  getStats = () => ({ size: this.cache.size, keys: Array.from(this.cache.keys()) });
}
const fluxCache = new FluxCache();

const getValidSession = async () => { try { const { data: { user }, error: userError } = await supabase.auth.getUser(); if (userError) { console.error('❌ Erro ao verificar usuário:', userError); throw new Error(`User error: ${userError.message}`); } if (!user) { console.warn('⚠️ Usuário não autenticado'); throw new Error('No authenticated user'); } const { data: { session }, error: sessionError } = await supabase.auth.getSession(); if (sessionError) { console.error('❌ Erro na sessão:', sessionError); throw new Error(`Session error: ${sessionError.message}`); } if (!session) { console.warn('⚠️ Nenhuma sessão ativa'); throw new Error('No active session'); } console.log('✅ Usuário e sessão válidos:', user.email); return { user, session }; } catch (error) { console.error('❌ getValidSession failed:', error); throw error; } };
const extractSupabaseData = <T>(result: unknown, defaultValue: T): T => { if (result && typeof result === 'object' && 'data' in result) { const typedResult = result as { data?: T; error?: any }; if (typedResult.error) { console.warn('⚠️ Supabase query error:', typedResult.error); return defaultValue; } return typedResult.data ?? defaultValue; } return defaultValue; };
const extractSettledData = <T>(result: PromiseSettledResult<any>, defaultValue: T): T => {  if (result.status === 'fulfilled') { return extractSupabaseData(result.value, defaultValue); } else { console.warn('⚠️ Promise rejected:', result.reason); return defaultValue; } };

interface FluxState {
  metrics: MetricsData | null;
  analyses: Analysis[];
  sites: Site[];
  userProfile: UserProfileData | null;
  currentUserPreferences: UserPreferencesData | null;
  notifications: Notification[];
  rateLimits: RateLimit[];
  optimizationTasks: OptimizationTask[];
  recentActivityFeed: RecentActivity[];
  loading: boolean;
  error: string | null;
}

interface FluxDataReturn extends FluxState {
  refreshData: () => Promise<void>;
  generateScript: (siteId: string) => Promise<GenerateScriptResponse>;
  addSite: (siteData: { url: string; name?: string; monthly_pageviews: number; current_rpm: number }) => Promise<CreateSiteResponse | { success: false; error: any }>;
  updateSite: (siteId: string, updates: Partial<Site>) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
  invokeAnalyzeAdSense: (payload: AnalyzeAdSensePayload) => Promise<AnalyzeAdSenseResponse>;
  invokeFluxOptimizerEngine: (payload: InvokeFluxOptimizerEnginePayload) => Promise<InvokeFluxOptimizerEngineResponse>;
  invokeGeneratePdfReport: (payload: GeneratePdfReportPayload) => Promise<GeneratePdfReportResponse>;
  updateUserProfile: (data: Partial<UserProfileData>) => Promise<{ success: boolean; error?: any }>;
  updateUserPreferences: (data: Partial<UserPreferencesData>) => Promise<{ success: boolean; error?: any }>;
  fetchRecentActivityFeed: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export function useFluxData(): FluxDataReturn {
  const { user } = useAuth();
  const [state, setState] = useState<FluxState>({ /* ... estado inicial ... */ metrics: null, analyses: [], sites: [], userProfile: null, currentUserPreferences: null, notifications: [], rateLimits: [], optimizationTasks: [], recentActivityFeed: [], loading: false, error: null });
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshInProgressRef = useRef(false);
  const subscriptionsRef = useRef<any[]>([]);
  const userId = useMemo(() => user?.id, [user]);

  const updateState = useCallback((updates: Partial<FluxState>) => { setState(prev => ({ ...prev, ...updates })); }, []);
  const getCacheKey = useCallback((type: string, params?: any) => { const baseKey = `${userId}_${type}`; return params ? `${baseKey}_${JSON.stringify(params)}` : baseKey; }, [userId]);

  const fetchUserData = useCallback(async (signal?: AbortSignal) => { /* ... (implementação como antes) ... */   if (!userId) return; try { const { user: authUser } = await getValidSession(); const cacheKey = getCacheKey('user_data_full'); const cached = fluxCache.get<Partial<FluxState>>(cacheKey); if (cached) { updateState(cached); return; } console.log('🔄 Fetching full user data for user:', authUser.email); const [ profileResult, preferencesResult, sitesResult, analysesResult, notificationsResult, rateLimitsResult ] = await Promise.allSettled([ supabase.from('clients').select('*').eq('id', authUser.id).maybeSingle(), supabase.from('user_settings').select('*').eq('client_id', authUser.id).maybeSingle(), supabase.from('sites').select('*').eq('client_id', authUser.id).order('created_at', { ascending: false }), supabase.from('adsense_analyses').select('id, created_at, optimization_score, total_revenue, status, site_id, client_id, site_url').eq('client_id', authUser.id).order('created_at', { ascending: false }).limit(50), supabase.from('notifications').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(10), supabase.from('rate_limits').select('*').eq('user_id', authUser.id), ]); const userProfile = extractSettledData(profileResult, null) as UserProfileData | null; const currentUserPreferences = extractSettledData(preferencesResult, null) as UserPreferencesData | null; const sites = extractSettledData(sitesResult, []); const analyses = extractSettledData(analysesResult, []).map(a => ({...a, site_url: sites.find(s => s.id === a.site_id)?.url || a.site_url || ''})); const notifications = extractSettledData(notificationsResult, []); const rateLimits = extractSettledData(rateLimitsResult, []); let optimizationTasks: OptimizationTask[] = []; if (sites.length > 0) { try { const siteIds = sites.map((s: Site) => s.id); const tasksQuery = await supabase .from('optimization_tasks') .select('id, created_at, status, site_id, completed_at, error_message, results') .in('site_id', siteIds) .order('created_at', { ascending: false }) .limit(10); optimizationTasks = extractSupabaseData(tasksQuery, []); } catch (tasksError) { console.warn('⚠️ Could not fetch optimization tasks:', tasksError); } } let metrics: MetricsData | null = null; if (sites.length > 0) { try { const metricsQuery = await supabase .from('metrics') .select('*') .in('site_id', sites.map((s: Site) => s.id)) .order('timestamp', { ascending: false }) .limit(1); const metricsData = extractSupabaseData(metricsQuery, []); metrics = metricsData[0] || null; } catch (metricsError) { console.warn('⚠️ Could not fetch metrics:', metricsError); } } const newState: Partial<FluxState> = { sites, analyses, userProfile, currentUserPreferences, notifications, rateLimits, optimizationTasks, metrics, error: null }; updateState(newState); fluxCache.set(cacheKey, newState, 3 * 60 * 1000); console.log('✅ Full user data fetched successfully'); } catch (error: any) { if (error.name === 'AbortError') { console.log('🔄 Data fetch aborted'); return; } console.error('❌ Error fetching user data:', error); updateState({ error: error.message });} }, [userId, updateState, getCacheKey, supabase]);
  const fetchRecentActivityFeedInternal = useCallback(async (): Promise<RecentActivity[]> => { /* ... (implementação como antes) ... */   if (!userId) return []; try { const { data: analysesData } = await supabase .from('adsense_analyses') .select('id, created_at, status, site_id, site_url, sites ( url )') .eq('client_id', userId) .order('created_at', { ascending: false }) .limit(5); const siteIdsFromState = state.sites.map(s => s.id); if (siteIdsFromState.length === 0) { console.log("No sites in state for recent tasks, skipping task fetch for feed."); return []; // Ou buscar todos os sites aqui se necessário } const { data: tasksData } = await supabase .from('optimization_tasks') .select('id, created_at, status, site_id, sites ( url )') .in('site_id', siteIdsFromState) .order('created_at', { ascending: false }) .limit(3); const activities: RecentActivity[] = []; analysesData?.forEach((a: any) => activities.push({ id: a.id, type: 'analysis', title: `Análise ${a.sites?.url || a.site_url || a.site_id}`, description: `Status: ${a.status}`, timestamp: a.created_at, status: a.status as RecentActivity['status'], site_url: a.sites?.url || a.site_url })); tasksData?.forEach((t: any) => activities.push({ id: t.id, type: 'optimization', title: `Otimização ${t.sites?.url || t.site_id}`, description: `Status: ${t.status}`, timestamp: t.created_at, status: t.status as RecentActivity['status'], site_url: t.sites?.url })); activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); return activities.slice(0, 8); } catch (error) { console.error('Error fetching recent activity feed:', error); return []; } }, [userId, state.sites, supabase]);
  const fetchRecentActivityFeed = useCallback(async () => { const feed = await fetchRecentActivityFeedInternal(); updateState({ recentActivityFeed: feed }); }, [fetchRecentActivityFeedInternal, updateState]);
  const refreshData = useCallback(async (): Promise<void> => { /* ... (lógica de refreshData original, chamando fetchUserData) ... */ if (!userId) return; if (refreshInProgressRef.current) { console.log('🔄 RefreshData: Already in progress, skipping...'); return; } refreshInProgressRef.current = true; updateState({ loading: true, error: null }); if (abortControllerRef.current) { abortControllerRef.current.abort(); } abortControllerRef.current = new AbortController(); try { await fetchUserData(abortControllerRef.current?.signal); } catch (error: any) { console.error('❌ RefreshData failed:', error); updateState({ error: error.message }); } finally { updateState({ loading: false }); refreshInProgressRef.current = false; } }, [userId, fetchUserData, updateState]);
  const refreshDataAndActivity = useCallback(async () => { await refreshData(); await fetchRecentActivityFeed(); }, [refreshData, fetchRecentActivityFeed]);
  const setupSubscriptions = useCallback(async () => { /* ... (implementação como antes, mas refreshDataAndActivity) ... */ if (!userId) return; subscriptionsRef.current.forEach(sub => sub?.unsubscribe()); subscriptionsRef.current = []; try { console.log('🔄 Setting up real-time subscriptions...'); const sitesChannel = supabase .channel(`flux_sites_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'sites', filter: `client_id=eq.${userId}` }, (payload) => { console.log('🌐 Real-time site update:', payload); fluxCache.invalidate('sites'); fluxCache.invalidate('user_data_full'); refreshDataAndActivity(); }) .subscribe(); const analysesChannel = supabase .channel(`flux_analyses_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'adsense_analyses', filter: `client_id=eq.${userId}` }, (payload) => { console.log('📈 Real-time analysis update:', payload); fluxCache.invalidate('analyses'); fluxCache.invalidate('user_data_full'); if (payload.eventType === 'INSERT') { setState(prev => ({ ...prev, analyses: [payload.new as Analysis, ...prev.analyses] })); fetchRecentActivityFeed(); } else { refreshDataAndActivity(); } }) .subscribe(); const notificationsChannel = supabase .channel(`flux_notifications_${userId}`) .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => { console.log('🔔 Real-time notification update:', payload); fluxCache.invalidate('notifications'); fluxCache.invalidate('user_data_full'); if (payload.eventType === 'INSERT') { setState(prev => ({ ...prev, notifications: [payload.new as Notification, ...prev.notifications] })); } else { refreshDataAndActivity(); } }) .subscribe(); const optimizationTasksChannel = supabase .channel(`flux_optimization_tasks_${userId}_v2`) .on('postgres_changes', { event: '*', schema: 'public', table: 'optimization_tasks' /* Filter by site_ids user owns might be complex here, rely on refresh */ }, async (payload) => { console.log('⚡ Real-time optimization_task update:', payload); fluxCache.invalidate('optimizationTasks'); fluxCache.invalidate('user_data_full'); await refreshDataAndActivity(); }) .subscribe(); const userSettingsChannel = supabase .channel(`flux_user_settings_${userId}`) .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_settings', filter: `client_id=eq.${userId}`}, (payload) => { console.log('⚙️ Real-time user_settings update:', payload); fluxCache.invalidate('user_data_full'); refreshDataAndActivity(); }).subscribe(); const clientsChannel = supabase .channel(`flux_clients_${userId}`) .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${userId}`}, (payload) => { console.log('👤 Real-time clients (userProfile) update:', payload); fluxCache.invalidate('user_data_full'); refreshDataAndActivity(); }).subscribe(); subscriptionsRef.current = [sitesChannel, analysesChannel, notificationsChannel, optimizationTasksChannel, userSettingsChannel, clientsChannel]; console.log('✅ Real-time subscriptions setup completed'); } catch (error) { console.error('❌ Error setting up subscriptions:', error); } }, [userId, refreshDataAndActivity, supabase]); // Adicionado supabase
  useEffect(() => { if (userId) { refreshDataAndActivity(); setupSubscriptions(); } return () => { subscriptionsRef.current.forEach(sub => sub?.unsubscribe()); if (abortControllerRef.current) { abortControllerRef.current.abort(); }}; }, [userId, setupSubscriptions, refreshDataAndActivity]);

  const invokeAnalyzeAdSenseImpl = useCallback(async (payload: AnalyzeAdSensePayload): Promise<AnalyzeAdSenseResponse> => { /* ... (implementação como antes, mas refreshDataAndActivity) ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, client_id: userId }; try { const { data, error } = await supabase.functions.invoke<AnalyzeAdSenseResponse>('analyze-adsense', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from analyze-adsense'); await refreshDataAndActivity(); return data; } catch (e:any) { console.error('invokeAnalyzeAdSense error:', e); return { success:false, message: e.message || "Unknown error analyzing AdSense" };} }, [userId, supabase, refreshDataAndActivity]);
  const invokeFluxOptimizerEngineImpl = useCallback(async (payload: InvokeFluxOptimizerEnginePayload): Promise<InvokeFluxOptimizerEngineResponse> => { /* ... (implementação como antes, mas refreshDataAndActivity) ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, user_id: userId }; try { const { data, error } = await supabase.functions.invoke<InvokeFluxOptimizerEngineResponse>('flux-optimizer-engine', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from flux-optimizer-engine'); await refreshDataAndActivity(); return data; } catch (e:any) { console.error('invokeFluxOptimizerEngine error:', e); return { success:false, message: e.message || "Unknown error from optimizer engine" };} }, [userId, supabase, refreshDataAndActivity]);
  const invokeGeneratePdfReportImpl = useCallback(async (payload: GeneratePdfReportPayload): Promise<GeneratePdfReportResponse> => { /* ... (implementação como antes) ... */ if (!userId) return { success: false, message: 'User not authenticated for EF.' }; const finalPayload = { ...payload, userId: userId }; try { const { data, error } = await supabase.functions.invoke<GeneratePdfReportResponse>('generate-pdf-report', { body: finalPayload }); if (error) throw error; if (!data) throw new Error('No data from generate-pdf-report'); return data; } catch (e:any) { console.error('invokeGeneratePdfReport error:', e); return { success:false, message: e.message || "Unknown error generating PDF" };} }, [userId, supabase]);
  const updateUserProfileImpl = useCallback(async (profileData: Partial<UserProfileData>): Promise<{ success: boolean; error?: any }> => { /* ... (implementação como antes) ... */ if (!userId) return { success: false, error: new Error('User not authenticated') }; try { const { error } = await supabase.from('clients').update(profileData).eq('id', userId); if (error) throw error; await refreshDataAndActivity(); return { success: true }; } catch (error: any) { return { success: false, error }; } }, [userId, supabase, refreshDataAndActivity]);
  const updateUserPreferencesImpl = useCallback(async (preferencesData: Partial<UserPreferencesData>): Promise<{ success: boolean; error?: any }> => { /* ... (implementação como antes) ... */ if (!userId) return { success: false, error: new Error('User not authenticated') }; try { const upsertData = { ...preferencesData, client_id: userId }; const { error } = await supabase.from('user_settings').upsert(upsertData, { onConflict: 'client_id' }); if (error) throw error; await refreshDataAndActivity(); return { success: true }; } catch (error: any) { return { success: false, error }; } }, [userId, supabase, refreshDataAndActivity]);
  const markNotificationReadImpl = useCallback(async (notificationId: string): Promise<void> => { /* ... (implementação como antes, mas refreshDataAndActivity) ... */ if (!userId) return; try { await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId); await refreshDataAndActivity(); } catch (error) { console.error("Error marking notification read:", error); } }, [userId, supabase, refreshDataAndActivity]);
  const markAllNotificationsReadImpl = useCallback(async (): Promise<void> => { /* ... (implementação como antes, mas refreshDataAndActivity) ... */ if (!userId) return; try { await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false); await refreshDataAndActivity(); } catch (error) { console.error("Error marking all notifications read:", error); } }, [userId, supabase, refreshDataAndActivity]);

  const generateScriptHandler = useCallback(async (siteId: string): Promise<GenerateScriptResponse> => {
    if (!userId) return { success: false, message: 'User not authenticated' };

    const site = state.sites.find(s => s.id === siteId);
    if (!site || !site.optimization_token) {
      return { success: false, message: 'Site não encontrado ou token de otimização ausente.' };
    }

    try {
      // A EF flux-optimizer-script espera GET e retorna texto.
      // supabase.functions.invoke é para POST e espera JSON.
      // Precisamos fazer uma chamada fetch() manual para esta EF.
      const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/flux-optimizer-script?site=${siteId}&token=${site.optimization_token}`;

      // Obter o token de acesso do usuário atual para autenticar a chamada à Edge Function,
      // mesmo que a EF em si use o token do site para autorização.
      // Isso é uma camada extra, e pode ser opcional dependendo de como a EF é protegida.
      // Se a EF for pública (protegida apenas pelo token do site), o header Authorization não é estritamente necessário.
      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData.data.session?.access_token;

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching script from flux-optimizer-script EF:', response.status, errorText);
        throw new Error(`Falha ao obter script: ${response.status} ${errorText || response.statusText}`);
      }

      const scriptContent = await response.text();

      // Atualizar o cache se desejar, embora scripts possam mudar e o cache da EF já exista.
      // fluxCache.set(getCacheKey('script', siteId), { script: scriptContent, success: true }, 60 * 60 * 1000);

      console.log('✅ Script de otimização obtido com sucesso para o site:', siteId);
      return { script: scriptContent, success: true };

    } catch (error: any) {
      console.error('❌ Erro ao gerar script via flux-optimizer-script:', error);
      return { success: false, message: error.message || 'Erro ao gerar script de otimização' };
    }
  }, [userId, state.sites, supabase, getCacheKey]); // Adicionado supabase e getCacheKey

  const addSiteHandler = useCallback(async (
    siteData: { url: string; name?: string; monthly_pageviews: number; current_rpm: number }
  ): Promise<CreateSiteResponse | { success: false; error: any }> => {
    if (!userId) {
      console.error("❌ addSite: Usuário não autenticado.");
      return { success: false, error: { message: "Usuário não autenticado" } };
    }
    try {
      await getValidSession(); // Garante sessão válida
      const payload: CreateSitePayload = {
        url: siteData.url,
        name: siteData.name,
        monthly_pageviews: siteData.monthly_pageviews,
        current_rpm: siteData.current_rpm,
      };
      const { data, error } = await supabase.functions.invoke<CreateSiteResponse>('create-site', {
        body: payload
      });

      if (error) throw error;
      if (!data ) throw new Error("Nenhum dado retornado ao criar site.");

      // Se a EF create-site não retornar um campo 'success', podemos assumir sucesso se não houver erro.
      // Ou a interface CreateSiteResponse pode ser ajustada.
      const responseData = data as Site; // Cast para Site, pois é o que newSite é na EF

      console.log('✅ Site adicionado com sucesso pela EF:', responseData);
      await refreshDataAndActivity();
      return { ...responseData, success: true }; // Adicionar success wrapper
    } catch (error: any) {
      console.error('❌ Erro ao adicionar site:', error);
      return { success: false, error: error };
    }
  }, [userId, supabase, refreshDataAndActivity]);


  return {
    ...state,
    refreshData: refreshDataAndActivity,
    generateScript: generateScriptHandler,
    addSite: addSiteHandler,
    updateSite: useCallback(async (siteId: string, updates: Partial<Site>) => { if (!userId) return; try {await supabase.from('sites').update(updates).eq('id', siteId).eq('client_id', userId); await refreshDataAndActivity();} catch(e){console.error(e);}}, [userId, supabase, refreshDataAndActivity]),
    clearCache: useCallback(() => fluxCache.invalidate(), []),
    getCacheStats: useCallback(() => fluxCache.getStats(), []),
    invokeAnalyzeAdSense: invokeAnalyzeAdSenseImpl,
    invokeFluxOptimizerEngine: invokeFluxOptimizerEngineImpl,
    invokeGeneratePdfReport: invokeGeneratePdfReportImpl,
    updateUserProfile: updateUserProfileImpl,
    updateUserPreferences: updateUserPreferencesImpl,
    fetchRecentActivityFeed,
    markNotificationRead: markNotificationReadImpl,
    markAllNotificationsRead: markAllNotificationsReadImpl,
  };
}

export function useTrialStatus() { /* ... (sem mudanças) ... */ const { user } = useAuth(); const [data, setData] = useState<TrialStatusData | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const fetchStatus = useCallback(async () => { if (!user?.id) return; setLoading(true); setError(null); try { const { user: authUser } = await getValidSession(); const { data: clientData, error: clientError } = await supabase .from('clients') .select('plan, subscription_status, trial_end_date, trial_start_date') .eq('id', authUser.id) .maybeSingle(); if (clientError) throw clientError; if (clientData) { const trialEnd = clientData.trial_end_date ? new Date(clientData.trial_end_date) : null; const now = new Date(); const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0; const trialStatus: TrialStatusData = { plan: clientData.plan || 'free', trial_end: clientData.trial_end_date, days_left: daysLeft, is_trial: clientData.plan === 'trial', can_upgrade: true, features_available: ['basic_features'] }; setData(trialStatus); console.log('✅ Trial status loaded:', trialStatus); } } catch (err: any) { setError(err.message); console.error('❌ Error fetching trial status:', err); } finally { setLoading(false); } }, [user?.id]); useEffect(() => { if (user?.id) { const timer = setTimeout(fetchStatus, 300); return () => clearTimeout(timer); } }, [user?.id, fetchStatus]); return { data, loading, error }; }
export function useMetrics(siteId: string) { /* ... (sem mudanças) ... */ const { user } = useAuth(); const [data, setData] = useState<MetricsData | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const fetchMetrics = useCallback(async () => { if (!user?.id || !siteId) return; setLoading(true); setError(null); try { const { data: metricsData, error: metricsError } = await supabase .from('metrics') .select('*') .eq('site_id', siteId) .order('timestamp', { ascending: false }) .limit(1); if (metricsError) throw metricsError; setData(metricsData?.[0] as MetricsData || null); console.log('✅ Metrics loaded for site:', siteId); } catch (err: any) { setError(err.message); console.error('❌ Error fetching metrics:', err); } finally { setLoading(false); } }, [user?.id, siteId]); useEffect(() => { if (user?.id && siteId) { const timer = setTimeout(fetchMetrics, 200); return () => clearTimeout(timer); } }, [user?.id, siteId, fetchMetrics]); return { data, loading, error }; }
export function useAnalyzeAdSense() {
  const { invokeAnalyzeAdSense, refreshData } = useFluxData();
  const [data, setData] = useState<AnalyzeAdSenseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCSV = useCallback(async (
    // Payload agora é um objeto único
    payload: Omit<AnalyzeAdSensePayload, 'client_id' | 'timestamp' | 'user_id'> & { client_id: string } // client_id obrigatório
  ) => {
    setLoading(true);
    setError(null);
    try {
      const fullPayload: AnalyzeAdSensePayload = {
        ...payload,
        timestamp: new Date().toISOString()
        // client_id já está no payload
      };
      const result = await invokeAnalyzeAdSense(fullPayload);
      setData(result);
      if (result.success) {
        // refreshData já é chamado dentro de invokeAnalyzeAdSenseImpl se necessário
      } else {
        setError(result.message || 'Análise falhou');
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message } as AnalyzeAdSenseResponse;
    } finally {
      setLoading(false);
    }
  }, [invokeAnalyzeAdSense]); // Removido refreshData daqui, pois é chamado internamente

  return { data, loading, error, analyzeCSV };
}

export default useFluxData;
