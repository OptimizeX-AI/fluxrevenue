// src/components/Dashboard/RecentAnalyses.tsx
import React from 'react'
import { useFluxData } from '../../hooks/useFluxData'
import LoadingSpinner from '../LoadingSpinner'
import './RecentAnalyses.css'

interface Analysis {
  id: string
  site_url: string
  created_at: string
  revenue_potential: number
  optimization_score: number
  status: 'completed' | 'processing' | 'failed'
}

const RecentAnalyses: React.FC = () => {
  const { analyses, loading, error } = useFluxData()

  if (loading) {
    return (
      <div className="recent-analyses">
        <h3>Análises Recentes</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="recent-analyses">
        <h3>Análises Recentes</h3>
        <div className="error-state">
          <p>Erro ao carregar análises</p>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="recent-analyses">
        <h3>Análises Recentes</h3>
        <div className="empty-state">
          <p>Nenhuma análise encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-analyses">
      <h3>Análises Recentes</h3>
      <div className="analyses-list">
        {analyses.map((analysis: Analysis) => (
          <div key={analysis.id} className="analysis-item">
            <div className="analysis-header">
              <span className="analysis-date">
                {analysis.created_at
                  ? new Date(analysis.created_at).toLocaleDateString('pt-BR')
                  : '—'}
              </span>
              <span className={`status ${analysis.status}`}>
                {analysis.status === 'completed'
                  ? '✅ Concluída'
                  : analysis.status === 'processing'
                  ? '⏳ Processando'
                  : '❌ Falhou'}
              </span>
            </div>
            <div className="analysis-meta">
              <span className="site-url">{analysis.site_url || '—'}</span>
              <span className="potential-revenue">
                Potencial: {typeof analysis.revenue_potential === 'number'
                  ? analysis.revenue_potential.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '—'}
              </span>
              <span className="optimization-score">
                Score: {typeof analysis.optimization_score === 'number'
                  ? analysis.optimization_score.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                  : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentAnalyses
