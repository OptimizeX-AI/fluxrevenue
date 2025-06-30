// src/components/Dashboard/SitesOverview.tsx
import React from 'react'
import { useFluxData } from '../../hooks/useFluxData'
import LoadingSpinner from '../LoadingSpinner'
import './SitesOverview.css'

// ✅ CORREÇÃO: Interface Site padronizada - optimization_status opcional
interface Site {
  id: string
  url: string
  last_analysis?: string
  optimization_status?: 'active' | 'pending' | 'inactive'
  revenue_increase?: number
}

const SitesOverview: React.FC = () => {
  const { sites, loading, error } = useFluxData()

  if (loading) {
    return (
      <div className="sites-overview">
        <h3>Sites Monitorados</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="sites-overview">
        <h3>Sites Monitorados</h3>
        <div className="error-state">
          <p>Erro ao carregar sites</p>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!sites || sites.length === 0) {
    return (
      <div className="sites-overview">
        <h3>Sites Monitorados</h3>
        <div className="empty-state">
          <p>Nenhum site adicionado ainda</p>
          <button className="add-site-btn">
            Adicionar Site
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#30D158'
      case 'pending': return '#FF9500'
      case 'inactive': return '#FF3B30'
      default: return '#8E8E93'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'pending': return 'Pendente'
      case 'inactive': return 'Inativo'
      default: return 'Não definido'
    }
  }

  return (
    <div className="sites-overview">
      <div className="sites-header">
        <h3>Sites Monitorados</h3>
        <button className="add-site-btn">
          + Adicionar Site
        </button>
      </div>
      
      <div className="sites-list">
        {/* ✅ CORREÇÃO: Garantir que optimization_status seja tratado adequadamente */}
        {sites.map((site: Site) => (
          <div key={site.id} className="site-item">
            <div className="site-info">
              <div className="site-url">{site.url}</div>
              <div className="site-meta">
                <span className="last-analysis">
                  Última análise: {formatDate(site.last_analysis)}
                </span>
                <span 
                  className="optimization-status"
                  style={{ color: getStatusColor(site.optimization_status) }}
                >
                  {getStatusText(site.optimization_status)}
                </span>
              </div>
            </div>
            
            <div className="site-metrics">
              {site.revenue_increase !== undefined && (
                <div className="revenue-increase">
                  <span className="metric-label">Aumento de receita:</span>
                  <span className={`metric-value ${site.revenue_increase >= 0 ? 'positive' : 'negative'}`}>
                    {site.revenue_increase >= 0 ? '+' : ''}{site.revenue_increase.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="site-actions">
              <button className="action-btn primary">
                Analisar
              </button>
              <button className="action-btn secondary">
                Configurar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SitesOverview
