// src/hooks/useFluxData.ts - ENTERPRISE GRADE DATA MANAGEMENT CORRIGIDO E CENTRALIZADO

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Apenas para obter 'user' para 'userId'
import { supabase } from '../lib/supabaseClient';
import {
  Site,
  Analysis,
  MetricsData,
  UserSettings as UserPreferencesData, // Dados da tabela user_settings
  Notification,
  RateLimit,
  OptimizationTask,
  TrialStatusData, // Descomentado - necessário para useTrialStatus
  AnalyzeAdSensePayload,
  AnalyzeAdSenseResponse,
  // GenerateScriptPayload, // Não mais necessária, params via URL
  GenerateScriptResponse,
  CreateSitePayload,
  CreateSiteResponse,
  InvokeFluxOptimizerEnginePayload,
  InvokeFluxOptimizerEngineResponse,
  GeneratePdfReportPayload,
  GeneratePdfReportResponse,
  UserProfileData, // Dados da tabela clients
  TaskActionsPayload, // Para o campo actions em OptimizationTask
  RecentActivity // Importado corretamente
} from '../types/interfaces';

// RecentActivity agora é importado de types/interfaces.ts; definição local e comentário "Definida abaixo" removidos.

// === CACHE MANAGEMENT ===
interface CacheEntry<T> { data: T; timestamp: number; ttl: number; }
class FluxCache {
  private cache = new Map<string, CacheEntry<any>>();
  set<T>(key: string, data: T, ttl: number = 3 * 60 * 1000): void { this.cache.set(key, { data, timestamp: Date.now(), ttl }); } // TTL padrão de 3 min
  get<T>(key: string): T | null { const entry = this.cache.get(key); if (!entry || (Date.now() - entry.timestamp > entry.ttl)) { if (entry) this.cache.delete(key); return null; } return entry.data; }
  invalidate(pattern?: string | RegExp): void { 
    if (!pattern) { this.cache.clear(); return; }
    const keys = Array.from(this.cache.keys());
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    keys.forEach(key => { if (regex.test(key)) this.cache.delete(key); });
  }
  getStats = () => ({ size: this.cache.size, keys: Array.from(this.cache.keys()) });
}
const fluxCache = new FluxCache();

// === UTILITY FUNCTIONS ===
const getValidSessionOrThrow = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error(`Usuário não autenticado: ${userError?.message || 'Sessão inválida'}`);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error(`Sessão Supabase inválida: ${sessionError?.message || 'Sessão não encontrada'}`);
  
  console.log('✅ [useFluxData] Sessão válida para:', user.email);
  return { user, session };
};

const extractSupabaseData = <T>(result: { data?: T | T[] | null; error?: any } | null, defaultValue: T[] | T | null, isSingle = false): T[] | T | null => {
  if (!result) return defaultValue;
  if (result.error) {
    console.warn(`⚠️ [useFluxData] Supabase query error: ${result.error.message}`, result.error);
    return defaultValue;
  }
  if (isSingle) return result.data as T ?? defaultValue;
  return (result.data as T[]) ?? defaultValue;
};

const extractSettledSupabaseData = <T>(result: PromiseSettledResult<{data?: T | T[] | null; error?: any}>, defaultValue: T[] | T | null, isSingle = false): T[] | T | null => {
  if (result.status === 'fulfilled') {
    return extractSupabaseData(result.value, defaultValue, isSingle);
  } else {
    console.warn('⚠️ [useFluxData] Promise rejected:', result.reason);
    return defaultValue;
  }
};


// === STATE MANAGEMENT ===
interface FluxState {
  metrics: MetricsData | null; // Última métrica geral ou de site específico
  analyses: Analysis[];
  sites: Site[];
  userProfile: UserProfileData | null; // Dados da tabela 'clients'
  currentUserPreferences: UserPreferencesData | null; // Dados da tabela 'user_settings'
  notifications: Notification[];
  rateLimits: RateLimit[]; // Array de RateLimit
  optimizationTasks: OptimizationTask[];
  recentActivityFeed: RecentActivity[];
  loading: Set<string>; // Set de chaves de loading para granularidade
  error: string | null; // Erro global do hook
}

