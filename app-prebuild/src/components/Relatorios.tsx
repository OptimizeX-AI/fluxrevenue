// src/components/Relatorios.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import './Relatorios.css'

// ✅ CORREÇÃO: Interfaces com arrays adequadamente tipados
interface Analysis {
  id: string
  created_at: string
  analysis_results: any
  sites: Array<{ url: string }> // ✅ Array de objetos com url
}

interface ReportMetrics {
  totalAnalyses: number
  averageGain: number
  topOptimization: string
}

interface OptimizationType {
  name: string
  gain: number
  analysesCount: number
}

const Relatorios: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [optimizations, setOptimizations] = useState<OptimizationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchReportData = async () => {
      try {
        setLoading(true)
        
        // Buscar análises
        const { data: analyses, error: analysesError } = await supabase
          .from('adsense_analyses')
          .select(`
            id,
            created_at,
            analysis_results,
            sites (url)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (analysesError) throw analysesError

        // ✅ CORREÇÃO: Garantir que os dados correspondam à interface Analysis
        const formattedAnalyses: Analysis[] = (analyses || []).map(analysis => ({
          id: analysis.id,
          created_at: analysis.created_at,
          analysis_results: analysis.analysis_results,
          sites: Array.isArray(analysis.sites) 
            ? analysis.sites 
            : []
        }))

        setAnalyses(formattedAnalyses)

        // Calcular métricas
        if (formattedAnalyses.length > 0) {
          const totalAnalyses = formattedAnalyses.length
          const gains = formattedAnalyses
            .map(a => a.analysis_results?.estimated_gain || 0)
            .filter(gain => gain > 0)
          
          const averageGain = gains.length > 0 
            ? gains.reduce((sum, gain) => sum + gain, 0) / gains.length 
            : 0

          setMetrics({
            totalAnalyses,
            averageGain,
            topOptimization: 'Ad Placement Optimization'
          })

          // Mock data para tipos de otimização
          setOptimizations([
            { name: 'Ad Placement', gain: 1250.50, analysesCount: 15 },
            { name: 'Ad Size Optimization', gain: 980.25, analysesCount: 12 },
            { name: 'Color Scheme', gain: 750.80, analysesCount: 8 }
          ])
        }

      } catch (error) {
        console.error('Erro ao carregar relatórios:', error)
        setError('Erro ao carregar dados dos relatórios')
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [isAuthenticated, user?.id])

  if (!isAuthenticated) {
    return (
      <div className="relatorios-container">
        <div className="access-denied">
          <h2>Acesso Negado</h2>
          <p>Você precisa estar logado para acessar os Relatórios.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relatorios-container">
        <LoadingSpinner message="Carregando relatórios..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="relatorios-container">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    )
  }

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <h1>Relatórios</h1>
        <p>Analise o impacto das otimizações na sua receita AdSense.</p>
      </div>

      <div className="relatorios-content">
        {metrics && (
          <section className="metrics-summary">
            <h2>Resumo das Métricas</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total de Análises</h3>
                <div className="metric-value">{metrics.totalAnalyses}</div>
              </div>
              
              <div className="metric-card">
                <h3>Ganho Médio</h3>
                <div className="metric-value">{formatCurrency(metrics.averageGain)}</div>
              </div>
              
              <div className="metric-card">
                <h3>Top Otimização</h3>
                <div className="metric-value">{metrics.topOptimization}</div>
              </div>
            </div>
          </section>
        )}

        <section className="optimizations-table">
          <h2>Tipos de Otimização</h2>
          
          {optimizations.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo de Otimização</th>
                    <th>Ganho Estimado</th>
                    <th>Nº de Análises</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizations.map((optimization, index) => (
                    <tr key={index}>
                      <td>{optimization.name}</td>
                      <td>{formatCurrency(optimization.gain)}</td>
                      <td>{optimization.analysesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>Tente ajustar os filtros ou execute uma análise primeiro.</p>
            </div>
          )}
        </section>

        <section className="recent-analyses">
          <h2>Análises Recentes</h2>
          
          {analyses.length > 0 ? (
            <div className="analyses-list">
              {analyses.map(analysis => (
                <div key={analysis.id} className="analysis-item">
                  <div className="analysis-header">
                    <div className="analysis-date">
                      Análise realizada em {formatDate(new Date(analysis.created_at))}
                    </div>
                    
                    <div className="analysis-sites">
                      <strong>Sites:</strong>
                      {analysis.sites.map((site, index) => (
                        <span key={index} className="site-tag">
                          {site.url}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {analysis.analysis_results && (
                    <div className="analysis-results">
                      <div className="result-item">
                        <span className="result-label">Ganho estimado:</span>
                        <span className="result-value positive">
                          {formatCurrency(analysis.analysis_results.estimated_gain || 0)}
                        </span>
                      </div>
                      
                      {analysis.analysis_results.recommendations && (
                        <div className="recommendations">
                          <span className="result-label">Recomendações:</span>
                          <ul>
                            {analysis.analysis_results.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma análise encontrada. Execute uma análise primeiro.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Relatorios
