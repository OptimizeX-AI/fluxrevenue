// src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useFluxData'
import MetricsCard from './MetricsCard'
import { DashboardData, Site, MetricsData } from '../../types/interfaces'
import TrialBanner from './TrialBanner'
import RecentAnalyses from './RecentAnalyses'
import SitesOverview from './SitesOverview'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { data: trialData, loading: trialLoading, error: trialError } = useTrialStatus()
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(true)
  const [sitesError, setSitesError] = useState(null)  
  const firstSite = sites && sites.length > 0 ? sites[0] : null
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  
useEffect(() => {
    if (!user?.id) return

    const fetchSites = async () => {
      try {
        setSitesLoading(true)
        
        const { data: sitesData, error } = await supabase
          .from('sites')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setSites(sitesData || [])
        setSitesError(null)
        
      } catch (err) {
        console.error('Erro ao buscar sites:', err)
      } finally {
        setSitesLoading(false)
      }
    }

    fetchSites()
  }, [user?.id])

  // Buscar métricas quando tiver site
  useEffect(() => {
    if (!firstSite?.id) return

    const fetchMetrics = async () => {
      try {
        const { data: metrics, error } = await supabase
          .from('metrics')
          .select('*')
          .eq('site_id', firstSite.id)
          .order('timestamp', { ascending: false })
          .limit(1)

        if (error) throw error
        
        if (metrics && metrics[0]) {
          const mappedMetrics: MetricsData = {
  total_revenue: metrics[0].revenue || 0,
  revenue_change_percent: 0, // ou calcule se tiver histórico
  active_optimizations: 1,   // ou calcule se tiver lógica
  optimization_change_percent: 0,
  last_analysis_date: metrics[0].timestamp || new Date().toISOString()
}
setMetricsData(mappedMetrics)
        }
      } catch (err) {
        console.error('Erro ao buscar métricas:', err)
      }
    }

    fetchMetrics()
  }, [firstSite?.id])

  // Processar dados das Edge Functions
  useEffect(() => {
    if (trialData && metricsData) {
      const processedData: DashboardData = {
        totalRevenue: metricsData.total_revenue || 0,
        revenueChange: metricsData.revenue_change_percent || 0,
        activeOptimizations: metricsData.active_optimizations || 0,
        optimizationChange: metricsData.optimization_change_percent || 0,
        lastAnalysis: metricsData.last_analysis_date || 'Nunca',
        trialDaysLeft: trialData.days_remaining
      }
      setDashboardData(processedData)
    }
  }, [trialData, metricsData])

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>Acesso negado</h2>
          <p>Você precisa estar logado para acessar o Dashboard.</p>
        </div>
      </div>
    )
  }

  if (trialLoading || sitesLoading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="Carregando dashboard..." />
      </div>
    )
  }

  if (trialError ) {
    const errorMessage = trialError || 'Erro desconhecido'
    return (
      <div className="dashboard-container">
        <ErrorMessage 
          message={errorMessage} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bem-vindo, {user?.user_metadata?.full_name || user?.email}</p>
      </div>

      {dashboardData?.trialDaysLeft && dashboardData.trialDaysLeft > 0 && (
        <TrialBanner daysLeft={dashboardData.trialDaysLeft} />
      )}

      <div className="dashboard-content">
        <section className="metrics-section">
          <h2>Métricas Principais</h2>
          <div className="metrics-grid">
            <MetricsCard
              title="Receita Total"
              value={dashboardData?.totalRevenue || 0}
              format="currency"
              trend={dashboardData?.revenueChange 
                ? (dashboardData.revenueChange > 0 ? 'up' : 'down')
                : 'stable'
              }
              icon="💰"
              subtitle={`${dashboardData?.revenueChange?.toFixed(1) || '0'}% este mês`}
            />
            
            <MetricsCard
              title="Otimizações Ativas"
              value={dashboardData?.activeOptimizations || 0}
              format="number"
              trend={dashboardData?.optimizationChange 
                ? (dashboardData.optimizationChange > 0 ? 'up' : 'down')
                : 'stable'
              }
              icon="⚡"
              subtitle={`${dashboardData?.optimizationChange?.toFixed(1) || '0'}% este mês`}
            />
          </div>
        </section>

        <div className="dashboard-sections">
          <RecentAnalyses />
          <SitesOverview />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