// === HOOK INTERFACE ===
interface FluxDataReturn extends Omit<FluxState, 'loading'> {
  isLoading: (key?: string) => boolean; // Função para verificar loading específico ou geral
  refreshData: (dataType?: keyof FluxState | 'all') => Promise<void>;
  generateScript: (siteId: string) => Promise<GenerateScriptResponse>;
  addSite: (siteData: Omit<CreateSitePayload, 'client_id' | 'timestamp'>) => Promise<CreateSiteResponse | { success: false; error: any; data?: null }>;
  updateSite: (siteId: string, updates: Partial<Site>) => Promise<{success: boolean, error?: any, data?: Site | null}>;
  clearFluxCache: (pattern?: string | RegExp) => void;
  getFluxCacheStats: () => { size: number; keys: string[] };
  invokeAnalyzeAdSense: (payload: Omit<AnalyzeAdSensePayload, 'client_id' | 'timestamp'>) => Promise<AnalyzeAdSenseResponse>;
  invokeFluxOptimizerEngine: (payload: Omit<InvokeFluxOptimizerEnginePayload, 'user_id' | 'timestamp'>) => Promise<InvokeFluxOptimizerEngineResponse>;
  invokeGeneratePdfReport: (payload: Omit<GeneratePdfReportPayload, 'userId' | 'generatedAt'>) => Promise<GeneratePdfReportResponse>;
  updateUserProfile: (data: Partial<Omit<UserProfileData, 'id' | 'email' | 'created_at' | 'updated_at'>>) => Promise<{ success: boolean; error?: any }>;
  updateUserPreferences: (data: Partial<Omit<UserPreferencesData, 'client_id' | 'id' | 'created_at' | 'updated_at'>>) => Promise<{ success: boolean; error?: any }>;
  fetchRecentActivityFeed: () => Promise<void>; 
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export function useFluxData(): FluxDataReturn {
  const { user } = useAuth(); // Apenas para obter userId e reagir a mudanças de usuário
  const userId = useMemo(() => user?.id, [user]);

  // Refs para controle interno
  const refreshInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const subscriptionsRef = useRef<any[]>([]); // Idealmente: RealtimeChannel[]

  const [state, setState] = useState<FluxState>({
    metrics: null, analyses: [], sites: [], userProfile: null, currentUserPreferences: null,
    notifications: [], rateLimits: [], optimizationTasks: [], recentActivityFeed: [],
    loading: new Set<string>(), error: null
  });

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setState(prev => {
      const newLoading = new Set(prev.loading);
      if (isLoading) newLoading.add(key);
      else newLoading.delete(key);
      return { ...prev, loading: newLoading };
    });
  }, []);
  
  const isLoading = useCallback((key?: string) => {
    if (key) return state.loading.has(key);
    return state.loading.size > 0;
  }, [state.loading]);


  const updateState = useCallback((updates: Partial<FluxState>) => {
    setState(prev => ({ ...prev, ...updates, error: null })); // Limpa erro em qualquer atualização de sucesso
  }, []);

  const getCacheKey = useCallback((type: string, params?: any) => {
    const baseKey = `${userId}_${type}`;
    return params ? `${baseKey}_${JSON.stringify(params)}` : baseKey;
  }, [userId]);

  // --- FUNÇÕES DE BUSCA DE DADOS ---
  const fetchCoreUserData = useCallback(async (currentUserId: string, signal?: AbortSignal) => {
    setLoadingState('coreUser', true);
    try {
      const cacheKey = getCacheKey('core_user_data');
      const cached = fluxCache.get<Pick<FluxState, 'userProfile' | 'currentUserPreferences'>>(cacheKey);
      if (cached) { updateState(cached); setLoadingState('coreUser', false); return; }

      const [profileResult, preferencesResult] = await Promise.allSettled([
        supabase.from('clients').select('*').eq('id', currentUserId).maybeSingle(),
        supabase.from('user_settings').select('*').eq('client_id', currentUserId).maybeSingle(),
      ]);

      const userProfile = extractSettledSupabaseData(profileResult, null, true) as UserProfileData | null;
      const currentUserPreferences = extractSettledSupabaseData(preferencesResult, null, true) as UserPreferencesData | null;
      
      const partialState: Pick<FluxState, 'userProfile' | 'currentUserPreferences'> = { userProfile, currentUserPreferences };
      updateState(partialState);
      fluxCache.set(cacheKey, partialState);
    } catch (error: any) { setState(prev => ({...prev, error: error.message})); }
    finally { setLoadingState('coreUser', false); }
  }, [getCacheKey, updateState, setLoadingState]);

  const fetchSitesAndAnalyses = useCallback(async (currentUserId: string, signal?: AbortSignal) => {
    setLoadingState('sitesAnalyses', true);
    try {
      const cacheKey = getCacheKey('sites_analyses_data');
      const cached = fluxCache.get<Pick<FluxState, 'sites' | 'analyses' | 'optimizationTasks' | 'metrics'>>(cacheKey);
      if (cached) { updateState(cached); setLoadingState('sitesAnalyses', false); return; }

      const [sitesResult, analysesResult, notificationsResult, rateLimitsResult] = await Promise.allSettled([
        supabase.from('sites').select('*').eq('client_id', currentUserId).order('created_at', { ascending: false }),
        supabase.from('adsense_analyses').select('*, sites(url)').eq('client_id', currentUserId).order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }).limit(20),
        supabase.from('rate_limits').select('*').eq('user_id', currentUserId),
      ]);
      const sites = extractSettledSupabaseData(sitesResult, [], false) as Site[];
      const analyses = extractSettledSupabaseData(analysesResult, [], false) as Analysis[];
      const notifications = extractSettledSupabaseData(notificationsResult, [], false) as Notification[];
      const rateLimits = extractSettledSupabaseData(rateLimitsResult, [], false) as RateLimit[];

      let optimizationTasks: OptimizationTask[] = [];
      if (sites.length > 0) { 
        try { 
          const siteIds = sites.map(s => s.id); 
          const tasksQuery = await supabase.from('optimization_tasks').select('id, created_at, status, site_id, results').in('site_id', siteIds).order('created_at', { ascending: false }).limit(20);
          optimizationTasks = extractSupabaseData(tasksQuery, []) ?? []; // Garantir que seja array
        } catch (e){ console.warn('Error fetching optimization_tasks:', e); optimizationTasks = []; } 
      }
      let metrics: MetricsData | null = null;
      if (sites.length > 0) { 
        try { 
          const metricsQuery = await supabase.from('metrics').select('*').in('site_id', sites.map(s=>s.id)).order('timestamp', { ascending: false }).limit(1);
          const metricsData = extractSupabaseData(metricsQuery, []);
          metrics = metricsData?.[0] ?? null; // Acesso seguro e fallback para null
        } catch(e){ console.warn('Error fetching metrics:', e); metrics = null; } 
      }
      
      const partialState: Pick<FluxState, 'sites' | 'analyses' | 'notifications' | 'rateLimits' | 'optimizationTasks' | 'metrics'> = 
        { sites, analyses, notifications, rateLimits, optimizationTasks, metrics };
      updateState(partialState);
      fluxCache.set(cacheKey, partialState);
    } catch (error: any) { setState(prev => ({...prev, error: error.message})); }
    finally { setLoadingState('sitesAnalyses', false); }
  }, [getCacheKey, updateState, setLoadingState]);

  const fetchRecentActivityFeedInternal = useCallback(async (currentUserId: string, currentSites: Site[]): Promise<RecentActivity[]> => { /* ... (lógica como antes, mas recebe userId e sites) ... */ if (!currentUserId) return []; try { const { data: analysesData } = await supabase .from('adsense_analyses') .select('id, created_at, status, site_id, site_url, sites ( url )') .eq('client_id', currentUserId) .order('created_at', { ascending: false }) .limit(5); let tasksData: any[] = []; if (currentSites.length > 0) { const siteIdsFromState = currentSites.map(s => s.id); const {data} = await supabase .from('optimization_tasks') .select('id, created_at, status, site_id, sites ( url )') .in('site_id', siteIdsFromState) .order('created_at', { ascending: false }) .limit(3); tasksData = data || []; } const activities: RecentActivity[] = []; analysesData?.forEach((a: any) => activities.push({ id: a.id, type: 'analysis', title: `Análise ${a.sites?.url || a.site_url || a.site_id}`, description: `Status: ${a.status}`, timestamp: a.created_at, status: a.status as RecentActivity['status'], site_url: a.sites?.url || a.site_url, link: `/analyzer?analysis_id=${a.id}` })); tasksData?.forEach((t: any) => activities.push({ id: t.id, type: 'optimization', title: `Otimização ${t.sites?.url || t.site_id}`, description: `Status: ${t.status}`, timestamp: t.created_at, status: t.status as RecentActivity['status'], site_url: t.sites?.url, link: `/optimizer?task_id=${t.id}` })); activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); return activities.slice(0, 8); } catch (error) { console.error('Error fetching recent activity feed:', error); return []; } }, [supabase]);
  const fetchRecentActivityFeed = useCallback(async () => { if(!userId) return; setLoadingState('recentActivity', true); try { const feed = await fetchRecentActivityFeedInternal(userId, state.sites); updateState({ recentActivityFeed: feed }); } catch(e:any){ setState(prev => ({...prev, error: e.message}));} finally { setLoadingState('recentActivity', false); } }, [userId, state.sites, fetchRecentActivityFeedInternal, updateState, setLoadingState]);

  const refreshData = useCallback(async (dataType: keyof FluxState | 'all' = 'all') => {
    if (!userId) { console.warn("[useFluxData] Tentativa de refresh sem userId."); return; }
    console.log(`[useFluxData] Refreshing data for: ${dataType}`);
    
    if (refreshInProgressRef.current && dataType === 'all') { console.log('🔄 RefreshData (all): Already in progress...'); return; }
    if (dataType === 'all') refreshInProgressRef.current = true;
    
    setLoadingState(dataType === 'all' ? 'global' : dataType, true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (dataType === 'all' || dataType === 'userProfile' || dataType === 'currentUserPreferences') {
        await fetchCoreUserData(userId, signal);
      }
      if (dataType === 'all' || dataType === 'sites' || dataType === 'analyses' || dataType === 'optimizationTasks' || dataType === 'metrics' || dataType === 'notifications' || dataType === 'rateLimits') {
        await fetchSitesAndAnalyses(userId, signal);
      }
      if (dataType === 'all' || dataType === 'recentActivityFeed') {
        await fetchRecentActivityFeed(); // Usa o userId do hook e state.sites
      }
      // Adicionar mais blocos para outros tipos de dados se necessário
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(`❌ RefreshData failed for ${dataType}:`, error);
        setState(prev => ({ ...prev, error: error.message }));
      }
    } finally {
      setLoadingState(dataType === 'all' ? 'global' : dataType, false);
      if (dataType === 'all') refreshInProgressRef.current = false;
    }
  }, [userId, fetchCoreUserData, fetchSitesAndAnalyses, fetchRecentActivityFeed, setLoadingState]);

  // --- EFEITOS ---
  
  // Placeholder para subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!userId || !supabase) {
      console.log("[useFluxData] Cannot setup subscriptions: no userId or supabase client.");
      return;
    }
    // Limpar subscriptions antigas antes de criar novas
    subscriptionsRef.current.forEach((channel: any) => { // Tipado 'channel' como any
        if (channel && typeof channel.unsubscribe === 'function') {
            supabase.removeChannel(channel);
        }
    });
    subscriptionsRef.current = [];

    console.log(`[useFluxData] Placeholder: Configurando subscriptions para user ${userId}`);
    
    // Exemplo de subscription (deve ser adaptado para suas tabelas e necessidades):
    // const sitesChannel = supabase.channel(`public:sites:client_id=eq.${userId}`)
    //   .on<Site>(
    //     'postgres_changes',
    //     { event: '*', schema: 'public', table: 'sites', filter: `client_id=eq.${userId}` },
    //     (payload) => {
    //       console.log('[Supabase Realtime] Sites change received!', payload);
    //       fluxCache.invalidate(getCacheKey('sites_analyses_data')); // Invalida cache relevante
    //       refreshData('sites'); // Ou uma atualização mais granular
    //     }
    //   )
    //   .subscribe((status, err) => {
    //     if (status === 'SUBSCRIBED') {
    //       console.log(`[Supabase Realtime] Subscribed to sites for user ${userId}`);
    //     }
    //     if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    //       console.error(`[Supabase Realtime] Subscription error for sites: ${status}`, err);
    //     }
    //   });
    // subscriptionsRef.current.push(sitesChannel);

  }, [userId, supabase, refreshData, fluxCache, getCacheKey]); // Adicionado supabase, refreshData, fluxCache, getCacheKey

  useEffect(() => { 
    if (userId) { 
      console.log('👤 [useFluxData] User detected, initial data fetch...'); 
      refreshData('all'); 
      setupSubscriptions();
    } else { 
      updateState({ userProfile: null, currentUserPreferences: null, sites: [], analyses:[], notifications:[], recentActivityFeed:[], optimizationTasks:[], metrics:null, rateLimits:[] }); 
      fluxCache.invalidate(); 
      // Limpar subscriptions se o usuário deslogar
      subscriptionsRef.current.forEach(channel => {
        if (channel && typeof channel.unsubscribe === 'function') {
            supabase.removeChannel(channel);
        }
      });
      subscriptionsRef.current = [];
    } 
  }, [userId, refreshData, setupSubscriptions]); // Adicionado setupSubscriptions


  // --- FUNÇÕES DE MODIFICAÇÃO DE DADOS E CHAMADAS DE EF ---
  const invokeAnalyzeAdSenseImpl = useCallback(async (payloadNoUser: Omit<AnalyzeAdSensePayload, 'client_id' | 'timestamp'>): Promise<AnalyzeAdSenseResponse> => { /* ... */ const {user} = await getValidSessionOrThrow(); const payload = {...payloadNoUser, client_id: user.id, timestamp: new Date().toISOString()}; setLoadingState('analyzeAdSense', true); try {const {data, error} = await supabase.functions.invoke<AnalyzeAdSenseResponse>('analyze-adsense', {body:payload}); if(error) throw error; if(!data) throw new Error('No data from analyze-adsense'); if(data.success) await refreshData('analyses'); return data;} catch(e:any){console.error(e); return {success:false, message:e.message};} finally {setLoadingState('analyzeAdSense', false);}}, [supabase, refreshData, setLoadingState]);
  const invokeFluxOptimizerEngineImpl = useCallback(async (payloadNoUser: Omit<InvokeFluxOptimizerEnginePayload, 'user_id' | 'timestamp'>): Promise<InvokeFluxOptimizerEngineResponse> => { /* ... */ const {user} = await getValidSessionOrThrow(); const payload = {...payloadNoUser, user_id: user.id, timestamp: new Date().toISOString()}; setLoadingState('optimizerEngine', true); try {const {data, error} = await supabase.functions.invoke<InvokeFluxOptimizerEngineResponse>('flux-optimizer-engine', {body:payload}); if(error) throw error; if(!data) throw new Error('No data from flux-optimizer-engine'); if(data.success) await refreshData('optimizationTasks'); return data;} catch(e:any){console.error(e); return {success:false, message:e.message};} finally {setLoadingState('optimizerEngine', false);}}, [supabase, refreshData, setLoadingState]);
  const invokeGeneratePdfReportImpl = useCallback(async (payloadNoUser: Omit<GeneratePdfReportPayload, 'userId' | 'generatedAt'>): Promise<GeneratePdfReportResponse> => { /* ... */ const {user} = await getValidSessionOrThrow(); const payload = {...payloadNoUser, userId: user.id, generatedAt: new Date().toISOString()}; setLoadingState('pdfReport', true); try {const {data, error} = await supabase.functions.invoke<GeneratePdfReportResponse>('generate-pdf-report', {body:payload}); if(error) throw error; if(!data) throw new Error('No data from generate-pdf-report'); return data;} catch(e:any){console.error(e); return {success:false, message:e.message};} finally {setLoadingState('pdfReport', false);}}, [supabase, setLoadingState]);
  const updateUserProfileImpl = useCallback(async (profileData: Partial<Omit<UserProfileData, 'id' | 'email' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error?: any }> => { /* ... */ const {user} = await getValidSessionOrThrow(); setLoadingState('updateProfile', true); try {const {error} = await supabase.from('clients').update(profileData).eq('id', user.id); if(error) throw error; await refreshData('userProfile'); return {success:true};} catch(e:any){return {success:false, error:e};} finally {setLoadingState('updateProfile', false);}}, [supabase, refreshData, setLoadingState]);
  const updateUserPreferencesImpl = useCallback(async (preferencesData: Partial<Omit<UserPreferencesData, 'client_id' | 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error?: any }> => { /* ... */ const {user} = await getValidSessionOrThrow(); setLoadingState('updatePrefs', true); try {const upsertData = {...preferencesData, client_id: user.id}; const {error} = await supabase.from('user_settings').upsert(upsertData, {onConflict: 'client_id'}); if(error) throw error; await refreshData('currentUserPreferences'); return {success:true};} catch(e:any){return {success:false, error:e};} finally {setLoadingState('updatePrefs', false);}}, [supabase, refreshData, setLoadingState]);
  const markNotificationReadImpl = useCallback(async (notificationId: string): Promise<void> => { /* ... */ const {user} = await getValidSessionOrThrow(); setLoadingState(`notifRead_${notificationId}`, true); try {await supabase.from('notifications').update({read:true}).eq('id',notificationId).eq('user_id',user.id); await refreshData('notifications');} catch(e){console.error(e);} finally {setLoadingState(`notifRead_${notificationId}`, false);}}, [supabase, refreshData, setLoadingState]);
  const markAllNotificationsReadImpl = useCallback(async (): Promise<void> => { /* ... */ const {user} = await getValidSessionOrThrow(); setLoadingState('notifReadAll', true); try {await supabase.from('notifications').update({read:true}).eq('user_id',user.id).eq('read',false); await refreshData('notifications');} catch(e){console.error(e);} finally {setLoadingState('notifReadAll', false);}}, [supabase, refreshData, setLoadingState]);
  
  const generateScriptHandler = useCallback(async (siteId: string): Promise<GenerateScriptResponse> => {
    await getValidSessionOrThrow(); // Garante autenticação
    const site = state.sites.find(s => s.id === siteId);
    if (!site || !site.optimization_token) {
      return { success: false, message: 'Site ou token de otimização não encontrado.' };
    }
    setLoadingState(`genScript_${siteId}`, true);
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase URL ou Anon Key não configuradas no ambiente.");

      const functionUrl = `${supabaseUrl}/functions/v1/flux-optimizer-script?site=${siteId}&token=${site.optimization_token}`;
      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData.data.session?.access_token;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao gerar script (${response.status}): ${errorText || response.statusText}`);
      }
      const scriptContent = await response.text();
      return { script: scriptContent, success: true };
    } catch (e: any) {
      console.error('[generateScriptHandler] Error:', e);
      return { success: false, message: e.message };
    } finally {
      setLoadingState(`genScript_${siteId}`, false);
    }
  }, [state.sites, supabase, setLoadingState]);

  const addSiteHandler = useCallback(async (siteData: Omit<CreateSitePayload, 'client_id' | 'timestamp'>): Promise<CreateSiteResponse | { success: false; error: any; data?: null }> => {
    await getValidSessionOrThrow(); // client_id é obtido pela EF a partir do usuário autenticado
    setLoadingState('addSite', true);
    try {
      // O payload para a EF não deve incluir client_id ou timestamp, pois a EF os gerencia.
      const payloadForEF: CreateSitePayload = { ...siteData }; 
      const { data, error } = await supabase.functions.invoke<CreateSiteResponse>('create-site', { body: payloadForEF });
      
      if (error) throw error;
      if (!data) throw new Error('Nenhuma resposta da função create-site.');
      
      await refreshData('sites'); // Atualiza a lista de sites
      // A interface CreateSiteResponse já foi ajustada para ter success, message, data, error
      return data; 
    } catch (e: any) {
      console.error('[addSiteHandler] Error:', e);
      return { success: false, error: { message: e.message, details: e }, data: null };
    } finally {
      setLoadingState('addSite', false);
    }
  }, [supabase, refreshData, setLoadingState]);

  const updateSiteHandler = useCallback(async (siteId: string, updates: Partial<Site>): Promise<{success: boolean, error?: any, data?: Site | null}> => { const {user} = await getValidSessionOrThrow(); setLoadingState(`updateSite_${siteId}`, true); try { const {data, error} = await supabase.from('sites').update(updates).eq('id', siteId).eq('client_id', user.id).select().single(); if(error) throw error; await refreshData('sites'); return {success:true, data}; } catch(e:any){return {success:false, error:e};} finally {setLoadingState(`updateSite_${siteId}`, false);}}, [supabase, refreshData, setLoadingState]);

  // Removido setupSubscriptionsCallback e refreshDataAndActivity das dependências do useEffect principal,
  // pois refreshData e setupSubscriptions já estão estáveis devido ao useCallback e userId.
  // O useEffect principal agora só depende de userId, refreshData, setupSubscriptions, updateState
  useEffect(() => {
    if (userId) {
      refreshData('all'); 
      setupSubscriptions(); 
    } else {
      updateState({ userProfile: null, currentUserPreferences: null, sites: [], analyses:[], notifications:[], recentActivityFeed:[], optimizationTasks:[], metrics:null, rateLimits:[] });
      fluxCache.invalidate();
       subscriptionsRef.current.forEach((channel: any) => { // Tipado 'channel' como any
        if (channel && typeof channel.unsubscribe === 'function') {
            supabase.removeChannel(channel);
        }
      });
      subscriptionsRef.current = [];
    }
    // Cleanup subscriptions no unmount do hook (raro, mas bom ter) ou mudança de usuário
    return () => {
      subscriptionsRef.current.forEach((channel: any) => { // Tipado 'channel' como any
        if (channel && typeof channel.unsubscribe === 'function') {
          supabase.removeChannel(channel);
        }
      });
      subscriptionsRef.current = [];
    };
  }, [userId, refreshData, setupSubscriptions, updateState, fluxCache]); // Adicionado fluxCache à lista de dependências


  return {
    ...state,
    isLoading,
    refreshData: refreshData, // Expor a versão granular
    generateScript: generateScriptHandler,
    addSite: addSiteHandler,
    updateSite: updateSiteHandler,
    clearFluxCache: useCallback(() => fluxCache.invalidate(), []),
    getFluxCacheStats: useCallback(() => fluxCache.getStats(), []),
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

// Hooks especializados
export function useTrialStatus(): { data: TrialStatusData | null; loading: boolean; error: string | null; refreshTrialStatus: () => void } { 
    const { userProfile, isLoading: isFluxDataLoading, refreshData } = useFluxData(); // Ajustado para usar isLoading
    const [trialData, setTrialData] = useState<TrialStatusData | null>(null);
    const [isCalculating, setIsCalculating] = useState(false); // Loading local para cálculo

    const calculateTrialStatus = useCallback(() => {
        if (userProfile) {
            setIsCalculating(true);
            const { plan, subscription_status, trial_start_date, trial_end_date, company, id, name } = userProfile;
            const now = new Date();
            const trialEnd = trial_end_date ? new Date(trial_end_date) : null;
            let timeDiff = 0;
            let daysRemaining = 0;
            if (trialEnd) {
                timeDiff = trialEnd.getTime() - now.getTime();
                daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            }
            const status: TrialStatusData = {
                plan: plan || 'free',
                subscription_status: subscription_status || (plan === 'trial' ? 'trialing' : 'unknown'),
                trial_active: plan === 'trial' && !!trialEnd && now < trialEnd,
                trial_expired: plan === 'trial' && !!trialEnd && now >= trialEnd,
                days_remaining: trialEnd ? Math.max(0, daysRemaining) : 0,
                hours_remaining: trialEnd ? Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60))) : 0,
                trial_end_date: trial_end_date || null, // Garantir null se undefined
                trial_start_date: trial_start_date || null, // Garantir null se undefined
                company: company || name || undefined, // Usar company ou name
                user_id: id,
                checked_at: new Date().toISOString(),
            };
            setTrialData(status);
            setIsCalculating(false);
        } else {
            setTrialData(null);
        }
    }, [userProfile]);

    useEffect(() => {
        calculateTrialStatus();
    }, [calculateTrialStatus]);
    
    const refreshTrialStatus = useCallback(() => {
        refreshData('userProfile'); 
    }, [refreshData]);

    return { 
        data: trialData, 
        loading: isCalculating || isFluxDataLoading('coreUser'), // Combina loading local e do hook principal
        error: null, // Erro não está sendo tratado aqui, poderia vir do useFluxData se necessário
        refreshTrialStatus 
    };
}

export function useMetrics(siteId?: string): { data: MetricsData | null; loading: boolean; error: string | null; refreshMetrics: () => void } { 
    const { metrics, isLoading: isFluxDataLoading, refreshData, sites } = useFluxData(); // Ajustado para usar isLoading
    
    // Se um siteId for fornecido, idealmente filtraríamos as métricas para esse site.
    // Atualmente, 'metrics' no estado global é apenas a última métrica geral.
    // Para uma implementação futura: metrics poderia ser um objeto/Map { [siteId: string]: MetricsData }
    // ou uma função para buscar métricas específicas seria adicionada a useFluxData.
    
    const siteSpecificMetrics = useMemo(() => {
        if (siteId && metrics && metrics.site_id === siteId) {
            return metrics;
        }
        if (!siteId && metrics) { // Se nenhum siteId, retorna a métrica geral (se houver)
            return metrics;
        }
        // Se um siteId é fornecido mas não corresponde, ou nenhuma métrica geral, retorna null.
        // Ou, se 'metrics' fosse um array de todas as métricas recentes, poderíamos encontrar por siteId.
        return null; 
    }, [siteId, metrics]);


    const refreshMetrics = useCallback(() => {
        // Se siteId for fornecido, idealmente chamaríamos um refresh específico para esse site.
        // Por enquanto, refresca o bloco de dados que inclui métricas.
        refreshData('sites'); 
    }, [refreshData]);

    return { 
        data: siteSpecificMetrics, 
        loading: isFluxDataLoading('sitesAnalyses'), 
        error: null, // Erro não está sendo tratado aqui
        refreshMetrics 
    };
}

export function useAnalyzeAdSense() { // Este hook parece ser mais um executor de EF do que um consumidor de dados do useFluxData
  const { invokeAnalyzeAdSense, isLoading: isFluxDataLoading } = useFluxData(); 
  const [data, setData] = useState<AnalyzeAdSenseResponse | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCSV = useCallback(async (
    payloadData: Omit<AnalyzeAdSensePayload, 'client_id' | 'timestamp'> & { client_id: string } 
  ) => {
    setLoading(true);
    setError(null);
    try {
      const fullPayload: AnalyzeAdSensePayload = {
        ...payloadData,
        timestamp: new Date().toISOString(),
      };
      const result = await invokeAnalyzeAdSense(fullPayload); 
      setData(result);
      if (result.success) {
        // refreshData já é chamado dentro de invokeAnalyzeAdSenseImpl
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
  }, [invokeAnalyzeAdSense]);

  return { data, loading, error, analyzeCSV };
}

export default useFluxData;
