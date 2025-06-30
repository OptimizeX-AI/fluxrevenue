// src/hooks/useFluxData.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { TrialStatusData } from '../types/interfaces';
import { MetricsData } from '../types/interfaces';

// Interfaces principais
interface Site {
  id: string
  url: string
  user_id: string
  created_at: string
  last_analysis?: string
  optimization_status?: 'active' | 'pending' | 'inactive'
  revenue_increase?: number
}

interface Analysis {
  id: string
  site_url: string
  created_at: string
  revenue_potential: number
  optimization_score: number
  status: 'completed' | 'processing' | 'failed'
  csv_data?: string
  analysis_results?: any
}

interface UserSettings {
  id: string
  client_id: string
  notifications_enabled: boolean
  auto_optimization: boolean
  report_frequency: 'daily' | 'weekly' | 'monthly'
}

// Interface principal do hook
interface FluxDataReturn {
  // Data
  metrics: MetricsData | null
  analyses: Analysis[]
  sites: Site[]
  userSettings: UserSettings | null
  
  // States
  loading: boolean
  error: string | null
  
  // Methods
  refreshData: () => Promise<void>
  uploadAndAnalyze: (csvData: string, siteUrl: string) => Promise<any>
  generateScript: (siteId: string) => Promise<string>
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>
  addSite: (url: string) => Promise<void>
  updateSite: (siteId: string, updates: Partial<Site>) => Promise<void>
}

export function useFluxData(): FluxDataReturn {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Buscar sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .eq('client_id', user.id)

      if (sitesError) throw sitesError
      setSites(sitesData || [])

      // Buscar análises
      const { data: analysesData, error: analysesError } = await supabase
        .from('adsense_analyses')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (analysesError) throw analysesError
      setAnalyses(analysesData || [])

      // Buscar configurações do usuário
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('client_id', user.id)
        .single()

      if (!settingsError && settingsData) {
        setUserSettings(settingsData)
      }

    } catch (err: any) {
      setError(err.message)
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const uploadAndAnalyze = useCallback(async (csvData: string, siteUrl: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase.functions.invoke('analyze-adsense', {
        body: {
          csv_data: csvData,
          site_url: siteUrl,
          user_id: user.id
        }
      })

      if (error) throw error

      await refreshData() // Refresh data after analysis
      return data

    } catch (err: any) {
      throw new Error(err.message)
    }
  }, [user, refreshData])

  const generateScript = useCallback(async (siteId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase.functions.invoke('flux-optimizer-script', {
        body: {
          site_id: siteId,
          user_id: user.id
        }
      })

      if (error) throw error
      return data.script || ''

    } catch (err: any) {
      throw new Error(err.message)
    }
  }, [user])

  const updateUserSettings = useCallback(async (settings: Partial<UserSettings>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single()

      if (error) throw error
      setUserSettings(data)

    } catch (err: any) {
      throw new Error(err.message)
    }
  }, [user])

  const addSite = useCallback(async (url: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase.functions.invoke('create-site', {
        body: {
          url,
          user_id: user.id
        }
      })

      if (error) throw error
      await refreshData()

    } catch (err: any) {
      throw new Error(err.message)
    }
  }, [user, refreshData])

  const updateSite = useCallback(async (siteId: string, updates: Partial<Site>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('sites')
        .update(updates)
        .eq('id', siteId)
        .eq('client_id', user.id)

      if (error) throw error
      await refreshData()

    } catch (err: any) {
      throw new Error(err.message)
    }
  }, [user, refreshData])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    metrics,
    analyses,
    sites,
    userSettings,
    loading,
    error,
    refreshData,
    uploadAndAnalyze,
    generateScript,
    updateUserSettings,
    addSite,
    updateSite
  }
}

// Hooks especializados para compatibilidade
export function useTrialStatus() {
  const { user } = useAuth()
  // ✅ CORREÇÃO: Definir tipo explícito para useState
  const [data, setData] = useState<TrialStatusData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchStatus = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          throw new Error('Usuário não autenticado')
        }

        const { data: responseData, error: responseError } = await supabase.functions.invoke('check-trial-status', {
          body: { 
            client_id: user.id,
            action: 'get_trial_status'
          },
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (responseError) throw responseError
        
        // ✅ CORREÇÃO: TypeScript agora sabe que data é TrialStatusData | null
        setData(responseData as TrialStatusData)
        
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching trial status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [user])

  // ✅ CORREÇÃO: Return tipado adequadamente
  return { 
    data, 
    loading, 
    error 
  } as {
    data: TrialStatusData | null;
    loading: boolean;
    error: string | null;
  }
  }
 export function useMetrics(siteId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !siteId) return;

    const fetchMetrics = async () => {
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
        setData(metricsData && metricsData[0] ? metricsData[0] as MetricsData : null);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, siteId]);

  return {
    data,
    loading,
    error
  } as {
    data: MetricsData | null;  // ✅ CORREÇÃO: MetricsData com M maiúsculo
    loading: boolean;
    error: string | null;
  };
}
 
export function useAnalyzeAdSense() {
  const { uploadAndAnalyze } = useFluxData()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeCSV = useCallback(async (csvData: string, siteUrl: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await uploadAndAnalyze(csvData, siteUrl)
      setData(result)
      return result

    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [uploadAndAnalyze])

  return { 
    data, 
    loading, 
    error, 
    analyzeCSV,
    analyze: uploadAndAnalyze // Alias para compatibilidade
  }
}
